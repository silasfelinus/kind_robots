# Current connection-capacity investigation

The production MariaDB account `kindrobot` is rejecting new backend sessions at
its `max_user_connections = 200` ceiling. The associated repair and diagnostic
work is documented in [the ProxySQL capacity runbook](./proxysql-connection-capacity.md).

Do not raise the ceiling or lower the Vercel pool blindly before capturing the
Alexandria census. The determining evidence is whether the 200 MariaDB sessions
originate from ProxySQL, direct clients, open transactions, or retained idle
backends.
