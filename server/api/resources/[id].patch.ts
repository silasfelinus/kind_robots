// /server/api/resources/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prisma, Resource } from '~/prisma/generated/prisma/client'

type ResourcePatchBody = Partial<Resource> & {
  connectServerIds?: number[]
  disconnectServerIds?: number[]
  connectLoraImageIds?: number[]
  disconnectLoraImageIds?: number[]
}

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    if (Number.isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingResource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        Servers: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
            
          },
        },
      },
    })

    if (!existingResource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    const isOwner = existingResource.userId === user.id
    const isAdmin = user.Role === 'ADMIN' || user.id === 1

    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resource.',
      })
    }

    const body = await readBody<ResourcePatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const connectServerIds = normalizeIdArray(body.connectServerIds)
    const disconnectServerIds = normalizeIdArray(body.disconnectServerIds)
    const connectLoraImageIds = normalizeIdArray(body.connectLoraImageIds)
    const disconnectLoraImageIds = normalizeIdArray(body.disconnectLoraImageIds)

    if (connectServerIds.length) {
      const foundServers = await prisma.server.findMany({
        where: { id: { in: connectServerIds } },
        select: { id: true },
      })
      const foundServerIds = new Set(foundServers.map((s) => s.id))
      const missingServerIds = connectServerIds.filter(
        (id) => !foundServerIds.has(id),
      )
      if (missingServerIds.length) {
        throw createError({
          statusCode: 404,
          message: `Server IDs not found: ${missingServerIds.join(', ')}.`,
        })
      }
    }

    // Strip all relation fields and connection arrays from scalar fields
    const {
      connectServerIds: _css,
      disconnectServerIds: _dss,
      connectLoraImageIds: _cli,
      disconnectLoraImageIds: _dli,
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ArtImages: _ArtImages,
      UsedInImages: _UsedInImages,
      Reactions: _Reactions,
      ArtImage: _ArtImage,
      User: _User,
      Servers: _Servers,
      ...resourceFields
    } = body as ResourcePatchBody & {
      ArtImages?: unknown
      UsedInImages?: unknown
      Reactions?: unknown
      ArtImage?: unknown
      User?: unknown
      Servers?: unknown
    }

    const updateData: Prisma.ResourceUpdateInput = {
      name: resourceFields.name,
      customLabel: resourceFields.customLabel,
      MediaPath: resourceFields.MediaPath,
      customUrl: resourceFields.customUrl,
      civitaiUrl: resourceFields.civitaiUrl,
      huggingUrl: resourceFields.huggingUrl,
      localPath: resourceFields.localPath,
      imagePath: resourceFields.imagePath,
      description: resourceFields.description,
      isMature: resourceFields.isMature,
      resourceType: resourceFields.resourceType,
      generation: resourceFields.generation,
      supportedServer: resourceFields.supportedServer,
      isPublic: resourceFields.isPublic,
      isActive: resourceFields.isActive,
      artPrompt: resourceFields.artPrompt,
      User:
        typeof resourceFields.userId === 'number'
          ? { connect: { id: resourceFields.userId } }
          : undefined,
      ArtImage:
        typeof resourceFields.artImageId === 'number'
          ? { connect: { id: resourceFields.artImageId } }
          : resourceFields.artImageId === null
            ? { disconnect: true }
            : undefined,
      Servers:
        connectServerIds.length || disconnectServerIds.length
          ? {
              connect: connectServerIds.map((id) => ({ id })),
              disconnect: disconnectServerIds.map((id) => ({ id })),
            }
          : undefined,
      // M2M: LoRA usage in images
      UsedInImages:
        connectLoraImageIds.length || disconnectLoraImageIds.length
          ? {
              connect: connectLoraImageIds.map((id) => ({ id })),
              disconnect: disconnectLoraImageIds.map((id) => ({ id })),
            }
          : undefined,
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid update fields provided.',
      })
    }

    const data = await prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
      include: {
        Server: {
  select: {
    id: true,
    title: true,
    label: true,
    serverType: true,
    model: true,
    isActive: true,
  },
},
        ArtImage: {
          select: { id: true, imagePath: true, fileName: true },
        },
        UsedInImages: {
          select: { id: true, fileName: true },
        },
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Resource with ID ${resourceId} updated successfully.`,
      data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || `Failed to update resource with ID ${resourceId}.`,
      data: null,
    }
  }
})
