// /utils/scripts/curateFacetCulturalGenres.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-cultural-genres-03'
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  description: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  artImageId: number | null
  artCollectionId: number | null
}

type ProfileRow = {
  taxonomy: FacetTaxonomy
  canonicalValue: string | null
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: string | null
}

type EnsureDefinition = {
  slug: string
  title: string
  taxonomy: FacetTaxonomy
  randomWeight: number
  aliases?: readonly string[]
  description: string
  references?: readonly string[]
}

type RenameDefinition = {
  lookup: readonly string[]
  title: string
  slug: string
  randomWeight: number
  aliases: readonly string[]
  description: string
  relatedTo?: readonly string[]
  broadUmbrella?: boolean
}

const ENSURES: readonly EnsureDefinition[] = [
  {
    slug: 'japanese-folkloric-fantasy',
    title: 'Japanese Folkloric Fantasy',
    taxonomy: 'GENRE',
    randomWeight: 0.75,
    description:
      'Fantasy drawing specifically from Japanese folklore and spirit traditions, including yokai, kami, kappa, oni, transformed animals, haunted places, and reciprocal obligations between human and nonhuman worlds.',
  },
  {
    slug: 'everyday-animist-fantasy',
    title: 'Everyday Animist Fantasy',
    taxonomy: 'GENRE',
    randomWeight: 0.5,
    aliases: ['Everyday Spirit Fantasy'],
    description:
      'Quietly wondrous fantasy in which homes, tools, landscapes, food, weather, and ordinary places possess interior life or spiritual agency. Daily routines matter as much as spectacle.',
  },
  {
    slug: 'mythpunk',
    title: 'Mythpunk',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
    description:
      'Myth and folklore reworked through revision, resistance, hybrid identity, and deliberate disruption of inherited narrative authority.',
  },
  {
    slug: 'africanfuturism',
    title: 'Africanfuturism',
    taxonomy: 'GENRE',
    randomWeight: 1,
    description:
      'Future- and technology-oriented speculative fiction rooted first and foremost in Africa and centered on African people, places, histories, and possibilities.',
    references: ['Nnedi Okorafor: Africanfuturism Defined'],
  },
  {
    slug: 'afrofuturism',
    title: 'Afrofuturism',
    taxonomy: 'GENRE',
    randomWeight: 1,
    description:
      'Speculative work expressed through a Black cultural lens, reimagining past, present, and future around Black identity, agency, freedom, technology, art, and liberated possibility across the African diaspora.',
    references: [
      'Smithsonian National Museum of African American History and Culture: Afrofuturism',
    ],
  },
]

const RENAMES: readonly RenameDefinition[] = [
  {
    lookup: ['Asian Fantasy', 'asian-fantasy'],
    title: 'East Asian Fantasy',
    slug: 'east-asian-fantasy',
    randomWeight: 0.75,
    aliases: ['Asian Fantasy'],
    description:
      'A broad regional umbrella for fantasy shaped by East Asian settings, narrative traditions, spirit worlds, and modern magical sensibilities. Pair with a more specific culture or tradition whenever one is known.',
    relatedTo: ['japanese-folkloric-fantasy', 'everyday-animist-fantasy'],
    broadUmbrella: true,
  },
  {
    lookup: ['African Mythpunk', 'african-mythpunk'],
    title: 'African Mythic Fantasy',
    slug: 'african-mythic-fantasy',
    randomWeight: 0.75,
    aliases: ['African Mythpunk'],
    description:
      'A broad umbrella for fantasy grounded in African mythic and folkloric traditions. Pair with a specific region, people, language, or tradition whenever the source is known.',
    relatedTo: ['mythpunk'],
    broadUmbrella: true,
  },
  {
    lookup: ['Arabian Nights Redux', 'arabian-nights-redux'],
    title: 'One Thousand and One Nights Fantasy',
    slug: 'one-thousand-and-one-nights-fantasy',
    randomWeight: 0.75,
    aliases: ['Arabian Nights Redux', 'Arabian Nights Fantasy', '1001 Nights Fantasy'],
    description:
      'Fantasy inspired by the diverse tale collection One Thousand and One Nights: nested storytelling, clever narrators, merchants and courts, wondrous travel, transformations, djinn, dangerous bargains, and stories used as instruments of survival.',
  },
  {
    lookup: ['Oceanic Mythology', 'oceanic-mythology'],
    title: 'Oceanian Mythic Fantasy',
    slug: 'oceanian-mythic-fantasy',
    randomWeight: 0.75,
    aliases: ['Oceanic Mythology'],
    description:
      'A broad regional umbrella for mythic fantasy connected to Oceania and Pacific cultures. Pair with a specific Polynesian, Micronesian, Melanesian, Aboriginal Australian, or other named tradition whenever known.',
    broadUmbrella: true,
  },
  {
    lookup: [
      'Eastern European Folklore',
      'eastern-european-folklore',
    ],
    title: 'Eastern European Folkloric Fantasy',
    slug: 'eastern-european-folkloric-fantasy',
    randomWeight: 0.75,
    aliases: ['Eastern European Folklore'],
    description:
      'A broad regional umbrella for fantasy shaped by Eastern European folk traditions, uncanny landscapes, household and wilderness spirits, seasonal rites, transformations, and local supernatural beings. Pair with a more specific tradition whenever known.',
    broadUmbrella: true,
  },
]

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255)
}

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

