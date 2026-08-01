// /utils/scripts/mergeFacetPersonalitySynonyms.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-personality-synonyms-04'

type JsonObject = Record<string, unknown>

type MergeDefinition = {
  canonicalSlug: string
  duplicateSlug: string
  aliases: readonly string[]
}

const MERGES: readonly MergeDefinition[] = [
  {
    canonicalSlug: 'optimist',
    duplicateSlug: 'optimistic',
    aliases: ['Optimistic'],
  },
  {
    canonicalSlug: 'pessimist',
    duplicateSlug: 'pessimistic',
    aliases: ['Pessimistic'],
  },
  {
    canonicalSlug: 'melancholy',
    duplicateSlug: 'personality-melancholic',
    aliases: ['Melancholic'],
  },
  {
    canonicalSlug: 'inquisitive',
    duplicateSlug: 'personality-curious',
    aliases: ['Curious'],
  },
  {
    canonicalSlug: 'scatter-brained',
    duplicateSlug: 'personality-scattered',
    aliases: ['Scattered'],
  },
]

function parseMetadata(value: string | null | undefined): JsonObject {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : {}
  } catch {
    return {}
  }
}

function bestSourceRank(...values: Array<number | null | undefined>): number {
  const ranks = values.filter(
    (value): value is number => Number.isInteger(value) && Number(value) >= 0,
  )
  return ranks.length ? Math.min(...ranks) : 100
}

function mergedMetadata(options: {
  canonicalMetadata?: string | null
  duplicateMetadata?: string | null
  canonicalId: number
  duplicateId: number
  canonicalSlug: string
  duplicateSlug: string
}): string {
  const canonical = parseMetadata(options.canonicalMetadata)
  const duplicate = parseMetadata(options.duplicateMetadata)
  const history = Array.isArray(canonical.catalogCurationHistory)
    ? canonical.catalogCurationHistory.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'batchId' in entry &&
            entry.batchId === BATCH_ID
          ),
      )
    : []

  return JSON.stringify({
    ...duplicate,
    ...canonical,
    catalogCurationHistory: [
      ...history,
      {
        batchId: BATCH_ID,
        action: 'merge-exact-synonym',
        canonicalFacetId: options.canonicalId,
        duplicateFacetId: options.duplicateId,
        canonicalSlug: options.canonicalSlug,
        duplicateSlug: options.duplicateSlug,
      },
    ],
  })
}

