// /server/api/utils/validateKey.ts
import { type H3Event } from 'h3'
import prisma from './prisma'

export type ValidateResult = {
  isValid: boolean
  user?: { id: number; Role: string }
  kind?: 'user' | 'server'
}

function extractBearer(event: H3Event): string | undefined {
  const h = event.node.req.headers?.authorization
  if (typeof h === 'string' && h.toLowerCase().startsWith('bearer '))
    return h.slice(7).trim()
  return undefined
}

// Validate a raw apiKey string (DB user key OR server key from env)
export async function validateApiKeyString(
  apiKey?: string,
): Promise<ValidateResult> {
  if (!apiKey) return { isValid: false }

  // allow server/infra key(s)
  const serverKeys = [process.env.SERVER_API_KEY, process.env.API_KEY].filter(
    Boolean,
  ) as string[]
  if (serverKeys.includes(apiKey)) {
    return { isValid: true, kind: 'server' }
  }

  // user key
  const user =
    (await prisma.user.findFirst({
      where: { apiKey },
      select: { id: true, Role: true },
    })) ?? undefined

  return { isValid: !!user, user, kind: user ? 'user' : undefined }
}

// Validate using the Bearer token from the request
export async function validateApiKey(event: H3Event): Promise<ValidateResult> {
  const token = extractBearer(event)
  return validateApiKeyString(token)
}
