// /server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let targetUserId // Clearer variable name for the user ID being targeted for deletion

  try {
    // Parse and validate the target User ID from the URL params
    targetUserId = Number(event.context.params?.id)
    if (isNaN(targetUserId) || targetUserId <= 0) {
      event.node.res.statusCode = 400
      console.error(`Invalid User ID in request: ${targetUserId}`)
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader) {
      console.error('Authorization header is missing.')
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Authorization header is missing.',
      })
    }
    if (!authorizationHeader.startsWith('Bearer ')) {
      console.error('Authorization token format is incorrect.')
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token format is incorrect. Expected "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    console.log(`Received token for validation: ${token}`)

    // Check if the token matches a valid user in the database
    const requestingUser = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!requestingUser) {
      console.error(`Invalid or expired token: ${token}`)
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const requestingUserId = requestingUser.id
    console.log(
      `Requesting user ID from token: ${requestingUserId}, Target user ID: ${targetUserId}`,
    )

    // Verify that the requesting user is authorized to delete the target user
    if (requestingUserId !== targetUserId) {
      console.error(
        `Permission denied. Requesting user ID (${requestingUserId}) does not match target user ID (${targetUserId})`,
      )
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this user.',
      })
    }

    // Verify the user still exists before attempting deletion
    const userExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!userExists) {
      console.error(`User with ID ${targetUserId} does not exist.`)
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `User with ID ${targetUserId} not found.`,
      })
    }

    // Attempt to delete the user
    await prisma.user.delete({ where: { id: targetUserId } })
    console.log(`User with ID ${targetUserId} deleted successfully.`)

    // Successful deletion response
    response = {
      success: true,
      message: `User with ID ${targetUserId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(
      `Error handling user deletion for ID ${targetUserId}:`,
      handledError,
    )

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete user with ID ${targetUserId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
