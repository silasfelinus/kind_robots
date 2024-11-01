// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
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

    // Extract and verify the Authorization token
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
        message: 'You do not have permission to update this user.',
      })
    }

    // Parse the request body and validate fields for the update
    const updateData = await readBody(event)
    // Add additional checks on `updateData` properties if needed

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Success response
    event.node.res.statusCode = 200
    return {
      success: true,
      user: updatedUser,
      message: 'User updated successfully.',
      statusCode: 200,
    }
  } catch (error) {
    return errorHandler({
      error,
      context: `Updating user with ID ${userId}`,
    })
  }
})
