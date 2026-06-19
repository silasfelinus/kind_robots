// /server/api/dreams/[id].delete.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { assertDreamAccess, dreamInclude, getDreamId } from './index'

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const query = getQuery(event)
    const hardDelete = parseBoolean(query.hard)

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        Role: true,
      },
    })

    if (!userRecord) {
      throw createError({
        statusCode: 401,
        message: 'Authenticated user could not be found.',
      })
    }

    const dream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        artImageId: true,
        isActive: true,
        isPublic: true,
        isMature: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${id} not found.`,
      })
    }

    assertDreamAccess({
      dream,
      userId: userRecord.id,
      userRole: userRecord.Role,
      action: 'mutate',
    })

    const actor = userRecord.username || `User ${userRecord.id}`

    if (!hardDelete) {
      const data = await prisma.dream.update({
        where: { id },
        data: {
          isActive: false,
        },
        include: dreamInclude,
      })

      await prisma.chat.create({
        data: {
          type: 'Dream',
          sender: actor,
          content: `Dream archived: ${dream.title}`,
          title: dream.title,
          userId: userRecord.id,
          dreamId: id,
          artImageId: dream.artImageId ?? undefined,
          isPublic: dream.isPublic,
          isMature: dream.isMature,
          channel: `dream-${id}`,
        },
      })

      event.node.res.statusCode = 200

      return {
        success: true,
        message: `Dream "${dream.title}" archived successfully by ${actor}.`,
        data,
        statusCode: 200,
      }
    }

    const data = await prisma.$transaction(async (tx) => {
      await tx.chat.updateMany({
        where: { dreamId: id },
        data: { dreamId: null },
      })

      await tx.composition.updateMany({
        where: { dreamId: id },
        data: { dreamId: null },
      })

      await tx.reaction.deleteMany({
        where: { dreamId: id },
      })

      await tx.dream.update({
        where: { id },
        data: {
          Scenarios: { set: [] },
          Characters: { set: [] },
          Rewards: { set: [] },
          ArtImages: { set: [] },
          ArtCollections: { set: [] },
        },
      })

      return tx.dream.delete({
        where: { id },
      })
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Dream "${dream.title}" permanently deleted by ${actor}.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to delete Dream with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
