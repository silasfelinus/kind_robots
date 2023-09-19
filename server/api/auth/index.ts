import crypto from 'crypto'
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt'
import { jwtVerify, SignJWT } from 'jose'
import { errorHandler } from '../utils/error'
import { userExists } from '../users'
import prisma from '../utils/prisma'

const { JWT_SECRET } = useRuntimeConfig()

export function generateApiKey(): string {
  try {
    const apiKey = crypto.randomBytes(16).toString('hex')
    return apiKey
  } catch (error: any) {
    console.error('🔥 Failed to generate API key:', error.message)
    throw new Error('Failed to generate API key.')
  }
}

export async function validateApiKey(apiKey: string) {
  try {
    const user = await prisma.user.findFirst({ where: { apiKey } }) // Adjusted to use the User model

    if (user) {
      return { success: true, message: '🚀 API key is valid. You are good to go!' }
    } else {
      throw new Error('API key is invalid or not found.')
    }
  } catch (error: any) {
    console.error(`🔥 Failed to validate API key: ${error.message}`)
    const { message } = errorHandler(error)
    return { success: false, message: `🚀 Mission abort! ${message}` }
  }
}

export async function createToken(user: any, apiKey: string): Promise<string> {
  try {
    const secretKey = crypto.createSecretKey(Buffer.from(JWT_SECRET, 'utf-8'))

    const token = await new SignJWT({ id: user?.id, username: user?.username, apiKey })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('360d')
      .sign(secretKey)

    return token
  } catch (error: any) {
    console.error(`Failed to create token: ${error.message}`)
    throw new Error('Failed to create token.')
  }
}

export async function verifyJwtToken(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).send('Access token is missing')
    }

    const secretKey = crypto.createSecretKey(Buffer.from(process.env.JWT_SECRET!, 'utf-8'))
    await jwtVerify(token, secretKey)

    next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    res.status(403).send('Access token is invalid')
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

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(password)
    const apiKey = generateApiKey()

    const newUser = await prisma.user.create({
      data: {
        username,
        email: email ?? undefined,
        password: hashedPassword, // Storing password in the User model
        apiKey
      }
    })

    return { success: true, user: newUser }
  } catch (error: any) {
    return { success: false, message: errorHandler(error) }
  }
}

export async function validateUserCredentials(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } }) // Adjusted to use the User model

    if (!user) {
      console.log('Debug: User not found')
      return null
    }

    const isPasswordValid = await bcryptCompare(password, user.password!) // Adjusted to use the User model
    if (!isPasswordValid) {
      return null
    }

    const secretKey = crypto.createSecretKey(Buffer.from(JWT_SECRET, 'utf-8'))

    const token = await new SignJWT({ id: user?.id, username: user?.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('360d')
      .sign(secretKey)

    return { user, token }
  } catch (error: any) {
    console.error(`Failed to validate user credentials: ${error.message}`)
    throw new Error('Failed to validate user credentials.')
  }
}

export function validatePassword(password: string): { isValid: boolean; message: string } {
  const minLength = /^.{8,}$/
  const hasNumber = /\d/
  const hasLetter = /[a-zA-Z]/

  if (!minLength.test(password)) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' }
  }
  if (!hasNumber.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' }
  }
  if (!hasLetter.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' }
  }

  return { isValid: true, message: 'Password is valid.' }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcryptHash(password, saltRounds)
}

export async function addPasswordToExistingUser(username: string, password: string) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } }) // Adjusted to use the User model
    if (!existingUser) {
      return { success: false, message: 'Username does not exist.' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({ where: { username }, data: { password: hashedPassword } }) // Adjusted to update the User model

    return { success: true }
  } catch (error: any) {
    return { success: false, message: errorHandler(error) }
  }
}
