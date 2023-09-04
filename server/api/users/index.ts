// ~/server/api/users/index.ts
import { User as UserRecord, Prisma } from '@prisma/client'
import { hash as bcryptHash, compare } from 'bcrypt'
import prisma from './../utils/prisma'

export type User = UserRecord

// Define a new type that includes fields from both User and UserAuth
type UserInput = Partial<UserRecord> & { password?: string }

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

// Update the isValidUserInput function to use the new UserInput type
function isValidUserInput(input: UserInput): boolean {
  return Boolean(
    input.username && input.email && input.password // Add more validation rules as needed
  )
}

// Update the addUser function to use the new UserInput type
export async function addUser(userData: UserInput): Promise<UserRecord | null> {
  if (!isValidUserInput(userData)) {
    throw new Error('Invalid user data')
  }

  const existingUser = await prisma.user.findUnique({ where: { username: userData.username! } })
  if (existingUser) {
    throw new Error('Username already in use')
  }

  const hashedPassword = await hashPassword(userData.password!)

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
    return false
  }

  await prisma.user.delete({ where: { id } })
  return true
}

export async function randomUser(): Promise<User | null> {
  const totalUsers = await prisma.user.count()

  if (totalUsers === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalUsers)
  return await prisma.user.findFirst({
    skip: randomIndex
  })
}

export async function countUsers(): Promise<number> {
  return await prisma.user.count()
}
