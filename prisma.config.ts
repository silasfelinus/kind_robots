// /prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Prisma 7 supports multi-file schemas when this points at the schema folder.
  // schema.prisma remains the main schema; focused additive models can live in
  // neighboring .prisma files without forcing unrelated whole-file rewrites.
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
})
