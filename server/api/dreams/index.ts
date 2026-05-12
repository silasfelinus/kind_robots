// /server/api/dreams/index.ts
import { createError, getHeader, getQuery } from 'h3'
import type { H3Event } from 'h3'

export type DreamAccessMode = 'OPEN' | 'CODE' | 'PRIVATE' | 'SOLO'
export type DreamAccessAction = 'view' | 'chat' | 'mutate'

type DreamAccessInput = {
  dream: {
    userId: number
    isPublic: boolean
    accessMode?: DreamAccessMode | null
    privacyCode?: string | null
  }
  userId?: number | null
  userRole?: string | null
  providedCode?: string | null
  action?: DreamAccessAction
}

export function assertDreamAccess({
  dream,
  userId,
  userRole,
  providedCode,
  action = 'view',
}: DreamAccessInput) {
  const isOwner = Boolean(userId && dream.userId === userId)
  const isAdmin = userRole === 'ADMIN'
  const accessMode = dream.accessMode || (dream.isPublic ? 'OPEN' : 'PRIVATE')

  if (action === 'mutate') {
    if (isOwner || isAdmin) return

    throw createError({
      statusCode: 403,
      message: 'Only the Dream owner can reshape this location.',
    })
  }

  if (accessMode === 'OPEN') {
    if (dream.isPublic || isOwner || isAdmin) return
  }

  if (accessMode === 'CODE') {
    if (isOwner || isAdmin) return

    if (dream.privacyCode && providedCode === dream.privacyCode) return

    throw createError({
      statusCode: 403,
      message: 'This Dream requires a privacy code.',
    })
  }

  if (accessMode === 'PRIVATE') {
    if (isOwner || isAdmin) return
  }

  if (accessMode === 'SOLO') {
    if (isOwner || isAdmin) return
  }

  throw createError({
    statusCode: 403,
    message: 'You do not have permission to enter this Dream.',
  })
}

export function getProvidedDreamCode(event: H3Event, body?: unknown) {
  const query = getQuery(event)
  const headerCode = getHeader(event, 'x-dream-code')

  const bodyCode =
    body && typeof body === 'object' && 'privacyCode' in body
      ? (body as { privacyCode?: unknown }).privacyCode
      : null

  const rawCode = bodyCode || query.privacyCode || query.code || headerCode

  if (Array.isArray(rawCode)) return String(rawCode[0] || '').trim() || null
  if (typeof rawCode === 'string') return rawCode.trim() || null

  return null
}

export function normalizeDreamAccessMode(
  value: unknown,
  fallback: DreamAccessMode = 'OPEN',
): DreamAccessMode {
  if (value === 'OPEN') return 'OPEN'
  if (value === 'CODE') return 'CODE'
  if (value === 'PRIVATE') return 'PRIVATE'
  if (value === 'SOLO') return 'SOLO'

  return fallback
}

export function accessModeToIsPublic(accessMode: DreamAccessMode) {
  return accessMode === 'OPEN' || accessMode === 'CODE'
}

export function normalizeDreamPrivacyCode(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed || null
}

export function redactDreamAccess<T extends { privacyCode?: string | null }>(
  dream: T,
  canSeeCode = false,
): T {
  if (canSeeCode) return dream

  return {
    ...dream,
    privacyCode: null,
  }
}

export function redactDreamAccessList<
  T extends { userId: number; privacyCode?: string | null },
>(dreams: T[], userId?: number | null, userRole?: string | null) {
  return dreams.map((dream) =>
    redactDreamAccess(
      dream,
      Boolean(userId && dream.userId === userId) || userRole === 'ADMIN',
    ),
  )
}
