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
import { gunzipSync } from 'node:zlib'
import {
  getCommentBackfillStatus,
  planManualCommentBackfillSlice,
  publishManualCommentBackfillSlice,
  runCommentBackfillSlice,
  type ManualBackfillPayload,
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

function assertPublishConfirmation(value: unknown): void {
  if (value !== PUBLISH_CONFIRMATION) {
    throw createError({
      statusCode: 400,
      message: 'Explicit backfill confirmation token is required.',
    })
  }
}

function decodePayload(value: unknown): ManualBackfillPayload {
  const encoded = String(value || '').trim()
  if (!encoded) {
    throw createError({ statusCode: 400, message: 'Missing manual payload.' })
  }

  try {
    const json = gunzipSync(Buffer.from(encoded, 'base64url')).toString('utf8')
    return JSON.parse(json) as ManualBackfillPayload
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid manual payload.' })
  }
}

function guardedResponse<T>(value: T) {
  return {
    ok: true,
    executionGuard: {
      vercelEnv: process.env.VERCEL_ENV || null,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    value,
  }
}

export default defineEventHandler(async (event) => {
  assertBackfillPreview()
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')

  const query = getQuery(event)
  const action = String(query.action || 'status').toLowerCase()
  const start = positiveInteger(query.start, 0)
  const limit = positiveInteger(query.limit, 8)

  if (action === 'status') {
    return guardedResponse({
      credentials: {
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
        anthropicConfigured: Boolean(
          process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
        ),
      },
      backfill: await getCommentBackfillStatus(),
    })
  }

  if (action === 'plan') {
    const plan = await planManualCommentBackfillSlice({ start, limit })
    if (String(query.compact || '') === '1') {
      return guardedResponse({
        start: plan.start,
        limit: plan.limit,
        eligibleTargets: plan.eligibleTargets,
        items: plan.items.map((item) => ({
          key: item.key,
          title: item.title,
          type: item.type,
          description: item.description,
          flavorText: item.flavorText,
          category: item.category,
          tags: item.tags,
          shape: item.shape,
          speakers: item.speakers.map((speaker) => ({
            kind: speaker.kind,
            id: speaker.id,
            name: speaker.name,
            voice: speaker.voice,
            sampleResponse: speaker.sampleResponse,
          })),
        })),
      })
    }
    return guardedResponse(plan)
  }

  if (action === 'publish') {
    assertPublishConfirmation(query.confirm)
    return guardedResponse(
      await publishManualCommentBackfillSlice({
        start,
        payload: decodePayload(query.payload),
      }),
    )
  }

  if (action === 'run') {
    assertPublishConfirmation(query.confirm)
    return guardedResponse(await runCommentBackfillSlice({ start, limit }))
  }

  throw createError({ statusCode: 400, message: 'Unknown backfill action.' })
})
