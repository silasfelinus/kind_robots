// /server/api/reactions/chat/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import type { Reaction } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  let chatId: number | null = null

  try {
    chatId = Number(event.context.params?.id)

    if (Number.isNaN(chatId) || chatId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'chat ID is required and must be a valid number.',
      })
    }

    const { user } = await requireApiUser(event)
    const userId = user.id
    const reactionData: Partial<Reaction> = await readBody(event)

    if (!reactionData?.reactionType) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        chatId,
        userId,
      },
    })

    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: reactionData,
        })
      : await prisma.reaction.create({
          data: {
            chatId,
            userId,
            reactionType: reactionData.reactionType,
            ...reactionData,
          },
        })

    return { success: true, data: { reaction } }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to update/create reaction for chat exchange with ID ${chatId}.`,
      },
    }
  }
})
