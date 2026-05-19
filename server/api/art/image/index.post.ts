// /server/api/art/image/index.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

type CreateArtImagePayload = {
  userId?: number | null
  imageData?: string | null
  thumbnailData?: string | null
  fileName?: string | null
  fileType?: string | null
  imagePath?: string | null
  rarity?: number | null
  path?: string | null
  promptString?: string | null
  artPrompt?: string | null
  negativePrompt?: string | null
  checkpoint?: string | null
  checkpointResourceId?: number | null
  sampler?: string | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  cfgHalf?: boolean | null
  designer?: string | null
  genres?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  isActive?: boolean | null
  serverId?: number | null
  serverName?: string | null
  serverUrl?: string | null

  botId?: number | null
  componentId?: number | null
  milestoneId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  chatId?: number | null
  characterId?: number | null
  butterflyId?: number | null

  botIds?: number[]
  componentIds?: number[]
  milestoneIds?: number[]
  pitchIds?: number[]
  promptIds?: number[]
  resourceIds?: number[]
  rewardIds?: number[]
  chatIds?: number[]
  characterIds?: number[]
  butterflyIds?: number[]
  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  artCollectionIds?: number[]
}

function cleanText(value?: string | null): string | null {
  const text = value?.trim()
  return text && text !== 'UNDEFINED' ? text : null
}

function cleanPositiveId(value?: number | null): number | null {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function cleanNumber(value?: number | null): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function cleanBoolean(value?: boolean | null): boolean {
  return value === true
}

function cleanPositiveIds(values?: Array<number | null | undefined>): number[] {
  if (!Array.isArray(values)) return []

  return [...new Set(values)]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
}

function mergeIds(
  ...groups: Array<Array<number | null | undefined> | undefined>
): number[] {
  return [...new Set(groups.flatMap((group) => cleanPositiveIds(group)))]
}

function connectById(id?: number | null) {
  const cleanId = cleanPositiveId(id)
  return cleanId ? { connect: { id: cleanId } } : undefined
}

function connectMany(ids?: Array<number | null | undefined>) {
  const cleanIds = cleanPositiveIds(ids)

  return cleanIds.length
    ? {
        connect: cleanIds.map((id) => ({ id })),
      }
    : undefined
}

function getFallbackFileName(body: CreateArtImagePayload): string {
  const path = cleanText(body.imagePath) || cleanText(body.path)

  if (path) {
    const cleanPath = path.split('?')[0] || ''
    const fileName = cleanPath.split('/').filter(Boolean).at(-1)

    if (fileName) return fileName
  }

  return `art-image-${Date.now()}.${getFallbackFileType(body)}`
}

function getFallbackFileType(body: CreateArtImagePayload): string {
  const source =
    cleanText(body.fileName) ||
    cleanText(body.imagePath) ||
    cleanText(body.path) ||
    ''

  const extension = source.split('?')[0]?.split('.').pop()?.toLowerCase()

  if (extension === 'jpg') return 'jpeg'
  if (extension === 'jpeg') return 'jpeg'
  if (extension === 'webp') return 'webp'
  if (extension === 'gif') return 'gif'
  if (extension === 'avif') return 'avif'

  return 'png'
}

async function validateUserToken(userId: number, token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      apiKey: token,
    },
    select: {
      id: true,
    },
  })

  if (!user || user.id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Token does not match user ID',
    })
  }
}

function buildCreateData(
  body: CreateArtImagePayload,
): Prisma.ArtImageCreateInput {
  const imageData = cleanText(body.imageData)
  const imagePath = cleanText(body.imagePath)
  const path = cleanText(body.path)

  if (!imageData && !imagePath && !path) {
    throw createError({
      statusCode: 400,
      message: 'imageData, imagePath, or path is required.',
    })
  }

  const fileType = cleanText(body.fileType) || getFallbackFileType(body)
  const fileName = cleanText(body.fileName) || getFallbackFileName(body)

  return {
    imageData,
    thumbnailData: cleanText(body.thumbnailData),
    fileName,
    fileType,
    imagePath,
    path,
    promptString: cleanText(body.promptString),
    artPrompt: cleanText(body.artPrompt),
    negativePrompt: cleanText(body.negativePrompt),
    checkpoint: cleanText(body.checkpoint),
    sampler: cleanText(body.sampler),
    seed: cleanNumber(body.seed),
    steps: cleanNumber(body.steps),
    cfg: cleanNumber(body.cfg),
    cfgHalf: cleanBoolean(body.cfgHalf),
    designer: cleanText(body.designer),
    genres: cleanText(body.genres),
    isPublic: cleanBoolean(body.isPublic),
    isMature: cleanBoolean(body.isMature),
    isActive: body.isActive ?? true,
    serverName: cleanText(body.serverName),
    serverUrl: cleanText(body.serverUrl),

    User: connectById(body.userId),
    Server: connectById(body.serverId),
    CheckpointResource: connectById(body.checkpointResourceId),

    Bots: connectMany(mergeIds(body.botIds, body.botId ? [body.botId] : [])),
    Components: connectMany(
      mergeIds(body.componentIds, body.componentId ? [body.componentId] : []),
    ),
    Milestones: connectMany(
      mergeIds(body.milestoneIds, body.milestoneId ? [body.milestoneId] : []),
    ),
    Pitches: connectMany(
      mergeIds(body.pitchIds, body.pitchId ? [body.pitchId] : []),
    ),
    Prompts: connectMany(
      mergeIds(body.promptIds, body.promptId ? [body.promptId] : []),
    ),
    Resources: connectMany(
      mergeIds(body.resourceIds, body.resourceId ? [body.resourceId] : []),
    ),
    Rewards: connectMany(
      mergeIds(body.rewardIds, body.rewardId ? [body.rewardId] : []),
    ),
    Chats: connectMany(
      mergeIds(body.chatIds, body.chatId ? [body.chatId] : []),
    ),
    Characters: connectMany(
      mergeIds(body.characterIds, body.characterId ? [body.characterId] : []),
    ),
    Dreams: connectMany(body.dreamIds),
    Scenarios: connectMany(body.scenarioIds),
    Reactions: connectMany(body.reactionIds),
    ArtCollections: connectMany(body.artCollectionIds),
  }
}

export default defineEventHandler(async (event) => {
  try {
    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>"',
      })
    }

    const token = authorizationHeader.split(' ')[1]?.trim()

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is empty',
      })
    }

    const body = await readBody<CreateArtImagePayload>(event)
    const userId = cleanPositiveId(body.userId)

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing userId',
      })
    }

    await validateUserToken(userId, token)

    const data = buildCreateData({
      ...body,
      userId,
    })

    const artImage = await prisma.artImage.create({
      data,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'ArtImage created.',
      data: artImage,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message,
    }
  }
})
