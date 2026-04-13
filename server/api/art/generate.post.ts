// /server/api/art/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { saveImage } from '../../utils/saveImage'
import type { Art, Server } from '~/prisma/generated/prisma/client'
import {
  type RequestData,
  validateAndLoadDesignerName,
  validateAndLoadGalleryId,
  validateAndLoadPitchId,
  validateAndLoadPromptId,
  validateAndLoadUserId,
} from '.'
import {
  resolveServer,
  getServerEndpoint,
} from '../../utils/serverResolver'

type ServerAwareRequestData = RequestData & {
  serverId?: number | null
  serverName?: string | null
}

type GenerateImageResponse = {
  images: string[]
  error?: string
}

interface GenerateImageInput {
  server: Server
  prompt: string
  user: string
  cfgValue: number
  negativePrompt?: string
  seed?: number | null
  steps?: number
  checkpoint?: string | null
  sampler?: string | null
}

export default defineEventHandler(async (event) => {
  let imageId: number | null = null
  let newArt: Art | null = null

  try {
    const requestData: ServerAwareRequestData = await readBody(event)

    if (!requestData.promptString?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    const authorizationHeader = event.node.req.headers.authorization
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
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
        message: 'User ID in the request does not match the authenticated user.',
      })
    }

    if (user.karma <= 0) {
      throw createError({
        statusCode: 403,
        message: 'Insufficient karma to generate an image.',
      })
    }

    const validatedData: Partial<RequestData> = {}
    validatedData.userId = await validateAndLoadUserId(requestData, validatedData)
    validatedData.promptId = await validateAndLoadPromptId(
      requestData,
      validatedData,
    )
    validatedData.pitchId = await validateAndLoadPitchId(requestData)
    validatedData.galleryId = await validateAndLoadGalleryId(requestData)
    validatedData.designer = validateAndLoadDesignerName(requestData)

    const rawCfg = Number(requestData.cfg)
    const cfgValue = calculateCfg(
      Number.isNaN(rawCfg) ? 3 : rawCfg,
      requestData.cfgHalf ?? false,
    )

    const server = await resolveServer({
      userId: user.id,
      serverId: requestData.serverId ?? null,
      serverName: requestData.serverName ?? null,
      capability: 'art',
    })

    const response = await generateImage({
      server,
      prompt: requestData.promptString.trim(),
      user: validatedData.designer || 'kindguest',
      cfgValue,
      negativePrompt: requestData.negativePrompt || '',
      seed: requestData.seed ?? -1,
      steps: requestData.steps ?? 20,
      checkpoint: requestData.checkpoint ?? null,
      sampler: requestData.sampler ?? 'Euler a',
    })

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Image generation failed: ${response.error || 'No images generated.'}`,
      })
    }

    const base64Image = response.images[0]
    const savedImage = await saveImage(
      base64Image,
      requestData.galleryName || 'cafefred',
      validatedData.userId,
      validatedData.galleryId,
    )

    imageId = savedImage.id
    if (!imageId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated image.',
      })
    }

    newArt = await prisma.art.create({
      data: {
        path: savedImage.fileName,
        cfg: Math.floor(cfgValue),
        cfgHalf: cfgValue % 1 >= 0.5,
        checkpoint: requestData.checkpoint ?? null,
        sampler: requestData.sampler ?? null,
        seed: requestData.seed ?? -1,
        steps: requestData.steps ?? 20,
        designer: validatedData.designer ?? null,
        promptString: requestData.promptString.trim(),
        negativePrompt: requestData.negativePrompt ?? null,
        isPublic: requestData.isPublic ?? true,
        isMature: requestData.isMature ?? false,
        userId: validatedData.userId,
        promptId: validatedData.promptId ?? null,
        pitchId: validatedData.pitchId ?? null,
        galleryId: validatedData.galleryId ?? null,
        artImageId: imageId,
        serverId: server.id,
        serverName: server.title,
        serverUrl: getServerEndpoint(server),
      },
    })

    await prisma.artImage.update({
      where: { id: imageId },
      data: { artId: newArt.id },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { karma: user.karma - 1 },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Art and image saved successfully!',
      data: newArt,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to create new art.',
    }
  }
})

export async function generateImage({
  server,
  prompt,
  user,
  cfgValue,
  negativePrompt,
  seed,
  steps,
  checkpoint,
  sampler,
}: GenerateImageInput): Promise<GenerateImageResponse> {
  const endpoint = getServerEndpoint(server)

  if (server.serverType === 'COMFY' || server.supportsComfyWorkflow) {
    throw new Error(
      `Server "${server.title}" is a Comfy server. This route currently supports A1111-style txt2img servers only.`,
    )
  }

  const requestBody = {
    prompt,
    negative_prompt: negativePrompt || ' ',
    steps: steps ?? 20,
    cfg_scale: cfgValue || 3,
    seed: seed ?? -1,
    width: 512,
    height: 512,
    sampler_index: sampler || 'Euler a',
    override_settings: {
      sd_model_checkpoint: checkpoint || 'Flux/flux1-dev-fp8.safetensors',
    },
    user,
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let details = ''
      try {
        const errorData = await response.json()
        details =
          errorData?.error ||
          errorData?.message ||
          JSON.stringify(errorData)
      } catch {
        details = response.statusText
      }

      throw new Error(
        `Image generation failed: ${response.status} ${response.statusText}${details ? ` - ${details}` : ''}`,
      )
    }

    const responseData = await response.json()
    return {
      images: Array.isArray(responseData.images) ? responseData.images : [],
      error: responseData.error,
    }
  } catch (error) {
    console.error('Error during image generation:', error)
    throw error instanceof Error
      ? error
      : new Error('Image generation failed.')
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}