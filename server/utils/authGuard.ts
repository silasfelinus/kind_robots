// /server/utils/authGuard.ts
import { createError, type H3Event } from 'h3'
import { validateApiKey } from './validateKey'

export type AuthUser = {
  id: number
  username?: string | null
  Role?: string | null
  mana?: number | null
  apiKey?: string | null
}

export type AuthGuardResult = {
  user: AuthUser
  kind?: string
  isAdmin: boolean
  isServerKey: boolean
}

export async function requireApiUser(event: H3Event): Promise<AuthGuardResult> {
  const { isValid, user, kind } = await validateApiKey(event)

  if (!isValid || !user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  const isServerKey = kind === 'server'
  const isAdmin = user.Role === 'ADMIN' || user.id === 1

  return {
    user,
    kind,
    isAdmin,
    isServerKey,
  }
}

export async function requireAdminOrServerKey(
  event: H3Event,
): Promise<AuthGuardResult> {
  const auth = await requireApiUser(event)

  if (!auth.isAdmin && !auth.isServerKey) {
    throw createError({
      statusCode: 403,
      message: 'Admin or server authorization is required.',
    })
  }

  return auth
}

export function resolveAuthorizedUserId(options: {
  authenticatedUserId: number
  requestedUserId?: number
  isAdmin: boolean
  isServerKey: boolean
}): number {
  const { authenticatedUserId, requestedUserId, isAdmin, isServerKey } = options

  if ((isAdmin || isServerKey) && requestedUserId) {
    return requestedUserId
  }

  if (
    requestedUserId &&
    requestedUserId !== authenticatedUserId &&
    !isAdmin &&
    !isServerKey
  ) {
    throw createError({
      statusCode: 403,
      message: 'User ID does not match the provided authorization token.',
    })
  }

  return authenticatedUserId
}
