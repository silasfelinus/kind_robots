// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

/**
 * Minimal, durable user PATCH:
 * - Auth: only the owner can PATCH.
 * - Denylist only (avoid brittle whitelists).
 * - JSON-ish fields (e.g., vibes) are stringified if objects/arrays are sent.
 * - Gentle coercions for dates/booleans.
 */

function toBooleanLike(v: unknown): boolean | undefined {
  if (v === undefined) return undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false
  }
  if (typeof v === 'number') return v !== 0
  return undefined
}

function toDateLike(v: unknown): Date | undefined {
  if (v == null) return undefined
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? undefined : d
}

/** If the API receives an object/array for a string column, JSON-stringify it. */
function toStringOrJson(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    // fall back to a simple string
    return String(v)
  }
}

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID' })
    }

    // Must be the same authenticated user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || user?.id !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this user.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({ statusCode: 400, message: 'No data provided.' })
    }

    // Keep this list tiny to reduce maintenance overhead
    const DENY = new Set([
      'id',
      'Role',
      'role', // lowercased variant
      'karma',
      'mana',
      'token',
      'apiKey',
      'password',
      'emailVerified',
      'stripeCustomerId',
      'googleId',
    ])

    // Columns that are stored as STRING but often carry JSON
    // (If you send objects/arrays, we will stringify them.)
    const JSONISH = new Set([
      'vibes',
      'artModels',
      'textModels',
      'smartBar',
      'blockList',
    ])

    // Gentle boolean/date coercions for common flags
    const BOOLS = new Set(['isPublic', 'showMature', 'customIcons', 'isMember'])
    const DATES = new Set(['memberUntil'])

    const updateData: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (DENY.has(k)) continue

      if (DATES.has(k)) {
        const d = toDateLike(v)
        if (d) updateData[k] = d
        else if (v == null) updateData[k] = null
        continue
      }

      if (BOOLS.has(k)) {
        const b = toBooleanLike(v)
        if (b !== undefined) updateData[k] = b
        continue
      }

      if (JSONISH.has(k)) {
        updateData[k] = toStringOrJson(v)
        continue
      }

      // Pass-through for everything else
      updateData[k] = v as any
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No updatable fields present.',
      })
    }

    const data = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    event.node.res.statusCode = 200
    return { success: true, message: 'User updated.', data }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Update failed.' }
  }
})
