// /server/api/art/image/legacy.post.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

type LegacyArtImagePayload = {
  artId?: number | null
  userId?: number | null
  galleryId?: number | null
  artCollectionId?: number | null
  artCollectionIds?: number[]
  tagIds?: number[]
  dreamIds?: number[]
  scenarioIds?: number[]
  butterflyIds?: number[]
  reactionIds?: number[]
  imagePath?: string | null
  imageData?: string | null
  fileName?: string | null
  fileType?: string | null
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
  serverId?: number | null
  serverName?: string | null
  serverUrl?: string | null
  pitchId?: number | null
  promptId?: number | null
  rarity?: number | null
  isPublic?: boolean | null
  isMature?: boolean | null
  isActive?: boolean | null
}

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
}

type LegacyAccess = {
  userId: number | null
  isAdmin: boolean
  isServer: boolean
}

type SourceArtWithRelations = Prisma.ArtGetPayload<{
  include: {
    ArtCollection: {
      select: {
        id: true
      }
    }
    Tags: {
      select: {
        id: true
      }
    }
    Dreams: {
      select: {
        id: true
      }
    }
    Butterflies: {
      select: {
        id: true
      }
    }
    Reaction: {
      select: {
        id: true
      }
    }
  }
}>

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

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function requireLegacyAccess(event: H3Event): Promise<LegacyAccess> {
  const auth = await validateApiKey(event)
  const user = auth.user as ValidatedUser | null | undefined

  if (!auth.isValid) {
    throw createError({
      statusCode: 401,
      message: 'Valid authorization token required.',
    })
  }

  if (auth.kind === 'server') {
    return {
      userId: null,
      isAdmin: true,
      isServer: true,
    }
  }

  if (typeof user?.id !== 'number') {
    throw createError({
      statusCode: 401,
      message: 'Valid user authorization token required.',
    })
  }

  return {
    userId: Number(user.id),
    isAdmin: isAdminUser(user),
    isServer: false,
  }
}

function assertCanPromoteForUser(params: {
  access: LegacyAccess
  sourceUserId: number
}) {
  const { access, sourceUserId } = params

  if (access.isServer || access.isAdmin) return

  if (access.userId !== sourceUserId) {
    throw createError({
      statusCode: 403,
      message: 'You are not allowed to promote this Art record.',
    })
  }
}

function getFallbackFileName(imagePath: string): string {
  const cleanPath = imagePath.split('?')[0] || ''
  const fileName = cleanPath.split('/').filter(Boolean).at(-1)

  return fileName || `legacy-art-${Date.now()}.png`
}

function getFallbackFileType(imagePath: string): string {
  const extension = imagePath.split('?')[0]?.split('.').pop()?.toLowerCase()

  if (extension === 'jpg') return 'jpeg'
  if (extension === 'jpeg') return 'jpeg'
  if (extension === 'webp') return 'webp'
  if (extension === 'gif') return 'gif'
  if (extension === 'avif') return 'avif'

  return 'png'
}

async function getSourceArt(
  artId: number | null,
): Promise<SourceArtWithRelations | null> {
  if (!artId) return null

  return await prisma.art.findUnique({
    where: {
      id: artId,
    },
    include: {
      ArtCollection: {
        select: {
          id: true,
        },
      },
      Tags: {
        select: {
          id: true,
        },
      },
      Dreams: {
        select: {
          id: true,
        },
      },
      Butterflies: {
        select: {
          id: true,
        },
      },
      Reaction: {
        select: {
          id: true,
        },
      },
    },
  })
}

