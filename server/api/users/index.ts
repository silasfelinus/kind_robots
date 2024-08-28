//server/api/users/index.ts
import type { Prisma, User } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validatePassword, hashPassword, generateApiKey } from '../auth'

export async function createUser(data: {
  username?: string
  password?: string
  email?: string
}): Promise<{
  success: boolean
  user?: User
  message?: string
  apiKey?: string
}> {
  try {
    // Ensure either username or email is provided
    if (!data.username && !data.email) {
      return {
        success: false,
        message: 'Either username or email must be provided.',
      }
    }

    // Use email as username if username is not provided
    const username = data.username || data.email

    // Validate username uniqueness
    if (username && (await userExists(username, 'username'))) {
      return { success: false, message: 'Username already exists.' }
    }

    // Validate email uniqueness if email is provided
    if (data.email) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: data.email }, // Correct way to query by email
      })
      if (existingUserWithEmail) {
        return { success: false, message: 'Email already exists.' }
      }
    }

    // Validate and hash password if provided
    if (data.password) {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message }
      }
      data.password = await hashPassword(data.password)
    }

    // Generate API key
    const apiKey = generateApiKey()

    // Create a new user
    const user = await prisma.user.create({
      data: {
        username: username || '', // Ensure username is not null
        email: data.email ?? null,
        password: data.password ?? null,
        apiKey,
        Role: 'USER', // Default role
        createdAt: new Date(),
      },
    })

    return { success: true, user, apiKey }
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(`Failed to create user: ${handledError.message}`)
    return { success: false, message: handledError.message }
  }
}

export async function fetchUsers(): Promise<{
  success: boolean
  users?: Partial<User>[]
  message?: string
}> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        Role: true,
        username: true,
        emailVerified: true,
        questPoints: true,
        name: true,
        bio: true,
        birthday: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
        avatarImage: true,
        showMature: true,
      },
    })
    return { success: true, users }
  } catch (error) {
    console.error(`Failed to fetch users: ${errorHandler(error).message}`)
    return { success: false, message: errorHandler(error).message }
  }
}

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
        showMature: true,
      },
    })
  } catch (error) {
    console.error(`Failed to fetch user by ID: ${errorHandler(error).message}`)
    throw new Error(errorHandler(error).message)
  }
}

export async function fetchIdByUsername(username: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!user?.id) {
      throw new Error('User not found or ID is not a number')
    }

    return user.id
  } catch (error) {
    console.error(
      `Failed to fetch user by username: ${errorHandler(error).message}`,
    )
    throw new Error(errorHandler(error).message)
  }
}

export async function userExists(
  identifier: string | number,
  field: 'id' | 'username' = 'id', // Removed 'email' from the options
): Promise<boolean> {
  try {
    let where: Prisma.UserWhereUniqueInput

    // Only allow checks by 'id' or 'username'
    if (field === 'id') {
      where = { id: identifier as number }
    } else if (field === 'username') {
      where = { username: identifier as string }
    } else {
      throw new Error(`Invalid field: ${field}`)
    }

    const user = await prisma.user.findUnique({ where })
    return !!user
  } catch (error) {
    console.error(
      `Failed to check user existence: ${errorHandler(error).message}`,
    )
    throw new Error(errorHandler(error).message)
  }
}

export type { User }
