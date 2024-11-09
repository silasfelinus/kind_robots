// server/api/auth/login.post.ts
import { defineEventHandler, readBody, sendError } from 'h3'
import { validateUserCredentials } from '.'

export default defineEventHandler(async (event) => {
  try {
    // Read and destructure the body from the event
    const { username, password } = await readBody<{
      username: string
      password: string
    }>(event)

    // Validate the user credentials
    const result = await validateUserCredentials(username, password)
    if (result && result.user) {
      // Extract the user data and token directly into the data object
      const data = {
        ...result.user,
        token: result.token,
      }

      // Return success response with data containing user info and token
      return { success: true, data }
    } else {
      // Throw an error if credentials are invalid
      event.node.res.statusCode = 401 // Set status to 401 Unauthorized
      return { success: false, message: 'Invalid credentials' }
    }
  } catch (error: unknown) {
    // Log the error and return a failure response
    console.error('Error during login:', error)

    // Safely handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Use sendError to set an appropriate status code if not already set
    return sendError(event, new Error(errorMessage))
  }
})
