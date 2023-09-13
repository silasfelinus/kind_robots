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
    // Fetch the user associated with the API key from the database
    const userAuth = await prisma.userAuth.findFirst({ where: { apiKey } })

    // If a user is found and the API key matches, the API key is valid
    if (userAuth) {
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

export async function validateUserCredentials(username: string, password: string) {
  try {
    const userAuth = await prisma.userAuth.findUnique({ where: { username } })
    if (!userAuth) {
      console.log('Debug: User not found')
      return null
    }

    const isPasswordValid = await bcryptCompare(password, userAuth.password!)
    if (!isPasswordValid) {
      return null
    }

    const user = await prisma.user.findUnique({ where: { username } })

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
    const existingUser = await userExists(username, 'username')
    if (!existingUser) {
      return { success: false, message: 'Username does not exist.' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.message }
    }

    const hashedPassword = await hashPassword(password)
    const existingUserAuth = await prisma.userAuth.findUnique({ where: { username } })

    if (existingUserAuth) {
      await prisma.userAuth.update({ where: { username }, data: { password: hashedPassword } })
    } else {
      await prisma.userAuth.create({ data: { username, password: hashedPassword } })
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, message: errorHandler(error) }
  }
}
