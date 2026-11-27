import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { slugify } from '~/utils/slugify'
import { designBackPrompt } from '~/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const deckSlug = typeof body.deckSlug === 'string' ? body.deckSlug : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title || title.length > 160) {
      throw createError({
        statusCode: 400,
        message: 'A design needs a title of at most 160 characters.',
      })
    }
    const deck = await prisma.tarotDeck.findUnique({
      where: { slug: deckSlug },
      select: { id: true, backPrompt: true, defaultEngine: true },
    })
    if (!deck)
      throw createError({ statusCode: 404, message: 'Deck not found.' })
    const base = slugify(title).slice(0, 70) || 'design'
    let key = base
    for (
      let n = 2;
      await prisma.tarotDesign.findUnique({
        where: { deckId_key: { deckId: deck.id, key } },
      });
      n++
    ) {
      key = `${base}-${n}`
    }
    const stylePrompt =
      typeof body.stylePrompt === 'string' && body.stylePrompt.trim()
        ? body.stylePrompt.trim().slice(0, 12000)
        : 'Richly detailed painted illustration with luminous color and soft dramatic light.'
    const design = await prisma.tarotDesign.create({
      data: {
        deckId: deck.id,
        key,
        title,
        stylePrompt,
        backPrompt: designBackPrompt(
          deck.backPrompt,
          'rendered in the same style',
        ),
        engine: deck.defaultEngine || 'krea2',
        loras: '',
        notes: '',
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Design added. Generate samples to compare it.',
      data: design,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
