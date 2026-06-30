// POST /api/prompts/:id/bounty/claim
// Lets an authenticated user claim an open bounty prompt.
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'
import { awardKarma } from '../../../../utils/karma'
import { BountyStatus } from '~/prisma/generated/prisma/client'

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
    if (prompt.bountyStatus !== BountyStatus.OPEN) {
      throw createError({ statusCode: 409, message: `Bounty is not open (status: ${prompt.bountyStatus}).` })
    }
    if (prompt.userId === user.id) {
      throw createError({ statusCode: 400, message: 'Cannot claim your own bounty.' })
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        bountyStatus: BountyStatus.CLAIMED,
        claimerId: user.id,
      },
    })

    // Award karma to claimer — gated by KARMA_LIVE; amounts need Silas sign-off before going live
    awardKarma({ userId: user.id, reason: 'BOUNTY_CLAIMED', refId: String(id) }).catch(() => {})

    event.node.res.statusCode = 200
    return { success: true, message: 'Bounty claimed.', data: updated }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to claim bounty.' }
  }
})
