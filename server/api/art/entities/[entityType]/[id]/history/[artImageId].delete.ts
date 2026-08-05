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
    const link = await prisma.entityArtImage.findUnique({
      where: {
        entityType_entityId_artImageId: {
          entityType: target.entityType,
          entityId: target.entityId,
          artImageId,
        },
      },
      select: { artImageId: true },
    })
    if (!link) {
      throw createError({
        statusCode: 404,
        message: 'That image is not part of this inspiration history.',
      })
    }

    /*
     * interface-vision/t-079: unlink only. A history join can now point at
     * a real, still-referenced ArtImage row (the entity's own primary art,
     * reused rather than duplicated) instead of always a throwaway private
     * duplicate, so deleting the ArtImage row itself here would risk taking
     * down art another slot, entity, or collection still depends on.
     * Removing "from history" means removing the join, never the image.
     */
    await prisma.entityArtImage.deleteMany({
      where: {
        entityType: target.entityType,
        entityId: target.entityId,
        artImageId,
      },
    })
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
