// /server/api/comfy/kontext/kombine.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import { authAndGate } from '../../../utils/comfyGate'

type KombineGenerateRequest = {
  serverId?: number | null
  serverName?: string | null
  apiUrl?: string | null
  prompt?: string | null
  imageDataA?: string | null
  imageDataB?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  stitchDirection?: 'right' | 'left' | 'up' | 'down' | null
  matchImageSize?: boolean | null
  spacingWidth?: number | null
  spacingColor?: string | null
  filenamePrefix?: string | null
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

type UploadedComfyImage = {
  name?: string
  subfolder?: string
  type?: string
}

type DecodedImage = {
  buffer: Buffer
  mimeType: string
  extension: string
}

const defaultTimeoutMs = 180_000
const pollIntervalMs = 1_500

const DEFAULT_KOMBINE_WIDTH = 768
const DEFAULT_KOMBINE_HEIGHT = 768
const DEFAULT_KOMBINE_STEPS = 20
const DEFAULT_KOMBINE_CFG = 1
const DEFAULT_KOMBINE_GUIDANCE = 2.5
const DEFAULT_KOMBINE_SAMPLER = 'euler'
const DEFAULT_KOMBINE_SCHEDULER = 'simple'
const DEFAULT_KOMBINE_DENOISE = 1

const defaultPrompt =
  'Combine these two source images into one coherent cinematic image, high quality style, elaborate design, gorgeous lighting, maximal detail'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<KombineGenerateRequest>(event)

    const gate = await authAndGate(event, {
      engine: 'kontext',
      steps: body.steps,
      width: body.width,
      height: body.height,
      serverId: body.serverId ?? null,
    })

    const server = await resolveServer({
      userId: gate.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'comfy',
    })

    assertComfyServer(server)

    if (!body.imageDataA?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: imageDataA.',
      })
    }

    if (!body.imageDataB?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: imageDataB.',
      })
    }

    const baseUrl = body.apiUrl?.trim()
      ? cleanComfyBaseUrl(body.apiUrl)
      : getComfyBaseUrl(server)

    const [uploadedA, uploadedB] = await Promise.all([
      uploadImageToComfy({
        baseUrl,
        imageData: body.imageDataA,
        label: 'a',
      }),
      uploadImageToComfy({
        baseUrl,
        imageData: body.imageDataB,
        label: 'b',
      }),
    ])

    const workflow = buildKombineWorkflow({
      prompt: body.prompt?.trim() || defaultPrompt,
      imageNameA: uploadedA.name || '',
      imageNameB: uploadedB.name || '',
      width: body.width ?? DEFAULT_KOMBINE_WIDTH,
      height: body.height ?? DEFAULT_KOMBINE_HEIGHT,
      steps: body.steps ?? DEFAULT_KOMBINE_STEPS,
      cfg: body.cfg ?? DEFAULT_KOMBINE_CFG,
      guidance: body.guidance ?? DEFAULT_KOMBINE_GUIDANCE,
      seed: body.seed ?? -1,
      sampler: body.sampler ?? DEFAULT_KOMBINE_SAMPLER,
      scheduler: body.scheduler ?? DEFAULT_KOMBINE_SCHEDULER,
      denoise: body.denoise ?? DEFAULT_KOMBINE_DENOISE,
      stitchDirection: body.stitchDirection ?? 'right',
      matchImageSize: body.matchImageSize ?? true,
      spacingWidth: body.spacingWidth ?? 0,
      spacingColor: body.spacingColor ?? 'white',
      filenamePrefix: body.filenamePrefix || 'kindrobots_kombine',
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
    const { balance } = await gate.commit(`kombine:${promptResponse.prompt_id}`)

    return {
      success: true,
      message: 'Kombine image generated successfully.',
      promptId: promptResponse.prompt_id,
      queuePosition: promptResponse.number ?? null,
      imageData,
      filename: imageOutput.filename,
      subfolder: imageOutput.subfolder ?? '',
      type: imageOutput.type ?? 'output',
      uploadedImages: {
        imageA: uploadedA,
        imageB: uploadedB,
      },
      serverId: server.id,
      serverName: server.title,
      baseUrl,
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
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate Kombine image.',
    }
  }
})

