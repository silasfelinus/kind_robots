// /server/api/chatgpt/_utils/access.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'
import { firstToken, parseBearer, validateApiKey } from './token'

export type ChatGptActionHeaders = Record<string, string | undefined>

export type ChatGptSession = {
  user: any | null
  userId: number | null
  isAuthenticated: boolean
  includeSensitive: boolean
  priority: 'free' | 'member'
  source: 'token' | 'apiKey' | 'fallback' | 'anonymous'
}

function getRole(user: any) {
  return String(user?.role || user?.Role || '').toUpperCase()
}

export function isAdmin(user: any) {
  return getRole(user) === 'ADMIN'
}

export function fail(message: string, statusCode = 400): never {
  throw createError({
    statusCode,
    statusMessage: message,
  })
}

export function requireUser(session: ChatGptSession) {
  if (!session.user) {
    fail('Unauthorized', 401)
  }

  return session.user
}

export function requireOwnerOrAdmin(
  session: ChatGptSession,
  ownerId?: number | null,
) {
  const user = requireUser(session)

  if (isAdmin(user)) return user

  if (ownerId && ownerId === user.id) return user

  fail('Forbidden', 403)
}

export async function resolveChatGptSession(
  headers: ChatGptActionHeaders,
): Promise<ChatGptSession> {
  const authorizationToken = parseBearer(headers.authorization)
  const explicitUserToken = firstToken(headers['x-kindrobots-user-token'])
  const token = explicitUserToken || authorizationToken
  const apiKey = headers['x-api-key']?.trim() || ''

  let user: any | null = null
  let source: ChatGptSession['source'] = 'anonymous'

  if (token) {
    user = await prisma.user.findFirst({
      where: {
        OR: [{ token }, { apiKey: token }],
      },
    })

    if (user) {
      source = token === user.apiKey ? 'apiKey' : 'token'
    }
  }

  if (!user && apiKey) {
    user = await prisma.user.findFirst({
      where: { apiKey },
    })

    if (user) {
      source = 'apiKey'
    }
  }

  if (!user && process.env.CHATGPT_FALLBACK_USER_ID) {
    const fallbackUserId = Number(process.env.CHATGPT_FALLBACK_USER_ID)

    if (Number.isFinite(fallbackUserId) && fallbackUserId > 0) {
      user = await prisma.user.findUnique({
        where: { id: fallbackUserId },
      })

      if (user) {
        source = 'fallback'
      }
    }
  }

  const includeSensitive = Boolean(user && validateApiKey(apiKey, user.apiKey))

  const priority =
    user?.isMember || (!!user?.memberUntil && user.memberUntil > new Date())
      ? 'member'
      : 'free'

  return {
    user,
    userId: user?.id ?? null,
    isAuthenticated: Boolean(user),
    includeSensitive,
    priority,
    source,
  }
}
