import crypto from 'crypto'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt'
import { jwtVerify, SignJWT } from 'jose'
import { errorHandler } from '../utils/error'
import { userExists } from '../users'
import prisma from '../utils/prisma'
import type { User } from '@prisma/client'

const config = useRuntimeConfig()
const JWT_SECRET = config.private.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured.')
}

if (typeof JWT_SECRET !== 'string' || !JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured or is not a string.')
}

// Define the return type directly in the function signature
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
    console.log('Decoded Object:', decoded) // Debug log here

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
export const getUserDataByToken = async (token: string) => {
  try {
    const { success, userId } = await verifyJwtToken(token)

    if (!success || !userId) {
      return { success: false, message: 'Invalid token.', statusCode: 403 }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    console.log('Fetched User:', user) // Debug log

    if (!user) {
      return { success: false, message: 'User not found.', statusCode: 404 }
    }

    return { success: true, user }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: `🚀 Mission abort! ${message}`,
      statusCode: statusCode ?? 403,
    }
  }
}

export function generateApiKey(): string {
  try {
    const apiKey = crypto.randomBytes(16).toString('hex')
    return apiKey
  } catch (error: unknown) {
    console.error('🔥 Failed to generate API key:', errorHandler(error).message)
    throw new Error('Failed to generate API key.')
  }
}

export async function validateApiKey(apiKey: string) {
  try {
    const user = await prisma.user.findFirst({ where: { apiKey } })

    if (user) {
      return {
        success: true,
        message: '🚀 API key is valid. You are good to go!',
      }
    } else {
      return { success: false, message: 'API key is invalid or not found.' }
    }
  } catch (error: unknown) {
    console.error(
      `🔥 Failed to validate API key: ${errorHandler(error).message}`,
    )
    return {
      success: false,
      message: `🚀 Mission abort! ${errorHandler(error).message}`,
    }
  }
}

export async function createToken(user: User, apiKey: string): Promise<string> {
  try {
    const secretKey = crypto.createSecretKey(Buffer.from(JWT_SECRET as string))

    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      apiKey,
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
    const apiKey = generateApiKey()
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email ?? undefined,
        password: hashedPassword,
        apiKey,
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
      console.log('Debug: User not found')
      return null
    }
    console.log('User found, validating', user)

    if (user.password && password) {
      const isPasswordValid = await bcryptCompare(password, user.password)
      if (!isPasswordValid) {
        return null
      }
    } else if (user.password && !password) {
      return null
    }

    const token = await createToken(user, user.apiKey ?? '')
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
  const hasNumber = /\d/
  const hasLetter = /[a-zA-Z]/

  if (!minLength.test(password)) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
    }
  }
  if (!hasNumber.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number.',
    }
  }
  if (!hasLetter.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one letter.',
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
