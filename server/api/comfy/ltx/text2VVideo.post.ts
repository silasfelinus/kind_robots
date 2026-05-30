// /server/api/comfy/ltx/text2video.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'
import { authAndGate } from '../../../utils/comfyGate'

type LtxTextToVideoRequest = {
  serverId?: number | null
  serverName?: string | null
  apiUrl?: string | null
  prompt?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  duration?: number | null
  frameRate?: number | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
  sigmas?: string | null
  denoise?: number | null
  tileSize?: number | null
  tileOverlap?: number | null
  temporalSize?: number | null
  temporalOverlap?: number | null
  loraStrength?: number | null
  filenamePrefix?: string | null
  includeAudio?: boolean | null
  audioData?: string | null
  referenceAudioName?: string | null
  timeoutMs?: number | null
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
  outputs?: Record<string, ComfyOutputNode>
  status?: {
    status_str?: string
    completed?: boolean
    messages?: unknown[]
  }
}

type ComfyOutputNode = Record<string, unknown>

type ComfyFileOutput = {
  filename?: string
  subfolder?: string
  type?: string
}

const defaultTimeoutMs = 600_000
const pollIntervalMs = 2_500

const defaultPrompt =
  'kind robots partying excitedly as confetti explodes around them with fireworks overhead'

const defaultNegativePrompt =
  'pc game, console game, video game, cartoon, childish, ugly, distorted, low quality, blurry, noisy, watermark, text, logo'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<LtxTextToVideoRequest>(event)
    const gate = await authAndGate(event, {
      engine: 'ltx',
      steps: body.steps,
      width: body.width,
      height: body.height,
      serverId: body.serverId ?? null,
    })

    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
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

    if (body.includeAudio) {
      throw createError({
        statusCode: 400,
        message:
          'Audio sync is not enabled for this endpoint yet. Send includeAudio: false or omit it.',
      })
    }

    const server = await resolveServer({
      userId: gate.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'art',
    })

    if (server.serverType !== 'COMFY' && server.generationEngine !== 'COMFY') {
      throw createError({
        statusCode: 400,
        message: `Server "${server.title}" is not a Comfy server.`,
      })
    }

    const baseUrl = body.apiUrl?.trim()
      ? cleanComfyBaseUrl(body.apiUrl)
      : getComfyBaseUrl(server)

    const workflow = buildLtxTextToVideoWorkflow({
      prompt: body.prompt?.trim() || defaultPrompt,
      negativePrompt: body.negativePrompt?.trim() || defaultNegativePrompt,
      width: body.width ?? 1280,
      height: body.height ?? 720,
      duration: body.duration ?? 6,
      frameRate: body.frameRate ?? 25,
      seed: body.seed ?? -1,
      steps: body.steps ?? 20,
      cfg: body.cfg ?? 1,
      sampler: body.sampler ?? 'euler_ancestral_cfg_pp',
      sigmas:
        body.sigmas ??
        '1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0',
      denoise: body.denoise ?? 1,
      tileSize: body.tileSize ?? 768,
      tileOverlap: body.tileOverlap ?? 64,
      temporalSize: body.temporalSize ?? 4096,
      temporalOverlap: body.temporalOverlap ?? 4,
      loraStrength: body.loraStrength ?? 0.5,
      filenamePrefix: body.filenamePrefix ?? 'video/kindrobots_ltx_text2video',
    })

    const clientId = crypto.randomUUID()
    const promptResponse = await postComfyPrompt(baseUrl, workflow, clientId)

    if (!promptResponse.prompt_id) {
      throw createError({
        statusCode: 502,
        message: `Comfy did not return a prompt_id.${
          promptResponse.node_errors
            ? ` Node errors: ${stringifyServerError(promptResponse.node_errors)}`
            : ''
        }`,
      })
    }

    const historyEntry = await waitForComfyHistory({
      baseUrl,
      promptId: promptResponse.prompt_id,
      timeoutMs: body.timeoutMs ?? defaultTimeoutMs,
    })

    const videoOutput = getFirstVideoFile(historyEntry)

    if (!videoOutput?.filename) {
      throw createError({
        statusCode: 502,
        message:
          'Comfy completed but returned no video file. Check SaveVideo output keys in history.',
      })
    }

    const videoData = await fetchComfyFileAsDataUrl(baseUrl, videoOutput)
    const { balance } = await gate.commit(`ltx:${promptResponse.prompt_id}`)

    return {
      success: true,
      message: 'LTX text-to-video generated successfully.',
      promptId: promptResponse.prompt_id,
      queuePosition: promptResponse.number ?? null,
      videoData,
      filename: videoOutput.filename,
      subfolder: videoOutput.subfolder ?? '',
      type: videoOutput.type ?? 'output',
      mimeType: getVideoMimeType(videoOutput.filename),
      serverId: server.id,
      serverName: server.title,
      baseUrl,
      mana: { balance, charged: gate.cost },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate LTX text-to-video.',
    }
  }
})

