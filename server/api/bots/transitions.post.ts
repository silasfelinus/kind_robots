// /server/api/bots/transitions.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type {
  ExpressionTransition,
  Prisma,
} from '~/prisma/generated/prisma/client'

// Allow up to 60s on Vercel (Pro). Harmless on platforms that ignore it.
export const config = {
  maxDuration: 60,
}

// How many upserts to run per interactive transaction. Keeps any single
// transaction well under both Prisma's and the platform's timeouts.
const CHUNK_SIZE = 25

type TransitionBatchRow = Partial<ExpressionTransition> & {
  botId?: number
  characterId?: number
  fromKey?: unknown
  toKey?: unknown
}

type TransitionBatchBody =
  | TransitionBatchRow[]
  | {
      dryRun?: boolean
      transitions?: TransitionBatchRow[]
    }

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getNonEmptyStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined
}

function getBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

function getBatchPayload(body: TransitionBatchBody): {
  dryRun: boolean
  rows: TransitionBatchRow[]
} {
  if (Array.isArray(body)) {
    return { dryRun: false, rows: body }
  }
  return {
    dryRun: body?.dryRun === true,
    rows: Array.isArray(body?.transitions) ? body.transitions : [],
  }
}

// Shared writable fields for both create and update halves of an upsert.
// fromKey/toKey are identity (part of the unique key), so they live on the
// create half only — not here.
function getWritableData(row: TransitionBatchRow) {
  return {
    videoPath: getNonEmptyStringOrUndefined(row.videoPath),
    fps: getPositiveIntegerOrUndefined(row.fps),
    frames: getPositiveIntegerOrUndefined(row.frames),
    designer: getStringOrUndefined(row.designer),
    isActive: getBooleanOrUndefined(row.isActive),
  }
}

