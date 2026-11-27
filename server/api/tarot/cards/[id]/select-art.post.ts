// POST /api/tarot/cards/:id/select-art  { artId, approve? }
//
// Switches the card's default face to another rendered variant. With
// approve: true the card is approved in the same step.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { tarotArtImageUrl } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const artId = Number(body.artId)
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(artId)) {
      throw createError({ statusCode: 400, message: 'Invalid card or art id.' })
    }
    const art = await prisma.tarotArt.findUnique({ where: { id: artId } })
    if (!art || art.cardId !== id || art.side !== 'FACE') {
      throw createError({
        statusCode: 404,
        message: 'That art does not belong to this card.',
      })
    }
    if (art.status !== 'RENDERED' || !art.artImageId) {
      throw createError({
        statusCode: 409,
        message: 'Only a rendered variant can become the default.',
      })
    }
    const card = await prisma.tarotCard.update({
      where: { id },
      data: {
        selectedArtId: art.id,
        artJobId: art.artJobId,
        artImageId: art.artImageId,
        imageUrl: tarotArtImageUrl(art.id),
        status: body.approve === true ? 'APPROVED' : 'RENDERED',
      },
    })
    return {
      success: true,
      statusCode: 200,
      message:
        body.approve === true
          ? `${card.title} approved with this art.`
          : `${card.title} now shows this variant by default.`,
      data: card,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
