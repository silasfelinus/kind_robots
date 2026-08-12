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
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
})
