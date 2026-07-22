// /server/api/admin/wonderlab/review-drafts/stats.get.ts
import { createError, defineEventHandler, getQuery, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import { normalizeReviewDraftStatus } from '@/utils/wonderlab/reviewDraft'

type ReviewDraftCorpusStatsRow = {
  highestDraftId: number | bigint | null
  reviewDrafts: number | bigint
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery(event)
    const status = query.status
      ? normalizeReviewDraftStatus(query.status)
      : null

    if (query.status && !status) {
      throw createError({ statusCode: 400, message: 'Invalid review draft status.' })
    }

    const rows = await prisma.$queryRawUnsafe<ReviewDraftCorpusStatsRow[]>(
      `SELECT MAX(id) AS highestDraftId, COUNT(*) AS reviewDrafts
       FROM ReviewDraft
       WHERE (? IS NULL OR status = ?)`,
      status,
      status,
    )
    const row = rows[0]

    return {
      success: true,
      data: {
        highestDraftId: Number(row?.highestDraftId ?? 0),
        reviewDrafts: Number(row?.reviewDrafts ?? 0),
        status,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
