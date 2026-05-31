// /server/api/art/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { saveImage } from '../../utils/saveImage'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'
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
import { withArtMana } from '../../utils/generationMana'

type ServerAwareRequestData = RequestData &
  CheckpointResourceRequestData & {
    serverId?: number | null
    serverName?: string | null
    width?: number | null
    height?: number | null
  }

type GenerateImageResponse = {
  images: string[]
  error?: string
  info?: string | null
  parameters?: Record<string, unknown> | null
  resolvedCheckpoint?: string | null
  resolvedSampler?: string | null
  resolvedSeed?: number | null
}

type AuthenticatedUser = {
  id: number
  karma: number
  preferredArtServerId: number | null
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

const DEFAULT_STEPS = 20
const DEFAULT_CFG = 3
const DEFAULT_WIDTH = 512
const DEFAULT_HEIGHT = 512
const DEFAULT_SAMPLER = 'Euler a'

export default defineEventHandler(async (event) => {
  try {
    const requestData: ServerAwareRequestData = await readBody(event)

    if (!requestData.promptString?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    const user = await getAuthenticatedUser(
      event.node.req.headers.authorization,
    )
    const requestedUserId = requestData.userId ?? user.id

    if (user.id !== requestedUserId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    const normalizedRequestData: ServerAwareRequestData = {
      ...requestData,
      userId: requestedUserId,
    }

    const validatedData: Partial<RequestData> = {}

    validatedData.userId = await validateAndLoadUserId(
      normalizedRequestData,
      validatedData,
    )

    validatedData.pitchId = await validateAndLoadPitchId(normalizedRequestData)

    const requestDataWithPitch = {
      ...normalizedRequestData,
      pitchId: validatedData.pitchId,
    }

    validatedData.promptId = await validateAndLoadPromptId(
      requestDataWithPitch,
      validatedData,
    )

    validatedData.artCollectionId =
      await validateAndLoadArtCollectionId(requestDataWithPitch)

    validatedData.designer = validateAndLoadDesignerName(normalizedRequestData)

    const cfgValue = calculateCfg(
      normalizeNumber(normalizedRequestData.cfg, DEFAULT_CFG),
      normalizedRequestData.cfgHalf ?? false,
    )

    const server = await resolveServer({
      userId: user.id,
      serverId: normalizedRequestData.serverId ?? null,
      serverName: normalizedRequestData.serverName ?? null,
      capability: 'art',
    })

    assertA1111Server(server)

    const steps = normalizeInteger(normalizedRequestData.steps, DEFAULT_STEPS)
    const width = normalizeInteger(normalizedRequestData.width, DEFAULT_WIDTH)
    const height = normalizeInteger(
      normalizedRequestData.height,
      DEFAULT_HEIGHT,
    )
    const sampler = cleanText(normalizedRequestData.sampler) || DEFAULT_SAMPLER
    const seed = normalizeInteger(normalizedRequestData.seed, -1)

    const gate = await withArtMana(event, {
      server,
      engine: 'a1111',
      steps,
      width,
      height,
    })

    const response = await generateImage({
      server,
      prompt: normalizedRequestData.promptString.trim(),
      user: validatedData.designer || 'kindguest',
      cfgValue,
      negativePrompt: normalizedRequestData.negativePrompt || '',
      seed,
      steps,
      checkpoint: normalizedRequestData.checkpoint ?? null,
      sampler,
      width,
      height,
    })

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Image generation failed: ${
          response.error || 'No images generated.'
        }`,
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
      validatedData.userId ?? user.id,
    )

    if (!savedImage.id) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated image.',
      })
    }

    const resolvedCheckpoint = await resolveCheckpointResource({
      requestData: normalizedRequestData,
      server,
    })

    const updatedImage = await updateGeneratedArtImage({
      imageId: savedImage.id,
      requestData: normalizedRequestData,
      validatedData,
      server,
      cfgValue,
      steps,
      width,
      height,
      sampler,
      seed,
      resolvedCheckpoint,
      generationResponse: response,
      userId: user.id,
    })

    const { balance } = await gate.commit(`art:${updatedImage.id}`)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'ArtImage generated successfully.',
      data: updatedImage,
      mana: {
        balance,
        charged: gate.cost,
      },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to generate art image.',
    }
  }
})

async function getAuthenticatedUser(
  authorizationHeader: string | undefined,
): Promise<AuthenticatedUser> {
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

  return user
}

function assertA1111Server(server: Server): void {
  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not active.`,
    })
  }

  if (server.serverType !== 'A1111') {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is ${server.serverType}. This route only supports A1111 txt2img servers.`,
    })
  }
}

async function updateGeneratedArtImage(input: {
  imageId: number
  requestData: ServerAwareRequestData
  validatedData: Partial<RequestData>
  server: Server
  cfgValue: number
  steps: number
  width: number
  height: number
  sampler: string
  seed: number
  resolvedCheckpoint: {
    checkpoint: string | null
    checkpointResourceId: number | null
  }
  generationResponse: GenerateImageResponse
  userId: number
}): Promise<ArtImage> {
  const {
    imageId,
    requestData,
    validatedData,
    server,
    cfgValue,
    steps,
    sampler,
    seed,
    resolvedCheckpoint,
    generationResponse,
    userId,
  } = input

  const promptString = requestData.promptString.trim()
  const resolvedSampler = generationResponse.resolvedSampler || sampler
  const resolvedSeed = generationResponse.resolvedSeed ?? seed

  return await prisma.artImage.update({
    where: {
      id: imageId,
    },
    data: {
      cfg: Math.floor(cfgValue),
      cfgHalf: cfgValue % 1 >= 0.5,
      checkpoint: resolvedCheckpoint.checkpoint,
      checkpointResourceId: resolvedCheckpoint.checkpointResourceId,
      sampler: resolvedSampler,
      seed: resolvedSeed,
      steps,
      designer: validatedData.designer ?? null,
      promptString,
      artPrompt: promptString,
      negativePrompt: requestData.negativePrompt ?? null,
      isPublic: requestData.isPublic ?? true,
      isMature: requestData.isMature ?? false,
      userId: validatedData.userId ?? userId,
      serverId: server.id,
      serverName: server.label || server.title,
      serverUrl: getServerEndpoint(server),
      Prompts: validatedData.promptId
        ? {
            connect: {
              id: validatedData.promptId,
            },
          }
        : undefined,
      Pitches: validatedData.pitchId
        ? {
            connect: {
              id: validatedData.pitchId,
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
}

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
  assertA1111Server(server)

  const endpoint = getServerEndpoint(server)

  if (!endpoint.includes('/sdapi/v1/txt2img')) {
    throw new Error(
      `Server "${server.title}" endpoint does not look like an A1111 txt2img endpoint: ${endpoint}`,
    )
  }

  const requestBody: A1111Txt2ImgRequest = {
    prompt,
    negative_prompt: negativePrompt || ' ',
    steps: normalizeInteger(steps, DEFAULT_STEPS),
    cfg_scale: cfgValue || DEFAULT_CFG,
    seed: normalizeInteger(seed, -1),
    width: normalizeInteger(width, DEFAULT_WIDTH),
    height: normalizeInteger(height, DEFAULT_HEIGHT),
    sampler_index: cleanText(sampler) || DEFAULT_SAMPLER,
    user,
  }

  const cleanCheckpoint = cleanText(checkpoint)

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
    endpoint,
    authType: server.authType,
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
          `authType=${server.authType}`,
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
    const infoData = parseA1111Info(responseData.info)
    const parameterData =
      responseData.parameters &&
      typeof responseData.parameters === 'object' &&
      !Array.isArray(responseData.parameters)
        ? (responseData.parameters as Record<string, unknown>)
        : {}

    const resolvedCheckpoint =
      getStringField(infoData, [
        'sd_model_checkpoint',
        'sd_model_name',
        'model',
        'checkpoint',
      ]) ||
      getStringField(parameterData, [
        'sd_model_checkpoint',
        'sd_model_name',
        'model',
        'checkpoint',
      ]) ||
      null

    const resolvedSampler =
      getStringField(infoData, ['sampler_name', 'sampler', 'sampler_index']) ||
      getStringField(parameterData, [
        'sampler_name',
        'sampler',
        'sampler_index',
      ]) ||
      null

    const resolvedSeed =
      getNumberField(infoData, ['seed', 'all_seeds']) ||
      getNumberField(parameterData, ['seed', 'all_seeds']) ||
      null

    return {
      images: Array.isArray(responseData.images) ? responseData.images : [],
      error: responseData.error,
      info: typeof responseData.info === 'string' ? responseData.info : null,
      parameters: parameterData,
      resolvedCheckpoint,
      resolvedSampler,
      resolvedSeed,
    }
  } catch (error: unknown) {
    console.error('Error during A1111 image generation:', error)
    throw error instanceof Error ? error : new Error('Image generation failed.')
  }
}

function getBackendServerHeaders(server: Server): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const envToken = process.env.ART_SERVER_PROXY_TOKEN || ''
  const serverToken = server.apiKey || ''
  const token = envToken || serverToken

  if (!token || server.authType === 'NONE') {
    return headers
  }

  if (server.authType === 'BEARER') {
    headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`
    return headers
  }

  if (server.authType === 'HEADER' || server.authType === 'API_KEY') {
    const apiKeyName = server.apiKeyName?.trim() || 'X-Kindrobots-Server-Token'
    headers[apiKeyName] = token
    return headers
  }

  if (server.authType === 'QUERY') {
    return headers
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

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeInteger(value: unknown, fallback: number): number {
  const parsed = normalizeNumber(value, fallback)
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback
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

function parseA1111Info(info: unknown): Record<string, unknown> {
  if (!info) return {}

  if (typeof info === 'object' && !Array.isArray(info)) {
    return info as Record<string, unknown>
  }

  if (typeof info !== 'string') return {}

  try {
    const parsed = JSON.parse(info)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function getStringField(
  data: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = data[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function getNumberField(
  data: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = data[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}
