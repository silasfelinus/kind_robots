// server/api/users/index.ts
import { User, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validatePassword, hashPassword, generateApiKey } from './../auth'

async function createUser(
  data: Prisma.UserCreateInput
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const newUser = await prisma.user.create({ data })
    return { success: true, user: newUser }
  } catch (error: any) {
    console.error(`Failed to create user: ${error.message}`)
    return { success: false, message: errorHandler(error).message }
  }
}
export async function createUserWithAuth(
  username: string,
  password: string,
  email?: string | null
) {
  try {
    if ((await userExists(username, 'username')) || (email && (await userExists(email, 'email')))) {
      return { success: false, message: 'Username or email already exists.' }
    }
    console.log('Password to validate:', password)

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(password)
    const newUser = await prisma.user.create({ data: { username, email: email ?? undefined } })
    const apiKey = generateApiKey()

    await prisma.userAuth.create({
      data: {
        username,
        email: email ?? undefined,
        password: hashedPassword,
        apiKey
      }
    })

    return { success: true, user: newUser }
  } catch (error: any) {
    return { success: false, message: errorHandler(error) }
  }
}

export async function createUserWithUsername(username: string) {
  return createUser({ username })
}

export async function createUserWithEmail(email: string) {
  return createUser({ username: email, email })
}

export async function fetchUsers(): Promise<{
  success: boolean
  users?: User[]
  message?: string
}> {
  try {
    const users = await prisma.user.findMany()
    return { success: true, users }
  } catch (error: any) {
    console.error(`Failed to fetch users: ${error.message}`)
    return { success: false, message: errorHandler(error).message }
  }
}

export async function fetchUserById(id: number): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id } })
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

    await prisma.userAuth.delete({ where: { username: user.username } })
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
