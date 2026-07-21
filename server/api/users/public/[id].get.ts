// /server/api/users/public/[id].get.ts
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      return errorHandler({
        statusCode: 400,
        message: 'Invalid user ID.',
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarImage: true,
        artImageId: true,
        designerName: true,
        Role: true,
        isPublic: true,
      },
    })

    if (!user) {
      return errorHandler({
        statusCode: 404,
        message: 'Public user profile not found.',
      })
    }

    return {
      success: true,
      data: user,
      message: 'Public user found.',
    }
  } catch (error) {
    return errorHandler(error)
  }
})
