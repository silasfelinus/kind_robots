// /server/api/users/[id].get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    const isOwner = Boolean(isValid && user?.id === userId)

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarImage: true,
        artImageId: true,
        designerName: true,
        ...(isOwner && {
          email: true,
          emailVerified: true,
          apiKey: true,
          Role: true,
          karma: true,
          mana: true,
          customIcons: true,
          smartBar: true,
          hiddenServerIds: true,
          preferredArtServerId: true,
          preferredTextServerId: true,
          showMature: true,
        }),
      },
    })

    if (!userData) {
      throw createError({
        statusCode: 404,
        message: 'User not found.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'User fetched successfully.',
      data: userData,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
