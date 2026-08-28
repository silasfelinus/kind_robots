# Infrastructure runbooks

Coding agents do not have a standing direct database lane. Ordinary record changes go through the authenticated Kind Robots API; schema/database administration remains an explicit human-operated boundary.

- [Migration credential boundary](./migration-credential-boundary.md) — how schema changes reach production, and the `kindrobot_migrate` lane
- [ProxySQL connection capacity](./proxysql-connection-capacity.md)
- [Connection-capacity investigation](./connection-capacity-investigation.md) — the 2026-08-04 frontend-session exhaustion
- [Payment environment configuration](./payment-environment.md)
