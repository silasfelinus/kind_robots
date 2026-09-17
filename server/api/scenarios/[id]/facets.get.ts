// GET /api/scenarios/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadFacetSummaries } from '~/server/utils/facetAssignments'
import { isMaturityRestricted } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Scenario ID.' })
    }

    const [scenario, auth] = await Promise.all([
      prisma.scenario.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true, isMature: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!scenario) {
      throw createError({ statusCode: 404, message: 'Scenario not found.' })
    }

    /*
     * The owner/admin/public check says nothing about maturity, so a
     * maturity-restricted account could read a mature Scenario's Facets --
     * names and descriptions, which is exactly the "things like text should
     * not be viewable either" case. Decided by role, so an admin is covered.
     */
    if (scenario.isMature && isMaturityRestricted(auth?.user)) {
      throw createError({ statusCode: 404, message: 'Scenario not found.' })
    }

    const canView =
      scenario.isPublic ||
      auth?.isAdmin ||
      (auth?.user.id && scenario.userId === auth.user.id)

    if (!canView) {
      throw createError({
        statusCode: auth ? 403 : 401,
        message: 'You do not have permission to view this Scenario.',
      })
    }

    const links = await prisma.scenarioFacet.findMany({
      where: { scenarioId: id },
      select: { facetId: true },
    })

    return {
      success: true,
      data: await loadFacetSummaries(links.map((link) => link.facetId)),
    }
  } catch (error) {
    return errorHandler(error)
  }
})
