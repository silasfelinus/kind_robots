// /server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let targetUserId

  try {
    // Parse and validate the target User ID from the URL params
    targetUserId = Number(event.context.params?.id)
    if (isNaN(targetUserId) || targetUserId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]

    // Check if the token matches a valid user in the database
    const requestingUser = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!requestingUser) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const requestingUserId = requestingUser.id

    // Verify that the requesting user is authorized to delete the target user
    if (requestingUserId !== targetUserId) {
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
      throw createError({
        statusCode: 404,
        message: `User with ID ${targetUserId} not found.`,
      })
    }

    // Attempt to delete the user
    await prisma.user.delete({ where: { id: targetUserId } })

    // Successful deletion response
    response = {
      success: true,
      message: `User with ID ${targetUserId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)

    // Set the response and status code based on the handled error
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
