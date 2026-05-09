// /server/api/art/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import prisma from '../../utils/prisma'
import type { Art, Prisma } from '~/prisma/generated/prisma/client'
import {
  resolveCheckpointResource,
  type CheckpointResourceRequestData,
} from './utils/checkpointResource'

type ArtCreateRequestData = Partial<Art> &
  CheckpointResourceRequestData & {
    resourceId?: number | null
  }

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const artData = await readBody<ArtCreateRequestData>(event)

    if (!artData.promptString?.trim()) {
      throw createError({
        statusCode: 400,
        message: '"promptString" is a required field.',
      })
    }

    const server = artData.serverId
      ? await prisma.server.findFirst({
          where: {
            id: artData.serverId,
            OR: [{ userId: authenticatedUserId }, { isPublic: true }],
          },
        })
      : null

    if (artData.serverId && !server) {
      throw createError({
        statusCode: 404,
        message: `Server ${artData.serverId} was not found or is not available to this user.`,
      })
    }

    const resolvedCheckpoint = await resolveCheckpointResource({
      requestData: artData,
      server,
    })

    const createData: Prisma.ArtUncheckedCreateInput = {
      path: artData.path ?? 'UNDEFINED',
      checkpoint:
        resolvedCheckpoint.checkpoint ??
        artData.checkpoint ??
        server?.model ??
        null,
      checkpointResourceId: resolvedCheckpoint.checkpointResourceId,
      sampler: artData.sampler ?? null,
      seed: artData.seed ?? -1,
      steps: artData.steps ?? null,
      designer: artData.designer ?? null,
      isPublic: artData.isPublic ?? false,
      isMature: artData.isMature ?? false,
      promptId: artData.promptId ?? null,
      userId: authenticatedUserId,
      pitchId: artData.pitchId ?? null,
      galleryId: artData.galleryId ?? 21,
      promptString: artData.promptString.trim(),
      cfg: artData.cfg ?? 3,
      cfgHalf: artData.cfgHalf ?? false,
      serverId: server?.id ?? artData.serverId ?? null,
      serverName: artData.serverName ?? server?.title ?? null,
      serverUrl: artData.serverUrl ?? null,
      artImageId: artData.artImageId ?? null,
      imagePath: artData.imagePath ?? null,
      genres: artData.genres ?? null,
      negativePrompt: artData.negativePrompt ?? null,
    }

    const data = await prisma.art.create({
      data: createData,
      include: {
        CheckpointResource: true,
        Server: true,
        ArtImage: true,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Art created successfully',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: 'Failed to create a new art object',
      error: message || 'An unknown error occurred',
    }
  }
})
