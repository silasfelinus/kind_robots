// /server/utils/authGuard.ts
import { createError, getHeader, type H3Event } from 'h3'
import prisma from './prisma'
import { verifyJwtToken } from '@/server/api/auth'
import { type AuthUser, withAdminFlag } from './authUser'

export type AuthGuardResult = {
  user: AuthUser
  kind: 'jwt'
  isAdmin: boolean
}

function readBearerToken(event: H3Event): string {
  const authorization = getHeader(event, 'authorization') ?? ''

  return authorization
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim()
}

async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  return user ? withAdminFlag(user) : null
}

export async function getOptionalApiUser(
  event: H3Event,
): Promise<AuthGuardResult | null> {
  const token = readBearerToken(event)

  if (!token) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  const user = await getUserById(verification.userId)

  if (!user || !user.isActive) return null

  return {
    user,
    kind: 'jwt',
    isAdmin: user.isAdmin,
  }
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const auth = await getOptionalApiUser(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  return auth
}
