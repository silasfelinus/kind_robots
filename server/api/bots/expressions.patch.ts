// /server/api/server/bots/expressions.patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import { validateApiKey } from './../../utils/validateKey'
import type { ExpressionMedia, Prisma } from '~/prisma/generated/prisma/client'

const EXPRESSIONS = [
  // ── Emotions (face-only) ──
  'NEUTRAL',
  'JOYFUL',
  'SORROWFUL',
  'AFRAID',
  'DISGUSTED',
  'ENRAGED',
  'SURPRISED',
  'ANXIOUS',
  'PROUD',
  'LOVING',
  // ── Actions (pose/state) ──
  'LAUGHING',
  'CRYING',
  'SLEEPING',
  'THINKING',
  'SHRUGGING',
  'WINKING',
  'FACEPALMING',
  'CHEERING',
  'WHISPERING',
  'SHOUTING',
  // ── Custom escape hatch ──
  'CUSTOM',
] as const
type ExpressionValue = (typeof EXPRESSIONS)[number]
const EXPRESSION_SET = new Set<string>(EXPRESSIONS)

const KINDS = ['EMOTION', 'ACTION'] as const
type KindValue = (typeof KINDS)[number]
const KIND_SET = new Set<string>(KINDS)

type ExpressionBatchRow = Partial<ExpressionMedia> & {
  botId?: number
  characterId?: number
  expression?: unknown
  kind?: unknown
  expressionKey?: unknown
}

type ExpressionBatchBody =
  | ExpressionBatchRow[]
  | {
      dryRun?: boolean
      expressions?: ExpressionBatchRow[]
    }

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
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

function getExpressionOrUndefined(value: unknown): ExpressionValue | undefined {
  return typeof value === 'string' && EXPRESSION_SET.has(value)
    ? (value as ExpressionValue)
    : undefined
}

function getKindOrUndefined(value: unknown): KindValue | undefined {
  return typeof value === 'string' && KIND_SET.has(value)
    ? (value as KindValue)
    : undefined
}

function getBatchPayload(body: ExpressionBatchBody): {
  dryRun: boolean
  rows: ExpressionBatchRow[]
} {
  if (Array.isArray(body)) {
    return { dryRun: false, rows: body }
  }
  return {
    dryRun: body?.dryRun === true,
    rows: Array.isArray(body?.expressions) ? body.expressions : [],
  }
}

// Shared writable fields for both create and update halves of an upsert.
function getWritableData(row: ExpressionBatchRow) {
  const artImageId = getPositiveIntegerOrUndefined(row.artImageId)

  return {
    expression: getExpressionOrUndefined(row.expression),
    kind: getKindOrUndefined(row.kind),
    label: getStringOrUndefined(row.label),
    emoticon: getStringOrUndefined(row.emoticon),
    imagePath: getStringOrUndefined(row.imagePath),
    videoPath: getStringOrUndefined(row.videoPath),
    message: getStringOrUndefined(row.message),
    designer: getStringOrUndefined(row.designer),
    artPrompt: getStringOrUndefined(row.artPrompt),
    isActive: getBooleanOrUndefined(row.isActive),
    additionalPhrases:
      row.additionalPhrases === undefined
        ? undefined
        : (row.additionalPhrases as Prisma.InputJsonValue),
    ArtImage:
      row.artImageId === null
        ? { disconnect: true }
        : artImageId
          ? { connect: { id: artImageId } }
          : undefined,
  }
}

