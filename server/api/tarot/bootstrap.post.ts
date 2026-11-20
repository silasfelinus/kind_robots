import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { TAROT_DECK_SEEDS, seedTarotCards } from '~/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const created = await prisma.$transaction(async (tx) => {
      const results: string[] = []
      for (const seed of TAROT_DECK_SEEDS) {
        const deck = await tx.tarotDeck.upsert({
          where: { slug: seed.slug },
          update: {},
          create: {
            slug: seed.slug,
            title: seed.title,
            description: seed.description,
            styleBible: seed.styleBible,
            defaultEngine: seed.defaultEngine,
            defaultCheckpoint: seed.defaultCheckpoint,
            defaultLoras: seed.defaultLoras,
            backPrompt: seed.backPrompt,
          },
        })
        await tx.tarotCard.createMany({
          data: seedTarotCards(seed.slug).map((card) => ({
            deckId: deck.id,
            ...card,
          })),
          skipDuplicates: true,
        })
        results.push(seed.slug)
      }
      return results
    }, { timeout: 30000 })
    return {
      success: true,
      statusCode: 200,
      message: 'Three private decks seeded without overwriting edits.',
      data: created,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
