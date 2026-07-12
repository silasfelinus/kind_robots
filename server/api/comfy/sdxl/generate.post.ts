// /server/api/comfy/sdxl/generate.post.ts
//
// Direct/relay-only synchronous Comfy (SDXL/SD) render. Dials the Comfy server
// inline, so it only works from a caller on the home tailnet (relay agent or
// on-box tool). The browser enqueues via /api/art/enqueue instead (engine
// "comfy"), which reuses this route's workflow builder (./utils/workflow.ts).
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { saveImage } from '../../../utils/saveImage'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'
import {
  type RequestData,
  validateAndLoadDesignerName,
  validateAndLoadDreamIds,
  validateAndLoadPromptId,
  validateAndLoadUserId,
  validateAndLoadArtCollectionId,
} from '../../art'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import {
  resolveCheckpointResource,
  type CheckpointResourceRequestData,
} from '../../art/utils/checkpointResource'
import { manaGate } from '../../../utils/manaGate'
import { estimateArtCostUsd } from '../../../utils/manaCost'
import { requireApiUser } from '../../../utils/authGuard'
import {
  buildDefaultComfyWorkflow,
  patchComfyWorkflow,
  type ComfyWorkflow,
} from './utils/workflow'

type ComfyGenerateRequestData = RequestData &
  CheckpointResourceRequestData & {
    serverId?: number | null
    serverName?: string | null
    workflow?: ComfyWorkflow | null
    workflowJson?: ComfyWorkflow | null
  }

type ComfyPromptResponse = {
  prompt_id?: string
  number?: number
  node_errors?: unknown
}

type ComfyHistoryResponse = Record<string, ComfyHistoryEntry>

type ComfyHistoryEntry = {
  prompt?: [number, string, ComfyWorkflow]
  outputs?: Record<string, ComfyOutputNode>
  status?: {
    status_str?: string
    completed?: boolean
    messages?: unknown[]
  }
}

type ComfyOutputNode = {
  images?: ComfyImageOutput[]
  gifs?: ComfyImageOutput[]
}

type ComfyImageOutput = {
  filename?: string
  subfolder?: string
  type?: string
}

interface GenerateComfyImageInput {
  server: Server
  prompt: string
  cfgValue: number
  negativePrompt?: string
  seed?: number | null
  steps?: number
  checkpoint?: string | null
  sampler?: string | null
  workflow?: ComfyWorkflow | null
}

interface GenerateComfyImageResponse {
  images: string[]
  promptId?: string
  error?: string
}

const comfyTimeoutMs = 180_000
const comfyPollIntervalMs = 1_500

export default defineEventHandler(async (event) => {
  let imageId: number | null = null
  let newArt: ArtImage | null = null

  try {
    const requestData: ComfyGenerateRequestData = await readBody(event)

    if (!requestData.promptString?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    const { user } = await requireApiUser(event)

    if (user.id !== requestData.userId) {
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request does not match the authenticated user.',
      })
    }

    const gate = await manaGate(event, {
      kind: 'art',
      estCostUsd: estimateArtCostUsd({
        engine: 'comfy',
        steps: requestData.steps,
      }),
      serverId: requestData.serverId ?? null,
    })

    const validatedData: Partial<RequestData> = {}

    validatedData.userId = await validateAndLoadUserId(
      requestData,
      validatedData,
    )

    validatedData.dreamIds = await validateAndLoadDreamIds(requestData)

    validatedData.promptId = await validateAndLoadPromptId(
      requestData,
      validatedData,
    )

    validatedData.artCollectionId =
      await validateAndLoadArtCollectionId(requestData)

    validatedData.designer = validateAndLoadDesignerName(requestData)

    const rawCfg = Number(requestData.cfg)
    const cfgValue = calculateCfg(
      Number.isNaN(rawCfg) ? 3 : rawCfg,
      requestData.cfgHalf ?? false,
    )

    const server = await resolveServer({
      userId: gate.user.id,
      serverId: requestData.serverId ?? null,
      serverName: requestData.serverName ?? null,
      capability: 'comfy',
    })

    const response = await generateComfyImage({
      server,
      prompt: requestData.promptString.trim(),
      cfgValue,
      negativePrompt: requestData.negativePrompt || '',
      seed: requestData.seed ?? -1,
      steps: requestData.steps ?? 20,
      checkpoint: requestData.checkpoint ?? null,
      sampler: requestData.sampler ?? 'euler',
      workflow: requestData.workflow || requestData.workflowJson || null,
    })

    if (!response.images?.length) {
      throw createError({
        statusCode: 500,
        message: `Comfy image generation failed: ${
          response.error || 'No images generated.'
        }`,
      })
    }

    const base64Image = response.images[0]

    if (!base64Image) {
      throw createError({
        statusCode: 500,
        message: 'Comfy image generation failed: missing image data.',
      })
    }

    const savedImage = await saveImage(
      base64Image,
      validatedData.userId ?? user.id,
    )

    imageId = savedImage.id

    if (!imageId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save generated Comfy image.',
      })
    }

    const resolvedCheckpoint = await resolveCheckpointResource({
      requestData,
      server,
    })

    newArt = await prisma.artImage.update({
      where: {
        id: imageId,
      },
      data: {
        path: savedImage.fileName,
        imagePath: savedImage.fileName,
        fileName: savedImage.fileName,
        fileType: 'png',
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
        userId: validatedData.userId ?? user.id,
        serverId: server.id,
        serverName: server.title,
        serverUrl: getServerEndpoint(server),
        Dreams: validatedData.dreamIds?.length
          ? {
              connect: validatedData.dreamIds.map((id) => ({ id })),
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

    const { balance } = await gate.commit(`sdxl:${newArt.id}`)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Comfy art and image saved successfully!',
      data: newArt,
      mana: { balance, charged: gate.cost },
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create Comfy art.',
    }
  }
})

