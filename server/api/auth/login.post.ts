// /server/api/auth/login.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { validateUserCredentials } from '.'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody<{
      username?: string
      password?: string
    }>(event)

    if (!username || !password) {
      setResponseStatus(event, 400)

      return {
        success: false,
        message: 'Username and password are required.',
      }
    }

    const result = await validateUserCredentials(username, password)

    if (!result?.user || !result.token) {
      setResponseStatus(event, 401)

      return {
        success: false,
        message: 'Invalid credentials.',
      }
    }

    return {
      success: true,
      message: 'Login successful.',
      data: {
        ...result.user,
        token: result.token,
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    setResponseStatus(event, statusCode ?? 500)

    return {
      success: false,
      message,
    }
  }
})
