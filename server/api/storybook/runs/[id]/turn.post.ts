// /server/api/storybook/runs/[id]/turn.post.ts
//
// One turn: record the reader's move and narrate the next scene.
//
// The life engine split this into POST .../narrate and POST .../choices, which
// left the client posting back the stat deltas it had been shown. Here the
// server holds the offered options in LifeRun.pendingTurn, so the body names
// an option id and nothing else. A written move or a card played from the
// character sheet is scored by the narrator and clamped server-side.
//
// Body: { turnIndex, move: { source: 'option'|'custom'|'sheet', text?,
//         optionId?, rewardSlug? } | null }. A null move asks for the current
// scene when there isn't one -- it cannot reroll a scene that already exists.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { manaGate } from '../../../../utils/manaGate'
import { estimateTextCostUsd } from '../../../../utils/manaCost'
import { submitStoryTurn } from '../../../../utils/storybookRuns'
import {
  NARRATION_MAX_TOKENS,
  NARRATION_MODEL,
} from '../../../../utils/storybookNarration'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const runId = Number(event.context.params?.id)
    if (!Number.isInteger(runId) || runId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Story run ID must be a positive integer.',
      })
    }

    const body = (await readBody(event).catch(() => null)) as {
      turnIndex?: number
      move?: {
        source?: string
        text?: string
        optionId?: string | null
        rewardSlug?: string | null
      } | null
    } | null

    await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model: NARRATION_MODEL,
        maxTokens: NARRATION_MAX_TOKENS,
      }),
    })

    const move = body?.move
      ? {
          source: String(body.move.source || 'option') as
            'option' | 'custom' | 'sheet',
          text: String(body.move.text || ''),
          optionId: body.move.optionId ?? null,
          rewardSlug: body.move.rewardSlug ?? null,
        }
      : null

    const result = await submitStoryTurn(runId, user.id, {
      turnIndex: Number(body?.turnIndex),
      move,
    })

    response = {
      success: true,
      message: result.replayed
        ? `Turn ${body?.turnIndex} was already played.`
        : `Story run ${runId} is on turn ${result.turnIndex}.`,
      data: {
        turn: result.turn
          ? {
              turnIndex: result.turn.chapter,
              narrativeText: result.turn.prompt,
              move: {
                source: result.turn.source.toLowerCase(),
                text: result.turn.choiceText,
              },
              resultText: result.turn.resultText,
            }
          : null,
        pendingTurn: result.pendingTurn,
        inventory: result.inventory,
        turnIndex: result.turnIndex,
        turnBudget: result.turnBudget,
        isFinalTurn: result.isFinalTurn,
        readyToResolve: result.readyToResolve,
        stats: result.stats,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to play this turn.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
