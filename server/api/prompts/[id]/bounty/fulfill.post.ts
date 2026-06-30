// POST /api/prompts/:id/bounty/fulfill
// Marks a claimed (or open) bounty as fulfilled; awards mana to claimer and poster from house pool.
// IMPORTANT: Mana amounts below are placeholder drafts — Silas must approve before KARMA_LIVE is enabled.
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'
import { userIsAdmin } from '../../../../utils/authUser'
import { awardKarma } from '../../../../utils/karma'
import { applyMana } from '../../../../utils/mana'
import { BountyStatus } from '~/prisma/generated/prisma/client'

// Draft placeholder amounts — needs Silas sign-off before KARMA_LIVE = true
const BOUNTY_MANA_FULFILLER = 50  // mana to the person who delivered
const BOUNTY_MANA_POSTER = 25     // mana returned to the bounty poster as a thank-you from the house

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid prompt ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id } })
    if (!prompt) {
      throw createError({ statusCode: 404, message: 'Prompt not found.' })
    }
    if (!prompt.isBounty) {
      throw createError({ statusCode: 400, message: 'Prompt is not a bounty.' })
    }
    if (
      prompt.bountyStatus !== BountyStatus.CLAIMED &&
      prompt.bountyStatus !== BountyStatus.OPEN
    ) {
      throw createError({
        statusCode: 409,
        message: `Bounty cannot be fulfilled (status: ${prompt.bountyStatus}).`,
      })
    }

    // Claimer, original poster, or admin may fulfill
    const isAuthorized =
      user.id === prompt.claimerId ||
      user.id === prompt.userId ||
      userIsAdmin(user)
    if (!isAuthorized) {
      throw createError({
        statusCode: 403,
        message: 'Only the claimer, poster, or an admin may fulfill this bounty.',
      })
    }

    const fulfillerId = prompt.claimerId ?? user.id
    const posterId = prompt.userId
    const refId = String(id)

    const updated = await prisma.prompt.update({
      where: { id },
      data: { bountyStatus: BountyStatus.FULFILLED },
    })

    // Award mana + karma to fulfiller (fire-and-forget; gated by KARMA_LIVE)
    applyMana({
      userId: fulfillerId,
      amount: BOUNTY_MANA_FULFILLER,
      reason: 'BOUNTY_REWARD',
      refId,
      note: 'bounty fulfilled — house award',
    }).catch(() => {})
    awardKarma({ userId: fulfillerId, reason: 'BOUNTY_FULFILLED', refId }).catch(() => {})

    // Return mana to poster as house reward for posting a helpful bounty
    if (posterId && posterId !== fulfillerId) {
      applyMana({
        userId: posterId,
        amount: BOUNTY_MANA_POSTER,
        reason: 'BOUNTY_REWARD',
        refId,
        note: 'bounty poster reward — house award',
      }).catch(() => {})
    }

    event.node.res.statusCode = 200
    return { success: true, message: 'Bounty fulfilled.', data: updated }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to fulfill bounty.' }
  }
})
