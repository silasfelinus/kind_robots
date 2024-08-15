//server/api/auth/login.post.ts
import { defineEventHandler, readBody } from 'h3'
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
      return { success: true, user: result.user, token: result.token }
    } else {
      // Throw an error if credentials are invalid
      throw new Error('Invalid credentials')
    }
  } catch (error: unknown) {
    // Log the error and return a failure response
    console.error('Error during login:', error)

    // Safely handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, message: errorMessage }
  }
})
