// /server/api/resources/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type {
  Prisma,
  Resource,
  ResourceType,
  SupportedServer,
} from '~/prisma/generated/prisma/client'

type ResourceCreateBody = Partial<Resource> & {
  connectServerIds?: number[]
  serverIds?: number[]
  connectLoraImageIds?: number[]
  usedInImageIds?: number[]
}

const resourceTypes: ResourceType[] = [
  'CHECKPOINT',
  'EMBEDDING',
  'LORA',
  'LYCORIS',
  'HYPERNETWORK',
  'SAMPLER',
  'CONTROLNET',
  'URL',
  'API',
]

const supportedServers: SupportedServer[] = [
  'SD15',
  'SDXL',
  'COMFY',
  'FLUX',
  'KONTEXT',
  'GENERIC',
  'UNKNOWN',
  'OPENAI',
]

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  )
}

function normalizeResourceType(value: unknown): ResourceType {
  if (
    typeof value === 'string' &&
    resourceTypes.includes(value as ResourceType)
  ) {
    return value as ResourceType
  }

  return 'EMBEDDING'
}

function normalizeSupportedServer(value: unknown): SupportedServer {
  if (
    typeof value === 'string' &&
    supportedServers.includes(value as SupportedServer)
  ) {
    return value as SupportedServer
  }

  return 'SDXL'
}

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

async function assertRelatedRecordsExist(options: {
  userId?: number
  artImageId?: number
  serverIds: number[]
  loraImageIds: number[]
}) {
  const { userId, artImageId, serverIds, loraImageIds } = options

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: `User ID not found: ${userId}.`,
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

  if (serverIds.length) {
    const servers = await prisma.server.findMany({
      where: { id: { in: serverIds } },
      select: { id: true },
    })

    const foundIds = new Set(servers.map((server) => server.id))
    const missingIds = serverIds.filter((serverId) => !foundIds.has(serverId))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Server IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }

  if (loraImageIds.length) {
    const artImages = await prisma.artImage.findMany({
      where: { id: { in: loraImageIds } },
      select: { id: true },
    })

    const foundIds = new Set(artImages.map((artImage) => artImage.id))
    const missingIds = loraImageIds.filter((imageId) => !foundIds.has(imageId))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `LoRA ArtImage IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }
}

async function buildCreateInput(
  entry: ResourceCreateBody,
  fallbackUserId: number,
  canAssignUserId: boolean,
): Promise<Prisma.ResourceCreateInput> {
  const name = getStringOrUndefined(entry.name)

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'The "name" field is required.',
    })
  }

  const requestedUserId = getPositiveIntegerOrUndefined(entry.userId)
  const userId =
    canAssignUserId && requestedUserId ? requestedUserId : fallbackUserId

  const artImageId = getPositiveIntegerOrUndefined(entry.artImageId)
  const serverIds = normalizeIdArray(entry.connectServerIds || entry.serverIds)
  const loraImageIds = normalizeIdArray(
    entry.connectLoraImageIds || entry.usedInImageIds,
  )

  await assertRelatedRecordsExist({
    userId,
    artImageId,
    serverIds,
    loraImageIds,
  })

  return {
    name,
    customLabel: getStringOrNull(entry.customLabel),
    MediaPath: getStringOrNull(entry.MediaPath),
    customUrl: getStringOrNull(entry.customUrl),
    civitaiUrl: getStringOrNull(entry.civitaiUrl),
    huggingUrl: getStringOrNull(entry.huggingUrl),
    localPath: getStringOrNull(entry.localPath),
    imagePath: getStringOrNull(entry.imagePath),
    description: getStringOrNull(entry.description),
    generation: getStringOrNull(entry.generation),
    artPrompt: getStringOrNull(entry.artPrompt),
    isMature: getBooleanOrDefault(entry.isMature, false),
    isPublic: getBooleanOrDefault(entry.isPublic, false),
    isActive: getBooleanOrDefault(entry.isActive, true),
    resourceType: normalizeResourceType(entry.resourceType),
    supportedServer: normalizeSupportedServer(entry.supportedServer),
    User: {
      connect: { id: userId },
    },
    ArtImage: artImageId
      ? {
          connect: { id: artImageId },
        }
      : undefined,
    Servers: serverIds.length
      ? {
          connect: serverIds.map((serverId) => ({ id: serverId })),
        }
      : undefined,
    UsedInImages: loraImageIds.length
      ? {
          connect: loraImageIds.map((imageId) => ({ id: imageId })),
        }
      : undefined,
  }
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

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const fallbackUserId = user?.id || 1
    const canAssignUserId = isAdmin || isServerKey

    const body = await readBody<ResourceCreateBody | ResourceCreateBody[]>(
      event,
    )

    if (!body || (Array.isArray(body) && body.length === 0)) {
      throw createError({
        statusCode: 400,
        message: 'No resource data provided.',
      })
    }

    if (Array.isArray(body)) {
      const created: Resource[] = []
      const skipped: string[] = []

      for (const entry of body) {
        const data = await buildCreateInput(
          entry,
          fallbackUserId,
          canAssignUserId,
        )

        try {
          const resource = await prisma.resource.create({
            data,
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  Role: true,
                },
              },
              ArtImage: {
                select: {
                  id: true,
                  imagePath: true,
                  fileName: true,
                },
              },
              Servers: {
                select: {
                  id: true,
                  title: true,
                  label: true,
                  serverType: true,
                  generationEngine: true,
                },
              },
              UsedInImages: {
                select: {
                  id: true,
                  fileName: true,
                  imagePath: true,
                },
              },
            },
          })

          created.push(resource)
        } catch (error: any) {
          if (error?.code === 'P2002') {
            skipped.push(data.name)
          } else {
            throw error
          }
        }
      }

      event.node.res.statusCode = 201

      return {
        success: true,
        message: `${created.length} resources created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = await buildCreateInput(body, fallbackUserId, canAssignUserId)

    const resource = await prisma.resource.create({
      data,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
        Servers: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
            generationEngine: true,
          },
        },
        UsedInImages: {
          select: {
            id: true,
            fileName: true,
            imagePath: true,
          },
        },
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Resource created successfully.',
      data: resource,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create resource.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
