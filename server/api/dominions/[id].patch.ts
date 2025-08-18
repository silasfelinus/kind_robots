// /server/api/dominions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '@prisma/client'

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return [v]
  return []
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

  if ('types' in input) patch.types = asStringArray(input.types)
  if ('keywords' in input) patch.keywords = asStringArray(input.keywords)
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
    if (k in input && Number.isFinite(Number(input[k])))
      (patch as any)[k] = Number(input[k])
  })

  if (typeof input.isDuration === 'boolean') patch.isDuration = input.isDuration
  if ('durationJSON' in input) patch.durationJSON = input.durationJSON ?? null
  if ('effects' in input) patch.effects = input.effects ?? {}
  if ('setupText' in input) patch.setupText = input.setupText ?? null
  if ('notes' in input) patch.notes = input.notes ?? null
  if ('setId' in input) patch.setId = input.setId ?? null

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
