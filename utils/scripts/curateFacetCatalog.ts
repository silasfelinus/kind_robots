// /utils/scripts/curateFacetCatalog.ts
import 'dotenv/config'
import {
  PrismaClient,
  type FacetKind,
  type FacetTaxonomy,
} from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  FACET_CURATION_BATCHES,
  type CuratedFacetDefinition,
  type FacetTransformDefinition,
  type FacetWeightDefinition,
} from './../seeds/facetCatalogCuration'
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
const CURATION_SOURCE_RANK = 1

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  designer: string | null
  artImageId: number | null
  artCollectionId: number | null
  isActive: boolean
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

type AliasConflict = {
  alias: string
  lookupKey: string
  requestedFacetId: number
  existingFacetId: number
}

type EnsureResult = {
  definition: CuratedFacetDefinition
  facet: FacetRow | null
  action: 'created' | 'updated' | 'would-create' | 'would-update'
  artBacked: boolean
  aliasConflicts: AliasConflict[]
}

type TransformResult = {
  lookup: readonly string[]
  facetId: number | null
  title: string | null
  action: 'transformed' | 'would-transform' | 'missing'
  previousTaxonomy: FacetTaxonomy | null
  taxonomy: FacetTaxonomy
  artBacked: boolean
  relationCount: number
  aliasConflicts: AliasConflict[]
}

type WeightResult = {
  lookup: readonly string[]
  facetId: number | null
  title: string | null
  action: 'weighted' | 'would-weight' | 'missing' | 'not-a-genre'
  previousWeight: number | null
  randomWeight: number
}

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
  batchId: string
  action: 'ensure' | 'transform' | 'weight'
  facetTitle: string
  previousTaxonomy?: FacetTaxonomy | null
  artBacked?: boolean
  relationSlugs?: readonly string[]
  randomWeight?: number
}): string {
  const metadata = parseMetadata(options.previous)
  const history = Array.isArray(metadata.catalogCurationHistory)
    ? metadata.catalogCurationHistory.filter(
        (entry) =>
          !(
            entry &&
            typeof entry === 'object' &&
            'batchId' in entry &&
            entry.batchId === options.batchId &&
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
        batchId: options.batchId,
        action: options.action,
        facetTitle: options.facetTitle,
        previousTaxonomy: options.previousTaxonomy,
        artBacked: options.artBacked,
        relationSlugs: options.relationSlugs,
        randomWeight: options.randomWeight,
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
    const aliasedFacet = await prisma.facet.findUnique({
      where: { id: alias.facetId },
    })
    if (aliasedFacet) return aliasedFacet
  }

  return null
}

async function getProfile(facetId: number): Promise<ProfileRow | null> {
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
): Promise<AliasConflict[]> {
  const conflicts: AliasConflict[] = []
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
      conflicts.push({
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        requestedFacetId: facet.id,
        existingFacetId: existing.facetId,
      })
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

async function ensureFacet(
  definition: CuratedFacetDefinition,
  batchId: string,
): Promise<EnsureResult> {
  const lookups = [
    definition.slug,
    definition.title,
    ...(definition.aliases ?? []),
  ]
  let facet = await findFacet(lookups)
  const existed = Boolean(facet)

  if (!facet && !apply) {
    return {
      definition,
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
    getProfile(facet.id),
    hasArtwork(facet),
  ])

  if (apply) {
    facet = await prisma.facet.update({
      where: { id: facet.id },
      data: {
        description: facet.description || definition.description,
        designer: facet.designer || 'facet-curation',
        isActive: true,
      },
    })

    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? definition.title,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: definition.isRandomizable,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          batchId,
          action: 'ensure',
          facetTitle: facet.title,
          previousTaxonomy: profile?.taxonomy,
          artBacked,
          randomWeight: definition.randomWeight,
        }),
      },
      update: {
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? definition.title,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        isRandomizable: definition.isRandomizable,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          batchId,
          action: 'ensure',
          facetTitle: facet.title,
          previousTaxonomy: profile?.taxonomy,
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

  return {
    definition,
    facet,
    action: apply
      ? existed
        ? 'updated'
        : 'created'
      : existed
        ? 'would-update'
        : 'would-create',
    artBacked,
    aliasConflicts,
  }
}

async function applyTransform(
  definition: FacetTransformDefinition,
  batchId: string,
  ensuredBySlug: Map<string, FacetRow>,
): Promise<TransformResult> {
  let facet = await findFacet(definition.lookup)
  if (!facet) {
    return {
      lookup: definition.lookup,
      facetId: null,
      title: null,
      action: 'missing',
      previousTaxonomy: null,
      taxonomy: definition.taxonomy,
      artBacked: false,
      relationCount: 0,
      aliasConflicts: [],
    }
  }

  const [profile, artBacked] = await Promise.all([
    getProfile(facet.id),
    hasArtwork(facet),
  ])
  const previousTaxonomy = profile?.taxonomy ?? null
  const relationSlugs = (definition.relations ?? []).map(
    (relation) => relation.toSlug,
  )

  if (apply) {
    facet = await prisma.facet.update({
      where: { id: facet.id },
      data: {
        designer: facet.designer || 'facet-curation',
        isActive: true,
      },
    })

    await prisma.facetProfile.upsert({
      where: { facetId: facet.id },
      create: {
        facetId: facet.id,
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? facet.title,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: definition.isRandomizable,
        randomWeight: definition.randomWeight,
        artRequired: profile?.artRequired ?? true,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          batchId,
          action: 'transform',
          facetTitle: facet.title,
          previousTaxonomy,
          artBacked,
          relationSlugs,
          randomWeight: definition.randomWeight,
        }),
      },
      update: {
        taxonomy: definition.taxonomy,
        canonicalValue: definition.canonicalValue ?? facet.title,
        groupKey: definition.groupKey,
        groupLabel: definition.groupLabel,
        isRandomizable: definition.isRandomizable,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile?.metadata,
          batchId,
          action: 'transform',
          facetTitle: facet.title,
          previousTaxonomy,
          artBacked,
          relationSlugs,
          randomWeight: definition.randomWeight,
        }),
      },
    })
  }

  const aliasConflicts = await ensureAliases(facet, [
    ...definition.lookup,
    ...(definition.aliases ?? []),
  ])

  let relationCount = 0
  for (const relation of definition.relations ?? []) {
    const target = ensuredBySlug.get(relation.toSlug)
    if (!target || target.id === facet.id) continue
    relationCount++
    if (!apply) continue

    await prisma.facetRelation.upsert({
      where: {
        fromFacetId_toFacetId_relationType: {
          fromFacetId: facet.id,
          toFacetId: target.id,
          relationType: relation.relationType,
        },
      },
      create: {
        fromFacetId: facet.id,
        toFacetId: target.id,
        relationType: relation.relationType,
        note: `${relation.note} Curated by ${batchId}.`,
      },
      update: {
        note: `${relation.note} Curated by ${batchId}.`,
      },
    })
  }

  return {
    lookup: definition.lookup,
    facetId: facet.id,
    title: facet.title,
    action: apply ? 'transformed' : 'would-transform',
    previousTaxonomy,
    taxonomy: definition.taxonomy,
    artBacked,
    relationCount,
    aliasConflicts,
  }
}

