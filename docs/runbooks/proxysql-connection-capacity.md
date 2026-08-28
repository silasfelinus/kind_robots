# ProxySQL connection-capacity runbook

This runbook diagnoses the Alexandria Kind Robots database path without changing configuration or exposing credentials.

## Current topology

Kind Robots uses two ProxySQL lanes:

```text
Application runtime
  DATABASE_URL -> kindrobot -> ProxySQL hostgroup 10 -> mariadb-kindrobots2

Explicit migration operation
  MIGRATION_DATABASE_URL -> kindrobot_migrate -> ProxySQL hostgroup 30 -> mariadb-kindrobots2
```

Hostgroup 10 is the ordinary production application lane. Hostgroup 30 is the deliberately separate schema-migration lane.

There is no standing Preview or coding-agent database lane. The former Vercel Preview hostgroup 20 and coding-agent hostgroup 40 were decommissioned on 2026-08-27 after both remained unused. Coding agents make ordinary application-data changes through the authenticated Kind Robots API. Direct database administration and migrations remain an explicit human-operated boundary.

Alexandria / Unraid hosts ProxySQL and MariaDB:

```text
Application client
  -> Alexandria host :5544
  -> ProxySQL :6033
  -> mariadb-kindrobots2 :3306
```

## Verified post-recovery baseline: 2026-08-27

After the August drive failure and subsequent drive-cable/temperature incidents were resolved, a fresh census established a clean post-recovery baseline:

- HG10 `kindrobot`: `ONLINE`, backend max 40, `ConnOK = 102`, `ConnERR = 0`, `MaxConnUsed = 12`, more than 237k queries served;
- HG30 `kindrobot_migrate`: `ONLINE`, backend max 4, `ConnOK = 2`, `ConnERR = 0`, migrations successfully applied through the isolated identity;
- `Access_Denied_Max_Connections = 0`;
- `Access_Denied_Max_User_Connections = 0`;
- `Active_Transactions = 0`;
- MariaDB `Max_used_connections = 24 / 100` and `Connection_errors_max_connections = 0`;
- the retired HG20 and HG40 rows and their MariaDB/ProxySQL users were removed after a local configuration snapshot was saved.

This supersedes the 2026-08-21 HG10 `ConnOK 183 / ConnERR 78` snapshot. Those older cumulative errors overlapped real hardware outages and are not evidence of a current ProxySQL fault.

## Capture ProxySQL and MariaDB state

Run on Alexandria from the current Kind Robots checkout:

```bash
bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /tmp/kindrobots-db-capacity.txt
```

The script reports:

- ProxySQL backend hostgroup state and limits;
- frontend user counts and limits;
- backend `ConnUsed`, `ConnFree`, `ConnOK`, `ConnERR`, `MaxConnUsed`, and query counts;
- connection-denial and active-transaction counters;
- frontend sessions grouped by client source;
- MariaDB account/global ceilings and sessions grouped by source host;
- open InnoDB transactions.

It is read-only. It does not kill sessions, change runtime configuration, restart containers, print passwords, or print query text.

To inspect the migration identity specifically:

```bash
APP_DB_USER=kindrobot_migrate bash scripts/proxysql-capacity-diagnostics.sh
```

Capture the output before restarting clients, ProxySQL, or MariaDB when investigating an incident. Restarts erase cumulative counters and source/session-age evidence.

## Interpret the output

### ProxySQL frontend limit

`stats_mysql_users.frontend_connections` is the number of live client sessions for a ProxySQL user. When it equals `frontend_max_connections`, ProxySQL cannot accept another session for that user even if MariaDB still has capacity.

The `cli_host` grouping identifies who holds those sessions. Many sessions with no attached backend are idle frontend sockets, not simultaneous MariaDB work.

### ProxySQL backend pool

For each backend row:

```text
ConnUsed + ConnFree <= runtime_mysql_servers.max_connections
```

A full backend pool does not imply every connection is running a query. Connections may be pinned or retained free in the pool.

`ConnERR` is cumulative since the relevant ProxySQL statistics reset. A non-zero value is not enough by itself to diagnose a live problem. Record a baseline after known infrastructure incidents, then check whether errors continue to accrue while `ConnOK` and normal workload counters advance.

### Denial counters

Watch both:

```text
Access_Denied_Max_Connections
Access_Denied_Max_User_Connections
```

A flat zero baseline under normal traffic is the desired state. If either begins climbing, correlate it with frontend-user counts, backend pool pressure, and MariaDB ceilings before changing limits.

### MariaDB source summary

MariaDB's `information_schema.PROCESSLIST` distinguishes:

- connections from the ProxySQL Docker/network source;
- direct bypass clients using MariaDB without ProxySQL;
- sleeping versus active sessions;
- old open transactions.

Unexpected direct bypass sessions are outside ProxySQL's hostgroup caps and should be investigated rather than accommodated by increasing capacity.

## Historical incident: 2026-08-04 frontend exhaustion

The original capacity incident established the distinction between ProxySQL frontend and backend limits:

- ProxySQL `kindrobot` frontend sessions reached 200 / 200;
- HG10 backend max remained 40;
- MariaDB itself was not holding 200 application sessions;
- ProxySQL was multiplexing many frontend clients over the bounded backend pool;
- repeated cloud runtime clients sharing the same application identity exhausted the frontend allowance.

The durable lesson is not to raise `kindrobot.max_connections` blindly. Identify the client source first and keep long-lived, migration, preview, CI, or automation workloads from accidentally sharing a connection budget when their deployment model actually requires isolation.

The retired Vercel/Preview and coding-agent lanes are historical examples, not current topology. Do not recreate them unless a future deployment has a real reachable client that needs a separately bounded direct database identity.

## The four-hour transaction timeouts are deliberate

A census shows both of these at `14400000` ms:

```text
mysql-max_transaction_time        14400000
mysql-max_transaction_idle_time   14400000
```

Four hours is intentional because long local art/video generation can legitimately hold work far beyond an ordinary web-request budget. A shorter global ceiling can turn legitimate generation into an unrelated-looking database failure.

A long ceiling is not evidence of a leak. Check `Active_Transactions` and identify the owning workload before treating a transaction as stuck. If a genuine leak needs bounding, prefer a lane- or workload-specific fix over reducing the global ceiling.

## Durable steady state

The intended steady state is deliberately small:

1. HG10 / `kindrobot` serves normal application traffic through a bounded ProxySQL backend pool;
2. HG30 / `kindrobot_migrate` is the only standing schema-changing identity and is used with explicit human intent;
3. coding agents use the authenticated application API for ordinary record changes rather than a direct database credential;
4. no Preview, CI, worker, or local service silently shares `kindrobot` unless it is intentionally part of the production application runtime;
5. MariaDB command pipelining remains disabled on the ProxySQL path;
6. steady-state frontend sessions, `ConnUsed`, `ConnFree`, `ConnOK`, `ConnERR`, denial counters, and `MaxConnUsed` are recorded after infrastructure incidents before drawing conclusions from cumulative counters.

Throughput is not equal to connection count. A healthy proxy serves many interactions over a bounded backend pool.
