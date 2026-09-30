// /server/api/aquarium/story/seen.post.ts
//
// Marks scenes as seen so they never replay. Body: `{ scenes: string[] }`,
// each a scene id from the canon's story/scenes.yaml.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { markStoryScenesSeenForUser } from '../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event).catch(() => null)
    const scenes = body && typeof body === 'object' ? body.scenes : null

    if (
      !Array.isArray(scenes) ||
      scenes.length === 0 ||
      scenes.length > 32 ||
      !scenes.every((id) => typeof id === 'string')
    ) {
      throw createError({
        statusCode: 400,
        message: 'scenes (a non-empty array of scene ids) is required.',
      })
    }

    const data = await markStoryScenesSeenForUser(
      user.id,
      user.username,
      scenes,
    )
    response = { success: true, data, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Could not record the scene.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
