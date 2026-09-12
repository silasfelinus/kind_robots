// /server/api/storybook/decks/index.get.ts
//
// The ending decks a reader can pick on the Table. Axis KEYS never leave the
// server -- a deck's axes are its secret, and a reader who can read "trust"
// and "nerve" is playing a spreadsheet. Only the count goes out, plus whether
// the deck is unlocked, so the card hand can render a lock (storybook/t-038).

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listDecks } from '../../../utils/storybookRuns'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const decks = await listDecks(user.id)

    response = {
      success: true,
      message: `${decks.length} ending deck(s).`,
      data: decks,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to list ending decks.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
