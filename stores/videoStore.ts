// /stores/videoStore.ts
//
// Front-end store for the video generator page. Enqueues an image-to-video
// ArtJob (engine: 'ltx' | 'wan') via /api/video/generate, polls /api/art/queue/:id
// until the home relay renders + completes it, then resolves the finished
// ArtImage into a playable video src. Mirrors the enqueue → poll → resolve
// pattern in stores/artStore.ts, kept standalone so the video page has a small,
// focused surface.
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { reactive, computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { resolveArtImageSource } from '@/utils/artImageSource'
import type {
  RecentArtJobImage,
  RecentArtFilter,
} from '@/utils/recentArtImages'
import type { VideoGeneratorJobSummary } from '@/server/utils/videoGeneratorJobs'
import { artJobRetryNotice } from '@/utils/artJobRetryNotice'
import type { LoraPick } from '@/utils/loraSelection'
import type { WanVideoMode } from '@/utils/videoModelResources'
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
  loras?: LoraPick[]
  videoWanMode?: WanVideoMode
  videoCheckpointResourceId?: number | null
  videoLowCheckpointResourceId?: number | null
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

export type VideoStudioSettings = {
  engine: VideoEngine
  videoPresetId: VideoPresetId | ''
  outputFormat: VideoOutputFormat
  wanMode: WanVideoMode
  prompt: string
  negativePrompt: string
  isMature: boolean
  isPublic: boolean
  durationSeconds: number
  fps: number
  loop: boolean
  width: number
  height: number
  renderScale: number
  seedInput: number | string
  latentUpscaleModel: string | null
  refineSampler: string | null
  refineSigmas: string | null
  videoCheckpointResourceId: number | null
  videoLowCheckpointResourceId: number | null
  loraPicks: LoraPick[]
  recentArtFilter: RecentArtFilter
}

const SETTINGS_STORAGE_KEY = 'kindrobots.video-studio.settings.v1'

type QueuedJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
  attempts?: number | null
}

const POLL_MS = 5_000

