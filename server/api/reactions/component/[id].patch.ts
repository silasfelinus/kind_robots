// server/api/reactions/component/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import type { Reaction } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  let componentId: number | null = null
  let response

  try {
    componentId = Number(event.context.params?.id)

    if (Number.isNaN(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Component ID is required and must be a valid number.',
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
        componentId,
        userId,
      },
    })

    const updatedReaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: reactionData,
        })
      : await prisma.reaction.create({
          data: {
            componentId,
            userId,
            reactionType: reactionData.reactionType,
            ...reactionData,
          },
        })

    response = {
      success: true,
      data: { updatedReaction },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to update/create reaction for component with ID ${componentId}.`,
      },
    }
  }

  return response
})
