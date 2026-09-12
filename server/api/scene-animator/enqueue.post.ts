import { defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  SCENE_ANIMATOR_PROJECT_SLUG,
  SCENE_ANIMATOR_NEGATIVE_PROMPT,
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
import {
  readSceneAnimatorPrompts,
  resolveScenePrompt,
} from '@/server/utils/sceneAnimatorPromptStore'

type SceneAnimatorEnqueueRequest = {
  folder?: string | null
  engine?: VideoEngine | null
  presetId?: VideoPresetId | null
  durationSeconds?: number | null
  isMature?: boolean | null
  retryFailed?: boolean | null
  // Scopes the whole batch loop below to one file -- a per-card "retry this
  // one" action, as opposed to retryFailed's "retry every failed source in
  // the folder." Exact filename match against listSceneAnimatorSourceFiles;
  // anything else falls through to the normal empty-queue response.
  sourceFile?: string | null
  // Re-render a source whose latest job already finished.
  //
  // Without this there is NO way to ask for a finished scene again: DONE is a
  // reusable status, so the dedupe skips it before `retryFailed` is ever
  // consulted, and retryFailed therefore only ever rescues FAILED/CANCELLED.
  // That is fine while a finished render is by definition the render you
  // wanted, and wrong the moment it isn't -- the 2026-09-11 offload bug left
  // every completed Scene Animator clip as a flattened still, DONE and
  // unreachable from the admin surface (Silas: "We should be able to resubmit
  // from the scene-animator window").
  //
  // Deliberately does NOT override an ACTIVE job: see isActiveStatus below.
  force?: boolean | null
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

/**
 * Queued or mid-render, and therefore never worth a second job.
 *
 * This is the half of isReusableStatus that `force` must still respect. The
 * relay renders one job at a time on a single GPU, so duplicating an in-flight
 * render does not produce a result any sooner -- it just puts a second job in
 * front of everything else in the queue. "Re-render this" means the finished
 * one, not the one already running.
 */
function isActiveStatus(status: string): boolean {
  return status === 'PENDING' || status === 'RUNNING'
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
  const requestedSourceFile = String(body.sourceFile ?? '').trim()
  // Scoped to one named source on purpose. A folder-wide force would re-render
  // every finished scene in the batch off one click -- an unbounded GPU spend
  // on a box that renders one clip at a time.
  const force = Boolean(body.force) && Boolean(requestedSourceFile)
  const allSources = await listSceneAnimatorSourceFiles(folder)
  const sources = requestedSourceFile
    ? allSources.filter((source) => source.name === requestedSourceFile)
    : allSources
  // Every override for this folder in one query -- the loop below needs the
  // prompt BEFORE it can compute a dedupe key, so a per-source lookup would be
  // a round trip per still.
  const promptOverrides = await readSceneAnimatorPrompts(
    sources.map((source) => source.hash),
  )

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

  if (requestedSourceFile && !sources.length) {
    errors.push({
      sourceFile: requestedSourceFile,
      message: 'No matching source file in this folder.',
    })
  }

  for (const source of sources) {
    const { prompt, isOverridden } = resolveScenePrompt(
      promptOverrides.get(source.hash),
    )
    // Keyed on the prompt only when it is custom, so default-prompt sources
    // keep the exact dedupe key they have always had. See sceneAnimatorConfigKey.
    const promptKey = isOverridden ? prompt : null
    const configKey = sceneAnimatorConfigKey(config, promptKey)
    const dedupeKey = sceneAnimatorDedupeKey(source.hash, config, promptKey)
    let existing = latestByKey.get(dedupeKey) ?? null

    // Recheck immediately before the expensive enqueue so two open admin tabs are
    // unlikely to duplicate the same active/completed render. A forced re-render
    // needs this most of all: it is the one path that enqueues over a job it
    // already saw, so a stale read here is how two of them get queued at once.
    if (!existing || force || (!isReusableStatus(existing.status) && body.retryFailed)) {
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

    // An active job is never duplicated, forced or not.
    if (existing && isActiveStatus(existing.status)) {
      skipped.push({ sourceFile: source.name, jobId: existing.id, reason: existing.status })
      continue
    }
    if (existing && isReusableStatus(existing.status) && !force) {
      skipped.push({ sourceFile: source.name, jobId: existing.id, reason: existing.status })
      continue
    }
    if (existing && !body.retryFailed && !force) {
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
          promptString: prompt,
          negativePrompt: SCENE_ANIMATOR_NEGATIVE_PROMPT,
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
      // The batch's shared key. Per-source keys diverge from this whenever a
      // source carries a custom prompt, which is the point of the override --
      // so this reports the folder's default, not any one render's key.
      configKey: sceneAnimatorConfigKey(config),
      total: sources.length,
      queued,
      skipped,
      errors,
    },
  }
})
