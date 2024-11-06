// /server/api/user/[id].get.ts

import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

const AUTH_SECRET = process.env.AUTH_SECRET // Set your auth-secret as an environment variable

export default defineEventHandler(async (event) => {
  console.log('Fetching user by ID with optional API key inclusion.')

  try {
    // Extract the user ID from the route parameters
    const userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      return { success: false, message: 'Invalid User ID.' }
    }

    // Check for the auth-secret header and validate it
    const authSecretHeader = event.req.headers['auth-secret']
    const returnApiKey = authSecretHeader === AUTH_SECRET

    // Fetch the user, including the apiKey if returnApiKey is true
    const user = await fetchUserById(userId, returnApiKey)
    if (!user) {
      return { success: false, message: 'User not found.' }
    }

    return { success: true, user }
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    return { success: false, message: `Failed to fetch user: ${message}` }
  }
})

// Modify fetchUserById to conditionally include apiKey
export async function fetchUserById(id: number, includeApiKey = false): Promise<Partial<User> | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        Role: true,
        username: true,
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
        ...(includeApiKey && { apiKey: true }), // Conditionally include apiKey
      },
    })
  } catch (error: unknown) {
    console.error(`Failed to fetch user by ID: ${(error as Error).message}`)
    throw new Error(errorHandler(error).message)
  }
}
