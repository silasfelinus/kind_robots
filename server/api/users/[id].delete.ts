// /server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the target User ID from the URL params
    const targetUserId = Number(event.context.params?.id)
    if (isNaN(targetUserId) || targetUserId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID. It must be a positive integer.',
      })
    }

    // Validate API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    const requestingUserId = user?.id

    // Check if the API key is valid and if the requesting user matches the target user
    if (!isValid || requestingUserId !== targetUserId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this user.',
      })
    }

    // Verify the target user exists before attempting deletion
    const userExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!userExists) {
      throw createError({
        statusCode: 404,
        message: `User with ID ${targetUserId} not found.`,
      })
    }

    // Attempt to delete the user
    await prisma.user.delete({ where: { id: targetUserId } })

    // Successful deletion response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `User with ID ${targetUserId} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete user with ID ${event.context.params?.id}.`,
    }
  }
})
