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
import type { Prisma } from '~/prisma/generated/prisma/client'

// The queueable engines. `openai` is handled synchronously elsewhere.
type EnqueueEngine = 'a1111' | 'comfy' | 'flux' | 'kontext'

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
}

// ComfyEngine used by the mana gate — a1111 shares comfy's base 2D cost.
const GATE_ENGINE: Record<EnqueueEngine, 'comfy' | 'flux' | 'kontext'> = {
  a1111: 'comfy',
  comfy: 'comfy',
  flux: 'flux',
  kontext: 'kontext',
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

function normalizeEngine(value: unknown): EnqueueEngine {
  const engine = String(value || 'a1111').toLowerCase()

  if (
    engine === 'a1111' ||
    engine === 'comfy' ||
    engine === 'flux' ||
    engine === 'kontext'
  ) {
    return engine
  }

  throw createError({
    statusCode: 400,
    message:
      engine === 'openai'
        ? 'OpenAI generation is synchronous; call /api/chats/openai/images/generate instead of enqueuing.'
        : `Unsupported enqueue engine "${engine}". Use a1111, comfy, flux, or kontext.`,
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

    const gate = await authAndGate(event, {
      engine: GATE_ENGINE[engine],
      steps: body?.steps ?? null,
      width: body?.width ?? null,
      height: body?.height ?? null,
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
        payload: payload as unknown as Prisma.InputJsonValue,
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
