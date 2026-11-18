import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  ADVERT_STUDIO_COVER_SLOT,
  advertSlotByKey,
} from '~/utils/adverts/posters'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody(event)) as {
      slotId?: unknown
      artImageId?: unknown
    } | null
    const slotId = Number(body?.slotId)
    const artImageId = Number(body?.artImageId)
    if (!Number.isSafeInteger(slotId) || slotId < 1)
      throw createError({ statusCode: 400, message: 'Invalid advert slot.' })
    if (!Number.isSafeInteger(artImageId) || artImageId < 1)
      throw createError({ statusCode: 400, message: 'Invalid image.' })

    const selected = await prisma.$transaction(async (tx) => {
      const [slot, candidate, image] = await Promise.all([
        tx.artSlot.findUnique({ where: { id: slotId } }),
        tx.artCandidate.findUnique({
          where: { slotId_artImageId: { slotId, artImageId } },
        }),
        tx.artImage.findUnique({ where: { id: artImageId } }),
      ])
      if (
        !slot ||
        (slot.slotKey !== ADVERT_STUDIO_COVER_SLOT &&
          !advertSlotByKey(slot.slotKey))
      )
        throw createError({ statusCode: 404, message: 'Advert slot not found.' })
      if (!candidate || candidate.verdict === 'duplicate')
        throw createError({
          statusCode: 404,
          message: 'This image is not an active candidate for the advert.',
        })
      if (!image || image.isActive !== true || image.isMature === true)
        throw createError({
          statusCode: 400,
          message: 'Only active, non-mature advert art may be published.',
        })

      await tx.artImage.update({
        where: { id: artImageId },
        data: { isPublic: true },
      })
      return tx.artSlot.update({
        where: { id: slotId },
        data: {
          selectedArtImageId: artImageId,
          selectedAt: new Date(),
          selectedBy: auth.user.id,
        },
      })
    })

    return {
      success: true,
      message: `Published image ${artImageId} in advert slot ${selected.slotKey}.`,
      data: { slot: selected },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Could not publish advert art.',
      statusCode: event.node.res.statusCode,
    }
  }
})
