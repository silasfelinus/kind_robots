// /server/api/bots/[id].get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import { viewerShowsMature } from '../../utils/contentAccess'
import { getOptionalApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid bot ID.',
      })
    }

    const bot = await prisma.bot.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        Server: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot with id ${id} does not exist.`,
      })
    }

    /*
     * Privacy below was already right. Maturity was never asked, so a
     * maturity-restricted account could read a mature Bot -- name, subtitle,
     * description, prompt -- straight off its id. Read before the privacy
     * branch, because a PUBLIC mature Bot needs no key at all and would
     * otherwise never reach a check.
     */
    if (bot.isMature) {
      const viewer = await getOptionalApiUser(event)
      if (!viewerShowsMature(viewer?.user)) {
        throw createError({
          statusCode: 404,
          message: `Bot with id ${id} does not exist.`,
        })
      }
    }

    // Public bots are readable without a key (matches the public /api/bots list).
    // Private bots still require the owner or an admin.
    if (!bot.isPublic) {
      const { isValid, user } = await validateApiKey(event)

      if (!isValid || !user) {
        throw createError({
          statusCode: 401,
          message: 'Invalid or expired token.',
        })
      }

      const isOwner = bot.userId === user.id

      if (!isOwner && !userIsAdmin(user)) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to view this bot.',
        })
      }
    }

    return {
      success: true,
      message: 'Bot retrieved successfully.',
      data: bot,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to retrieve bot.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
