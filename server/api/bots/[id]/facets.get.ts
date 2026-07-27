// GET /api/bots/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadBotFacetCatalog } from '~/server/utils/facetCatalog'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Bot ID.' })
    }

    const [bot, auth] = await Promise.all([
      prisma.bot.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!bot) {
      throw createError({ statusCode: 404, message: 'Bot not found.' })
    }

    const canView =
      bot.isPublic ||
      auth?.isAdmin ||
      (auth?.user.id != null && bot.userId === auth.user.id)

    if (!canView) {
      throw createError({ statusCode: 403, message: 'Bot is private.' })
    }

    return {
      success: true,
      message: 'Bot Facets loaded.',
      data: await loadBotFacetCatalog(id),
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
