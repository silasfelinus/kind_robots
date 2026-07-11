// /server/utils/facetAliases.ts
import prisma from '~/server/utils/prisma'
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

export type ResolvedFacet = {
  facet: NonNullable<Awaited<ReturnType<typeof findFacetById>>>
  aliases: Array<{
    id: number
    alias: string
    lookupKey: string
    isCanonical: boolean
  }>
  matchedAlias: string
  lookupKey: string
  isCanonicalMatch: boolean
}

async function findFacetById(id: number) {
  return prisma.facet.findFirst({
    where: {
      id,
      isActive: true,
    },
  })
}

/** Resolve a Facet through the canonical slug or any active alias. */
export async function resolveFacetAlias(value: string): Promise<ResolvedFacet | null> {
  const lookupKey = normalizeFacetLookupKey(value)
  if (!lookupKey) return null

  const matched = await prisma.facetAlias.findUnique({
    where: { lookupKey },
    select: {
      facetId: true,
      alias: true,
      isCanonical: true,
      isActive: true,
    },
  })

  if (!matched?.isActive) return null

  const [facet, aliases] = await Promise.all([
    findFacetById(matched.facetId),
    prisma.facetAlias.findMany({
      where: {
        facetId: matched.facetId,
        isActive: true,
      },
      orderBy: [{ isCanonical: 'desc' }, { alias: 'asc' }],
      select: {
        id: true,
        alias: true,
        lookupKey: true,
        isCanonical: true,
      },
    }),
  ])

  if (!facet) return null

  return {
    facet,
    aliases,
    matchedAlias: matched.alias,
    lookupKey,
    isCanonicalMatch: matched.isCanonical,
  }
}
