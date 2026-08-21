// /server/api/art/enqueue.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { authAndGate } from '../../utils/comfyGate'
import { resolveEnqueueLoraResource } from '../../utils/artLoraResource'
import {
  buildDefaultComfyWorkflow,
  buildSdxlImg2ImgWorkflow,
} from '../comfy/sdxl/utils/workflow'
import { buildFluxWorkflowFromRequest } from '../comfy/flux/utils/workflow'
import { buildKrea2WorkflowFromRequest } from '../comfy/krea2/utils/workflow'
import { buildFlux2KleinWorkflowFromRequest } from '../comfy/flux2/utils/workflow'
import {
  buildKontextWorkflow,
  getKontextImageExtension,
} from '../comfy/kontext/utils/workflow'
import {
  buildLtxImageToVideoWorkflow,
  ltxFrameCount,
} from '../comfy/ltx/utils/imageToVideoWorkflow'
import { normalizeVideoOutputFormat } from '../comfy/utils/videoOutput'
import { applyVideoLoraChain } from '../comfy/utils/videoLoraChain'
import {
  buildWanImageToVideoWorkflow,
  wanFrameCount,
} from '../comfy/wan/utils/imageToVideoWorkflow'
import { assertArtPromptContract } from '../../utils/artPromptContract'
import {
  applyArtFacetsToPayload,
  normalizeArtFacetIds,
  resolveArtFacetSelection,
} from '../../utils/artFacetSelection'
import {
  buildEntityArtPrompt,
  prepareEntityArtEnqueue,
  type EntityArtRequest,
} from '../../utils/entityArt'

const ART_FACET_WORKFLOW_KEY = '__kindRobotsFacetSelection'

type EnqueueEngine =
  | 'a1111'
  | 'comfy'
  | 'sdxl-img2img'
  | 'flux'
  | 'krea2'
  | 'flux2'
  | 'kontext'
  | 'ltx'
  | 'wan'

type JsonRecord = Record<string, unknown>

type NarrativeEnqueueContext = {
  product: 'storybook' | 'taskmaster' | 'davinci'
  sessionId: string
  beatId: string
  moment: string
  dedupeKey: string
}

// brainstorm/t-016: kept separate from NarrativeEnqueueContext rather than
// widening its product union -- that shape's beatId/moment/dedupeKey exist
// for narrative-beat dedup (see narrativeRequest below), which Brainstorm
// candidates have no equivalent of. This is provenance-only: it never gates
// or deduplicates the request, it just gets tagged onto the ArtJob payload
// (mirrors how entityArt/narrativeContext do the same) so the job stays
// traceable back to its BrainstormSession/candidate/source.
type BrainstormEnqueueContext = {
  product: 'brainstorm'
  candidateId: string
  sessionId: number | null
  source?: {
    modelType: string
    id?: number | null
    slug?: string | null
  } | null
}

type ArtEnqueueRequest = {
  engine?: string | null
  promptString?: string | null
  prompt?: string | null
  artPrompt?: string | null
  basePromptString?: string | null
  facetIds?: number[] | null
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
  originalWeight?: number | null
  width?: number | null
  height?: number | null
  variant?: 'dev' | 'schnell' | null
  jsonPrompt?: Record<string, unknown> | unknown[] | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: Array<{
    resourceId?: number | null
    name?: string | null
    strength?: number | null
  }> | null
  checkpointResourceId?: number | null
  loraResourceIds?: number[] | null
  designer?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  serverId?: number | null
  serverName?: string | null
  projectSlug?: string | null
  priority?: number | null
  narrativeContext?: NarrativeEnqueueContext | null
  brainstormContext?: BrainstormEnqueueContext | null
  sourceImageBase64?: string | null
  firstImageBase64?: string | null
  secondImageBase64?: string | null
  durationSeconds?: number | null
  fps?: number | null
  frameRate?: number | null
  loop?: boolean | null
  outputFormat?: string | null
  presetId?: string | null
  renderScale?: number | null
  latentUpscaleModel?: string | null
  refineSampler?: string | null
  refineSigmas?: string | null
  timeoutSeconds?: number | null
  workflow?: Record<string, unknown> | null
  entityArt?: EntityArtRequest | null
}

type SaveBlock = {
  isPublic: boolean
  isMature: boolean
  designer: string | null
}

type QueuedImage = { name: string; imageData: string }

