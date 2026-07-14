// /stores/artJobStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type { ArtImage, ArtJob } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'

export type ArtJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED'

export type ArtFeedbackSource = 'CURATOR' | 'HUMAN'
export type ArtFeedbackVerdict = 'PROMOTE' | 'REVISE' | 'REJECT'

export type ArtJobFeedback = {
  source: ArtFeedbackSource
  verdict: ArtFeedbackVerdict
  score: number | null
  summary: string | null
  reasons: string[]
  tags: string[]
  rubricKey: string | null
  createdAt: string
  userId: number | null
}

export type ArtJobCuration = {
  curator?: ArtJobFeedback
  human?: ArtJobFeedback
  history?: ArtJobFeedback[]
}

export type ArtJobPayload = Record<string, unknown> & {
  curation?: ArtJobCuration
}

export type ArtJobRecord = Omit<ArtJob, 'payload'> & {
  payload: ArtJobPayload
}

export type SubmitArtFeedbackInput = {
  source: ArtFeedbackSource
  verdict: ArtFeedbackVerdict
  score?: number | null
  summary?: string | null
  reasons?: string[]
  tags?: string[]
  rubricKey?: string | null
}

export type QueueStats = {
  windowHours: number
  since: string
  queueDepth: Record<string, number>
  windowThroughput: Record<string, number>
  oldestPending:
    | (Pick<ArtJob, 'id' | 'engine' | 'projectSlug'> & {
        createdAt: string
        ageSeconds: number
      })
    | null
  staleRunningCount: number
  staleRunning: Array<
    Pick<ArtJob, 'id' | 'engine' | 'attempts' | 'claimedBy' | 'projectSlug'> & {
      claimedAt: string | null
    }
  >
  recentFailed: Array<
    Pick<ArtJob, 'id' | 'engine' | 'attempts' | 'error' | 'projectSlug'> & {
      updatedAt: string | null
    }
  >
  imagesCreatedInWindow: number
  imagesByServer: Array<{ serverName: string | null; count: number }>
}

export type UptimeSample = {
  checkedAt: string
  ok: boolean
  status: string
  latencyMs: number | null
  source: string
}

export type ServerUptime = {
  serverId: number
  title: string
  serverType: string
  isActive: boolean
  lastStatus: string
  lastCheckedAt: string | null
  windowHours: number
  sampleCount: number
  okCount: number
  uptimePct: number | null
  avgLatencyMs: number | null
  samples: UptimeSample[]
}

type ArtJobState = {
  stats: QueueStats | null
  uptime: ServerUptime[]
  jobs: ArtJobRecord[]
  trainerJobs: ArtJobRecord[]
  imageSrcById: Record<number, string>
  jobStatusFilter: ArtJobStatus | 'ALL'
  loadingStats: boolean
  loadingUptime: boolean
  loadingJobs: boolean
  loadingTrainerJobs: boolean
  error: string | null
  windowHours: number
}

const MAX_JOB_IMAGES = 72

