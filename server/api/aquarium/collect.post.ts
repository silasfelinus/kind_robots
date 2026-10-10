// /server/api/aquarium/collect.post.ts
//
// Credits the coins the player clicked in the tank (cthulhuquarium/t-080,
// conductor projects/cthulhuquarium/LOOP.md: every fed fish drops coins).
//
// Body: { value: number } -- the total value of the coins the client says it
// clicked. The server credits at most what the tank's drop rate accrued since
// its collect anchor (server/utils/aquariumCollect.ts coinAllowance). A
// client can never mint coins by inflating `value`.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { collectForUser } from '../../utils/aquarium'
import { COIN_MAX_CLAIM_PER_REQUEST } from '../../utils/aquariumCollect'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const value = Number(body?.value)
    if (
      !Number.isInteger(value) ||
      value <= 0 ||
      value > COIN_MAX_CLAIM_PER_REQUEST
    ) {
      throw createError({
        statusCode: 400,
        message: `value must be a whole number of coins between 1 and ${COIN_MAX_CLAIM_PER_REQUEST}.`,
      })
    }

    const result = await collectForUser(user.id, user.username, value)

    response = {
      success: true,
      data: result,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to collect.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