function getRelationIds(
  body: LegacyArtImagePayload,
  sourceArt: SourceArtWithRelations | null,
) {
  const artCollectionIds = cleanPositiveIds([
    body.artCollectionId,
    ...(body.artCollectionIds || []),
    ...(sourceArt?.ArtCollection?.map((collection) => collection.id) || []),
  ])

  const tagIds = cleanPositiveIds([
    ...(body.tagIds || []),
    ...(sourceArt?.Tags?.map((tag) => tag.id) || []),
  ])

  const dreamIds = cleanPositiveIds([
    ...(body.dreamIds || []),
    ...(sourceArt?.Dreams?.map((dream) => dream.id) || []),
  ])

  const butterflyIds = cleanPositiveIds([
    ...(body.butterflyIds || []),
    ...(sourceArt?.Butterflies?.map((butterfly) => butterfly.id) || []),
  ])

  const reactionIds = cleanPositiveIds([
    ...(body.reactionIds || []),
    ...(sourceArt?.Reaction?.map((reaction) => reaction.id) || []),
  ])

  const scenarioIds = cleanPositiveIds(body.scenarioIds || [])

  return {
    artCollectionIds,
    tagIds,
    dreamIds,
    butterflyIds,
    reactionIds,
    scenarioIds,
  }
}

function buildCreateData(params: {
  body: LegacyArtImagePayload
  sourceArt: SourceArtWithRelations | null
  artId: number | null
  userId: number
  imagePath: string
}): Prisma.ArtImageCreateInput {
  const { body, sourceArt, artId, userId, imagePath } = params
  const relationIds = getRelationIds(body, sourceArt)

  const fileName = cleanText(body.fileName) || getFallbackFileName(imagePath)
  const fileType = cleanText(body.fileType) || getFallbackFileType(imagePath)

  return {
    imageData: cleanText(body.imageData) || '',
    imagePath,
    fileName,
    fileType,
    artPrompt: cleanText(body.artPrompt),
    rarity: cleanNumber(body.rarity),

    path: cleanText(body.path) || cleanText(sourceArt?.path),
    promptString:
      cleanText(body.promptString) || cleanText(sourceArt?.promptString),
    negativePrompt:
      cleanText(body.negativePrompt) || cleanText(sourceArt?.negativePrompt),
    checkpoint: cleanText(body.checkpoint) || cleanText(sourceArt?.checkpoint),
    sampler: cleanText(body.sampler) || cleanText(sourceArt?.sampler),
    seed: cleanNumber(body.seed ?? sourceArt?.seed),
    steps: cleanNumber(body.steps ?? sourceArt?.steps),
    cfg: cleanNumber(body.cfg ?? sourceArt?.cfg),
    cfgHalf: cleanBoolean(body.cfgHalf ?? sourceArt?.cfgHalf),
    designer: cleanText(body.designer) || cleanText(sourceArt?.designer),
    genres: cleanText(body.genres) || cleanText(sourceArt?.genres),

    isPublic: cleanBoolean(body.isPublic ?? sourceArt?.isPublic),
    isMature: cleanBoolean(body.isMature ?? sourceArt?.isMature),
    isActive: body.isActive ?? sourceArt?.isActive ?? true,

    serverName: cleanText(body.serverName) || cleanText(sourceArt?.serverName),
    serverUrl: cleanText(body.serverUrl) || cleanText(sourceArt?.serverUrl),

    User: connectById(userId),
    Gallery: connectById(body.galleryId ?? sourceArt?.galleryId),
    Server: connectById(body.serverId ?? sourceArt?.serverId),
    CheckpointResource: connectById(
      body.checkpointResourceId ?? sourceArt?.checkpointResourceId,
    ),
    Art: connectById(artId),
    Pitch: connectById(body.pitchId ?? sourceArt?.pitchId),
    Prompt: connectById(body.promptId ?? sourceArt?.promptId),

    ArtCollections: connectMany(relationIds.artCollectionIds),
    Tags: connectMany(relationIds.tagIds),
    Dreams: connectMany(relationIds.dreamIds),
    Scenarios: connectMany(relationIds.scenarioIds),
    Butterflies: connectMany(relationIds.butterflyIds),
    Reactions: connectMany(relationIds.reactionIds),
  }
}

