# ProxySQL connection-capacity runbook

This runbook diagnoses a saturated Kind Robots database path without changing
configuration or exposing credentials.

## Architecture

Kind Robots is **not** currently hosted on Alexandria. The application runtime is
on the separate local Windows machine that also hosts Comfy and other services.
Alexandria / Unraid hosts the database path:

```text
Local Windows application host
  Node / Nuxt / Nitro processes

        -> Alexandria host :5544
        -> ProxySQL :6033
        -> mariadb-kindrobots2 :3306
```

Vercel deployments exist for preview and build validation, but they are not the
intended long-lived Kind Robots runtime.

## First live census: 2026-08-04

The first two-host capture established:

- `SILAS-PC` had **zero** TCP connections to `100.89.251.10:5544`;
- no Kind Robots Node/Nuxt/Nitro process was running there at capture time;
- the five visible Node processes were PM2 and Serendipity Voice processes;
- ProxySQL reported `kindrobot` frontend connections at **200 / 200**;
- hostgroup 10 remained ONLINE with `max_connections = 40`;
- the backend pool had `ConnUsed = 38`, `ConnFree = 2`, and `MaxConnUsed = 40`;
- multiplexing was enabled and connection warming disabled.

This separates two capacity layers:

1. ProxySQL's `mysql_users.max_connections = 200` limits live **frontend** client
   sessions for `kindrobot`.
2. `runtime_mysql_servers.max_connections = 40` limits ProxySQL **backend**
   sessions to MariaDB for hostgroup 10.

The snapshot therefore makes the ProxySQL per-user frontend limit the leading
explanation for new connection failures. It does **not** establish that MariaDB
itself had 200 `kindrobot` backend sessions. The backend pool was bounded at 40.

Because `SILAS-PC` had no matching sockets, another client source currently owns
the 200 live ProxySQL sessions. The next Alexandria capture must group
`stats_mysql_processlist.cli_host` to identify that source.

## Capture both sides before restarting anything

### A. Application-host census on the local Windows machine

From the Kind Robots repository in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\database-client-connections.ps1 |
  Tee-Object -FilePath "$env:TEMP\kindrobots-db-clients.txt"
```

This reports:

- every TCP connection to the configured `DATABASE_URL` host and port;
- owning PID, parent PID, process start time, and sanitized command line;
- all local Node/Nuxt processes, including parallel or stale runtimes;
- connection totals per process.

It reads `DATABASE_URL` from the environment or common repository `.env` files
and never prints credentials.

### B. ProxySQL and MariaDB census on Alexandria

From a current copy of the script on Alexandria:

```bash
bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /tmp/kindrobots-db-capacity.txt
```

The script reports:

- ProxySQL frontend user counts and limits;
- frontend sessions grouped by client IP, database, command, and backend state;
- backend `ConnUsed`, `ConnFree`, `MaxConnUsed`, and configured limits;
- connection-denial counters;
- MariaDB account/global ceilings and sessions grouped by source host;
- open InnoDB transactions.

It is read-only and prints no passwords or query text. Optional ProxySQL sections
are allowed to fail without aborting the MariaDB half of the census.

Capture both outputs before restarting Kind Robots, ProxySQL, or MariaDB. A
restart clears the source and session-age evidence.

## Interpret the output

### ProxySQL frontend source totals

`stats_mysql_users.frontend_connections` is the number of live client sessions
for the ProxySQL user. When it equals `frontend_max_connections`, ProxySQL cannot
accept another session for that user even if MariaDB has capacity.

The `cli_host` grouping identifies who holds those sessions:

- a Tailscale address matching `SILAS-PC` points back to local Node processes;
- Vercel or public cloud addresses indicate preview/build/runtime clients;
- another LAN or Tailscale address identifies another machine or service;
- many sessions with no attached backend show idle frontend sockets that are not
  currently consuming a MariaDB backend connection.

### ProxySQL backend pool

For each backend row:

```text
ConnUsed + ConnFree <= runtime_mysql_servers.max_connections
```

A full 40-connection pool does not imply 40 simultaneous active queries. It may
include backend connections pinned to frontend sessions or retained free in the
pool.

### MariaDB source summary

MariaDB's `information_schema.PROCESSLIST` distinguishes:

- connections from the ProxySQL Docker/network source;
- direct bypass clients using MariaDB without ProxySQL;
- sleeping versus active sessions;
- old open transactions.

Direct bypass sessions are outside ProxySQL's hostgroup cap and should use a
separate account where possible.

## Immediate recovery, after source evidence is captured

Choose recovery from the source census:

- one client IP owns most of the 200 frontends: stop or restart that client after
  recording its process/socket census;
- stale previews or deployments own them: remove or expire those runtimes rather
  than raising the shared user limit blindly;
- many local Node PIDs own them: stop only stale runtimes and retain the intended
  process;
- ProxySQL has many old frontends with dead clients: investigate TCP keepalive and
  idle timeout behavior before increasing limits;
- direct MariaDB clients dominate: stop or reconfigure those clients; restarting
  ProxySQL will not release them.

Do not raise `kindrobot.max_connections` before identifying the client source.
ProxySQL is already proving that it can multiplex 200 frontend sessions over a
40-connection backend pool.

### The four-hour transaction timeouts are deliberate — do not "fix" them

A census shows both of these at `14400000` ms:

```text
mysql-max_transaction_time        14400000
mysql-max_transaction_idle_time   14400000
```

Four hours looks alarming next to `mysql-wait_timeout` at ten minutes, and it
has been flagged as a smell more than once. It is intentional. Kind Robots
queues long ComfyUI video generations on hardware that is deliberately run near
its limit (12 GB VRAM, 24 GB system RAM), and a single generation can hold its
work well past any ordinary web-request budget. A shorter ceiling would have
ProxySQL kill legitimate in-flight generation work and surface it as a database
error far from its real cause.

So: a long-running transaction on this deployment is not automatically evidence
of a leak. Before treating one as stuck, check whether it belongs to the art or
video generation path. `Active_Transactions` in the census is the number to
watch — the ceiling only matters once something is actually sitting against it,
and at the 2026-08-21 census it was `0`.

If a genuine leak ever does need bounding, lower it for the lane that leaks
rather than globally, so the generation path keeps its headroom.

## Durable topology

The desired steady state is:

1. one Prisma/MariaDB connector pool per Kind Robots Node process;
2. one intended long-lived Kind Robots process on the Windows application host;
3. MariaDB command pipelining disabled on the ProxySQL path;
4. a reviewed ProxySQL frontend limit sized above normal client-pool demand;
5. a bounded ProxySQL backend hostgroup below MariaDB capacity;
6. a separate migration account and `MIGRATION_DATABASE_URL`;
7. no preview, worker, or local service sharing `kindrobot` unintentionally;
8. recorded steady-state client IPs, frontend sessions, `ConnUsed`, `ConnFree`,
   and `MaxConnUsed` during normal and burst traffic.

Throughput is not equal to connection count. A healthy proxy serves many
interactions over a bounded backend pool.