async function applyWeight(
  definition: FacetWeightDefinition,
  batchId: string,
): Promise<WeightResult> {
  const facet = await findFacet(definition.lookup)
  if (!facet) {
    return {
      lookup: definition.lookup,
      facetId: null,
      title: null,
      action: 'missing',
      previousWeight: null,
      randomWeight: definition.randomWeight,
    }
  }

  const profile = await getProfile(facet.id)
  if (profile?.taxonomy !== 'GENRE') {
    return {
      lookup: definition.lookup,
      facetId: facet.id,
      title: facet.title,
      action: 'not-a-genre',
      previousWeight: profile?.randomWeight ?? null,
      randomWeight: definition.randomWeight,
    }
  }

  if (apply) {
    await prisma.facetProfile.update({
      where: { facetId: facet.id },
      data: {
        isRandomizable: true,
        randomWeight: definition.randomWeight,
        sourceRank: CURATION_SOURCE_RANK,
        metadata: curatedMetadata({
          previous: profile.metadata,
          batchId,
          action: 'weight',
          facetTitle: facet.title,
          previousTaxonomy: profile.taxonomy,
          randomWeight: definition.randomWeight,
        }),
      },
    })
  }

  return {
    lookup: definition.lookup,
    facetId: facet.id,
    title: facet.title,
    action: apply ? 'weighted' : 'would-weight',
    previousWeight: profile.randomWeight,
    randomWeight: definition.randomWeight,
  }
}

async function main(): Promise<void> {
  const reports = []

  for (const batch of FACET_CURATION_BATCHES) {
    const ensureResults: EnsureResult[] = []
    const ensuredBySlug = new Map<string, FacetRow>()

    for (const definition of batch.ensures) {
      const result = await ensureFacet(definition, batch.id)
      ensureResults.push(result)
      if (result.facet) ensuredBySlug.set(definition.slug, result.facet)
    }

    const transformResults: TransformResult[] = []
    for (const definition of batch.transforms) {
      transformResults.push(
        await applyTransform(definition, batch.id, ensuredBySlug),
      )
    }

    const weightResults: WeightResult[] = []
    for (const definition of batch.weights) {
      weightResults.push(await applyWeight(definition, batch.id))
    }

    const aliasConflicts = [
      ...ensureResults.flatMap((result) => result.aliasConflicts),
      ...transformResults.flatMap((result) => result.aliasConflicts),
    ]

    reports.push({
      id: batch.id,
      title: batch.title,
      ensures: {
        created: ensureResults.filter((result) => result.action === 'created')
          .length,
        updated: ensureResults.filter((result) => result.action === 'updated')
          .length,
        wouldCreate: ensureResults.filter(
          (result) => result.action === 'would-create',
        ).length,
        wouldUpdate: ensureResults.filter(
          (result) => result.action === 'would-update',
        ).length,
      },
      transforms: {
        transformed: transformResults.filter(
          (result) => result.action === 'transformed',
        ).length,
        wouldTransform: transformResults.filter(
          (result) => result.action === 'would-transform',
        ).length,
        missing: transformResults
          .filter((result) => result.action === 'missing')
          .map((result) => result.lookup),
        artBacked: transformResults.filter((result) => result.artBacked).length,
        relations: transformResults.reduce(
          (count, result) => count + result.relationCount,
          0,
        ),
      },
      weights: {
        weighted: weightResults.filter((result) => result.action === 'weighted')
          .length,
        wouldWeight: weightResults.filter(
          (result) => result.action === 'would-weight',
        ).length,
        missing: weightResults
          .filter((result) => result.action === 'missing')
          .map((result) => result.lookup),
        notGenres: weightResults
          .filter((result) => result.action === 'not-a-genre')
          .map((result) => ({ title: result.title, lookup: result.lookup })),
      },
      aliasConflicts,
    })
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        batches: reports,
        artPolicy:
          'Facet ids and all direct or joined artwork are preserved; curation only changes profiles, aliases, relations, and legacy kind.',
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
