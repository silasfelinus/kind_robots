import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { slugify } from '~/utils/slugify'
import { seedTarotCards, seedTarotDesigns } from '~/utils/tarotStudio'
import { TAROT_DECK_INCLUDE } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<{ title?: unknown }>(event)) ?? {}
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title || title.length > 200) {
      throw createError({
        statusCode: 400,
        message: 'A deck needs a title of at most 200 characters.',
      })
    }
    const slug = slugify(title).slice(0, 120)
    if (!slug)
      throw createError({ statusCode: 400, message: 'Invalid deck title.' })
    const existing = await prisma.tarotDeck.findUnique({ where: { slug } })
    if (existing)
      throw createError({ statusCode: 409, message: 'Deck already exists.' })
    const deck = await prisma.tarotDeck.create({
      data: {
        slug,
        title,
        description: '',
        styleBible: '',
        defaultEngine: 'krea2',
        defaultLoras: '',
        backPrompt: '',
        Cards: { create: seedTarotCards(slug) },
        Designs: { create: seedTarotDesigns(slug) },
      },
      include: TAROT_DECK_INCLUDE,
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Private deck created with 78 editable cards.',
      data: deck,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
