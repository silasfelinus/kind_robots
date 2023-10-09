// /server/api/user/register.post.ts
import { errorHandler } from '../utils/error' // Importing the centralized error handler
import prisma from '../utils/prisma'
import { createUser } from '.'

export default defineEventHandler(async (event) => {
  console.log('🚀 Launching the user creation journey...')

  console.log('📬 Received event context params:', event.context.params) // Add this line to log the params

  try {
    // Reading the user data from the event body
    const userData = await readBody(event)
    console.log('📬 Received user data:', userData)

    // Ensuring the essential fields are provided
    if (!userData.username && !userData.email) {
      throw new Error('👤 Username or 📧 email is required to forge a new star in our universe.')
    }
    if (userData.password && userData.password.length < 8) {
      throw new Error('🔑 Password must be a strong shield with at least 8 characters.')
    }

    // Initiating the user creation with the gathered stellar dust (user data)
    const result = await createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password // Corrected the parameter passing here
    })

    // If the star formation (user creation) is successful, we celebrate with a warm welcome
    if (result.success) {
      console.log('🌟 A new star is born in our user universe:', result)
      return {
        success: true,
        message: '🌟 Welcome to our cosmic family, brave explorer! Your account has been created.',
        user: result.user
      }
    }

    // If something goes amiss in the cosmic process, we communicate the issue
    throw new Error(
      typeof result.message === 'string'
        ? `🌌 Cosmic anomaly detected: ${result.message}`
        : '🌌 An unexpected cosmic event occurred. Please try forging your star again.'
    )
  } catch (error: any) {
    // If a cosmic storm (error) occurs, we navigate safely with our error handler
    console.error('🌩️ Cosmic storm encountered:', error.message)
    const { message } = errorHandler(error)
    return { success: false, message: `🚀 Mission abort! ${message}` }
  }
})