async function blobUrlToDataUrl(src: string): Promise<string> {
  const response = await fetch(src, { credentials: 'include' })
  if (!response.ok) throw new Error(`Image file returned ${response.status}.`)
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('The stored file is not an image.')
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

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
  const userStore = useUserStore()
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

  const recentArt = reactive({
    items: [] as RecentArtJobImage[],
    loading: false,
    loadingFrameId: null as number | null,
    requestId: 0,
    error: '',
  })

  const history = reactive({
    jobs: [] as VideoGeneratorJobSummary[],
    selectedJobId: null as number | null,
    loading: false,
    actionId: null as number | null,
    error: '',
    notice: '',
    page: 1,
    pageCount: 1,
    totalCount: 0,
  })

  const selectedJob = computed(
    () => history.jobs.find((job) => job.id === history.selectedJobId) ?? null,
  )
  const hasActiveJobs = computed(() =>
    history.jobs.some(
      (job) => job.status === 'PENDING' || job.status === 'RUNNING',
    ),
  )

  const isBusy = computed(
    () => state.status === 'queued' || state.status === 'rendering',
  )

  const resultIsImage = computed(() => isImageClipFileType(state.fileType))

  function loadStudioSettings(): VideoStudioSettings | null {
    if (!import.meta.client) return null
    try {
      const value = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!value) return null
      const parsed: unknown = JSON.parse(value)
      return parsed && typeof parsed === 'object'
        ? (parsed as VideoStudioSettings)
        : null
    } catch {
      return null
    }
  }

  function rememberStudioSettings(settings: VideoStudioSettings): void {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      )
    } catch {
      // Private browsing and storage quotas must not block creating videos.
    }
  }

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
      negativePrompt: params.negativePrompt ?? '',
      firstImageBase64: params.firstImageBase64,
      secondImageBase64: params.secondImageBase64 ?? undefined,
      durationSeconds: params.durationSeconds,
      fps: params.fps,
      loop: params.loop,
      width: params.width,
      height: params.height,
      seed: params.seed ?? undefined,
      loras: params.loras?.length
        ? params.loras.map((lora) => ({
            resourceId: lora.resourceId,
            strength: lora.strength,
          }))
        : undefined,
      videoWanMode: params.videoWanMode ?? undefined,
      videoCheckpointResourceId: params.videoCheckpointResourceId ?? undefined,
      videoLowCheckpointResourceId:
        params.videoLowCheckpointResourceId ?? undefined,
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

  // `res.success` is false for BOTH "job not started yet" and "the status
  // fetch itself failed" (performFetch never throws -- a network blip, an
  // expired session's 401, the store-wide circuit breaker being open, or a
  // genuine 404 all collapse to the same `job: null`). Before this fix, that
  // null fell through to the same "keep polling" path as a genuine
  // PENDING/RUNNING status with no retry cap and no timeout, so a
  // *persistent* fetch failure (e.g. the user's JWT expiring mid-render)
  // looped forever every POLL_MS -- this await never resolved or rejected,
  // so generate()'s own try/catch never ran and the caller was left awaiting
  // indefinitely with nothing surfaced. Caps consecutive failed status
  // checks before giving up, mirroring the sibling fix already applied to
  // artStore.ts's waitForQueuedArtJob and modelBuilderStore.ts's
  // pollAsyncArtJob.
  const MAX_CONSECUTIVE_POLL_FAILURES = 6 // ~30s of failed status checks

  async function waitForJob(jobId: number): Promise<QueuedJob> {
    let consecutivePollFailures = 0
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

      if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          throw new Error(
            `Lost track of video job ${jobId} after ${consecutivePollFailures} failed status checks.`,
          )
        }
      }

      if (state.jobId === jobId) {
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
    let submittedJobId: number | null = null
    reset()
    state.status = 'queued'
    state.loop = params.loop
    state.message = 'Queuing your clip…'

    try {
      const jobId = await enqueue(params)
      submittedJobId = jobId
      state.jobId = jobId
      history.selectedJobId = jobId
      await fetchJobs(1)

      const job = await waitForJob(jobId)

      if (job.status !== 'DONE') {
        throw new Error(
          job.error || `Video job ${jobId} ${job.status.toLowerCase()}.`,
        )
      }

      if (
        history.selectedJobId === jobId &&
        typeof job.artImageId === 'number'
      ) {
        state.artImageId = job.artImageId
        await loadVideo(job.artImageId)
      }

      if (history.selectedJobId === jobId) {
        state.status = 'done'
        state.message = 'Clip ready.'
      }
      await fetchJobs(1)
    } catch (err) {
      if (submittedJobId === null || history.selectedJobId === submittedJobId) {
        state.status = 'error'
        state.error = err instanceof Error ? err.message : String(err)
        state.message = ''
      }
      await fetchJobs(1)
    }
  }

  async function displaySelectedJob(): Promise<void> {
    const job = selectedJob.value
    if (!job) return
    state.jobId = job.id
    state.attempts = job.attempts
    state.attemptError =
      (job.status === 'PENDING' || job.status === 'RUNNING') && job.attempts > 0
        ? job.error || ''
        : ''
    state.error = job.status === 'FAILED' ? job.error || 'Render failed.' : ''
    state.status =
      job.status === 'DONE'
        ? 'done'
        : job.status === 'RUNNING'
          ? 'rendering'
          : job.status === 'PENDING'
            ? 'queued'
            : 'error'
    state.message =
      job.status === 'DONE'
        ? 'Clip ready.'
        : job.status === 'RUNNING'
          ? 'Rendering on the studio relay…'
          : job.status === 'PENDING'
            ? job.attempts > 0
              ? 'Waiting for the studio relay to retry…'
              : 'Waiting in the studio queue…'
            : job.status === 'CANCELLED'
              ? 'Render cancelled.'
              : ''
    if (job.isMature && !userStore.showMature) {
      state.artImageId = null
      state.videoSrc = ''
      state.fileType = ''
    } else if (job.artImageId && job.status === 'DONE') {
      if (state.artImageId !== job.artImageId || !state.videoSrc) {
        state.videoSrc = ''
        state.artImageId = job.artImageId
        try {
          await loadVideo(job.artImageId)
        } catch (err) {
          if (history.selectedJobId === job.id) {
            state.error =
              err instanceof Error ? err.message : 'Unable to load saved clip.'
          }
        }
      }
    } else {
      state.artImageId = null
      state.videoSrc = ''
      state.fileType = ''
    }
  }

  async function fetchJobs(page = history.page): Promise<void> {
    if (history.loading) return
    history.loading = true
    history.error = ''
    try {
      const res = await performFetch<{
        jobs: VideoGeneratorJobSummary[]
        page: number
        pageCount: number
        totalCount: number
      }>(`/api/video/jobs?page=${page}`, { method: 'GET' }, 1, 20_000)
      if (!res.success || !res.data) {
        history.error = res.message || 'Cannot load saved video jobs.'
        return
      }
      history.jobs = res.data.jobs
      history.page = res.data.page
      history.pageCount = res.data.pageCount
      history.totalCount = res.data.totalCount
      if (!history.jobs.some((job) => job.id === history.selectedJobId)) {
        history.selectedJobId =
          history.jobs.find(
            (job) => job.status === 'RUNNING' || job.status === 'PENDING',
          )?.id ??
          history.jobs[0]?.id ??
          null
      }
      if (history.selectedJobId !== null) {
        await displaySelectedJob()
      } else {
        reset()
      }
    } catch (err) {
      history.error = err instanceof Error ? err.message : String(err)
    } finally {
      history.loading = false
    }
  }

  async function selectJob(id: number): Promise<void> {
    if (!history.jobs.some((job) => job.id === id)) return
    history.selectedJobId = id
    state.videoSrc = ''
    state.artImageId = null
    await displaySelectedJob()
  }

  async function resubmitJob(id: number): Promise<boolean> {
    if (history.actionId !== null) return false
    history.actionId = id
    history.error = ''
    history.notice = ''
    try {
      const res = await performFetch<{ jobId: number }>(
        `/api/video/jobs/${id}/resubmit`,
        { method: 'POST' },
        1,
        60_000,
      )
      if (!res.success || !res.data?.jobId) {
        history.error = res.message || 'Could not resubmit the saved render.'
        return false
      }
      history.selectedJobId = res.data.jobId
      history.notice = `New render #${res.data.jobId} queued using saved images and settings.`
      await fetchJobs(1)
      return true
    } catch (err) {
      history.error = err instanceof Error ? err.message : String(err)
      return false
    } finally {
      history.actionId = null
    }
  }

  async function deleteJob(id: number): Promise<boolean> {
    if (history.actionId !== null) return false
    history.actionId = id
    history.error = ''
    history.notice = ''
    try {
      const res = await performFetch<{ id: number }>(
        `/api/video/jobs/${id}`,
        { method: 'DELETE' },
        1,
        30_000,
      )
      if (!res.success) {
        history.error = res.message || 'Could not remove the saved job.'
        return false
      }
      if (history.selectedJobId === id) history.selectedJobId = null
      history.notice =
        'History entry removed. Finished artwork remains in your gallery.'
      await fetchJobs()
      return true
    } catch (err) {
      history.error = err instanceof Error ? err.message : String(err)
      return false
    } finally {
      history.actionId = null
    }
  }

  async function fetchRecentArt(filter: RecentArtFilter): Promise<void> {
    const requestId = ++recentArt.requestId
    recentArt.loading = true
    recentArt.error = ''
    recentArt.items = []
    try {
      const res = await performFetch<RecentArtJobImage[]>(
        `/api/art/queue/recent-images?limit=24&filter=${filter}`,
        { method: 'GET' },
        1,
        20_000,
      )
      if (requestId !== recentArt.requestId) return
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Recent art could not be loaded.')
      }
      recentArt.items = res.data
    } catch (err) {
      if (requestId === recentArt.requestId) {
        recentArt.error = err instanceof Error ? err.message : String(err)
      }
    } finally {
      if (requestId === recentArt.requestId) recentArt.loading = false
    }
  }

  /**
   * An ArtImage as the data URL the video lanes take for a first frame,
   * with the image's own visibility so a mature still makes a mature clip.
   * Inline bytes when the row has them, otherwise the stored file read back.
   */
  async function loadArtImageFrame(artImageId: number): Promise<{
    dataUrl: string
    isMature: boolean
    isPublic: boolean
  } | null> {
    recentArt.loadingFrameId = artImageId
    recentArt.error = ''
    try {
      const res = await performFetch<ArtImage>(
        `/api/art/image/${artImageId}?includeImageData=true&showMature=true`,
        { method: 'GET' },
        2,
        30_000,
      )
      if (!res.success || !res.data) {
        throw new Error(
          res.message || `Art image ${artImageId} could not be loaded.`,
        )
      }
      const source = resolveArtImageSource(res.data)
      if (source.kind !== 'image' || !source.src) {
        throw new Error(`Art image ${artImageId} is not a still image.`)
      }
      const dataUrl = source.src.startsWith('data:image/')
        ? source.src
        : await blobUrlToDataUrl(source.src)
      return {
        dataUrl,
        isMature: res.data.isMature === true,
        isPublic: res.data.isPublic !== false,
      }
    } catch (err) {
      recentArt.error = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      recentArt.loadingFrameId = null
    }
  }

  return {
    state,
    recentArt,
    loadStudioSettings,
    rememberStudioSettings,
    history,
    selectedJob,
    hasActiveJobs,
    isBusy,
    resultIsImage,
    reset,
    generate,
    fetchJobs,
    selectJob,
    resubmitJob,
    deleteJob,
    fetchRecentArt,
    loadArtImageFrame,
  }
})
