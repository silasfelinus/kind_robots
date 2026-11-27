import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { TAROT_DECK_INCLUDE } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid design id.' })
    }
    const design = await prisma.tarotDesign.findUnique({ where: { id } })
    if (!design) {
      throw createError({ statusCode: 404, message: 'Design not found.' })
    }
    const deck = await prisma.$transaction(async (tx) => {
      await tx.tarotDesign.updateMany({
        where: { deckId: design.deckId, status: 'APPROVED', id: { not: id } },
        data: { status: 'EXPLORING' },
      })
      await tx.tarotDesign.update({
        where: { id },
        data: { status: 'APPROVED' },
      })
      return tx.tarotDeck.update({
        where: { id: design.deckId },
        data: {
          approvedDesignId: id,
          defaultEngine: design.engine,
          defaultCheckpoint: design.checkpoint,
          defaultLoras: design.loras,
        },
        include: TAROT_DECK_INCLUDE,
      })
    })
    return {
      success: true,
      statusCode: 200,
      message: `${design.title} approved as the deck design. Generate the full set when ready.`,
      data: deck,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
