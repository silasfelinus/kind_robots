//server/middleware/auth.ts
import { defineEventHandler, sendError, createError, getQuery } from 'h3'
import { errorHandler } from '../api/utils/error'

export default defineEventHandler(async (event) => {
  const secretKey = event.node.req.headers['x-api-key']
  const token = getQuery(event).token // Extract token from query parameters

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    return // Continue since no authentication is required
  }

  try {
    // 1. Validate the API Key
    if (!secretKey) {
      throw new Error('Authentication required: API Key is missing.')
    }

    if (secretKey !== process.env.AUTH_SECRET) {
      throw new Error('Invalid API Key provided.')
    }

    console.log('API Key authentication successful')

    // 2. Validate the Token (if provided)
    if (token) {
      console.log('Token received:', token)

      // Optionally pass the token to the event context for downstream use
      event.context.token = token
    } else {
      console.log('No token provided. Proceeding with API Key only.')
    }
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
