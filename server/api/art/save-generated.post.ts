// /server/api/art/save-generated.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { saveImage } from '../../utils/saveImage'
import {
  type RequestData,
  validateAndLoadArtCollectionId,
  validateAndLoadDesignerName,
  validateAndLoadPitchId,
  validateAndLoadPromptId,
  validateAndLoadUserId,
} from '.'
import { getServerEndpoint, resolveServer } from '../../utils/serverResolver'
import {
  resolveCheckpointResource,
  type CheckpointResourceRequestData,
} from './utils/checkpointResource'

type SaveGeneratedRequestData = RequestData &
  CheckpointResourceRequestData & {
    imageBase64: string
    serverId?: number | null
    serverName?: string | null
  }

export default defineEventHandler(async (event) => {
  try {
    const requestData: SaveGeneratedRequestData = await readBody(event)

    if (!requestData.imageBase64?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "imageBase64".',
      })
    }

    if (!requestData.promptString?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1] ?? ''

    const user = await prisma.user.findFirst({
      where: {
        apiKey: token,
      },
      select: {
        id: true,
        karma: true,
        preferredArtServerId: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired authorization token.',
      })
    }

    if (user.id !== requestData.userId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    const validatedData: Partial<RequestData> = {}

    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )

    validatedData.pitchId = await validateAndLoadPitchId(requestData)

    const requestDataWithPitch = {
      ...requestData,
      pitchId: validatedData.pitchId,
    }

    validatedData.promptId = await validateAndLoadPromptId(
      requestDataWithPitch,
      validatedData,
    )

    validatedData.artCollectionId =
      await validateAndLoadArtCollectionId(requestDataWithPitch)

    validatedData.designer = validateAndLoadDesignerName(requestData)

    const server = await resolveServer({
      userId: user.id,
      serverId: requestData.serverId ?? null,
      serverName: requestData.serverName ?? null,
      capability: 'art',
    })

    if (!server.allowBrowserRequests) {
      throw createError({
        statusCode: 403,
        message: `Server "${server.title}" does not allow browser-generated uploads.`,
      })
    }

    const rawCfg = Number(requestData.cfg)

    const cfgValue = calculateCfg(
      Number.isNaN(rawCfg) ? 3 : rawCfg,
      requestData.cfgHalf ?? false,
    )

    const savedImage = await saveImage(
      requestData.imageBase64,
      requestData.artCollectionLabel ||
        requestData.collectionLabel ||
        requestData.collection ||
        'generated',
      validatedData.userId ?? user.id,
      validatedData.artCollectionId ?? 0,
    )

    if (!savedImage.id) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated image.',
      })
    }

    const resolvedCheckpoint = await resolveCheckpointResource({
      requestData,
      server,
    })

    const updatedImage = await prisma.artImage.update({
      where: {
        id: savedImage.id,
      },
      data: {
        cfg: Math.floor(cfgValue),
        cfgHalf: cfgValue % 1 >= 0.5,
        checkpoint: resolvedCheckpoint.checkpoint,
        checkpointResourceId: resolvedCheckpoint.checkpointResourceId,
        sampler: requestData.sampler ?? null,
        seed: requestData.seed ?? -1,
        steps: requestData.steps ?? 20,
        designer: validatedData.designer ?? null,
        promptString: requestData.promptString.trim(),
        artPrompt: requestData.promptString.trim(),
        negativePrompt: requestData.negativePrompt ?? null,
        isPublic: requestData.isPublic ?? true,
        isMature: requestData.isMature ?? false,
        userId: validatedData.userId,
        promptId: validatedData.promptId ?? null,
        pitchId: validatedData.pitchId ?? null,
        serverId: server.id,
        serverName: server.title,
        serverUrl: getServerEndpoint(server),
        ArtCollections: validatedData.artCollectionId
          ? {
              connect: {
                id: validatedData.artCollectionId,
              },
            }
          : undefined,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Browser-generated ArtImage saved successfully.',
      data: updatedImage,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to save generated art image.',
    }
  }
})

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}
