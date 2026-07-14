//server/api/auth/index.ts
import crypto from 'crypto'
import { createError } from 'h3'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs'
import { jwtVerify, SignJWT } from 'jose'
import { errorHandler } from '../../utils/error'
import { userExists } from '../users'
import prisma from '../../utils/prisma'
import type { User } from '~/prisma/generated/prisma/client'

const config = useRuntimeConfig()
const JWT_SECRET = config.jwtSecret

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured.')
}

if (typeof JWT_SECRET !== 'string' || !JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured or is not a string.')
}

export const verifyJwtToken = async (
  token: string,
): Promise<{
  success: boolean
  userId?: number | null
  message?: string
  statusCode?: number
}> => {
  try {
    const secretKey = crypto.createSecretKey(
      Buffer.from(JWT_SECRET as string, 'utf-8'),
    )
    const decoded = await jwtVerify(token, secretKey)

    return { success: true, userId: decoded.payload.id as number | null }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: `🚀 Mission abort! ${message}`,
      statusCode: statusCode ?? 403,
    }
  }
}

export function extractTokenFromHeader(
  authorizationHeader: string | undefined,
): string {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  return authorizationHeader.split(' ')[1] ?? ''
}

export const getUserDataByToken = async (token: string) => {
  try {
    const { success, userId } = await verifyJwtToken(token)

    if (!success || !userId) {
      return { success: false, message: 'Invalid token.', statusCode: 403 }
    }

    const data = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!data) {
      return { success: false, message: 'User not found.', statusCode: 404 }
    }

    return { success: true, data }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: `🚀 Mission abort! ${message}`,
      statusCode: statusCode ?? 403,
    }
  }
}

export async function createToken(user: User): Promise<string> {
  try {
    const secretKey = crypto.createSecretKey(Buffer.from(JWT_SECRET as string))

    const token = await new SignJWT({
      id: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('360d')
      .sign(secretKey)

    return token
  } catch (error) {
    console.error(`Failed to create token: ${errorHandler(error).message}`)
    throw new Error('Failed to create token.')
  }
}

export async function createUserWithAuth(
  username: string,
  password: string,
  email?: string | null,
) {
  try {
    if (await userExists(username, 'username')) {
      throw new Error('Username already exists.')
    }

    if (email && (await prisma.user.findUnique({ where: { email } }))) {
      throw new Error('Email already exists.')
    }

    const { isValid, message } = validatePassword(password)

    if (!isValid) {
      throw new Error(message)
    }

    const hashedPassword = await hashPassword(password)
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email ?? undefined,
        password: hashedPassword,
        Role: 'USER',
        createdAt: new Date(),
      },
    })

    return { success: true, user: newUser }
  } catch (error: unknown) {
    console.error(`Error in createUserWithAuth: ${errorHandler(error).message}`)

    return { success: false, message: errorHandler(error).message }
  }
}

export async function validateUserCredentials(
  username: string,
  password?: string,
) {
  try {
    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return null
    }

    if (user.password && password) {
      const isPasswordValid = await bcryptCompare(password, user.password)

      if (!isPasswordValid) {
        return null
      }
    } else if (user.password && !password) {
      return null
    }

    const token = await createToken(user)

    return { user, token }
  } catch (error: unknown) {
    console.error(
      `Failed to validate user credentials: ${errorHandler(error).message}`,
    )

    throw new Error('Failed to validate user credentials.')
  }
}

export function validatePassword(password: string): {
  isValid: boolean
  message: string
} {
  const minLength = /^.{8,}$/

  if (!minLength.test(password)) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
    }
  }

  return { isValid: true, message: 'Password is valid.' }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10

  return await bcryptHash(password, saltRounds)
}

export async function addPasswordToExistingUser(
  username: string,
  password: string,
) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } })

    if (!existingUser) {
      return { success: false, message: 'Username does not exist.' }
    }

    const passwordValidation = validatePassword(password)

    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    })

    return { success: true }
  } catch (error: unknown) {
    return { success: false, message: errorHandler(error).message }
  }
}
