// /server/api/user/register.ts
import { errorHandler } from '../utils/error' // Importing the error handler
import { validatePassword } from '../auth' // Importing the password validation function
import { createUserWithAuth } from '.' // Importing the function to create a user with authentication details

export default defineEventHandler(async (event) => {
  try {
    // Destructuring to get the username, password, and email from the event body
    const { username, password, email } = await readBody(event)

    // If any of the required fields are missing, we throw an error
    if (!username || !password || !email) {
      throw new Error(
        '🚀 Blast off! But wait, we need all systems (username, password, email) to be a go. Please provide all the necessary details.'
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new Error(
        `🚀 Houston, we have a problem with the password: ${passwordValidation.message}`
      )
    }

    // Attempting to create a user with the provided authentication details
    const result = await createUserWithAuth(username, password, email)

    // If the user creation was successful, we return a success message along with the result
    if (result.success) {
      return {
        success: true,
        message: '🌟 Stardust sprinkled, magic spun, voila, a new user has begun! Welcome aboard!',
        user: result.user,
        token: 'your_generated_token_here' // Generate and return a token for the new user
      }
    }

    // If we reach here, it means the user creation was not successful, and we throw an error
    throw new Error(
      typeof result.message === 'string'
        ? result.message
        : '🌌 Oops, we ventured into a black hole. User creation unsuccessful.'
    )
  } catch (error: any) {
    // If any error occurs, we handle it gracefully using the error handler and return a structured error response
    const { message } = errorHandler(error)
    return { success: false, message: `🚀 Mission abort! ${message}` }
  }
})