function curatedMetadata(options: {
  previous: string | null | undefined
  action: 'ensure-cultural-genre' | 'refine-cultural-label'
  originalTitle?: string
  title: string
  artBacked: boolean
  randomWeight: number
  broadUmbrella?: boolean
  references?: readonly string[]
  relatedSlugs?: readonly string[]
}): string {
  const metadata = parseMetadata(options.previous)
  const history = Array.isArray(metadata.catalogCurationHistory)
    ? metadata.catalogCurationHistory.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'batchId' in entry &&
            entry.batchId === BATCH_ID &&
            'action' in entry &&
            entry.action === options.action
          ),
      )
    : []

  return JSON.stringify({
    ...metadata,
    culturalUmbrella: options.broadUmbrella || undefined,
    curationReferences:
      options.references?.length ? options.references : metadata.curationReferences,
    catalogCurationHistory: [
      ...history,
      {
        batchId: BATCH_ID,
        action: options.action,
        originalTitle: options.originalTitle,
        title: options.title,
        artBacked: options.artBacked,
        randomWeight: options.randomWeight,
        broadUmbrella: options.broadUmbrella,
        relatedSlugs: options.relatedSlugs,
      },
    ],
  })
}

async function findFacet(lookups: readonly string[]): Promise<FacetRow | null> {
  for (const lookup of lookups) {
    const direct = await prisma.facet.findUnique({
      where: { slug: slugify(lookup) },
    })
    if (direct) return direct

    const lookupKey = normalizeFacetLookupKey(lookup)
    if (!lookupKey) continue
    const alias = await prisma.facetAlias.findUnique({
      where: { lookupKey },
      select: { facetId: true },
    })
    if (!alias) continue

    const aliased = await prisma.facet.findUnique({
      where: { id: alias.facetId },
    })
    if (aliased) return aliased
  }
  return null
}

async function profileFor(facetId: number): Promise<ProfileRow | null> {
  return prisma.facetProfile.findUnique({ where: { facetId } })
}

async function hasArtwork(facet: FacetRow): Promise<boolean> {
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

async function installAliases(
  facet: FacetRow,
  aliases: readonly string[],
): Promise<Array<{ alias: string; existingFacetId: number }>> {
  const conflicts: Array<{ alias: string; existingFacetId: number }> = []
  const canonicalLookup = normalizeFacetLookupKey(facet.slug || facet.title)

  for (const alias of prepareUniqueFacetAliases([
    facet.slug || '',
    facet.title,
    ...aliases,
  ])) {
    const existing = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
      select: { facetId: true },
    })
    if (existing && existing.facetId !== facet.id) {
      conflicts.push({ alias: alias.alias, existingFacetId: existing.facetId })
      continue
    }
    if (!apply) continue

    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === canonicalLookup,
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isCanonical: alias.lookupKey === canonicalLookup,
        isActive: true,
      },
    })
  }

  return conflicts
}

