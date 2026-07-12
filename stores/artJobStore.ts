// /stores/artJobStore.ts
//
// Admin-only store backing the ArtJob dashboard (the "artjob" tab under the
// "art" channel). Fetches pipeline stats, ComfyUI/SD uptime, and the job queue
// from the admin-guarded endpoints, and exposes requeue/cancel actions. Every
// call hits an endpoint guarded by requireAdminApiUser / admin-or-serverKey, so
// a non-admin simply gets empty data.
import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import type { ArtJob } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'

export type ArtJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED'

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
  jobs: ArtJob[]
  jobStatusFilter: ArtJobStatus | 'ALL'
  loadingStats: boolean
  loadingUptime: boolean
  loadingJobs: boolean
  error: string | null
  windowHours: number
}

export const useArtJobStore = defineStore('artJobStore', () => {
  const state = reactive<ArtJobState>({
    stats: null,
    uptime: [],
    jobs: [],
    jobStatusFilter: 'PENDING',
    loadingStats: false,
    loadingUptime: false,
    loadingJobs: false,
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
      const res = await performFetch<{ jobs: ArtJob[] }>(
        `/api/art/queue${query}${status === 'ALL' ? '?' : '&'}limit=100`,
      )
      if (res.success && res.data) {
        state.jobs = res.data.jobs
      } else if (!res.success) {
        state.error = res.message || 'Failed to load jobs.'
      }
    } finally {
      state.loadingJobs = false
    }
  }

  async function requeueJob(id: number): Promise<boolean> {
    const res = await performFetch(`/api/art/queue/${id}/requeue`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (res.success) {
      await Promise.all([fetchJobs(), fetchStats()])
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
      await Promise.all([fetchJobs(), fetchStats()])
      return true
    }
    state.error = res.message || `Failed to cancel job ${id}.`
    return false
  }

  async function refreshAll(): Promise<void> {
    state.error = null
    await Promise.all([fetchStats(), fetchUptime(), fetchJobs()])
  }

  function setWindow(hours: number): void {
    state.windowHours = hours
  }

  return {
    ...toRefs(state),
    fetchStats,
    fetchUptime,
    fetchJobs,
    requeueJob,
    cancelJob,
    refreshAll,
    setWindow,
  }
})
