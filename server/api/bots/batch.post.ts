// /server/api/bots/batch.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Bot, Prisma } from '~/prisma/generated/prisma/client'

type BotBatchPatch = Partial<Bot> & {
  id?: number
  dreamIds?: unknown
  addDreamIds?: unknown
  removeDreamIds?: unknown
}

type BotBatchBody =
  | BotBatchPatch[]
  | {
      dryRun?: boolean
      bots?: BotBatchPatch[]
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

function getDreamRelationUpdate(
  body: BotBatchPatch,
): Prisma.DreamUpdateManyWithoutBotsNestedInput | undefined {
  const toIds = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item: any) =>
            typeof item === 'object' ? Number(item.id) : Number(item),
          )
          .filter((id) => Number.isInteger(id) && id > 0)
          .map((id) => ({ id }))
      : []

  const set = body.dreamIds !== undefined ? toIds(body.dreamIds) : undefined
  const connect = toIds(body.addDreamIds)
  const disconnect = toIds(body.removeDreamIds)

  const op: Prisma.DreamUpdateManyWithoutBotsNestedInput = {}
  if (set !== undefined) op.set = set
  if (connect.length) op.connect = connect
  if (disconnect.length) op.disconnect = disconnect

  return Object.keys(op).length ? op : undefined
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

function getBatchPayload(body: BotBatchBody): {
  dryRun: boolean
  bots: BotBatchPatch[]
} {
  if (Array.isArray(body)) {
    return {
      dryRun: false,
      bots: body,
    }
  }

  return {
    dryRun: body?.dryRun === true,
    bots: Array.isArray(body?.bots) ? body.bots : [],
  }
}

function getBotUpdateData(body: BotBatchPatch): Prisma.BotUpdateInput {
  const requestedUserId = getPositiveIntegerOrUndefined(body.userId)
  const serverId = getPositiveIntegerOrUndefined(body.serverId)
  const artImageId = getPositiveIntegerOrUndefined(body.artImageId)

  return {
    BotType: getStringOrUndefined(body.BotType),
    name: getStringOrUndefined(body.name),
    subtitle: getStringOrUndefined(body.subtitle),
    description: getStringOrUndefined(body.description),
    avatarImage: getStringOrUndefined(body.avatarImage),
    botIntro: getStringOrUndefined(body.botIntro),
    userIntro: getStringOrUndefined(body.userIntro),
    prompt: getStringOrUndefined(body.prompt),
    trainingPath: getStringOrUndefined(body.trainingPath),
    theme: getStringOrUndefined(body.theme),
    personality: getStringOrUndefined(body.personality),
    modules: getStringOrUndefined(body.modules),
    sampleResponse: getStringOrUndefined(body.sampleResponse),
    tagline: getStringOrUndefined(body.tagline),
    narrativeVoice: getStringOrUndefined(body.narrativeVoice),
    forgeIntro: getStringOrUndefined(body.forgeIntro),
    designer: getStringOrUndefined(body.designer),
    serverName: getStringOrUndefined(body.serverName),
    artPrompt: getStringOrUndefined(body.artPrompt),
    isPublic: getBooleanOrUndefined(body.isPublic),
    underConstruction: getBooleanOrUndefined(body.underConstruction),
    canDelete: getBooleanOrUndefined(body.canDelete),
    isMature: getBooleanOrUndefined(body.isMature),
    isActive: getBooleanOrUndefined(body.isActive),
    User: requestedUserId
      ? {
          connect: { id: requestedUserId },
        }
      : undefined,
    Server:
      body.serverId === null
        ? { disconnect: true }
        : serverId
          ? { connect: { id: serverId } }
          : undefined,
    ArtImage:
      body.artImageId === null
        ? { disconnect: true }
        : artImageId
          ? { connect: { id: artImageId } }
          : undefined,
    Dreams: getDreamRelationUpdate(body),
  }
}

