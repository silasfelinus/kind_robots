import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import { checkArtPromptContract } from '@/server/utils/artPromptContract'
import type { MusicVideoDoc, MusicVideoScene } from '@/utils/musicVideoDoc'
import {
  checkScenePrompt,
  composeScenePrompt,
  kreaFrameSize,
} from '@/utils/musicVideoScenes'

export const MUSIC_VIDEO_PROJECT_SLUG = 'music-video'
export const MUSIC_VIDEO_SCENE_ENGINE = 'krea2'
const KREA_STEPS = 8
const KREA_CFG = 1

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
  composedPrompt: string,
  doc: MusicVideoDoc,
): string {
  const { width, height } = kreaFrameSize(doc.settings.aspect)
  const loras = (doc.settings.loraResourceIds ?? []).join(',')
  const hash = createHash('sha256')
    .update(
      [composedPrompt, width, height, loras, MUSIC_VIDEO_SCENE_ENGINE].join(
        '|',
      ),
    )
    .digest('hex')
    .slice(0, 32)
  return `music-video:${videoId}:${sceneId}:${hash}`
}

export function sceneRenderProblems(
  scene: MusicVideoScene,
  doc: MusicVideoDoc,
): string[] {
  const composed = composeScenePrompt(scene.prompt, doc.settings.styleBible)
  const own = [
    ...checkScenePrompt(scene.prompt),
    ...(doc.settings.styleBible
      ? checkScenePrompt(doc.settings.styleBible)
      : []),
  ].map((v) => `[${v.rule}] ${v.detail}`)
  const contract = checkArtPromptContract({
    prompt: composed,
    engine: MUSIC_VIDEO_SCENE_ENGINE,
    steps: KREA_STEPS,
    cfg: KREA_CFG,
  }).map((v) => `[${v.rule}] ${v.detail}`)
  return [...own, ...contract]
}

export async function enqueueSceneStill(
  event: H3Event,
  videoId: number,
  scene: MusicVideoScene,
  doc: MusicVideoDoc,
  force: boolean,
): Promise<SceneRenderOutcome> {
  const problems = sceneRenderProblems(scene, doc)
  if (problems.length) {
    return { sceneId: scene.id, status: 'rejected', reason: problems.join(' ') }
  }

  const composed = composeScenePrompt(scene.prompt, doc.settings.styleBible)
  const dedupeKey = sceneDedupeKey(videoId, scene.id, composed, doc)
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

  const { width, height } = kreaFrameSize(doc.settings.aspect)
  const response = await event.$fetch<EnqueueResponse, string>(
    '/api/art/enqueue',
    {
      method: 'POST',
      body: {
        engine: MUSIC_VIDEO_SCENE_ENGINE,
        promptString: composed,
        width,
        height,
        steps: KREA_STEPS,
        cfg: KREA_CFG,
        loraResourceIds: doc.settings.loraResourceIds ?? [],
        isPublic: false,
        isMature: false,
        designer: 'Music Video',
        projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
      },
    },
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
}

export async function syncSceneJobs(doc: MusicVideoDoc): Promise<{
  doc: MusicVideoDoc
  statuses: SceneJobStatus[]
  changed: boolean
}> {
  const jobIds = doc.scenes
    .map((scene) => scene.image.jobId)
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
    statuses.push({
      sceneId: scene.id,
      jobId: scene.image.jobId ?? null,
      status: job?.status ?? (scene.image.artImageId ? 'READY' : 'EMPTY'),
      artImageId: job?.artImageId ?? scene.image.artImageId ?? null,
      error: job?.error ?? null,
    })
    if (
      job?.status === 'DONE' &&
      job.artImageId &&
      job.artImageId !== scene.image.artImageId
    ) {
      changed = true
      return { ...scene, image: { ...scene.image, artImageId: job.artImageId } }
    }
    return scene
  })
  return { doc: { ...doc, scenes }, statuses, changed }
}
