// /server/api/comfy/fluxDev/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'

type FluxDevGenerateRequest = {
  serverId?: number | null
  serverName?: string | null
  prompt?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  seed?: number | null
  wildcardSeed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
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

type ComfyOutputNode = {
  images?: ComfyImageOutput[]
  gifs?: ComfyImageOutput[]
}

type ComfyImageOutput = {
  filename?: string
  subfolder?: string
  type?: string
}

const defaultTimeoutMs = 180_000
const pollIntervalMs = 1_500

const defaultPrompt =
  'an evil magician, holding a magic wand, the magic wand creates the big words:"FLUX GGUF 🔥" appear, professional cartoon movie cover, epic scenery, eyes looking straight, ultra detailed, best movie effects, best quality, ultra professional, magic particles, colorful, midjourneyv6.1, detailmaximizer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<FluxDevGenerateRequest>(event)

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

    const server = await resolveServer({
      userId: user.id,
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

    const baseUrl = getComfyBaseUrl(server)
    const prompt = body.prompt?.trim() || defaultPrompt
    const workflow = buildFluxDevWorkflow({
      prompt,
      negativePrompt: body.negativePrompt ?? '',
      width: body.width ?? server.defaultWidth ?? 1024,
      height: body.height ?? server.defaultHeight ?? 512,
      steps: body.steps ?? server.defaultSteps ?? 30,
      cfg: body.cfg ?? server.defaultCfg ?? 1,
      guidance: body.guidance ?? 4,
      seed: body.seed ?? -1,
      wildcardSeed: body.wildcardSeed ?? -1,
      sampler: body.sampler ?? server.defaultSampler ?? 'euler',
      scheduler: body.scheduler ?? server.defaultScheduler ?? 'normal',
      denoise: body.denoise ?? 1,
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

    const imageOutput = getFirstComfyImage(historyEntry)

    if (!imageOutput?.filename) {
      throw createError({
        statusCode: 502,
        message: 'Comfy completed but returned no image output.',
      })
    }

    const imageData = await fetchComfyImageAsDataUrl(baseUrl, imageOutput)

    return {
      success: true,
      message: 'Flux Dev image generated successfully.',
      promptId: promptResponse.prompt_id,
      queuePosition: promptResponse.number ?? null,
      imageData,
      filename: imageOutput.filename,
      subfolder: imageOutput.subfolder ?? '',
      type: imageOutput.type ?? 'output',
      serverId: server.id,
      serverName: server.title,
      baseUrl,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate Flux Dev image.',
    }
  }
})

function buildFluxDevWorkflow(input: {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfg: number
  guidance: number
  seed: number
  wildcardSeed: number
  sampler: string
  scheduler: string
  denoise: number
}): ComfyWorkflow {
  const samplerSeed = resolveSeed(input.seed)
  const wildcardSeed = resolveSeed(input.wildcardSeed)

  return {
    '4': {
      inputs: {
        clip_name1: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: {
        title: 'DualCLIPLoader',
      },
    },
    '6': {
      inputs: {
        width: input.width,
        height: input.height,
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
      _meta: {
        title: 'Empty Latent Image',
      },
    },
    '7': {
      inputs: {
        samples: ['52', 0],
        vae: ['8', 0],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '8': {
      inputs: {
        vae_name: 'ae.safetensors',
      },
      class_type: 'VAELoader',
      _meta: {
        title: 'Load VAE',
      },
    },
    '24': {
      inputs: {
        unet_name: 'flux1-dev-Q8_0.gguf',
      },
      class_type: 'UnetLoaderGGUF',
      _meta: {
        title: 'Unet Loader (GGUF)',
      },
    },
    '46': {
      inputs: {
        guidance: input.guidance,
        conditioning: ['59', 2],
      },
      class_type: 'FluxGuidance',
      _meta: {
        title: 'FluxGuidance',
      },
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
      _meta: {
        title: 'KSampler',
      },
    },
    '57': {
      inputs: {
        filename_prefix: 'kindrobots_flux_dev',
        images: ['7', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
    '59': {
      inputs: {
        wildcard_text: input.prompt,
        populated_text: input.prompt,
        mode: 'populate',
        'Select to add LoRA': 'Select the LoRA to add to the text',
        'Select to add Wildcard': 'Select the Wildcard to add to the text',
        seed: wildcardSeed,
        model: ['24', 0],
        clip: ['4', 0],
      },
      class_type: 'ImpactWildcardEncode',
      _meta: {
        title: 'ImpactWildcardEncode',
      },
    },
  }
}

function getComfyBaseUrl(server: {
  backendBaseUrl?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  defaultTransport?: string | null
}) {
  const endpoint = getServerEndpoint(server as never, 'backend')
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
      message: `Comfy image fetch failed: ${response.status} ${
        response.statusText
      }${details ? ` - ${details}` : ''}`,
    })
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return `data:${contentType};base64,${base64}`
}

function getComfyHeaders(includeJson = true): HeadersInit {
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
