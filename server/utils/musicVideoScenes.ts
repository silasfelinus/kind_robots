import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import { checkArtPromptContract } from '@/server/utils/artPromptContract'
import type { MusicVideoDoc, MusicVideoScene } from '@/utils/musicVideoDoc'
import {
  MUSIC_VIDEO_KREA_CFG,
  MUSIC_VIDEO_KREA_STEPS,
  checkScenePrompt,
  findBannedTerms,
  musicVideoStillBody,
  type MusicVideoStillBody,
} from '@/utils/musicVideoScenes'
import {
  DEFAULT_COMIC_LANES,
  comicLaneForKey,
  comicPrimaryLane,
  parseComicLanes,
  type ComicLane,
  type ComicSeriesStyle,
} from '@/utils/comicLanes'

export const MUSIC_VIDEO_PROJECT_SLUG = 'music-video'
/** The default still engine; a video borrowing a comic series' style uses its lane. */
export const MUSIC_VIDEO_SCENE_ENGINE = 'krea2'

export type StillLane = {
  lane: ComicLane | null
  series: ComicSeriesStyle | null
}

/**
 * music-video/t-025: the comic lane a video's stills render through, or none
 * for Krea 2. A missing series or lane key is an error the caller shows, so a
 * video never silently falls back to a different style.
 */
export async function resolveStillLane(doc: MusicVideoDoc): Promise<StillLane> {
  const seriesId = doc.settings.comicSeriesId
  if (!seriesId) return defaultLane(doc.settings.imageLaneKey)
  const series = await prisma.comicSeries.findUnique({
    where: { id: seriesId },
    select: {
      lanes: true,
      styleProse: true,
      styleTags: true,
      negativeTags: true,
      isArchived: true,
    },
  })
  if (!series || series.isArchived) {
    throw new Error(`Comic series ${seriesId} was not found.`)
  }
  const lanes = parseComicLanes(series.lanes)
  const lane = doc.settings.comicLaneKey
    ? comicLaneForKey(lanes, doc.settings.comicLaneKey)
    : comicPrimaryLane(lanes)
  if (!lane) {
    throw new Error(
      `Comic series ${seriesId} has no lane "${doc.settings.comicLaneKey ?? 'house'}".`,
    )
  }
  return {
    lane,
    series: {
      styleProse: series.styleProse,
      styleTags: series.styleTags,
      negativeTags: series.negativeTags,
    },
  }
}

/**
 * A lane from the shared catalogue, picked by key (t-032: "we should be able to
 * select the checkpoint we use for generation"). `krea2` or no key is the
 * built-in Krea 2 path; an unknown key is an error, never a silent fallback.
 */
export function defaultLane(key: string | null | undefined): StillLane {
  if (!key || key === MUSIC_VIDEO_SCENE_ENGINE) {
    return { lane: null, series: null }
  }
  const lane = comicLaneForKey(DEFAULT_COMIC_LANES, key)
  if (!lane) throw new Error(`Unknown image lane "${key}".`)
  return { lane, series: null }
}

/**
 * The lane one scene renders through: its own laneKey when set (looked up in
 * the video's comic series first, then the shared catalogue), else the video's.
 */
export async function resolveSceneLane(
  doc: MusicVideoDoc,
  scene: Pick<MusicVideoScene, 'image'>,
  videoLane: StillLane,
): Promise<StillLane> {
  const key = scene.image.laneKey
  if (!key) return videoLane
  if (doc.settings.comicSeriesId && videoLane.series) {
    const series = await prisma.comicSeries.findUnique({
      where: { id: doc.settings.comicSeriesId },
      select: { lanes: true },
    })
    const own = series
      ? comicLaneForKey(parseComicLanes(series.lanes), key)
      : null
    if (own) return { lane: own, series: videoLane.series }
  }
  return defaultLane(key)
}

export type SceneRenderOutcome = {
  sceneId: string
  jobId?: number
  status: 'queued' | 'reused' | 'skipped' | 'rejected' | 'failed'
  reason?: string
}

export type SceneJobContext = {
  videoId: number
  sceneId: string
  dedupeKey: string
}

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string }
}

function isActiveStatus(status: string): boolean {
  return status === 'PENDING' || status === 'RUNNING'
}

