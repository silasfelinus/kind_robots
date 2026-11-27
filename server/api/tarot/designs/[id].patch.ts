import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { TAROT_DESIGN_ENGINES } from '~/utils/tarotStudio'

const LIMITS = {
  title: 160,
  stylePrompt: 12000,
  backPrompt: 12000,
  engine: 40,
  checkpoint: 255,
  loras: 4000,
  notes: 16000,
} as const

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid design id.' })
    }
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const patch: Record<string, string | null> = {}
    for (const [key, max] of Object.entries(LIMITS)) {
      if (!(key in body)) continue
      const value = body[key]
      if (key === 'checkpoint' && (value === null || value === '')) {
        patch.checkpoint = null
        continue
      }
      if (typeof value !== 'string' || value.length > max) {
        throw createError({
          statusCode: 400,
          message: `Invalid ${key}: maximum ${max} characters.`,
        })
      }
      patch[key] = value.trim()
    }
    if (patch.title === '') {
      throw createError({ statusCode: 400, message: 'Title cannot be blank.' })
    }
    if (
      patch.engine &&
      !(TAROT_DESIGN_ENGINES as readonly string[]).includes(patch.engine)
    ) {
      throw createError({ statusCode: 400, message: 'Unsupported engine.' })
    }
    if ('status' in body) {
      if (body.status !== 'EXPLORING' && body.status !== 'ARCHIVED') {
        throw createError({
          statusCode: 400,
          message: 'Use the approve action to approve a design.',
        })
      }
      patch.status = body.status
    }
    const design = await prisma.tarotDesign.update({
      where: { id },
      data: patch,
    })
    if (patch.status) {
      await prisma.tarotDeck.updateMany({
        where: { id: design.deckId, approvedDesignId: id },
        data: { approvedDesignId: null },
      })
    }
    return {
      success: true,
      statusCode: 200,
      message: `${design.title} saved.`,
      data: design,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
