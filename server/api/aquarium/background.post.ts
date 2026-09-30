// /server/api/aquarium/background.post.ts
//
// Shows one of the backgrounds Charlotte has handed over. Body:
// `{ backgroundKey: string }`; a background the caller has not unlocked is a 403.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { setTankBackgroundForUser } from '../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)

    if (
      !body ||
      typeof body !== 'object' ||
      typeof body.backgroundKey !== 'string' ||
      !body.backgroundKey.trim()
    ) {
      throw createError({
        statusCode: 400,
        message: 'backgroundKey (string) is required.',
      })
    }

    const data = await setTankBackgroundForUser(
      user.id,
      user.username,
      body.backgroundKey.trim(),
    )
    response = { success: true, data, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not change the background.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
