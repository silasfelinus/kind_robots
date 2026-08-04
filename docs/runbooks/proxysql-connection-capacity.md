# ProxySQL connection-capacity runbook

This runbook diagnoses a saturated Kind Robots database path without changing
configuration or exposing credentials.

## Architecture

Kind Robots is **not** currently hosted on Alexandria. The production application
runtime is on the separate local Windows machine that also hosts Comfy and other
local services. Alexandria / Unraid hosts the database path:

```text
Local Windows Kind Robots host
  Node / Nuxt / Nitro process

        -> Alexandria host :5544
        -> ProxySQL :6033
        -> mariadb-kindrobots2 :3306
```

Vercel deployments exist for previews and build validation, but they are not the
host whose long-lived Kind Robots process must be counted during this incident.

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

## Capture both sides before restarting anything

The owner of the 200 sessions cannot be established from only one machine. Run
one census on the Windows application host and one on Alexandria.

### A. Application-host census on the local Windows machine

From the Kind Robots repository in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\database-client-connections.ps1 |
  Tee-Object -FilePath "$env:TEMP\kindrobots-db-clients.txt"
```

This reports:

- every TCP connection from the local machine to the `DATABASE_URL` host/port;
- owning PID, process name, parent PID, start time, and sanitized command line;
- every local Node/Nuxt process, including those with zero matching connections;
- connection totals per process.

It reads `DATABASE_URL` from the current environment or common repository `.env`
files and never prints its credentials.

### B. ProxySQL and MariaDB census on Alexandria

From a current Kind Robots checkout on Alexandria:

```bash
bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /tmp/kindrobots-db-capacity.txt
```

The script is read-only. It discovers local container credentials without
printing them and reports only connection counts, source hosts, state, and
configuration values. Optional overrides are documented at the top of the
script.

Capture both outputs before restarting Kind Robots, ProxySQL, or MariaDB. A
restart clears the most useful evidence.

## Interpret the output

### 1. Count local Kind Robots runtimes

On the Windows host:

- one intended Node process with roughly the configured pool size is normal;
- multiple Nuxt/Nitro processes can each own an independent connector pool;
- a single long-lived PID with far more than the configured limit suggests
  multiple live or retired clients inside that process;
- old `node.exe` processes pointing at earlier checkouts, preview servers, or
  development commands are separate clients even when they serve no traffic;
- other local applications connecting to the same endpoint must be counted too.

Because the app process is long-lived, an abandoned client pool can survive for
hours or days instead of disappearing with a serverless instance.

### 2. Confirm the ProxySQL backend ceiling

Check `runtime_mysql_servers.max_connections` for hostgroup 10.

- `40` matches the last recorded configuration.
- A value near or above MariaDB's `kindrobot` limit means ProxySQL is allowed to
  consume all account capacity itself.
- Multiple ONLINE rows or hostgroups using the same MariaDB user multiply the
  possible backend count.

### 3. Identify who owns the MariaDB sessions

The MariaDB source-host summary separates ProxySQL traffic from direct clients.

- one Docker-network source matching the ProxySQL container means ProxySQL owns
  those sessions;
- the local Windows machine should normally appear to ProxySQL as frontend
  traffic, not as a direct MariaDB backend source;
- other MariaDB source hosts reveal scripts, workers, previews, CI jobs, or
  services bypassing ProxySQL while sharing `kindrobot`;
- a separate migration account should not appear under `kindrobot` at all.

### 4. Compare `ConnUsed` and `ConnFree`

In `stats_mysql_connection_pool`:

- high `ConnUsed` means real concurrent or pinned work;
- high `ConnFree` with low `ConnUsed` means ProxySQL is retaining idle backend
  sessions;
- `MaxConnUsed` shows the historical peak since ProxySQL started or stats were
  reset;
- rising `ConnERR` suggests backend connection churn or a server reachability
  problem rather than ordinary application load.

### 5. Check multiplexing blockers

The frontend-session summary groups `transaction_found` and
`multiplex_disabled`.

- many transaction-pinned sessions point to requests that opened transactions
  and did not finish promptly;
- many multiplex-disabled sessions point to connection state that prevents
  ProxySQL from returning the backend connection to its shared pool;
- mostly sleeping frontend sessions with few backend `ConnUsed` entries are not
  themselves a database-capacity problem unless ProxySQL retains matching free
  backends.

### 6. Check MariaDB transactions

The final section lists open InnoDB transactions for `kindrobot`.

- rows with old `trx_started` values are strong leak candidates;
- no rows plus 200 sleeping sessions points toward idle retention or direct
  clients rather than unfinished transactions.

## Immediate recovery, after evidence is captured

Choose recovery from the census rather than applying every option:

- one local Node PID owns an excessive number of sockets: restart that Kind
  Robots process after saving its process and connection census;
- several old local Node processes own connections: stop only the stale
  processes, leaving the intended runtime running;
- ProxySQL owns nearly all sleeping backend sessions: restart only the
  `proxysql` container after recording its pool statistics;
- direct MariaDB source hosts dominate: stop or reconfigure those clients;
  restarting ProxySQL will not release their sessions;
- old open transactions dominate: stop the owning client or process and clear
  those sessions deliberately;
- hostgroup max exceeds the intended cap: restore the reviewed ProxySQL server
  limit, load it to runtime, and save it to disk.

Do not make MariaDB's limit unlimited as the first response. ProxySQL should
bound backend concurrency, while frontend concurrency and request throughput can
be substantially higher through multiplexing.

## Durable topology

The desired steady state is:

1. one Prisma/MariaDB connector pool per Kind Robots Node process;
2. one intended long-lived Kind Robots process on the local Windows host;
3. MariaDB command pipelining disabled on the ProxySQL path;
4. ProxySQL hostgroup backend capacity below the MariaDB runtime-user limit;
5. a separate `kindrobot_migrate` account and `MIGRATION_DATABASE_URL`, so a
   deployment cannot consume or be blocked by runtime connection capacity;
6. no local scripts, workers, previews, or CI jobs bypassing ProxySQL with the
   shared runtime account;
7. recorded steady-state values for local client sockets, frontend sessions,
   `ConnUsed`, `ConnFree`, and `MaxConnUsed` during ordinary traffic and an
   art-gallery burst.

Only after those measurements should the per-process pool size or ProxySQL
backend cap be tuned upward. Throughput is not equal to connection count; a
healthy proxy serves many interactions over a bounded backend pool.
