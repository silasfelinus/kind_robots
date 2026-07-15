// /server/api/art/enqueue.post.ts
//
// High-level, engine-dispatching enqueue endpoint. This is the single surface
// the browser art flow (stores/artStore.ts) posts to: it charges mana, builds
// the correct ArtJob payload for the requested engine, and creates a durable
// ArtJob. The home relay agent then claims the job outward, renders it against
// local A1111/Comfy, uploads via /api/art/save-generated, and completes it —
// so generation works even though the deployed backend cannot reach the home
// GPU box. Poll /api/art/queue/:id until DONE, then load the ArtImage.
//
// Distinct from POST /api/art/queue (the low-level producer surface used by
// conductor scripts with pre-built payloads and no mana gate). Browser/billed
// work must go through here so mana is charged exactly once, at enqueue time.
//
// The payload carries a `save` block (isPublic/isMature/designer); the complete
// endpoint applies it plus ownership by the enqueuing user to the uploaded
// ArtImage, since the relay uploads as its own machine user.
//
// OpenAI is intentionally NOT handled here — the backend reaches OpenAI
// directly (no relay needed), so the browser keeps calling the synchronous
// /api/chats/openai/images/generate for that engine.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { authAndGate } from '../../utils/comfyGate'
import { buildDefaultComfyWorkflow } from '../comfy/sdxl/utils/workflow'
import { buildFluxWorkflowFromRequest } from '../comfy/flux/utils/workflow'
import {
  buildKontextWorkflow,
  getKontextImageExtension,
} from '../comfy/kontext/utils/workflow'
import {
  buildLtxImageToVideoWorkflow,
  ltxFrameCount,
  LTX_DEFAULT_WIDTH,
  LTX_DEFAULT_HEIGHT,
  LTX_DEFAULT_DURATION,
  LTX_DEFAULT_FRAME_RATE,
} from '../comfy/ltx/utils/imageToVideoWorkflow'
import {
  buildWanImageToVideoWorkflow,
  wanFrameCount,
  WAN_DEFAULT_WIDTH,
  WAN_DEFAULT_HEIGHT,
  WAN_DEFAULT_DURATION,
  WAN_DEFAULT_FRAME_RATE,
} from '../comfy/wan/utils/imageToVideoWorkflow'

// The queueable engines. `openai` is handled synchronously elsewhere.
// `ltx` and `wan` are image-to-video engines (media: 'video').
type EnqueueEngine = 'a1111' | 'comfy' | 'flux' | 'kontext' | 'ltx' | 'wan'

const VIDEO_ENGINES = new Set<EnqueueEngine>(['ltx', 'wan'])

// Sensible negative prompt for video so callers can omit it.
const DEFAULT_VIDEO_NEGATIVE =
  'low quality, blurry, distorted, jittery, flickering, watermark, text, logo'

// GenerateArtData-shaped body (a superset; only the fields used per engine are
// read). Mirrors stores/artStore.ts GenerateArtData.
type ArtEnqueueRequest = {
  engine?: string | null
  promptString?: string | null
  prompt?: string | null
  artPrompt?: string | null
  negativePrompt?: string | null
  checkpoint?: string | null
  sampler?: string | null
  scheduler?: string | null
  steps?: number | null
  cfg?: number | null
  cfgHalf?: boolean | null
  guidance?: number | null
  denoise?: number | null
  seed?: number | null
  width?: number | null
  height?: number | null
  variant?: 'dev' | 'schnell' | null
  designer?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  serverId?: number | null
  serverName?: string | null
  projectSlug?: string | null
  priority?: number | null
  // Kontext (image-to-image) source.
  sourceImageBase64?: string | null
  // Video (ltx / wan) inputs. Both images optional; if neither is given the
  // engine falls back to a text-driven clip.
  firstImageBase64?: string | null
  secondImageBase64?: string | null
  durationSeconds?: number | null
  fps?: number | null
  frameRate?: number | null
  loop?: boolean | null
}

// ComfyEngine used by the mana gate — a1111 shares comfy's base 2D cost, and
// the video engines bill against their own cost tiers.
const GATE_ENGINE: Record<
  EnqueueEngine,
  'comfy' | 'flux' | 'kontext' | 'ltx' | 'wan'
