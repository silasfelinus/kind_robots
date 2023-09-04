// ~/server/api/users/index.ts
import { User, Prisma } from '@prisma/client'
import { hash as bcryptHash, compare } from 'bcrypt'
import prisma from './../utils/prisma'

// Define a new type that includes fields from both User and UserAuth
type UserInput = Partial<User> & { password?: string }

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcryptHash(password, saltRounds)
}

export async function fetchUsers(page = 1, pageSize = 100): Promise<User[]> {
  const skip = (page - 1) * pageSize
  return await prisma.user.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id }
  })
}
// Update function to validate a user's username and password
export async function validateUserCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { UserAuth: true } // 👈 Include UserAuth model
  })

  if (!user || !user.UserAuth) return null

  const isValidPassword = await compare(password, user.UserAuth.password) // 👈 Use UserAuth.password
  return isValidPassword ? user : null
}

export async function validateUserInput(input: {
  username?: string
  email?: string
}): Promise<{ isValid: boolean; message: string }> {
  if (input.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username: input.username } })
    if (existingUsername) {
      return { isValid: false, message: 'Username already in use' }
    }
  }

  if (input.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } })
    if (existingEmail) {
      return { isValid: false, message: 'Email already in use' }
    }
  }

  return { isValid: true, message: 'Valid input' }
}
// Update the isValidUserInput function to use the new UserInput type
function isValidUserInput(input: UserInput): boolean {
  // Validate if either username or email is present along with a password
  return Boolean((input.username || input.email) && input.password)
}

export async function addUser(userData: UserInput): Promise<User | null> {
  if (!isValidUserInput(userData)) {
    throw new Error('Invalid user data')
  }

  const existingUser = await prisma.user.findUnique({ where: { username: userData.username! } })
  if (existingUser) {
    throw new Error('Username already in use')
  }

  const hashedPassword = await hashPassword(userData.password!)

  try {
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        UserAuth: {
          create: {
            password: hashedPassword
          }
        }
      } as Prisma.UserCreateInput
    })

    return newUser
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)
    throw new Error(error.message)
  }
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
    console.log(`User with id ${id} does not exist.`)
    return false
  }

  try {
    await prisma.user.delete({ where: { id } })
  } catch (error: any) {
    console.error(`Failed to delete user: ${error.message}`)
    throw new Error(error.message)
  }

  return true
}

export type { User }
