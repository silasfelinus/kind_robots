// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

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

function toStringOrJson(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function normalizeSmartBar(v: unknown): string | null {
  if (v == null) return null

  const rawValues = Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? v.split(',')
      : [v]

  const ids = rawValues
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0)

  const uniqueIds = [...new Set(ids)]

  return uniqueIds.length ? uniqueIds.join(',') : ''
}

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID' })
    }

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

    const DENY = new Set([
      'id',
      'Role',
      'role',
      'karma',
      'mana',
      'token',
      'apiKey',
      'password',
      'emailVerified',
      'stripeCustomerId',
      'googleId',
    ])

    const JSONISH = new Set(['vibes', 'artModels', 'textModels', 'blockList'])

    const BOOLS = new Set(['isPublic', 'showMature', 'customIcons', 'isMember'])
    const DATES = new Set(['memberUntil'])

    const updateData: Record<string, unknown> = {}

    for (const [k, v] of Object.entries(body)) {
      if (DENY.has(k)) continue

      if (k === 'smartBar') {
        updateData[k] = normalizeSmartBar(v)
        continue
      }

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

      updateData[k] = v
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No updatable fields present.',
      })
    }

    if (
      typeof updateData.smartBar === 'string' &&
      updateData.smartBar.length > 5000
    ) {
      throw createError({
        statusCode: 400,
        message: 'smartBar payload is too large.',
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
    return {
      success: false,
      message: handled.message || 'Update failed.',
      statusCode: handled.statusCode || 500,
    }
  }
})
