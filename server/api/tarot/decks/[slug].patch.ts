import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'

type DeckPatch = {
  title?: string
  description?: string
  styleBible?: string
  defaultEngine?: string
  defaultCheckpoint?: string | null
  defaultLoras?: string
  backPrompt?: string
}

const LIMITS: Record<keyof DeckPatch, number> = {
  title: 200,
  description: 2000,
  styleBible: 30000,
  defaultEngine: 40,
  defaultCheckpoint: 255,
  defaultLoras: 4000,
  backPrompt: 12000,
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const slug = getRouterParam(event, 'slug')
    if (!slug)
      throw createError({ statusCode: 400, message: 'Deck is required.' })
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const patch: DeckPatch = {}
    for (const [key, max] of Object.entries(LIMITS)) {
      if (!(key in body)) continue
      const value = body[key]
      if (key === 'defaultCheckpoint' && (value === null || value === '')) {
        patch.defaultCheckpoint = null
        continue
      }
      if (typeof value !== 'string' || value.length > max) {
        throw createError({
          statusCode: 400,
          message: `Invalid ${key}: expected at most ${max} characters.`,
        })
      }
      Object.assign(patch, { [key]: value.trim() })
    }
    if (patch.title === '')
      throw createError({ statusCode: 400, message: 'Title is required.' })
    const deck = await prisma.tarotDeck.update({
      where: { slug },
      data: patch,
      include: { Cards: { orderBy: { ordinal: 'asc' } } },
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Deck bible saved.',
      data: deck,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
