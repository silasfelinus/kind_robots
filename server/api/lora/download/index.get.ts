import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'

const HISTORY_PAGE_SIZE = 50
const ACTIVE_LIMIT = 200

const fields = {
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  resourceType: true,
  source: true,
  fileName: true,
  label: true,
  civitaiModelVersionId: true,
  isMature: true,
  attempts: true,
  claimedAt: true,
  resourceId: true,
  error: true,
} as const

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    setResponseHeader(event, 'Cache-Control', 'private, no-store')

    const rawBefore = getQuery(event).before
    const before =
      rawBefore === undefined
        ? null
        : Number(rawBefore)
    if (
      before !== null &&
      (!Number.isSafeInteger(before) || before <= 0)
    ) {
      throw createError({ statusCode: 400, message: 'Invalid history cursor.' })
    }

    const [active, recent, grouped] = await Promise.all([
      prisma.downloadRequest.findMany({
        where: { status: { in: ['PENDING', 'CLAIMED'] } },
        select: fields,
        orderBy: { id: 'desc' },
        take: ACTIVE_LIMIT,
      }),
      prisma.downloadRequest.findMany({
        where: {
          status: { in: ['DONE', 'FAILED'] },
          ...(before ? { id: { lt: before } } : {}),
        },
        select: fields,
        orderBy: { id: 'desc' },
        take: HISTORY_PAGE_SIZE + 1,
      }),
      prisma.downloadRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ])

    const hasMore = recent.length > HISTORY_PAGE_SIZE
    const history = recent.slice(0, HISTORY_PAGE_SIZE)
    const counts = { PENDING: 0, CLAIMED: 0, DONE: 0, FAILED: 0 }
    for (const row of grouped) counts[row.status] = row._count._all

    return {
      success: true,
      message: 'Download queue loaded.',
      data: {
        active,
        history,
        counts,
        activeLimited: counts.PENDING + counts.CLAIMED > ACTIVE_LIMIT,
        nextBefore: hasMore ? history[history.length - 1]?.id ?? null : null,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Unable to load downloads.',
      statusCode,
    }
  }
})
