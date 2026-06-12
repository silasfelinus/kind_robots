// /server/utils/authGuard.ts
import { createError, type H3Event, getHeader } from 'h3'
import prisma from './prisma'
import { validateApiKey } from './validateKey'
import { verifyJwtToken } from '@/server/api/auth'
import { type AuthUser, userIsAdmin, withAdminFlag } from './authUser'

export type AuthGuardResult = {
  user: AuthUser
  kind: 'jwt' | 'user' | 'server' | 'api'
  isAdmin: boolean
  isServerKey: boolean
}

function cleanBearer(value?: string | null): string {
  return (
    value
      ?.trim()
      .replace(/^Bearer\s+/i, '')
      .trim() || ''
  )
}

function readBearerToken(event: H3Event): string {
  return cleanBearer(getHeader(event, 'authorization'))
}

async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  return user ? withAdminFlag(user) : null
}

async function validateJwtString(
  token: string,
): Promise<AuthGuardResult | null> {
  if (token.split('.').length !== 3) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  const user = await getUserById(verification.userId)

  if (!user || !user.isActive) return null

  return {
    user,
    kind: 'jwt',
    isAdmin: user.isAdmin,
    isServerKey: false,
  }
}

export async function getOptionalApiUser(
  event: H3Event,
): Promise<AuthGuardResult | null> {
  const token = readBearerToken(event)

  if (!token) return null

  const jwtAuth = await validateJwtString(token)

  if (jwtAuth) return jwtAuth

  const apiAuth = await validateApiKey(event)

  if (!apiAuth.isValid || !apiAuth.user?.id) return null

  const user = await getUserById(apiAuth.user.id)

  if (!user || !user.isActive) return null

  const isServerKey = apiAuth.kind === 'server'
  const isAdmin = userIsAdmin(user)

  return {
    user,
    kind: apiAuth.kind ?? 'api',
    isAdmin,
    isServerKey,
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