export async function generateComfyImage({
  server,
  prompt,
  cfgValue,
  negativePrompt,
  seed,
  steps,
  checkpoint,
  sampler,
  workflow,
}: GenerateComfyImageInput): Promise<GenerateComfyImageResponse> {
  if (server.serverType !== 'COMFY') {
    throw new Error(
      `Server "${server.title}" is ${server.serverType}. This route only supports Comfy workflow servers.`,
    )
  }

  const baseUrl = getComfyBaseUrl(server)
  const comfyWorkflow =
    workflow ||
    buildDefaultComfyWorkflow({
      prompt,
      negativePrompt,
      cfgValue,
      seed,
      steps,
      checkpoint,
      sampler,
    })

  patchComfyWorkflow(comfyWorkflow, {
    prompt,
    negativePrompt,
    cfgValue,
    seed,
    steps,
    checkpoint,
    sampler,
  })

  const clientId = crypto.randomUUID()

  const promptResponse = await postComfyPrompt(baseUrl, comfyWorkflow, clientId)

  if (!promptResponse.prompt_id) {
    throw new Error(
      `Comfy did not return a prompt_id.${
        promptResponse.node_errors
          ? ` Node errors: ${stringifyServerError(promptResponse.node_errors)}`
          : ''
      }`,
    )
  }

  const historyEntry = await waitForComfyHistory(
    baseUrl,
    promptResponse.prompt_id,
  )

  const imageOutput = getFirstComfyImage(historyEntry)

  if (!imageOutput?.filename) {
    throw new Error('Comfy completed but returned no image output.')
  }

  const imageBase64 = await fetchComfyImageAsBase64(baseUrl, imageOutput)

  return {
    images: [imageBase64],
    promptId: promptResponse.prompt_id,
  }
}

function getComfyBaseUrl(server: Server): string {
  const endpoint = getServerEndpoint(server)
  const trimmed = endpoint.replace(/\/+$/, '')

  if (trimmed.endsWith('/prompt')) {
    return trimmed.replace(/\/prompt$/, '')
  }

  if (trimmed.endsWith('/api/prompt')) {
    return trimmed.replace(/\/api\/prompt$/, '')
  }

  return trimmed
}

async function postComfyPrompt(
  baseUrl: string,
  workflow: ComfyWorkflow,
  clientId: string,
): Promise<ComfyPromptResponse> {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: getComfyHeaders(),
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId,
    }),
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)
    throw new Error(
      `Comfy prompt failed: ${response.status} ${response.statusText}${
        details ? ` - ${details}` : ''
      }`,
    )
  }

  return await response.json()
}

async function waitForComfyHistory(
  baseUrl: string,
  promptId: string,
): Promise<ComfyHistoryEntry> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < comfyTimeoutMs) {
    const response = await fetch(`${baseUrl}/history/${promptId}`, {
      method: 'GET',
      headers: getComfyHeaders(),
    })

    if (!response.ok) {
      const details = await readResponseDetails(response)
      throw new Error(
        `Comfy history failed: ${response.status} ${response.statusText}${
          details ? ` - ${details}` : ''
        }`,
      )
    }

    const history = (await response.json()) as ComfyHistoryResponse
    const entry = history[promptId]

    if (entry?.outputs && Object.keys(entry.outputs).length) {
      return entry
    }

    if (entry?.status?.status_str === 'error') {
      throw new Error(`Comfy workflow failed: ${stringifyServerError(entry)}`)
    }

    await sleep(comfyPollIntervalMs)
  }

  throw new Error(`Comfy generation timed out after ${comfyTimeoutMs}ms.`)
}

function getFirstComfyImage(
  historyEntry: ComfyHistoryEntry,
): ComfyImageOutput | null {
  const outputs = Object.values(historyEntry.outputs || {})

  for (const output of outputs) {
    const image = output.images?.find((entry) => entry.filename)
    if (image) return image
  }

  for (const output of outputs) {
    const gif = output.gifs?.find((entry) => entry.filename)
    if (gif) return gif
  }

  return null
}

async function fetchComfyImageAsBase64(
  baseUrl: string,
  image: ComfyImageOutput,
): Promise<string> {
  const params = new URLSearchParams({
    filename: image.filename || '',
    subfolder: image.subfolder || '',
    type: image.type || 'output',
  })

  const response = await fetch(`${baseUrl}/view?${params.toString()}`, {
    method: 'GET',
    headers: getComfyHeaders(false),
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)
    throw new Error(
      `Comfy image fetch failed: ${response.status} ${response.statusText}${
        details ? ` - ${details}` : ''
      }`,
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

function getComfyHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, image/*, */*',
    'X-Kindrobots-Server-Token': process.env.ART_SERVER_PROXY_TOKEN ?? '',
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

async function readResponseDetails(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return stringifyServerError(await response.json())
    }

    return await response.text()
  } catch {
    return response.statusText
  }
}

function calculateCfg(cfg: number, cfgHalf: boolean): number {
  return cfgHalf ? cfg + 0.5 : cfg
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
