// /server/utils/facetAssignments.ts
import { createError } from 'h3'
import type { Facet, FacetKind, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { resolveFacetAlias } from '~/server/utils/facetAliases'

export type FacetSummary = Pick<
  Facet,
  | 'id'
  | 'title'
  | 'slug'
  | 'kind'
  | 'description'
  | 'flavorText'
  | 'imagePath'
  | 'icon'
  | 'userId'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
> & {
  aliases: string[]
}

export const facetKinds: FacetKind[] = [
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'OTHER',
]

export const facetSummarySelect = {
  id: true,
  title: true,
  slug: true,
  kind: true,
  description: true,
  flavorText: true,
  imagePath: true,
  icon: true,
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

export async function hydrateFacetSummaries(
  facets: RawFacetSummary[],
): Promise<FacetSummary[]> {
  if (!facets.length) return []

  const aliases = await prisma.facetAlias.findMany({
    where: {
      facetId: { in: facets.map((facet) => facet.id) },
      isActive: true,
    },
    orderBy: [{ isCanonical: 'desc' }, { alias: 'asc' }],
    select: {
      facetId: true,
      alias: true,
    },
  })

  const aliasesByFacet = new Map<number, string[]>()
  for (const alias of aliases) {
    const entries = aliasesByFacet.get(alias.facetId) ?? []
    entries.push(alias.alias)
    aliasesByFacet.set(alias.facetId, entries)
  }

  return facets.map((facet) => ({
    ...facet,
    aliases: aliasesByFacet.get(facet.id) ?? (facet.slug ? [facet.slug] : []),
  }))
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
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
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

  return hydrateFacetSummaries(
    facets.sort((a, b) =>
      a.kind === b.kind
        ? a.title.localeCompare(b.title)
        : a.kind.localeCompare(b.kind),
    ),
  )
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
