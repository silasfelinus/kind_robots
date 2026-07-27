// /utils/scripts/seedLegacyBotTypeFacets.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { LEGACY_BOT_TYPE_VALUES } from './../seeds/facetLegacyBotTypes'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function saveLegacyType(
  entry: (typeof LEGACY_BOT_TYPE_VALUES)[number],
  sortOrder: number,
): Promise<void> {
  const slug = `bot-type-${slugify(entry.value)}`
  const facet = await prisma.facet.upsert({
    where: { slug },
    create: {
      title: entry.label,
      slug,
      kind: 'OTHER',
      description: entry.description,
      designer: 'facet-catalog',
      creationSource: 'HUMAN',
      userId: 1,
      isPublic: true,
      isMature: false,
      isActive: true,
    },
    update: {
      title: entry.label,
      description: entry.description,
      isActive: true,
    },
  })

  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: 'BOT_TYPE',
      canonicalValue: `bot-type:${entry.value.toLowerCase()}`,
      groupKey: 'bot-type-legacy',
      groupLabel: 'Legacy Bot Types',
      sortOrder,
      isRandomizable: false,
      randomWeight: 0,
      artRequired: true,
      sourceRank: 60,
      metadata: JSON.stringify({
        source: 'legacy-bot-type',
        fieldKey: 'BotType',
        builderValue: entry.value,
        legacyValues: [entry.value],
        artworkStatus: 'missing',
      }),
    },
    update: {
      taxonomy: 'BOT_TYPE',
      canonicalValue: `bot-type:${entry.value.toLowerCase()}`,
      groupKey: 'bot-type-legacy',
      groupLabel: 'Legacy Bot Types',
      sortOrder,
      isRandomizable: false,
      randomWeight: 0,
      artRequired: true,
      sourceRank: 60,
      metadata: JSON.stringify({
        source: 'legacy-bot-type',
        fieldKey: 'BotType',
        builderValue: entry.value,
        legacyValues: [entry.value],
        artworkStatus: 'missing',
      }),
    },
  })

  for (const alias of prepareUniqueFacetAliases([
    slug,
    `bot type ${entry.value}`,
    `legacy bot type ${entry.value}`,
  ])) {
    const owner = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
      select: { facetId: true },
    })
    if (owner && owner.facetId !== facet.id) continue

    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
    })
  }
}

async function main(): Promise<void> {
  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          taxonomy: 'BOT_TYPE',
          legacyValues: LEGACY_BOT_TYPE_VALUES.map((entry) => entry.value),
          missingRequiredArt: LEGACY_BOT_TYPE_VALUES.length,
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  for (const [sortOrder, entry] of LEGACY_BOT_TYPE_VALUES.entries()) {
    await saveLegacyType(entry, sortOrder)
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        taxonomy: 'BOT_TYPE',
        saved: LEGACY_BOT_TYPE_VALUES.length,
        legacyValues: LEGACY_BOT_TYPE_VALUES.map((entry) => entry.value),
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
