// /server/api/aquarium/eggs/purchase.post.ts
//
// Buys one egg into the authenticated user's tank (cthulhuquarium/t-041),
// priced and validated entirely server-side: reserves the egg's `size` in
// the tank's weighed capacity pool immediately (checked once, here -- see
// server/utils/aquarium.ts's purchaseEggForUser for why hatching itself
// never needs its own capacity check) and charges coins up front.
//
// Body: { rarity: 'COMMON'|'UNCOMMON'|'RARE'|'EPIC'|'LEGENDARY'|'MYTHIC', size: number }

import { defineEventHandler, readBody, createError } from 'h3'
import type { Rarity } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { purchaseEggForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const body = await readBody(event)
    const rarity = String(body?.rarity ?? '') as Rarity
    if (!rarity) {
      throw createError({ statusCode: 400, message: 'rarity is required.' })
    }
    const size = Number(body?.size)
    if (!Number.isInteger(size) || size <= 0) {
      throw createError({
        statusCode: 400,
        message: 'size must be a positive integer.',
      })
    }

    const result = await purchaseEggForUser(
      user.id,
      user.username,
      rarity,
      size,
    )

    response = {
      success: true,
      message: `Bought a ${rarity.toLowerCase()} egg for ${result.cost} coins.`,
      data: result,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to buy that egg.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
