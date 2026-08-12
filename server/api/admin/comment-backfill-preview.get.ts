// /server/api/admin/comment-backfill-preview.get.ts
// Temporary execution surface for kind_robots#1769.
// It is deliberately impossible to run on production: only the named Vercel
// preview branch may enter. Remove this route after the approved backfill.
import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3'
import {
  getCommentBackfillStatus,
  runCommentBackfillSlice,
} from '../../utils/commentBackfillGeneration'

const BACKFILL_BRANCH = 'gpt/comment-backfill-live'
const PUBLISH_CONFIRMATION = 'publish-1769'

function assertBackfillPreview(): void {
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== BACKFILL_BRANCH
  ) {
    throw createError({ statusCode: 404, message: 'Not found.' })
  }
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export default defineEventHandler(async (event) => {
  assertBackfillPreview()
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')

  const query = getQuery(event)
  const action = String(query.action || 'status').toLowerCase()

  if (action === 'status') {
    return {
      ok: true,
      executionGuard: {
        vercelEnv: process.env.VERCEL_ENV || null,
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
      credentials: {
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
      },
      backfill: await getCommentBackfillStatus(),
    }
  }

  if (action !== 'run') {
    throw createError({ statusCode: 400, message: 'Unknown backfill action.' })
  }

  if (query.confirm !== PUBLISH_CONFIRMATION) {
    throw createError({
      statusCode: 400,
      message: 'Explicit backfill confirmation token is required.',
    })
  }

  const start = positiveInteger(query.start, 0)
  const limit = positiveInteger(query.limit, 8)

  return {
    ok: true,
    executionGuard: {
      vercelEnv: process.env.VERCEL_ENV || null,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    run: await runCommentBackfillSlice({ start, limit }),
  }
})