async function ensureDefinition(
  definition: EnsureDefinition,
): Promise<{
  facet: FacetRow | null
  action: string
  artBacked: boolean
  aliasConflicts: Array<{ alias: string; existingFacetId: number }>
}> {
  let facet = await findFacet([
    definition.slug,
    definition.title,
    ...(definition.aliases ?? []),
  ])
  const existed = Boolean(facet)

  if (!facet && !apply) {
    return {
      facet: null,
      action: 'would-create',
      artBacked: false,
      aliasConflicts: [],
    }
  }

  if (!facet) {
    facet = await prisma.facet.create({
      data: {
        title: definition.title,
        slug: definition.slug,
        kind: definition.taxonomy === 'GENRE' ? 'GENRE' : 'OTHER',
        description: definition.description,
        designer: 'facet-curation',
        creationSource: 'HUMAN',
        userId: 1,
        isPublic: true,
        isMature: false,
        isActive: true,
      },
    })
  }

  const [profile, artBacked] = await Promise.all([
    profileFor(facet.id),
    hasArtwork(facet),
  ])

  if (apply) {
    await prisma.facet.update({
      where: { id: facet.id },
      data: {
        description: facet.description || definition.description,
        isActive: true,
      },
    })
    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: definition.taxonomy,
        canonicalValue: definition.title,
        groupKey: 'cultural-genre',
        groupLabel: 'Cultural Genres',
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          action: 'ensure-cultural-genre',
          title: definition.title,
          artBacked,
          randomWeight: definition.randomWeight,
          references: definition.references,
        }),
      },
      update: {
        taxonomy: definition.taxonomy,
        canonicalValue: definition.title,
        groupKey: 'cultural-genre',
        groupLabel: 'Cultural Genres',
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          action: 'ensure-cultural-genre',
          title: definition.title,
          artBacked,
          randomWeight: definition.randomWeight,
          references: definition.references,
        }),
      },
    })
  }

  const aliasConflicts = await installAliases(facet, [
    definition.slug,
    definition.title,
    ...(definition.aliases ?? []),
  ])

  return {
    facet,
    action: apply ? (existed ? 'updated' : 'created') : 'would-update',
    artBacked,
    aliasConflicts,
  }
}

