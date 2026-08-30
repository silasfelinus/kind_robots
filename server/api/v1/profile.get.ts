import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireScopedApiUser } from '@/server/utils/authGuard'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireScopedApiUser(event, 'profile:read')

    const bot = auth.botId
      ? await prisma.bot.findFirst({
          where: {
            id: auth.botId,
            userId: auth.user.id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            avatarImage: true,
          },
        })
      : null

    return {
      success: true,
      data: {
        actorKind: auth.kind === 'agent-credential' ? 'AI_AGENT' : 'HUMAN',
        authKind: auth.kind,
        operator: {
          id: auth.user.id,
          username: auth.user.username,
        },
        bot,
        scopes: auth.kind === 'agent-credential' ? (auth.scopes ?? []) : null,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
