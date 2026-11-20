import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'

type CardPatch = {
  title?: string
  prompt?: string
  checkpoint?: string | null
  loras?: string
  status?: string
  upright?: string
  reversed?: string
  notes?: string
}

const LIMITS: Record<keyof CardPatch, number> = {
  title: 120,
  prompt: 12000,
  checkpoint: 255,
  loras: 4000,
  status: 24,
  upright: 4000,
  reversed: 4000,
  notes: 16000,
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid card id.' })
    }
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const patch: CardPatch = {}
    for (const [key, max] of Object.entries(LIMITS)) {
      if (!(key in body)) continue
      const value = body[key]
      if (key === 'checkpoint' && (value === '' || value === null)) {
        patch.checkpoint = null
        continue
      }
      if (typeof value !== 'string' || value.length > max) {
        throw createError({
          statusCode: 400,
          message: `Invalid ${key}: maximum ${max} characters.`,
        })
      }
      Object.assign(patch, { [key]: value.trim() })
    }
    if (patch.title === '') {
      throw createError({ statusCode: 400, message: 'Title cannot be blank.' })
    }
    if (
      patch.status &&
      !['DRAFT', 'REVIEW', 'REJECTED'].includes(patch.status)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Approval and render states require verified artwork.',
      })
    }
    const card = await prisma.tarotCard.update({
      where: { id },
      data: patch,
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Card recipe saved. Artwork has not been submitted.',
      data: card,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
