# Vercel database isolation runbook

This is the durable repair for GitHub issue #1581. It separates Vercel Preview
traffic and production migrations from the production `kindrobot` ProxySQL
frontend budget.

## Target topology

```text
Production runtime
  DATABASE_URL -> kindrobot -> ProxySQL hostgroup 10 -> MariaDB
  Vercel pool: max 2, minimumIdle 0, idle 15s

Vercel Preview
  DATABASE_URL -> kindrobot_preview -> ProxySQL hostgroup 20 -> same MariaDB
  ProxySQL frontend max: 40
  ProxySQL backend max: 8 per production backend row
  MariaDB privileges: SELECT + SHOW VIEW only
  Vercel pool: max 1, minimumIdle 0, idle 5s

Production migrations
  MIGRATION_DATABASE_URL -> kindrobot_migrate -> ProxySQL hostgroup 30 -> same MariaDB
  ProxySQL frontend max: 8
  ProxySQL backend max: 4 per production backend row
  MariaDB privileges: ALL on the Kind Robots schema only, without GRANT OPTION
```

The production hostgroup remains unchanged. With the current single production
backend capped at 40, the default isolated maxima are 40 + 8 + 4 = 52 possible
ProxySQL backend connections. The provisioning script refuses to apply if that
would leave less than 30 connections of MariaDB's global capacity in reserve.

Preview is intentionally read-only. A preview that unexpectedly writes during a
normal page load should fail visibly instead of mutating production data. Cypress
remains manual while it still targets the production application and performs
write-heavy API tests. If write-capable automated testing is needed again, give it
a dedicated test database rather than granting Vercel Preview production-equivalent
write access.

## 1. Provision the database lanes on Alexandria

From a current Kind Robots checkout on the Unraid host:

```bash
bash scripts/provision-vercel-db-isolation.sh
```

The default invocation is read-only and prints the planned topology without
passwords. If the preflight is clean, apply it:

```bash
bash scripts/provision-vercel-db-isolation.sh --apply
```

The script:

- discovers ProxySQL admin credentials from the existing container config;
- discovers the MariaDB root password from the existing container environment when available;
- derives the schema and TLS-user setting from the production `kindrobot` ProxySQL user;
- refuses to reuse target hostgroups if they contain unrelated backends;
- refuses to continue when generic ProxySQL query rules could route the new users away from their isolated hostgroups;
- creates `kindrobot_preview` as a read-only MariaDB account;
- creates `kindrobot_migrate` with schema-level migration privileges;
- gives each account its own ProxySQL frontend ceiling and backend hostgroup;
- hashes the stored ProxySQL passwords with `MYSQL_NATIVE_PASSWORD()`;
- preserves MariaDB headroom before adding backend capacity;
- changes ProxySQL `mysql-wait_timeout` from the old eight-hour retention window to 600000 ms (10 minutes);
- loads the server/user/variable changes into ProxySQL runtime and saves them to disk;
- verifies the runtime users, hostgroups, limits, and timeout;
- writes the generated handoff values to `/mnt/user/pc/kindrobots-db-isolation/kindrobots-db-isolation.env` with mode 600 inside a mode-700 private directory;
- writes a password-free pre-change ProxySQL snapshot next to that file.

The credential file is deliberately not printed to the terminal. Keep it private.
If the script is rerun, it reuses the saved credentials rather than silently
rotating an already-provisioned account.

## 2. Set Vercel environment variables

In the Vercel project, open **Settings -> Environment Variables**. Environment
variables are scoped by deployment environment, and changing them affects only
new deployments.

Use the values from
`/mnt/user/pc/kindrobots-db-isolation/kindrobots-db-isolation.env`:

1. Edit `DATABASE_URL` for **Preview only** and set it to the value of
   `VERCEL_PREVIEW_DATABASE_URL`.
2. Leave the existing `DATABASE_URL` for **Production** unchanged.
3. Add `MIGRATION_DATABASE_URL` for **Production only** and set it to the value
   of `VERCEL_PRODUCTION_MIGRATION_DATABASE_URL`.
4. Do not add `MIGRATION_DATABASE_URL` to Preview. Preview builds intentionally
   skip migrations and deployment-time database seeds.
5. Keep the existing `DATABASE_SSL_CA_BASE64` / TLS settings in both environments.

`prisma-migrate-deploy.mjs` already resolves
`MIGRATION_DATABASE_URL ?? DATABASE_URL`, so no application-code switch is needed
for production migrations.

## 3. Redeploy and verify

Redeploy one Preview first. Verify its database health endpoint and runtime logs.
The preview should use the `vercel-preview` pool profile and remain functional for
read paths.

Then redeploy Production. The production build should show:

```text
[database] Verified TLS connection to ProxySQL before migration.
48 migrations found
No pending migrations to apply.
```

Run a fresh production direct probe:

```text
/api/health/database-direct -> 200
```

Finally capture each ProxySQL identity independently:

```bash
APP_DB_USER=kindrobot bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /mnt/user/pc/kindrobots-db-capacity-production.txt

APP_DB_USER=kindrobot_preview bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /mnt/user/pc/kindrobots-db-capacity-preview.txt

APP_DB_USER=kindrobot_migrate bash scripts/proxysql-capacity-diagnostics.sh \
  | tee /mnt/user/pc/kindrobots-db-capacity-migration.txt
```

Expected results:

- `kindrobot` remains on hostgroup 10 and below 200 frontend sessions;
- `kindrobot_preview` is capped at 40 frontends and routes only to hostgroup 20;
- `kindrobot_migrate` is capped at 8 frontends and routes only to hostgroup 30;
- hostgroup 20 has an 8-connection backend cap per production backend row;
- hostgroup 30 has a 4-connection backend cap per production backend row;
- `mysql-wait_timeout` is 600000 ms;
- a Preview deployment burst cannot make a fresh production direct probe fail;
- `Access_Denied_Max_User_Connections` remains flat during an ordinary Preview/PR cycle.

## 4. Cypress

PR #1584 removed the automatic 30-minute Cypress schedule because that suite
writes against production and was observed causing fresh pool-acquisition errors.
Do not restore the schedule merely because Preview now has a read-only identity.
Restore automated Cypress only after it has a write-capable test environment that
is not the production database.

## Rollback

Do not drop the new accounts as a first response. To return Vercel to the old
routing, restore the previous Preview `DATABASE_URL`, remove the Production-only
`MIGRATION_DATABASE_URL`, and redeploy. The dedicated users and hostgroups are
then dormant and can be inspected safely before any cleanup.

The provisioning script writes a password-free `*-before-<timestamp>.txt` snapshot
of the relevant ProxySQL users, servers, and timeout before it changes anything.
