// /utils/scripts/applyFacetCatalogDirectives.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-catalog-directives-09'

type JsonObject = Record<string, unknown>

type MergeDefinition = {
  canonicalSlug: string
  finalSlug?: string
  duplicateSlugs: readonly string[]
  aliases: readonly string[]
  title?: string
  taxonomy: FacetTaxonomy
  canonicalValue?: string
  groupKey: string
  groupLabel: string
  randomWeight: number
  description?: string
}

type AtmosphereDefinition = {
  slug: string
  title: string
}

const MERGES: readonly MergeDefinition[] = [
  {
    canonicalSlug: 'afrofuturism',
    duplicateSlugs: ['africanfuturism'],
    aliases: ['Africanfuturism', 'African Futurism'],
    taxonomy: 'GENRE',
    canonicalValue: 'Afrofuturism',
    groupKey: 'cultural-genre',
    groupLabel: 'Cultural Genres',
    randomWeight: 1.5,
    description:
      'Speculative work expressed through African and Black cultural lenses, including Africa-centered and diasporic futures shaped by identity, agency, freedom, technology, history, art, and liberated possibility.',
  },
  {
    canonicalSlug: 'biopunk',
    duplicateSlugs: ['art-punk-biopunk'],
    aliases: ['Biopunk Aesthetic', 'Biopunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Biopunk',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'dieselpunk',
    duplicateSlugs: ['art-punk-dieselpunk'],
    aliases: ['Dieselpunk Aesthetic', 'Dieselpunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Dieselpunk',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'mythpunk',
    duplicateSlugs: ['art-punk-mythpunk'],
    aliases: ['Mythpunk Aesthetic', 'Mythpunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Mythpunk',
    groupKey: 'cultural-genre',
    groupLabel: 'Cultural Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'nanopunk',
    duplicateSlugs: ['art-punk-nanopunk'],
    aliases: ['Nanopunk Aesthetic', 'Nanopunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Nanopunk',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'solarpunk',
    duplicateSlugs: ['art-punk-solarpunk'],
    aliases: ['Solarpunk Aesthetic', 'Solarpunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Solarpunk',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'steampunk',
    duplicateSlugs: ['art-punk-steampunk'],
    aliases: ['Steampunk Aesthetic', 'Steampunk Style'],
    taxonomy: 'GENRE',
    canonicalValue: 'Steampunk',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
  },
  {
    canonicalSlug: 'circuscore',
    finalSlug: 'circus',
    duplicateSlugs: ['art-punk-carnivalpunk', 'carnival', 'dark-carnival'],
    aliases: [
      'CircusCore',
      'Circuscore',
      'Circuspunk',
      'Circus Punk',
      'Carnivalpunk',
      'Carnival Punk',
      'Carnival',
      'Dark Carnival',
    ],
    title: 'Circus',
    taxonomy: 'GENRE',
    canonicalValue: 'Circus',
    groupKey: 'genre',
    groupLabel: 'Genres',
    randomWeight: 1.5,
    description:
      'Circus and carnival stories built from spectacle, performance, impossible attractions, faded glamour, dangerous wonder, and the suspicion that the show has been waiting for you.',
  },
]

const ART_ATMOSPHERES: readonly AtmosphereDefinition[] = [
  { slug: 'art-art-mood-serene', title: 'Serene Atmosphere' },
  { slug: 'art-art-mood-joyful', title: 'Joyful Atmosphere' },
  { slug: 'art-art-mood-melancholy', title: 'Melancholy Atmosphere' },
  { slug: 'art-art-mood-ominous', title: 'Ominous Atmosphere' },
  { slug: 'art-art-mood-epic', title: 'Grand Scale' },
  { slug: 'art-art-mood-whimsical', title: 'Whimsical Atmosphere' },
  { slug: 'art-art-mood-tense', title: 'Tense Atmosphere' },
  { slug: 'art-art-mood-dreamy', title: 'Dreamlike Atmosphere' },
]

const NARRATIVE_TONES = [
  'candlelit-intimacy',
  'emotionally-intimate',
  'tender',
  'whimsical-tone',
] as const

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

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function legacyKindForTaxonomy(
  taxonomy: FacetTaxonomy,
): 'GENRE' | 'THEME' | 'STYLE' | 'ART_DIRECTION' | 'OTHER' {
  switch (taxonomy) {
    case 'GENRE':
      return 'GENRE'
    case 'THEME':
      return 'THEME'
    case 'STYLE':
      return 'STYLE'
    case 'ART_DIRECTION':
      return 'ART_DIRECTION'
    default:
      return 'OTHER'
  }
}

async function findCanonical(definition: MergeDefinition) {
  const finalSlug = definition.finalSlug ?? definition.canonicalSlug
  return (
    (await prisma.facet.findUnique({ where: { slug: finalSlug } })) ??
    (await prisma.facet.findUnique({
      where: { slug: definition.canonicalSlug },
    }))
  )
}

async function hasArtwork(facet: {
  id: number
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  artImageId: number | null
  artCollectionId: number | null
}): Promise<boolean> {
  if (
    facet.imagePath ||
    facet.cardPath ||
    facet.heroPath ||
    facet.iconPath ||
    facet.icon ||
    facet.artImageId !== null ||
    facet.artCollectionId !== null
  ) {
    return true
  }

  const [imageLinks, collectionLinks] = await Promise.all([
    prisma.facetArtImage.count({ where: { facetId: facet.id } }),
    prisma.facetArtCollection.count({ where: { facetId: facet.id } }),
  ])
  return imageLinks > 0 || collectionLinks > 0
}

async function installAliases(facetId: number, aliases: readonly string[]): Promise<void> {
  if (!apply) return

  for (const alias of uniqueStrings([...aliases])) {
    const lookupKey = normalizeFacetLookupKey(alias)
    if (!lookupKey) continue

    const conflict = await prisma.facetAlias.findUnique({
      where: { lookupKey },
      select: { facetId: true },
    })
    if (conflict && conflict.facetId !== facetId) {
      await prisma.facetAlias.delete({ where: { lookupKey } })
    }

    await prisma.facetAlias.upsert({
      where: { lookupKey },
      create: {
        facetId,
        alias,
        lookupKey,
        isCanonical: false,
        isActive: true,
      },
      update: {
        facetId,
        alias,
        isCanonical: false,
        isActive: true,
      },
    })
  }
}

async function migrateDuplicate(
  definition: MergeDefinition,
  duplicateSlug: string,
): Promise<object> {
  const canonical = await findCanonical(definition)
  if (!canonical) {
    throw new Error(
      `Missing canonical Facet ${definition.finalSlug ?? definition.canonicalSlug}.`,
    )
  }

  const duplicate = await prisma.facet.findUnique({
    where: { slug: duplicateSlug },
  })
  if (!duplicate || duplicate.id === canonical.id) {
    return {
      canonicalId: canonical.id,
      duplicateSlug,
      action: 'already-merged',
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
    prisma.facetAlias.findMany({ where: { facetId: duplicate.id } }),
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
    duplicateId: duplicate.id,
    duplicateSlug,
    characterLinks: characterLinks.length,
    botLinks: botLinks.length,
    rewardLinks: rewardLinks.length,
    dreamLinks: dreamLinks.length,
    scenarioLinks: scenarioLinks.length,
    artImageLinks: artImageLinks.length + (duplicate.artImageId ? 1 : 0),
    artCollectionLinks:
      artCollectionLinks.length + (duplicate.artCollectionId ? 1 : 0),
    relations: relations.length,
    reactions: reactionCount,
    action: apply ? 'merged-and-deleted' : 'would-merge-and-delete',
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

  const artImageIds = new Set([
    ...artImageLinks.map((link) => link.artImageId),
    ...(duplicate.artImageId ? [duplicate.artImageId] : []),
  ])
  if (artImageIds.size) {
    await prisma.facetArtImage.createMany({
      data: [...artImageIds].map((artImageId) => ({
        facetId: canonical.id,
        artImageId,
      })),
      skipDuplicates: true,
    })
  }

  const artCollectionIds = new Set([
    ...artCollectionLinks.map((link) => link.artCollectionId),
    ...(duplicate.artCollectionId ? [duplicate.artCollectionId] : []),
  ])
  if (artCollectionIds.size) {
    await prisma.facetArtCollection.createMany({
      data: [...artCollectionIds].map((artCollectionId) => ({
        facetId: canonical.id,
        artCollectionId,
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

  const canonicalMetadata = parseMetadata(canonicalProfile?.metadata)
  const duplicateMetadata = parseMetadata(duplicateProfile?.metadata)
  const priorMergedSources = Array.isArray(canonicalMetadata.mergedFacetSources)
    ? canonicalMetadata.mergedFacetSources
    : []
  const priorArtworkPaths = Array.isArray(canonicalMetadata.mergedArtworkPaths)
    ? canonicalMetadata.mergedArtworkPaths.filter(
        (value): value is string => typeof value === 'string',
      )
    : []
  const mergedArtworkPaths = uniqueStrings([
    ...priorArtworkPaths,
    duplicate.imagePath,
    duplicate.cardPath,
    duplicate.heroPath,
    duplicate.iconPath,
    duplicate.icon,
  ])

  const circusCardPath =
    (definition.finalSlug ?? definition.canonicalSlug) === 'circus' &&
    duplicateSlug === 'carnival'
      ? duplicate.imagePath
      : null

  await prisma.facet.update({
    where: { id: canonical.id },
    data: {
      description: canonical.description || duplicate.description,
      flavorText: canonical.flavorText || duplicate.flavorText,
      examples: canonical.examples || duplicate.examples,
      artPrompt: canonical.artPrompt || duplicate.artPrompt,
      imagePath: canonical.imagePath || duplicate.imagePath,
      cardPath: canonical.cardPath || circusCardPath || duplicate.cardPath,
      heroPath: canonical.heroPath || duplicate.heroPath,
        iconPath: canonical.iconPath || duplicate.iconPath,
      icon: canonical.icon || duplicate.icon,
      artImageId: canonical.artImageId ?? duplicate.artImageId,
      artCollectionId:
        canonical.artCollectionId ?? duplicate.artCollectionId,
      isActive: true,
    },
  })

  const mergedMetadata = JSON.stringify({
    ...duplicateMetadata,
    ...canonicalMetadata,
    mergedArtworkPaths,
    mergedFacetSources: [
      ...priorMergedSources,
      {
        batchId: BATCH_ID,
        facetId: duplicate.id,
        slug: duplicate.slug,
        title: duplicate.title,
        taxonomy: duplicateProfile?.taxonomy,
        metadata: duplicateMetadata,
      },
    ],
  })

  await prisma.facetProfile.upsert({
    where: { facetId: canonical.id },
    create: {
      facetId: canonical.id,
      taxonomy: canonicalProfile?.taxonomy ?? duplicateProfile?.taxonomy ?? 'GENRE',
      canonicalValue:
        canonicalProfile?.canonicalValue ??
        duplicateProfile?.canonicalValue ??
        canonical.title,
      groupKey: canonicalProfile?.groupKey ?? duplicateProfile?.groupKey,
      groupLabel: canonicalProfile?.groupLabel ?? duplicateProfile?.groupLabel,
      sortOrder: canonicalProfile?.sortOrder ?? duplicateProfile?.sortOrder ?? 0,
      isRandomizable:
        canonicalProfile?.isRandomizable ?? duplicateProfile?.isRandomizable ?? true,
      randomWeight: Math.max(
        canonicalProfile?.randomWeight ?? 0,
        duplicateProfile?.randomWeight ?? 0,
      ),
      artRequired:
        canonicalProfile?.artRequired ?? duplicateProfile?.artRequired ?? true,
      sourceRank: Math.min(
        canonicalProfile?.sourceRank ?? 100,
        duplicateProfile?.sourceRank ?? 100,
      ),
      metadata: mergedMetadata,
    },
    update: {
      sourceRank: Math.min(
        canonicalProfile?.sourceRank ?? 100,
        duplicateProfile?.sourceRank ?? 100,
      ),
      metadata: mergedMetadata,
    },
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
    prisma.facetProfile.deleteMany({ where: { facetId: duplicate.id } }),
  ])
  await prisma.facet.delete({ where: { id: duplicate.id } })

  await installAliases(canonical.id, [
    duplicateSlug,
    duplicate.title,
    ...duplicateAliases.map((alias) => alias.alias),
  ])

  return report
}

async function finalizeCanonical(definition: MergeDefinition): Promise<object> {
  const facet = await findCanonical(definition)
  if (!facet) {
    throw new Error(
      `Missing canonical Facet ${definition.finalSlug ?? definition.canonicalSlug}.`,
    )
  }
  const profile = await prisma.facetProfile.findUnique({
    where: { facetId: facet.id },
  })
  const finalSlug = definition.finalSlug ?? definition.canonicalSlug
  const finalTitle = definition.title ?? facet.title

  if (apply) {
    const conflict = await prisma.facet.findUnique({ where: { slug: finalSlug } })
    if (conflict && conflict.id !== facet.id) {
      throw new Error(`Final slug ${finalSlug} is still owned by Facet ${conflict.id}.`)
    }

    await prisma.facet.update({
      where: { id: facet.id },
      data: {
        title: finalTitle,
        slug: finalSlug,
        kind: legacyKindForTaxonomy(definition.taxonomy),
        description: definition.description ?? facet.description,
        isActive: true,
      },
    })

    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? finalTitle,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: 1,
        metadata: JSON.stringify({
          ...parseMetadata(profile?.metadata),
          catalogDirective: {
            batchId: BATCH_ID,
            action: 'canonicalize-and-delete-duplicates',
            aliases: definition.aliases,
          },
        }),
      },
      update: {
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? finalTitle,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: 1,
        metadata: JSON.stringify({
          ...parseMetadata(profile?.metadata),
          catalogDirective: {
            batchId: BATCH_ID,
            action: 'canonicalize-and-delete-duplicates',
            aliases: definition.aliases,
          },
        }),
      },
    })

    await installAliases(facet.id, [
      definition.canonicalSlug,
      finalSlug,
      facet.title,
      finalTitle,
      ...definition.aliases,
    ])
  }

  return {
    facetId: facet.id,
    fromSlug: definition.canonicalSlug,
    toSlug: finalSlug,
    title: finalTitle,
    taxonomy: definition.taxonomy,
    action: apply ? 'canonicalized' : 'would-canonicalize',
  }
}

async function applyMergeDefinition(definition: MergeDefinition): Promise<object> {
  const duplicateResults = []
  for (const duplicateSlug of definition.duplicateSlugs) {
    duplicateResults.push(await migrateDuplicate(definition, duplicateSlug))
  }
  return {
    canonical: await finalizeCanonical(definition),
    duplicates: duplicateResults,
  }
}

async function reclassifyArtAtmospheres(): Promise<object[]> {
  const results = []
  for (const definition of ART_ATMOSPHERES) {
    const facet = await prisma.facet.findUnique({
      where: { slug: definition.slug },
    })
    if (!facet) {
      results.push({ slug: definition.slug, action: 'missing' })
      continue
    }
    const profile = await prisma.facetProfile.findUnique({
      where: { facetId: facet.id },
    })

    if (apply) {
      await prisma.facetAlias.deleteMany({ where: { facetId: facet.id } })
      await prisma.facet.update({
        where: { id: facet.id },
        data: {
          title: definition.title,
          kind: 'ART_DIRECTION',
          isActive: true,
        },
      })
      await prisma.facetProfile.upsert({
        where: { facetId: facet.id },
        create: {
          facetId: facet.id,
          taxonomy: 'ART_DIRECTION',
          canonicalValue: profile?.canonicalValue ?? definition.title,
          groupKey: 'art-atmosphere',
          groupLabel: 'Art Atmosphere',
          sortOrder: profile?.sortOrder ?? 0,
          isRandomizable: false,
          randomWeight: 0,
          artRequired: profile?.artRequired ?? true,
          sourceRank: profile?.sourceRank ?? 8,
          metadata: JSON.stringify({
            ...parseMetadata(profile?.metadata),
            catalogDirective: {
              batchId: BATCH_ID,
              action: 'move-mood-to-art-direction',
            },
          }),
        },
        update: {
          taxonomy: 'ART_DIRECTION',
          groupKey: 'art-atmosphere',
          groupLabel: 'Art Atmosphere',
          isRandomizable: false,
          randomWeight: 0,
          metadata: JSON.stringify({
            ...parseMetadata(profile?.metadata),
            catalogDirective: {
              batchId: BATCH_ID,
              action: 'move-mood-to-art-direction',
            },
          }),
        },
      })
      await installAliases(facet.id, [definition.slug, definition.title])
    }

    results.push({
      facetId: facet.id,
      slug: definition.slug,
      title: definition.title,
      action: apply ? 'moved-to-art-direction' : 'would-move-to-art-direction',
    })
  }
  return results
}

async function reclassifyNarrativeTones(): Promise<object[]> {
  const results = []
  for (const slug of NARRATIVE_TONES) {
    const facet = await prisma.facet.findUnique({ where: { slug } })
    if (!facet) {
      results.push({ slug, action: 'missing' })
      continue
    }
    const profile = await prisma.facetProfile.findUnique({
      where: { facetId: facet.id },
    })

    if (apply) {
      await prisma.facet.update({
        where: { id: facet.id },
        data: { kind: 'THEME', isActive: true },
      })
      await prisma.facetProfile.upsert({
        where: { facetId: facet.id },
        create: {
          facetId: facet.id,
          taxonomy: 'THEME',
          canonicalValue: profile?.canonicalValue ?? facet.title,
          groupKey: 'narrative-tone',
          groupLabel: 'Narrative Tone',
          sortOrder: profile?.sortOrder ?? 0,
          isRandomizable: true,
          randomWeight: 0.5,
          artRequired: profile?.artRequired ?? false,
          sourceRank: 1,
          metadata: JSON.stringify({
            ...parseMetadata(profile?.metadata),
            catalogDirective: {
              batchId: BATCH_ID,
              action: 'move-mood-to-narrative-theme',
            },
          }),
        },
        update: {
          taxonomy: 'THEME',
          groupKey: 'narrative-tone',
          groupLabel: 'Narrative Tone',
          isRandomizable: true,
          randomWeight: 0.5,
          sourceRank: 1,
          metadata: JSON.stringify({
            ...parseMetadata(profile?.metadata),
            catalogDirective: {
              batchId: BATCH_ID,
              action: 'move-mood-to-narrative-theme',
            },
          }),
        },
      })
    }

    results.push({
      facetId: facet.id,
      slug,
      action: apply ? 'moved-to-theme' : 'would-move-to-theme',
    })
  }
  return results
}

async function renameDevotedPersonality(): Promise<object> {
  const facet = await prisma.facet.findFirst({
    where: {
      OR: [{ slug: 'personality-loyal' }, { title: 'Devoted' }],
    },
  })
  if (!facet) return { action: 'missing' }
  const profile = await prisma.facetProfile.findUnique({
    where: { facetId: facet.id },
  })

  if (apply) {
    await prisma.facetAlias.deleteMany({
      where: {
        facetId: facet.id,
        lookupKey: normalizeFacetLookupKey('Loyal'),
      },
    })
    await prisma.facet.update({
      where: { id: facet.id },
      data: {
        title: 'Devoted',
        description:
          'Commitment as a defining trait. Stays close, follows through, and treats a person, cause, or duty as part of who they are. Can become overprotective without replacing the moral-allegiance concept represented by Loyal alignment.',
        isActive: true,
      },
    })
    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: 'PERSONALITY',
        canonicalValue: 'devoted',
        groupKey: profile?.groupKey ?? 'personality',
        groupLabel: profile?.groupLabel ?? 'Personality',
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: profile?.isRandomizable ?? true,
        randomWeight: profile?.randomWeight ?? 1,
        artRequired: profile?.artRequired ?? true,
        sourceRank: profile?.sourceRank ?? 25,
        metadata: JSON.stringify({
          ...parseMetadata(profile?.metadata),
          catalogDirective: {
            batchId: BATCH_ID,
            action: 'rename-loyal-personality-to-devoted',
          },
        }),
      },
      update: {
        taxonomy: 'PERSONALITY',
        canonicalValue: 'devoted',
        metadata: JSON.stringify({
          ...parseMetadata(profile?.metadata),
          catalogDirective: {
            batchId: BATCH_ID,
            action: 'rename-loyal-personality-to-devoted',
          },
        }),
      },
    })
    await installAliases(facet.id, [
      'personality-loyal',
      'Devoted',
      'Dedicated',
      'Loyal Personality',
    ])
  }

  return {
    facetId: facet.id,
    from: facet.title,
    to: 'Devoted',
    action: apply ? 'renamed' : 'would-rename',
  }
}

async function qualifyStructuralTitles(): Promise<object[]> {
  const definitions = [
    { slug: 'bot-type-narrator', title: 'Narrator Bot Type' },
    { slug: 'dream-type-narrator', title: 'Narrator Dream Type' },
    { slug: 'bot-type-promptbot', title: 'Prompt Bot Type' },
    { slug: 'dream-type-promptbot', title: 'Prompt Bot Dream Type' },
  ] as const

  const results = []
  for (const definition of definitions) {
    const facet = await prisma.facet.findUnique({
      where: { slug: definition.slug },
    })
    if (!facet) {
      results.push({ slug: definition.slug, action: 'missing' })
      continue
    }
    if (apply) {
      await prisma.facet.update({
        where: { id: facet.id },
        data: { title: definition.title },
      })
      await installAliases(facet.id, [definition.slug, definition.title])
    }
    results.push({
      facetId: facet.id,
      slug: definition.slug,
      title: definition.title,
      action: apply ? 'qualified' : 'would-qualify',
    })
  }
  return results
}

async function reserveEpicForRarity(): Promise<object> {
  const rarity = await prisma.facet.findUnique({
    where: { slug: 'rarity-epic' },
  })
  if (!rarity) return { action: 'missing-rarity' }

  if (apply) {
    const lookupKey = normalizeFacetLookupKey('Epic')
    await prisma.facetAlias.deleteMany({
      where: {
        lookupKey,
        NOT: { facetId: rarity.id },
      },
    })
    await installAliases(rarity.id, ['rarity-epic', 'Epic'])
  }

  return {
    facetId: rarity.id,
    action: apply ? 'epic-reserved-for-rarity' : 'would-reserve-epic-for-rarity',
  }
}

async function deleteFacetCompletely(facetId: number): Promise<void> {
  if (!apply) return
  await Promise.all([
    prisma.characterFacet.deleteMany({ where: { facetId } }),
    prisma.botFacet.deleteMany({ where: { facetId } }),
    prisma.rewardFacet.deleteMany({ where: { facetId } }),
    prisma.dreamFacet.deleteMany({ where: { facetId } }),
    prisma.scenarioFacet.deleteMany({ where: { facetId } }),
    prisma.facetArtImage.deleteMany({ where: { facetId } }),
    prisma.facetArtCollection.deleteMany({ where: { facetId } }),
    prisma.facetRelation.deleteMany({
      where: { OR: [{ fromFacetId: facetId }, { toFacetId: facetId }] },
    }),
    prisma.facetAlias.deleteMany({ where: { facetId } }),
    prisma.facetProfile.deleteMany({ where: { facetId } }),
    prisma.reaction.deleteMany({ where: { facetId } }),
  ])
  await prisma.facet.delete({ where: { id: facetId } })
}

async function deleteHistoricalShells(): Promise<object> {
  const [recipeProfiles, mergedFacets] = await Promise.all([
    prisma.facetProfile.findMany({
      where: { groupKey: 'genre-recipe' },
      select: { facetId: true },
    }),
    prisma.facet.findMany({
      where: { designer: 'facet-catalog-merged' },
    }),
  ])

  const candidateIds = new Set([
    ...recipeProfiles.map((profile) => profile.facetId),
    ...mergedFacets.map((facet) => facet.id),
  ])
  const deleted: Array<{ id: number; title: string }> = []
  const preservedForArt: Array<{ id: number; title: string }> = []

  for (const facetId of candidateIds) {
    const facet = await prisma.facet.findUnique({ where: { id: facetId } })
    if (!facet) continue
    if (await hasArtwork(facet)) {
      preservedForArt.push({ id: facet.id, title: facet.title })
      continue
    }
    if (apply) await deleteFacetCompletely(facet.id)
    deleted.push({ id: facet.id, title: facet.title })
  }

  return {
    action: apply ? 'deleted' : 'would-delete',
    deleted,
    preservedForArt,
  }
}

async function main(): Promise<void> {
  const merges = []
  for (const definition of MERGES) {
    merges.push(await applyMergeDefinition(definition))
  }

  const [
    artAtmospheres,
    narrativeTones,
    devotedPersonality,
    structuralTitles,
    epicRarity,
  ] = await Promise.all([
    reclassifyArtAtmospheres(),
    reclassifyNarrativeTones(),
    renameDevotedPersonality(),
    qualifyStructuralTitles(),
    reserveEpicForRarity(),
  ])

  const historicalShells = await deleteHistoricalShells()
  const remainingMoodCount = await prisma.facetProfile.count({
    where: { taxonomy: 'MOOD' },
  })

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        merges,
        artAtmospheres,
        narrativeTones,
        devotedPersonality,
        structuralTitles,
        epicRarity,
        historicalShells,
        remainingMoodCount,
        policy: {
          duplicates:
            'Migrate every known edge and artwork reference, then physically delete the duplicate row.',
          moods:
            'No global MOOD Facets remain. Art atmosphere is ART_DIRECTION; story tone is THEME.',
          punks:
            'Punk families are canonical GENRE Facets. Former style rows become aliases and metadata on the genre.',
        },
      },
      null,
      2,
    ),
  )

  if (apply && remainingMoodCount !== 0) {
    throw new Error(`Expected zero MOOD profiles, found ${remainingMoodCount}.`)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
