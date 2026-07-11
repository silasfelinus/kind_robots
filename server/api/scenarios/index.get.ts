// /server/api/scenarios/index.get.ts
import { defineEventHandler } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  facetSummarySelect,
  hydrateFacetSummaries,
  type FacetSummary,
} from '~/server/utils/facetAssignments'

const dreamSelect = {
  id: true,
  title: true,
  slug: true,
  dreamType: true,
  imagePath: true,
  highlightImage: true,
  icon: true,
}

const characterSelect = {
  id: true,
  name: true,
  honorific: true,
  title: true,
  role: true,
  class: true,
  species: true,
  gender: true,
  alignment: true,
  genre: true,
  backstory: true,
  drive: true,
  quirks: true,
  personality: true,
  presentation: true,
  artPrompt: true,
  imagePath: true,
  designer: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  charm: true,
  empathy: true,
  grace: true,
  luck: true,
  might: true,
  wits: true,
  artImageId: true,
}

function facetVisibilityWhere(options: {
  userId: number | null
  isAdmin: boolean
}): Prisma.FacetWhereInput {
  const where: Prisma.FacetWhereInput = { isActive: true }
  if (options.isAdmin) return where

  where.isMature = false
  where.OR = options.userId
    ? [{ isPublic: true }, { userId: options.userId }]
    : [{ isPublic: true }]
  return where
}

function sortFacets(facets: FacetSummary[]): FacetSummary[] {
  return [...facets].sort((a, b) =>
    a.kind === b.kind
      ? a.title.localeCompare(b.title)
      : a.kind.localeCompare(b.kind),
  )
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const facetWhere = facetVisibilityWhere({
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin ?? false,
    })

    const rows = await prisma.scenario.findMany({
      include: {
        Dreams: {
          select: dreamSelect,
          orderBy: { title: 'asc' },
        },
        Characters: {
          select: characterSelect,
          orderBy: { name: 'asc' },
        },
        FacetLinks: {
          where: { Facet: facetWhere },
          select: {
            Facet: { select: facetSummarySelect },
          },
        },
        _count: {
          select: {
            Dreams: true,
            Characters: true,
            FacetLinks: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    })

    const rawFacets = Array.from(
      new Map(
        rows
          .flatMap((scenario) => scenario.FacetLinks.map((link) => link.Facet))
          .map((facet) => [facet.id, facet]),
      ).values(),
    )
    const hydratedFacets = await hydrateFacetSummaries(rawFacets)
    const facetsById = new Map(hydratedFacets.map((facet) => [facet.id, facet]))

    const data = rows.map(({ FacetLinks, _count, ...scenario }) => ({
      ...scenario,
      Facets: sortFacets(
        FacetLinks.flatMap((link) => {
          const facet = facetsById.get(link.Facet.id)
          return facet ? [facet] : []
        }),
      ),
      _count: {
        Dreams: _count.Dreams,
        Characters: _count.Characters,
        Facets: FacetLinks.length,
      },
    }))

    return {
      success: true,
      message: 'All scenarios fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
