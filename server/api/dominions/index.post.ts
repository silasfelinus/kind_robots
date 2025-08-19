// /server/api/dominions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '@prisma/client'

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return [v]
  return []
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

    const body = await readBody<Partial<Prisma.DominionCreateInput>>(event)

    if (!body?.title || typeof body.title !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Field "title" is required.',
      })
    }

    // Normalize JSON-ish fields incoming from UI
    const types = asStringArray((body as any).types)
    const keywords = asStringArray((body as any).keywords)

    const data: Prisma.DominionCreateInput = {
      title: body.title,
      slug: (body as any).slug ?? null,
      description: (body as any).description ?? null,
      italics: (body as any).italics ?? null,
      color: (body as any).color ?? null,
      designer: (body as any).designer ?? null,

      // ✅ NEW: optional icon field
      icon: (body as any).icon ?? null,

      isPublic: (body as any).isPublic ?? true,
      isMature: (body as any).isMature ?? false,

      // Relations (optional)
      User: user?.id ? { connect: { id: user.id } } : undefined,
      Art: (body as any).artId
        ? { connect: { id: Number((body as any).artId) } }
        : undefined,
      ArtImage: (body as any).artImageId
        ? { connect: { id: Number((body as any).artImageId) } }
        : undefined,

      // Arrays / JSON
      types,
      keywords,

      // Baselines
      cardAdd: asInt((body as any).cardAdd, 0),
      actionAdd: asInt((body as any).actionAdd, 0),
      buyAdd: asInt((body as any).buyAdd, 0),
      coinAdd: asInt((body as any).coinAdd, 0),
      victoryAdd: asInt((body as any).victoryAdd, 0),

      isDuration: Boolean((body as any).isDuration),
      durationJSON: (body as any).durationJSON ?? null,

      priceCoins: asInt((body as any).priceCoins, 0),
      priceDebt: asInt((body as any).priceDebt, 0),
      pricePotion: asInt((body as any).pricePotion, 0),

      effects: (body as any).effects ?? {},
      setupText: (body as any).setupText ?? null,
      notes: (body as any).notes ?? null,
      version: asInt((body as any).version, 1),
      setId: (body as any).setId ?? null,
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
