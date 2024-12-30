// server/api/auth/login.post.ts
import { defineEventHandler, readBody, sendError } from 'h3'
import { validateUserCredentials } from '.'

export default defineEventHandler(async (event) => {
  try {
    // Extract and destructure the username and password from the request body
    const { username, password } = await readBody<{
      username: string
      password: string
    }>(event)

    // Validate the provided credentials
    const result = await validateUserCredentials(username, password)
    if (result && result.user) {
      // Create the response payload with user details and token
      const data = {
        ...result.user,
        token: result.token,
      }

      // Return success response
      return { success: true, data }
    } else {
      // Set response status and return invalid credentials message
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid credentials' }
    }
  } catch (error: unknown) {
    // Log the error and use sendError to manage unexpected issues
    console.error('Error during login:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return sendError(event, new Error(errorMessage))
  }
})
