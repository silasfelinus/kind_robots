// /server/api/storybook/runs/[id]/proposals/[proposalId]/apply.post.ts
//
// Apply one quest proposal. THE ONLY ROUTE IN STORYBOOK THAT WRITES ANYTHING
// REAL (storybook/t-045).
//
// A taskmaster turn may propose an outcome for a real to-do or a needs-human
// decision. Playing the turn records the proposal and changes nothing. This is
// the separate, explicit, authenticated step where the reader says yes -- which
// is the rule that survived the Storybook/Taskmaster merge intact:
// docs/products/storybook-taskmaster-boundary.md.
//
// What it can do, and the list is closed: mark a HONEYDO todo DONE and append
// the note, or create one AGENT todo recording a decision about a conductor
// task. Conductor roadmap YAML is never written. Idempotent -- clicking twice
// does not create two to-dos.

import { defineEventHandler, createError, getRouterParam } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import {
  applyQuestProposal,
  publicQuest,
} from '@/server/utils/storybookQuest'

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

    const proposalId = String(getRouterParam(event, 'proposalId') || '').trim()
    if (!proposalId) {
      throw createError({
        statusCode: 400,
        message: 'A proposal id is required.',
      })
    }

    const applied = await applyQuestProposal(runId, user.id, proposalId)

    response = {
      success: true,
      message: applied.alreadyApplied
        ? 'That was already applied; nothing changed a second time.'
        : applied.proposal.effect,
      data: {
        proposal: { ...applied.proposal, applied: true },
        quest: publicQuest(applied.ledger),
        alreadyApplied: applied.alreadyApplied,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to apply that proposal.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
