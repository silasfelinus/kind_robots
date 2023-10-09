import { errorHandler } from '../utils/error'
import auth from '../../middleware/auth'
import prisma from '../utils/prisma'

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
export async function fetchUserById(id: number): Promise<Partial<User> | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        Role: true,
        username: true,
        // email: true, // Email is commented to exclude it from the response
        emailVerified: true,
        clickRecord: true,
        matchRecord: true,
        name: true,
        bio: true,
        birthday: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
        avatarImage: true,
        milestones: true
      }
    })
  } catch (error: any) {
    console.error(`Failed to fetch user by ID: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}
