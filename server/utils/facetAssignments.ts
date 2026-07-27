// /server/utils/facetAssignments.ts
import { createError } from 'h3'
import type { Facet, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { resolveFacetAlias } from '~/server/utils/facetAliases'
import type { FacetTaxonomy } from '~/server/utils/facetCatalog'
import { legacyFacetTaxonomyFromKind } from '~/server/utils/facetProfileInput'

export type FacetSummary = Pick<
  Facet,
  | 'id'
  | 'title'
  | 'slug'
  | 'kind'
  | 'description'
  | 'flavorText'
  | 'examples'
  | 'artPrompt'
  | 'imagePath'
  | 'cardPath'
  | 'heroPath'
  | 'icon'
  | 'artImageId'
  | 'artCollectionId'
  | 'userId'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
> & {
  aliases: string[]
  taxonomy: FacetTaxonomy
  canonicalValue: string
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: Record<string, unknown> | null
}

export const facetSummarySelect = {
  id: true,
  title: true,
  slug: true,
  // Deprecated compatibility data. Consumers classify with taxonomy.
  kind: true,
  description: true,
  flavorText: true,
  examples: true,
  artPrompt: true,
  imagePath: true,
  cardPath: true,
  heroPath: true,
  icon: true,
  artImageId: true,
  artCollectionId: true,
  userId: true,
  isPublic: true,
  isMature: true,
  isActive: true,
} satisfies Prisma.FacetSelect

type RawFacetSummary = Prisma.FacetGetPayload<{
  select: typeof facetSummarySelect
}>

function normalizePositiveIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((entry) => Number(entry))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  )
}

function normalizeKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean),
    ),
  )
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function sortFacetSummaries(facets: FacetSummary[]): FacetSummary[] {
  return facets.sort((a, b) =>
    a.taxonomy === b.taxonomy
      ? a.sortOrder === b.sortOrder
        ? a.title.localeCompare(b.title)
        : a.sortOrder - b.sortOrder
      : a.taxonomy.localeCompare(b.taxonomy),
  )
}

export async function hydrateFacetSummaries(
  facets: RawFacetSummary[],
): Promise<FacetSummary[]> {
  if (!facets.length) return []

  const facetIds = facets.map((facet) => facet.id)
  const [aliases, profiles] = await Promise.all([
    prisma.facetAlias.findMany({
      where: {
        facetId: { in: facetIds },
        isActive: true,
      },
      orderBy: [{ isCanonical: 'desc' }, { alias: 'asc' }],
      select: {
        facetId: true,
        alias: true,
      },
    }),
    prisma.facetProfile.findMany({
      where: { facetId: { in: facetIds } },
    }),
  ])

  const aliasesByFacet = new Map<number, string[]>()
  for (const alias of aliases) {
    const entries = aliasesByFacet.get(alias.facetId) ?? []
    entries.push(alias.alias)
    aliasesByFacet.set(alias.facetId, entries)
  }
  const profilesByFacet = new Map(
    profiles.map((profile) => [profile.facetId, profile]),
  )

  return sortFacetSummaries(
    facets.map((facet) => {
      const profile = profilesByFacet.get(facet.id)
      const taxonomy = (profile?.taxonomy ??
        legacyFacetTaxonomyFromKind(facet.kind)) as FacetTaxonomy

      return {
        ...facet,
        aliases:
          aliasesByFacet.get(facet.id) ?? (facet.slug ? [facet.slug] : []),
        taxonomy,
        canonicalValue: profile?.canonicalValue || facet.title,
        groupKey: profile?.groupKey ?? null,
        groupLabel: profile?.groupLabel ?? null,
        sortOrder: profile?.sortOrder ?? 0,
        isRandomizable: profile?.isRandomizable ?? true,
        randomWeight: profile?.randomWeight ?? 1,
        artRequired: profile?.artRequired ?? taxonomy !== 'COLOR',
        sourceRank: profile?.sourceRank ?? 5,
        metadata: parseMetadata(profile?.metadata ?? null),
      }
    }),
  )
}

export async function loadFacetSummaries(
  facetIds: number[],
): Promise<FacetSummary[]> {
  if (!facetIds.length) return []

  const facets = await prisma.facet.findMany({
    where: {
      id: { in: facetIds },
      isActive: true,
    },
    orderBy: [{ title: 'asc' }],
    select: facetSummarySelect,
  })

  return hydrateFacetSummaries(facets)
}

export async function resolveFacetSelection(options: {
  facetIds?: unknown
  facetKeys?: unknown
  userId: number
  isAdmin: boolean
}): Promise<FacetSummary[]> {
  const requestedIds = normalizePositiveIds(options.facetIds)
  const requestedKeys = normalizeKeys(options.facetKeys)

  const resolvedKeyIds: number[] = []
  for (const key of requestedKeys) {
    const resolved = await resolveFacetAlias(key)
    if (!resolved) {
      throw createError({
        statusCode: 404,
        message: `Facet not found for key: ${key}.`,
      })
    }
    resolvedKeyIds.push(resolved.facet.id)
  }

  const facetIds = Array.from(new Set([...requestedIds, ...resolvedKeyIds]))
  if (!facetIds.length) return []

  const facets = await prisma.facet.findMany({
    where: {
      id: { in: facetIds },
      isActive: true,
    },
    select: facetSummarySelect,
  })

  const foundIds = new Set(facets.map((facet) => facet.id))
  const missingIds = facetIds.filter((id) => !foundIds.has(id))
  if (missingIds.length) {
    throw createError({
      statusCode: 404,
      message: `Facet IDs not found or inactive: ${missingIds.join(', ')}.`,
    })
  }

  const forbidden = options.isAdmin
    ? []
    : facets.filter(
        (facet) => !facet.isPublic && facet.userId !== options.userId,
      )

  if (forbidden.length) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach Facet IDs: ${forbidden
        .map((facet) => facet.id)
        .join(', ')}.`,
    })
  }

  return hydrateFacetSummaries(facets)
}

export function parseFacetSelectionBody(body: unknown): {
  facetIds: unknown
  facetKeys: unknown
} {
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Facet assignment body must be an object.',
    })
  }

  const record = body as Record<string, unknown>
  return {
    facetIds: record.facetIds,
    facetKeys: record.facetKeys,
  }
}
