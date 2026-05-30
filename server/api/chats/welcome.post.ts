// /server/api/chats/welcome.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  WELCOME_SENDER,
  WELCOME_TITLE,
  sendWelcomeMessage,
} from '../../utils/welcomeMessage'

type WelcomeBody = {
  markAsRead?: boolean
  force?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Authorization required.'),
        context: 'Seed Welcome Messages',
        statusCode: 401,
      })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'

    if (!isAdmin && !isServerKey) {
      return errorHandler({
        error: new Error('Admin or server key required.'),
        context: 'Seed Welcome Messages',
        statusCode: 403,
      })
    }

    const body = await readBody<WelcomeBody>(event).catch(
      () => ({}) as WelcomeBody,
    )

    const markAsRead = body.markAsRead ?? false
    const force = body.force ?? false

    if (!force && body.markAsRead !== undefined) {
      const updated = await prisma.chat.updateMany({
        where: {
          sender: WELCOME_SENDER,
          title: WELCOME_TITLE,
        },
        data: {
          isRead: markAsRead,
        },
      })

      return {
        success: true,
        message: `Toggled ${updated.count} welcome message(s) to isRead=${markAsRead}.`,
        data: {
          count: updated.count,
          markAsRead,
        },
      }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    let seeded = 0
    let skipped = 0
    const failures: { userId: number; message: string }[] = []

    for (const targetUser of users) {
      try {
        const created = await sendWelcomeMessage(targetUser.id, {
          markAsRead,
          force,
        })

        if (created) {
          seeded += 1
        } else {
          skipped += 1
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown welcome message seed failure.'

        failures.push({
          userId: targetUser.id,
          message,
        })
      }
    }

    if (failures.length > 0) {
      return {
        success: false,
        message: `Seeded ${seeded} welcome message(s), skipped ${skipped}, failed ${failures.length}.`,
        data: {
          seeded,
          skipped,
          failed: failures.length,
          failures,
          markAsRead,
          force,
        },
        statusCode: 500,
      }
    }

    return {
      success: true,
      message:
        seeded > 0
          ? `Seeded welcome message for ${seeded} user(s).`
          : 'All users already have a welcome message.',
      data: {
        seeded,
        skipped,
        markAsRead,
        force,
      },
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'Seed Welcome Messages',
      statusCode: 500,
    })
  }
})
