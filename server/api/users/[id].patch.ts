// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the User ID from the URL params
    const userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID.' })
    }

    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)

    // Check if the token is valid and if the requesting user matches the target user
    if (!isValid || user?.id !== userId) {
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
    const data = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
    console.log(`User updated successfully:`, data)

    // Successful update response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'User updated successfully.',
      data,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(
      `Error handling user update for ID ${event.context.params?.id}:`,
      handledError,
    )

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to update user with ID ${event.context.params?.id}.`,
    }
  }
})
