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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarImage: true,
        artImageId: true,
        designerName: true,
      },
    })

    if (!user) {
      return errorHandler({
        statusCode: 404,
        message: 'User not found.',
      })
    }

    return {
      success: true,
      data: user,
      message: 'User found.',
    }
  } catch (error) {
    return errorHandler(error)
  }
})
