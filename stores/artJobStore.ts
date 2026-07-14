// /stores/artJobStore.ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type {
  ArtImage,
  ArtJob,
  Prisma,
} from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { resolveArtImageSource } from '~/utils/artImageSource'
import type { ArtImageSource } from '~/utils/artImageSource'

export type ArtJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED'

export type ArtJobRetryMode = 'NEW_OUTPUT' | 'OVERWRITE'
export type ArtFeedbackSource = 'CURATOR' | 'HUMAN'
export type ArtFeedbackVerdict = 'PROMOTE' | 'REVISE' | 'REJECT'

export type ArtJobFeedback = Prisma.JsonObject & {
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

export type ArtJobCuration = Prisma.JsonObject & {
  curator?: ArtJobFeedback
  human?: ArtJobFeedback
  history?: ArtJobFeedback[]
}

export type ArtJobRetry = Prisma.JsonObject & {
  mode?: ArtJobRetryMode
  sourceJobId?: number | null
  rootJobId?: number | null
  targetArtImageId?: number | null
  archivedArtImageId?: number | null
  refreshSeed?: boolean
  requestedAt?: string
  completedAt?: string
}

export type ArtJobPayload = Prisma.JsonObject & {
  curation?: ArtJobCuration
  retry?: ArtJobRetry
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

export type CurateRequestResult = {
  requested: number[]
  alreadyQueued: number[]
  ineligible: number[]
  missing: number[]
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
  // Full resolver result per id: src + kind ('image'|'video'|'none') + a
  // human-readable `reason` and `diag` block so a blank tile can explain itself.
  imageInfoById: Record<number, ArtImageSource>
  jobStatusFilter: ArtJobStatus | 'ALL'
  loadingStats: boolean
  loadingUptime: boolean
  loadingJobs: boolean
  loadingTrainerJobs: boolean
  retryingJobIds: number[]
  // Jobs with a curate-request POST in flight, and jobs a request has been queued
  // for this session (so the UI can show "Curation requested" before Conductor's
  // verdict lands in payload.curation.curator).
  curationRequestingIds: number[]
  curationRequestedIds: number[]
  error: string | null
  windowHours: number
}

const MAX_JOB_IMAGES = 240

export const useArtJobStore = defineStore('artJobStore', () => {
  const state = reactive<ArtJobState>({
    stats: null,
    uptime: [],
    jobs: [],
    trainerJobs: [],
    imageSrcById: {},
    imageInfoById: {},
    jobStatusFilter: 'PENDING',
    loadingStats: false,
    loadingUptime: false,
    loadingJobs: false,
    loadingTrainerJobs: false,
    retryingJobIds: [],
    curationRequestingIds: [],
    curationRequestedIds: [],
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

  function completedOverwriteIds(jobs: ArtJobRecord[]): number[] {
    const ids = jobs
      .filter((job) => {
        return (
          job.status === 'DONE' &&
          job.payload?.retry?.mode === 'OVERWRITE' &&
          typeof job.artImageId === 'number'
        )
      })
      .map((job) => job.artImageId as number)
      .filter((id, index, all) => all.indexOf(id) === index)

    // Stable ids are the point of overwrite, but that means an existing data URL
    // is no longer proof that the current bytes are hydrated. Force these ids to
    // reload whenever a completed overwrite is observed.
    for (const id of ids) {
      delete state.imageSrcById[id]
      delete state.imageInfoById[id]
    }
    return ids
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
        const forceImageIds = completedOverwriteIds(res.data.jobs)
        state.jobs = res.data.jobs
        void loadJobImages(forceImageIds)
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
        const forceImageIds = completedOverwriteIds(res.data.jobs)
        state.trainerJobs = res.data.jobs.filter((job) => {
          return Boolean(job.payload?.curation?.curator)
        })
        void loadJobImages(forceImageIds)
      } else if (!res.success) {
        state.error = res.message || 'Failed to load curated jobs.'
      }
    } finally {
      state.loadingTrainerJobs = false
    }
  }

  // Delegates to the shared resolver (utils/artImageSource) so the ArtJob cards
  // use the same robust, video-aware, path-normalizing logic as the main gallery
  // instead of the old narrow rule that dropped any path not under /images/.
  function artImageToSrc(image: ArtImage | null | undefined): string {
    return resolveArtImageSource(image).src
  }

  async function loadJobImages(forceIds: number[] = []): Promise<void> {
    const ids = [
      ...forceIds,
      ...[...state.jobs, ...state.trainerJobs]
        .filter((job) => {
          return job.status === 'DONE' && typeof job.artImageId === 'number'
        })
        .map((job) => job.artImageId as number),
    ]
      .filter((id, index, all) => all.indexOf(id) === index)
      .filter((id) => forceIds.includes(id) || !(id in state.imageSrcById))
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
          const info = resolveArtImageSource(res.data)
          state.imageInfoById[id] = info
          state.imageSrcById[id] = info.src
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

  // Ask Conductor to curate finished ArtJob(s). Accepts one id or a batch; the
  // bridge (POST /api/conductor/curate-request) queues them in conductor's
  // projects/curation/requests.yaml. Conductor's sweep then POSTs source=CURATOR
  // feedback back, which surfaces in the trainer panel.
  async function requestCuration(
    jobIds: number | number[],
    note?: string,
  ): Promise<CurateRequestResult | null> {
    const ids = (Array.isArray(jobIds) ? jobIds : [jobIds]).filter(
      (id): id is number => Number.isInteger(id) && id > 0,
    )
    if (!ids.length) return null

    const inFlight = ids.filter((id) => !state.curationRequestingIds.includes(id))
    if (!inFlight.length) return null
    state.curationRequestingIds = [...state.curationRequestingIds, ...inFlight]

    try {
      const payload =
        inFlight.length === 1
          ? { jobId: inFlight[0], note }
          : { jobIds: inFlight, note }
      const res = await performFetch<CurateRequestResult>(
        '/api/conductor/curate-request',
        { method: 'POST', body: JSON.stringify(payload) },
      )

      if (res.success && res.data) {
        const queued = [...res.data.requested, ...res.data.alreadyQueued]
        const merged = new Set([...state.curationRequestedIds, ...queued])
        state.curationRequestedIds = [...merged]
        return res.data
      }

      state.error = res.message || 'Failed to request curation.'
      return null
    } finally {
      state.curationRequestingIds = state.curationRequestingIds.filter(
        (id) => !inFlight.includes(id),
      )
    }
  }

  // Trainer empty-state CTA: ask Conductor to curate every uncurated finished job
  // in the current window (the bridge selects them server-side). Returns how many
  // were newly queued.
  async function requestWindowCuration(
    windowHours: number = state.windowHours,
    note?: string,
  ): Promise<CurateRequestResult | null> {
    const res = await performFetch<CurateRequestResult>(
      '/api/conductor/curate-request',
      { method: 'POST', body: JSON.stringify({ window: windowHours, note }) },
    )
    if (res.success && res.data) {
      const queued = [...res.data.requested, ...res.data.alreadyQueued]
      state.curationRequestedIds = [
        ...new Set([...state.curationRequestedIds, ...queued]),
      ]
      return res.data
    }
    state.error = res.message || 'Failed to request curation.'
    return null
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

  async function reenqueueJob(
    id: number,
    mode: ArtJobRetryMode = 'NEW_OUTPUT',
  ): Promise<number | null> {
    if (state.retryingJobIds.includes(id)) return null
    state.retryingJobIds = [...state.retryingJobIds, id]

    try {
      const res = await performFetch<{
        job: ArtJobRecord
        mode: ArtJobRetryMode
        targetArtImageId: number | null
      }>(`/api/art/queue/${id}/reenqueue`, {
        method: 'POST',
        body: JSON.stringify({ mode, refreshSeed: true }),
      })

      if (res.success && res.data?.job) {
        await Promise.all([fetchJobs(), fetchStats(), fetchTrainerJobs()])
        return res.data.job.id
      }

      state.error = res.message || `Failed to re-enqueue job ${id}.`
      return null
    } finally {
      state.retryingJobIds = state.retryingJobIds.filter(
        (jobId) => jobId !== id,
      )
    }
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
    requestCuration,
    requestWindowCuration,
    requeueJob,
    cancelJob,
    reenqueueJob,
    refreshAll,
    setWindow,
  }
})