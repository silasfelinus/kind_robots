// /server/api/aquarium/story/seen.post.ts
//
// Marks scenes as seen so they never replay. Body: `{ scenes: string[],
// choices?: Record<sceneId, replyId> }`, each a scene id from the canon's
// story/scenes.yaml and, for floor scenes, the reply the player picked.

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

    // cthulhuquarium/t-103: optional `{ choices: { [sceneId]: replyId } }`.
    const rawChoices = body && typeof body === 'object' ? body.choices : null
    const choices: Record<string, string> = {}
    if (rawChoices !== undefined && rawChoices !== null) {
      if (typeof rawChoices !== 'object' || Array.isArray(rawChoices)) {
        throw createError({
          statusCode: 400,
          message: 'choices must map scene ids to reply ids.',
        })
      }
      for (const [sceneId, choiceId] of Object.entries(rawChoices)) {
        if (typeof choiceId !== 'string' || choiceId.length > 40) {
          throw createError({
            statusCode: 400,
            message: 'choices must map scene ids to reply ids.',
          })
        }
        choices[sceneId] = choiceId
      }
    }

    const data = await markStoryScenesSeenForUser(
      user.id,
      user.username,
      scenes,
      choices,
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
