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
  type ServerEndpointTransport,
} from '../../utils/serverResolver'

type ServerAwareRequestData = RequestData & {
  serverId?: number | null
  serverName?: string | null
  width?: number | null
  height?: number | null
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
  width?: number | null
  height?: number | null
}

type A1111Txt2ImgRequest = {
  prompt: string
  negative_prompt: string
  steps: number
  cfg_scale: number
  seed: number
  width: number
  height: number
  sampler_index: string
  user: string
  override_settings?: {
    sd_model_checkpoint?: string
  }
  override_settings_restore_afterwards?: boolean
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

    const token = authorizationHeader.split(' ')[1] ?? ''

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
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    if (user.karma <= 0) {
      throw createError({
        statusCode: 403,
        message: 'Insufficient karma to generate an image.',
      })
    }

    const validatedData: Partial<RequestData> = {}

    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )

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
      steps: requestData.steps ?? server.defaultSteps ?? 20,
      checkpoint: requestData.checkpoint ?? null,
      sampler: requestData.sampler ?? server.defaultSampler ?? 'Euler a',
      width: requestData.width ?? server.defaultWidth ?? 512,
      height: requestData.height ?? server.defaultHeight ?? 512,
    })

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Image generation failed: ${response.error || 'No images generated.'}`,
      })
    }

    const base64Image = response.images[0]

    if (!base64Image) {
      throw createError({
        statusCode: 500,
        message: 'Image generation failed: missing image data.',
      })
    }

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
        sampler: requestData.sampler ?? server.defaultSampler ?? null,
        seed: requestData.seed ?? -1,
        steps: requestData.steps ?? server.defaultSteps ?? 20,
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
        serverUrl: getServerEndpoint(server, 'backend'),
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
  width,
  height,
}: GenerateImageInput): Promise<GenerateImageResponse> {
  const transport: ServerEndpointTransport = 'backend'
  const endpoint = getServerEndpoint(server, transport)

  if (server.serverType !== 'A1111' && server.generationEngine !== 'A1111') {
    throw new Error(
      `Server "${server.title}" is ${server.serverType}/${server.generationEngine}. This route only supports A1111 txt2img servers.`,
    )
  }

  if (server.supportsComfyWorkflow || server.generationEngine === 'COMFY') {
    throw new Error(
      `Server "${server.title}" supports Comfy workflows. Use the Comfy route instead.`,
    )
  }

  if (server.generationEngine === 'FLUX') {
    throw new Error(
      `Server "${server.title}" is a Flux server. Use the Flux route instead.`,
    )
  }

  if (server.generationEngine === 'KONTEXT') {
    throw new Error(
      `Server "${server.title}" is a Kontext server. Use the Kontext route instead.`,
    )
  }

  if (!endpoint.includes('/sdapi/v1/txt2img')) {
    throw new Error(
      `Server "${server.title}" endpoint does not look like an A1111 txt2img endpoint: ${endpoint}`,
    )
  }

  const requestBody: A1111Txt2ImgRequest = {
    prompt,
    negative_prompt: negativePrompt || ' ',
    steps: steps ?? server.defaultSteps ?? 20,
    cfg_scale: cfgValue || server.defaultCfg || 3,
    seed: seed ?? -1,
    width: width ?? server.defaultWidth ?? 512,
    height: height ?? server.defaultHeight ?? 512,
    sampler_index: sampler || server.defaultSampler || 'Euler a',
    user,
  }

  const cleanCheckpoint =
    typeof checkpoint === 'string' ? checkpoint.trim() : ''

  if (cleanCheckpoint) {
    requestBody.override_settings = {
      sd_model_checkpoint: cleanCheckpoint,
    }
    requestBody.override_settings_restore_afterwards = true
  }

  const headers = getBackendServerHeaders(server)

  console.log('[Art Generate] Calling A1111 upstream image server', {
    serverId: server.id,
    title: server.title,
    serverType: server.serverType,
    generationEngine: server.generationEngine,
    endpoint,
    requiresApiKey: server.requiresApiKey,
    apiKeyName: server.apiKeyName,
    proxyTokenPresent: Boolean(process.env.ART_SERVER_PROXY_TOKEN),
  })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const details = await parseUpstreamErrorResponse(response)

      throw new Error(
        [
          `Image generation failed: ${response.status} ${response.statusText}`,
          `endpoint=${endpoint}`,
          `serverId=${server.id}`,
          `serverTitle=${server.title}`,
          `serverType=${server.serverType}`,
          `generationEngine=${server.generationEngine}`,
          `requiresApiKey=${String(server.requiresApiKey)}`,
          `apiKeyName=${server.apiKeyName || 'none'}`,
          process.env.ART_SERVER_PROXY_TOKEN
            ? 'proxyToken=present'
            : 'proxyToken=missing',
          details ? `details=${details}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      )
    }

    const responseData = await response.json()

    return {
      images: Array.isArray(responseData.images) ? responseData.images : [],
      error: responseData.error,
    }
  } catch (error) {
    console.error('Error during A1111 image generation:', error)
    throw error instanceof Error ? error : new Error('Image generation failed.')
  }
}

function getBackendServerHeaders(server: Server): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!server.requiresApiKey) {
    return headers
  }

  const apiKeyName = server.apiKeyName?.trim() || 'X-Kindrobots-Server-Token'
  const envToken = process.env.ART_SERVER_PROXY_TOKEN || ''
  const serverToken = server.apiKey || ''
  const token = envToken || serverToken

  if (!token) {
    throw new Error(
      `Missing backend proxy token for server "${server.title}". Set ART_SERVER_PROXY_TOKEN in Vercel or store a server apiKey.`,
    )
  }

  if (apiKeyName.toLowerCase() === 'authorization') {
    headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`
  } else {
    headers[apiKeyName] = token
  }

  return headers
}

async function parseUpstreamErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const errorData = await response.json()
      return stringifyServerError(errorData)
    }

    const text = await response.text()
    return text || response.statusText
  } catch {
    return response.statusText
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}

function stringifyServerError(errorData: unknown): string {
  if (!errorData) return ''

  if (typeof errorData === 'string') return errorData

  if (typeof errorData === 'object') {
    const data = errorData as Record<string, unknown>

    const message = data.message
    const error = data.error
    const detail = data.detail

    if (typeof error === 'string') return error
    if (typeof message === 'string') return message
    if (typeof detail === 'string') return detail

    return JSON.stringify(data)
  }

  return String(errorData)
}
