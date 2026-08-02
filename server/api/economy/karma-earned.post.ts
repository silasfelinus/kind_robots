// /server/api/economy/karma-earned.post.ts
//
// interface-vision/t-019: "show earned karma on object cards" — a single
// batch-aggregation endpoint so a gallery/list view can ask, in one indexed
// query, how much karma a page of objects has collectively earned.
//
// Semantics: "earned" = the sum of only POSITIVE KarmaTransaction.amount
// rows for a given (refType, refId). A later negative adjustment (e.g.
// ADMIN_ADJUSTMENT clawing back a mistaken award) reduces what an object
// *could still earn going forward* but never makes its displayed total go
// negative or "look like it lost karma it never had" — we're displaying a
// contribution/earned figure, not a balance. refType is only ever set by
// award call sites where refId unambiguously names a single object (see
// server/utils/karma.ts); anything else was never tagged and simply won't
// match here.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

// Keep in sync with ReactionTargetType (stores/reactionStore.ts) — the only
// refType values any award call site currently writes.
const ALLOWED_REF_TYPES = new Set([
  'artImage',
  'artCollection',
  'bot',
  'character',
  'chat',
  'component',
  'dream',
  'prompt',
  'resource',
  'reward',
  'scenario',
  'theme',
])

const BATCH_LIMIT = 200

type KarmaEarnedRequestItem = {
  refType?: unknown
  refId?: unknown
}

type KarmaEarnedRequestBody = {
  items?: KarmaEarnedRequestItem[]
}

type NormalizedPair = { refType: string; refId: string }

function normalizeItems(body: KarmaEarnedRequestBody): NormalizedPair[] {
  if (!Array.isArray(body.items)) {
    throw createError({
      statusCode: 400,
      message: '"items" must be an array of { refType, refId }.',
    })
  }

  if (body.items.length === 0) {
    throw createError({
      statusCode: 400,
      message: '"items" cannot be empty.',
    })
  }

  if (body.items.length > BATCH_LIMIT) {
    throw createError({
      statusCode: 400,
      message: `"items" may contain at most ${BATCH_LIMIT} entries.`,
    })
  }

  const seen = new Set<string>()
  const pairs: NormalizedPair[] = []

  for (const [index, item] of body.items.entries()) {
    const refType = typeof item?.refType === 'string' ? item.refType.trim() : ''
    const refIdRaw = item?.refId

    if (!ALLOWED_REF_TYPES.has(refType)) {
      throw createError({
        statusCode: 400,
        message: `items[${index}].refType must be one of: ${Array.from(ALLOWED_REF_TYPES).join(', ')}.`,
      })
    }

    const refId =
      typeof refIdRaw === 'string'
        ? refIdRaw.trim()
        : typeof refIdRaw === 'number' && Number.isFinite(refIdRaw)
          ? String(refIdRaw)
          : ''

    if (!refId) {
      throw createError({
        statusCode: 400,
        message: `items[${index}].refId is required.`,
      })
    }

    const key = `${refType}:${refId}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ refType, refId })
  }

  return pairs
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<KarmaEarnedRequestBody>(event)
    const pairs = normalizeItems(body ?? {})

    // Single indexed groupBy over the whole batch (KarmaTransaction has
    // @@index([refType, refId])), not N per-item queries.
    const rows = await prisma.karmaTransaction.groupBy({
      by: ['refType', 'refId'],
      where: {
        amount: { gt: 0 },
        OR: pairs.map(({ refType, refId }) => ({ refType, refId })),
      },
      _sum: { amount: true },
    })

    const earnedByKey = new Map<string, number>()
    for (const row of rows) {
      if (!row.refType || !row.refId) continue
      earnedByKey.set(`${row.refType}:${row.refId}`, row._sum.amount ?? 0)
    }

    const data = pairs.map(({ refType, refId }) => ({
      refType,
      refId,
      earnedKarma: earnedByKey.get(`${refType}:${refId}`) ?? 0,
    }))

    return {
      success: true,
      message: `Earned karma resolved for ${data.length} item(s).`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to resolve earned karma.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
