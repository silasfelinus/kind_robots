// /server/api/davinci/runs/[id]/narrate.post.ts
//
// Asks the run's narrator for the next chapter's prose, choices, and proposed
// stat deltas. Read-only by design: this route writes nothing. The client takes
// the returned choice's `effects` and posts them to
// POST /api/davinci/runs/:id/choices as a separate step, so LifeChoice/LifeStat
// writes and all outcome math stay in server/utils/davinci.ts.
//
// Only the run's owner may narrate; a COMPLETE or ABANDONED run is rejected
// with 409, matching the choices endpoint's guard.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { getLifeRunForUser } from '../../../../utils/davinci'
import prisma from '../../../../utils/prisma'
import {
  buildNarrationRequest,
  generateDaVinciChapter,
  type DaVinciNarrator,
} from '../../../../utils/davinciNarration'

const DEFAULT_NARRATOR_BOT_ID = 433

// Two-branch narrator lookup, per the narration-layer spec: LifeRun.botId wins,
// then characterId, then the default narrator bot. Reads the same columns
// GET /api/narrators/[type]/[slug] normalizes, without the self-HTTP hop.
// Lives here rather than in davinciNarration.ts so that module stays free of
// ./prisma and can be exercised by the DB-less contract suite.
async function loadRunNarrator(run: {
  botId: number | null
  characterId: number | null
}): Promise<DaVinciNarrator> {
  if (run.botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: run.botId },
      select: {
        name: true,
        personality: true,
        narrativeVoice: true,
        prompt: true,
      },
    })
    if (bot) return bot
  }

  if (run.characterId) {
    const character = await prisma.character.findUnique({
      where: { id: run.characterId },
      select: {
        name: true,
        personality: true,
        quirks: true,
        presentation: true,
        backstory: true,
        drive: true,
      },
    })
    if (character) {
      return {
        name: character.name,
        personality: character.personality || character.quirks || null,
        narrativeVoice: character.presentation || null,
        prompt:
          [
            character.backstory ? `Backstory: ${character.backstory}` : '',
            character.drive ? `Drive: ${character.drive}` : '',
          ]
            .filter(Boolean)
            .join('\n') || null,
      }
    }
  }

  const fallback = await prisma.bot.findUnique({
    where: { id: DEFAULT_NARRATOR_BOT_ID },
    select: {
      name: true,
      personality: true,
      narrativeVoice: true,
      prompt: true,
    },
  })

  return (
    fallback || {
      name: 'the Narrator',
      personality: null,
      narrativeVoice: null,
      prompt: null,
    }
  )
}

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const lifeRunId = Number(event.context.params?.id)
    if (!Number.isInteger(lifeRunId) || lifeRunId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'LifeRun ID must be a positive integer.',
      })
    }

    const body = await readBody(event).catch(() => null)
    const requestedChapter = Number(body?.chapter)

    const run = await getLifeRunForUser(lifeRunId, user.id)
    if (run.status !== 'ACTIVE') {
      throw createError({
        statusCode: 409,
        message: `LifeRun ${lifeRunId} is ${run.status}; only ACTIVE runs can be narrated.`,
      })
    }

    const narrator = await loadRunNarrator(run)
    const narrationRequest = buildNarrationRequest(
      run,
      narrator,
      Number.isInteger(requestedChapter) && requestedChapter > 0
        ? requestedChapter
        : undefined,
    )
    const data = await generateDaVinciChapter(narrationRequest)

    response = {
      success: true,
      message: `Chapter ${narrationRequest.chapter} narrated for run ${lifeRunId}.`,
      data: {
        ...data,
        chapter: narrationRequest.chapter,
        narrator: narrator.name,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to narrate chapter.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
