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

### Applying migrations to production

`.github/workflows/migrate-production.yml` is the production lane. It is `workflow_dispatch` only, requires the literal confirmation string `migrate`, reaches the database over Tailscale, and runs `node scripts/prisma-migrate-deploy.mjs` with `MIGRATION_DATABASE_URL` from the secret store. `migrate deploy` applies pending migrations only — it never resets, drops, or generates.

This exists because migrations used to ride the Vercel build (`scripts/vercel-build.mjs` called the same wrapper) and the container path runs plain `npm run build`, so merging a migration to `main` stopped applying it anywhere once Vercel was retired.

Do not move this into the container entrypoint. A long-running application container that can execute schema changes holds a standing migration credential, which is precisely what this boundary prevents. The migration credential should exist only for the lifetime of the job that needs it.
