// GET /api/rewards/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadRewardFacetCatalog } from '~/server/utils/rewardFacetCatalog'
import { isMaturityRestricted } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Reward ID.' })
    }

    const [reward, auth] = await Promise.all([
      prisma.reward.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true, isMature: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!reward) {
      throw createError({ statusCode: 404, message: 'Reward not found.' })
    }

    /*
     * The owner/admin/public check says nothing about maturity, so a
     * maturity-restricted account could read a mature Reward's Facets --
     * names and descriptions, which is exactly the "things like text should
     * not be viewable either" case. Decided by role, so an admin is covered.
     */
    if (reward.isMature && isMaturityRestricted(auth?.user)) {
      throw createError({ statusCode: 404, message: 'Reward not found.' })
    }

    const canView =
      reward.isPublic ||
      auth?.isAdmin ||
      (auth?.user.id != null && reward.userId === auth.user.id)

    if (!canView) {
      throw createError({ statusCode: 403, message: 'Reward is private.' })
    }

    return {
      success: true,
      message: 'Reward Facets loaded.',
      data: await loadRewardFacetCatalog(id),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
