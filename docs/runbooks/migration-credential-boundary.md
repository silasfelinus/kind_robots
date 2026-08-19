# Migration credential boundary

Kind Robots deliberately separates ordinary application/database access from schema-changing migration access.

## Normal application and developer commands

`DATABASE_URL` remains the normal credential for application runtime, Prisma Client use, and non-schema-writing commands such as `prisma generate`, `prisma studio`, and `prisma db pull`.

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

The repository production wrapper, `node scripts/prisma-migrate-deploy.mjs`, also requires `MIGRATION_DATABASE_URL` before it opens a database connection. The wrapper passes the elevated URL to the child Prisma process as both `MIGRATION_DATABASE_URL` and `DATABASE_URL` only inside that child so Prisma and the TLS preflight use the same explicitly authorized connection.

## Local development

Local development uses the same explicit boundary. If a developer intentionally wants to run migrations against a disposable local development database, set `MIGRATION_DATABASE_URL` to that local database URL for the command or shell session. Do not rely on an ambient application `DATABASE_URL` to become migration-capable by accident.

This keeps local migration work possible while making elevation visible in the command environment.

## CI and production

CI or production jobs that execute migrations must provide `MIGRATION_DATABASE_URL` through the environment or secret store. Jobs that only build, typecheck, generate Prisma Client code, or run application tests should continue to use the ordinary database lane and should not receive the migration credential unless they genuinely need schema-write capability.

### Applying migrations on deploy

**Production is Unraid, and Unraid's Force Update does not migrate.** The site is served by the `KindRobots` container, created from an Unraid Docker template and running `ghcr.io/silasfelinus/kind_robots:latest`. Updating it means Force Update in the Unraid UI, which pulls the image and recreates the container. Nothing in that path runs a migration, so it has to be done alongside.

Migrate from the image you are about to serve, then Force Update:

```bash
cd /mnt/user/appdata/kind_robots
set -a; . /mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env; set +a

docker pull ghcr.io/silasfelinus/kind_robots:latest

docker run --rm --network cafepurr \
  --env-file /mnt/user/appdata/kind_robots/.env \
  -e MIGRATION_DATABASE_URL \
  ghcr.io/silasfelinus/kind_robots:latest \
  node scripts/prisma-migrate-deploy.mjs
```

Every line above is meant to be pasted as-is. There are deliberately **no placeholders** to substitute: `MIGRATION_DATABASE_URL` arrives from the sourced handoff file, and `-e MIGRATION_DATABASE_URL` with no `=value` passes it from the current shell, keeping the credential out of the command line and out of shell history. An earlier revision of this page printed a `mysql://kindrobot_migrate:PASSWORD@HOST:5544/DBNAME` template here; it was pasted verbatim more than once, and `P1001: Can't reach database server at HOST:5544` is what that looks like.

No `git pull` is required for any of this. The image carries its own `prisma/migrations`, `scripts/` and `prisma.config.ts`; the checkout is used only for `.env`.

Pull first. Migrating from `:latest` and then Force Updating to `:latest` is what keeps the schema and the code that will serve it the same build.

`migrate deploy` applies pending migrations only — it never resets, drops, or generates, and re-running it is a no-op, so it is safe to run before every update whether or not anything is pending.

#### Do not use docker compose on Alexandria

`docker-compose.yml` also defines a one-shot `migrate` service the app is gated behind, and that gate is real — but it only fires on `docker compose up`, which is **not** how this host deploys. Running compose there creates a second container that fights `KindRobots` for port 3009 and fails to bind. The compose path is for development and for any host that does deploy that way; on Alexandria, use the two steps above.

Set `MIGRATION_DATABASE_URL` to the `kindrobot_migrate` credential in the deploying shell. It is deliberately **not** read from the application env file.

This keeps the boundary rather than bending it. The rule is that schema-write capability must not sit in the _long-running_ application container; a container whose entire lifetime is the migration is the same shape as a CI job. Do not move `MIGRATION_DATABASE_URL` into the `kind-robots` service to simplify the file — that hands a permanently-running web process the ability to drop tables, and `utils/scripts/verifyMigrateOnDeploy.ts` fails the build if you do.

That contract also pins the runtime image carrying `prisma/`, `scripts/` and `prisma.config.ts`. The image originally shipped only `.output`, `node_modules` and `package.json`, which is why migrations could not run from it at all and had to be run by hand from a repo checkout on the host — against whatever revision that checkout happened to be on. An image-slimming pass that drops them would silently reintroduce that.

