// /server/api/comfy/hunyuan3d.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { getServerEndpoint, resolveServer } from '../../utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'
import { authAndGate } from '../../utils/comfyGate'

type Hunyuan3dRequest = {
  serverId?: number | null
  serverName?: string | null
  apiUrl?: string | null
  imageData?: string | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  resolution?: number | null
  shift?: number | null
  numChunks?: number | null
  octreeResolution?: number | null
  algorithm?: string | null
  threshold?: number | null
  filenamePrefix?: string | null
  timeoutMs?: number | null
  height?: number | null
  width?: number | null
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

const defaultTimeoutMs = 300_000
const pollIntervalMs = 2_000

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Hunyuan3dRequest>(event)

    const gate = await authAndGate(event, {
      engine: 'hunyuan',
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
      capability: 'comfy',
    })

    assertComfyServer(server)

    const baseUrl = body.apiUrl?.trim()
      ? cleanComfyBaseUrl(body.apiUrl)
      : getComfyBaseUrl(server)

    const uploadedImage = await uploadImageToComfy({
      baseUrl,
      imageData: body.imageData,
    })

    const workflow = buildHunyuan3dWorkflow({
      imageName: uploadedImage.name || '',
      seed: body.seed ?? -1,
      steps: body.steps ?? 20,
      cfg: body.cfg ?? 8,
      sampler: body.sampler ?? 'euler',
      scheduler: body.scheduler ?? 'normal',
      denoise: body.denoise ?? 1,
      resolution: body.resolution ?? 3072,
      shift: body.shift ?? 1,
      numChunks: body.numChunks ?? 8000,
      octreeResolution: body.octreeResolution ?? 256,
      algorithm: body.algorithm ?? 'surface net',
      threshold: body.threshold ?? 0.6,
      filenamePrefix: body.filenamePrefix ?? 'mesh/kindrobots_hunyuan3d',
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

    const modelOutput = getFirstModelFile(historyEntry)

    if (!modelOutput?.filename) {
      throw createError({
        statusCode: 502,
        message:
          'Comfy completed but returned no 3D model file. Check SaveGLB output keys in history.',
      })
    }

    const modelData = await fetchComfyFileAsDataUrl(baseUrl, modelOutput)
    const { balance } = await gate.commit(`hunyuan:${promptResponse.prompt_id}`)

    return {
      success: true,
      message: 'Hunyuan3D model generated successfully.',
      promptId: promptResponse.prompt_id,
      queuePosition: promptResponse.number ?? null,
      modelData,
      filename: modelOutput.filename,
      subfolder: modelOutput.subfolder ?? '',
      type: modelOutput.type ?? 'output',
      mimeType: getModelMimeType(modelOutput.filename),
      uploadedImage,
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
      message: handledError.message || 'Failed to generate Hunyuan3D model.',
    }
  }
})

