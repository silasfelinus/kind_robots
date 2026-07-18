// scripts/exportRewards.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

// SSL-aware adapter (see server/utils/prisma.ts) — ProxySQL enforces TLS.
const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })

async function main() {
  const rows = await prisma.$queryRaw`SELECT * FROM Reward ORDER BY id ASC`
  console.log(
    JSON.stringify(rows, (_, v) => (typeof v === 'bigint' ? Number(v) : v), 2),
  )
}

main().finally(() => prisma.$disconnect())