async function assertRelatedRecordsExist(options: {
  botIds: number[]
  characterIds: number[]
}) {
  const [bots, characters] = await Promise.all([
    options.botIds.length
      ? prisma.bot.findMany({
          where: { id: { in: options.botIds } },
          select: { id: true },
        })
      : [],
    options.characterIds.length
      ? prisma.character.findMany({
          where: { id: { in: options.characterIds } },
          select: { id: true },
        })
      : [],
  ])

  const assertFound = (label: string, requested: number[], found: number[]) => {
    const missing = requested.filter((id) => !found.includes(id))
    if (missing.length) {
      throw createError({
        statusCode: 404,
        message: `${label} ID not found: ${[...new Set(missing)].join(', ')}.`,
      })
    }
  }

  assertFound(
    'Bot',
    options.botIds,
    bots.map((b) => b.id),
  )
  assertFound(
    'Character',
    options.characterIds,
    characters.map((c) => c.id),
  )
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<TransitionBatchBody>(event)
    const { dryRun, rows } = getBatchPayload(body)

    if (!rows.length) {
      throw createError({
        statusCode: 400,
        message:
          'No transition rows provided. Send an array or { transitions: [...] }.',
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1

    if (!isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only admins or server keys may batch expression transitions.',
      })
    }

    // ── Validate every row up front; collect normalized work + relation ids. ──
    type Normalized = {
      index: number
      botId?: number
      characterId?: number
      fromKey: string
      toKey: string
      data: ReturnType<typeof getWritableData>
    }

    const normalized: Normalized[] = []
    const botIds = new Set<number>()
    const characterIds = new Set<number>()

    rows.forEach((row, index) => {
      const botId = getPositiveIntegerOrUndefined(row.botId)
      const characterId = getPositiveIntegerOrUndefined(row.characterId)

      // Exactly one owner.
      if ((botId && characterId) || (!botId && !characterId)) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: provide exactly one of botId or characterId.`,
        })
      }

      const fromKey = getNonEmptyStringOrUndefined(row.fromKey)
      const toKey = getNonEmptyStringOrUndefined(row.toKey)
      if (!fromKey || !toKey) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: both fromKey and toKey are required (lowercase enum or custom slug).`,
        })
      }
      if (fromKey === toKey) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: fromKey and toKey must differ (no self-transition).`,
        })
      }

      const data = getWritableData(row)
      // videoPath is required on create; an upsert that creates with no clip
      // would violate the schema, so demand it up front.
      if (data.videoPath === undefined) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: videoPath is required.`,
        })
      }

      if (botId) botIds.add(botId)
      if (characterId) characterIds.add(characterId)

      normalized.push({ index, botId, characterId, fromKey, toKey, data })
    })

    // Guard against duplicate (owner, fromKey, toKey) triples within the same
    // batch — they'd race on the unique constraint inside one transaction.
    const seen = new Set<string>()
    for (const n of normalized) {
      const owner = n.botId ? `bot:${n.botId}` : `char:${n.characterId}`
      const dupKey = `${owner}|${n.fromKey}->${n.toKey}`
      if (seen.has(dupKey)) {
        throw createError({
          statusCode: 400,
          message: `Duplicate (owner, fromKey, toKey) in batch: ${dupKey}.`,
        })
      }
      seen.add(dupKey)
    }

    await assertRelatedRecordsExist({
      botIds: [...botIds],
      characterIds: [...characterIds],
    })

    if (dryRun) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: `Dry run: ${normalized.length} transition rows are valid.`,
        data: normalized.map((n) => ({
          owner: n.botId ? { botId: n.botId } : { characterId: n.characterId },
          fromKey: n.fromKey,
          toKey: n.toKey,
          videoPath: n.data.videoPath,
        })),
        statusCode: 200,
      }
    }

    // ── Build one upsert arg per row, keyed on its compound unique. ──
    const select = {
      id: true,
      botId: true,
      characterId: true,
      fromKey: true,
      toKey: true,
      videoPath: true,
      fps: true,
      frames: true,
      isActive: true,
      updatedAt: true,
    } satisfies Prisma.ExpressionTransitionSelect

    const buildUpsertArgs = (n: Normalized) => {
      const where: Prisma.ExpressionTransitionWhereUniqueInput = n.botId
        ? {
            botId_fromKey_toKey: {
              botId: n.botId,
              fromKey: n.fromKey,
              toKey: n.toKey,
            },
          }
        : {
            characterId_fromKey_toKey: {
              characterId: n.characterId as number,
              fromKey: n.fromKey,
              toKey: n.toKey,
            },
          }

      const owner = n.botId
        ? { Bot: { connect: { id: n.botId } } }
        : { Character: { connect: { id: n.characterId as number } } }

      // videoPath is guaranteed defined past validation.
      const create: Prisma.ExpressionTransitionCreateInput = {
        fromKey: n.fromKey,
        toKey: n.toKey,
        videoPath: n.data.videoPath!,
        fps: n.data.fps ?? undefined, // let schema default (16) apply
        frames: n.data.frames,
        designer: n.data.designer,
        isActive: n.data.isActive ?? true,
        ...owner,
      }

      const update: Prisma.ExpressionTransitionUpdateInput = {
        videoPath: n.data.videoPath,
        fps: n.data.fps,
        frames: n.data.frames,
        designer: n.data.designer,
        isActive: n.data.isActive,
      }

      return { where, create, update, select }
    }

    // ── Upsert in chunks. Each chunk is its own transaction, so no single
    //    transaction can outlast the timeout. Upserts are idempotent, so a
    //    failure mid-run leaves prior chunks committed and is safely resumable
    //    by re-sending the same payload. ──
    type UpsertResult = Prisma.ExpressionTransitionGetPayload<{
      select: typeof select
    }>
    const results: UpsertResult[] = []
    let committedChunks = 0

    try {
      for (let start = 0; start < normalized.length; start += CHUNK_SIZE) {
        const slice = normalized.slice(start, start + CHUNK_SIZE)

        const chunkResults = await prisma.$transaction(
          slice.map((n) =>
            prisma.expressionTransition.upsert(buildUpsertArgs(n)),
          ),
          { timeout: 30000 },
        )

        results.push(...chunkResults)
        committedChunks += 1
      }
    } catch (chunkError) {
      // Surface partial progress so the caller knows how much landed.
      const { message, statusCode } = errorHandler(chunkError)
      event.node.res.statusCode = statusCode || 500

      return {
        success: false,
        message: `Failed after committing ${results.length}/${normalized.length} rows (${committedChunks} chunk(s)). Re-send the same payload to resume — upserts are idempotent. Cause: ${message}`,
        data: results,
        statusCode: event.node.res.statusCode,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Upserted ${results.length} expression transition rows successfully (${committedChunks} chunk(s) of up to ${CHUNK_SIZE}).`,
      data: results,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to upsert expression transitions.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