export function sceneDedupeKey(
  videoId: number,
  sceneId: string,
  body: Pick<
    MusicVideoStillBody,
    | 'promptString'
    | 'width'
    | 'height'
    | 'engine'
    | 'checkpoint'
    | 'loraResourceIds'
  >,
): string {
  const hash = createHash('sha256')
    .update(
      [
        body.promptString,
        body.width,
        body.height,
        body.loraResourceIds.join(','),
        body.engine,
        body.checkpoint ?? '',
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 32)
  return `music-video:${videoId}:${sceneId}:${hash}`
}

/** Banned terms in a text, as rejection reasons. */
export function bannedTermProblems(text: string, doc: MusicVideoDoc): string[] {
  const found = findBannedTerms(text, doc.settings.bannedTerms)
  return found.length
    ? [`[banned-term] The prompt uses a banned term: ${found.join(', ')}.`]
    : []
}

/**
 * Why a scene still cannot render. Banned terms apply on every engine; the
 * Krea scene-prompt rules apply only when Krea 2 renders it, and the shared
 * art-prompt contract runs for whichever engine does.
 */
export function sceneRenderProblems(
  scene: MusicVideoScene,
  doc: MusicVideoDoc,
  body: Pick<MusicVideoStillBody, 'engine' | 'promptString' | 'steps' | 'cfg'>,
): string[] {
  const banned = bannedTermProblems(body.promptString, doc)
  if (!scene.prompt.trim()) {
    return [...banned, '[empty] The scene has no prompt.']
  }
  const krea = body.engine === MUSIC_VIDEO_SCENE_ENGINE
  const own = krea
    ? [
        ...checkScenePrompt(scene.prompt),
        ...(doc.settings.styleBible
          ? checkScenePrompt(doc.settings.styleBible)
          : []),
      ].map((v) => `[${v.rule}] ${v.detail}`)
    : []
  const contract = checkArtPromptContract({
    prompt: body.promptString,
    engine: body.engine,
    steps: krea ? MUSIC_VIDEO_KREA_STEPS : body.steps,
    cfg: krea ? MUSIC_VIDEO_KREA_CFG : body.cfg,
  }).map((v) => `[${v.rule}] ${v.detail}`)
  return [...banned, ...own, ...contract]
}

export async function enqueueSceneStill(
  event: H3Event,
  videoId: number,
  scene: MusicVideoScene,
  doc: MusicVideoDoc,
  force: boolean,
  stillLane: StillLane = { lane: null, series: null },
): Promise<SceneRenderOutcome> {
  const body = musicVideoStillBody(doc, scene, {
    projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
    lane: stillLane.lane,
    series: stillLane.series,
  })
  const problems = sceneRenderProblems(scene, doc, body)
  if (problems.length) {
    return { sceneId: scene.id, status: 'rejected', reason: problems.join(' ') }
  }

  const dedupeKey = sceneDedupeKey(videoId, scene.id, body)
  const existing = await prisma.artJob.findFirst({
    where: {
      projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
      payload: { contains: `"dedupeKey":"${dedupeKey}"` },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true },
  })
  if (existing && isActiveStatus(existing.status)) {
    return {
      sceneId: scene.id,
      jobId: existing.id,
      status: 'skipped',
      reason: existing.status,
    }
  }
  if (existing && existing.status === 'DONE' && !force) {
    return { sceneId: scene.id, jobId: existing.id, status: 'reused' }
  }

  const response = await event.$fetch<EnqueueResponse, string>(
    '/api/art/enqueue',
    { method: 'POST', body },
  )
  const jobId = Number(response?.data?.jobId)
  if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
    return {
      sceneId: scene.id,
      status: 'failed',
      reason: response?.message || 'Enqueue did not return a valid ArtJob id.',
    }
  }

  const created = await prisma.artJob.findUnique({
    where: { id: jobId },
    select: { payload: true },
  })
  if (created) {
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(created.payload) as Record<string, unknown>
    } catch {
      payload = {}
    }
    const context: SceneJobContext = { videoId, sceneId: scene.id, dedupeKey }
    await prisma.artJob.update({
      where: { id: jobId },
      data: { payload: JSON.stringify({ ...payload, musicVideo: context }) },
    })
  }
  return { sceneId: scene.id, jobId, status: 'queued' }
}

export type SceneJobStatus = {
  sceneId: string
  jobId: number | null
  status: string
  artImageId: number | null
  error: string | null
  // music-video/t-009: the optional image-to-video clip for the scene.
  clipJobId: number | null
  clipStatus: string | null
  clipArtImageId: number | null
  clipError: string | null
}

export async function syncSceneJobs(doc: MusicVideoDoc): Promise<{
  doc: MusicVideoDoc
  statuses: SceneJobStatus[]
  changed: boolean
}> {
  const jobIds = doc.scenes
    .flatMap((scene) => [scene.image.jobId, scene.motion.jobId])
    .filter((id): id is number => Number.isInteger(id))
  const jobs = jobIds.length
    ? await prisma.artJob.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, status: true, artImageId: true, error: true },
      })
    : []
  const byId = new Map(jobs.map((job) => [job.id, job]))

  let changed = false
  const statuses: SceneJobStatus[] = []
  const scenes = doc.scenes.map((scene) => {
    const job = scene.image.jobId ? byId.get(scene.image.jobId) : undefined
    const clipJob = scene.motion.jobId
      ? byId.get(scene.motion.jobId)
      : undefined
    statuses.push({
      sceneId: scene.id,
      jobId: scene.image.jobId ?? null,
      status: job?.status ?? (scene.image.artImageId ? 'READY' : 'EMPTY'),
      artImageId: job?.artImageId ?? scene.image.artImageId ?? null,
      error: job?.error ?? null,
      clipJobId: scene.motion.jobId ?? null,
      clipStatus:
        clipJob?.status ?? (scene.motion.clipArtImageId ? 'READY' : null),
      clipArtImageId:
        clipJob?.artImageId ?? scene.motion.clipArtImageId ?? null,
      clipError: clipJob?.error ?? null,
    })
    let next = scene
    if (
      job?.status === 'DONE' &&
      job.artImageId &&
      job.artImageId !== scene.image.artImageId
    ) {
      next = { ...next, image: { ...next.image, artImageId: job.artImageId } }
    }
    if (
      clipJob?.status === 'DONE' &&
      clipJob.artImageId &&
      clipJob.artImageId !== scene.motion.clipArtImageId
    ) {
      next = {
        ...next,
        motion: { ...next.motion, clipArtImageId: clipJob.artImageId },
      }
    }
    if (next !== scene) changed = true
    return next
  })
  return { doc: { ...doc, scenes }, statuses, changed }
}
