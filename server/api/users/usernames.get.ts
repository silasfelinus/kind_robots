// /server/api/users/usernames.get.ts
import type { User } from '@prisma/client'
import { defineEventHandler } from 'h3'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import prisma from '../utils/prisma'
import { fetchUsers } from '.'

export default defineEventHandler(async () => {
  // Initialize the error store
  const errorStore = useErrorStore()

  try {
    const response = await fetchUsers()

    if (!response.success || !response.users) {
      throw new Error(
        response.message || 'Unknown error occurred while fetching users',
      )
    }

    const usernames = response.users.map((user) => user.username)
    return { success: true, usernames }
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred while fetching users'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Log the error using errorStore
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMessage)

    // Return a response with the error message from errorStore
    return {
      success: false,
      message: `Failed to fetch users. Reason: ${errorStore.message}`,
    }
  }
})

export async function fetchUsernameById(
  id: number,
): Promise<Partial<User> | null> {
  // Initialize the error store
  const errorStore = useErrorStore()

  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true, // Include username
        // ... other fields
      },
    })
  } catch (error: unknown) {
    let errorMessage = `Failed to fetch user by ID: ${id}`

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Log the error using errorStore
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMessage)

    // Throw an error with the message from errorStore
    throw new Error(errorStore.message || 'Failed to fetch user by ID.')
  }
}
