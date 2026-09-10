import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { assertCanManageGrantSubject } from '../../utils/grantAccess'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Grant id must be a positive integer.' })
    }

    const existing = await prisma.grant.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, message: 'Grant not found.' })

    await assertCanManageGrantSubject(
      { id: auth.user.id, isAdmin: auth.isAdmin },
      existing.subjectType,
      existing.subjectId,
    )

    const grant =
      existing.status === 'REVOKED'
        ? existing
        : await prisma.grant.update({
            where: { id },
            data: { status: 'REVOKED' },
          })

    return { success: true, data: grant, statusCode: 200 }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to revoke grant.', data: null, statusCode: event.node.res.statusCode }
  }
})
