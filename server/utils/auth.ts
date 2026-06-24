// /server/utils/auth.ts
import { getHeader, type H3Event } from 'h3'
import { verifyJwtToken } from '../api/auth'

function readBearerToken(event: H3Event): string {
  const authorization = getHeader(event, 'authorization') ?? ''

  return authorization
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim()
}

export async function getCurrentUserId(event: H3Event): Promise<number | null> {
  const token = readBearerToken(event)

  if (!token) return null

  const verification = await verifyJwtToken(token)

  if (!verification.success || !verification.userId) return null

  return verification.userId
}
