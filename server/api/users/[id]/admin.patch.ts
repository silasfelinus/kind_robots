// /server/api/users/[id]/admin.patch.ts
// Admin-only override of the fields the self-serve PATCH deliberately denies:
// Role, showMature, isPublic, and emailVerified (force-verify / un-verify).
// Restriction is handled by the dedicated restrict/unrestrict endpoints.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import type { Role } from '~/prisma/generated/prisma/client'

const VALID_ROLES: Role[] = [
  'SYSTEM',
  'USER',
  'ASSISTANT',
  'ADMIN',
  'GUEST',
  'BOT',
  'DESIGNER',
  'CHILD',
  'FAMILY',
]

function toBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
  return undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid user id.' })
    }

    const body = await readBody<Record<string, unknown>>(event)
    const data: Record<string, unknown> = {}
    const changes: string[] = []

    if ('Role' in body) {
      const role = String(body.Role).toUpperCase() as Role
      if (!VALID_ROLES.includes(role)) {
        throw createError({ statusCode: 400, message: `Invalid role: ${role}.` })
      }
      data.Role = role
      changes.push(`role=${role}`)
    }

    for (const field of ['showMature', 'isPublic'] as const) {
      if (field in body) {
        const b = toBool(body[field])
        if (b !== undefined) {
          data[field] = b
          changes.push(`${field}=${b}`)
        }
      }
    }

    if ('emailVerified' in body) {
      const verified = toBool(body.emailVerified)
      data.emailVerified = verified ? new Date() : null
      changes.push(`emailVerified=${verified}`)
    }

    if (Object.keys(data).length === 0) {
      throw createError({ statusCode: 400, message: 'No admin-updatable fields provided.' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        Role: true,
        showMature: true,
        isPublic: true,
        emailVerified: true,
        isRestricted: true,
      },
    })

    await logAdminAction(
      admin,
      `Updated user ${updated.username} (#${userId}): ${changes.join(', ')}.`,
    )

    return { success: true, message: 'User updated.', data: updated }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Update failed.' }
  }
})