async function assertRelatedRecordsExist(options: {
  botIds: number[]
  characterIds: number[]
  artImageIds: number[]
}) {
  const [bots, characters, artImages] = await Promise.all([
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
    options.artImageIds.length
      ? prisma.artImage.findMany({
          where: { id: { in: options.artImageIds } },
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
  assertFound(
    'ArtImage',
    options.artImageIds,
    artImages.map((a) => a.id),
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

    const body = await readBody<ExpressionBatchBody>(event)
    const { dryRun, rows } = getBatchPayload(body)

    if (!rows.length) {
      throw createError({
        statusCode: 400,
        message:
          'No expression rows provided. Send an array or { expressions: [...] }.',
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1

    if (!isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only admins or server keys may batch expression media.',
      })
    }

    // ── Validate every row up front; collect normalized work + relation ids. ──
    type Normalized = {
      index: number
      botId?: number
      characterId?: number
      expressionKey: string
      data: ReturnType<typeof getWritableData>
    }

    const normalized: Normalized[] = []
    const botIds = new Set<number>()
    const characterIds = new Set<number>()
    const artImageIds = new Set<number>()

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

      const expressionKey = getStringOrUndefined(row.expressionKey)
      if (!expressionKey) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: expressionKey is required (lowercase enum or custom slug).`,
        })
      }

      const data = getWritableData(row)
      if (data.expression === undefined) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: missing or invalid expression.`,
        })
      }
      if (data.kind === undefined) {
        throw createError({
          statusCode: 400,
          message: `Row ${index}: missing or invalid kind (EMOTION | ACTION).`,
        })
      }

      if (botId) botIds.add(botId)
      if (characterId) characterIds.add(characterId)
      const aiId = getPositiveIntegerOrUndefined(row.artImageId)
      if (aiId) artImageIds.add(aiId)

      normalized.push({ index, botId, characterId, expressionKey, data })
    })

    // Guard against duplicate (owner, key) pairs within the same batch —
    // they'd race on the unique constraint inside one transaction.
    const seen = new Set<string>()
    for (const n of normalized) {
      const owner = n.botId ? `bot:${n.botId}` : `char:${n.characterId}`
      const dupKey = `${owner}|${n.expressionKey}`
      if (seen.has(dupKey)) {
        throw createError({
          statusCode: 400,
          message: `Duplicate (owner, expressionKey) in batch: ${dupKey}.`,
        })
      }
      seen.add(dupKey)
    }

    await assertRelatedRecordsExist({
      botIds: [...botIds],
      characterIds: [...characterIds],
      artImageIds: [...artImageIds],
    })

    if (dryRun) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: `Dry run: ${normalized.length} expression rows are valid.`,
        data: normalized.map((n) => ({
          owner: n.botId ? { botId: n.botId } : { characterId: n.characterId },
          expressionKey: n.expressionKey,
          expression: n.data.expression,
          kind: n.data.kind,
        })),
        statusCode: 200,
      }
    }

    // ── Upsert each row by its compound unique key. Re-runnable. ──
    const select = {
      id: true,
      botId: true,
      characterId: true,
      expression: true,
      kind: true,
      expressionKey: true,
      imagePath: true,
      videoPath: true,
      artImageId: true,
      isActive: true,
      updatedAt: true,
    } satisfies Prisma.ExpressionMediaSelect

    const data = await prisma.$transaction(
      normalized.map((n) => {
        const where: Prisma.ExpressionMediaWhereUniqueInput = n.botId
          ? {
              botId_expressionKey: {
                botId: n.botId,
                expressionKey: n.expressionKey,
              },
            }
          : {
              characterId_expressionKey: {
                characterId: n.characterId as number,
                expressionKey: n.expressionKey,
              },
            }

        const owner = n.botId
          ? { Bot: { connect: { id: n.botId } } }
          : { Character: { connect: { id: n.characterId as number } } }

        // expression/kind are guaranteed defined past validation.
        const create: Prisma.ExpressionMediaCreateInput = {
          expressionKey: n.expressionKey,
          expression: n.data.expression!,
          kind: n.data.kind!,
          label: n.data.label,
          emoticon: n.data.emoticon,
          imagePath: n.data.imagePath,
          videoPath: n.data.videoPath,
          message: n.data.message,
          designer: n.data.designer,
          artPrompt: n.data.artPrompt,
          isActive: n.data.isActive ?? true,
          additionalPhrases: n.data.additionalPhrases,
          ...owner,
          ...(n.data.ArtImage && 'connect' in n.data.ArtImage
            ? { ArtImage: n.data.ArtImage }
            : {}),
        }

        const update: Prisma.ExpressionMediaUpdateInput = {
          expression: n.data.expression,
          kind: n.data.kind,
          label: n.data.label,
          emoticon: n.data.emoticon,
          imagePath: n.data.imagePath,
          videoPath: n.data.videoPath,
          message: n.data.message,
          designer: n.data.designer,
          artPrompt: n.data.artPrompt,
          isActive: n.data.isActive,
          additionalPhrases: n.data.additionalPhrases,
          ArtImage: n.data.ArtImage,
        }

        return prisma.expressionMedia.upsert({ where, create, update, select })
      }),
      { timeout: 60000 },
    )

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Upserted ${data.length} expression media rows successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to upsert expression media.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
