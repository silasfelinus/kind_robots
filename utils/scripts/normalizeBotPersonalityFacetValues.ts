// /utils/scripts/normalizeBotPersonalityFacetValues.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

async function main(): Promise<void> {
  const profiles = await prisma.facetProfile.findMany({
    where: {
      taxonomy: 'PERSONALITY',
      canonicalValue: { startsWith: 'personality:' },
    },
    select: {
      facetId: true,
      canonicalValue: true,
      metadata: true,
    },
  })

  const updates = profiles.flatMap((profile) => {
    const metadata = parseMetadata(profile.metadata)
    const builderValue =
      typeof metadata.builderValue === 'string'
        ? metadata.builderValue.trim()
        : ''
    return builderValue
      ? [{ facetId: profile.facetId, from: profile.canonicalValue, to: builderValue }]
      : []
  })

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          taxonomy: 'PERSONALITY',
          updates,
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  for (const update of updates) {
    await prisma.facetProfile.update({
      where: { facetId: update.facetId },
      data: { canonicalValue: update.to },
    })
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        taxonomy: 'PERSONALITY',
        normalized: updates.length,
      },
      null,
      2,
    )}\n`,
  )
}

await main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
