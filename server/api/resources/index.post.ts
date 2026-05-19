// /server/api/resources/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'
import type {
  Prisma,
  Resource,
  ResourceType,
  SupportedServer,
} from '~/prisma/generated/prisma/client'

type ResourceConnectionsInput = {
  serverIds?: number[]
  artImageId?: number | null
  artImageIdsAsCheckpoint?: number[]
}

type ResourcePostBody = Partial<Resource> & {
  serverIds?: number[]
  connections?: ResourceConnectionsInput
}

type NormalizedResourcePostBody = ResourcePostBody & {
  name: string
}

type SavedResource = Prisma.ResourceGetPayload<{
  include: {
    Servers: true
    ArtImage: true
    ArtImages: true
  }
}>

type ResourceSaveResult = {
  success: boolean
  message: string
  data: SavedResource | null
  input?: ResourcePostBody
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => Number.isInteger(entry))
}

function isOptionalNumberArray(value: unknown): value is number[] | undefined {
  return value === undefined || isNumberArray(value)
}

function isOptionalNumberOrNull(
  value: unknown,
): value is number | null | undefined {
  return value === undefined || value === null || Number.isInteger(value)
}

function normalizeConnections(
  resourceData: ResourcePostBody,
): ResourceConnectionsInput {
  const connections = resourceData.connections ?? {}

  const normalized: ResourceConnectionsInput = {
    ...connections,
    serverIds: connections.serverIds ?? resourceData.serverIds,
    artImageId: connections.artImageId ?? resourceData.artImageId,
    artImageIdsAsCheckpoint: connections.artImageIdsAsCheckpoint,
  }

  if (!isOptionalNumberArray(normalized.serverIds)) {
    throw createError({
      statusCode: 400,
      message: '"serverIds" must be an array of server IDs.',
    })
  }

  if (!isOptionalNumberOrNull(normalized.artImageId)) {
    throw createError({
      statusCode: 400,
      message: '"artImageId" must be a number or null.',
    })
  }

  if (!isOptionalNumberArray(normalized.artImageIdsAsCheckpoint)) {
    throw createError({
      statusCode: 400,
      message: '"artImageIdsAsCheckpoint" must be an array of art image IDs.',
    })
  }

  return normalized
}

function normalizeResourceInput(input: unknown): NormalizedResourcePostBody {
  if (!isRecord(input)) {
    throw createError({
      statusCode: 400,
      message: 'Each resource must be an object.',
    })
  }

  const resourceData = input as ResourcePostBody

  if (!resourceData.name || typeof resourceData.name !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"name" is a required field and must be a string.',
    })
  }

  normalizeConnections(resourceData)

  return {
    ...resourceData,
    name: resourceData.name,
  }
}

function toResourceCreateInput(
  resourceData: NormalizedResourcePostBody,
  authenticatedUserId: number,
): Prisma.ResourceCreateInput {
  const connections = normalizeConnections(resourceData)

  const {
    id,
    createdAt,
    updatedAt,
    userId,
    artImageId,
    serverIds,
    connections: ignoredConnections,
    name,
    resourceType,
    supportedServer,
    ...resourceInput
  } = resourceData

  return {
    ...resourceInput,
    name,
    resourceType: (resourceType as ResourceType | undefined) ?? 'EMBEDDING',
    supportedServer:
      (supportedServer as SupportedServer | undefined) ?? 'UNKNOWN',
    User: {
      connect: {
        id: authenticatedUserId,
      },
    },
    Servers: connections.serverIds?.length
      ? {
          connect: connections.serverIds.map((serverId) => ({
            id: serverId,
          })),
        }
      : undefined,
    ArtImage: connections.artImageId
      ? {
          connect: {
            id: connections.artImageId,
          },
        }
      : undefined,
    ArtImages: connections.artImageIdsAsCheckpoint?.length
      ? {
          connect: connections.artImageIdsAsCheckpoint.map((artImageId) => ({
            id: artImageId,
          })),
        }
      : undefined,
  }
}

function toResourceUpdateInput(
  resourceData: NormalizedResourcePostBody,
  authenticatedUserId: number,
): Prisma.ResourceUpdateInput {
  const connections = normalizeConnections(resourceData)

  const {
    id,
    createdAt,
    updatedAt,
    userId,
    artImageId,
    serverIds,
    connections: ignoredConnections,
    name,
    resourceType,
    supportedServer,
    ...resourceInput
  } = resourceData

  return {
    ...resourceInput,
    resourceType: (resourceType as ResourceType | undefined) ?? undefined,
    supportedServer:
      (supportedServer as SupportedServer | undefined) ?? undefined,
    User: {
      connect: {
        id: authenticatedUserId,
      },
    },
    Servers: connections.serverIds
      ? {
          set: connections.serverIds.map((serverId) => ({
            id: serverId,
          })),
        }
      : undefined,
    ArtImage:
      connections.artImageId === undefined
        ? undefined
        : connections.artImageId === null
          ? {
              disconnect: true,
            }
          : {
              connect: {
                id: connections.artImageId,
              },
            },
    ArtImages: connections.artImageIdsAsCheckpoint
      ? {
          set: connections.artImageIdsAsCheckpoint.map((artImageId) => ({
            id: artImageId,
          })),
        }
      : undefined,
  }
}

async function saveResource(
  resourceData: NormalizedResourcePostBody,
  authenticatedUserId: number,
): Promise<SavedResource> {
  return await prisma.resource.upsert({
    where: {
      name: resourceData.name,
    },
    create: toResourceCreateInput(resourceData, authenticatedUserId),
    update: toResourceUpdateInput(resourceData, authenticatedUserId),
    include: {
      Servers: true,
      ArtImage: true,
      ArtImages: true,
    },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      event.node.res.statusCode = 401

      return {
        success: false,
        message: 'Invalid or expired token.',
        data: null,
      }
    }

    const authenticatedUserId = user.id
    const body = await readBody<unknown>(event)
    const resourceInputs = Array.isArray(body) ? body : [body]

    if (!resourceInputs.length) {
      throw createError({
        statusCode: 400,
        message: 'Request body must include at least one resource.',
      })
    }

    const results: ResourceSaveResult[] = []

    for (const input of resourceInputs) {
      try {
        const resourceData = normalizeResourceInput(input)
        const data = await saveResource(resourceData, authenticatedUserId)

        results.push({
          success: true,
          message: 'Resource saved successfully.',
          data,
        })
      } catch (error) {
        const { message } = errorHandler(error)

        results.push({
          success: false,
          message: message || 'Failed to save resource.',
          data: null,
          input: isRecord(input) ? (input as ResourcePostBody) : undefined,
        })
      }
    }

    const isBatch = Array.isArray(body)
    const failed = results.filter((result) => !result.success)
    const succeeded = results.filter((result) => result.success)

    if (failed.length && succeeded.length) {
      event.node.res.statusCode = 207

      return {
        success: false,
        message: `Saved ${succeeded.length} resource(s), but ${failed.length} failed.`,
        data: results,
      }
    }

    if (failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `Failed to save ${failed.length} resource(s).`,
        data: results,
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      message: isBatch
        ? `Saved ${succeeded.length} resource(s) successfully.`
        : 'Resource saved successfully.',
      data: isBatch ? results : results[0]?.data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to save resource.',
      data: null,
    }
  }
})
