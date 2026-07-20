// PUT /api/dreams/:id/facets
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  parseFacetSelectionBody,
  resolveFacetSelection,
} from '~/server/utils/facetAssignments'
import { assertDreamAccess } from '~/server/api/dreams/index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dream ID.' })
    }

    const auth = await requireApiUser(event)
    const dream = await prisma.dream.findUnique({
      where: { id },
      select: { id: true, userId: true, isPublic: true },
    })

    if (!dream) {
      throw createError({ statusCode: 404, message: 'Dream not found.' })
    }

    assertDreamAccess({
      dream,
      userId: auth.user.id,
      userRole: auth.user.Role,
      action: 'mutate',
    })

    const selection = parseFacetSelectionBody(await readBody(event))
    const facets = await resolveFacetSelection({
      ...selection,
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
    })
    const facetIds = facets.map((facet) => facet.id)

    await prisma.$transaction(async (tx) => {
      await tx.dreamFacet.deleteMany({
        where: facetIds.length
          ? { dreamId: id, facetId: { notIn: facetIds } }
          : { dreamId: id },
      })

      if (facetIds.length) {
        await tx.dreamFacet.createMany({
          data: facetIds.map((facetId) => ({ dreamId: id, facetId })),
          skipDuplicates: true,
        })
      }
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream Facets updated.',
      data: facets,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
