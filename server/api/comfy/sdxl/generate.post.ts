// /server/api/comfy/sdxl/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { saveImage } from '../../../utils/saveImage'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'
import {
  type RequestData,
  validateAndLoadDesignerName,
  validateAndLoadPitchId,
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

type ComfyGenerateRequestData = RequestData &
  CheckpointResourceRequestData & {
    serverId?: number | null
    serverName?: string | null
    workflow?: ComfyWorkflow | null
    workflowJson?: ComfyWorkflow | null
  }

type ComfyWorkflow = Record<string, ComfyWorkflowNode>

type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
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

    // Auth + mana gate. Replaces the old Bearer/karma checks: manaGate
    // validates the token, and billing is now mana-based (free on the user's
    // own/unmetered server, charged on the metered platform server).
    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
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

    // Generation succeeded — charge mana (no-op on free/unmetered servers).
    // This replaces the old `karma - 1` decrement.
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

function patchComfyWorkflow(
  workflow: ComfyWorkflow,
  input: Omit<GenerateComfyImageInput, 'server' | 'workflow'>,
): void {
  const positiveText = input.prompt
  const negativeText = input.negativePrompt || ''
  const seed = input.seed ?? -1
  const steps = input.steps ?? 20
  const cfg = input.cfgValue || 3
  const sampler = normalizeComfySampler(input.sampler)
  const checkpoint = input.checkpoint || ''

  for (const node of Object.values(workflow)) {
    if (!node?.inputs) continue

    const classType = node.class_type || ''
    const title = getNodeTitle(node)

    if (classType === 'CheckpointLoaderSimple' && checkpoint) {
      assignIfKeyExists(node.inputs, 'ckpt_name', checkpoint)
    }

    if (classType === 'KSampler') {
      assignIfKeyExists(node.inputs, 'seed', seed)
      assignIfKeyExists(node.inputs, 'steps', steps)
      assignIfKeyExists(node.inputs, 'cfg', cfg)
      assignIfKeyExists(node.inputs, 'sampler_name', sampler)
    }

    if (classType === 'CLIPTextEncode') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'text', negativeText)
      } else if (label.includes('positive') || label.includes('prompt')) {
        assignIfKeyExists(node.inputs, 'text', positiveText)
      }
    }

    if (classType === 'CLIPTextEncodeFlux') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'clip_l', negativeText)
        assignIfKeyExists(node.inputs, 't5xxl', negativeText)
      } else {
        assignIfKeyExists(node.inputs, 'clip_l', positiveText)
        assignIfKeyExists(node.inputs, 't5xxl', positiveText)
      }
    }

    if ('noise_seed' in node.inputs) {
      node.inputs.noise_seed = seed
    }

    if ('guidance' in node.inputs) {
      node.inputs.guidance = cfg
    }

    if ('denoise' in node.inputs && typeof node.inputs.denoise !== 'number') {
      node.inputs.denoise = 1
    }
  }
}

function buildDefaultComfyWorkflow({
  prompt,
  negativePrompt,
  cfgValue,
  seed,
  steps,
  checkpoint,
  sampler,
}: Omit<GenerateComfyImageInput, 'server' | 'workflow'>): ComfyWorkflow {
  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint || 'v1-5-pruned-emaonly.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
      _meta: {
        title: 'Positive Prompt',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt || '',
        clip: ['1', 1],
      },
      _meta: {
        title: 'Negative Prompt',
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: 512,
        height: 512,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: seed ?? -1,
        steps: steps ?? 20,
        cfg: cfgValue || 3,
        sampler_name: normalizeComfySampler(sampler),
        scheduler: 'normal',
        denoise: 1,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'kindrobots',
        images: ['6', 0],
      },
    },
  }
}

function normalizeComfySampler(sampler?: string | null): string {
  const value = sampler?.trim()

  if (!value) return 'euler'

  const lookup: Record<string, string> = {
    'Euler a': 'euler_ancestral',
    Euler: 'euler',
    LMS: 'lms',
    Heun: 'heun',
    DPM2: 'dpm_2',
    'DPM2 a': 'dpm_2_ancestral',
    DDIM: 'ddim',
  }

  return lookup[value] || value
}

function getNodeTitle(node: ComfyWorkflowNode): string {
  const title = node._meta?.title

  return typeof title === 'string' ? title : ''
}

function assignIfKeyExists(
  inputs: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  if (key in inputs) {
    inputs[key] = value
  }
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