function buildHunyuan3dWorkflow(input: {
  imageName: string
  seed: number
  steps: number
  cfg: number
  sampler: string
  scheduler: string
  denoise: number
  resolution: number
  shift: number
  numChunks: number
  octreeResolution: number
  algorithm: string
  threshold: number
  filenamePrefix: string
}): ComfyWorkflow {
  const seed = resolveSeed(input.seed)

  return {
    '3': {
      inputs: {
        seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ['70', 0],
        positive: ['80', 0],
        negative: ['80', 1],
        latent_image: ['66', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '51': {
      inputs: {
        crop: 'none',
        clip_vision: ['54', 1],
        image: ['56', 0],
      },
      class_type: 'CLIPVisionEncode',
      _meta: {
        title: 'CLIP Vision Encode',
      },
    },
    '54': {
      inputs: {
        ckpt_name: '3d\\hunyuan_3d_v2.1.safetensors',
      },
      class_type: 'ImageOnlyCheckpointLoader',
      _meta: {
        title: 'Image Only Checkpoint Loader',
      },
    },
    '56': {
      inputs: {
        image: input.imageName,
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '61': {
      inputs: {
        num_chunks: input.numChunks,
        octree_resolution: input.octreeResolution,
        samples: ['3', 0],
        vae: ['54', 2],
      },
      class_type: 'VAEDecodeHunyuan3D',
      _meta: {
        title: 'VAEDecodeHunyuan3D',
      },
    },
    '66': {
      inputs: {
        resolution: input.resolution,
        batch_size: 1,
      },
      class_type: 'EmptyLatentHunyuan3Dv2',
      _meta: {
        title: 'EmptyLatentHunyuan3Dv2',
      },
    },
    '70': {
      inputs: {
        shift: input.shift,
        model: ['54', 0],
      },
      class_type: 'ModelSamplingAuraFlow',
      _meta: {
        title: 'ModelSamplingAuraFlow',
      },
    },
    '80': {
      inputs: {
        clip_vision_output: ['51', 0],
      },
      class_type: 'Hunyuan3Dv2Conditioning',
      _meta: {
        title: 'Hunyuan3Dv2Conditioning',
      },
    },
    '81': {
      inputs: {
        algorithm: input.algorithm,
        threshold: input.threshold,
        voxel: ['61', 0],
      },
      class_type: 'VoxelToMesh',
      _meta: {
        title: 'VoxelToMesh',
      },
    },
    '82': {
      inputs: {
        filename_prefix: input.filenamePrefix,
        image: '',
        mesh: ['81', 0],
      },
      class_type: 'SaveGLB',
      _meta: {
        title: 'Save 3D Model',
      },
    },
  }
}

async function uploadImageToComfy(input: {
  baseUrl: string
  imageData: string
}): Promise<UploadedComfyImage> {
  const decoded = decodeImageData(input.imageData)
  const filename = `kindrobots_hunyuan3d_input_${Date.now()}_${crypto.randomUUID()}.${
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
    message: `Hunyuan3D generation timed out after ${input.timeoutMs}ms.`,
  })
}

function getFirstModelFile(
  historyEntry: ComfyHistoryEntry,
): ComfyFileOutput | null {
  const outputs = Object.values(historyEntry.outputs || {})

  for (const output of outputs) {
    const found = findModelFileInValue(output)
    if (found) return found
  }

  return null
}

function findModelFileInValue(value: unknown): ComfyFileOutput | null {
  if (!value) return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findModelFileInValue(item)
      if (found) return found
    }

    return null
  }

  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const filename = record.filename

  if (typeof filename === 'string' && isModelFile(filename)) {
    return {
      filename,
      subfolder: typeof record.subfolder === 'string' ? record.subfolder : '',
      type: typeof record.type === 'string' ? record.type : 'output',
    }
  }

  for (const child of Object.values(record)) {
    const found = findModelFileInValue(child)
    if (found) return found
  }

  return null
}

function isModelFile(filename: string): boolean {
  const normalized = filename.toLowerCase()

  return (
    normalized.endsWith('.glb') ||
    normalized.endsWith('.gltf') ||
    normalized.endsWith('.obj') ||
    normalized.endsWith('.stl')
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
      message: `Comfy model fetch failed: ${response.status} ${
        response.statusText
      }${details ? ` - ${details}` : ''}`,
    })
  }

  const mimeType = getModelMimeType(file.filename || '')
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return `data:${mimeType};base64,${base64}`
}

function getModelMimeType(filename = ''): string {
  const normalized = filename.toLowerCase()

  if (normalized.endsWith('.glb')) return 'model/gltf-binary'
  if (normalized.endsWith('.gltf')) return 'model/gltf+json'
  if (normalized.endsWith('.obj')) return 'model/obj'
  if (normalized.endsWith('.stl')) return 'model/stl'

  return 'application/octet-stream'
}

function getComfyHeaders(
  includeJson = true,
  includeAccept = true,
): HeadersInit {
  const headers: Record<string, string> = {}

  if (includeAccept) {
    headers.Accept = 'application/json, model/gltf-binary, */*'
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
