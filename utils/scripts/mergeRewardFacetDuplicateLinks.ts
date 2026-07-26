// /utils/scripts/mergeRewardFacetDuplicateLinks.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

const MERGES = [
  { canonicalSlug: 'tardigrade', duplicateSlug: 'water-bear' },
] as const

async function mergeRewardLinks(definition: (typeof MERGES)[number]) {
  const [canonical, duplicate] = await Promise.all([
    prisma.facet.findUnique({
      where: { slug: definition.canonicalSlug },
      select: { id: true },
    }),
    prisma.facet.findUnique({
      where: { slug: definition.duplicateSlug },
      select: { id: true },
    }),
  ])

  if (!canonical || !duplicate) {
    return {
      canonicalId: canonical?.id ?? null,
      duplicateId: duplicate?.id ?? null,
      rewardLinks: 0,
      action: 'nothing-to-merge',
    }
  }

  const links = await prisma.rewardFacet.findMany({
    where: { facetId: duplicate.id },
    select: {
      rewardId: true,
      fieldKey: true,
      sortOrder: true,
      weight: true,
      source: true,
    },
  })

  if (apply && links.length) {
    await prisma.$transaction(async (tx) => {
      await tx.rewardFacet.createMany({
        data: links.map((link) => ({
          ...link,
          facetId: canonical.id,
        })),
        skipDuplicates: true,
      })
      await tx.rewardFacet.deleteMany({ where: { facetId: duplicate.id } })
    })
  }

  return {
    canonicalId: canonical.id,
    duplicateId: duplicate.id,
    rewardLinks: links.length,
    action: apply ? 'merged' : 'would-merge',
  }
}

try {
  const results = []
  for (const definition of MERGES) {
    results.push(await mergeRewardLinks(definition))
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', results }, null, 2))
} finally {
  await prisma.$disconnect()
}
