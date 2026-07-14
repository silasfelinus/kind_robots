// /stores/videoStore.ts
//
// Front-end store for the video generator page. Enqueues an image-to-video
// ArtJob (engine: 'ltx' | 'wan') via /api/art/enqueue, polls /api/art/queue/:id
// until the home relay renders + completes it, then resolves the finished
// ArtImage into a playable video src. Mirrors the enqueue → poll → resolve
// pattern in stores/artStore.ts, kept standalone so the video page has a small,
// focused surface.
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'

export type VideoEngine = 'ltx' | 'wan'

export type VideoJobStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'error'

export interface GenerateVideoParams {
  engine: VideoEngine
  promptString: string
  negativePrompt?: string
  // Base64 data URLs (or raw base64). First is required, second optional.
  firstImageBase64: string
  secondImageBase64?: string | null
  durationSeconds: number
  fps: number
  loop: boolean
  width?: number | null
  height?: number | null
  seed?: number | null
  isPublic?: boolean
  isMature?: boolean
  designer?: string | null
  projectSlug?: string | null
}

type QueuedJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
}

const POLL_MS = 5_000
const TIMEOUT_MS = 20 * 60_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Resolve a finished ArtImage (fileType mp4/webm/gif) into a playable src.
// Handles inline base64 clips and stored paths, same shape as artImageToSrc but
// video-aware (data:video/... and /video/... paths).
function artImageToVideoSrc(image: ArtImage | null | undefined): string {
  if (!image) return ''
  const fileType = (image.fileType || 'mp4').toLowerCase()
  const raw = (image.imageData || '').trim()

  if (raw) {
    if (raw.startsWith('data:')) return raw
    if (!raw.startsWith('/') && !raw.startsWith('http')) {
      return `data:video/${fileType === 'webm' ? 'webm' : 'mp4'};base64,${raw}`
    }
  }

  const path = (image.imagePath || image.path || '').trim()
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

export const useVideoStore = defineStore('videoStore', () => {
  const state = reactive({
    status: 'idle' as VideoJobStatus,
    jobId: null as number | null,
    videoSrc: '',
    artImageId: null as number | null,
    message: '',
    error: '',
    loop: true,
  })

  const isBusy = computed(
    () => state.status === 'queued' || state.status === 'rendering',
  )

  function reset(): void {
    state.status = 'idle'
    state.jobId = null
    state.videoSrc = ''
    state.artImageId = null
    state.message = ''
    state.error = ''
  }

  async function enqueue(params: GenerateVideoParams): Promise<number> {
    const body = {
      engine: params.engine,
      promptString: params.promptString,
      negativePrompt: params.negativePrompt ?? undefined,
      firstImageBase64: params.firstImageBase64,
      secondImageBase64: params.secondImageBase64 ?? undefined,
      durationSeconds: params.durationSeconds,
      fps: params.fps,
      loop: params.loop,
      width: params.width ?? undefined,
      height: params.height ?? undefined,
      seed: params.seed ?? undefined,
      isPublic: params.isPublic ?? true,
      isMature: params.isMature ?? false,
      designer: params.designer ?? undefined,
      projectSlug: params.projectSlug ?? undefined,
    }

    const res = await performFetch<{ jobId: number; status: string }>(
      '/api/art/enqueue',
      { method: 'POST', body: JSON.stringify(body) },
      2,
      60_000,
    )

    if (!res.success || !res.data?.jobId) {
      throw new Error(res.message || 'Failed to queue the video job.')
    }

    return res.data.jobId
  }

  async function waitForJob(jobId: number): Promise<QueuedJob> {
    const startedAt = Date.now()

    while (Date.now() - startedAt < TIMEOUT_MS) {
      const res = await performFetch<{ job: QueuedJob }>(
        `/api/art/queue/${jobId}`,
        { method: 'GET' },
        2,
        20_000,
      )

      const job = res.success ? res.data?.job : null

      if (
        job?.status === 'DONE' ||
        job?.status === 'FAILED' ||
        job?.status === 'CANCELLED'
      ) {
        return job
      }

      if (job?.status === 'RUNNING') {
        state.status = 'rendering'
        state.message = 'The studio engine is rendering your clip…'
      } else if (job?.status === 'PENDING') {
        state.status = 'queued'
        state.message = 'Queued — waiting for the studio engine to pick it up…'
      }

      await sleep(POLL_MS)
    }

    throw new Error(
      'The studio engine is still catching up. The job stays queued and its clip will appear once rendering finishes — no need to resubmit.',
    )
  }

  async function loadVideo(artImageId: number): Promise<void> {
    const res = await performFetch<ArtImage>(
      `/api/art/image/${artImageId}?includeImageData=true`,
      { method: 'GET' },
      2,
      30_000,
    )

    if (!res.success || !res.data) {
      throw new Error(`Clip ${artImageId} rendered but could not be loaded.`)
    }

    state.videoSrc = artImageToVideoSrc(res.data)
  }

  // Full orchestration: enqueue → poll → resolve. Sets status/error along the
  // way so the page can bind directly to the store.
  async function generate(params: GenerateVideoParams): Promise<void> {
    reset()
    state.status = 'queued'
    state.loop = params.loop
    state.message = 'Queuing your clip…'

    try {
      const jobId = await enqueue(params)
      state.jobId = jobId

      const job = await waitForJob(jobId)

      if (job.status !== 'DONE') {
        throw new Error(
          job.error || `Video job ${jobId} ${job.status.toLowerCase()}.`,
        )
      }

      if (typeof job.artImageId === 'number') {
        state.artImageId = job.artImageId
        await loadVideo(job.artImageId)
      }

      state.status = 'done'
      state.message = 'Clip ready.'
    } catch (err) {
      state.status = 'error'
      state.error = err instanceof Error ? err.message : String(err)
      state.message = ''
    }
  }

  return { state, isBusy, reset, generate }
})