> = {
  a1111: 'comfy',
  comfy: 'comfy',
  flux: 'flux',
  kontext: 'kontext',
  ltx: 'ltx',
  wan: 'wan',
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

function normalizeEngine(value: unknown): EnqueueEngine {
  const engine = String(value || 'a1111').toLowerCase()

  if (
    engine === 'a1111' ||
    engine === 'comfy' ||
    engine === 'flux' ||
    engine === 'kontext' ||
    engine === 'ltx' ||
    engine === 'wan'
  ) {
    return engine
  }

  throw createError({
    statusCode: 400,
    message:
      engine === 'openai'
        ? 'OpenAI generation is synchronous; call /api/chats/openai/images/generate instead of enqueuing.'
        : `Unsupported enqueue engine "${engine}". Use a1111, comfy, flux, kontext, ltx, or wan.`,
  })
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as ArtEnqueueRequest | null

    const engine = normalizeEngine(body?.engine)

    const promptString = (
      body?.promptString ||
      body?.artPrompt ||
      body?.prompt ||
      ''
    ).trim()

    if (!promptString) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    // Video clips bill by frame count (duration × fps), so heavier clips cost
    // more mana. Non-video engines leave this null and bill per-image.
    const videoFrames = VIDEO_ENGINES.has(engine)
      ? resolveVideoFrames(engine, body)
      : null

    const gate = await authAndGate(event, {
      engine: GATE_ENGINE[engine],
      steps: body?.steps ?? null,
      width: body?.width ?? null,
      height: body?.height ?? null,
      frames: videoFrames,
      serverId: body?.serverId ?? null,
    })

    const projectSlug = body?.projectSlug?.trim().toLowerCase() || null

    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }

    const priority = Number.isInteger(body?.priority)
      ? Number(body?.priority)
      : 0

    const save = {
      isPublic: body?.isPublic ?? true,
      isMature: body?.isMature ?? false,
      designer: body?.designer?.trim() || null,
    }

    const { jobEngine, payload } = buildJobPayload(engine, {
      body: body ?? {},
      promptString,
      save,
    })

    const job = await prisma.artJob.create({
      data: {
        engine: jobEngine,
        payload: JSON.stringify(payload),
        priority,
        projectSlug,
        userId: gate.user.id,
      },
    })

    const { balance } = await gate.commit(`art-enqueue:${job.id}`)

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Art job queued. Poll /api/art/queue/:id until DONE.',
      statusCode: 201,
      data: {
        jobId: job.id,
        status: job.status,
        mana: { balance, charged: gate.cost },
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to queue art job.',
      statusCode,
    }
  }
})

type SaveBlock = {
  isPublic: boolean
  isMature: boolean
  designer: string | null
}

// Build the ArtJob engine + payload for the resolved generation engine. A1111
// jobs carry raw txt2img params; Comfy-family jobs carry a prebuilt workflow.
function buildJobPayload(
  engine: EnqueueEngine,
  ctx: { body: ArtEnqueueRequest; promptString: string; save: SaveBlock },
): { jobEngine: 'A1111' | 'COMFY'; payload: Record<string, unknown> } {
  const { body, promptString, save } = ctx

  if (engine === 'a1111') {
    return {
      jobEngine: 'A1111',
      payload: {
        promptString,
        negativePrompt: body.negativePrompt ?? '',
        steps: body.steps ?? null,
        cfg: body.cfg ?? null,
        cfgHalf: body.cfgHalf ?? false,
        width: body.width ?? null,
        height: body.height ?? null,
        sampler: body.sampler ?? null,
        seed: body.seed ?? null,
        checkpoint: body.checkpoint ?? null,
        save,
      },
    }
  }

  if (engine === 'ltx' || engine === 'wan') {
    return buildVideoJobPayload(engine, ctx)
  }

  if (engine === 'flux') {
    const { workflow } = buildFluxWorkflowFromRequest({
      variant: body.variant ?? null,
      prompt: promptString,
      negativePrompt: body.negativePrompt ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      steps: body.steps ?? null,
      cfg: body.cfg ?? null,
      guidance: body.guidance ?? null,
      seed: body.seed ?? null,
      sampler: body.sampler ?? null,
      scheduler: body.scheduler ?? null,
      denoise: body.denoise ?? null,
    })

    return {
      jobEngine: 'COMFY',
      payload: { workflow, promptString, save },
    }
  }

  if (engine === 'kontext') {
    const imageData = body.sourceImageBase64?.trim()

    if (!imageData) {
      throw createError({
        statusCode: 400,
        message: 'Kontext generation requires "sourceImageBase64".',
      })
    }

    const normalizedImageData = imageData.startsWith('data:image/')
      ? imageData
      : `data:image/png;base64,${imageData}`

    const extension = getKontextImageExtension(normalizedImageData)
    const imageName = `kr_kontext_queue_${crypto.randomUUID()}.${extension}`

    const workflow = buildKontextWorkflow({
      prompt: promptString,
      imageName,
      width: body.width ?? null,
      height: body.height ?? null,
      steps: body.steps ?? null,
      guidance: body.guidance ?? null,
      seed: body.seed ?? null,
      sampler: body.sampler ?? null,
      scheduler: body.scheduler ?? null,
      denoise: body.denoise ?? null,
    })

    return {
      jobEngine: 'COMFY',
      payload: {
        workflow,
        promptString,
        images: [{ name: imageName, imageData: normalizedImageData }],
        save,
      },
    }
  }

  // comfy (default SDXL/SD graph)
  const workflow = buildDefaultComfyWorkflow({
    prompt: promptString,
    negativePrompt: body.negativePrompt ?? '',
    cfgValue: body.cfg ?? 3,
    seed: body.seed ?? null,
    steps: body.steps ?? undefined,
    checkpoint: body.checkpoint ?? null,
    sampler: body.sampler ?? null,
  })

  return {
    jobEngine: 'COMFY',
    payload: { workflow, promptString, save },
  }
}

