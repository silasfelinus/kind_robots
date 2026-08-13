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

`docker-compose.yml` defines a one-shot `migrate` service that runs `node scripts/prisma-migrate-deploy.mjs` and exits. The app declares `depends_on: migrate: condition: service_completed_successfully`, so `docker compose up -d` migrates first and the app never starts against a schema that was not applied. `migrate deploy` applies pending migrations only — it never resets, drops, or generates, and re-running it is a no-op.

Set `MIGRATION_DATABASE_URL` to the `kindrobot_migrate` credential in the deploying shell or in the compose `.env`. It is deliberately **not** read from the application env file, and compose fails loudly if it is unset: a deploy that cannot migrate should stop rather than quietly serve old schema.

This keeps the boundary rather than bending it. The rule is that schema-write capability must not sit in the *long-running* application container; a container whose entire lifetime is the migration is the same shape as a CI job. Do not move `MIGRATION_DATABASE_URL` into the `kind-robots` service to simplify the file — that hands a permanently-running web process the ability to drop tables, and `utils/scripts/verifyMigrateOnDeploy.ts` fails the build if you do.

That contract also pins the runtime image carrying `prisma/`, `scripts/` and `prisma.config.ts`. The image originally shipped only `.output`, `node_modules` and `package.json`, which is why migrations could not run from it at all and had to be run by hand from a repo checkout on the host — against whatever revision that checkout happened to be on. An image-slimming pass that drops them would silently reintroduce that.

### Running a migration by hand

Still supported, from a repo checkout with dependencies installed:

```bash
MIGRATION_DATABASE_URL='mysql://kindrobot_migrate:PASSWORD@HOST:5544/DBNAME' \
DATABASE_SSL_CA_BASE64="$(grep -m1 '^DATABASE_SSL_CA_BASE64=' .env | cut -d= -f2-)" \
npx prisma migrate status     # read-only; lists what is pending
```

Then swap `npx prisma migrate status` for `node scripts/prisma-migrate-deploy.mjs` to apply. Pass a plain `mysql://` URL with no SSL parameters — the wrapper writes the CA to a temporary file and appends `sslcert`/`sslaccept=strict` itself, then removes it.