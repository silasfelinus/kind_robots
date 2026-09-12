// /server/api/storybook/runs/index.post.ts
//
// Open a story from the board the reader assembled: shape, deck, cast,
// setting, facets, plot thread, treasures, narrator, and an optional spark.
// The body names cards by slug; the server resolves them, checks the reader
// may use each one, snapshots the board into the run, and narrates the opening
// scene so they land on a story rather than a button.
//
// A narration failure does not discard the run -- the row is already theirs,
// and the client re-narrates by submitting a null move.

import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { manaGate } from '../../../utils/manaGate'
import { estimateTextCostUsd } from '../../../utils/manaCost'
import {
  createStoryRun,
  publicPendingTurn,
  type StoryBoardInput,
} from '../../../utils/storybookRuns'
import {
  NARRATION_MAX_TOKENS,
  NARRATION_MODEL,
} from '../../../utils/storybookNarration'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = ((await readBody(event).catch(() => null)) ||
      {}) as StoryBoardInput

    // Narration is a model call, so it is metered like every other one. The
    // pre-deck /api/davinci/runs/:id/narrate route was never gated; that gap
    // is closed here rather than retrofitted onto a live endpoint.
    await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model: NARRATION_MODEL,
        maxTokens: NARRATION_MAX_TOKENS,
      }),
    })

    const created = await createStoryRun(user.id, body)

    response = {
      success: true,
      message: created.narrationError
        ? `Story ${created.run.id} is open, but the opening scene did not arrive.`
        : `Story ${created.run.id} is open.`,
      data: {
        run: {
          id: created.run.id,
          title: created.run.title,
          shape: body.shape,
          status: created.run.status,
          turnIndex: created.run.currentChapter,
          turnBudget: created.run.turnBudget,
          deck: { key: created.deck.key, title: created.deck.title },
        },
        bible: created.bible,
        inventory: created.inventory,
        pendingTurn: publicPendingTurn(created.pendingTurn, created.deck),
        narrationError: created.narrationError,
      },
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to open the story.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
