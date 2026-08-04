// /utils/scripts/curateFacetHouseGenres.ts
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
const BATCH_ID = '2026-08-01-house-genres-02'
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type TargetDefinition = {
  slug: string
  title: string
  taxonomy: FacetTaxonomy
  randomWeight: number
  aliases?: readonly string[]
  description?: string
}

type HouseGenreDefinition = {
  lookup: readonly string[]
  randomWeight: number
  relatedTo: readonly string[]
}

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
  designer: string | null
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

const TARGETS: readonly TargetDefinition[] = [
  {
    slug: 'weird-fiction',
    title: 'Weird Fiction',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
  {
    slug: 'zombie-fiction',
    title: 'Zombie Fiction',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
    aliases: ['Zombie Genre'],
  },
  {
    slug: 'cyberpunk-fiction',
    title: 'Cyberpunk Fiction',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
    aliases: ['Cyberpunk Genre'],
    description:
      'Cyberpunk as a narrative genre: high technology, concentrated power, social fracture, and people improvising beneath systems built to own them.',
  },
  {
    slug: 'everyday-wonder',
    title: 'Everyday Wonder',
    taxonomy: 'GENRE',
    randomWeight: 0.5,
    aliases: ['Mundane Fantasy'],
    description:
      'Ordinary routines made strange and luminous: impossible coworkers, enchanted errands, and daily life continuing around gentle absurdity.',
  },
  {
    slug: 'mythic-fantasy',
    title: 'Mythic Fantasy',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
  {
    slug: 'cozy-fantasy',
    title: 'Cozy Fantasy',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
  {
    slug: 'dark-carnival',
    title: 'Dark Carnival',
    taxonomy: 'GENRE',
    randomWeight: 0.5,
    description:
      'Performance, spectacle, and celebration with something predatory beneath the lights.',
  },
  {
    slug: 'eco-fiction',
    title: 'Eco-Fiction',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
    aliases: ['Ecological Fiction'],
  },
  {
    slug: 'kaiju',
    title: 'Kaiju',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
  {
    slug: 'heist-fiction',
    title: 'Heist Fiction',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
    aliases: ['Heist Genre'],
  },
  {
    slug: 'cosmic-horror',
    title: 'Cosmic Horror',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
  {
    slug: 'folk-horror',
    title: 'Folk Horror',
    taxonomy: 'GENRE',
    randomWeight: 1.5,
  },
]

const HOUSE_GENRES: readonly HouseGenreDefinition[] = [
  {
    lookup: ['WeirdCore', 'weirdcore'],
    randomWeight: 0.5,
    relatedTo: ['weird-fiction'],
  },
  {
    lookup: ['ZombieCore', 'zombiecore'],
    randomWeight: 0.5,
    relatedTo: ['zombie-fiction'],
  },
  {
    lookup: ['FutureCore', 'futurecore'],
    randomWeight: 0.5,
    relatedTo: ['cyberpunk-fiction'],
  },
  {
    lookup: ['oddCore', 'oddcore'],
    randomWeight: 0.5,
    relatedTo: ['everyday-wonder'],
  },
  {
    lookup: ['EldritchCore', 'eldritchcore'],
    randomWeight: 0.5,
    relatedTo: ['cosmic-horror', 'folk-horror'],
  },
  {
    lookup: ['MythCore', 'mythcore'],
    randomWeight: 0.5,
    relatedTo: ['mythic-fantasy'],
  },
  {
    lookup: ['CozyCore', 'cozycore'],
    randomWeight: 0.5,
    relatedTo: ['cozy-fantasy'],
  },
  {
    lookup: ['CircusCore', 'circuscore'],
    randomWeight: 0.5,
    relatedTo: ['dark-carnival'],
  },
  {
    lookup: ['EcoCore', 'ecocore'],
    randomWeight: 0.5,
    relatedTo: ['eco-fiction'],
  },
  {
    lookup: ['KaijuCore', 'kaijucore'],
    randomWeight: 0.5,
    relatedTo: ['kaiju'],
  },
  {
    lookup: ['crimeCore', 'crimecore'],
    randomWeight: 0.5,
    relatedTo: ['heist-fiction'],
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

function metadataWithEntry(options: {
  previous: string | null | undefined
  action: 'ensure-house-target' | 'curate-house-genre'
  facetTitle: string
  artBacked: boolean
  randomWeight: number
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
    catalogCurationHistory: [
      ...history,
      {
        batchId: BATCH_ID,
        action: options.action,
        facetTitle: options.facetTitle,
        artBacked: options.artBacked,
        randomWeight: options.randomWeight,
        relatedSlugs: options.relatedSlugs,
      },
    ],
  })
}

async function findFacet(lookups: readonly string[]): Promise<FacetRow | null> {
  for (const lookup of lookups) {
    const trimmed = lookup.trim()
    if (!trimmed) continue

    const direct = await prisma.facet.findUnique({
      where: { slug: slugify(trimmed) },
    })
    if (direct) return direct

    const lookupKey = normalizeFacetLookupKey(trimmed)
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

async function ensureAliases(
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

async function ensureTarget(definition: TargetDefinition): Promise<{
  facet: FacetRow | null
  created: boolean
  artBacked: boolean
  aliasConflicts: Array<{ alias: string; existingFacetId: number }>
}> {
  let facet = await findFacet([
    definition.slug,
    definition.title,
    ...(definition.aliases ?? []),
  ])
  const created = !facet

  if (!facet && !apply) {
    return {
      facet: null,
      created: true,
      artBacked: false,
      aliasConflicts: [],
    }
  }

  if (!facet) {
    facet = await prisma.facet.create({
      data: {
        title: definition.title,
        slug: definition.slug,
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
    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: definition.taxonomy,
        canonicalValue: definition.title,
        groupKey: 'curated-genre',
        groupLabel: 'Curated Genres',
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: metadataWithEntry({
          previous: profile?.metadata,
          action: 'ensure-house-target',
          facetTitle: facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
        }),
      },
      update: {
        taxonomy: definition.taxonomy,
        canonicalValue: definition.title,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: metadataWithEntry({
          previous: profile?.metadata,
          action: 'ensure-house-target',
          facetTitle: facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
        }),
      },
    })
  }

  const aliasConflicts = await ensureAliases(facet, [
    definition.slug,
    definition.title,
    ...(definition.aliases ?? []),
  ])

  return { facet, created, artBacked, aliasConflicts }
}

async function curateHouseGenre(
  definition: HouseGenreDefinition,
  targets: Map<string, FacetRow>,
): Promise<{
  title: string | null
  missing: boolean
  artBacked: boolean
  relations: number
}> {
  const facet = await findFacet(definition.lookup)
  if (!facet) {
    return { title: null, missing: true, artBacked: false, relations: 0 }
  }

  const [profile, artBacked] = await Promise.all([
    profileFor(facet.id),
    hasArtwork(facet),
  ])

  if (apply) {
    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: 'GENRE',
        canonicalValue: facet.title,
        groupKey: 'house-genre',
        groupLabel: 'House Genres',
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: metadataWithEntry({
          previous: profile?.metadata,
          action: 'curate-house-genre',
          facetTitle: facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
          relatedSlugs: definition.relatedTo,
        }),
      },
      update: {
        taxonomy: 'GENRE',
        groupKey: 'house-genre',
        groupLabel: 'House Genres',
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: metadataWithEntry({
          previous: profile?.metadata,
          action: 'curate-house-genre',
          facetTitle: facet.title,
          artBacked,
          randomWeight: definition.randomWeight,
          relatedSlugs: definition.relatedTo,
        }),
      },
    })
  }

  let relations = 0
  for (const slug of definition.relatedTo) {
    const target = targets.get(slug)
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
        note: `House genre related to its broader reusable genre. Curated by ${BATCH_ID}.`,
      },
      update: {
        note: `House genre related to its broader reusable genre. Curated by ${BATCH_ID}.`,
      },
    })
  }

  return { title: facet.title, missing: false, artBacked, relations }
}

async function main(): Promise<void> {
  const targets = new Map<string, FacetRow>()
  const targetResults = []

  for (const definition of TARGETS) {
    const result = await ensureTarget(definition)
    if (result.facet) targets.set(definition.slug, result.facet)
    targetResults.push({
      slug: definition.slug,
      title: result.facet?.title ?? definition.title,
      action: apply
        ? result.created
          ? 'created'
          : 'updated'
        : result.created
          ? 'would-create'
          : 'would-update',
      artBacked: result.artBacked,
      aliasConflicts: result.aliasConflicts,
    })
  }

  const houseResults = []
  for (const definition of HOUSE_GENRES) {
    houseResults.push({
      lookup: definition.lookup,
      ...(await curateHouseGenre(definition, targets)),
    })
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        targets: targetResults,
        houseGenres: houseResults,
        summary: {
          targetsCreated: targetResults.filter(
            (result) => result.action === 'created',
          ).length,
          targetsUpdated: targetResults.filter(
            (result) => result.action === 'updated',
          ).length,
          missingHouseGenres: houseResults
            .filter((result) => result.missing)
            .map((result) => result.lookup),
          artBackedHouseGenres: houseResults.filter(
            (result) => result.artBacked,
          ).length,
          relations: houseResults.reduce(
            (count, result) => count + result.relations,
            0,
          ),
        },
        artPolicy:
          'House genres keep their stable Facet rows, descriptions, prompts, and all direct or joined artwork. Similar concepts are related, not falsely aliased.',
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
