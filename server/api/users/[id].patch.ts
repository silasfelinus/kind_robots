// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

/**
 * Minimal, durable user PATCH:
 * - Auth: only the owner can PATCH.
 * - Denylist only (avoid brittle whitelists).
 * - Pass-through for everything else.
 */
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
      'role', // in case someone sends lowercased
      'karma',
      'mana',
      'token',
      'apiKey',
      'password',
      'emailVerified',
      'stripeCustomerId',
      'googleId',
    ])

    // Shallow copy minus denied fields
    const updateData: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (DENY.has(k)) continue
      // Gentle coercion only where harmless:
      if (k === 'memberUntil' && v != null) {
        updateData[k] = new Date(String(v))
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
