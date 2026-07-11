// PUT /api/scenarios/:id/facets
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  parseFacetSelectionBody,
  resolveFacetSelection,
} from '~/server/utils/facetAssignments'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Scenario ID.' })
    }

    const auth = await requireApiUser(event)
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!scenario) {
      throw createError({ statusCode: 404, message: 'Scenario not found.' })
    }

    if (!auth.isAdmin && scenario.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Scenario.',
      })
    }

    const selection = parseFacetSelectionBody(await readBody(event))
    const facets = await resolveFacetSelection({
      ...selection,
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
    })
    const facetIds = facets.map((facet) => facet.id)

    await prisma.$transaction(async (tx) => {
      await tx.scenarioFacet.deleteMany({
        where: facetIds.length
          ? { scenarioId: id, facetId: { notIn: facetIds } }
          : { scenarioId: id },
      })

      if (facetIds.length) {
        await tx.scenarioFacet.createMany({
          data: facetIds.map((facetId) => ({ scenarioId: id, facetId })),
          skipDuplicates: true,
        })
      }
    })

    return {
      success: true,
      message: 'Scenario Facets updated.',
      data: facets,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
