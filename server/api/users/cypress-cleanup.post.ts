import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import { deleteUserWithOwnedData } from '../../utils/userPurge'
import { errorHandler } from '../../utils/error'

const DEFAULT_MAX_AGE_MS = 2 * 60 * 60 * 1000
const MAX_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const clampInteger = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.floor(parsed)))
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user || !userIsAdmin({ id: user.id, Role: user.Role })) {
      throw createError({
        statusCode: 403,
        message: 'Administrator access is required for Cypress cleanup.',
      })
    }

    const body = await readBody<{
      maxAgeMs?: number
      limit?: number
    }>(event)
    const maxAgeMs = clampInteger(
      body?.maxAgeMs,
      DEFAULT_MAX_AGE_MS,
      0,
      MAX_MAX_AGE_MS,
    )
    const limit = clampInteger(body?.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
    const cutoff = new Date(Date.now() - maxAgeMs)
    const where = {
      Role: { not: 'ADMIN' as const },
      createdAt: { lte: cutoff },
      OR: [
        { username: { startsWith: 'cypress-' } },
        {
          email: {
            startsWith: 'cypress-',
            endsWith: '@example.com',
          },
        },
      ],
    }

    const candidates = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    const deleted: Array<{
      id: number
      username: string | null
      purged: Record<string, number>
    }> = []
    const failed: Array<{
      id: number
      username: string | null
      message: string
    }> = []

    for (const candidate of candidates) {
      try {
        const purged = await deleteUserWithOwnedData(candidate.id)
        deleted.push({
          id: candidate.id,
          username: candidate.username,
          purged,
        })
      } catch (error) {
        failed.push({
          id: candidate.id,
          username: candidate.username,
          message: errorHandler(error).message,
        })
      }
    }

    const remaining = await prisma.user.count({ where })
    event.node.res.statusCode = failed.length > 0 ? 207 : 200

    return {
      success: failed.length === 0,
      message:
        failed.length === 0
          ? `Removed ${deleted.length} stale Cypress users.`
          : `Removed ${deleted.length} stale Cypress users; ${failed.length} failed.`,
      data: {
        cutoff: cutoff.toISOString(),
        maxAgeMs,
        limit,
        deleted,
        failed,
        remaining,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message,
    }
  }
})
