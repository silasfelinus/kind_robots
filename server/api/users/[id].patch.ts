// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let userId

  try {
    // Parse and validate the User ID from the URL params
    userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID.' })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader) {
      throw createError({
        statusCode: 401,
        message: 'Authorization header is missing.',
      })
    }
    if (!authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token format is incorrect.',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    console.log(`Received token: ${token}`)

    // Check if the token matches any user in the database
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userIdFromToken = user.id
    if (userIdFromToken !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this user.',
      })
    }

    // Parse and validate the update data
    const updateData = await readBody(event)
    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }
    console.log(`Update data received:`, updateData)

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
    console.log(`User updated successfully:`, updatedUser)

    // Successful update response
    response = {
      success: true,
      message: 'User updated successfully.',
      data: updatedUser,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(`Error handling user update for ID ${userId}:`, handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update user with ID ${userId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
