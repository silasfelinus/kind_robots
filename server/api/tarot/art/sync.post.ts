import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  TAROT_DECK_INCLUDE,
  syncTarotDeckArt,
} from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<{ deckSlug?: unknown }>(event)) ?? {}
    const slug = typeof body.deckSlug === 'string' ? body.deckSlug : ''
    const found = await prisma.tarotDeck.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!found)
      throw createError({ statusCode: 404, message: 'Deck not found.' })
    const summary = await syncTarotDeckArt(found.id)
    const deck = await prisma.tarotDeck.findUnique({
      where: { id: found.id },
      include: TAROT_DECK_INCLUDE,
    })
    return {
      success: true,
      statusCode: 200,
      message: `${summary.rendered} rendered, ${summary.failed} failed, ${summary.checked - summary.rendered - summary.failed} still in the queue.`,
      data: { summary, deck },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
