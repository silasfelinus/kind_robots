// /server/api/comfy/characterSheet.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { getServerEndpoint, resolveServer } from '../../utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'
import { authAndGate } from '../../utils/comfyGate'

type CharacterSheetRequest = {
  serverId?: number | null
  serverName?: string | null
  apiUrl?: string | null

  prompt?: string | null
  characterName?: string | null
  characterType?: string | null
  characterDescription?: string | null
  designNotes?: string | null
  materialNotes?: string | null
  productionNotes?: string | null
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

const defaultCharacterDescription =
  'A stylized cartoon mimic treasure chest with a sturdy, slightly exaggerated wooden box form and reinforced iron bands. The chest has a hinged lid that opens slightly, revealing a wide mouth lined with large, rounded, evenly spaced teeth that are thick and slightly blunt for manufacturability. The tongue is broad and simple, resting inside the mouth without thin or dangling elements. The eyes are expressive and slightly bulging, positioned on the upper lid, with smooth spherical forms and minimal surface detail. The wood texture is simplified with shallow grooves and chunky plank segmentation rather than fine grain detail. Metal bands and rivets are thick, rounded, and slightly oversized to ensure durability and readability when printed. Four short, squat legs extend from the base, each with a stable, clawed foot designed for balance, avoiding thin or fragile connections. All edges are slightly beveled, avoiding sharp points. The overall silhouette is compact, readable, and slightly chibi-inspired while maintaining a believable chest structure.'

const defaultNegativePrompt =
  'motion blur, depth of field, dramatic lighting, dynamic posing, overlapping elements, cropped figure, cut off body, text, labels, watermark, logo, perspective distortion, inconsistent proportions, inconsistent anatomy, different character in each view, painterly effects, abstraction, messy silhouette, thin strands, sharp spikes, deep undercuts, floating elements, fragile connections, extra limbs, missing limbs, low quality, blurry, noisy background'

const DEFAULT_CHARACTER_SHEET_WIDTH = 1536
const DEFAULT_CHARACTER_SHEET_HEIGHT = 768
const DEFAULT_CHARACTER_SHEET_STEPS = 8
const DEFAULT_CHARACTER_SHEET_CFG = 1
const DEFAULT_CHARACTER_SHEET_GUIDANCE = 4
const DEFAULT_CHARACTER_SHEET_SAMPLER = 'euler'
const DEFAULT_CHARACTER_SHEET_SCHEDULER = 'normal'
const DEFAULT_CHARACTER_SHEET_DENOISE = 1

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CharacterSheetRequest>(event)
    const gate = await authAndGate(event, {
      engine: 'charsheet',
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

    const server = await resolveServer({
      userId: gate.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'comfy',
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

    const prompt =
      body.prompt?.trim() ||
      buildCharacterSheetPrompt({
        characterName: body.characterName,
        characterType: body.characterType,
        characterDescription: body.characterDescription,
        designNotes: body.designNotes,
        materialNotes: body.materialNotes,
        productionNotes: body.productionNotes,
      })

    const workflow = buildCharacterSheetWorkflow({
      prompt,
      negativePrompt: body.negativePrompt ?? defaultNegativePrompt,
      width: body.width ?? DEFAULT_CHARACTER_SHEET_WIDTH,
      height: body.height ?? DEFAULT_CHARACTER_SHEET_HEIGHT,
      steps: body.steps ?? DEFAULT_CHARACTER_SHEET_STEPS,
      cfg: body.cfg ?? DEFAULT_CHARACTER_SHEET_CFG,
      guidance: body.guidance ?? DEFAULT_CHARACTER_SHEET_GUIDANCE,
      seed: body.seed ?? -1,
      wildcardSeed: body.wildcardSeed ?? -1,
      sampler: body.sampler ?? DEFAULT_CHARACTER_SHEET_SAMPLER,
      scheduler: body.scheduler ?? DEFAULT_CHARACTER_SHEET_SCHEDULER,
      denoise: body.denoise ?? DEFAULT_CHARACTER_SHEET_DENOISE,
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
    const { balance } = await gate.commit(
      `charsheet:${promptResponse.prompt_id}`,
    )

    return {
      success: true,
      message: 'Character sheet generated successfully.',
      promptId: promptResponse.prompt_id,
      queuePosition: promptResponse.number ?? null,
      imageData,
      filename: imageOutput.filename,
      subfolder: imageOutput.subfolder ?? '',
      type: imageOutput.type ?? 'output',
      serverId: server.id,
      serverName: server.title,
      baseUrl,
      prompt,
      mana: { balance, charged: gate.cost },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message:
        handledError.message || 'Failed to generate character sheet image.',
    }
  }
})

function buildCharacterSheetPrompt(input: {
  characterName?: string | null
  characterType?: string | null
  characterDescription?: string | null
  designNotes?: string | null
  materialNotes?: string | null
  productionNotes?: string | null
}): string {
  const nameLine = input.characterName?.trim()
    ? `Character name: ${input.characterName.trim()}.`
    : ''

  const typeLine = input.characterType?.trim()
    ? `Character type: ${input.characterType.trim()}.`
    : ''

  const description =
    input.characterDescription?.trim() || defaultCharacterDescription

  const designNotes = input.designNotes?.trim()
    ? `Additional design notes: ${input.designNotes.trim()}`
    : ''

  const materialNotes = input.materialNotes?.trim()
    ? `Material and construction notes: ${input.materialNotes.trim()}`
    : 'No thin strands, no sharp spikes, no deep undercuts, and no floating elements. All features are connected, thickened, and optimized for physical stability and successful 3D printing.'

  const productionNotes = input.productionNotes?.trim()
    ? `Production requirements: ${input.productionNotes.trim()}`
    : 'Render in a clean, highly detailed, sharp style suitable for 3D modeling and 3D printing. Emphasize clear surface forms, readable geometry, and strong silhouette definition. Materials and shapes should be easy to interpret for mesh reconstruction.'

  return [
    'A full 360-degree turnaround character sheet showing the same character in five consistent views: front, 3/4 front, side, 3/4 back, and back, arranged evenly in a horizontal layout.',
    'The character is in a neutral T-pose or relaxed A-pose, perfectly symmetrical and consistent across all views.',
    'Use orthographic projection with no perspective distortion. The entire figure must be fully visible in each view with no cropping or overlap.',
    nameLine,
    typeLine,
    `The character design is: ${description}`,
    designNotes,
    materialNotes,
    productionNotes,
    'Lighting is flat, even studio lighting with minimal shadows. Background is plain white or neutral gray with no environment or props.',
    'Maintain identical proportions, scale, and alignment across all angles.',
    'No motion blur, no depth of field, no dramatic lighting, no dynamic posing, no overlapping elements, no text, no labels, no watermarks.',
    'Strict consistency between all views, identical anatomy and proportions, model sheet layout, character turnaround reference, orthographic character sheet.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildCharacterSheetWorkflow(input: {
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
  const prompt = input.prompt.trim()
  const negativePrompt = input.negativePrompt.trim()

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
        unet_name: 'flux1-schnell-Q8_0.gguf',
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
        filename_prefix: 'kindrobots_character_sheet',
        images: ['7', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
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
      _meta: {
        title: 'ImpactWildcardEncode',
      },
    },
  }
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

function cleanComfyBaseUrl(url: string) {
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
