// /utils/scripts/mergeCanonicalFacetDuplicates.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

type MergeDefinition = {
  canonicalSlug: string
  duplicateSlug: string
  aliases: string[]
}

const MERGES: MergeDefinition[] = [
  {
    canonicalSlug: 'tardigrade',
    duplicateSlug: 'water-bear',
    aliases: ['Water Bear'],
  },
]

async function mergeDefinition(definition: MergeDefinition): Promise<object> {
  const canonical = await prisma.facet.findUnique({
    where: { slug: definition.canonicalSlug },
  })

  if (!canonical) {
    throw new Error(
      `Canonical Facet ${definition.canonicalSlug} does not exist after catalog seed.`,
    )
  }

  const duplicate =
    (await prisma.facet.findUnique({
      where: { slug: definition.duplicateSlug },
    })) ??
    (await prisma.facet.findFirst({
      where: {
        id: { not: canonical.id },
        title: { equals: 'Water Bear' },
        isActive: true,
      },
      orderBy: { id: 'asc' },
    }))

  const aliases = definition.aliases.map((alias) => ({
    alias,
    lookupKey: normalizeFacetLookupKey(alias),
  }))

  if (!duplicate) {
    if (apply) {
      for (const alias of aliases) {
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
      aliases: aliases.map((alias) => alias.alias),
      action: apply ? 'aliases-verified' : 'would-verify-aliases',
    }
  }

  const [
    characterLinks,
    dreamLinks,
    scenarioLinks,
    artImageLinks,
    artCollectionLinks,
    relations,
    reactionCount,
  ] = await Promise.all([
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
    duplicateId: duplicate.id,
    characterLinks: characterLinks.length,
    dreamLinks: dreamLinks.length,
    scenarioLinks: scenarioLinks.length,
    artImageLinks: artImageLinks.length,
    artCollectionLinks: artCollectionLinks.length,
    relations: relations.length,
    reactions: reactionCount,
    aliases: aliases.map((alias) => alias.alias),
    action: apply ? 'merged' : 'would-merge',
  }

  if (!apply) return report

  if (characterLinks.length > 0) {
    await prisma.characterFacet.createMany({
      data: characterLinks.map((link) => ({
        ...link,
        facetId: canonical.id,
      })),
      skipDuplicates: true,
    })
  }
  if (dreamLinks.length > 0) {
    await prisma.dreamFacet.createMany({
      data: dreamLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (scenarioLinks.length > 0) {
    await prisma.scenarioFacet.createMany({
      data: scenarioLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (artImageLinks.length > 0) {
    await prisma.facetArtImage.createMany({
      data: artImageLinks.map((link) => ({ ...link, facetId: canonical.id })),
      skipDuplicates: true,
    })
  }
  if (artCollectionLinks.length > 0) {
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

  if (mappedRelations.length > 0) {
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
      title: 'Tardigrade',
      slug: 'tardigrade',
      kind: 'ANIMAL',
      description: canonical.description || duplicate.description,
      imagePath: canonical.imagePath || duplicate.imagePath,
      icon: canonical.icon || duplicate.icon,
      artImageId: canonical.artImageId ?? duplicate.artImageId,
      artCollectionId:
        canonical.artCollectionId ?? duplicate.artCollectionId,
      isActive: true,
    },
  })

  await prisma.facetProfile.updateMany({
    where: { facetId: canonical.id },
    data: {
      taxonomy: 'ANIMAL',
      canonicalValue: 'Tardigrade',
      isRandomizable: true,
      randomWeight: 1,
      artRequired: true,
    },
  })

  for (const alias of aliases) {
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
        mergedIntoFacetId: canonical.id,
        canonicalSlug: definition.canonicalSlug,
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
  process.stdout.write(`${JSON.stringify({ mode: apply ? 'apply' : 'dry-run', results }, null, 2)}\n`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
