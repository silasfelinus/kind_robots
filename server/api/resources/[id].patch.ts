// /server/api/resources/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { normalizeSlugInput } from '~/utils/slugify'
import { validateApiKey } from '../../utils/validateKey'
import { resourceMutationSelect } from './selects'
import type { Prisma, Resource } from '~/prisma/generated/prisma/client'

type ResourcePatchBody = Partial<Resource> & {
  connectServerIds?: number[]
  disconnectServerIds?: number[]
  connectLoraImageIds?: number[]
  disconnectLoraImageIds?: number[]
}

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
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
      select: { userId: true },
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

    if (typeof body.userId === 'number' && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Only admins can reassign Resource ownership.',
      })
    }

    const connectServerIds = normalizeIdArray(body.connectServerIds)
    const disconnectServerIds = normalizeIdArray(body.disconnectServerIds)
    const connectLoraImageIds = normalizeIdArray(body.connectLoraImageIds)
    const disconnectLoraImageIds = normalizeIdArray(body.disconnectLoraImageIds)

    const [foundServers, foundLoraImages] = await Promise.all([
      connectServerIds.length
        ? prisma.server.findMany({
            where: { id: { in: connectServerIds } },
            select: { id: true },
          })
        : [],
      connectLoraImageIds.length
        ? prisma.artImage.findMany({
            where: { id: { in: connectLoraImageIds } },
            select: { id: true },
          })
        : [],
    ])

    const foundServerIds = new Set(foundServers.map((server) => server.id))
    const missingServerIds = connectServerIds.filter(
      (id) => !foundServerIds.has(id),
    )

    if (missingServerIds.length) {
      throw createError({
        statusCode: 404,
        message: `Server IDs not found: ${missingServerIds.join(', ')}.`,
      })
    }

    const foundLoraImageIds = new Set(
      foundLoraImages.map((artImage) => artImage.id),
    )
    const missingLoraImageIds = connectLoraImageIds.filter(
      (id) => !foundLoraImageIds.has(id),
    )

    if (missingLoraImageIds.length) {
      throw createError({
        statusCode: 404,
        message: `LoRA ArtImage IDs not found: ${missingLoraImageIds.join(', ')}.`,
      })
    }

    const {
      connectServerIds: _connectServerIds,
      disconnectServerIds: _disconnectServerIds,
      connectLoraImageIds: _connectLoraImageIds,
      disconnectLoraImageIds: _disconnectLoraImageIds,
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...resourceFields
    } = body

    const updateData: Prisma.ResourceUpdateInput = {
      name: resourceFields.name,
      slug:
        resourceFields.slug !== undefined
          ? normalizeSlugInput(resourceFields.slug)
          : undefined,
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
      select: resourceMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Resource with ID ${resourceId} updated successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update resource with ID ${resourceId}.`,
      data: null,
      statusCode,
    }
  }
})
