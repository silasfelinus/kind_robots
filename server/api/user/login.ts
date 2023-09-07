// /server/api/login
import { validateUserCredentials } from './../users'

// Custom Error Classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Destructure and type annotate the body
    const { username, password }: { username: string; password: string } = await readBody(event)

    // Validate user credentials
    const user = await validateUserCredentials(username, password)

    if (user) {
      // 🎉 Generate a token or set a cookie here
      return {
        success: true,
        message: 'Login successful 🚀',
        user
      }
    } else {
      throw new AuthenticationError('Invalid username or password')
    }
  } catch (error: any) {
    let errorCode = 'ERR_UNKNOWN'
    let userMessage = 'An unknown error occurred 😵‍💫'

    if (error instanceof ValidationError) {
      errorCode = 'ERR_VALIDATION'
      userMessage = 'Invalid input 🤖'
    } else if (error instanceof AuthenticationError) {
      errorCode = 'ERR_AUTHENTICATION'
      userMessage = 'Invalid username or password 🛑'
    }

    // 📝 Log the error for internal review
    console.error(`[${errorCode}] ${error.message}`)

    return {
      success: false,
      errorCode,
      message: userMessage
    }
  }
})
