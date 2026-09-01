// server/api/auth/login.post.ts
import { defineEventHandler, isError, readBody, sendError, setCookie } from 'h3'
import { validateUserCredentials } from '.'
import {
  assertAuthAttemptAllowed,
  clearAuthFailures,
  recordAuthFailure,
} from '../../utils/authAttemptLimit'
import { logSafeError } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody<{
      username: string
      password: string
    }>(event)

    const safeUsername = typeof username === 'string' ? username : ''
    assertAuthAttemptAllowed(event, safeUsername)

    const result = await validateUserCredentials(username, password)

    if (result && result.user) {
      clearAuthFailures(event, safeUsername)
      const sessionValue = String(result.token ?? '')

      if (sessionValue) {
        setCookie(event, 'kind-session', sessionValue, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        })
      }

      const data = {
        ...result.user,
        token: result.token,
      }

      return { success: true, data }
    }

    recordAuthFailure(event, safeUsername)
    event.node.res.statusCode = 401
    return { success: false, message: 'Invalid credentials' }
  } catch (error: unknown) {
    if (isError(error)) {
      return sendError(event, error)
    }
    logSafeError('Error during login:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return sendError(event, new Error(errorMessage))
  }
})
