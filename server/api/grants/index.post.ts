import { createError, defineEventHandler, readBody } from 'h3'
import {
  GrantLevel,
  GrantSubject,
  type GrantLevel as GrantLevelValue,
  type GrantSubject as GrantSubjectValue,
} from '~/prisma/generated/prisma/client'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { assertCanManageGrantSubject } from '../../utils/grantAccess'
import prisma from '../../utils/prisma'

type GrantCreateBody = {
  granteeId?: unknown
  subjectType?: unknown
  subjectId?: unknown
  level?: unknown
  expiresAt?: unknown
}

const isPositiveInt = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) > 0

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<GrantCreateBody>(event)

    const unknownFields = Object.keys(body ?? {}).filter(
      (field) => !['granteeId', 'subjectType', 'subjectId', 'level', 'expiresAt'].includes(field),
    )
    if (unknownFields.length) {
      throw createError({ statusCode: 400, message: `Unsupported grant fields: ${unknownFields.join(', ')}.` })
    }

    if (!isPositiveInt(body?.granteeId) || !isPositiveInt(body?.subjectId)) {
      throw createError({ statusCode: 400, message: 'granteeId and subjectId must be positive integers.' })
    }

    if (!Object.values(GrantSubject).includes(body.subjectType as GrantSubjectValue)) {
      throw createError({ statusCode: 400, message: 'Invalid subjectType.' })
    }
    if (!Object.values(GrantLevel).includes(body.level as GrantLevelValue)) {
      throw createError({ statusCode: 400, message: 'Invalid level.' })
    }

    const subjectType = body.subjectType as GrantSubjectValue
    const level = body.level as GrantLevelValue
    let expiresAt: Date | null = null
    if (body.expiresAt != null) {
      if (typeof body.expiresAt !== 'string' || Number.isNaN(Date.parse(body.expiresAt))) {
        throw createError({ statusCode: 400, message: 'expiresAt must be an ISO date string or null.' })
      }
      expiresAt = new Date(body.expiresAt)
    }

    await assertCanManageGrantSubject(
      { id: auth.user.id, isAdmin: auth.isAdmin },
      subjectType,
      body.subjectId,
    )

    const grantee = await prisma.user.findUnique({ where: { id: body.granteeId }, select: { id: true } })
    if (!grantee) throw createError({ statusCode: 404, message: 'Grantee user not found.' })

    const grant = await prisma.grant.create({
      data: {
        granterId: auth.user.id,
        granteeId: body.granteeId,
        subjectType,
        subjectId: body.subjectId,
        level,
        source: 'MANUAL',
        expiresAt,
      },
    })

    event.node.res.statusCode = 201
    return { success: true, data: grant, statusCode: 201 }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Failed to create grant.', data: null, statusCode: event.node.res.statusCode }
  }
})
