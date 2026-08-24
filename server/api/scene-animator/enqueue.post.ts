import { defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  SCENE_ANIMATOR_PROJECT_SLUG,
  SCENE_ANIMATOR_PROMPT,
  listSceneAnimatorSourceFiles,
  parseSceneAnimatorContext,
  readSceneAnimatorSource,
  sceneAnimatorConfigKey,
  sceneAnimatorDedupeKey,
  type SceneAnimatorContext,
  type SceneAnimatorRenderConfig,
} from '@/server/utils/sceneAnimator'
import {
  getDefaultVideoPreset,
  getVideoPreset,
  type VideoEngine,
  type VideoPresetId,
} from '@/utils/videoPresets'

type SceneAnimatorEnqueueRequest = {
  folder?: string | null
  engine?: VideoEngine | null
  presetId?: VideoPresetId | null
  durationSeconds?: number | null
  isMature?: boolean | null
  retryFailed?: boolean | null
}

type EnqueueResponse = {
  success: boolean
  message: string
  statusCode: number
  data?: {
    jobId?: number
    status?: string
  }
}

function resolveConfig(body: SceneAnimatorEnqueueRequest): SceneAnimatorRenderConfig {
  const engine: VideoEngine = body.engine === 'ltx' ? 'ltx' : 'wan'
  const requestedPreset = getVideoPreset(body.presetId)
  const preset =
    requestedPreset?.engine === engine ? requestedPreset : getDefaultVideoPreset(engine)
  const requestedDuration = Number(body.durationSeconds)
  const durationSeconds =
    Number.isFinite(requestedDuration) && requestedDuration >= 0.25 && requestedDuration <= 30
      ? requestedDuration
      : preset.durationSeconds

  return {
    engine,
    presetId: preset.id,
    durationSeconds,
    fps: preset.fps,
    width: preset.width,
    height: preset.height,
    outputFormat: preset.outputFormat,
    loop: preset.loop,
    renderScale: preset.renderScale,
    isMature: Boolean(body.isMature),
  }
}

function isReusableStatus(status: string): boolean {
  return status === 'PENDING' || status === 'RUNNING' || status === 'DONE'
}

function contextFromPayload(payload: string): SceneAnimatorContext | null {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    return parseSceneAnimatorContext(parsed.sceneAnimator)
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const body = ((await readBody(event)) ?? {}) as SceneAnimatorEnqueueRequest
  const folder = String(body.folder ?? '').trim()
  const config = resolveConfig(body)
  const preset = getVideoPreset(config.presetId) ?? getDefaultVideoPreset(config.engine)
  const sources = await listSceneAnimatorSourceFiles(folder)
  const configKey = sceneAnimatorConfigKey(config)

  const existingJobs = await prisma.artJob.findMany({
    where: {
      projectSlug: SCENE_ANIMATOR_PROJECT_SLUG,
      payload: { contains: '"sceneAnimator"' },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: { id: true, status: true, payload: true },
  })

  const latestByKey = new Map<string, (typeof existingJobs)[number]>()
  for (const job of existingJobs) {
    const context = contextFromPayload(job.payload)
    if (!context || latestByKey.has(context.dedupeKey)) continue
    latestByKey.set(context.dedupeKey, job)
  }

  const queued: Array<{ sourceFile: string; jobId: number }> = []
  const skipped: Array<{ sourceFile: string; jobId: number | null; reason: string }> = []
  const errors: Array<{ sourceFile: string; message: string }> = []

  for (const source of sources) {
    const dedupeKey = sceneAnimatorDedupeKey(source.hash, config)
    let existing = latestByKey.get(dedupeKey) ?? null

    // Recheck immediately before the expensive enqueue so two open admin tabs are
    // unlikely to duplicate the same active/completed render.
    if (!existing || (!isReusableStatus(existing.status) && body.retryFailed)) {
      const live = await prisma.artJob.findFirst({
        where: {
          projectSlug: SCENE_ANIMATOR_PROJECT_SLUG,
          payload: { contains: `"dedupeKey":"${dedupeKey}"` },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, payload: true },
      })
      if (live) existing = live
    }

    if (existing && isReusableStatus(existing.status)) {
      skipped.push({ sourceFile: source.name, jobId: existing.id, reason: existing.status })
      continue
    }
    if (existing && !body.retryFailed) {
      skipped.push({
        sourceFile: source.name,
        jobId: existing.id,
        reason: `${existing.status}; retry not requested`,
      })
      continue
    }

    try {
      const sourceData = await readSceneAnimatorSource(folder, source.name)
      const context: SceneAnimatorContext = {
        sourceFolder: sourceData.folder,
        sourceFile: sourceData.filename,
        sourceHash: sourceData.hash,
        configKey,
        dedupeKey,
      }
      const firstImageBase64 = `data:${sourceData.mime};base64,${sourceData.bytes.toString('base64')}`

      const response = await event.$fetch<EnqueueResponse, string>('/api/video/generate', {
        method: 'POST',
        body: {
          engine: config.engine,
          presetId: config.presetId,
          promptString: SCENE_ANIMATOR_PROMPT,
          negativePrompt: '',
          firstImageBase64,
          durationSeconds: config.durationSeconds,
          fps: config.fps,
          loop: config.loop,
          width: config.width,
          height: config.height,
          outputFormat: config.outputFormat,
          renderScale: config.renderScale,
          latentUpscaleModel: preset.latentUpscaleModel,
          refineSampler: preset.refineSampler,
          refineSigmas: preset.refineSigmas,
          timeoutSeconds: preset.timeoutSeconds,
          isPublic: false,
          isMature: config.isMature,
          designer: 'Scene Animator',
          projectSlug: SCENE_ANIMATOR_PROJECT_SLUG,
        },
      })

      const jobId = Number(response.data?.jobId)
      if (!response.success || !Number.isInteger(jobId) || jobId <= 0) {
        throw new Error(response.message || 'Video enqueue did not return a valid ArtJob ID.')
      }

      const created = await prisma.artJob.findUnique({
        where: { id: jobId },
        select: { payload: true },
      })
      if (!created) throw new Error(`Queued ArtJob #${jobId} could not be reloaded.`)

      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(created.payload) as Record<string, unknown>
      } catch {
        throw new Error(`Queued ArtJob #${jobId} has invalid payload JSON.`)
      }

      await prisma.artJob.update({
        where: { id: jobId },
        data: {
          payload: JSON.stringify({ ...payload, sceneAnimator: context }),
        },
      })

      queued.push({ sourceFile: source.name, jobId })
      latestByKey.set(dedupeKey, {
        id: jobId,
        status: 'PENDING',
        payload: JSON.stringify({ ...payload, sceneAnimator: context }),
      })
    } catch (error) {
      errors.push({
        sourceFile: source.name,
        message: error instanceof Error ? error.message : 'Unknown enqueue failure.',
      })
    }
  }

  return {
    success: true,
    message: errors.length
      ? `Queued ${queued.length}; ${errors.length} source(s) failed to enqueue.`
      : `Queued ${queued.length}; ${skipped.length} already accounted for.`,
    data: {
      folder,
      config,
      configKey,
      total: sources.length,
      queued,
      skipped,
      errors,
    },
  }
})
