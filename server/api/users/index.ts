// ~/server/api/users/index.ts
import crypto from 'crypto'
import { User, Prisma } from '@prisma/client'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

/** Generates a random API key.
 * The API key is generated using a 16-byte random buffer, which is then converted to a hexadecimal string.
 * @returns A promise that resolves to a string containing the API key.
 */
export function generateApiKey(): string {
  try {
    // Generates a random 16-byte buffer and converts it to a hexadecimal string
    const apiKey = crypto.randomBytes(16).toString('hex')
    // Returns the generated API key
    return apiKey
  } catch (error: any) {
    console.error('🔥 Failed to generate API key:', error.message)
    throw new Error('Failed to generate API key.')
  }
}

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

// Function to validate user credentials
export async function validateUserCredentials(username: string, password: string) {
  try {
    // Debug log
    console.log(`Debug: Received username: ${username}, password: ${password}`)

    // Find the user by username in UserAuth
    const userAuth = await prisma.userAuth.findUnique({
      where: { username }
    })

    // Debug log
    console.log(`Debug: Hashed password from DB: ${userAuth?.password}`)

    // If user not found, return null
    if (!userAuth) {
      console.log('Debug: User not found')
      return null
    }

    // Compare the hashed password with the provided password
    const isPasswordValid = await bcryptCompare(password, userAuth.password!)

    // Debug log
    console.log(`Debug: Is password valid: ${isPasswordValid}`)

    if (isPasswordValid) {
      const apiKey = await generateApiKey() // Generate API key

      // Update the API key for the user
      await prisma.userAuth.update({
        where: { username },
        data: { apiKey }
      })

      const user = await prisma.user.findUnique({
        where: { username }
      })

      // Generate JWT
      const token = jwt.sign({ id: user?.id, username: user?.username, apiKey }, 'yourSecretKey', {
        expiresIn: '360d'
      })

      return { user, token }
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
export function validatePassword(password: string): { isValid: boolean; message: string } {
  // Regular expression for minimum length
  const minLength = /^.{8,}$/

  // Perform validation check
  if (!minLength.test(password)) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' }
  }

  return { isValid: true, message: 'Password is valid.' }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcryptHash(password, saltRounds)
}

// Function to create a User with authentication
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

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create User record first
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email ?? undefined // Use undefined if email is null
      }
    })
    // Generate API key
    const apiKey = await generateApiKey() // <-- Don't forget to await here!

    await prisma.userAuth.create({
      data: {
        username,
        email: email ?? undefined, // Use undefined if email is null
        password: hashedPassword,
        apiKey // Store the API key
      }
    })

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)
    return { success: false, message: `Failed to create user: ${error.message}` }
  }
}

// Function to add a password to an existing User
export async function addPasswordToExistingUser(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate username
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (!existingUser) {
      return { success: false, message: 'Username does not exist.' }
    }

    // Validate password
    if (!validatePassword(password)) {
      return {
        success: false,
        message:
          'Password does not meet the criteria. Make sure it has at least 8 characters, one letter, and one number.'
      }
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Check if a UserAuth record already exists for this user
    const existingUserAuth = await prisma.userAuth.findUnique({ where: { username } })

    if (existingUserAuth) {
      // Update the existing UserAuth record with the new password
      await prisma.userAuth.update({
        where: { username },
        data: { password: hashedPassword }
      })
    } else {
      // Create a new UserAuth record for this user
      await prisma.userAuth.create({
        data: {
          username,
          password: hashedPassword
        }
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Failed to add password to existing user: ${error.message}`)
    return { success: false, message: `Failed to add password: ${error.message}` }
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
  // Check if the user exists
  const userExists = await prisma.user.findUnique({ where: { id } })

  if (!userExists) {
    throw new Error(`User with id ${id} does not exist. Please provide a valid user ID.`)
  }

  try {
    // Fetch the username from the existing user
    const username = userExists.username

    // Delete UserAuth entry first
    await prisma.userAuth.delete({ where: { username } })

    // Then delete User entry
    await prisma.user.delete({ where: { id } })
  } catch (error: any) {
    console.error(`Failed to delete user: ${error.message}`)
    throw new Error('Failed to delete user. Please try again.')
  }

  return true
}

export type { User }
