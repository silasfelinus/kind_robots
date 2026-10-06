// /utils/musicVideoRecover.ts
//
// Re-adopt the song and stills of a deleted music video (music-video/t-033).
// Silas, 2026-10-06, after deleting the first theme-song video: "i actually
// liked the song and i love the art that has been created for it. can you
// restore the classic kind robots animation pitch as another project, using
// the song we already made and the art being processed?"
//
// Deleting a MusicVideo leaves its ArtJobs alone. Each scene still's job
// payload carries musicVideo { videoId, sceneId }, so the stills of a deleted
// video can be matched back to a spec's scenes; the song job is not tagged, so
// it is the ACE-Step job made just before those stills, preferring one whose
// style tags equal the spec's. Pure and DB-free; the import route fetches rows.

import type {
  MusicVideoDoc,
  MusicVideoScene,
  MusicVideoSong,
} from './musicVideoDoc'

export type RecoverableJob = {
  id: number
  status: string
  createdAt: Date
  artImageId: number | null
  payload: Record<string, unknown>
}

export type Recovery = {
  fromVideoId: number | null
  scenes: MusicVideoScene[]
  adopted: number
  notes: string[]
}

const USABLE = new Set(['DONE', 'PENDING', 'RUNNING'])

function sceneContext(
  job: RecoverableJob,
): { videoId: number; sceneId: string } | null {
  const context = job.payload.musicVideo
  if (!context || typeof context !== 'object') return null
  const { videoId, sceneId } = context as Record<string, unknown>
  return typeof videoId === 'number' && typeof sceneId === 'string'
    ? { videoId, sceneId }
    : null
}

function promptOf(job: RecoverableJob): string {
  return String(job.payload.promptString ?? '').trim()
}

/** A finished image first, then one still rendering; newest wins each tier. */
function bestJob(jobs: RecoverableJob[]): RecoverableJob | null {
  const usable = jobs
    .filter((job) => USABLE.has(job.status))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return (
    usable.find((job) => job.status === 'DONE' && job.artImageId) ??
    usable.find((job) => job.status !== 'DONE') ??
    null
  )
}

/**
 * The newest deleted video whose stills match this doc's scenes (same scene
 * id, prompt starting with the scene's prompt), with each scene's best job
 * attached. Scenes of live videos are never touched.
 */
export function adoptDeletedStills(
  doc: Pick<MusicVideoDoc, 'scenes'>,
  jobs: RecoverableJob[],
  liveVideoIds: ReadonlySet<number>,
): Recovery {
  const byVideo = new Map<number, RecoverableJob[]>()
  for (const job of jobs) {
    const context = sceneContext(job)
    if (!context || liveVideoIds.has(context.videoId)) continue
    const group = byVideo.get(context.videoId) ?? []
    group.push(job)
    byVideo.set(context.videoId, group)
  }

  const prompts = new Map(
    doc.scenes.map((scene) => [scene.id, scene.prompt.trim()]),
  )
  const matches = (job: RecoverableJob) => {
    const context = sceneContext(job)
    const prompt = context ? prompts.get(context.sceneId) : undefined
    return Boolean(prompt && promptOf(job).startsWith(prompt))
  }
  const newest = (group: RecoverableJob[]) =>
    Math.max(...group.map((job) => job.createdAt.getTime()))
  const candidates = [...byVideo.entries()]
    .filter(([, group]) => group.some(matches))
    .sort(([, a], [, b]) => newest(b) - newest(a))
  const chosen = candidates[0]
  if (!chosen) {
    return {
      fromVideoId: null,
      scenes: doc.scenes,
      adopted: 0,
      notes: [
        'No deleted copy of this video was found, so nothing was reused.',
      ],
    }
  }

  const [fromVideoId, group] = chosen
  let adopted = 0
  const scenes = doc.scenes.map((scene) => {
    const job = bestJob(
      group.filter(
        (item) => sceneContext(item)?.sceneId === scene.id && matches(item),
      ),
    )
    if (!job) return scene
    adopted += 1
    return {
      ...scene,
      image: {
        ...scene.image,
        source: 'generated' as const,
        jobId: job.id,
        ...(job.status === 'DONE' && job.artImageId
          ? { artImageId: job.artImageId }
          : {}),
      },
    }
  })
  return {
    fromVideoId,
    scenes,
    adopted,
    notes: [
      `Reused ${adopted} of ${doc.scenes.length} stills from deleted video ${fromVideoId}.`,
    ],
  }
}

/** When the deleted video's first still was queued; its song came before. */
export function firstStillAt(
  jobs: RecoverableJob[],
  videoId: number,
): Date | null {
  const times = jobs
    .filter((job) => sceneContext(job)?.videoId === videoId)
    .map((job) => job.createdAt.getTime())
  return times.length ? new Date(Math.min(...times)) : null
}

/**
 * The song to reuse among ACE-Step jobs made before the stills: a finished one
 * with exactly the spec's style tags, else the newest finished one.
 */
export function adoptSong(
  songJobs: RecoverableJob[],
  tags: string,
): MusicVideoSong | null {
  const done = songJobs
    .filter((job) => job.status === 'DONE' && job.artImageId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const job = done.find((item) => promptOf(item) === tags) ?? done[0]
  if (!job?.artImageId) return null
  const audio =
    job.payload.audio && typeof job.payload.audio === 'object'
      ? (job.payload.audio as Record<string, unknown>)
      : {}
  const song: MusicVideoSong = {
    source: 'comfy-acestep',
    jobId: job.id,
    artImageId: job.artImageId,
    tags: promptOf(job) || tags,
  }
  if (typeof audio.durationSeconds === 'number') {
    song.durationSec = audio.durationSeconds
  }
  if (typeof audio.bpm === 'number') song.bpm = audio.bpm
  if (typeof audio.seed === 'number') song.seed = audio.seed
  return song
}
