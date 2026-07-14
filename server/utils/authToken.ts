// /server/utils/authToken.ts
// Single-use, expiring tokens backing email verification, password reset, and
// newsletter double-opt-in. Tokens are random 32-byte hex strings stored in the
// AuthToken table; `consumeAuthToken` validates and burns them atomically.
import { randomBytes } from 'node:crypto'
import prisma from './prisma'
import type { AuthTokenPurpose } from '~/prisma/generated/prisma/client'

// Default lifetimes per purpose (ms). Reset links are short-lived; verify and
// newsletter-confirm links are more forgiving.
const TTL_MS: Record<AuthTokenPurpose, number> = {
  EMAIL_VERIFY: 48 * 60 * 60 * 1000,
  NEWSLETTER_CONFIRM: 48 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
}

export function generateTokenValue(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a fresh single-use token for a user + purpose. Any prior unconsumed
 * tokens of the same purpose are burned first so only the newest link works.
 */
export async function createAuthToken(
  userId: number,
  purpose: AuthTokenPurpose,
): Promise<{ token: string; expiresAt: Date }> {
  const now = Date.now()
  const expiresAt = new Date(now + TTL_MS[purpose])
  const token = generateTokenValue()

  await prisma.authToken.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date(now) },
  })

  await prisma.authToken.create({
    data: { userId, purpose, token, expiresAt },
  })

  return { token, expiresAt }
}

export type ConsumeResult =
  | { ok: true; userId: number }
  | { ok: false; reason: 'not-found' | 'expired' | 'consumed' | 'wrong-purpose' }

/**
 * Validate a token for the expected purpose and, if valid, mark it consumed.
 * Never throws for the invalid cases — returns a discriminated result so
 * callers can respond with a friendly message.
 */
export async function consumeAuthToken(
  token: string,
  purpose: AuthTokenPurpose,
): Promise<ConsumeResult> {
  const trimmed = String(token || '').trim()
  if (!trimmed) return { ok: false, reason: 'not-found' }

  const row = await prisma.authToken.findUnique({ where: { token: trimmed } })
  if (!row) return { ok: false, reason: 'not-found' }
  if (row.purpose !== purpose) return { ok: false, reason: 'wrong-purpose' }
  if (row.consumedAt) return { ok: false, reason: 'consumed' }
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' }

  await prisma.authToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  })

  return { ok: true, userId: row.userId }
}
