// GET /api/collectibles/:set -- public catalog, odds, backs and linked art.
import { defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { collectibleArtUrl, setFromEvent } from '~/server/utils/collectibles'
import { rarityOdds } from '~/utils/collectibles/engine'

export default defineEventHandler(async (event) => {
  try {
    const set = setFromEvent(event)
    const art = await prisma.collectibleArt.findMany({
      where: { setSlug: set.slug },
      select: { itemKey: true, updatedAt: true },
    })
    setHeader(event, 'Cache-Control', 'public, max-age=120')
    return {
      success: true,
      statusCode: 200,
      message: `${set.title} loaded.`,
      data: {
        slug: set.slug,
        title: set.title,
        economy: set.economy,
        odds: rarityOdds(set),
        cards: set.cards.map(({ artPrompt: _prompt, ...card }) => card),
        backs: set.backs.map(({ artPrompt: _prompt, ...back }) => back),
        art: Object.fromEntries(
          art.map((row) => [
            row.itemKey,
            `${collectibleArtUrl(set.slug, row.itemKey)}?v=${row.updatedAt.getTime()}`,
          ]),
        ),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
