// /server/api/users/admin/create.post.ts
// Admin-only: create a user with an explicit role + optional password/maturity.
// Body: { username, email?, password?, Role?, showMature? }
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { hashPassword, validatePassword } from '~/server/api/auth'
import { isValidRole, parseRoleList } from '../../../utils/authUser'
import { setUserRoles } from '../../../utils/userRoleWrites'
import type { Role } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const body = await readBody<{
      username?: string
      email?: string
      password?: string
      Role?: string
      roles?: unknown
      showMature?: boolean
    }>(event)

    const username = String(body.username || '').trim()
    if (!username) {
      throw createError({ statusCode: 400, message: 'username is required.' })
    }

    // `roles` gives the account more than one role at creation; `Role` remains
    // supported and means "exactly this one". Either way the first entry is the
    // primary, and the set is applied through setUserRoles after the insert so
    // the scalar and the join table are written together.
    let roles: Role[]
    if ('roles' in body) {
      try {
        roles = parseRoleList(body.roles)
      } catch (error) {
        throw createError({
          statusCode: 400,
          message: error instanceof Error ? error.message : 'Invalid roles.',
        })
      }
    } else {
      const single = String(body.Role || 'USER').toUpperCase()
      if (!isValidRole(single)) {
        throw createError({ statusCode: 400, message: `Invalid role: ${single}.` })
      }
      roles = [single]
    }
    const role = roles[0]

    if (await prisma.user.findUnique({ where: { username } })) {
      throw createError({
        statusCode: 409,
        message: 'Username already exists.',
      })
    }
    const email = body.email ? String(body.email).trim().toLowerCase() : null
    if (email && (await prisma.user.findUnique({ where: { email } }))) {
      throw createError({ statusCode: 409, message: 'Email already exists.' })
    }

    let password: string | null = null
    if (body.password) {
      const check = validatePassword(body.password)
      if (!check.isValid) {
        throw createError({ statusCode: 400, message: check.message })
      }
      password = await hashPassword(body.password)
    }

    const created = await prisma.user.create({
      data: {
        username,
        email,
        password,
        Role: role,
        showMature: body.showMature === true,
        createdAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        Role: true,
        showMature: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
      },
    })

    // The insert already wrote User.Role; this fills the join table so the two
    // agree from the account's first moment. A user created before the join row
    // exists would read correctly (userRoles falls back to the scalar) but would
    // be invisible to any `UserRoles`-based query, such as the admin-protection
    // filter in users/cypress-cleanup.
    await setUserRoles(created.id, roles)

    await logAdminAction(
      admin,
      `Created user ${created.username} (#${created.id}) with role${
        roles.length > 1 ? 's' : ''
      } ${roles.join('+')}.`,
    )

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'User created.',
      data: { ...created, roles },
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Create failed.' }
  }
})
