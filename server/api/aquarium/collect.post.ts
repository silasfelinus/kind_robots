// /server/api/aquarium/collect.post.ts
//
// Credits shed scales the player clicked in the tank (cthulhuquarium/t-071,
// DESIGN-BRIEF MVP item 2: "Click drifting collectibles for coins").
//
// Body: { count: number } -- how many scales the client says it clicked. The
// server credits at most what the elapsed time since the tank's collect
// anchor could have spawned (server/utils/aquariumCollect.ts
// collectAllowance), valued off the tank's current production. A client can
// never mint coins by inflating `count`.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { collectForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const count = Number(body?.count)
    if (!Number.isInteger(count) || count <= 0) {
      throw createError({
        statusCode: 400,
        message: 'count must be a positive integer.',
      })
    }

    const result = await collectForUser(user.id, user.username, count)

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
