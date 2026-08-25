# Narrowing the application database account

**kind-robots/t-073.** The application account `kindrobot` holds
`ALL PRIVILEGES ON *.*` **`WITH GRANT OPTION`**, plus `ALL PRIVILEGES` on
`kindrobots`, `kindblank`, `kindblank_fresh` and `kindblank_shadow`.

That credential is `DATABASE_URL`. It lives in the app service's env file and is
loaded into the long-running Nuxt container, so **the permanently-running web
process holds server-wide superuser on every database, and can re-grant itself
anything it likes.**

This makes the two-lane design decorative. `prisma.config.ts` refusing
`DATABASE_URL` for migrate commands, `prisma-migrate-deploy.mjs` refusing it
again, `verifyMigrateOnDeploy.ts` warning that moving `MIGRATION_DATABASE_URL`
into the app service "would hand a permanently-running web process the ability to
drop tables" — all of it carefully prevents something the app account can already
do. See [migration-credential-boundary.md](./migration-credential-boundary.md)
for the boundary this is supposed to enforce. **The boundary is real in the code
and absent in the database.** Code cannot enforce a database privilege.

> **A wrong revoke takes the site down.** Work the sequence below in order. Do
> not skip step 0.

---

## Step 0 — rotate the password first, before any of this

The `kindrobot` password was disclosed twice in an agent session transcript on
2026-08-25: once in plaintext, and once as the `mysql_native_password` hash from
a `SHOW GRANTS` dump. **A hash is a credential, not a fingerprint** — it is
sufficient to authenticate with some clients. Treat the transcript as untrusted
storage.

Rotate before narrowing, because narrowing takes planning and the disclosure is
live now. Rotation is independent of everything below and can ship on its own.

After rotating, update the app service's env file and restart it. Nothing else
reads this credential.

---

## Step 1 — what the app actually executes (done; recorded here as evidence)

The dangerous part of a narrowing is discovering, at revoke time, that something
quietly depended on a privilege it should not have had. Enumerated 2026-08-25
across the whole runtime path:

| operation | count in `server/` | privilege needed |
|---|---|---|
| `SELECT` (incl. `SELECT … FOR UPDATE`) | 10 | `SELECT` |
| `INSERT` | 1 | `INSERT` |
| `UPDATE` | 1 | `UPDATE` |
| `DELETE` | 1 | `DELETE` |
| `GET_LOCK()` | 1 | none — any user may call it |
| **DDL of any kind** | **0** | — |

Everything else goes through Prisma Client, which emits only DML.

Two things that look like exceptions and are not:

- **`server/plugins/01-migration-drift-check.ts`** reads `_prisma_migrations` at
  boot. That is a plain `SELECT` on a table in the app's own database. Its own
  comment says it "needs to know what was migrated, never to migrate anything",
  which is exactly right and stays true under the narrowed grant.
- **`CREATE TEMPORARY TABLE`** appears only in hand-run maintenance scripts under
  `utils/scripts/`. Those are a different lane, run deliberately by a human, and
  must not widen the app lane. If one needs the privilege, give it the migration
  credential for that run.

**Conclusion: the app lane needs `SELECT, INSERT, UPDATE, DELETE` on
`kindblank_fresh` and nothing else.**

Still worth eyeballing before you revoke, because they are outside this repo:
ProxySQL's query rules, and anything on the box that reuses `DATABASE_URL`.

---

## Step 2 — record the current grant so it can be restored

```sql
SHOW GRANTS FOR 'kindrobot'@'%';
```

Save the output somewhere you can reach in a hurry. **Redact the
`IDENTIFIED BY PASSWORD '…'` portion before it goes anywhere persistent** — that
is the disclosure in step 0 repeating itself.

Restoring is `GRANT ALL PRIVILEGES ON *.* TO 'kindrobot'@'%' WITH GRANT OPTION;`
followed by `FLUSH PRIVILEGES;` — under a minute, if something breaks.

---

## Step 3 — verify against a narrowed account first, not in production

Create a second account with the target grant and point a **non-production**
app instance at it:

```sql
CREATE USER 'kindrobot_app'@'%' IDENTIFIED BY '<new password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO 'kindrobot_app'@'%';
FLUSH PRIVILEGES;
```

Exercise the app against it: boot it (the drift-check plugin runs on boot), load
a few pages, write something, and run the art queue path — that one takes a
`GET_LOCK` and a `SELECT … FOR UPDATE`, so it is the best single smoke test.

Then confirm the account is actually as narrow as intended:

```bash
DATABASE_URL='<narrowed url>' npx tsx utils/scripts/verifyAppAccountPrivileges.ts
```

That script asks the **database** what the connected account holds and exits 1 on
anything beyond `SELECT/INSERT/UPDATE/DELETE` on one database, on any `*.*`
grant, and on `GRANT OPTION`. It redacts password hashes from everything it
prints, including error messages.

---

## Step 4 — narrow the real account

Only once step 3 is green:

```sql
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'kindrobot'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `kindblank_fresh`.* TO 'kindrobot'@'%';
FLUSH PRIVILEGES;
```

Then re-run the verifier against the real `DATABASE_URL` and restart the app.

`REVOKE ALL PRIVILEGES, GRANT OPTION` removes the global grant **and** the four
per-database ones in a single statement, which is what you want: the account
should not keep `ALL PRIVILEGES` on `kindrobots`, `kindblank`, or
`kindblank_shadow` either.

**`kindblank_shadow` in particular.** It is a Prisma shadow database, created and
dropped by tooling. That is a reasonable thing for a *migration* account to
reach and not something the web process needs.

---

## Step 5 — keep it narrow

Add the verifier to whatever runs against the live database on a schedule. The
failure mode this guards against is not someone deliberately re-granting
superuser; it is a future incident where a wide grant is handed out to unblock
something at 2am and never taken back.

---

## Two smaller things, cheap to fix while you are in here

- **`.env` is mode `0640`, owner `silasfelinus:users`.** Any process running as
  group `users` can read the database credential. `0600` unless something else
  genuinely needs it.
- **The connection string carries `sslaccept=accept_invalid_certs`.** The
  application lane connects without verifying the ProxySQL certificate. The
  migration lane already does a TLS preflight; this one does not.

Neither is the headline. Both are a few minutes.