// A named image the relay uploads to Comfy before running the workflow.
type QueuedImage = { name: string; imageData: string }

function normalizeVideoImage(raw: string, slot: 'first' | 'last'): QueuedImage {
  const trimmed = raw.trim()
  const normalized = trimmed.startsWith('data:image/')
    ? trimmed
    : `data:image/png;base64,${trimmed}`
  const extension = getKontextImageExtension(normalized)
  const name = `kr_video_${slot}_${crypto.randomUUID()}.${extension}`

  return { name, imageData: normalized }
}

// Resolve the requested clip length into concrete frames for the target engine.
// Used both for mana billing (before the payload is built) and inside the
// payload builder, so keep it pure and cheap.
function resolveVideoFrames(
  engine: EnqueueEngine,
  body: ArtEnqueueRequest | null | undefined,
): number {
  const fps = clampNumber(
    body?.fps ?? body?.frameRate,
    engine === 'wan' ? WAN_DEFAULT_FRAME_RATE : LTX_DEFAULT_FRAME_RATE,
    1,
    60,
  )
  const duration = clampNumber(
    body?.durationSeconds,
    engine === 'wan' ? WAN_DEFAULT_DURATION : LTX_DEFAULT_DURATION,
    0.25,
    30,
  )

  return engine === 'wan'
    ? wanFrameCount(duration, fps)
    : ltxFrameCount(duration, fps)
}

function clampNumber(
  value: number | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, n))
}

// Build a COMFY ArtJob payload for an image-to-video engine (ltx | wan). The
// payload mirrors the kontext queue contract — a `workflow` plus a named
// `images` array the relay uploads first — and adds a `media: 'video'` marker
// plus the clip settings so the relay/save path can treat the output as video.
function buildVideoJobPayload(
  engine: 'ltx' | 'wan',
  ctx: { body: ArtEnqueueRequest; promptString: string; save: SaveBlock },
): { jobEngine: 'COMFY'; payload: Record<string, unknown> } {
  const { body, promptString, save } = ctx
  const isWan = engine === 'wan'

  const width = clampNumber(
    body.width,
    isWan ? WAN_DEFAULT_WIDTH : LTX_DEFAULT_WIDTH,
    64,
    2048,
  )
  const height = clampNumber(
    body.height,
    isWan ? WAN_DEFAULT_HEIGHT : LTX_DEFAULT_HEIGHT,
    64,
    2048,
  )
  const frameRate = clampNumber(
    body.fps ?? body.frameRate,
    isWan ? WAN_DEFAULT_FRAME_RATE : LTX_DEFAULT_FRAME_RATE,
    1,
    60,
  )
  const duration = clampNumber(
    body.durationSeconds,
    isWan ? WAN_DEFAULT_DURATION : LTX_DEFAULT_DURATION,
    0.25,
    30,
  )
  const negativePrompt = body.negativePrompt?.trim() || DEFAULT_VIDEO_NEGATIVE

  const images: QueuedImage[] = []
  let firstImageName: string | null = null
  let lastImageName: string | null = null

  if (body.firstImageBase64?.trim()) {
    const first = normalizeVideoImage(body.firstImageBase64, 'first')
    firstImageName = first.name
    images.push(first)
  }

  if (body.secondImageBase64?.trim()) {
    const last = normalizeVideoImage(body.secondImageBase64, 'last')
    lastImageName = last.name
    images.push(last)
  }

  if (!firstImageName) {
    throw createError({
      statusCode: 400,
      message:
        'Video generation needs at least a first image. Send "firstImageBase64".',
    })
  }

  const loop = Boolean(body.loop)
  const frames = isWan
    ? wanFrameCount(duration, frameRate)
    : ltxFrameCount(duration, frameRate)

  const workflow = isWan
    ? buildWanImageToVideoWorkflow({
        prompt: promptString,
        negativePrompt,
        firstImageName,
        lastImageName,
        width,
        height,
        duration,
        frameRate,
        seed: body.seed ?? null,
        steps: body.steps ?? null,
        cfg: body.cfg ?? null,
        sampler: body.sampler ?? null,
        scheduler: body.scheduler ?? null,
      })
    : buildLtxImageToVideoWorkflow({
        prompt: promptString,
        negativePrompt,
        firstImageName,
        lastImageName,
        width,
        height,
        duration,
        frameRate,
        seed: body.seed ?? null,
        steps: body.steps ?? null,
        cfg: body.cfg ?? null,
        sampler: body.sampler ?? null,
      })

  return {
    jobEngine: 'COMFY',
    payload: {
      workflow,
      promptString,
      images,
      // Marks this ArtJob as video so the relay/save path stores the output as
      // a clip (mp4/webm) rather than a still. The relay reads `video` for the
      // playback hints (loop, fps, duration, frame count).
      media: 'video',
      video: {
        model: engine,
        loop,
        fps: frameRate,
        durationSeconds: duration,
        frames,
        width,
        height,
        hasFirstImage: Boolean(firstImageName),
        hasLastImage: Boolean(lastImageName),
      },
      save,
    },
  }
}
