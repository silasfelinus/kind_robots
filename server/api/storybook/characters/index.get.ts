// /server/api/storybook/characters/index.get.ts
//
// The gated subset of Characters, for the Table's hand to render a lock on
// (storybook/t-038). Mirrors GET /api/storybook/decks: an ungated Character
// never appears here, so the Table treats "absent" the same as "unlocked".

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listGatedCharacters } from '../../../utils/storybookRuns'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const characters = await listGatedCharacters(user.id)

    response = {
      success: true,
      message: `${characters.length} gated character(s).`,
      data: characters,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to list gated characters.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
