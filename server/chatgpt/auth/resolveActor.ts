// /server/chatgpt/auth/resolveActor.ts
import { createError, getHeader, type H3Event } from 'h3'

const CURRENT_ADMIN_USER_ID = 1
const CURRENT_ADMIN_USERNAME = 'admin'

export type ChatGptActorRole = 'admin'

export type ChatGptActorSource = 'admin-token' | 'user-token' | 'development'

export type ChatGptActor = {
  userId: number
  username: string
  role: ChatGptActorRole
  source: ChatGptActorSource
  token?: string
}

function extractBearerToken(event: H3Event): string | undefined {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  return token || undefined
}

function getAllowedTokens(): string[] {
  return [
    process.env.ADMIN_TOKEN,
    process.env.CHATGPT_API_KEY,
    process.env.KINDROBOTS_API_KEY,
    process.env.API_KEY,
  ].filter((token): token is string => Boolean(token?.trim()))
}

function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== 'production'
}

function shouldAllowDevelopmentActor(): boolean {
  return isDevelopmentMode() && process.env.CHATGPT_ALLOW_DEV_ACTOR === 'true'
}

function resolveTokenSource(token: string): ChatGptActorSource {
  if (token === process.env.ADMIN_TOKEN) return 'admin-token'

  return 'user-token'
}

function createAdminActor({
  source,
  token,
}: {
  source: ChatGptActorSource
  token?: string
}): ChatGptActor {
  return {
    userId: CURRENT_ADMIN_USER_ID,
    username: CURRENT_ADMIN_USERNAME,
    role: 'admin',
    source,
    token,
  }
}

export async function resolveChatGptActor(
  event: H3Event,
): Promise<ChatGptActor> {
  const token = extractBearerToken(event)
  const allowedTokens = getAllowedTokens()

  if (!token) {
    if (shouldAllowDevelopmentActor()) {
      return createAdminActor({
        source: 'development',
      })
    }

    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization bearer token',
    })
  }

  if (!allowedTokens.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No Kind Robots API token is configured',
    })
  }

  if (!allowedTokens.includes(token)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authorization bearer token',
    })
  }

  return createAdminActor({
    source: resolveTokenSource(token),
    token,
  })
}
