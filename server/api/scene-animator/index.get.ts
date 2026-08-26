import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  SCENE_ANIMATOR_PROJECT_SLUG,
  listSceneAnimatorSourceFiles,
  parseSceneAnimatorContext,
  readSceneAnimatorRootStatus,
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

type FolderStat = { total: number; done: number; active: number; failed: number }

// Coarser than the per-source status the selected folder gets: this counts a
// source file as "done" if ANY job for it (under any engine/preset/duration
// config, not just the currently selected one) reached DONE, so the folder
// picker's completion badge doesn't jump around every time the batch config
// changes. It intentionally reuses the same jobs query every other branch
// already pays for -- listing every folder's own image files (which requires
// reading and hashing each file's bytes, see listSceneAnimatorSourceFiles) to
// get a config-exact count would multiply that I/O by folder count.
function buildFolderStats(
  folders: Array<{ name: string; imageCount: number }>,
  jobs: Array<{ payload: string; status: string }>,
): Record<string, FolderStat> {
  const stats: Record<string, FolderStat> = {}
  for (const folder of folders) {
    stats[folder.name] = { total: folder.imageCount, done: 0, active: 0, failed: 0 }
  }

  // Best status per (folder, file), across every config that ever rendered it.
  // Nested by folder first so a filename that happens to collide across two
  // folders can't merge two unrelated sources' counts together.
  const bestByFolder = new Map<string, Map<string, 'done' | 'active' | 'failed'>>()
  const rank = { failed: 0, active: 1, done: 2 } as const
  for (const job of jobs) {
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(job.payload) as Record<string, unknown>
    } catch {
      continue
    }
    const context = parseSceneAnimatorContext(payload.sceneAnimator)
    if (!context || !(context.sourceFolder in stats)) continue
    const status = jobStatus(job.status)
    const current: 'done' | 'active' | 'failed' =
      status === 'done' ? 'done' : status === 'rendering' || status === 'queued' ? 'active' : 'failed'
    let byFile = bestByFolder.get(context.sourceFolder)
    if (!byFile) {
      byFile = new Map()
      bestByFolder.set(context.sourceFolder, byFile)
    }
    const existing = byFile.get(context.sourceFile)
    if (!existing || rank[current] > rank[existing]) byFile.set(context.sourceFile, current)
  }

  for (const [folderName, byFile] of bestByFolder) {
    const stat = stats[folderName]
    if (!stat) continue
    for (const status of byFile.values()) stat[status] += 1
  }

  return stats
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const query = getQuery(event) as Record<string, unknown>
  const folder = queryString(query.folder).trim()
  const config = resolveConfig(query)
  const rootStatus = await readSceneAnimatorRootStatus()

  if (!rootStatus.available) {
    return {
      success: true,
      message: rootStatus.reason,
      data: {
        rootAvailable: false,
        folders: [],
        selectedFolder: null,
        config,
        configKey: sceneAnimatorConfigKey(config),
        sources: [],
        folderStats: {},
      },
    }
  }

  const folders = rootStatus.folders

  // Cheap (DB rows, not filesystem reads) and shared by every return path
  // below, including the two folder-less ones -- the folder picker shows a
  // completion badge for every folder up front, not just the selected one.
  const jobs = await prisma.artJob.findMany({
    where: {
      projectSlug: SCENE_ANIMATOR_PROJECT_SLUG,
      payload: { contains: '"sceneAnimator"' },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })
  const folderStats = buildFolderStats(folders, jobs)

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
        folderStats,
      },
    }
  }

  const sources = await listSceneAnimatorSourceFiles(folder)

  const latestByKey = new Map<string, (typeof jobs)[number]>()
  for (const job of jobs) {
    let payload: Record<string, unknown>
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
      createdAt: job?.createdAt ?? null,
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
      folderStats,
    },
  }
})