function buildLtxTextToVideoWorkflow(input: {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  duration: number
  frameRate: number
  seed: number
  steps: number
  cfg: number
  sampler: string
  sigmas: string
  denoise: number
  tileSize: number
  tileOverlap: number
  temporalSize: number
  temporalOverlap: number
  loraStrength: number
  filenamePrefix: string
}): ComfyWorkflow {
  const seed = resolveSeed(input.seed)

  return {
    '341': {
      inputs: {
        filename_prefix: input.filenamePrefix,
        format: 'auto',
        codec: 'auto',
        video: ['340:312', 0],
      },
      class_type: 'SaveVideo',
      _meta: {
        title: 'Save Video',
      },
    },
    '340:286': {
      inputs: {
        noise_seed: seed,
      },
      class_type: 'RandomNoise',
      _meta: {
        title: 'RandomNoise',
      },
    },
    '340:298': {
      inputs: {
        sampler_name: input.sampler,
      },
      class_type: 'KSamplerSelect',
      _meta: {
        title: 'KSamplerSelect',
      },
    },
    '340:308': {
      inputs: {
        sigmas: input.sigmas,
      },
      class_type: 'ManualSigmas',
      _meta: {
        title: 'ManualSigmas',
      },
    },
    '340:315': {
      inputs: {
        cfg: input.cfg,
        model: ['340:293', 0],
        positive: ['340:307', 0],
        negative: ['340:307', 1],
      },
      class_type: 'CFGGuider',
      _meta: {
        title: 'CFGGuider',
      },
    },
    '340:291': {
      inputs: {
        noise: ['340:286', 0],
        guider: ['340:315', 0],
        sampler: ['340:298', 0],
        sigmas: ['340:308', 0],
        latent_image: ['340:302', 0],
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: {
        title: 'SamplerCustomAdvanced',
      },
    },
    '340:306': {
      inputs: {
        text: ['340:319', 0],
        clip: ['340:318', 0],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode Positive',
      },
    },
    '340:314': {
      inputs: {
        text: input.negativePrompt,
        clip: ['340:318', 0],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode Negative',
      },
    },
    '340:307': {
      inputs: {
        frame_rate: ['340:304', 0],
        positive: ['340:306', 0],
        negative: ['340:314', 0],
      },
      class_type: 'LTXVConditioning',
      _meta: {
        title: 'LTXVConditioning',
      },
    },
    '340:316': {
      inputs: {
        tile_size: input.tileSize,
        overlap: input.tileOverlap,
        temporal_size: input.temporalSize,
        temporal_overlap: input.temporalOverlap,
        samples: ['340:291', 0],
        vae: ['340:317', 2],
      },
      class_type: 'VAEDecodeTiled',
      _meta: {
        title: 'VAE Decode Tiled',
      },
    },
    '340:330': {
      inputs: {
        value: input.width,
      },
      class_type: 'PrimitiveInt',
      _meta: {
        title: 'Width',
      },
    },
    '340:324': {
      inputs: {
        value: input.height,
      },
      class_type: 'PrimitiveInt',
      _meta: {
        title: 'Height',
      },
    },
    '340:323': {
      inputs: {
        value: input.frameRate,
      },
      class_type: 'PrimitiveInt',
      _meta: {
        title: 'Frame Rate',
      },
    },
    '340:331': {
      inputs: {
        value: input.duration,
      },
      class_type: 'PrimitiveFloat',
      _meta: {
        title: 'Duration',
      },
    },
    '340:299': {
      inputs: {
        expression: 'a/2',
        'values.a': ['340:330', 0],
      },
      class_type: 'ComfyMathExpression',
      _meta: {
        title: 'Latent Width Expression',
      },
    },
    '340:301': {
      inputs: {
        expression: 'a/2',
        'values.a': ['340:324', 0],
      },
      class_type: 'ComfyMathExpression',
      _meta: {
        title: 'Latent Height Expression',
      },
    },
    '340:304': {
      inputs: {
        expression: 'a',
        'values.a': ['340:323', 0],
      },
      class_type: 'ComfyMathExpression',
      _meta: {
        title: 'Frame Rate Expression',
      },
    },
    '340:329': {
      inputs: {
        expression: 'a * b + 1',
        'values.a': ['340:331', 0],
        'values.b': ['340:323', 0],
      },
      class_type: 'ComfyMathExpression',
      _meta: {
        title: 'Frame Count Expression',
      },
    },
    '340:302': {
      inputs: {
        width: ['340:299', 1],
        height: ['340:301', 1],
        length: ['340:329', 1],
        batch_size: 1,
      },
      class_type: 'EmptyLTXVLatentVideo',
      _meta: {
        title: 'EmptyLTXVLatentVideo',
      },
    },
    '340:312': {
      inputs: {
        fps: ['340:304', 0],
        images: ['340:316', 0],
      },
      class_type: 'CreateVideo',
      _meta: {
        title: 'Create Video',
      },
    },
    '340:293': {
      inputs: {
        lora_name: 'ltx-2.3-22b-distilled-lora-384.safetensors',
        strength_model: input.loraStrength,
        model: ['340:317', 0],
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: {
        title: 'Load LoRA',
      },
    },
    '340:317': {
      inputs: {
        ckpt_name: 'ltx\\ltx-2.3-22b-dev-fp8.safetensors',
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint',
      },
    },
    '340:318': {
      inputs: {
        text_encoder: 'gemma_3_12B_it_fp4_mixed.safetensors',
        ckpt_name: 'ltx\\ltx-2.3-22b-dev-fp8.safetensors',
        device: 'default',
      },
      class_type: 'LTXAVTextEncoderLoader',
      _meta: {
        title: 'LTXV Text Encoder Loader',
      },
    },
    '340:319': {
      inputs: {
        value: input.prompt,
      },
      class_type: 'PrimitiveStringMultiline',
      _meta: {
        title: 'Prompt',
      },
    },
  }
}

function getComfyBaseUrl(server: Server): string {
  return cleanComfyBaseUrl(getServerEndpoint(server, 'backend'))
}

function cleanComfyBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '')

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

    throw createError({
      statusCode: 502,
      message: `Comfy prompt failed: ${response.status} ${response.statusText}${
        details ? ` - ${details}` : ''
      }`,
    })
  }

  return await response.json()
}

