import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import { fetchUserById } from '.'

export default defineEventHandler(async (event) => {
  try {
    console.log('[id].get API route invoked. Setting auth to true.')
    event.context.route = { auth: true }
    // Validate the API key using the auth middleware
    auth(event)

    // Extract the user id from the query parameters
    const userId = Number(event.context.params?.id)
    if (!userId) {
      return { success: false, message: 'User ID is required.' }
    }

    // Fetch the user by their ID
    const user = await fetchUserById(userId)
    if (!user) {
      return { success: false, message: 'User not found.' }
    }

    return { success: true, user }
  } catch (error: any) {
    return { success: false, message: `Failed to fetch user: ${errorHandler(error)}` }
  }
})