async function mergeDefinition(definition: MergeDefinition): Promise<object> {
  const canonical = await prisma.facet.findUnique({
    where: { slug: definition.canonicalSlug },
  })
  if (!canonical) {
    throw new Error(`Canonical Facet ${definition.canonicalSlug} does not exist.`)
  }

  const duplicate = await prisma.facet.findUnique({
    where: { slug: definition.duplicateSlug },
  })

  const requestedAliases = [
    definition.duplicateSlug,
    ...definition.aliases,
  ].map((alias) => ({
    alias,
    lookupKey: normalizeFacetLookupKey(alias),
  }))

  if (!duplicate) {
    if (apply) {
      for (const alias of requestedAliases) {
        await prisma.facetAlias.upsert({
          where: { lookupKey: alias.lookupKey },
          create: {
            facetId: canonical.id,
            alias: alias.alias,
            lookupKey: alias.lookupKey,
            isCanonical: false,
            isActive: true,
          },
          update: {
            facetId: canonical.id,
            alias: alias.alias,
            isCanonical: false,
            isActive: true,
          },
        })
      }
    }
    return {
      canonicalId: canonical.id,
      duplicateId: null,
      action: apply ? 'aliases-verified' : 'would-verify-aliases',
    }
  }

  const [
    canonicalProfile,
    duplicateProfile,
    duplicateAliases,
    characterLinks,
    botLinks,
    rewardLinks,
    dreamLinks,
    scenarioLinks,
    artImageLinks,
    artCollectionLinks,
    relations,
    reactionCount,
  ] = await Promise.all([
    prisma.facetProfile.findUnique({ where: { facetId: canonical.id } }),
    prisma.facetProfile.findUnique({ where: { facetId: duplicate.id } }),
    prisma.facetAlias.findMany({
      where: { facetId: duplicate.id },
      select: { alias: true, lookupKey: true },
    }),
    prisma.characterFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        characterId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.botFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        botId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.rewardFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        rewardId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.dreamFacet.findMany({
      where: { facetId: duplicate.id },
      select: { dreamId: true },
    }),
    prisma.scenarioFacet.findMany({
      where: { facetId: duplicate.id },
      select: { scenarioId: true },
    }),
    prisma.facetArtImage.findMany({
      where: { facetId: duplicate.id },
      select: { artImageId: true },
    }),
    prisma.facetArtCollection.findMany({
      where: { facetId: duplicate.id },
      select: { artCollectionId: true },
    }),
    prisma.facetRelation.findMany({
      where: {
        OR: [{ fromFacetId: duplicate.id }, { toFacetId: duplicate.id }],
      },
      select: {
        fromFacetId: true,
        toFacetId: true,
        relationType: true,
        note: true,
      },
    }),
    prisma.reaction.count({ where: { facetId: duplicate.id } }),
  ])

  const report = {
    canonicalId: canonical.id,
    canonicalTitle: canonical.title,
    duplicateId: duplicate.id,
    duplicateTitle: duplicate.title,
    characterLinks: characterLinks.length,
    botLinks: botLinks.length,
    rewardLinks: rewardLinks.length,
    dreamLinks: dreamLinks.length,
    scenarioLinks: scenarioLinks.length,
    artImageLinks: artImageLinks.length,
    artCollectionLinks: artCollectionLinks.length,
    relations: relations.length,
    reactions: reactionCount,
    aliases: [
      ...duplicateAliases.map((alias) => alias.alias),
      ...definition.aliases,
    ],
    action: apply ? 'merged' : 'would-merge',
  }

  if (!apply) return report

  if (characterLinks.length) {
    await prisma.characterFacet.createMany({
      data: characterLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (botLinks.length) {
    await prisma.botFacet.createMany({
      data: botLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (rewardLinks.length) {
    await prisma.rewardFacet.createMany({
      data: rewardLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (dreamLinks.length) {
    await prisma.dreamFacet.createMany({
      data: dreamLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (scenarioLinks.length) {
    await prisma.scenarioFacet.createMany({
      data: scenarioLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (artImageLinks.length) {
    await prisma.facetArtImage.createMany({
      data: artImageLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (artCollectionLinks.length) {
    await prisma.facetArtCollection.createMany({
      data: artCollectionLinks.map((link) => ({
        ...link,
        facetId: canonical.id,
      })),
      skipDuplicates: true,
    })
  }

  const mappedRelations = relations
    .map((relation) => ({
      ...relation,
      fromFacetId:
        relation.fromFacetId === duplicate.id
          ? canonical.id
          : relation.fromFacetId,
      toFacetId:
        relation.toFacetId === duplicate.id ? canonical.id : relation.toFacetId,
    }))
    .filter((relation) => relation.fromFacetId !== relation.toFacetId)

  if (mappedRelations.length) {
    await prisma.facetRelation.createMany({
      data: mappedRelations,
      skipDuplicates: true,
    })
  }

  await prisma.reaction.updateMany({
    where: { facetId: duplicate.id },
    data: { facetId: canonical.id },
  })

  await Promise.all([
    prisma.characterFacet.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.botFacet.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.rewardFacet.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.dreamFacet.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.scenarioFacet.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.facetArtImage.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.facetArtCollection.deleteMany({ where: { facetId: duplicate.id } }),
    prisma.facetRelation.deleteMany({
      where: {
        OR: [{ fromFacetId: duplicate.id }, { toFacetId: duplicate.id }],
      },
    }),
    prisma.facetAlias.deleteMany({ where: { facetId: duplicate.id } }),
  ])

  await prisma.facet.update({
    where: { id: canonical.id },
    data: {
      description: canonical.description || duplicate.description,
      flavorText: canonical.flavorText || duplicate.flavorText,
      examples: canonical.examples || duplicate.examples,
      artPrompt: canonical.artPrompt || duplicate.artPrompt,
      imagePath: canonical.imagePath || duplicate.imagePath,
      cardPath: canonical.cardPath || duplicate.cardPath,
      heroPath: canonical.heroPath || duplicate.heroPath,
      icon: canonical.icon || duplicate.icon,
      artImageId: canonical.artImageId ?? duplicate.artImageId,
      artCollectionId:
        canonical.artCollectionId ?? duplicate.artCollectionId,
      isActive: true,
    },
  })

  await prisma.facetProfile.upsert({
    where: { facetId: canonical.id },
    create: {
      facetId: canonical.id,
      taxonomy: 'PERSONALITY',
      canonicalValue:
        canonicalProfile?.canonicalValue || canonical.title.toLowerCase(),
      groupKey: canonicalProfile?.groupKey ?? duplicateProfile?.groupKey ?? 'personality',
      groupLabel:
        canonicalProfile?.groupLabel ?? duplicateProfile?.groupLabel ?? 'Personality',
      sortOrder: canonicalProfile?.sortOrder ?? duplicateProfile?.sortOrder ?? 0,
      isRandomizable: true,
      randomWeight: Math.max(
        canonicalProfile?.randomWeight ?? 1,
        duplicateProfile?.randomWeight ?? 1,
      ),
      artRequired:
        canonicalProfile?.artRequired ?? duplicateProfile?.artRequired ?? true,
      sourceRank: bestSourceRank(
        canonicalProfile?.sourceRank,
        duplicateProfile?.sourceRank,
      ),
      metadata: mergedMetadata({
        canonicalMetadata: canonicalProfile?.metadata,
        duplicateMetadata: duplicateProfile?.metadata,
        canonicalId: canonical.id,
        duplicateId: duplicate.id,
        canonicalSlug: definition.canonicalSlug,
        duplicateSlug: definition.duplicateSlug,
      }),
    },
    update: {
      taxonomy: 'PERSONALITY',
      canonicalValue:
        canonicalProfile?.canonicalValue || canonical.title.toLowerCase(),
      groupKey: canonicalProfile?.groupKey ?? duplicateProfile?.groupKey ?? 'personality',
      groupLabel:
        canonicalProfile?.groupLabel ?? duplicateProfile?.groupLabel ?? 'Personality',
      sortOrder: canonicalProfile?.sortOrder ?? duplicateProfile?.sortOrder ?? 0,
      isRandomizable: true,
      randomWeight: Math.max(
        canonicalProfile?.randomWeight ?? 1,
        duplicateProfile?.randomWeight ?? 1,
      ),
      artRequired:
        canonicalProfile?.artRequired ?? duplicateProfile?.artRequired ?? true,
      sourceRank: bestSourceRank(
        canonicalProfile?.sourceRank,
        duplicateProfile?.sourceRank,
      ),
      metadata: mergedMetadata({
        canonicalMetadata: canonicalProfile?.metadata,
        duplicateMetadata: duplicateProfile?.metadata,
        canonicalId: canonical.id,
        duplicateId: duplicate.id,
        canonicalSlug: definition.canonicalSlug,
        duplicateSlug: definition.duplicateSlug,
      }),
    },
  })

  const allAliases = new Map<string, string>()
  for (const alias of [
    ...duplicateAliases,
    ...requestedAliases,
    {
      alias: duplicate.title,
      lookupKey: normalizeFacetLookupKey(duplicate.title),
    },
  ]) {
    if (alias.lookupKey) allAliases.set(alias.lookupKey, alias.alias)
  }

  for (const [lookupKey, alias] of allAliases) {
    await prisma.facetAlias.upsert({
      where: { lookupKey },
      create: {
        facetId: canonical.id,
        alias,
        lookupKey,
        isCanonical: false,
        isActive: true,
      },
      update: {
        facetId: canonical.id,
        alias,
        isCanonical: false,
        isActive: true,
      },
    })
  }

  await prisma.facet.update({
    where: { id: duplicate.id },
    data: {
      slug: `${definition.duplicateSlug}-merged-${duplicate.id}`,
      isActive: false,
      designer: 'facet-catalog-merged',
    },
  })

  await prisma.facetProfile.updateMany({
    where: { facetId: duplicate.id },
    data: {
      isRandomizable: false,
      randomWeight: 0,
      artRequired: false,
      metadata: JSON.stringify({
        ...parseMetadata(duplicateProfile?.metadata),
        mergedIntoFacetId: canonical.id,
        canonicalSlug: definition.canonicalSlug,
        batchId: BATCH_ID,
      }),
    },
  })

  return report
}

async function main(): Promise<void> {
  const results = []
  for (const definition of MERGES) {
    results.push(await mergeDefinition(definition))
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        results,
        policy:
          'Only exact personality synonyms are merged. Canonical art and prose win; duplicate content and every assignment, reaction, alias, relation, and artwork link are preserved or migrated.',
      },
      null,
      2,
    )}\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
