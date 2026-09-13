// /server/api/storybook/runs/[id]/index.get.ts
//
// Resume a story: the run, the scene the reader is looking at, the turns
// already played, the character sheet, and the ending if it reached one.
//
// A genre deck's axis values are withheld. The structured mode keeps sending
// its ten dimensions, which have been on screen as stat pills since
// davinci/t-014.

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import {
  effectiveTurnBudget,
  getStoryRunForUser,
  loadDeck,
  publicPendingTurn,
  readBible,
  readInventory,
  readPendingTurn,
  storyModeOf,
} from '../../../../utils/storybookRuns'
import {
  publicQuest,
  readQuestLedger,
} from '../../../../utils/storybookQuest'

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

    const run = await getStoryRunForUser(runId, user.id)
    const deck = await loadDeck(run.deckId)
    const mode = storyModeOf(run)
    // null is an endless open-ended run: it has no last turn, and the reader
    // is the one who ends it (storybook/t-040).
    const turnBudget = effectiveTurnBudget(run, deck)
    const minTurns = deck.minTurnsBeforeResolve ?? 0
    const isLifeDeck = deck.ownerKind === 'LIFE'

    const stats: Record<string, number> = {}
    for (const stat of run.Stats) stats[stat.key] = stat.value

    response = {
      success: true,
      message: `Story run ${runId} loaded.`,
      data: {
        run: {
          id: run.id,
          title: run.title,
          mode,
          // Kept for one release so a client mid-deploy does not read
          // undefined. Drops with the legacy enum values (storybook/t-039).
          shape: mode,
          status: run.status,
          turnIndex: run.currentChapter,
          turnBudget,
          narratorStyle: run.narratorStyle,
          deck: {
            key: deck.key,
            title: deck.title,
            axisCount: deck.axes.length,
          },
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
        },
        bible: readBible(run),
        // The reader owns this work, so none of it is withheld from them -- and
        // the Reading has to show the objective beside the fiction at all times.
        quest: publicQuest(readQuestLedger(run)),
        inventory: readInventory(run),
        pendingTurn: publicPendingTurn(readPendingTurn(run), deck),
        turns: run.Choices.map((choice) => ({
          turnIndex: choice.chapter,
          narrativeText: choice.prompt,
          move: {
            source: choice.source.toLowerCase(),
            text: choice.choiceText,
          },
          resultText: choice.resultText,
        })),
        ending: run.Ending,
        art: run.Art,
        readyToResolve:
          run.status === 'ACTIVE' &&
          run.currentChapter > (turnBudget ?? minTurns),
        // Withheld for a genre deck: its axes are the deck's secret.
        stats: isLifeDeck ? stats : undefined,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to load the story run.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
