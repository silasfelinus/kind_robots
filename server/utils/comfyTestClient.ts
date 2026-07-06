// /server/utils/comfyTestClient.ts
//
// Direct ComfyUI client for the automated smoke test (server/api/comfy/test/*).
//
// Why this exists separately from flux/generate.post.ts: the smoke test must be
// safe to run repeatedly (CI) WITHOUT charging mana and WITHOUT double-auth over
// an internal HTTP hop. So instead of forwarding to /api/comfy/flux/generate
// (which runs authAndGate -> manaGate and costs currency), the smoke endpoint
// talks to the Comfy server directly with a minimal, known-good flux-schnell
// workflow. The call sequence (POST /prompt -> poll /history -> GET /view) and
// the workflow shape mirror flux/generate.post.ts exactly; this module is kept
// standalone so the production route stays untouched.
import { createError } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { getServerEndpoint } from './serverResolver'

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

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

type ComfyOutputNode = {
  images?: ComfyImageOutput[]
  gifs?: ComfyImageOutput[]
}

type ComfyImageOutput = {
  filename?: string
  subfolder?: string
  type?: string
}

export type ComfySmokeResult = {
  promptId: string
  queuePosition: number | null
  imageData: string
  filename: string
  subfolder: string
  type: string
  baseUrl: string
}

// flux schnell: fast (8 steps), no checkpoint — it loads a GGUF unet, not an
// SDXL checkpoint. This is the smoke default and keeps runs cheap.
const SMOKE_UNET_NAME = 'flux1-schnell-Q8_0.gguf'
const SMOKE_FILENAME_PREFIX = 'kindrobots_comfy_smoke'
const DEFAULT_TIMEOUT_MS = 180_000
const POLL_INTERVAL_MS = 1_500

export function assertComfyServer(server: Server): void {
  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not active.`,
    })
  }

  if (server.serverType !== 'COMFY') {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is ${server.serverType}. This route only supports Comfy servers.`,
    })
  }
}

export function getComfyBaseUrl(server: Server): string {
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

export function getComfyHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, image/*, */*',
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

/**
 * Fetch a Comfy info endpoint (system_stats or queue) and return parsed JSON.
 * Shared by the smoke info route.
 */
export async function fetchComfyInfo(
  baseUrl: string,
  target: 'system' | 'queue',
): Promise<unknown> {
  const path = target === 'system' ? 'system_stats' : 'queue'
  const response = await fetch(`${baseUrl}/${path}`, {
    method: 'GET',
    headers: getComfyHeaders(false),
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)
    throw createError({
      statusCode: 502,
      message: `Comfy ${target} info failed: ${response.status} ${response.statusText}${
        details ? ` - ${details}` : ''
      }`,
    })
  }

  return await response.json()
}

/**
 * Run one flux-schnell generation directly against the Comfy server. No mana,
 * no internal HTTP hop. Returns the image as a data URL plus metadata.
 */
export async function runComfySmokeGeneration(input: {
  server: Server
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  cfg?: number
  guidance?: number
  seed?: number
  sampler?: string
  scheduler?: string
  denoise?: number
  timeoutMs?: number
}): Promise<ComfySmokeResult> {
  const baseUrl = getComfyBaseUrl(input.server)
  const workflow = buildSchnellSmokeWorkflow({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt ?? '',
    width: input.width ?? 512,
    height: input.height ?? 512,
    steps: input.steps ?? 8,
    cfg: input.cfg ?? 1,
    guidance: input.guidance ?? 4,
    seed: input.seed ?? -1,
    sampler: input.sampler ?? 'euler',
    scheduler: input.scheduler ?? 'normal',
    denoise: input.denoise ?? 1,
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
    timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  })

  const imageOutput = getFirstComfyImage(historyEntry)

  if (!imageOutput?.filename) {
    throw createError({
      statusCode: 502,
      message: 'Comfy completed but returned no image output.',
    })
  }

  const imageData = await fetchComfyImageAsDataUrl(baseUrl, imageOutput)

  return {
    promptId: promptResponse.prompt_id,
    queuePosition: promptResponse.number ?? null,
    imageData,
    filename: imageOutput.filename,
    subfolder: imageOutput.subfolder ?? '',
    type: imageOutput.type ?? 'output',
    baseUrl,
  }
}

function buildSchnellSmokeWorkflow(input: {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfg: number
  guidance: number
  seed: number
  sampler: string
  scheduler: string
  denoise: number
}): ComfyWorkflow {
  const samplerSeed = resolveSeed(input.seed)
  const wildcardSeed = resolveSeed(-1)
  const prompt = input.prompt.trim() || 'a friendly test robot, clean concept art'

  return {
    '4': {
      inputs: {
        clip_name1: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: { title: 'DualCLIPLoader' },
    },
    '6': {
      inputs: { width: input.width, height: input.height, batch_size: 1 },
      class_type: 'EmptyLatentImage',
      _meta: { title: 'Empty Latent Image' },
    },
    '7': {
      inputs: { samples: ['52', 0], vae: ['8', 0] },
      class_type: 'VAEDecode',
      _meta: { title: 'VAE Decode' },
    },
    '8': {
      inputs: { vae_name: 'ae.safetensors' },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE' },
    },
    '24': {
      inputs: { unet_name: SMOKE_UNET_NAME },
      class_type: 'UnetLoaderGGUF',
      _meta: { title: 'Unet Loader (GGUF)' },
    },
    '46': {
      inputs: { guidance: input.guidance, conditioning: ['59', 2] },
      class_type: 'FluxGuidance',
      _meta: { title: 'FluxGuidance' },
    },
    '52': {
      inputs: {
        seed: samplerSeed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ['59', 0],
        positive: ['46', 0],
        negative: ['46', 0],
        latent_image: ['6', 0],
      },
      class_type: 'KSampler',
      _meta: { title: 'KSampler' },
    },
    '57': {
      inputs: { filename_prefix: SMOKE_FILENAME_PREFIX, images: ['7', 0] },
      class_type: 'SaveImage',
      _meta: { title: 'Save Image' },
    },
    '59': {
      inputs: {
        wildcard_text: prompt,
        populated_text: prompt,
        mode: 'populate',
        'Select to add LoRA': 'Select the LoRA to add to the text',
        'Select to add Wildcard': 'Select the Wildcard to add to the text',
        seed: wildcardSeed,
        model: ['24', 0],
        clip: ['4', 0],
      },
      class_type: 'ImpactWildcardEncode',
      _meta: { title: 'ImpactWildcardEncode' },
    },
  }
}

async function postComfyPrompt(
  baseUrl: string,
  workflow: ComfyWorkflow,
  clientId: string,
): Promise<ComfyPromptResponse> {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: getComfyHeaders(),
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
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
        message: `Comfy history failed: ${response.status} ${response.statusText}${
          details ? ` - ${details}` : ''
        }`,
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

    await sleep(POLL_INTERVAL_MS)
  }

  throw createError({
    statusCode: 504,
    message: `Comfy generation timed out after ${input.timeoutMs}ms.`,
  })
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

async function fetchComfyImageAsDataUrl(
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
    throw createError({
      statusCode: 502,
      message: `Comfy image fetch failed: ${response.status} ${response.statusText}${
        details ? ` - ${details}` : ''
      }`,
    })
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return `data:${contentType};base64,${base64}`
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

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
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
