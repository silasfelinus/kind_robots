// /server/api/art/image/[id].get.ts
import { defineEventHandler, createError, getQuery, type H3Event } from 'h3'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

type QueryValue = string | number | boolean | null | undefined | QueryValue[]

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
  showMature?: boolean | null
}

type AccessContext = {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
  isAuthenticated: boolean
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (Array.isArray(value)) return readBoolean(value[0], fallback)
  if (value == null) return fallback

  const normalized = String(value).trim().toLowerCase()

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false

  return fallback
}

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function getAccessContext(event: H3Event): Promise<AccessContext> {
  const query = getQuery(event) as Record<string, QueryValue>

  try {
    const auth = await validateApiKey(event)
    const user = auth.user as ValidatedUser | null | undefined
    const isAuthenticated =
      Boolean(auth.isValid) && typeof user?.id === 'number'

    const requestedMature = readBoolean(
      query.showMature ?? query.includeMature ?? query.mature,
      false,
    )

    const showMature = isAuthenticated
      ? requestedMature || Boolean(user?.showMature)
      : false

    return {
      userId: isAuthenticated ? Number(user?.id) : null,
      isAdmin: isAuthenticated && isAdminUser(user),
      showMature,
      isAuthenticated,
    }
  } catch {
    return {
      userId: null,
      isAdmin: false,
      showMature: false,
      isAuthenticated: false,
    }
  }
}

function canReadArtImage(
  image: Pick<ArtImage, 'userId' | 'isPublic' | 'isMature'>,
  access: AccessContext,
): boolean {
  if (!access.showMature && image.isMature) return false
  if (access.isAdmin) return true
  if (image.isPublic) return true

  if (
    access.isAuthenticated &&
    access.userId &&
    image.userId === access.userId
  ) {
    return true
  }

  return false
}

function buildArtImageSelect(
  query: Record<string, QueryValue>,
): Prisma.ArtImageSelect {
  const includeImageData = readBoolean(query.includeImageData, false)
  const includeThumbnailData = readBoolean(query.includeThumbnailData, false)
  const includeTags = readBoolean(query.includeTags, false)

  return {
    id: true,
    createdAt: true,
    updatedAt: true,
    galleryId: true,
    userId: true,
    fileName: true,
    fileType: true,
    imagePath: true,
    rarity: true,
    path: true,
    promptString: true,
    negativePrompt: true,
    checkpoint: true,
    checkpointResourceId: true,
    sampler: true,
    seed: true,
    steps: true,
    cfg: true,
    cfgHalf: true,
    designer: true,
    genres: true,
    isPublic: true,
    isMature: true,
    serverId: true,
    serverName: true,
    serverUrl: true,
    artId: true,
    botId: true,
    componentId: true,
    milestoneId: true,
    pitchId: true,
    promptId: true,
    resourceId: true,
    rewardId: true,
    chatId: true,
    characterId: true,
    butterflyId: true,
    imageData: includeImageData,
    thumbnailData: includeThumbnailData,
    Tags: includeTags
      ? {
          select: {
            id: true,
            label: true,
            title: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        }
      : false,
    TagOwner: includeTags
      ? {
          select: {
            id: true,
            label: true,
            title: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        }
      : false,
  }
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ArtImage ID. It must be a positive integer.',
      })
    }

    const query = getQuery(event) as Record<string, QueryValue>
    const access = await getAccessContext(event)
    const select = buildArtImageSelect(query)

    const data = await prisma.artImage.findUnique({
      where: { id },
      select,
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `ArtImage #${id} not found.`,
      })
    }

    if (!canReadArtImage(data, access)) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to view this art image.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${id} retrieved successfully.`,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch ArtImage #${id}.`,
      data: null,
    }
  }
})
