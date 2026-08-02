// /server/api/users/[id]/admin.patch.ts
// Admin-only override of the fields the self-serve PATCH deliberately denies:
// Role, showMature, isPublic, and emailVerified (force-verify / un-verify).
// Restriction is handled by the dedicated restrict/unrestrict endpoints.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { isValidRole, parseRoleList } from '../../../utils/authUser'
import { setUserRoles } from '../../../utils/userRoleWrites'
import type { Role } from '~/prisma/generated/prisma/client'

function toBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string')
    return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
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

    // `roles` (the full set) and `Role` (primary only) are both accepted, with
    // `roles` winning when both are sent. Neither writes User.Role through
    // `data` -- both funnel into setUserRoles, which owns the scalar and the
    // join table together in one transaction. Two writers for one fact is
    // exactly how the two would drift apart.
    let roles: Role[] | null = null
    if ('roles' in body) {
      try {
        roles = parseRoleList(body.roles)
      } catch (error) {
        throw createError({
          statusCode: 400,
          message: error instanceof Error ? error.message : 'Invalid roles.',
        })
      }
      changes.push(`roles=${roles.join('+')}`)
    } else if ('Role' in body) {
      const role = String(body.Role).toUpperCase()
      if (!isValidRole(role)) {
        throw createError({
          statusCode: 400,
          message: `Invalid role: ${role}.`,
        })
      }
      // A single-role write still goes through setUserRoles, so the join table
      // never keeps a stale secondary the admin believed they had replaced.
      roles = [role]
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

    if (Object.keys(data).length === 0 && !roles) {
      throw createError({
        statusCode: 400,
        message: 'No admin-updatable fields provided.',
      })
    }

    if (roles) await setUserRoles(userId, roles)

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        Role: true,
        UserRoles: { select: { role: true } },
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

    return {
      success: true,
      message: 'User updated.',
      data: {
        ...updated,
        // Flattened so the client never has to know the relation's shape.
        // Primary first, matching the order roles were applied in.
        roles: [
          updated.Role,
          ...updated.UserRoles.map((entry) => entry.role).filter(
            (role) => role !== updated.Role,
          ),
        ],
      },
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Update failed.' }
  }
})
