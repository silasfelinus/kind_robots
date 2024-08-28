import type { User } from '@prisma/client'
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract the user ID from the query parameters
    const userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      return { success: false, message: 'Invalid User ID.' }
    }

    // Fetch the user by their ID
    const user = await fetchUserById(userId)
    if (!user) {
      return { success: false, message: 'User not found.' }
    }

    return { success: true, user }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    return { success: false, message: `Failed to fetch user: ${message}` }
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
        karma: true,
        mana: true,
        showMature: true,
      },
    })
  } catch (error: unknown) {
    console.error(`Failed to fetch user by ID: ${(error as Error).message}`)
    throw new Error(errorHandler(error).message)
  }
}
