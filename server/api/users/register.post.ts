// /server/api/user/register.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { createUser } from '.'

export default defineEventHandler(async (event) => {
  console.log('🚀 Launching the user creation journey...')

  try {
    // Reading the user data from the event body
    const userData = await readBody(event)
    console.log('📬 Received user data:', userData)

    // Ensuring the essential fields are provided
    if (!userData.username && !userData.email) {
      return {
        success: false,
        message:
          '👤 Username or 📧 email is required to forge a new star in our universe.',
        statusCode: 400,
      }
    }
    if (userData.password && userData.password.length < 8) {
      return {
        success: false,
        message:
          '🔑 Password must be a strong shield with at least 8 characters.',
        statusCode: 400,
      }
    }

    // Initiating the user creation with the gathered stellar dust (user data)
    const result = await createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    })

    // If the star formation (user creation) is successful, we celebrate with a warm welcome
    if (result.success) {
      console.log('🌟 A new star is born in our user universe:', result)
      return {
        success: true,
        message:
          '🌟 Welcome to our cosmic family, brave explorer! Your account has been created.',
        data: result.user as User,
        statusCode: 201,
      }
    }

    // If something goes amiss in the cosmic process, we communicate the issue
    return {
      success: false,
      message:
        typeof result.message === 'string'
          ? `🌌 Cosmic anomaly detected: ${result.message}`
          : '🌌 An unexpected cosmic event occurred. Please try forging your star again.',
      statusCode: 500,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    // If a cosmic storm (error) occurs, we navigate safely with our error handler
    console.error('🌩️ Cosmic storm encountered:', message)
    return {
      success: false,
      message: `🚀 Mission abort! ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
