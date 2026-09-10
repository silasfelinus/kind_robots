import { createError, defineEventHandler, getQuery } from 'h3'
import { GrantSubject, type GrantSubject as GrantSubjectValue } from '~/prisma/generated/prisma/client'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { assertCanManageGrantSubject } from '../../utils/grantAccess'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery(event)
    const subjectType = String(query.subjectType ?? '').toUpperCase() as GrantSubjectValue
    const subjectId = Number(query.subjectId)

    if (!Object.values(GrantSubject).includes(subjectType)) {
      throw createError({ statusCode: 400, message: 'A valid subjectType is required.' })
    }
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      throw createError({ statusCode: 400, message: 'subjectId must be a positive integer.' })
    }

    await assertCanManageGrantSubject(
      { id: auth.user.id, isAdmin: auth.isAdmin },
      subjectType,
      subjectId,
    )

    const grants = await prisma.grant.findMany({
      where: { subjectType, subjectId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: grants, statusCode: 200 }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to list grants.', data: null, statusCode: event.node.res.statusCode }
  }
})
