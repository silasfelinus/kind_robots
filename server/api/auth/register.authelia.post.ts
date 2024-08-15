// /server/api/auth/register.authelia.post.ts
import { defineEventHandler, readBody } from 'h3'

const AUTHELIA_REGISTER_URL =
  'http://auth.kindrobots.org/api/firstfactor/register'

export default defineEventHandler(async (event) => {
  try {
    // Read and destructure the body from the event
    const { username, password, email } = await readBody<{
      username: string
      password: string
      email: string
    }>(event)

    // Register user with Authelia
    const response = await fetch(AUTHELIA_REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    })

    // Check if the response is OK
    if (response.ok) {
      // Assuming Authelia returns a success message or a token in the response
      return { success: true, message: 'Registration successful' }
    } else {
      // Handle non-OK responses
      const errorMessage = await response.text()
      throw new Error(`Registration failed: ${errorMessage}`)
    }
  } catch (error: unknown) {
    // Log the error and return a failure response
    console.error('Error during registration:', error)

    // Safely handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, message: errorMessage }
  }
})
