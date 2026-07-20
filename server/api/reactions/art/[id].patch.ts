// server/api/reactions/art/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { assertReactionContentTargetAccessible } from '../access'

export default defineEventHandler(async (event) => {
  let artImageId: number | null = null

  try {
    artImageId = Number(event.context.params?.id)

    if (Number.isNaN(artImageId) || artImageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Art ID is required and must be a valid number.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)
    const userId = user.id

    const body = await readBody(event)
    const { reactionType } = body

    if (!reactionType) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    // The target ArtImage must exist and be public or owned by the reacting
    // user (admins bypass), matching POST /api/reactions (audit F-2 residual).
    const targetArtImageId: number = artImageId
    await assertReactionContentTargetAccessible({
      find: () =>
        prisma.artImage.findUnique({
          where: { id: targetArtImageId },
          select: { userId: true, isPublic: true },
        }),
      label: 'ArtImage',
      targetId: targetArtImageId,
      userId,
      isAdmin,
    })

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        artImageId,
        userId,
      },
    })

    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { reactionType },
        })
      : await prisma.reaction.create({
          data: {
            userId,
            artImageId,
            reactionType,
          },
        })

    event.node.res.statusCode = existingReaction ? 200 : 201

    return {
      success: true,
      message: existingReaction
        ? 'Reaction updated successfully.'
        : 'Reaction created successfully.',
      data: reaction,
      reaction,
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to update/create reaction for art with ID ${artImageId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
