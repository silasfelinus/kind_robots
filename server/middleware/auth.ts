// server/middleware/auth.ts
import { defineEventHandler, sendError, createError } from 'h3'
import { errorHandler } from '../api/utils/error'

export default defineEventHandler(async (event) => {
  const secretKey = event.node.req.headers['x-api-key']

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    return // Continue since no authentication is required
  }

  try {
    // Validate the API key
    if (!secretKey) {
      throw new Error('Authentication required: API Key is missing.')
    }

    if (secretKey !== process.env.AUTH_SECRET) {
      throw new Error('Invalid API Key provided.')
    }

    console.log('Authentication successful')
  } catch (error) {
    const handledError = errorHandler(error as Error)

    // Using h3's sendError if you need to throw an HTTP error directly
    return sendError(
      event,
      createError({
        statusCode: handledError.statusCode || 401,
        statusMessage: handledError.message,
      }),
    )
  }
})
