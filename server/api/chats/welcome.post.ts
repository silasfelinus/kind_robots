// /server/api/chats/welcome.post.ts
//
// Admin/server bulk tool for the inbox welcome message.
// For per-user auto-send on registration, see /server/utils/welcomeMessage.ts.
//
// POST /api/chats/welcome
// Body (optional): { markAsRead?: boolean, force?: boolean }
//   - markAsRead present (no force): toggle isRead on ALL existing welcome messages
//   - force: re-seed for every user even if one already exists
//   - neither: seed only users missing a welcome message

import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  WELCOME_SENDER,
  WELCOME_TITLE,
  WELCOME_CONTENT,
} from '../../utils/welcomeMessage'

type WelcomeBody = {
  markAsRead?: boolean
  force?: boolean
}

const SYSTEM_USER_ID = 1

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

    // Toggle read state on existing welcome messages (badge on/off for testing)
    if (!force && body.markAsRead !== undefined) {
      const updated = await prisma.chat.updateMany({
        where: {
          sender: WELCOME_SENDER,
          title: WELCOME_TITLE,
        },
        data: { isRead: markAsRead },
      })

      return {
        success: true,
        message: `Toggled ${updated.count} welcome message(s) to isRead=${markAsRead}.`,
        data: { count: updated.count, markAsRead },
      }
    }

    // Seed missing (or all, if force) welcome messages
    const allUsers = await prisma.user.findMany({ select: { id: true } })

    const existing = await prisma.chat.findMany({
      where: { sender: WELCOME_SENDER, title: WELCOME_TITLE },
      select: { recipientId: true },
    })

    const alreadySeeded = new Set(
      existing.map((c) => c.recipientId).filter(Boolean),
    )

    const toSeed = force
      ? allUsers
      : allUsers.filter((u) => !alreadySeeded.has(u.id))

    if (toSeed.length === 0) {
      return {
        success: true,
        message: 'All users already have a welcome message.',
        data: { seeded: 0 },
      }
    }

    const created = await prisma.chat.createMany({
      data: toSeed.map((u) => ({
        type: 'ToUser' as const,
        sender: WELCOME_SENDER,
        recipient: 'inbox',
        recipientId: u.id,
        userId: SYSTEM_USER_ID,
        content: WELCOME_CONTENT,
        title: WELCOME_TITLE,
        isPublic: false,
        isFavorite: false,
        isRead: markAsRead,
        isActive: true,
        isMature: false,
      })),
      skipDuplicates: true,
    })

    return {
      success: true,
      message: `Seeded welcome message for ${created.count} user(s).`,
      data: { seeded: created.count, markAsRead },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message,
      data: null,
      statusCode,
    }
  }
})
