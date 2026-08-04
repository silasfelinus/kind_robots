# Current connection-capacity investigation

The first live two-host census found ProxySQL's `kindrobot` frontend user pinned
at **200 / 200** connections while its MariaDB backend hostgroup remained bounded
at **40** connections (`38` used, `2` free).

At the same moment, `SILAS-PC` had no TCP connections to Alexandria port 5544 and
no Kind Robots Node/Nuxt/Nitro process running. The 200 live ProxySQL frontend
sessions therefore belong to another client source.

The immediate task is to group `stats_mysql_processlist.cli_host` and complete the
MariaDB source census. Do not raise the ProxySQL user limit or restart the clients
before capturing those source addresses.

The Prisma wrapper still contains an independent pool-lifecycle defect on `main`:
stale-connection recovery can create replacement clients without retiring their
connector pools. PR #1412 removes that mechanism, but it is not yet established
as the source of the current 200 sessions because the intended local application
process was absent during the capture.

See [the ProxySQL capacity runbook](./proxysql-connection-capacity.md) for the
current evidence and rerun commands.
