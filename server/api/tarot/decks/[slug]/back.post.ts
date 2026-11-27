// POST /api/tarot/decks/:slug/back  { artId }
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { TAROT_DECK_INCLUDE } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const slug = getRouterParam(event, 'slug') ?? ''
    const body = (await readBody<{ artId?: unknown }>(event)) ?? {}
    const artId = Number(body.artId)
    const deck = await prisma.tarotDeck.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!deck)
      throw createError({ statusCode: 404, message: 'Deck not found.' })
    const art = await prisma.tarotArt.findUnique({ where: { id: artId } })
    if (
      !art ||
      art.deckId !== deck.id ||
      art.side !== 'BACK' ||
      art.status !== 'RENDERED'
    ) {
      throw createError({
        statusCode: 409,
        message: 'Choose a rendered back from this deck.',
      })
    }
    const updated = await prisma.tarotDeck.update({
      where: { id: deck.id },
      data: { backArtId: art.id },
      include: TAROT_DECK_INCLUDE,
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Deck back updated.',
      data: updated,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
