// path: server/api/chatgpt/actions.ts
// summary: action router for ChatGPT API

import type { User } from '@prisma/client'
import prisma from '../utils/prisma'
import { parseBearer, validateApiKey } from './token'

type RunActionHeaders = Record<string, string | undefined>
type ActionInput = Record<string, any>

// Use an explicit type for the minimal user shape we need from Prisma
type SessionSource = Pick<
  User,
  'id' | 'username' | 'Role' | 'apiKey' | 'emailVerified'
>

export async function runAction(
  action: string,
  input: ActionInput,
  headers: RunActionHeaders,
) {
  switch (action) {
    case 'kr.ensure_session':
      return ensureSession(input, headers)

    default:
      const err: any = new Error(`Unknown action: ${action}`)
      err.statusCode = 400
      throw err
  }
}

async function ensureSession(
  input: { token?: string; registerIfMissing?: 0 | 1 } = {},
  headers: RunActionHeaders,
) {
  // 1) extract token
  const headerAuth = headers['authorization'] || ''
  const tokenFromHeader = parseBearer(headerAuth)
  const token = (input.token || tokenFromHeader || '').trim()

  if (!token) {
    const err: any = new Error('Missing token')
    err.statusCode = 401
    throw err
  }

  // 2) validate token against DB
  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: {
      id: true,
      username: true,
      Role: true, // include role so the type matches
      apiKey: true, // string | null in many schemas
      emailVerified: true, // Date | null in Prisma
    },
  })

  const registerIfMissing = Number(input.registerIfMissing || 0) === 1

  if (!user) {
    if (!registerIfMissing) {
      const err: any = new Error('No session for this token')
      err.statusCode = 404
      throw err
    }

    // Optional: auto-register path if ever enabled
    // const created = await prisma.user.create({
    //   data: { username: makeUsername(), apiKey: token, role: 'USER' },
    //   select: { id: true, username: true, role: true, apiKey: true, emailVerified: true }
    // })
    // return shapeSession(created, true, 'created')
  }

  // 3) cross-check x-api-key header for sensitive flag
  const xApiKey = (headers['x-api-key'] || '').trim()
  const includeSensitive = validateApiKey(xApiKey, user?.apiKey || undefined)

  // user is defined here due to early throw above
  return shapeSession(user as SessionSource, includeSensitive, 'ok')
}

function shapeSession(
  user: SessionSource,
  includeSensitive: boolean,
  status: 'ok' | 'created',
) {
  // Normalize fields to the response contract
  const emailVerifiedBool = !!user.emailVerified
  const apiKeyTail = (user.apiKey ?? '').slice(-4)

  return {
    status,
    session: {
      userId: user.id,
      username: user.username,
      role: user.Role,
      emailVerified: emailVerifiedBool,
      tokenValid: true,
      apiKeyTail,
      sensitive: includeSensitive
        ? { canSeeSensitive: true }
        : { canSeeSensitive: false },
    },
  }
}
