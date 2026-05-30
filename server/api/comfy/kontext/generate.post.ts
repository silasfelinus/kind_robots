// /server/api/comfy/kontext/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'
import { authAndGate } from '../../../utils/comfyGate'

type KontextGenerateRequest = {
  serverId?: number | null
  serverName?: string | null
  apiUrl?: string | null
  prompt?: string | null
  imageData?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  guidance?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  detailAmount?: number | null
  detailStart?: number | null
  detailEnd?: number | null
  detailBias?: number | null
  detailExponent?: number | null
  detailStartOffset?: number | null
  detailEndOffset?: number | null
  detailFade?: number | null
  detailSmooth?: boolean | null
  cfgScaleOverride?: number | null
  maxShift?: number | null
  baseShift?: number | null
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

const defaultPrompt =
  'The girl wearing blue cargo pants is sitting on a mossy rock in a sun-dappled forest, carefully sketching a detailed leaf in her notebook.'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<KontextGenerateRequest>(event)

    const gate = await authAndGate(event, {
      engine: 'kontext',
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

    if (!body.imageData?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: imageData.',
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

    const prompt = body.prompt?.trim() || defaultPrompt
    const uploadedImage = await uploadImageToComfy({
      baseUrl,
      imageData: body.imageData,
    })

    const workflow = buildKontextWorkflow({
      prompt,
      imageName: uploadedImage.name || '',
      width: body.width ?? server.defaultWidth ?? 768,
      height: body.height ?? server.defaultHeight ?? 768,
      steps: body.steps ?? server.defaultSteps ?? 20,
      guidance: body.guidance ?? 2.5,
      seed: body.seed ?? -1,
      sampler: body.sampler ?? server.defaultSampler ?? 'res_multistep',
      scheduler: body.scheduler ?? server.defaultScheduler ?? 'sgm_uniform',
      denoise: body.denoise ?? 1,
      detailAmount: body.detailAmount ?? 0.06,
      detailStart: body.detailStart ?? 0.3,
      detailEnd: body.detailEnd ?? 0.7,
      detailBias: body.detailBias ?? 0.5,
      detailExponent: body.detailExponent ?? 1,
      detailStartOffset: body.detailStartOffset ?? 0,
      detailEndOffset: body.detailEndOffset ?? 0,
      detailFade: body.detailFade ?? 0,
      detailSmooth: body.detailSmooth ?? true,
      cfgScaleOverride: body.cfgScaleOverride ?? 0,
      maxShift: body.maxShift ?? 1.15,
      baseShift: body.baseShift ?? 0.5,
      filenamePrefix: body.filenamePrefix || 'kindrobots_kontext',
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

    const { balance } = await gate.commit(`kontext:${promptResponse.prompt_id}`)

    return {
      success: true,
      message: 'Flux Kontext image generated successfully.',
      data: {
        promptId: promptResponse.prompt_id,
        queuePosition: promptResponse.number ?? null,
        imageData,
        filename: imageOutput.filename,
        subfolder: imageOutput.subfolder ?? '',
        type: imageOutput.type ?? 'output',
        uploadedImage,
        serverId: server.id,
        serverName: server.title,
        baseUrl,
        mana: { balance, charged: gate.cost },
      },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate Flux Kontext image.',
    }
  }
})

function buildKontextWorkflow(input: {
  prompt: string
  imageName: string
  width: number
  height: number
  steps: number
  guidance: number
  seed: number
  sampler: string
  scheduler: string
  denoise: number
  detailAmount: number
  detailStart: number
  detailEnd: number
  detailBias: number
  detailExponent: number
  detailStartOffset: number
  detailEndOffset: number
  detailFade: number
  detailSmooth: boolean
  cfgScaleOverride: number
  maxShift: number
  baseShift: number
  filenamePrefix: string
}): ComfyWorkflow {
  const seed = resolveSeed(input.seed)

  return {
    '6': {
      inputs: {
        text: input.prompt,
        clip: ['11', 0],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode (Positive Prompt)',
      },
    },
    '8': {
      inputs: {
        samples: ['13', 0],
        vae: ['10', 0],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '9': {
      inputs: {
        filename_prefix: input.filenamePrefix,
        images: ['8', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
    '10': {
      inputs: {
        vae_name: 'ae.safetensors',
      },
      class_type: 'VAELoader',
      _meta: {
        title: 'Load VAE',
      },
    },
    '11': {
      inputs: {
        clip_name1: 't5xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: {
        title: 'DualCLIPLoader',
      },
    },
    '13': {
      inputs: {
        noise: ['25', 0],
        guider: ['22', 0],
        sampler: ['60', 0],
        sigmas: ['17', 0],
        latent_image: ['27', 0],
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: {
        title: 'SamplerCustomAdvanced',
      },
    },
    '16': {
      inputs: {
        sampler_name: input.sampler,
      },
      class_type: 'KSamplerSelect',
      _meta: {
        title: 'KSamplerSelect',
      },
    },
    '17': {
      inputs: {
        scheduler: input.scheduler,
        steps: input.steps,
        denoise: input.denoise,
        model: ['30', 0],
      },
      class_type: 'BasicScheduler',
      _meta: {
        title: 'BasicScheduler',
      },
    },
    '22': {
      inputs: {
        model: ['30', 0],
        conditioning: ['42', 0],
      },
      class_type: 'BasicGuider',
      _meta: {
        title: 'BasicGuider',
      },
    },
    '25': {
      inputs: {
        noise_seed: seed,
      },
      class_type: 'RandomNoise',
      _meta: {
        title: 'RandomNoise',
      },
    },
    '26': {
      inputs: {
        guidance: input.guidance,
        conditioning: ['6', 0],
      },
      class_type: 'FluxGuidance',
      _meta: {
        title: 'FluxGuidance',
      },
    },
    '27': {
      inputs: {
        width: input.width,
        height: input.height,
        batch_size: 1,
      },
      class_type: 'EmptySD3LatentImage',
      _meta: {
        title: 'EmptySD3LatentImage',
      },
    },
    '30': {
      inputs: {
        max_shift: input.maxShift,
        base_shift: input.baseShift,
        width: input.width,
        height: input.height,
        model: ['59', 0],
      },
      class_type: 'ModelSamplingFlux',
      _meta: {
        title: 'ModelSamplingFlux',
      },
    },
    '39': {
      inputs: {
        pixels: ['40', 0],
        vae: ['10', 0],
      },
      class_type: 'VAEEncode',
      _meta: {
        title: 'VAE Encode',
      },
    },
    '40': {
      inputs: {
        image: ['41', 0],
      },
      class_type: 'FluxKontextImageScale',
      _meta: {
        title: 'FluxKontextImageScale',
      },
    },
    '41': {
      inputs: {
        image: input.imageName,
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '42': {
      inputs: {
        conditioning: ['26', 0],
        latent: ['39', 0],
      },
      class_type: 'ReferenceLatent',
      _meta: {
        title: 'ReferenceLatent',
      },
    },
    '59': {
      inputs: {
        unet_name: 'flux1-kontext-dev-Q5_K_M.gguf',
      },
      class_type: 'UnetLoaderGGUF',
      _meta: {
        title: 'Unet Loader (GGUF)',
      },
    },
    '60': {
      inputs: {
        detail_amount: input.detailAmount,
        start: input.detailStart,
        end: input.detailEnd,
        bias: input.detailBias,
        exponent: input.detailExponent,
        start_offset: input.detailStartOffset,
        end_offset: input.detailEndOffset,
        fade: input.detailFade,
        smooth: input.detailSmooth,
        cfg_scale_override: input.cfgScaleOverride,
        sampler: ['16', 0],
      },
      class_type: 'DetailDaemonSamplerNode',
      _meta: {
        title: 'Detail Daemon Sampler',
      },
    },
  }
}

async function uploadImageToComfy(input: {
  baseUrl: string
  imageData: string
}): Promise<UploadedComfyImage> {
  const decoded = decodeImageData(input.imageData)
  const filename = `kindrobots_kontext_${Date.now()}_${crypto.randomUUID()}.${decoded.extension}`
  const formData = new FormData()
  const arrayBuffer = decoded.buffer.buffer.slice(
    decoded.buffer.byteOffset,
    decoded.buffer.byteOffset + decoded.buffer.byteLength,
  ) as ArrayBuffer

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
