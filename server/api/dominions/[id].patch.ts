// /server/api/dominions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prisma } from '~/server/generated/prisma'

function normalizeArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function toJsonArrayString(input: unknown): string {
  const arr = normalizeArray(input)
  return JSON.stringify(arr)
}

function toStringLongText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export default defineEventHandler(async (event) => {
  let id: number | null = null
  try {
    id = Number(event.context.params?.id)
    if (!Number.isFinite(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dominion ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.dominion.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Dominion not found.' })
    }

    // Ownership or ADMIN
    if (user.Role !== 'ADMIN' && existing.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to update this dominion.',
      })
    }

    const body = await readBody<any>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const patch: Prisma.DominionUpdateInput = {}

    // Simple scalars
    if (typeof body.title === 'string') patch.title = body.title
    if (typeof body.slug === 'string' || body.slug === null)
      patch.slug = body.slug
    if (typeof body.description === 'string' || body.description === null)
      patch.description = body.description
    if (typeof body.italics === 'string' || body.italics === null)
      patch.italics = body.italics
    if (typeof body.color === 'string' || body.color === null)
      patch.color = body.color
    if (typeof body.designer === 'string' || body.designer === null)
      patch.designer = body.designer

    if (typeof body.icon === 'string' || body.icon === null)
      patch.icon = body.icon

    if (typeof body.isPublic === 'boolean') patch.isPublic = body.isPublic
    if (typeof body.isMature === 'boolean') patch.isMature = body.isMature
    if (typeof body.isDuration === 'boolean') patch.isDuration = body.isDuration

    // types/keywords as JSON strings
    if ('types' in body) patch.types = toJsonArrayString(body.types)
    if ('keywords' in body)
      patch.keywords = toJsonArrayString(body.keywords)

      // numeric fields
    ;[
      'cardAdd',
      'actionAdd',
      'buyAdd',
      'coinAdd',
      'victoryAdd',
      'priceCoins',
      'priceDebt',
      'pricePotion',
      'version',
    ].forEach((k) => {
      if (k in body && Number.isFinite(Number(body[k]))) {
        ;(patch as any)[k] = Number(body[k])
      }
    })

    // long-text-ish fields
    if ('durationJSON' in body)
      patch.durationJSON = toStringLongText(body.durationJSON)
    if ('effects' in body) patch.effects = toStringLongText(body.effects) ?? ''
    if ('setupText' in body) patch.setupText = toStringLongText(body.setupText)
    if ('notes' in body) patch.notes = toStringLongText(body.notes)
    if ('setId' in body) patch.setId = body.setId ?? null

    // relations
    if ('artId' in body) {
      patch.Art = body.artId
        ? { connect: { id: Number(body.artId) } }
        : { disconnect: true }
    }
    if ('artImageId' in body) {
      patch.ArtImage = body.artImageId
        ? { connect: { id: Number(body.artImageId) } }
        : { disconnect: true }
    }

    const data = await prisma.dominion.update({
      where: { id },
      data: patch,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dominion updated.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to update dominion ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
