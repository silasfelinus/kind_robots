// GET /api/facets
import { defineEventHandler, getQuery } from 'h3'
import type { FacetKind, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  facetKinds,
  facetSummarySelect,
  hydrateFacetSummaries,
} from '~/server/utils/facetAssignments'
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

type FacetListQuery = {
  search?: string
  kind?: string
  includeInactive?: string
  includeMature?: string
  mine?: string
  take?: string
  skip?: string
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function toPositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<FacetListQuery>(event)
    const auth = await getOptionalApiUser(event)
    const userId = auth?.user.id ?? null
    const isAdmin = auth?.isAdmin ?? false
    const includeInactive = isAdmin && toBoolean(query.includeInactive)
    const includeMature = isAdmin && toBoolean(query.includeMature)
    const mine = toBoolean(query.mine)
    const take = Math.max(1, toPositiveInt(query.take, 100, 250))
    const skip = toPositiveInt(query.skip, 0, 100000)
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const kind = facetKinds.includes(query.kind as FacetKind)
      ? (query.kind as FacetKind)
      : null

    const andFilters: Prisma.FacetWhereInput[] = []
    if (!includeInactive) andFilters.push({ isActive: true })
    if (!includeMature) andFilters.push({ isMature: false })

    if (mine) {
      andFilters.push(userId ? { userId } : { id: -1 })
    } else if (!isAdmin) {
      andFilters.push(
        userId
          ? { OR: [{ isPublic: true }, { userId }] }
          : { isPublic: true },
      )
    }

    if (kind) andFilters.push({ kind })

    if (search) {
      const lookupKey = normalizeFacetLookupKey(search)
      const aliasMatches = lookupKey
        ? await prisma.facetAlias.findMany({
            where: {
              isActive: true,
              lookupKey: { contains: lookupKey },
            },
            select: { facetId: true },
            take: 250,
          })
        : []

      andFilters.push({
        OR: [
          { title: { contains: search } },
          { slug: { contains: search } },
          { description: { contains: search } },
          { id: { in: aliasMatches.map((alias) => alias.facetId) } },
        ],
      })
    }

    const facets = await prisma.facet.findMany({
      where: andFilters.length ? { AND: andFilters } : undefined,
      orderBy: [{ kind: 'asc' }, { title: 'asc' }],
      take,
      skip,
      select: facetSummarySelect,
    })

    return {
      success: true,
      data: await hydrateFacetSummaries(facets),
      count: facets.length,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
