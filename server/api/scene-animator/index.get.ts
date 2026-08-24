import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  SCENE_ANIMATOR_PROJECT_SLUG,
  listSceneAnimatorFolders,
  listSceneAnimatorSourceFiles,
  parseSceneAnimatorContext,
  sceneAnimatorConfigKey,
  sceneAnimatorDedupeKey,
  type SceneAnimatorRenderConfig,
} from '@/server/utils/sceneAnimator'
import {
  getDefaultVideoPreset,
  getVideoPreset,
  type VideoEngine,
  type VideoPresetId,
} from '@/utils/videoPresets'

function queryString(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

function queryBoolean(value: unknown): boolean {
  return ['1', 'true', 'yes', 'on'].includes(queryString(value).trim().toLowerCase())
}

function resolveConfig(query: Record<string, unknown>): SceneAnimatorRenderConfig {
  const requestedEngine = queryString(query.engine)
  const engine: VideoEngine = requestedEngine === 'ltx' ? 'ltx' : 'wan'
  const requestedPreset = getVideoPreset(queryString(query.presetId) as VideoPresetId)
  const preset =
    requestedPreset?.engine === engine ? requestedPreset : getDefaultVideoPreset(engine)
  const requestedDuration = Number(queryString(query.durationSeconds))
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
    isMature: queryBoolean(query.isMature),
  }
}

function jobStatus(status: string): 'queued' | 'rendering' | 'done' | 'failed' | 'cancelled' {
  if (status === 'RUNNING') return 'rendering'
  if (status === 'DONE') return 'done'
  if (status === 'FAILED') return 'failed'
  if (status === 'CANCELLED') return 'cancelled'
  return 'queued'
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const query = getQuery(event) as Record<string, unknown>
  const folder = queryString(query.folder).trim()
  const config = resolveConfig(query)
  const folders = await listSceneAnimatorFolders()

  if (!folder && !folders.some((item) => item.name === '')) {
    return {
      success: true,
      data: {
        rootAvailable: true,
        folders,
        selectedFolder: null,
        config,
        configKey: sceneAnimatorConfigKey(config),
        sources: [],
      },
    }
  }

  const sources = await listSceneAnimatorSourceFiles(folder)
  const jobs = await prisma.artJob.findMany({
    where: {
      projectSlug: SCENE_ANIMATOR_PROJECT_SLUG,
      payload: { contains: '"sceneAnimator"' },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const latestByKey = new Map<string, (typeof jobs)[number]>()
  for (const job of jobs) {
    let payload: Record<string, unknown> | null = null
    try {
      payload = JSON.parse(job.payload) as Record<string, unknown>
    } catch {
      continue
    }
    const context = parseSceneAnimatorContext(payload.sceneAnimator)
    if (!context || latestByKey.has(context.dedupeKey)) continue
    latestByKey.set(context.dedupeKey, job)
  }

  // ArtJob has no declared relation to ArtImage (only a plain `artImageId`
  // int column), so the result image has to be batch-fetched separately
  // rather than `include`d.
  const resultImageIds = [...new Set(
    [...latestByKey.values()]
      .map((job) => job.artImageId)
      .filter((id): id is number => id != null),
  )]
  const resultImages = resultImageIds.length
    ? await prisma.artImage.findMany({
        where: { id: { in: resultImageIds } },
        select: { id: true, imagePath: true, fileType: true, isMature: true },
      })
    : []
  const resultImageById = new Map(resultImages.map((image) => [image.id, image]))

  const configKey = sceneAnimatorConfigKey(config)
  const rows = sources.map((source) => {
    const dedupeKey = sceneAnimatorDedupeKey(source.hash, config)
    const job = latestByKey.get(dedupeKey)
    const result = job?.artImageId != null ? (resultImageById.get(job.artImageId) ?? null) : null
    return {
      name: source.name,
      bytes: source.bytes,
      hash: source.hash,
      mime: source.mime,
      sourceUrl: `/api/scene-animator/source?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(source.name)}`,
      dedupeKey,
      status: job ? jobStatus(job.status) : 'missing',
      jobId: job?.id ?? null,
      artImageId: job?.artImageId ?? null,
      resultPath: result?.imagePath ?? null,
      resultFileType: result?.fileType ?? null,
      error: job?.error ?? null,
      updatedAt: job?.updatedAt ?? null,
    }
  })

  return {
    success: true,
    data: {
      rootAvailable: true,
      folders,
      selectedFolder: folder,
      config,
      configKey,
      sources: rows,
    },
  }
})
