// /server/api/users/usernames.get.ts
import type { User } from '@prisma/client'
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { fetchUsers } from '.'

export default defineEventHandler(async () => {
  try {
    const response = await fetchUsers()

    // Handle case where response does not include users or users is not an array
    const users = Array.isArray(response.users) ? response.users : []
    const usernames = users.map((user) => user.username).filter(Boolean) // Filter out undefined or null usernames

    return {
      success: true,
      message: 'Usernames fetched successfully.',
      data: { usernames },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Failed to fetch usernames:', handledError.message) // Log the error message for debugging

    return {
      success: false,
      message: `Failed to fetch usernames. Reason: ${handledError.message}`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Additional utility function for fetching username by ID
export async function fetchUsernameById(
  id: number,
): Promise<Partial<User> | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true, // Include username
        // ... other fields if needed
      },
    })
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Failed to fetch user by ID: ${handledError.message}`)
    throw new Error(handledError.message)
  }
}