export const useArtJobStore = defineStore('artJobStore', () => {
  const state = reactive<ArtJobState>({
    stats: null,
    uptime: [],
    jobs: [],
    trainerJobs: [],
    imageSrcById: {},
    jobStatusFilter: 'PENDING',
    loadingStats: false,
    loadingUptime: false,
    loadingJobs: false,
    loadingTrainerJobs: false,
    error: null,
    windowHours: 24,
  })

  async function fetchStats(): Promise<void> {
    state.loadingStats = true
    try {
      const res = await performFetch<QueueStats>(
        `/api/art/queue/stats?window=${state.windowHours}`,
      )
      if (res.success && res.data) {
        state.stats = res.data
      } else if (!res.success) {
        state.error = res.message || 'Failed to load stats.'
      }
    } finally {
      state.loadingStats = false
    }
  }

  async function fetchUptime(): Promise<void> {
    state.loadingUptime = true
    try {
      const res = await performFetch<{ servers: ServerUptime[] }>(
        `/api/server/uptime?window=${state.windowHours}`,
      )
      if (res.success && res.data) {
        state.uptime = res.data.servers
      } else if (!res.success) {
        state.error = res.message || 'Failed to load uptime.'
      }
    } finally {
      state.loadingUptime = false
    }
  }

  async function fetchJobs(
    status: ArtJobStatus | 'ALL' = state.jobStatusFilter,
  ): Promise<void> {
    state.jobStatusFilter = status
    state.loadingJobs = true
    try {
      const query = status === 'ALL' ? '' : `?status=${status}`
      const res = await performFetch<{ jobs: ArtJobRecord[] }>(
        `/api/art/queue${query}${status === 'ALL' ? '?' : '&'}limit=100`,
      )
      if (res.success && res.data) {
        state.jobs = res.data.jobs
        void loadJobImages()
      } else if (!res.success) {
        state.error = res.message || 'Failed to load jobs.'
      }
    } finally {
      state.loadingJobs = false
    }
  }

  async function fetchTrainerJobs(): Promise<void> {
    state.loadingTrainerJobs = true
    try {
      const res = await performFetch<{ jobs: ArtJobRecord[] }>(
        '/api/art/queue?status=DONE&limit=200',
      )
      if (res.success && res.data) {
        state.trainerJobs = res.data.jobs.filter((job) => {
          return Boolean(job.payload?.curation?.curator)
        })
        void loadJobImages()
      } else if (!res.success) {
        state.error = res.message || 'Failed to load curated jobs.'
      }
    } finally {
      state.loadingTrainerJobs = false
    }
  }

  function artImageToSrc(image: ArtImage | null | undefined): string {
    if (!image) return ''
    const raw = (image.imageData || '').trim()
    if (raw) {
      if (raw.startsWith('data:image/')) return raw
      if (!raw.startsWith('/') && !raw.startsWith('http')) {
        return `data:image/${image.fileType || 'png'};base64,${raw}`
      }
    }
    const path = (image.imagePath || image.path || '').trim()
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('data:')) return path
    if (path.startsWith('/images/')) return path
    if (path.startsWith('images/')) return `/${path}`
    return ''
  }

  async function loadJobImages(): Promise<void> {
    const ids = [...state.jobs, ...state.trainerJobs]
      .filter((job) => {
        return job.status === 'DONE' && typeof job.artImageId === 'number'
      })
      .map((job) => job.artImageId as number)
      .filter((id, index, all) => all.indexOf(id) === index)
      .filter((id) => !(id in state.imageSrcById))
      .slice(0, MAX_JOB_IMAGES)

    if (!ids.length) return

    await Promise.all(
      ids.map(async (id) => {
        const res = await performFetch<ArtImage>(
          `/api/art/image/${id}?includeImageData=true`,
          { method: 'GET' },
          1,
          30_000,
        )
        if (res.success && res.data) {
          state.imageSrcById[id] = artImageToSrc(res.data)
        }
      }),
    )
  }

  function replaceJob(updated: ArtJobRecord): void {
    const jobIndex = state.jobs.findIndex((job) => job.id === updated.id)
    if (jobIndex >= 0) state.jobs[jobIndex] = updated

    const trainerIndex = state.trainerJobs.findIndex(
      (job) => job.id === updated.id,
    )
    if (trainerIndex >= 0) state.trainerJobs[trainerIndex] = updated
  }

  async function submitFeedback(
    id: number,
    input: SubmitArtFeedbackInput,
  ): Promise<boolean> {
    const res = await performFetch<{ job: ArtJobRecord }>(
      `/api/art/queue/${id}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    )

    if (res.success && res.data?.job) {
      replaceJob(res.data.job)
      return true
    }

    state.error = res.message || `Failed to save feedback for job ${id}.`
    return false
  }

  async function requeueJob(id: number): Promise<boolean> {
    const res = await performFetch(`/api/art/queue/${id}/requeue`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (res.success) {
      await Promise.all([fetchJobs(), fetchStats(), fetchTrainerJobs()])
      return true
    }
    state.error = res.message || `Failed to requeue job ${id}.`
    return false
  }

  async function cancelJob(id: number): Promise<boolean> {
    const res = await performFetch(`/api/art/queue/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (res.success) {
      await Promise.all([fetchJobs(), fetchStats(), fetchTrainerJobs()])
      return true
    }
    state.error = res.message || `Failed to cancel job ${id}.`
    return false
  }

  async function reenqueueJob(id: number): Promise<number | null> {
    const res = await performFetch<{ job: ArtJobRecord }>(
      `/api/art/queue/${id}/reenqueue`,
      { method: 'POST', body: JSON.stringify({}) },
    )
    if (res.success && res.data?.job) {
      await Promise.all([fetchJobs(), fetchStats(), fetchTrainerJobs()])
      return res.data.job.id
    }
    state.error = res.message || `Failed to re-enqueue job ${id}.`
    return null
  }

  async function refreshAll(): Promise<void> {
    state.error = null
    await Promise.all([
      fetchStats(),
      fetchUptime(),
      fetchJobs(),
      fetchTrainerJobs(),
    ])
  }

  function setWindow(hours: number): void {
    state.windowHours = hours
  }

  return {
    ...toRefs(state),
    fetchStats,
    fetchUptime,
    fetchJobs,
    fetchTrainerJobs,
    submitFeedback,
    requeueJob,
    cancelJob,
    reenqueueJob,
    refreshAll,
    setWindow,
  }
})