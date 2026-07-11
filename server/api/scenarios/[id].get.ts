// /server/api/scenarios/[id].get.ts
import { defineEventHandler } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  facetSummarySelect,
  hydrateFacetSummaries,
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

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: 'Invalid scenario ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    const auth = await getOptionalApiUser(event)
    const facetWhere = facetVisibilityWhere({
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin ?? false,
    })

    const row = await prisma.scenario.findUnique({
      where: { id },
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
    })

    if (!row) {
      event.node.res.statusCode = 404

      return {
        success: false,
        message: 'Scenario not found.',
        statusCode: 404,
      }
    }

    const { FacetLinks, _count, ...scenario } = row
    const Facets = (await hydrateFacetSummaries(
      FacetLinks.map((link) => link.Facet),
    )).sort((a, b) =>
      a.kind === b.kind
        ? a.title.localeCompare(b.title)
        : a.kind.localeCompare(b.kind),
    )

    const data = {
      ...scenario,
      Facets,
      _count: {
        Dreams: _count.Dreams,
        Characters: _count.Characters,
        Facets: Facets.length,
      },
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Scenario details fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    const safeStatusCode = statusCode ?? 500

    event.node.res.statusCode = safeStatusCode

    return {
      success,
      message,
      statusCode: safeStatusCode,
    }
  }
})
