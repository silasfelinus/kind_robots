// /server/api/utils/auth.ts
import { User } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from './prisma'
import { ErrorHandler } from './error'

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

export const generateToken = (user: Partial<User>): string => {
  const payload = {
    id: user.id,
    username: user.username
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch (e) {
    throw new Error('Invalid token.')
  }
}

export const registerUser = async (user: Partial<User>) => {
  return ErrorHandler(async () => {
    user.hashedPassword = await hashPassword(user.hashedPassword || '')
    const newUser = await prisma.user.create({ data: user })
    return newUser
  }, 'Error while registering a user')
}

export const loginUser = async (username: string, password: string) => {
  return ErrorHandler(async () => {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      throw new Error('User not found.')
    }

    const valid = await verifyPassword(password, user.hashedPassword)
    if (!valid) {
      throw new Error('Invalid password.')
    }

    const token = generateToken(user)
    return { user, token }
  }, 'Error while logging in a user')
}

export const logoutUser = async () => {
  // Invalidate user session or JWT token here.
  // This is typically done by adding the token to a blacklist,
  // or by deleting the session information from the server.
  // Implementation varies based on how sessions are being managed.
}

export const getLoggedInUserCount = async (): Promise<number> => {
  // Implement this based on your session management.
  // If you're using JWT without any session tracking on the server,
  // this could be hard to implement without additional infrastructure.
  // If you have a way to track active sessions, you could count those.
  return 0
}