async function refineDefinition(
  definition: RenameDefinition,
  targets: Map<string, FacetRow>,
): Promise<{
  id: number | null
  originalTitle: string | null
  title: string
  action: string
  artBacked: boolean
  relations: number
  aliasConflicts: Array<{ alias: string; existingFacetId: number }>
}> {
  let facet = await findFacet(definition.lookup)
  if (!facet) {
    return {
      id: null,
      originalTitle: null,
      title: definition.title,
      action: 'missing',
      artBacked: false,
      relations: 0,
      aliasConflicts: [],
    }
  }

  const originalTitle = facet.title
  const originalSlug = facet.slug || slugify(facet.title)
  const [profile, artBacked] = await Promise.all([
    profileFor(facet.id),
    hasArtwork(facet),
  ])
  const canRename = !artBacked

  if (apply) {
    facet = await prisma.facet.update({
      where: { id: facet.id },
      data: {
        title: canRename ? definition.title : facet.title,
        slug: canRename ? definition.slug : facet.slug,
        kind: 'GENRE',
        description: facet.description || definition.description,
        isActive: true,
      },
    })

    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: 'GENRE',
        canonicalValue: canRename ? definition.title : facet.title,
        groupKey: 'cultural-genre',
        groupLabel: 'Cultural Genres',
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          action: 'refine-cultural-label',
          originalTitle,
          title: canRename ? definition.title : facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
          broadUmbrella: definition.broadUmbrella,
          relatedSlugs: definition.relatedTo,
        }),
      },
      update: {
        taxonomy: 'GENRE',
        canonicalValue: canRename ? definition.title : facet.title,
        groupKey: 'cultural-genre',
        groupLabel: 'Cultural Genres',
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          action: 'refine-cultural-label',
          originalTitle,
          title: canRename ? definition.title : facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
          broadUmbrella: definition.broadUmbrella,
          relatedSlugs: definition.relatedTo,
        }),
      },
    })
  }

  const aliasConflicts = await installAliases(facet, [
    originalSlug,
    originalTitle,
    definition.slug,
    definition.title,
    ...definition.aliases,
  ])

  let relations = 0
  for (const relatedSlug of definition.relatedTo ?? []) {
    const target = targets.get(relatedSlug)
    if (!target || target.id === facet.id) continue
    relations++
    if (!apply) continue

    await prisma.facetRelation.upsert({
      where: {
        fromFacetId_toFacetId_relationType: {
          fromFacetId: facet.id,
          toFacetId: target.id,
          relationType: 'RELATED',
        },
      },
      create: {
        fromFacetId: facet.id,
        toFacetId: target.id,
        relationType: 'RELATED',
        note: `More specific or adjacent cultural genre. Curated by ${BATCH_ID}.`,
      },
      update: {
        note: `More specific or adjacent cultural genre. Curated by ${BATCH_ID}.`,
      },
    })
  }

  return {
    id: facet.id,
    originalTitle,
    title: canRename ? definition.title : facet.title,
    action: apply
      ? canRename
        ? 'renamed-in-place'
        : 'preserved-art-backed-title'
      : canRename
        ? 'would-rename-in-place'
        : 'would-preserve-art-backed-title',
    artBacked,
    relations,
    aliasConflicts,
  }
}

async function relateDistinctFutures(targets: Map<string, FacetRow>): Promise<number> {
  const african = targets.get('africanfuturism')
  const afro = targets.get('afrofuturism')
  if (!african || !afro || african.id === afro.id) return 0
  if (!apply) return 2

  for (const [from, to] of [
    [african, afro],
    [afro, african],
  ] as const) {
    await prisma.facetRelation.upsert({
      where: {
        fromFacetId_toFacetId_relationType: {
          fromFacetId: from.id,
          toFacetId: to.id,
          relationType: 'RELATED',
        },
      },
      create: {
        fromFacetId: from.id,
        toFacetId: to.id,
        relationType: 'RELATED',
        note: `Adjacent but distinct traditions; do not treat as aliases. Curated by ${BATCH_ID}.`,
      },
      update: {
        note: `Adjacent but distinct traditions; do not treat as aliases. Curated by ${BATCH_ID}.`,
      },
    })
  }
  return 2
}

async function main(): Promise<void> {
  const targets = new Map<string, FacetRow>()
  const ensureResults = []
  for (const definition of ENSURES) {
    const result = await ensureDefinition(definition)
    if (result.facet) targets.set(definition.slug, result.facet)
    ensureResults.push({
      slug: definition.slug,
      title: result.facet?.title ?? definition.title,
      action: result.action,
      artBacked: result.artBacked,
      aliasConflicts: result.aliasConflicts,
    })
  }

  const refineResults = []
  for (const definition of RENAMES) {
    refineResults.push(await refineDefinition(definition, targets))
  }

  const futureRelations = await relateDistinctFutures(targets)

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        ensured: ensureResults,
        refined: refineResults,
        futureRelations,
        summary: {
          missing: refineResults
            .filter((result) => result.action === 'missing')
            .map((result) => result.title),
          renamed: refineResults.filter(
            (result) => result.action === 'renamed-in-place',
          ).length,
          artBackedTitlesPreserved: refineResults.filter(
            (result) => result.action === 'preserved-art-backed-title',
          ).length,
          relations:
            refineResults.reduce(
              (count, result) => count + result.relations,
              0,
            ) + futureRelations,
        },
        artPolicy:
          'Cultural labels are renamed only when no artwork is attached. Art-backed titles remain stable and receive aliases, descriptions, weights, and relationships without tonal replacement.',
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