### Where the credential comes from

`MIGRATION_DATABASE_URL` is written by `scripts/provision-migrate-db-lane.sh` to a mode-600 handoff file, by default:

```text
/mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env
```

Source that in the deploying shell (`set -a; . <file>; set +a`) rather than retyping a URL. If the file does not exist, or the credential in it no longer authenticates, run the provisioner — it creates or reconciles the lane in **both** MariaDB and ProxySQL and verifies authentication end to end:

```bash
bash scripts/provision-migrate-db-lane.sh            # dry run
bash scripts/provision-migrate-db-lane.sh --apply
```

### Reading what is pending

`prisma migrate status` **cannot be used against this lane directly.** `prisma.config.ts` passes `MIGRATION_DATABASE_URL` through as the datasource URL and adds no SSL parameters; nothing reads `DATABASE_SSL_CA_BASE64` except `scripts/prisma-migrate-deploy.mjs`, which writes the CA to a temp file and appends `sslcert`/`sslaccept=strict` itself. `kindrobot_migrate` has `use_ssl=1` in ProxySQL, so a plain `npx prisma migrate status` connects without TLS and is rejected — surfacing as **P1000 "Authentication failed"**, which reads exactly like a wrong password and is not one. (2026-08-19: an hour was lost to this.)

Read the history directly instead — no TLS plumbing, no Prisma:

```bash
set -a; . /mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env; set +a

docker run --rm --network cafepurr -e MYSQL_PWD="$MIGRATE_DB_PASSWORD" mariadb:11.4 \
  mariadb -h "$PUBLIC_PROXYSQL_HOST" -P "$PUBLIC_PROXYSQL_PORT" -u "$MIGRATE_DB_USER" \
  --ssl -D "$DATABASE_NAME" --batch --raw --skip-column-names \
  -e "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;" \
  | sort > /tmp/applied.txt

docker run --rm ghcr.io/silasfelinus/kind_robots:latest sh -lc 'ls -1 /app/prisma/migrations' \
  | grep -v migration_lock | sort > /tmp/ondisk.txt

comm -23 /tmp/ondisk.txt /tmp/applied.txt    # what a deploy would run
```

Take the on-disk list from the **image**, not from a repo checkout on the host: the image is what will actually run, and the checkout is at whatever revision it happens to be.

Two things to look for in that output:

- **`00000000000000_squashed` listed as pending** — the database predates the squash and was never baselined. Do not run deploy; it would try to re-create the whole schema. Record the baseline with `prisma migrate resolve --applied 00000000000000_squashed` (which needs the same TLS treatment as `status`, so run it through the image with `sslcert`/`sslaccept` set on the URL) and re-check.
- **Applied migrations absent from the image** — expected for a database older than the squash; `migrate deploy` ignores them.

If you do want Prisma's own view, replicate what the wrapper does to the URL:

```bash
docker run --rm --network cafepurr --env-file .env -e MIGRATION_DATABASE_URL \
  ghcr.io/silasfelinus/kind_robots:latest sh -lc '
    printf %s "$DATABASE_SSL_CA_BASE64" | tr -d "[:space:]" | base64 -d > /tmp/ca.pem
    export MIGRATION_DATABASE_URL="${MIGRATION_DATABASE_URL}?sslcert=/tmp/ca.pem&sslaccept=strict"
    npx prisma migrate status
  '
```

### Running a migration by hand

Still supported, from a repo checkout with dependencies installed. Pass a plain `mysql://` URL with no SSL parameters — the wrapper adds them:

```bash
set -a; . /mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env; set +a
DATABASE_SSL_CA_BASE64="$(grep -m1 '^DATABASE_SSL_CA_BASE64=' .env | cut -d= -f2- | tr -d '\042\047')" \
  node scripts/prisma-migrate-deploy.mjs
```

Two shell hazards, both of which have cost real time here:

- **Do not `source` the application `.env`.** Its values are unquoted and contain characters bash will execute; `set -a; . ./.env` produces `command not found` lines made of your secrets. Read individual keys with `grep`/`cut` as above, or let `docker run --env-file` parse the file (docker does not use a shell).
- **Do not put an interactive `read` in a block you paste.** When several lines are pasted at once, `read` consumes the _next pasted line_ as its input rather than waiting for you to type. Put passwords in a mode-600 file and read them from there.
