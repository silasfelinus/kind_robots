# Narrowing the application database account

**kind-robots/t-073.** This runbook records the remaining MariaDB privilege
cleanup for the production application account, `kindrobot`.

## Current state, verified live 2026-08-27

The original t-073 investigation found a server-wide `ALL PRIVILEGES ON *.* WITH
GRANT OPTION` grant. That worst-case grant was subsequently removed manually on
Alexandria. A fresh `SHOW GRANTS FOR 'kindrobot'@'%'` on 2026-08-27 showed:

```text
GRANT USAGE ON *.* TO `kindrobot`@`%` IDENTIFIED BY PASSWORD '<redacted>'
GRANT ALL PRIVILEGES ON `kindrobots`.* TO `kindrobot`@`%`
GRANT ALL PRIVILEGES ON `kindblank`.* TO `kindrobot`@`%`
GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO `kindrobot`@`%`
GRANT ALL PRIVILEGES ON `kindblank_shadow`.* TO `kindrobot`@`%`
```

So the production web process is **not** a server-wide superuser and does **not**
hold `GRANT OPTION` anymore. The remaining problem is smaller but real:

- it can still run DDL such as `CREATE`, `ALTER`, and `DROP` inside
  `kindblank_fresh`;
- it still has full access to three databases the running app does not need;
- the separate `kindrobot_migrate` lane exists specifically so schema-changing
  work does not need to live in the always-running web process.

The intended final state is:

```text
USAGE on *.*
SELECT, INSERT, UPDATE, DELETE on `kindblank_fresh`.*
```

Nothing in the PR that added this runbook changes grants automatically. The live
change remains a human-gated Alexandria operation.

---

## 1. Why DML-only is enough

The runtime path was enumerated during t-073:

| operation | count in `server/` | privilege needed |
|---|---:|---|
| `SELECT` including `SELECT ... FOR UPDATE` | 10 | `SELECT` |
| `INSERT` | 1 | `INSERT` |
| `UPDATE` | 1 | `UPDATE` |
| `DELETE` | 1 | `DELETE` |
| `GET_LOCK()` | 1 | none beyond the connection itself |
| DDL | 0 | none |

Everything else goes through Prisma Client and remains DML.

Two apparent exceptions do not widen the app lane:

- `server/plugins/01-migration-drift-check.ts` only reads `_prisma_migrations`.
- maintenance scripts under `utils/scripts/` that need schema privileges belong
  on the migration credential, not `DATABASE_URL`.

---

## 2. Credential disclosure status is separate

The August 25 investigation also recorded that an application credential or
password hash had appeared in an agent transcript. Grant narrowing does not tell
us whether that credential was later rotated.

If it was already rotated after that disclosure, do not rotate it again merely
because this runbook exists. If it was not, rotate it before doing unrelated
privilege work and update the application service atomically.

Do not print or persist a MariaDB password hash. Redact `IDENTIFIED BY PASSWORD`
from any saved `SHOW GRANTS` output.

---

## 3. Snapshot the current grants

Before changing anything, capture the current **redacted** grants. The known
2026-08-27 rollback target is the four database-wide `ALL PRIVILEGES` grants
listed at the top of this document. Do **not** restore the historical global
`ALL PRIVILEGES ON *.* WITH GRANT OPTION`; that state has already been fixed.

A rollback, if needed, is therefore:

```sql
GRANT ALL PRIVILEGES ON `kindrobots`.* TO 'kindrobot'@'%';
GRANT ALL PRIVILEGES ON `kindblank`.* TO 'kindrobot'@'%';
GRANT ALL PRIVILEGES ON `kindblank_fresh`.* TO 'kindrobot'@'%';
GRANT ALL PRIVILEGES ON `kindblank_shadow`.* TO 'kindrobot'@'%';
FLUSH PRIVILEGES;
```

---

## 4. Narrow the real account

The cleanest transition is to remove all database privileges from the account,
then immediately add back only the DML set the app needs:

```sql
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'kindrobot'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE
  ON `kindblank_fresh`.*
  TO 'kindrobot'@'%';
FLUSH PRIVILEGES;
```

`USAGE ON *.*` is the account/authentication baseline and is expected to remain.

This intentionally removes access to:

- `kindrobots`
- `kindblank`
- `kindblank_shadow`

and removes schema-changing privileges from `kindblank_fresh`.

`kindblank_shadow` belongs to migration/tooling behavior, not the production web
process. The dedicated `kindrobot_migrate` identity is the schema-changing lane.

---

## 5. Verify immediately

From the repository checkout, with the production `DATABASE_URL` available to
the process running the command:

```bash
npm run test:app-account-privileges
```

The verifier:

- asks MariaDB what the connected identity actually holds;
- allows only global `USAGE`;
- allows only `SELECT`, `INSERT`, `UPDATE`, `DELETE`;
- requires those DML privileges to be database-wide on the database the app is
  actually connected to;
- rejects `ALL PRIVILEGES`, `GRANT OPTION`, server-wide privileges, grants on
  another database, and bespoke table-level grants;
- redacts credential material from all output.

Then exercise the production app through normal application paths, including at
least one read and one write. The art queue is a useful smoke path because it
uses both `GET_LOCK()` and `SELECT ... FOR UPDATE`.

If anything unexpectedly fails, restore the four database grants from section 3
first, then investigate. Do not widen the account beyond that known 2026-08-27
state as a troubleshooting shortcut.

---

## 6. Keep the boundary testable

The long-term failure mode is configuration drift: a wide grant gets handed out
during an incident and survives after the incident is over. Keep the verifier as
a cheap explicit check whenever database credentials or ProxySQL/MariaDB routing
are changed.

Two adjacent hardening items remain separate from this grant cleanup:

- keep the application `.env` readable only by the account/process that needs it;
- avoid disabling certificate verification on the application DB connection if
  the current ProxySQL TLS setup can support verified certificates.
