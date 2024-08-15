//server/api/auth/authelia.post.ts
import { defineEventHandler, readBody } from 'h3'

const AUTHELIA_API_URL = 'http://auth.kindrobots.org/api/firstfactor'

export default defineEventHandler(async (event) => {
  try {
    // Read and destructure the body from the event
    const { username, password } = await readBody<{
      username: string
      password: string
    }>(event)

    // Authenticate user with Authelia
    const response = await fetch(AUTHELIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    // Check if the response is OK
    if (response.ok) {
      const data = await response.json()
      // Assuming Authelia returns a token in the response
      const { token } = data
      return { success: true, token }
    } else {
      // Handle non-OK responses
      const errorMessage = await response.text()
      throw new Error(`Authentication failed: ${errorMessage}`)
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
