// /server/api/users/usernames.get.ts
import { type User } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { fetchUsers } from '.'

export default defineEventHandler(async (event) => {
  try {
    const response = await fetchUsers()

    if (!response.success || !response.users) {
      throw new Error(response.message || 'Unknown error occurred while fetching users')
    }

    const usernames = response.users.map((user) => user.username)
    return { success: true, usernames }
  } catch (error: any) {
    console.error('Failed to fetch users:', error.message) // Log the error message for debugging
    const { message } = errorHandler(error)
    return { success: false, message: `Failed to fetch users. Reason: ${message}` }
  }
})

export async function fetchUsernameById(id: number): Promise<Partial<User> | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true // Include username
        // ... other fields
      }
    })
  } catch (error: any) {
    console.error(`Failed to fetch user by ID: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}
