// /server/api/dominions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
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
  if (Array.isArray(v)) return normalizeCsvString(v.map(String).join(','))
  if (typeof v === 'string') return normalizeCsvString(v)
  return ''
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

function asInt(v: unknown, d = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : d
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)
    if (!body?.title || typeof body.title !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Field "title" is required.',
      })
    }

    const data: Prisma.DominionCreateInput = {
      // Required
      title: body.title,

      // Optionals (strings)
      slug: (body.slug as string | null) ?? null,
      description: (body.description as string | null) ?? null,
      italics: (body.italics as string | null) ?? null,
      color: (body.color as string | null) ?? null,
      designer: (body.designer as string | null) ?? null,
      icon: (body.icon as string | null) ?? null,

      // Booleans
      isPublic:
        typeof body.isPublic === 'boolean' ? (body.isPublic as boolean) : true,
      isMature:
        typeof body.isMature === 'boolean' ? (body.isMature as boolean) : false,
      isDuration: Boolean(body.isDuration),

      // CSV strings per Prisma schema (String @LongText)
      types: toCsvString(body.types),
      keywords: toCsvString(body.keywords),

      // Numbers
      cardAdd: asInt(body.cardAdd, 0),
      actionAdd: asInt(body.actionAdd, 0),
      buyAdd: asInt(body.buyAdd, 0),
      coinAdd: asInt(body.coinAdd, 0),
      victoryAdd: asInt(body.victoryAdd, 0),
      priceCoins: asInt(body.priceCoins, 0),
      priceDebt: asInt(body.priceDebt, 0),
      pricePotion: asInt(body.pricePotion, 0),
      version: asInt(body.version, 1),

      // Long text strings (nullable in schema except effects)
      durationJSON: toStringLongText(body.durationJSON),
      effects: (toStringLongText(body.effects) ?? '').toString(), // effects is required String
      setupText: toStringLongText(body.setupText),
      notes: toStringLongText(body.notes),
      setId: (body.setId as string | null) ?? null,

      // Relations (optional)
      User: user?.id ? { connect: { id: user.id } } : undefined,
      Art: body.artId ? { connect: { id: Number(body.artId) } } : undefined,
      ArtImage: body.artImageId
        ? { connect: { id: Number(body.artImageId) } }
        : undefined,
    }

    const created = await prisma.dominion.create({ data })
    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Dominion created.',
      data: created,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message,
      statusCode: event.node.res.statusCode,
      data: null,
    }
  }
})
