// GET /api/dream-relations — list DreamRelation edges, optionally filtered.
// Query: dreamId (either side), fromDreamId, toDreamId, relationType.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { dreamRelationSelect, parseDreamRelationType } from './index'

type DreamRelationListQuery = {
  dreamId?: string
  fromDreamId?: string
  toDreamId?: string
  relationType?: string
}

export default defineEventHandler(async (event) => {
  try {
    await requireApiUser(event)
    const query = getQuery<DreamRelationListQuery>(event)

    const and: Prisma.DreamRelationWhereInput[] = []

    const dreamId = Number(query.dreamId)
    if (Number.isInteger(dreamId) && dreamId > 0) {
      and.push({ OR: [{ fromDreamId: dreamId }, { toDreamId: dreamId }] })
    }

    const fromDreamId = Number(query.fromDreamId)
    if (Number.isInteger(fromDreamId) && fromDreamId > 0) {
      and.push({ fromDreamId })
    }

    const toDreamId = Number(query.toDreamId)
    if (Number.isInteger(toDreamId) && toDreamId > 0) {
      and.push({ toDreamId })
    }

    const relationType = parseDreamRelationType(query.relationType)
    if (relationType) and.push({ relationType })

    const relations = await prisma.dreamRelation.findMany({
      where: and.length ? { AND: and } : undefined,
      select: dreamRelationSelect,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream relations fetched successfully.',
      data: relations,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
