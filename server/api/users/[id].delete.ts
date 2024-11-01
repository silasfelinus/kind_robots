// /server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let userId: number | null = null

  try {
    // Parse and validate the User ID from the URL params
    userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      event.node.res.statusCode = 400
      throw createError({ statusCode: 400, message: 'Invalid User ID.' })
    }

    // Extract and verify the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }
    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    if (user.id !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this user.',
      })
    }

    // Delete the user in the database
    await prisma.user.delete({ where: { id: userId } })

    return {
      success: true,
      message: `User with ID ${userId} successfully deleted.`,
    }
  } catch (error) {
    return errorHandler({
      error,
      context: `Deleting user with ID ${userId}`,
    })
  }
})
