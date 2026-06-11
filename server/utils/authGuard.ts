// /server/utils/authGuard.ts
import { createError, type H3Event, getHeader } from 'h3'
import prisma from './prisma'
import { validateApiKey } from './validateKey'
import { verifyJwtToken } from '@/server/api/auth'

export type AuthUser = {
  id: number
  username?: string | null
  Role?: string | null
}

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

async function validateJwtString(
  token: string,
): Promise<AuthGuardResult | null> {
  if (token.split('.').length !== 3) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  const user = await prisma.user.findUnique({
    where: {
      id: verification.userId,
    },
    select: {
      id: true,
      username: true,
      Role: true,
    },
  })

  if (!user) return null

  const isAdmin = user.Role === 'ADMIN' || user.id === 1

  return {
    user,
    kind: 'jwt',
    isAdmin,
    isServerKey: false,
  }
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const token = readBearerToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const jwtAuth = await validateJwtString(token)

  if (jwtAuth) return jwtAuth

  const apiAuth = await validateApiKey(event)

  if (!apiAuth.isValid || !apiAuth.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  const user = {
    id: apiAuth.user.id,
    Role: apiAuth.user.Role ?? null,
  }

  const isServerKey = apiAuth.kind === 'server'
  const isAdmin = user.Role === 'ADMIN' || user.id === 1

  return {
    user,
    kind: apiAuth.kind ?? 'api',
    isAdmin,
    isServerKey,
  }
}
