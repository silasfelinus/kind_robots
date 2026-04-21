// /server/api/butterflies/index.post.ts
// Admin-only. Users do not create butterfly species — they catch them.
// Species are seeded or created by admins via this endpoint.

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    if (user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Only admins can create butterfly species.',
      })
    }

    const body = await readBody<
      Partial<{
        name: string
        message: string
        wingTopColor: string
        wingBottomColor: string
        speed: number
        wingSpeed: number
        scale: number
        rarityNumber: number
        designer: string
        isPublic: boolean
        artImageId: number
      }>
    >(event)

    const {
      name,
      message,
      wingTopColor,
      wingBottomColor,
      speed,
      wingSpeed,
      scale,
      rarityNumber,
      designer,
      isPublic,
      artImageId,
    } = body

    if (!name || typeof name !== 'string') {
      throw createError({ statusCode: 400, message: '"name" is required.' })
    }
    if (!message || typeof message !== 'string') {
      throw createError({ statusCode: 400, message: '"message" is required.' })
    }
    if (!wingTopColor || !wingBottomColor) {
      throw createError({
        statusCode: 400,
        message: '"wingTopColor" and "wingBottomColor" are required.',
      })
    }
    if (
      typeof speed !== 'number' ||
      typeof wingSpeed !== 'number' ||
      typeof scale !== 'number'
    ) {
      throw createError({
        statusCode: 400,
        message: '"speed", "wingSpeed", and "scale" must be numbers.',
      })
    }
    if (typeof rarityNumber !== 'number' || rarityNumber < 1) {
      throw createError({
        statusCode: 400,
        message: '"rarityNumber" must be a positive integer.',
      })
    }

    const createData: Prisma.ButterflyCreateInput = {
      name,
      message,
      wingTopColor,
      wingBottomColor,
      speed,
      wingSpeed,
      scale,
      rarityNumber,
      designer: designer || '',
      isPublic: isPublic ?? true,
      User: { connect: { id: user.id } },
      ...(artImageId ? { ArtImage: { connect: { id: artImageId } } } : {}),
    }

    const data = await prisma.butterfly.create({ data: createData })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Butterfly created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterflies.post] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to create butterfly.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
