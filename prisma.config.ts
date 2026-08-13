// /prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const prismaArgs = process.argv.slice(2)
const migrateIndex = prismaArgs.indexOf('migrate')
const dbIndex = prismaArgs.indexOf('db')
const requiresMigrationCredential =
  migrateIndex !== -1 ||
  (dbIndex !== -1 && ['execute', 'push'].includes(prismaArgs[dbIndex + 1] ?? ''))

const migrationDatabaseUrl = process.env.MIGRATION_DATABASE_URL?.trim()

// Only a real shadow URL, or none at all.
//
// `migrate deploy` never uses a shadow database -- it is for `migrate dev` and
// `migrate diff` -- but Prisma validates whatever is handed to it regardless, so
// passing an empty or malformed value fails a command that does not need it:
//
//   Error: P1013 ... `datasource.shadowDatabaseUrl` in `prisma.config.ts` is
//   invalid: must start with the protocol `mysql://`.
//
// That is easy to hit outside a shell. `import 'dotenv/config'` above strips
// surrounding quotes when it reads .env, and so does docker compose's
// `env_file:` -- but `docker run --env-file` does NOT, because it is not a shell
// parser. So SHADOW_DATABASE_URL="mysql://..." reaches the container with the
// quote as part of the value, and a production migration run out of the image
// dies on a variable it was never going to use. Strip the quotes, and omit the
// key entirely when there is nothing usable.
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL?.trim().replace(
  /^(["'])(.*)\1$/,
  '$2',
)

if (requiresMigrationCredential && !migrationDatabaseUrl) {
  throw new Error(
    'MIGRATION_DATABASE_URL is required for Prisma migration/schema-write commands. DATABASE_URL is intentionally not accepted for this operation.',
  )
}

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationDatabaseUrl || env('DATABASE_URL'),
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
})
