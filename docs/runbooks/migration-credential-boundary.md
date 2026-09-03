# Migration credential boundary

Kind Robots deliberately separates ordinary application/database access from schema-changing migration access.

## Normal application and developer commands

`DATABASE_URL` is the normal credential for application runtime, Prisma Client use, and non-schema-writing commands such as `prisma generate`, `prisma studio`, and `prisma db pull`.

Coding-agent sessions do not need a standing migration credential for ordinary work.

## Commands that require explicit elevation

Set `MIGRATION_DATABASE_URL` before any Prisma command that can execute or reconcile schema changes:

```bash
MIGRATION_DATABASE_URL='<migration connection string>' npx prisma migrate deploy
MIGRATION_DATABASE_URL='<migration connection string>' npx prisma migrate resolve --applied <migration-name>
MIGRATION_DATABASE_URL='<migration connection string>' npx prisma db execute --file <sql-file>
MIGRATION_DATABASE_URL='<migration connection string>' npx prisma db push
```

All `prisma migrate ...` subcommands fail closed when `MIGRATION_DATABASE_URL` is absent. `prisma db execute` and `prisma db push` do the same. They do not silently fall back to `DATABASE_URL`.

The production wrapper, `node scripts/prisma-migrate-deploy.mjs`, also requires `MIGRATION_DATABASE_URL`. It performs the TLS preflight and passes the elevated URL to Prisma only inside the throwaway migration process.

## Local development

Local development uses the same explicit boundary. To intentionally migrate a disposable local database, set `MIGRATION_DATABASE_URL` to that local database URL for the command or shell session. Do not rely on an ambient application `DATABASE_URL` to become migration-capable by accident.

## Production on Alexandria

Production is the `KindRobots` DockerMan container on the Alexandria Unraid host. The canonical deploy path is **not** the Unraid Force Update button and is **not** `docker compose`.

Unraid User Scripts schedules:

```bash
/bin/bash /mnt/user/appdata/kind_robots/scripts/unraid-user-script.sh
```

That launcher refreshes a clean `main` checkout and delegates to `scripts/deploy-unraid.sh`. The deployer:

1. pulls `ghcr.io/silasfelinus/kind_robots:latest`;
2. loads the migration credential from the protected handoff file;
3. runs that image's pending migrations;
4. only after migration succeeds, invokes Unraid DockerMan's container updater;
5. waits for the `KindRobots` container health check.

If migration fails, the old application container is left running. The elevated credential never enters the long-running web container.

See `docs/runbooks/unraid-auto-deploy.md` for the one-time User Scripts setup and the migration compatibility rule for unattended deployments.

### Manual production deployment

The same guarded path can be invoked directly:

```bash
cd /mnt/user/appdata/kind_robots
bash scripts/deploy-unraid.sh
```

Do not manually split this back into “migrate, then click Force Update” for routine work. That two-step human handoff is exactly how production accumulated unapplied migrations.

`migrate deploy` applies pending migrations only. It never resets the database.

## Where the credential comes from

`MIGRATION_DATABASE_URL` is written by `scripts/provision-migrate-db-lane.sh` to a mode-600 handoff file, by default:

```text
<repo>/.secrets/kindrobots-db-migrate.env
```

On Alexandria that is:

```text
/mnt/user/appdata/kind_robots/.secrets/kindrobots-db-migrate.env
```

Credentials live under the checkout's `.secrets/` directory, **never on `/mnt/user/pc`**. `/mnt/user/pc` is a general-access share and is appropriate for bulk non-secret data such as media and models, not credentials.

If the handoff file is missing or the credential no longer authenticates, reconcile it with:

```bash
cd /mnt/user/appdata/kind_robots
bash scripts/provision-migrate-db-lane.sh
bash scripts/provision-migrate-db-lane.sh --apply
```

The provisioner reconciles the migration lane in MariaDB and ProxySQL and verifies authentication end to end.

## Important shell rule

Do **not** source the application `.env` as shell code. Its values may contain shell-significant characters. The production deployer passes it to `docker run --env-file`, while sourcing only the dedicated migration handoff file.

This is wrong:

```bash
set -a; . ./.env; set +a
```

This is the only file intended to be sourced for migration credentials:

```bash
set -a; . ./.secrets/kindrobots-db-migrate.env; set +a
```

Do not echo `MIGRATION_DATABASE_URL` to inspect it. Check only its shape or parsed account name.

## Reading what is pending

The normal answer is to run the guarded deployer. For diagnostics, Prisma's migration history is `_prisma_migrations`, and the runtime image carries the exact migration directories belonging to the code it will serve.

A direct history comparison can be made without changing schema:

```bash
cd /mnt/user/appdata/kind_robots
set -a; . ./.secrets/kindrobots-db-migrate.env; set +a

docker run --rm --network cafepurr -e MYSQL_PWD="$MIGRATE_DB_PASSWORD" mariadb:11.4 \
  mariadb -h "$PUBLIC_PROXYSQL_HOST" -P "$PUBLIC_PROXYSQL_PORT" -u "$MIGRATE_DB_USER" \
  --ssl -D "$DATABASE_NAME" --batch --raw --skip-column-names \
  -e "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;" \
  | sort > /tmp/applied.txt

docker run --rm ghcr.io/silasfelinus/kind_robots:latest sh -lc 'ls -1 /app/prisma/migrations' \
  | grep -v migration_lock | sort > /tmp/ondisk.txt

comm -23 /tmp/ondisk.txt /tmp/applied.txt
```

Take the on-disk list from the image, not from an arbitrary checkout revision. The image is what production will actually run.

## Running migration machinery by hand

Still supported for targeted repair work. Use the elevated lane explicitly:

```bash
set -a; . ./.secrets/kindrobots-db-migrate.env; set +a
DATABASE_SSL_CA_BASE64="$(grep -m1 '^DATABASE_SSL_CA_BASE64=' .env | cut -d= -f2- | tr -d '\042\047')" \
  node scripts/prisma-migrate-deploy.mjs
```

For surgical repair, the same explicit boundary applies to `prisma migrate resolve`, `prisma db execute`, and `prisma db push`.

Never use `prisma migrate reset` against the real database. Never place `MIGRATION_DATABASE_URL` in the long-running application environment merely to make deployment convenient.
