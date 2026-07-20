// DELETE /api/dream-relations/:id — remove a DreamRelation edge.
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertDreamAccess } from '~/server/api/dreams/index'
import { getDreamRelationId } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = getDreamRelationId(event.context.params?.id)
    const auth = await requireApiUser(event)

    const existing = await prisma.dreamRelation.findUnique({
      where: { id },
      select: {
        id: true,
        FromDream: { select: { id: true, userId: true, isPublic: true } },
      },
    })
    if (!existing) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Dream relation not found.',
        statusCode: 404,
      }
    }

    assertDreamAccess({
      dream: existing.FromDream,
      userId: auth.user.id,
      userRole: auth.user.Role,
      action: 'mutate',
    })

    await prisma.dreamRelation.delete({ where: { id } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream relation deleted successfully.',
      data: { id },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { success: false, message: handled.message, data: null, statusCode }
  }
})