async function assertRelatedRecordsExist(options: {
  userIds: number[]
  serverIds: number[]
  artImageIds: number[]
}) {
  const [users, servers, artImages] = await Promise.all([
    options.userIds.length
      ? prisma.user.findMany({
          where: { id: { in: options.userIds } },
          select: { id: true },
        })
      : [],
    options.serverIds.length
      ? prisma.server.findMany({
          where: { id: { in: options.serverIds } },
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
        message: `${label} ID not found: ${missing.join(', ')}.`,
      })
    }
  }

  assertFound(
    'User',
    options.userIds,
    users.map((user) => user.id),
  )
  assertFound(
    'Server',
    options.serverIds,
    servers.map((server) => server.id),
  )
  assertFound(
    'ArtImage',
    options.artImageIds,
    artImages.map((artImage) => artImage.id),
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

    const body = await readBody<BotBatchBody>(event)
    const { dryRun, bots } = getBatchPayload(body)

    if (!bots.length) {
      throw createError({
        statusCode: 400,
        message: 'No bot updates provided. Send an array or { bots: [...] }.',
      })
    }

    const ids = bots.map((bot) => getPositiveIntegerOrUndefined(bot.id))

    if (ids.some((id) => id === undefined)) {
      throw createError({
        statusCode: 400,
        message: 'Every bot update must include a positive integer id.',
      })
    }

    const botIds = ids as number[]
    const duplicateIds = botIds.filter(
      (id, index) => botIds.indexOf(id) !== index,
    )

    if (duplicateIds.length) {
      throw createError({
        statusCode: 400,
        message: `Duplicate bot IDs in batch: ${[...new Set(duplicateIds)].join(', ')}.`,
      })
    }

    const existingBots = await prisma.bot.findMany({
      where: { id: { in: botIds } },
      select: {
        id: true,
        userId: true,
      },
    })

    const existingIds = existingBots.map((bot) => bot.id)
    const missingIds = botIds.filter((id) => !existingIds.includes(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Bot ID not found: ${missingIds.join(', ')}.`,
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1

    const forbiddenIds = existingBots
      .filter((bot) => !isAdmin && !isServerKey && user?.id !== bot.userId)
      .map((bot) => bot.id)

    if (forbiddenIds.length) {
      throw createError({
        statusCode: 403,
        message: `You do not have permission to update bot IDs: ${forbiddenIds.join(', ')}.`,
      })
    }

    const userIds = [
      ...new Set(
        bots
          .map((bot) => getPositiveIntegerOrUndefined(bot.userId))
          .filter((id): id is number => id !== undefined),
      ),
    ]
    const serverIds = [
      ...new Set(
        bots
          .map((bot) => getPositiveIntegerOrUndefined(bot.serverId))
          .filter((id): id is number => id !== undefined),
      ),
    ]
    const artImageIds = [
      ...new Set(
        bots
          .map((bot) => getPositiveIntegerOrUndefined(bot.artImageId))
          .filter((id): id is number => id !== undefined),
      ),
    ]

    if (userIds.length && !isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only admins can reassign bot ownership.',
      })
    }

    await assertRelatedRecordsExist({
      userIds,
      serverIds,
      artImageIds,
    })

    const updates = bots.map((bot) => {
      const id = getPositiveIntegerOrUndefined(bot.id) as number
      const data = getBotUpdateData(bot)

      if (!hasUpdateData(data as Record<string, unknown>)) {
        throw createError({
          statusCode: 400,
          message: `No valid update fields provided for bot ID ${id}.`,
        })
      }

      return { id, data }
    })

    if (dryRun) {
      event.node.res.statusCode = 200

      return {
        success: true,
        message: `Dry run: ${updates.length} bot updates are valid.`,
        data: updates.map(({ id, data }) => ({
          id,
          fields: Object.entries(data)
            .filter(([, value]) => value !== undefined)
            .map(([key]) => key),
        })),
        statusCode: 200,
      }
    }

    const data = await prisma.$transaction(
      updates.map(({ id, data }) =>
        prisma.bot.update({
          where: { id },
          data,
          select: {
            id: true,
            name: true,
            BotType: true,
            subtitle: true,
            avatarImage: true,
            tagline: true,
            updatedAt: true,
          },
        }),
      ),
      { timeout: 30000 },
    )

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Updated ${data.length} bots successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to update bots.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