function buildKombineWorkflow(input: {
  prompt: string
  imageNameA: string
  imageNameB: string
  width: number
  height: number
  steps: number
  cfg: number
  guidance: number
  seed: number
  sampler: string
  scheduler: string
  denoise: number
  stitchDirection: 'right' | 'left' | 'up' | 'down'
  matchImageSize: boolean
  spacingWidth: number
  spacingColor: string
  filenamePrefix: string
}): ComfyWorkflow {
  const seed = resolveSeed(input.seed)

  return {
    '6': {
      inputs: {
        text: input.prompt,
        clip: ['196', 0],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode (Positive Prompt)',
      },
    },
    '8': {
      inputs: {
        samples: ['31', 0],
        vae: ['39', 0],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '31': {
      inputs: {
        seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ['197', 0],
        positive: ['35', 0],
        negative: ['135', 0],
        latent_image: ['124', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '35': {
      inputs: {
        guidance: input.guidance,
        conditioning: ['177', 0],
      },
      class_type: 'FluxGuidance',
      _meta: {
        title: 'FluxGuidance',
      },
    },
    '39': {
      inputs: {
        vae_name: 'ae.safetensors',
      },
      class_type: 'VAELoader',
      _meta: {
        title: 'Load VAE',
      },
    },
    '42': {
      inputs: {
        image: ['146', 0],
      },
      class_type: 'FluxKontextImageScale',
      _meta: {
        title: 'FluxKontextImageScale',
      },
    },
    '124': {
      inputs: {
        pixels: ['42', 0],
        vae: ['39', 0],
      },
      class_type: 'VAEEncode',
      _meta: {
        title: 'VAE Encode',
      },
    },
    '135': {
      inputs: {
        conditioning: ['6', 0],
      },
      class_type: 'ConditioningZeroOut',
      _meta: {
        title: 'ConditioningZeroOut',
      },
    },
    '136': {
      inputs: {
        filename_prefix: input.filenamePrefix,
        images: ['8', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
    '146': {
      inputs: {
        direction: input.stitchDirection,
        match_image_size: input.matchImageSize,
        spacing_width: input.spacingWidth,
        spacing_color: input.spacingColor,
        image1: ['198', 0],
        image2: ['199', 0],
      },
      class_type: 'ImageStitch',
      _meta: {
        title: 'Image Stitch',
      },
    },
    '177': {
      inputs: {
        conditioning: ['6', 0],
        latent: ['124', 0],
      },
      class_type: 'ReferenceLatent',
      _meta: {
        title: 'ReferenceLatent',
      },
    },
    '196': {
      inputs: {
        clip_name1: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
      },
      class_type: 'DualCLIPLoaderGGUF',
      _meta: {
        title: 'DualCLIPLoader (GGUF)',
      },
    },
    '197': {
      inputs: {
        unet_name: 'flux1-kontext-dev-Q5_K_M.gguf',
      },
      class_type: 'UnetLoaderGGUF',
      _meta: {
        title: 'Unet Loader (GGUF)',
      },
    },
    '198': {
      inputs: {
        image: input.imageNameA,
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image A',
      },
    },
    '199': {
      inputs: {
        image: input.imageNameB,
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image B',
      },
    },
  }
}

async function uploadImageToComfy(input: {
  baseUrl: string
  imageData: string
  label: 'a' | 'b'
}): Promise<UploadedComfyImage> {
  const decoded = decodeImageData(input.imageData)
  const filename = `kindrobots_kombine_${input.label}_${Date.now()}_${crypto.randomUUID()}.${
    decoded.extension
  }`

  const arrayBuffer = decoded.buffer.buffer.slice(
    decoded.buffer.byteOffset,
    decoded.buffer.byteOffset + decoded.buffer.byteLength,
  ) as ArrayBuffer

  const formData = new FormData()
  const blob = new Blob([arrayBuffer], {
    type: decoded.mimeType,
  })

  formData.append('image', blob, filename)
  formData.append('type', 'input')
  formData.append('overwrite', 'true')

  const response = await fetch(`${input.baseUrl}/upload/image`, {
    method: 'POST',
    headers: getComfyHeaders(false, false),
    body: formData,
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)

    throw createError({
      statusCode: 502,
      message: `Comfy image upload failed: ${response.status} ${
        response.statusText
      }${details ? ` - ${details}` : ''}`,
    })
  }

  const uploaded = (await response.json()) as UploadedComfyImage

  if (!uploaded?.name) {
    throw createError({
      statusCode: 502,
      message: `Comfy image upload did not return a filename: ${stringifyServerError(
        uploaded,
      )}`,
    })
  }

  return uploaded
}

function decodeImageData(imageData: string): DecodedImage {
  const trimmed = imageData.trim()
  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  const mimeType = match?.[1] || 'image/png'
  const base64 = match?.[2] || trimmed
  const cleanBase64 = base64.replace(/\s/g, '')
  const extension = getImageExtension(mimeType)
  const buffer = Buffer.from(cleanBase64, 'base64')

  if (!buffer.length) {
    throw createError({
      statusCode: 400,
      message: 'imageData could not be decoded.',
    })
  }

  return {
    buffer,
    mimeType,
    extension,
  }
}

function getImageExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase()

  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('gif')) return 'gif'
  if (normalized.includes('bmp')) return 'bmp'

  return 'png'
}

function assertComfyServer(server: Server): void {
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

function getComfyBaseUrl(server: Server): string {
  return cleanComfyBaseUrl(getServerEndpoint(server))
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

function getComfyHeaders(
  includeJson = true,
  includeAccept = true,
): HeadersInit {
  const headers: Record<string, string> = {}

  if (includeAccept) {
    headers.Accept = 'application/json, image/*, */*'
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
