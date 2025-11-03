// /server/api/dominions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '@prisma/client'

function normalizeCsvString(s: string): string {
  const parts = (s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return parts.join(', ')
}

function toCsvString(v: unknown): string {
  if (Array.isArray(v)) {
    return normalizeCsvString(v.map(String).join(','))
  }
  if (typeof v === 'string') {
    return normalizeCsvString(v)
  }
  return ''
}

function toStringLongText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    // Allow objects/arrays to be stored (e.g., multi-line or json-ish rules)
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function normalizePatch(input: any): Prisma.DominionUpdateInput {
  const patch: Prisma.DominionUpdateInput = {}

  if (typeof input.title === 'string') patch.title = input.title

  if (typeof input.slug === 'string' || input.slug === null)
    patch.slug = input.slug
  if (typeof input.description === 'string' || input.description === null)
    patch.description = input.description
  if (typeof input.italics === 'string' || input.italics === null)
    patch.italics = input.italics
  if (typeof input.color === 'string' || input.color === null)
    patch.color = input.color
  if (typeof input.designer === 'string' || input.designer === null)
    patch.designer = input.designer

  if (typeof input.isPublic === 'boolean') patch.isPublic = input.isPublic
  if (typeof input.isMature === 'boolean') patch.isMature = input.isMature

  // Prisma schema: String (not Json) — store CSV strings
  if ('types' in input) patch.types = toCsvString(input.types)
  if ('keywords' in input) patch.keywords = toCsvString(input.keywords)
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
    if (k in input && Number.isFinite(Number(input[k]))) {
      ;(patch as any)[k] = Number(input[k])
    }
  })

  if (typeof input.icon === 'string' || input.icon === null)
    patch.icon = input.icon

  if (typeof input.isDuration === 'boolean') patch.isDuration = input.isDuration

  // Strings in schema — allow null, stringify objects safely
  if ('durationJSON' in input)
    patch.durationJSON = toStringLongText(input.durationJSON)
  if ('effects' in input) patch.effects = toStringLongText(input.effects) ?? '' // required String in schema
  if ('setupText' in input) patch.setupText = toStringLongText(input.setupText)
  if ('notes' in input) patch.notes = toStringLongText(input.notes)
  if ('setId' in input) patch.setId = input.setId ?? null

  // Relations
  if ('artId' in input) {
    patch.Art = input.artId
      ? { connect: { id: Number(input.artId) } }
      : { disconnect: true }
  }
  if ('artImageId' in input) {
    patch.ArtImage = input.artImageId
      ? { connect: { id: Number(input.artImageId) } }
      : { disconnect: true }
  }

  return patch
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

    const body = await readBody(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.dominion.update({
      where: { id },
      data: normalizePatch(body),
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
