// /server/api/art/queue/[id]/feedback.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  decodeArtJobPayload,
  parseArtJobPayload,
  serializeArtJobPayload,
} from '../../../../utils/artJobPayload'

type FeedbackSource = 'CURATOR' | 'HUMAN'
type FeedbackVerdict = 'PROMOTE' | 'REVISE' | 'REJECT'

type FeedbackRequestBody = {
  source?: string | null
  verdict?: string | null
  score?: number | null
  summary?: string | null
  reasons?: unknown
  tags?: unknown
  rubricKey?: string | null
}

type FeedbackRecord = {
  source: FeedbackSource
  verdict: FeedbackVerdict
  score: number | null
  summary: string | null
  reasons: string[]
  tags: string[]
  rubricKey: string | null
  createdAt: string
  userId: number | null
}

const SOURCES = new Set<FeedbackSource>(['CURATOR', 'HUMAN'])
const VERDICTS = new Set<FeedbackVerdict>(['PROMOTE', 'REVISE', 'REJECT'])

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function sanitizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 24)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event)) as FeedbackRequestBody | null
    const source = String(body?.source || '').toUpperCase() as FeedbackSource
    const verdict = String(body?.verdict || '').toUpperCase() as FeedbackVerdict

    if (!SOURCES.has(source)) {
      throw createError({
        statusCode: 400,
        message: 'source must be CURATOR or HUMAN.',
      })
    }

    if (!VERDICTS.has(verdict)) {
      throw createError({
        statusCode: 400,
        message: 'verdict must be PROMOTE, REVISE, or REJECT.',
      })
    }

    if (source === 'HUMAN' && !auth.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to submit human art feedback.',
      })
    }

    if (source === 'CURATOR' && !auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin or server credentials required for curator feedback.',
      })
    }

    const score =
      body?.score === null || body?.score === undefined
        ? null
        : Number(body.score)

    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      throw createError({
        statusCode: 400,
        message: 'score must be between 0 and 100.',
      })
    }

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status !== 'DONE' || !job.artImageId) {
      throw createError({
        statusCode: 409,
        message: 'Only completed jobs with an ArtImage can receive feedback.',
      })
    }

    const payload = parseArtJobPayload(job.payload)
    const curation = asRecord(payload.curation)
    const history = Array.isArray(curation.history)
      ? curation.history.filter((item) => item && typeof item === 'object')
      : []

    const feedback: FeedbackRecord = {
      source,
      verdict,
      score: score === null ? null : Math.round(score),
      summary:
        typeof body?.summary === 'string'
          ? body.summary.trim().slice(0, 4000) || null
          : null,
      reasons: sanitizeList(body?.reasons),
      tags: sanitizeList(body?.tags),
      rubricKey:
        typeof body?.rubricKey === 'string'
          ? body.rubricKey.trim().slice(0, 128) || null
          : null,
      createdAt: new Date().toISOString(),
      userId: auth.user?.id ?? null,
    }

    const key = source === 'CURATOR' ? 'curator' : 'human'
    const nextPayload = {
      ...payload,
      curation: {
        ...curation,
        [key]: feedback,
        history: [...history, feedback].slice(-50),
      },
    }

    const updated = await prisma.artJob.update({
      where: { id },
      data: {
        payload: serializeArtJobPayload(nextPayload),
      },
    })

    return {
      success: true,
      message: `${source === 'CURATOR' ? 'Curator' : 'Human'} feedback saved for job ${id}.`,
      data: { job: decodeArtJobPayload(updated) },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to save art feedback.',
      statusCode,
    }
  }
})
