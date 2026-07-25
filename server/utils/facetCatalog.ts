// /server/utils/facetCatalog.ts
import type { FacetKind, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

export const FACET_TAXONOMIES = [
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'SPECIES',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
  'OTHER',
] as const

export type FacetTaxonomy = (typeof FACET_TAXONOMIES)[number]

export type FacetCatalogEntry = {
  id: number
  title: string
  slug: string | null
  kind: FacetKind
  taxonomy: FacetTaxonomy
  canonicalValue: string
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  icon: string | null
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: Record<string, unknown> | null
  aliases: string[]
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
}

const facetCatalogSelect = {
  id: true,
  title: true,
  slug: true,
  kind: true,
  description: true,
  flavorText: true,
  examples: true,
  artPrompt: true,
  imagePath: true,
  cardPath: true,
  heroPath: true,
  icon: true,
  userId: true,
  isPublic: true,
  isMature: true,
  isActive: true,
} satisfies Prisma.FacetSelect

type RawFacet = Prisma.FacetGetPayload<{ select: typeof facetCatalogSelect }>

function normalizeTaxonomy(value: string | null | undefined): FacetTaxonomy {
  const normalized = String(value ?? 'OTHER').trim().toUpperCase()
  return FACET_TAXONOMIES.includes(normalized as FacetTaxonomy)
    ? (normalized as FacetTaxonomy)
    : 'OTHER'
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

export async function loadFacetCatalogEntries(options: {
  facetIds?: number[]
  taxonomies?: FacetTaxonomy[]
  includeInactive?: boolean
  includeMature?: boolean
  randomizableOnly?: boolean
  userId?: number
  isAdmin?: boolean
  search?: string
  take?: number
  skip?: number
} = {}): Promise<FacetCatalogEntry[]> {
  const profileWhere = {
    ...(options.facetIds?.length ? { facetId: { in: options.facetIds } } : {}),
    ...(options.taxonomies?.length
      ? { taxonomy: { in: options.taxonomies } }
      : {}),
    ...(options.randomizableOnly ? { isRandomizable: true } : {}),
  } satisfies Prisma.FacetProfileWhereInput

  const profiles = await prisma.facetProfile.findMany({
    where: profileWhere,
    orderBy: [{ taxonomy: 'asc' }, { groupKey: 'asc' }, { sortOrder: 'asc' }],
  })

  if (!profiles.length) return []

  const profileByFacetId = new Map(
    profiles.map((profile) => [profile.facetId, profile]),
  )
  const requestedFacetIds = profiles.map((profile) => profile.facetId)
  const search = options.search?.trim()
  const normalizedSearch = search ? normalizeFacetLookupKey(search) : ''
  const aliasFacetIds = search
    ? (
        await prisma.facetAlias.findMany({
          where: {
            isActive: true,
            OR: [
              { alias: { contains: search } },
              ...(normalizedSearch
                ? [{ lookupKey: { contains: normalizedSearch } }]
                : []),
            ],
          },
          select: { facetId: true },
          distinct: ['facetId'],
        })
      ).map((alias) => alias.facetId)
    : []

  const facets = await prisma.facet.findMany({
    where: {
      id: { in: requestedFacetIds },
      ...(options.includeInactive ? {} : { isActive: true }),
      ...(options.includeMature ? {} : { isMature: false }),
      ...(options.isAdmin
        ? {}
        : {
            OR: [
              { isPublic: true },
              ...(options.userId ? [{ userId: options.userId }] : []),
            ],
          }),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: search } },
                  { slug: { contains: search } },
                  { description: { contains: search } },
                  ...(aliasFacetIds.length
                    ? [{ id: { in: aliasFacetIds } }]
                    : []),
                ],
              },
            ],
          }
        : {}),
    },
    select: facetCatalogSelect,
  })

  if (!facets.length) return []

  const aliases = await prisma.facetAlias.findMany({
    where: {
      facetId: { in: facets.map((facet) => facet.id) },
      isActive: true,
    },
    orderBy: [{ isCanonical: 'desc' }, { alias: 'asc' }],
    select: { facetId: true, alias: true },
  })

  const aliasesByFacetId = new Map<number, string[]>()
  for (const alias of aliases) {
    const values = aliasesByFacetId.get(alias.facetId) ?? []
    values.push(alias.alias)
    aliasesByFacetId.set(alias.facetId, values)
  }

  const entries = facets
    .map((facet: RawFacet): FacetCatalogEntry | null => {
      const profile = profileByFacetId.get(facet.id)
      if (!profile) return null

      return {
        ...facet,
        taxonomy: normalizeTaxonomy(profile.taxonomy),
        canonicalValue: profile.canonicalValue || facet.title,
        groupKey: profile.groupKey,
        groupLabel: profile.groupLabel,
        sortOrder: profile.sortOrder,
        isRandomizable: profile.isRandomizable,
        randomWeight: profile.randomWeight,
        artRequired: profile.artRequired,
        sourceRank: profile.sourceRank,
        metadata: parseMetadata(profile.metadata),
        aliases:
          aliasesByFacetId.get(facet.id) ?? (facet.slug ? [facet.slug] : []),
      }
    })
    .filter((entry): entry is FacetCatalogEntry => Boolean(entry))
    .sort((a, b) =>
      a.taxonomy === b.taxonomy
        ? a.groupKey === b.groupKey
          ? a.sortOrder === b.sortOrder
            ? a.title.localeCompare(b.title)
            : a.sortOrder - b.sortOrder
          : String(a.groupKey ?? '').localeCompare(String(b.groupKey ?? ''))
        : a.taxonomy.localeCompare(b.taxonomy),
    )

  const skip = Math.max(0, options.skip ?? 0)
  const take = Math.min(1000, Math.max(1, options.take ?? 500))
  return entries.slice(skip, skip + take)
}

export async function loadCharacterFacetCatalog(characterId: number) {
  const links = await prisma.characterFacet.findMany({
    where: { characterId },
    orderBy: [{ fieldKey: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  })

  const entries = await loadFacetCatalogEntries({
    facetIds: links.map((link) => link.facetId),
    includeMature: true,
    includeInactive: true,
    isAdmin: true,
    take: 1000,
  })
  const entryById = new Map(entries.map((entry) => [entry.id, entry]))

  return links
    .map((link) => ({
      ...link,
      facet: entryById.get(link.facetId) ?? null,
    }))
    .filter((link) => Boolean(link.facet))
}
