// /server/api/openai/images/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from './../../../../utils/error'
import { saveImage } from '../../../../utils/saveImage'
import { manaGate } from '../../../../utils/manaGate'
import { estimateArtCostUsd } from '../../../../utils/manaCost'
import {
  type RequestData,
  validateAndLoadArtCollectionId,
  validateAndLoadDesignerName,
  validateAndLoadPitchId,
  validateAndLoadPromptId,
  validateAndLoadUserId,
} from '../../../art'

type OpenAiImageGenerateRequest = RequestData & {
  prompt?: string | null
  model?: string | null
  size?: string | null
  quality?: string | null
  background?: string | null
  outputFormat?: string | null
  serverId?: number | null
  serverName?: string | null
}

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string
    revised_prompt?: string
  }>
  error?: {
    message?: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    const requestData = await readBody<OpenAiImageGenerateRequest>(event)

    const prompt =
      requestData.prompt?.trim() || requestData.promptString?.trim()

    if (!prompt) {
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

    const model = requestData.model || 'gpt-image-2'
    const size = requestData.size || '1024x1024'
    const imageSize = parseImageSize(size)

    const gate = await manaGate(event, {
      kind: 'art',
      estCostUsd: estimateArtCostUsd({
        engine: 'openai',
        steps: requestData.steps,
        width: imageSize.width,
        height: imageSize.height,
      }),
      serverId: requestData.serverId ?? null,
    })

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'OPENAI_API_KEY is not configured.',
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

    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          size,
          quality: requestData.quality || 'auto',
          background: requestData.background || 'auto',
          output_format: requestData.outputFormat || 'png',
        }),
      },
    )

    const responseData = (await response.json()) as OpenAiImageResponse

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          responseData.error?.message ||
          `OpenAI Images failed: ${response.status} ${response.statusText}`,
      })
    }

    const imageBase64 = responseData.data?.[0]?.b64_json

    if (!imageBase64) {
      throw createError({
        statusCode: 502,
        message: 'OpenAI Images returned no base64 image data.',
      })
    }

    const savedImage = await saveImage(
      imageBase64,
      validatedData.userId ?? user.id,
    )

    if (!savedImage.id) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated OpenAI image.',
      })
    }

    const updatedImage = await prisma.artImage.update({
      where: {
        id: savedImage.id,
      },
      data: {
        path: savedImage.fileName,
        imagePath: savedImage.fileName,
        fileName: savedImage.fileName,
        fileType: 'png',
        cfg: requestData.cfg ?? null,
        cfgHalf: requestData.cfgHalf ?? false,
        checkpoint: model,
        sampler: 'openai-images',
        seed: requestData.seed ?? -1,
        steps: requestData.steps ?? null,
        designer: validatedData.designer ?? null,
        promptString: prompt,
        artPrompt: prompt,
        negativePrompt: requestData.negativePrompt ?? null,
        isPublic: requestData.isPublic ?? true,
        isMature: requestData.isMature ?? false,
        userId: validatedData.userId ?? user.id,
        serverId: requestData.serverId ?? null,
        serverName: requestData.serverName || 'OpenAI Images',
        serverUrl: 'https://api.openai.com/v1/images/generations',
        Pitches: validatedData.pitchId
          ? {
              connect: {
                id: validatedData.pitchId,
              },
            }
          : undefined,
        Prompts: validatedData.promptId
          ? {
              connect: {
                id: validatedData.promptId,
              },
            }
          : undefined,
        ArtCollections: validatedData.artCollectionId
          ? {
              connect: {
                id: validatedData.artCollectionId,
              },
            }
          : undefined,
      },
    })

    const { balance } = await gate.commit(`openai-image:${updatedImage.id}`)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'OpenAI image generated successfully.',
      data: updatedImage,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate OpenAI image.',
    }
  }
})

function parseImageSize(size: string): { width: number; height: number } {
  const [rawWidth, rawHeight] = size.split('x')
  const width = Number(rawWidth)
  const height = Number(rawHeight)

  return {
    width: Number.isFinite(width) ? width : 1024,
    height: Number.isFinite(height) ? height : 1024,
  }
}
