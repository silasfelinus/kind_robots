// Temporary read-only drafting endpoint for kind_robots#1769.
import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { draftLightPackedCommentBackfillSlice } from '../../utils/commentBackfillAnthropicPackLight'

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
  return {
    ok: true,
    executionGuard: {
      vercelEnv: process.env.VERCEL_ENV || null,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    value: await draftLightPackedCommentBackfillSlice({
      start: integer(query.start, 0),
      limit: integer(query.limit, 12),
      model: String(query.model || '') || undefined,
    }),
  }
})
