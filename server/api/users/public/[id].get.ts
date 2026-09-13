// /server/api/users/public/[id].get.ts
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Invalid user ID.',
        statusCode: 400,
      }
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
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Public user profile not found.',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: user,
      message: 'Public user found.',
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