export default defineEventHandler(async (event) => {
  try {
    const access = await requireLegacyAccess(event)
    const body = await readBody<LegacyArtImagePayload>(event)
    const artId = cleanPositiveId(body.artId)
    const sourceArt = await getSourceArt(artId)

    legacyLog('received promotion request', {
      artId,
      bodyArtCollectionId: body.artCollectionId ?? null,
      bodyArtCollectionIds: body.artCollectionIds ?? [],
      bodyUserId: body.userId ?? null,
      bodyGalleryId: body.galleryId ?? null,
      bodyImagePath: body.imagePath ?? null,
      bodyPath: body.path ?? null,
    })

    legacyLog('source art lookup result', {
      found: Boolean(sourceArt),
      sourceArtId: sourceArt?.id ?? null,
      sourceUserId: sourceArt?.userId ?? null,
      sourceGalleryId: sourceArt?.galleryId ?? null,
      sourceArtImageId: sourceArt?.artImageId ?? null,
      sourceCollectionCount: sourceArt?.ArtCollection?.length ?? 0,
      sourceCollectionIds:
        sourceArt?.ArtCollection?.map((collection) => collection.id) ?? [],
    })

    if (artId && !sourceArt) {
      throw createError({
        statusCode: 404,
        message: `Art #${artId} was not found`,
      })
    }

    const userId = cleanPositiveId(body.userId ?? sourceArt?.userId)

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing userId',
      })
    }

    assertCanPromoteForUser({
      access,
      sourceUserId: userId,
    })

    const existingImage = artId
      ? await prisma.artImage.findFirst({
          where: {
            artId,
          },
          select: {
            id: true,
          },
        })
      : null

    if (existingImage) {
      throw createError({
        statusCode: 409,
        message: `Art #${artId} is already linked to ArtImage #${existingImage.id}`,
      })
    }

    const existingForwardLink =
      artId && sourceArt?.artImageId
        ? await prisma.artImage.findUnique({
            where: {
              id: sourceArt.artImageId,
            },
            select: {
              id: true,
            },
          })
        : null

    if (existingForwardLink) {
      throw createError({
        statusCode: 409,
        message: `Art #${artId} already points to ArtImage #${existingForwardLink.id}`,
      })
    }

    const imagePath =
      cleanText(body.imagePath) ||
      cleanText(sourceArt?.imagePath) ||
      cleanText(body.path) ||
      cleanText(sourceArt?.path)

    if (!imagePath) {
      throw createError({
        statusCode: 400,
        message: 'imagePath or path is required',
      })
    }

    const created = await prisma.$transaction(async (tx) => {
      const data = buildCreateData({
        body,
        sourceArt,
        artId,
        userId,
        imagePath,
      })

      const relationIds = getRelationIds(body, sourceArt)

      legacyLog('resolved relation ids before create', {
        artId,
        artCollectionIds: relationIds.artCollectionIds,
        tagIds: relationIds.tagIds,
        dreamIds: relationIds.dreamIds,
        butterflyIds: relationIds.butterflyIds,
        reactionIds: relationIds.reactionIds,
        scenarioIds: relationIds.scenarioIds,
      })

      const artImage = await tx.artImage.create({
        data,
        include: {
          ArtCollections: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      })

      legacyLog('created art image', {
        artImageId: artImage.id,
        artId: artImage.artId,
        artCollectionCount: artImage.ArtCollections.length,
        artCollections: artImage.ArtCollections.map((collection) => ({
          id: collection.id,
          label: collection.label,
        })),
      })

      if (artId) {
        await tx.art.update({
          where: {
            id: artId,
          },
          data: {
            artImageId: artImage.id,
          },
        })
      }

      return artImage
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Legacy Art promoted to ArtImage',
      data: created,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message,
      data: null,
    }
  }
})

function legacyLog(message: string, payload?: unknown): void {
  if (payload === undefined) {
    console.info(`[legacy-art-image] ${message}`)
    return
  }

  console.info(
    `[legacy-art-image] ${message}`,
    JSON.stringify(payload, null, 2),
  )
}
