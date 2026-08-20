// /stores/videoStore.ts
//
// Front-end store for the video generator page. Enqueues an image-to-video
// ArtJob (engine: 'ltx' | 'wan') via /api/video/generate, polls /api/art/queue/:id
// until the home relay renders + completes it, then resolves the finished
// ArtImage into a playable video src. Mirrors the enqueue → poll → resolve
// pattern in stores/artStore.ts, kept standalone so the video page has a small,
// focused surface.
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { artJobRetryNotice } from '@/utils/artJobRetryNotice'
import type {
  VideoEngine,
  VideoOutputFormat,
  VideoPresetId,
} from '@/utils/videoPresets'

export type VideoJobStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'error'

export interface GenerateVideoParams {
  engine: VideoEngine
  presetId?: VideoPresetId | null
  promptString: string
  negativePrompt?: string
  firstImageBase64: string
  secondImageBase64?: string | null
  durationSeconds: number
  fps: number
  loop: boolean
  width: number
  height: number
  seed?: number | null
  loraResourceIds?: number[]
  loraStrength?: number | null
  outputFormat: VideoOutputFormat
  renderScale?: number | null
  latentUpscaleModel?: string | null
  refineSampler?: string | null
  refineSigmas?: string | null
  timeoutSeconds?: number | null
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
  attempts?: number | null
}

const POLL_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const IMAGE_CLIP_TYPES = new Set(['webp', 'gif'])

export function isImageClipFileType(
  fileType: string | null | undefined,
): boolean {
  return IMAGE_CLIP_TYPES.has((fileType || '').toLowerCase())
}

function artImageToVideoSrc(image: ArtImage | null | undefined): string {
  if (!image) return ''
  const fileType = (image.fileType || 'mp4').toLowerCase()
  const raw = (image.imageData || '').trim()
  const mime = isImageClipFileType(fileType)
    ? `image/${fileType}`
    : `video/${fileType === 'webm' ? 'webm' : 'mp4'}`

  if (raw) {
    if (raw.startsWith('data:')) return raw
    if (!raw.startsWith('/') && !raw.startsWith('http')) {
      return `data:${mime};base64,${raw}`
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
    fileType: '',
    artImageId: null as number | null,
    message: '',
    error: '',
    attemptError: '',
    attempts: 0,
    loop: true,
  })

  const isBusy = computed(
    () => state.status === 'queued' || state.status === 'rendering',
  )

  const resultIsImage = computed(() => isImageClipFileType(state.fileType))

  function reset(): void {
    state.status = 'idle'
    state.jobId = null
    state.videoSrc = ''
    state.fileType = ''
    state.artImageId = null
    state.message = ''
    state.error = ''
    state.attemptError = ''
    state.attempts = 0
  }

  async function enqueue(params: GenerateVideoParams): Promise<number> {
    const body = {
      engine: params.engine,
      presetId: params.presetId ?? undefined,
      promptString: params.promptString,
      negativePrompt: params.negativePrompt ?? undefined,
      firstImageBase64: params.firstImageBase64,
      secondImageBase64: params.secondImageBase64 ?? undefined,
      durationSeconds: params.durationSeconds,
      fps: params.fps,
      loop: params.loop,
      width: params.width,
      height: params.height,
      seed: params.seed ?? undefined,
      loraResourceIds: params.loraResourceIds?.length
        ? params.loraResourceIds
        : undefined,
      loraStrength: params.loraStrength ?? undefined,
      outputFormat: params.outputFormat,
      renderScale: params.renderScale ?? undefined,
      latentUpscaleModel: params.latentUpscaleModel ?? undefined,
      refineSampler: params.refineSampler ?? undefined,
      refineSigmas: params.refineSigmas ?? undefined,
      timeoutSeconds: params.timeoutSeconds ?? undefined,
      isPublic: params.isPublic ?? true,
      isMature: params.isMature ?? false,
      designer: params.designer ?? undefined,
      projectSlug: params.projectSlug ?? undefined,
    }

    const res = await performFetch<{ jobId: number; status: string }>(
      '/api/video/generate',
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
    while (true) {
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

      const notice = artJobRetryNotice(job)
      if (notice) {
        state.attempts = notice.attempts
        state.attemptError = notice.error
      }

      if (job?.status === 'RUNNING') {
        state.status = 'rendering'
        state.message = state.attemptError
          ? `Retrying after attempt ${state.attempts} failed — rendering…`
          : 'The studio engine is rendering your clip…'
      } else if (job?.status === 'PENDING') {
        state.status = 'queued'
        state.message = state.attemptError
          ? `Attempt ${state.attempts} failed — waiting for the studio engine to retry…`
          : 'Queued — waiting for the studio engine to pick it up…'
      }

      await sleep(POLL_MS)
    }
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
    state.fileType = (res.data.fileType || '').toLowerCase()
  }

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

  return { state, isBusy, resultIsImage, reset, generate }
})
