// /server/api/users/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  console.log('Fetching user by ID with optional API key inclusion.')

  try {
    // Validate user ID from the request parameters
    const userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID.' })
    }

    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    const includeSensitiveInfo = isValid && user?.id === userId

    // Fetch the user data, including the apiKey if requested
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        emailVerified: true,
        /* other fields you want to include */
        ...(includeSensitiveInfo && { apiKey: true }), // Conditionally include apiKey
      },
    })

    if (!userData) {
      throw createError({ statusCode: 404, message: 'User not found.' })
    }

    // Set a successful response with the user data
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'User fetched successfully.',
      data: userData,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return { success: false, message: handledError.message }
  }
})
