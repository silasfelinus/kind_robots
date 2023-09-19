// server/api/users/index.ts
import { User, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validatePassword, hashPassword, generateApiKey } from './../auth'

export async function createUser(data: {
  username: string
  password?: string
  email?: string
}): Promise<{ success: boolean; user?: User; message?: string; apiKey?: string }> {
  try {
    // Validate username and email uniqueness
    if (
      (await userExists(data.username, 'username')) ||
      (data.email && (await userExists(data.email, 'email')))
    ) {
      return { success: false, message: 'Username or email already exists.' }
    }

    // If password is provided, validate and hash the password
    if (data.password) {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message }
      }
      data.password = await hashPassword(data.password)
    }

    // Generate API key
    const apiKey = generateApiKey()

    // Create User record with all necessary fields
    const user = await prisma.user.create({
      data: {
        ...data,
        apiKey
      }
    })

    return { success: true, user, apiKey }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)
    return { success: false, message: errorHandler(error).message }
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
        avatarImage: true
      }
    })
    return { success: true, users }
  } catch (error: any) {
    console.error(`Failed to fetch users: ${error.message}`)
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
        // email: true, // Email is commented to exclude it from the response
        emailVerified: true,
        questPoints: true,
        name: true,
        bio: true,
        birthday: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
        avatarImage: true
        // Add other fields that you want to expose, excluding sensitive fields
      }
    })
  } catch (error: any) {
    console.error(`Failed to fetch user by ID: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  try {
    return await prisma.user.update({ where: { id }, data })
  } catch (error: any) {
    console.error(`Failed to update user: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new Error(`User with id ${id} does not exist. Please provide a valid user ID.`)

    await prisma.user.delete({ where: { id } })
    return true
  } catch (error: any) {
    console.error(`Failed to delete user: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}
export async function userExists(
  identifier: string | number,
  field: 'id' | 'username' | 'email' = 'id'
): Promise<User | null> {
  try {
    let where: Prisma.UserWhereUniqueInput

    if (field === 'id') {
      where = { id: identifier as number }
    } else if (field === 'username') {
      where = { username: identifier as string }
    } else if (field === 'email') {
      where = { email: identifier as string }
    } else {
      throw new Error(`Invalid field: ${field}`)
    }

    return await prisma.user.findUnique({ where })
  } catch (error: any) {
    console.error(`Failed to fetch user: ${error.message}`)
    throw new Error(errorHandler(error).message)
  }
}

export type { User }
