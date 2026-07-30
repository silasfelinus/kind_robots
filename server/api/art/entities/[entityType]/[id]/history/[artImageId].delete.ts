// /server/api/art/entities/[entityType]/[id]/history/[artImageId].delete.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  entityArtHistoryPrefix,
  listEntityArtHistory,
  resolveEntityArtTarget,
} from '~/server/utils/entityArt'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const entityType = getRouterParam(event, 'entityType')
    const id = getRouterParam(event, 'id')
    const artImageId = Number(getRouterParam(event, 'artImageId'))
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid history image ID.' })
    }

    const defaultField =
      entityType === 'bot' ? 'avatarImage' : 'imagePath'
    const target = await resolveEntityArtTarget(
      prisma,
      entityType,
      id,
      defaultField,
      auth,
    )
    const history = await prisma.artImage.findFirst({
      where: {
        id: artImageId,
        path: {
          startsWith: entityArtHistoryPrefix(
            target.entityType,
            target.entityId,
          ),
        },
      },
      select: { id: true },
    })
    if (!history) {
      throw createError({
        statusCode: 404,
        message: 'That image is not part of this inspiration history.',
      })
    }

    await prisma.artImage.delete({ where: { id: artImageId } })
    return {
      success: true,
      message: 'Inspiration image removed.',
      data: {
        history: await listEntityArtHistory(
          prisma,
          target.entityType,
          target.entityId,
        ),
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to remove inspiration image.',
      data: null,
      statusCode,
    }
  }
})