async function waitForComfyHistory(input: {
  baseUrl: string
  promptId: string
  timeoutMs: number
}): Promise<ComfyHistoryEntry> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < input.timeoutMs) {
    const response = await fetch(`${input.baseUrl}/history/${input.promptId}`, {
      method: 'GET',
      headers: getComfyHeaders(),
    })

    if (!response.ok) {
      const details = await readResponseDetails(response)

      throw createError({
        statusCode: 502,
        message: `Comfy history failed: ${response.status} ${
          response.statusText
        }${details ? ` - ${details}` : ''}`,
      })
    }

    const history = (await response.json()) as ComfyHistoryResponse
    const entry = history[input.promptId]

    if (entry?.outputs && Object.keys(entry.outputs).length) {
      return entry
    }

    if (entry?.status?.status_str === 'error') {
      throw createError({
        statusCode: 502,
        message: `Comfy workflow failed: ${stringifyServerError(entry)}`,
      })
    }

    await sleep(pollIntervalMs)
  }

  throw createError({
    statusCode: 504,
    message: `LTX text-to-video timed out after ${input.timeoutMs}ms.`,
  })
}

function getFirstVideoFile(
  historyEntry: ComfyHistoryEntry,
): ComfyFileOutput | null {
  const outputs = Object.values(historyEntry.outputs || {})

  for (const output of outputs) {
    const found = findVideoFileInValue(output)
    if (found) return found
  }

  return null
}

function findVideoFileInValue(value: unknown): ComfyFileOutput | null {
  if (!value) return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoFileInValue(item)
      if (found) return found
    }

    return null
  }

  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const filename = record.filename

  if (typeof filename === 'string' && isVideoFile(filename)) {
    return {
      filename,
      subfolder: typeof record.subfolder === 'string' ? record.subfolder : '',
      type: typeof record.type === 'string' ? record.type : 'output',
    }
  }

  for (const child of Object.values(record)) {
    const found = findVideoFileInValue(child)
    if (found) return found
  }

  return null
}

function isVideoFile(filename: string): boolean {
  const normalized = filename.toLowerCase()

  return (
    normalized.endsWith('.mp4') ||
    normalized.endsWith('.webm') ||
    normalized.endsWith('.mov') ||
    normalized.endsWith('.mkv')
  )
}

async function fetchComfyFileAsDataUrl(
  baseUrl: string,
  file: ComfyFileOutput,
): Promise<string> {
  const params = new URLSearchParams({
    filename: file.filename || '',
    subfolder: file.subfolder || '',
    type: file.type || 'output',
  })

  const response = await fetch(`${baseUrl}/view?${params.toString()}`, {
    method: 'GET',
    headers: getComfyHeaders(false),
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)

    throw createError({
      statusCode: 502,
      message: `Comfy video fetch failed: ${response.status} ${
        response.statusText
      }${details ? ` - ${details}` : ''}`,
    })
  }

  const mimeType = getVideoMimeType(file.filename || '')
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return `data:${mimeType};base64,${base64}`
}

function getVideoMimeType(filename = ''): string {
  const normalized = filename.toLowerCase()

  if (normalized.endsWith('.webm')) return 'video/webm'
  if (normalized.endsWith('.mov')) return 'video/quicktime'
  if (normalized.endsWith('.mkv')) return 'video/x-matroska'

  return 'video/mp4'
}

function getComfyHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, video/*, */*',
  }

  const token = process.env.ART_SERVER_PROXY_TOKEN || ''

  if (token) {
    headers['X-Kindrobots-Server-Token'] = token
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
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