const ENGINE_ALIASES: Record<string, EnqueueEngine> = {
  krea: 'krea2',
  'krea-2': 'krea2',
  'krea2-turbo': 'krea2',
  klein: 'flux2',
  'flux2-klein': 'flux2',
  'flux-2': 'flux2',
  sdxl: 'comfy',
  'sdxl-restyle': 'sdxl-img2img',
  'sdxl-i2i': 'sdxl-img2img',
  'sdxl-image': 'sdxl-img2img',
}
const VIDEO_ENGINES = new Set<EnqueueEngine>(['ltx', 'wan'])
const GATE_ENGINE: Record<
  EnqueueEngine,
  'comfy' | 'flux' | 'kontext' | 'ltx' | 'wan'
> = {
  a1111: 'comfy',
  comfy: 'comfy',
  'sdxl-img2img': 'comfy',
  flux: 'flux',
  krea2: 'comfy',
  flux2: 'comfy',
  kontext: 'kontext',
  ltx: 'ltx',
  wan: 'wan',
}
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/
const DEFAULT_ENQUEUE_PRIORITY = 100
const DEFAULT_ENQUEUE_ENGINE: EnqueueEngine = 'krea2'

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function narrativeRequest(
  body: ArtEnqueueRequest | null,
): NarrativeEnqueueContext | null {
  const raw = asRecord(body?.narrativeContext)
  if (!Object.keys(raw).length) return null

  const product = String(raw.product || '')
  const sessionId = String(raw.sessionId || '').trim()
  const beatId = String(raw.beatId || '').trim()
  const moment = String(raw.moment || '').trim()
  const dedupeKey = String(raw.dedupeKey || '').trim()
  const allowedMoments = new Set([
    'opening',
    'chapter',
    'location',
    'character-introduction',
    'pivotal-event',
    'finale',
  ])

  if (
    product !== 'storybook' &&
    product !== 'taskmaster' &&
    product !== 'davinci'
  ) {
    throw createError({ statusCode: 400, message: 'Invalid narrative product.' })
  }
  if (!sessionId || sessionId.length > 160 || !beatId || beatId.length > 160) {
    throw createError({
      statusCode: 400,
      message: 'Invalid narrative session or beat identity.',
    })
  }
  if (!allowedMoments.has(moment)) {
    throw createError({ statusCode: 400, message: 'Invalid narrative art moment.' })
  }

  const expectedKey = [product, sessionId, beatId, moment].join(':')
  if (dedupeKey !== expectedKey || dedupeKey.length > 400) {
    throw createError({
      statusCode: 400,
      message: 'Invalid narrative art dedupe key.',
    })
  }

  return { product, sessionId, beatId, moment, dedupeKey }
}

function brainstormRequest(
  body: ArtEnqueueRequest | null,
): BrainstormEnqueueContext | null {
  const raw = asRecord(body?.brainstormContext)
  if (!Object.keys(raw).length) return null

  const candidateId = String(raw.candidateId || '').trim()
  if (!candidateId || candidateId.length > 200) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Brainstorm candidate id.',
    })
  }

  const rawSessionId = Number(raw.sessionId)
  const sessionId =
    Number.isInteger(rawSessionId) && rawSessionId > 0 ? rawSessionId : null

  const rawSource = asRecord(raw.source)
  const sourceModelType = String(rawSource.modelType || '').trim()
  const source = sourceModelType
    ? {
        modelType: sourceModelType.slice(0, 80),
        ...(Number.isInteger(Number(rawSource.id)) && Number(rawSource.id) > 0
          ? { id: Number(rawSource.id) }
          : {}),
        ...(typeof rawSource.slug === 'string' && rawSource.slug.trim()
          ? { slug: rawSource.slug.trim().slice(0, 160) }
          : {}),
      }
    : null

  return { product: 'brainstorm', candidateId, sessionId, source }
}

function facetRequest(body: ArtEnqueueRequest | null): {
  facetIds: number[]
  basePromptString: string
} {
  const carrier = asRecord(asRecord(body?.workflow)[ART_FACET_WORKFLOW_KEY])
  const directIds = normalizeArtFacetIds(body?.facetIds)
  const carrierIds = normalizeArtFacetIds(carrier.facetIds)
  return {
    facetIds: directIds.length ? directIds : carrierIds,
    basePromptString: String(
      body?.basePromptString || carrier.basePromptString || '',
    ).trim(),
  }
}

