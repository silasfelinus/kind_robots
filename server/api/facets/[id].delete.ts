// DELETE /api/facets/:id
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  facetSummarySelect,
  hydrateFacetSummaries,
} from '~/server/utils/facetAssignments'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Facet ID.' })
    }

    const auth = await requireApiUser(event)
    const existing = await prisma.facet.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Facet not found.' })
    }

    if (!auth.isAdmin && existing.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to archive this Facet.',
      })
    }

    const facet = await prisma.$transaction(async (tx) => {
      await tx.facetAlias.updateMany({
        where: { facetId: id },
        data: { isActive: false },
      })
      return tx.facet.update({
        where: { id },
        data: { isActive: false },
        select: facetSummarySelect,
      })
    })

    const [data] = await hydrateFacetSummaries([facet])
    return {
      success: true,
      message: 'Facet archived successfully.',
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
