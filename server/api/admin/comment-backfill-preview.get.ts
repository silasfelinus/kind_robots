// Temporary read-only drafting endpoint for kind_robots#1769.
import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import {
  getCommentBackfillStatus,
  planManualCommentBackfillSlice,
} from '../../utils/commentBackfillGeneration'
import { draftCommentBackfillSlice } from '../../utils/commentBackfillAnthropic'

const BACKFILL_BRANCH = 'gpt/comment-backfill-live'

function assertPreview(): void {
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== BACKFILL_BRANCH
  ) {
    throw createError({ statusCode: 404, message: 'Not found.' })
  }
}

function integer(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export default defineEventHandler(async (event) => {
  assertPreview()
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')
  const query = getQuery(event)
  const action = String(query.action || 'status').toLowerCase()
  const start = integer(query.start, 0)
  const limit = integer(query.limit, 12)

  if (action === 'status') {
    return {
      ok: true,
      executionGuard: {
        vercelEnv: process.env.VERCEL_ENV || null,
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
      credentials: {
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        anthropicConfigured: Boolean(
          process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
        ),
      },
      backfill: await getCommentBackfillStatus(),
    }
  }

  if (action === 'plan') {
    return {
      ok: true,
      value: await planManualCommentBackfillSlice({ start, limit }),
    }
  }

  if (action === 'draft') {
    return {
      ok: true,
      value: await draftCommentBackfillSlice({
        start,
        limit,
        model: String(query.model || '') || undefined,
      }),
    }
  }

  throw createError({ statusCode: 400, message: 'Unknown backfill action.' })
})
