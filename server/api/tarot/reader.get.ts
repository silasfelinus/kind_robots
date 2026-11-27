// GET /api/tarot/reader
//
// Public, read-only deck data for /play/tarot: decks marked public, their
// per-card titles and only APPROVED default art. Prompts, notes, model
// settings and unapproved variants never leave the admin API.
import { defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { tarotArtImageUrl } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    const decks = await prisma.tarotDeck.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'asc' },
      select: {
        slug: true,
        title: true,
        description: true,
        backArtId: true,
        Cards: {
          orderBy: { ordinal: 'asc' },
          select: {
            key: true,
            title: true,
            oracleId: true,
            status: true,
            selectedArtId: true,
          },
        },
      },
    })
    setHeader(event, 'Cache-Control', 'public, max-age=120')
    return {
      success: true,
      statusCode: 200,
      message: 'Public tarot decks loaded.',
      data: decks.map((deck) => ({
        slug: deck.slug,
        title: deck.title,
        description: deck.description,
        backUrl: deck.backArtId ? tarotArtImageUrl(deck.backArtId) : null,
        cards: deck.Cards.map((card) => ({
          key: card.key,
          title: card.title,
          oracleId: card.oracleId,
          imageUrl:
            card.status === 'APPROVED' && card.selectedArtId
              ? tarotArtImageUrl(card.selectedArtId)
              : null,
        })),
      })),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