function normalizeEngine(value: unknown): EnqueueEngine {
  const raw = String(value || DEFAULT_ENQUEUE_ENGINE).toLowerCase()
  const engine = ENGINE_ALIASES[raw] ?? raw
  if (
    engine === 'a1111' ||
    engine === 'comfy' ||
    engine === 'sdxl-img2img' ||
    engine === 'flux' ||
    engine === 'krea2' ||
    engine === 'flux2' ||
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
        ? 'OpenAI generation is synchronous; call the OpenAI image endpoint instead.'
        : `Unsupported enqueue engine "${engine}".`,
  })
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as ArtEnqueueRequest | null
    const engine = normalizeEngine(body?.engine)
    const requestedPrompt = String(
      body?.promptString || body?.artPrompt || body?.prompt || '',
    ).trim()
    if (!requestedPrompt) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "promptString".',
      })
    }

    const projectSlug = body?.projectSlug?.trim().toLowerCase() || null
    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }
    const narrativeContext = narrativeRequest(body)
    const brainstormContext = brainstormRequest(body)

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
    const isAdmin = gate.isAdmin
    const entityArt = body?.entityArt
      ? await prepareEntityArtEnqueue(event, prisma, body.entityArt, {
          user: { id: gate.user.id },
          isAdmin,
        })
      : null

    if (
      entityArt?.metadata.mode === 'img2img' &&
      engine !== 'sdxl-img2img' &&
      engine !== 'kontext'
    ) {
      throw createError({
        statusCode: 400,
        message: 'Entity img2img supports SDXL img2img or Kontext.',
      })
    }
    if (
      entityArt?.metadata.mode === 'recreate' &&
      (engine === 'sdxl-img2img' || engine === 'kontext')
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Entity recreation requires a prompt-only engine such as Krea 2.',
      })
    }

    const bodyWithEntityArt: ArtEnqueueRequest | null =
      entityArt?.sourceImageBase64
        ? { ...(body ?? {}), sourceImageBase64: entityArt.sourceImageBase64 }
        : body

    if (narrativeContext) {
      const existingJob = await prisma.artJob.findFirst({
        where: {
          userId: gate.user.id,
          projectSlug,
          status: { notIn: ['FAILED', 'CANCELLED'] },
          payload: {
            contains: `"dedupeKey":"${narrativeContext.dedupeKey}"`,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingJob) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Existing narrative art job reused.',
          statusCode: 200,
          data: {
            jobId: existingJob.id,
            status: existingJob.status,
            deduplicated: true,
            mana: { charged: 0 },
          },
        }
      }
    }

    const resolvedLora = await resolveEnqueueLoraResource({
      body: (bodyWithEntityArt ?? {}) as ArtEnqueueRequest &
        Record<string, unknown>,
      engine,
      userId: gate.user.id,
      isAdmin,
    })
    const resolvedBody = resolvedLora.body as ArtEnqueueRequest

    const requestedFacets = facetRequest(resolvedBody)
    const basePromptString = requestedFacets.basePromptString || requestedPrompt
    const contextualBasePrompt = entityArt
      ? buildEntityArtPrompt(basePromptString, entityArt.target)
      : basePromptString
    const facets = await resolveArtFacetSelection({
      facetIds: requestedFacets.facetIds,
      userId: gate.user.id,
      isAdmin,
      includeMature: Boolean(resolvedBody.isMature),
    })

    const save = {
      isPublic: resolvedBody.isPublic ?? true,
      isMature: resolvedBody.isMature ?? false,
      designer: resolvedBody.designer?.trim() || null,
    }
    const previewPayload: Record<string, unknown> = {}
    const promptString = applyArtFacetsToPayload(
      previewPayload,
      contextualBasePrompt,
      facets,
    )

    assertArtPromptContract({
      prompt: promptString,
      engine,
      steps: resolvedBody.steps ?? null,
      cfg: resolvedBody.cfg ?? null,
    })

    const priority = Number.isInteger(resolvedBody.priority)
      ? Number(resolvedBody.priority)
      : DEFAULT_ENQUEUE_PRIORITY

    const { jobEngine, payload } = buildJobPayload(engine, {
      body: resolvedBody,
      promptString,
      save,
    })
    applyArtFacetsToPayload(payload, contextualBasePrompt, facets)
    if (narrativeContext) payload.narrativeContext = narrativeContext
    if (brainstormContext) payload.brainstormContext = brainstormContext
    if (entityArt) payload.entityArt = entityArt.metadata

    const provenanceResources = {
      checkpointResourceId:
        Number.isInteger(resolvedBody.checkpointResourceId) &&
        Number(resolvedBody.checkpointResourceId) > 0
          ? Number(resolvedBody.checkpointResourceId)
          : null,
      loraResourceIds: resolvedLora.resourceIds,
      checkpointName: resolvedBody.checkpoint?.trim() || null,
      loraNames: resolvedLora.resourceNames,
    }
    if (
      provenanceResources.checkpointResourceId ||
      provenanceResources.loraResourceIds.length ||
      provenanceResources.checkpointName ||
      provenanceResources.loraNames.length
    ) {
      payload.resources = provenanceResources
    }

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
        deduplicated: false,
        mana: { balance, charged: gate.cost },
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to queue art job.',
      statusCode: event.node.res.statusCode,
    }
  }
})

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
    return { jobEngine: 'COMFY', payload: { workflow, promptString, save } }
  }

  if (engine === 'krea2') {
    const { workflow } = buildKrea2WorkflowFromRequest({
      prompt: promptString,
      negativePrompt: body.negativePrompt ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      steps: body.steps ?? null,
      cfg: body.cfg ?? null,
      seed: body.seed ?? null,
      sampler: body.sampler ?? null,
      scheduler: body.scheduler ?? null,
      denoise: body.denoise ?? null,
      loraName: body.loraName ?? null,
      loraStrength: body.loraStrength ?? null,
      loras: body.loras ?? null,
    })
    return { jobEngine: 'COMFY', payload: { workflow, promptString, save } }
  }

  if (engine === 'flux2') {
    const { workflow } = buildFlux2KleinWorkflowFromRequest({
      prompt: promptString,
      jsonPrompt: body.jsonPrompt ?? null,
      negativePrompt: body.negativePrompt ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      steps: body.steps ?? null,
      cfg: body.cfg ?? null,
      seed: body.seed ?? null,
      sampler: body.sampler ?? null,
      scheduler: body.scheduler ?? null,
      denoise: body.denoise ?? null,
      loraName: body.loraName ?? null,
      loraStrength: body.loraStrength ?? null,
      loras: body.loras ?? null,
    })
    return { jobEngine: 'COMFY', payload: { workflow, promptString, save } }
  }

  if (engine === 'sdxl-img2img') {
    const imageData = body.sourceImageBase64?.trim()
    if (!imageData) {
      throw createError({
        statusCode: 400,
        message: 'SDXL img2img restyle requires "sourceImageBase64".',
      })
    }
    const normalizedImageData = imageData.startsWith('data:image/')
      ? imageData
      : `data:image/png;base64,${imageData}`
    const extension = getKontextImageExtension(normalizedImageData)
    const imageName = `kr_sdxl_restyle_${crypto.randomUUID()}.${extension}`
    const { workflow } = buildSdxlImg2ImgWorkflow({
      prompt: promptString,
      negativePrompt: body.negativePrompt ?? null,
      imageName,
      checkpoint: body.checkpoint ?? null,
      cfgValue: body.cfg ?? null,
      steps: body.steps ?? null,
      seed: body.seed ?? null,
      sampler: body.sampler ?? null,
      scheduler: body.scheduler ?? null,
      originalWeight: body.originalWeight ?? null,
      denoise: body.denoise ?? null,
      loraName: body.loraName ?? null,
      loraStrength: body.loraStrength ?? null,
      loras: body.loras ?? null,
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
      loraName: body.loraName ?? null,
      loraStrength: body.loraStrength ?? null,
      loras: body.loras ?? null,
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

  const workflow = buildDefaultComfyWorkflow({
    prompt: promptString,
    negativePrompt: body.negativePrompt ?? '',
    cfgValue: body.cfg ?? 3,
    seed: body.seed ?? null,
    steps: body.steps ?? undefined,
    checkpoint: body.checkpoint ?? null,
    sampler: body.sampler ?? null,
    loraName: body.loraName ?? null,
    loraStrength: body.loraStrength ?? null,
    loras: body.loras ?? null,
    width: body.width ?? null,
    height: body.height ?? null,
  })
  return { jobEngine: 'COMFY', payload: { workflow, promptString, save } }
}

function normalizeVideoImage(raw: string, slot: 'first' | 'last'): QueuedImage {
  const trimmed = raw.trim()
  const normalized = trimmed.startsWith('data:image/')
    ? trimmed
    : `data:image/png;base64,${trimmed}`
  const extension = getKontextImageExtension(normalized)
  return {
    name: `kr_video_${slot}_${crypto.randomUUID()}.${extension}`,
    imageData: normalized,
  }
}

function requireVideoNumber(
  value: number | null | undefined,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw createError({
      statusCode: 400,
      message: `Video generation requires numeric "${field}".`,
    })
  }
  if (value < min || value > max) {
    throw createError({
      statusCode: 400,
      message: `Video "${field}" must be between ${min} and ${max}.`,
    })
  }
  return value
}

function resolveVideoFrames(
  engine: EnqueueEngine,
  body: ArtEnqueueRequest | null | undefined,
): number {
  const fps = requireVideoNumber(body?.fps ?? body?.frameRate, 'fps', 1, 60)
  const duration = requireVideoNumber(
    body?.durationSeconds,
    'durationSeconds',
    0.25,
    30,
  )
  return engine === 'wan'
    ? wanFrameCount(duration, fps)
    : ltxFrameCount(duration, fps)
}

function buildVideoJobPayload(
  engine: 'ltx' | 'wan',
  ctx: { body: ArtEnqueueRequest; promptString: string; save: SaveBlock },
): { jobEngine: 'COMFY'; payload: Record<string, unknown> } {
  const { body, promptString, save } = ctx
  const isWan = engine === 'wan'
  const width = requireVideoNumber(body.width, 'width', 64, 2048)
  const height = requireVideoNumber(body.height, 'height', 64, 2048)
  const frameRate = requireVideoNumber(body.fps ?? body.frameRate, 'fps', 1, 60)
  const duration = requireVideoNumber(
    body.durationSeconds,
    'durationSeconds',
    0.25,
    30,
  )

  if (typeof body.loop !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'Video generation requires boolean "loop".',
    })
  }
  if (!body.outputFormat?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Video generation requires "outputFormat".',
    })
  }
  if (body.negativePrompt == null) {
    throw createError({
      statusCode: 400,
      message: 'Video generation requires explicit "negativePrompt" (empty is allowed).',
    })
  }

  const negativePrompt = body.negativePrompt.trim()
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
      message: 'Video generation needs at least a first image.',
    })
  }

  const loop = body.loop
  const outputFormat = normalizeVideoOutputFormat(body.outputFormat)
  const frames = isWan
    ? wanFrameCount(duration, frameRate)
    : ltxFrameCount(duration, frameRate)
  const renderScale = isWan
    ? 1
    : requireVideoNumber(body.renderScale, 'renderScale', 0.25, 1)
  const latentUpscaleModel = body.latentUpscaleModel?.trim() || null
  const refineSampler = body.refineSampler?.trim() || null
  const refineSigmas = body.refineSigmas?.trim() || null
  const timeoutSeconds =
    body.timeoutSeconds == null
      ? null
      : requireVideoNumber(body.timeoutSeconds, 'timeoutSeconds', 60, 86_400)
  const presetId = body.presetId?.trim() || null

  if (
    !isWan &&
    renderScale < 1 &&
    (!latentUpscaleModel || !refineSampler || !refineSigmas)
  ) {
    throw createError({
      statusCode: 400,
      message:
        'LTX renderScale below 1 requires latentUpscaleModel, refineSampler, and refineSigmas.',
    })
  }

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
        outputFormat,
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
        outputFormat,
        renderScale,
        latentUpscaleModel,
        refineSampler,
        refineSigmas,
      })

  const videoLoras = applyVideoLoraChain(workflow, engine, {
    loras: body.loras,
    loraName: body.loraName,
    loraStrength: body.loraStrength,
  })

  const renderWidth = Math.max(64, Math.round((width * renderScale) / 8) * 8)
  const renderHeight = Math.max(64, Math.round((height * renderScale) / 8) * 8)

  return {
    jobEngine: 'COMFY',
    payload: {
      workflow,
      promptString,
      images,
      media: 'video',
      timeoutSeconds,
      video: {
        model: engine,
        presetId,
        loop,
        fps: frameRate,
        durationSeconds: duration,
        frames,
        width,
        height,
        renderScale,
        renderWidth,
        renderHeight,
        latentUpscaleModel,
        hasFirstImage: Boolean(firstImageName),
        hasLastImage: Boolean(lastImageName),
        hasLora: videoLoras.length > 0,
        loraCount: videoLoras.length,
        loraStrengths: videoLoras.map((lora) => lora.strength),
        outputFormat,
      },
      save,
    },
  }
}
