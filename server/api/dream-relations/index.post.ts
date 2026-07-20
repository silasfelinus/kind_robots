// POST /api/dream-relations — create (or update the note on) a DreamRelation edge.
// Body: { fromDreamId, toDreamId, relationType?, note? }
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertDreamAccess } from '~/server/api/dreams/index'
import {
  dreamRelationSelect,
  dreamRelationTypes,
  parseDreamRelationType,
} from './index'

type DreamRelationCreateBody = {
  fromDreamId?: unknown
  toDreamId?: unknown
  relationType?: unknown
  note?: unknown
}

function requiredDreamId(value: unknown, field: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a positive integer.`,
    })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<DreamRelationCreateBody>(event)

    const fromDreamId = requiredDreamId(body.fromDreamId, 'fromDreamId')
    const toDreamId = requiredDreamId(body.toDreamId, 'toDreamId')
    if (fromDreamId === toDreamId) {
      throw createError({
        statusCode: 400,
        message: 'fromDreamId and toDreamId must be different Dreams.',
      })
    }

    const relationType = body.relationType
      ? parseDreamRelationType(body.relationType)
      : 'RELATED'
    if (!relationType) {
      throw createError({
        statusCode: 400,
        message: `"relationType" must be one of: ${dreamRelationTypes.join(', ')}.`,
      })
    }

    const note =
      typeof body.note === 'string' && body.note.trim()
        ? body.note.trim().slice(0, 512)
        : null

    const [fromDream, toDream] = await Promise.all([
      prisma.dream.findUnique({
        where: { id: fromDreamId },
        select: { id: true, userId: true, isPublic: true },
      }),
      prisma.dream.findUnique({
        where: { id: toDreamId },
        select: { id: true },
      }),
    ])
    if (!fromDream) {
      throw createError({ statusCode: 404, message: 'fromDreamId not found.' })
    }
    if (!toDream) {
      throw createError({ statusCode: 404, message: 'toDreamId not found.' })
    }

    assertDreamAccess({
      dream: fromDream,
      userId: auth.user.id,
      userRole: auth.user.Role,
      action: 'mutate',
    })

    const relation = await prisma.dreamRelation.upsert({
      where: {
        fromDreamId_toDreamId_relationType: {
          fromDreamId,
          toDreamId,
          relationType,
        },
      },
      create: { fromDreamId, toDreamId, relationType, note },
      update: { note },
      select: dreamRelationSelect,
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Dream relation created successfully.',
      data: relation,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { success: false, message: handled.message, data: null, statusCode }
  }
})
