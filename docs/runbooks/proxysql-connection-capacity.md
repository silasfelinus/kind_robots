# ProxySQL connection-capacity runbook

This runbook diagnoses a saturated Kind Robots database path without changing
configuration or exposing credentials.

## Architecture

Production traffic follows this path:

```text
Vercel -> Alexandria host :5544 -> ProxySQL :6033 -> mariadb-kindrobots2 :3306
```

The last recorded healthy ProxySQL configuration used hostgroup `10`, with the
MariaDB server row capped at `max_connections = 40`. ProxySQL's `kindrobot`
frontend/backend rows allowed up to `200` frontend sessions. Those numbers serve
different purposes:

- frontend sessions are application connections to ProxySQL;
- backend sessions are ProxySQL connections to MariaDB;
- many frontend requests should share a smaller backend pool when multiplexing
  is available;
- active transactions and session state pin a frontend session to one backend
  connection until that state clears.

A MariaDB `ER_USER_LIMIT_REACHED` error at 200 means the MariaDB account itself
has reached its backend/direct-session resource limit. Raising that number alone
can hide the cause while allowing the same leak or pinning pattern to grow.

## Capture the live census

Run from a current Kind Robots checkout on Alexandria:

```bash
bash scripts/proxysql-capacity-diagnostics.sh | tee /tmp/kindrobots-db-capacity.txt
```

The script is read-only. It discovers local container credentials without
printing them and reports only connection counts, source hosts, state, and
configuration values. Optional overrides are documented at the top of the
script.

Capture the output before restarting either database container. A restart clears
the most useful evidence.

## Interpret the output

### 1. Confirm the backend ceiling

Check `runtime_mysql_servers.max_connections` for hostgroup 10.

- `40` matches the last recorded configuration.
- A value near or above MariaDB's `kindrobot` limit means ProxySQL is allowed to
  consume all account capacity itself.
- Multiple ONLINE rows or hostgroups using the same MariaDB user multiply the
  possible backend count.

### 2. Identify who owns the MariaDB sessions

The MariaDB source-host summary separates ProxySQL traffic from direct clients.

- One Docker-network source matching the ProxySQL container means ProxySQL owns
  those sessions.
- Other source hosts reveal services, scripts, development processes, previews,
  CI jobs, or migration clients bypassing ProxySQL while sharing `kindrobot`.
- A separate migration account should not appear under `kindrobot` at all.

### 3. Compare `ConnUsed` and `ConnFree`

In `stats_mysql_connection_pool`:

- high `ConnUsed` means real concurrent or pinned work;
- high `ConnFree` with low `ConnUsed` means ProxySQL is retaining idle backend
  sessions;
- `MaxConnUsed` shows the historical peak since ProxySQL started or stats were
  reset;
- rising `ConnERR` suggests backend connection churn or a server reachability
  problem rather than ordinary application load.

### 4. Check multiplexing blockers

The frontend-session summary groups `transaction_found` and
`multiplex_disabled`.

- many transaction-pinned sessions point to requests that opened transactions
  and did not finish promptly;
- many multiplex-disabled sessions point to connection state that prevents
  ProxySQL from returning the backend connection to its shared pool;
- mostly sleeping frontend sessions with few backend `ConnUsed` entries are not
  themselves a database-capacity problem unless ProxySQL retains matching free
  backends.

### 5. Check MariaDB transactions

The final section lists open InnoDB transactions for `kindrobot`.

- rows with old `trx_started` values are strong leak candidates;
- no rows plus 200 sleeping sessions points toward idle retention or direct
  clients rather than unfinished transactions.

## Immediate recovery, after evidence is captured

Choose recovery from the census rather than applying every option:

- ProxySQL owns nearly all sleeping sessions: restart only the `proxysql`
  container to release its frontend/backend pools, then verify MariaDB session
  counts fall before retrying a deployment.
- Direct source hosts dominate: stop or reconfigure those clients; restarting
  ProxySQL will not release their MariaDB sessions.
- Old open transactions dominate: stop the owning client or function source and
  clear those sessions deliberately.
- Hostgroup max exceeds the intended cap: restore the reviewed ProxySQL server
  limit, load it to runtime, and save it to disk.

Do not make MariaDB's limit unlimited as the first response. ProxySQL should
bound backend concurrency, while frontend concurrency and request throughput can
be substantially higher through multiplexing.

## Durable topology

The desired steady state is:

1. one Prisma/MariaDB connector pool per warm Vercel runtime;
2. MariaDB command pipelining disabled on the ProxySQL path;
3. ProxySQL hostgroup backend capacity below the MariaDB runtime-user limit;
4. a separate `kindrobot_migrate` account and `MIGRATION_DATABASE_URL`, so a
   deployment cannot consume or be blocked by runtime connection capacity;
5. no local scripts, workers, previews, or CI jobs bypassing ProxySQL with the
   shared runtime account;
6. recorded steady-state values for frontend sessions, `ConnUsed`, `ConnFree`,
   and `MaxConnUsed` during ordinary traffic and an art-gallery burst.

Only after those measurements should the Vercel per-runtime pool size or
ProxySQL backend cap be tuned upward. Throughput is not equal to connection
count; a healthy proxy serves many interactions over a bounded backend pool.
