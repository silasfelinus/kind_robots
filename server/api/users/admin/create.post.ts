// /server/api/users/admin/create.post.ts
// Admin-only: create a user with an explicit role + optional password/maturity.
// Body: { username, email?, password?, Role?, showMature? }
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { logAdminAction } from '../../../utils/audit'
import { hashPassword, validatePassword } from '~/server/api/auth'
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

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const body = await readBody<{
      username?: string
      email?: string
      password?: string
      Role?: string
      showMature?: boolean
    }>(event)

    const username = String(body.username || '').trim()
    if (!username) {
      throw createError({ statusCode: 400, message: 'username is required.' })
    }

    const role = (String(body.Role || 'USER').toUpperCase() as Role) || 'USER'
    if (!VALID_ROLES.includes(role)) {
      throw createError({ statusCode: 400, message: `Invalid role: ${role}.` })
    }

    if (await prisma.user.findUnique({ where: { username } })) {
      throw createError({ statusCode: 409, message: 'Username already exists.' })
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

    await logAdminAction(
      admin,
      `Created user ${created.username} (#${created.id}) with role ${role}.`,
    )

    event.node.res.statusCode = 201
    return { success: true, message: 'User created.', data: created }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Create failed.' }
  }
})
