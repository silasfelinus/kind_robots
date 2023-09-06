// ~/server/api/users/index.ts
import { User, Prisma } from '@prisma/client'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt'
import prisma from '../utils/prisma'

// Function to create a User with a username
export async function createUserWithUsername(
  username: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const newUser = await prisma.user.create({
      data: { username }
    })
    return { success: true, user: newUser }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, message: 'Username already exists.' }
    }

    return { success: false, message: `Failed to create user: ${error.message}` }
  }
}

// Function to create a User with an email
export async function createUserWithEmail(
  email: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const newUser = await prisma.user.create({
      data: {
        username: email,
        email
      }
    })
    return { success: true, user: newUser }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, message: 'Email already exists.' }
    }

    return { success: false, message: `Failed to create user: ${error.message}` }
  }
}

// Add this function to validate user credentials
export async function validateUserCredentials(username: string, password: string) {
  try {
    // Find the user by username
    const userAuth = await prisma.userAuth.findUnique({
      where: { username }
    })

    // If user not found, return null
    if (!userAuth) {
      return null
    }

    // Compare the hashed password with the provided password
    const isPasswordValid = await bcryptCompare(password, userAuth.password!)

    if (isPasswordValid) {
      // Check if userId is not null
      if (userAuth.userId !== null) {
        // Fetch the complete user information
        const user = await prisma.user.findUnique({
          where: { id: userAuth.userId } // Use userId from UserAuth to find the User
        })
        return user
      } else {
        console.error('userId is null in UserAuth record.')
        return null
      }
    } else {
      return null
    }
  } catch (error: any) {
    console.error(`Failed to validate user credentials: ${error.message}`)
    throw new Error('Failed to validate user credentials.')
  }
}

export async function fetchUsers(
  page = 1,
  pageSize = 100
): Promise<{ success: boolean; users?: User[]; message?: string }> {
  try {
    const skip = (page - 1) * pageSize
    const users = await prisma.user.findMany({
      skip,
      take: pageSize
    })
    return { success: true, users }
  } catch (error: any) {
    console.error(`Failed to fetch users: ${error.message}`)
    return { success: false, message: 'Failed to fetch users.' }
  }
}
function validatePassword(password: string): boolean {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  return regex.test(password)
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcryptHash(password, saltRounds)
}

export async function createUserWithAuth(
  username: string,
  password: string,
  email?: string | null
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    // Validate username
    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      return { success: false, message: 'Username already exists.' }
    }

    // Validate email if provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return { success: false, message: 'Email already exists.' }
      }
    }

    // Validate password
    if (!validatePassword(password)) {
      return {
        success: false,
        message:
          'Password does not meet the criteria. Make sure it has at least 8 characters, one letter, and one number.'
      }
    }

    // Create User record first
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email ?? undefined // Use undefined if email is null
      }
    })

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create UserAuth record linked to User
    await prisma.userAuth.create({
      data: {
        username,
        email: email ?? undefined, // Use undefined if email is null
        password: hashedPassword,
        userId: newUser.id
      }
    })

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)
    return { success: false, message: `Failed to create user: ${error.message}` }
  }
}

export async function fetchUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id }
  })
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  const userExists = await prisma.user.findUnique({ where: { id } })

  if (!userExists) {
    return null
  }

  return await prisma.user.update({
    where: { id },
    data: data as Prisma.UserUpdateInput
  })
}

export async function deleteUser(id: number): Promise<boolean> {
  const userExists = await prisma.user.findUnique({ where: { id } })

  if (!userExists) {
    throw new Error(`User with id ${id} does not exist. Please provide a valid user ID.`)
  }

  try {
    // Delete UserAuth entry first
    await prisma.userAuth.delete({ where: { userId: id } })
    // Then delete User entry
    await prisma.user.delete({ where: { id } })
  } catch (error: any) {
    console.error(`Failed to delete user: ${error.message}`)
    throw new Error('Failed to delete user. Please try again.')
  }

  return true
}

export type { User }
