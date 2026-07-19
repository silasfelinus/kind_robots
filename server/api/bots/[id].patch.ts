// /server/api/bots/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '../../../utils/slugify'
import { getUniqueBotSlug } from '../../utils/botSlug'
import type { Bot, Prisma } from '~/prisma/generated/prisma/client'
import { botMutationSelect } from './selects'

type BotPatchBody = Partial<Omit<Bot, 'userId'>> &
  Record<string, unknown> & {
    dreamIds?: unknown
    addDreamIds?: unknown
    removeDreamIds?: unknown
  }

function assertOwnershipIsServerManaged(body: Record<string, unknown>) {
  if (Object.prototype.hasOwnProperty.call(body, 'userId')) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported Bot field: userId. Ownership is server-owned.',
    })
  }
}

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getDreamRelationUpdate(
  body: BotPatchBody,
): Prisma.DreamUpdateManyWithoutBotsNestedInput | undefined {
  const toIds = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((entry: any) =>
            typeof entry === 'object' ? Number(entry.id) : Number(entry),
          )
          .filter((id) => Number.isInteger(id) && id > 0)
          .map((id) => ({ id }))
      : []

  const set = body.dreamIds !== undefined ? toIds(body.dreamIds) : undefined
  const connect = toIds(body.addDreamIds)
  const disconnect = toIds(body.removeDreamIds)
  const relation: Prisma.DreamUpdateManyWithoutBotsNestedInput = {}

  if (set !== undefined) relation.set = set
  if (connect.length) relation.connect = connect
  if (disconnect.length) relation.disconnect = disconnect

  return Object.keys(relation).length ? relation : undefined
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

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

async function assertRelatedRecordsExist(options: {
  serverId?: number
  artImageId?: number
}) {
  const { serverId, artImageId } = options

  if (serverId) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: `Server ID not found: ${serverId}.`,
      })
    }
  }

  if (artImageId) {
    const artImage = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: { id: true },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ID not found: ${artImageId}.`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Bot ID. It must be a positive integer.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingBot = await prisma.bot.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        slug: true,
      },
    })

    if (!existingBot) {
      throw createError({
        statusCode: 404,
        message: `Bot with ID ${id} does not exist.`,
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const isOwner = user?.id === existingBot.userId

    if (!isAdmin && !isServerKey && !isOwner) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    const body = await readBody<BotPatchBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    if (Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    assertOwnershipIsServerManaged(body)

    const serverId = getPositiveIntegerOrUndefined(body.serverId)
    const artImageId = getPositiveIntegerOrUndefined(body.artImageId)

    await assertRelatedRecordsExist({ serverId, artImageId })

    let slugUpdate: string | null | undefined
    const requestedSlug = normalizeSlugInput(body.slug)

    if (requestedSlug !== undefined) {
      slugUpdate = requestedSlug
        ? await getUniqueBotSlug(prisma, requestedSlug, { excludeId: id })
        : null
    } else if (!existingBot.slug) {
      const slugSource = getStringOrUndefined(body.name) || existingBot.name
      slugUpdate = slugSource
        ? await getUniqueBotSlug(prisma, slugSource, { excludeId: id })
        : undefined
    }

    const updateData: Prisma.BotUpdateInput = {
      BotType: getStringOrUndefined(body.BotType),
      name: getStringOrUndefined(body.name),
      slug: slugUpdate,
      subtitle: getStringOrUndefined(body.subtitle),
      description: getStringOrUndefined(body.description),
      avatarImage: getStringOrUndefined(body.avatarImage),
      imagePath: getStringOrUndefined(body.imagePath),
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
      chatBorderImage: getStringOrUndefined(body.chatBorderImage),
      designer: getStringOrUndefined(body.designer),
      serverName: getStringOrUndefined(body.serverName),
      artPrompt: getStringOrUndefined(body.artPrompt),
      isPublic: getBooleanOrUndefined(body.isPublic),
      underConstruction: getBooleanOrUndefined(body.underConstruction),
      canDelete: getBooleanOrUndefined(body.canDelete),
      isMature: getBooleanOrUndefined(body.isMature),
      isActive: getBooleanOrUndefined(body.isActive),
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

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid update fields provided.',
      })
    }

    const data = await prisma.bot.update({
      where: { id },
      data: updateData,
      select: botMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Bot with ID ${id} updated successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to update bot.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
