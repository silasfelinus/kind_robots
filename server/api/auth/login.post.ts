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
    if (result) {
      // Return success response if credentials are valid
      event.node.res.statusCode = 200 // OK
      return { success: true, data: { user: result.user, token: result.token } }
    } else {
      // Set status to 401 Unauthorized and return an error message
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid credentials' }
    }
  } catch (error: unknown) {
    // Log the error and handle safely with sendError for unknown cases
    console.error('Error during login:', error)

    // Safely handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Send a standardized error response using sendError
    return sendError(event, new Error(errorMessage))
  }
})
