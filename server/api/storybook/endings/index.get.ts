// /server/api/storybook/endings/index.get.ts
//
// One deck's ending album: which endings the reader has found, and how many
// are left. Unfound endings come back as silhouettes -- id, slug, victory type
// and icon only.

import { defineEventHandler, getQuery, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { loadDeckByKey } from '../../../utils/storybookRuns'
import { readDeckCollection } from '../../../utils/storybookCollection'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const deckKey = String(getQuery(event).deckKey || '').trim()
    if (!deckKey) {
      throw createError({
        statusCode: 400,
        message: 'deckKey is required.',
      })
    }

    const deck = await loadDeckByKey(deckKey)
    const collection = await readDeckCollection(deck, user.id)

    response = {
      success: true,
      message: `${collection.found} of ${collection.total} ${deck.title} endings found.`,
      data: collection,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to read the ending collection.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
