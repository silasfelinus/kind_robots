<!-- /components/art/artjob-manager.vue -->
<!--
  Admin-only ArtJob dashboard (the "artjob" tab under the "art" channel).
  Surfaces the ArtJob pipeline: server management, ComfyUI/SD uptime, image
  create/fail stats, the job queue, and errors. Every data call hits an
  admin-guarded endpoint, so a non-admin sees nothing useful — but we also gate
  the whole surface client-side for a clean message.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="!userStore.isAdmin"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center text-warning"
    >
      The ArtJob dashboard is admin-only.
    </div>

    <div
      v-else
      class="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3"
    >
      <!-- Header / controls -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">ArtJob Pipeline</h2>
          <p class="text-xs text-base-content/60">
            Queue, servers, uptime & errors over the last {{ windowHours }}h.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model.number="selectedWindow"
            class="select select-bordered select-sm rounded-2xl"
            @change="onWindowChange"
          >
            <option :value="6">6h</option>
            <option :value="24">24h</option>
            <option :value="72">3d</option>
            <option :value="168">7d</option>
          </select>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      </div>

      <div
        v-if="artJobStore.error"
        class="rounded-2xl border border-error/40 bg-error/10 p-2 text-xs text-error"
      >
        {{ artJobStore.error }}
      </div>

      <!-- Stat tiles -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="tile in statTiles"
          :key="tile.label"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="text-2xl font-bold" :class="tile.class">
            {{ tile.value }}
          </div>
          <div class="text-[11px] uppercase tracking-wide text-base-content/60">
            {{ tile.label }}
          </div>
        </div>
      </div>

      <div
        v-if="stats?.oldestPending"
        class="rounded-2xl border border-warning/40 bg-warning/10 p-2 text-xs text-warning"
      >
        Oldest PENDING job #{{ stats.oldestPending.id }} has been waiting
        {{ formatAge(stats.oldestPending.ageSeconds) }} — if this keeps
        climbing, the relay isn't draining the queue (check the relay process &
        KR_BASE_URL).
      </div>

      <!-- Servers + Uptime -->
      <div class="grid gap-3 lg:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h3 class="mb-2 text-sm font-semibold">Servers</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="server in serverStore.artServers"
              :key="server.id"
              class="flex items-center justify-between gap-2 rounded-xl border border-base-200 p-2"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium">
                  {{ server.label || server.title }}
                </div>
                <div class="text-[11px] text-base-content/60">
                  {{ server.serverType }} ·
                  <span :class="statusClass(server.lastStatus)">{{
                    server.lastStatus
                  }}</span>
                  <span v-if="server.lastCheckedAt">
                    · {{ formatTime(server.lastCheckedAt) }}</span
                  >
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <span
                  class="badge badge-sm rounded-2xl"
                  :class="server.isActive ? 'badge-success' : 'badge-ghost'"
                >
                  {{ server.isActive ? 'active' : 'off' }}
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl"
                  :disabled="checkingServerId === server.id"
                  @click="checkHealth(server.id)"
                >
                  Check
                </button>
              </div>
            </div>
            <p
              v-if="!serverStore.artServers.length"
              class="text-xs text-base-content/50"
            >
              No art servers registered.
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h3 class="mb-2 text-sm font-semibold">
            Uptime ({{ windowHours }}h)
          </h3>
          <div class="flex flex-col gap-3">
            <div v-for="srv in uptime" :key="srv.serverId">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="font-medium">{{ srv.title }}</span>
                <span :class="uptimeClass(srv.uptimePct)">
                  {{ srv.uptimePct === null ? 'no data' : srv.uptimePct + '%' }}
                  <span
                    v-if="srv.avgLatencyMs !== null"
                    class="text-base-content/50"
                    >· {{ srv.avgLatencyMs }}ms</span
                  >
                </span>
              </div>
              <div class="flex h-4 items-end gap-px overflow-hidden">
                <span
                  v-for="(s, i) in srv.samples"
                  :key="i"
                  class="h-full flex-1"
                  :class="s.ok ? 'bg-success' : 'bg-error'"
                  :title="`${s.status} @ ${formatTime(s.checkedAt)}`"
                />
                <span
                  v-if="!srv.samples.length"
                  class="text-[11px] text-base-content/40"
                  >no samples yet — relay heartbeat not reporting</span
                >
              </div>
            </div>
            <p v-if="!uptime.length" class="text-xs text-base-content/50">
              No ComfyUI/SD servers to track.
            </p>
          </div>
        </div>
      </div>

      <!-- Queue -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold">Queue</h3>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="f in statusFilters"
              :key="f"
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                artJobStore.jobStatusFilter === f ? 'btn-primary' : 'btn-ghost'
              "
              @click="artJobStore.fetchJobs(f)"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="text-[11px]">
                <th>#</th>
                <th>Engine</th>
                <th>Status</th>
                <th>Att</th>
                <th>Claimed by</th>
                <th>Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in artJobStore.jobs" :key="job.id" class="text-xs">
                <td>{{ job.id }}</td>
                <td>{{ job.engine }}</td>
                <td>
                  <span
                    class="badge badge-xs rounded-2xl"
                    :class="jobStatusClass(job.status)"
                    >{{ job.status }}</span
                  >
                </td>
                <td>{{ job.attempts }}</td>
                <td class="max-w-[120px] truncate">
                  {{ job.claimedBy || '—' }}
                </td>
                <td
                  class="max-w-[220px] truncate text-error"
                  :title="job.error || ''"
                >
                  {{ job.error || '' }}
                </td>
                <td class="whitespace-nowrap">
                  <button
                    v-if="job.status !== 'DONE'"
                    type="button"
                    class="btn btn-ghost btn-xs rounded-2xl"
                    @click="artJobStore.requeueJob(job.id)"
                  >
                    Requeue
                  </button>
                  <button
                    v-if="job.status !== 'DONE' && job.status !== 'CANCELLED'"
                    type="button"
                    class="btn btn-ghost btn-xs rounded-2xl text-error"
                    @click="artJobStore.cancelJob(job.id)"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
              <tr v-if="!artJobStore.jobs.length">
                <td
                  colspan="7"
                  class="text-center text-xs text-base-content/50"
                >
                  No {{ artJobStore.jobStatusFilter }} jobs.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtJobStore, type ArtJobStatus } from '@/stores/artJobStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

const artJobStore = useArtJobStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const selectedWindow = ref(24)
const checkingServerId = ref<number | null>(null)

const statusFilters: (ArtJobStatus | 'ALL')[] = [
  'PENDING',
  'RUNNING',
  'FAILED',
  'DONE',
  'CANCELLED',
  'ALL',
]

const stats = computed(() => artJobStore.stats)
const uptime = computed(() => artJobStore.uptime)
const windowHours = computed(() => artJobStore.windowHours)
const isLoading = computed(
  () =>
    artJobStore.loadingStats ||
    artJobStore.loadingUptime ||
    artJobStore.loadingJobs,
)

const statTiles = computed(() => {
  const depth = stats.value?.queueDepth ?? {}
  return [
    { label: 'Pending', value: depth.PENDING ?? 0, class: 'text-warning' },
    { label: 'Running', value: depth.RUNNING ?? 0, class: 'text-info' },
    { label: 'Done', value: depth.DONE ?? 0, class: 'text-success' },
    { label: 'Failed', value: depth.FAILED ?? 0, class: 'text-error' },
    {
      label: 'Stale',
      value: stats.value?.staleRunningCount ?? 0,
      class: 'text-error',
    },
    {
      label: `Images/${windowHours.value}h`,
      value: stats.value?.imagesCreatedInWindow ?? 0,
      class: 'text-primary',
    },
  ]
})

function statusClass(status: string): string {
  if (status === 'ONLINE') return 'text-success'
  if (status === 'OFFLINE') return 'text-error'
  if (status === 'DEGRADED') return 'text-warning'
  return 'text-base-content/50'
}

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-ghost'
  return 'badge-warning'
}

function uptimeClass(pct: number | null): string {
  if (pct === null) return 'text-base-content/50'
  if (pct >= 99) return 'text-success'
  if (pct >= 90) return 'text-warning'
  return 'text-error'
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

function formatTime(value: string | Date | null): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

async function checkHealth(id: number): Promise<void> {
  checkingServerId.value = id
  try {
    await serverStore.testServerHealth(id)
    // The health check writes a ServerHealthCheck row; refresh the chart.
    await Promise.all([
      artJobStore.fetchUptime(),
      serverStore.initialize({ force: true, fetchRemote: true }),
    ])
  } finally {
    checkingServerId.value = null
  }
}

function onWindowChange(): void {
  artJobStore.setWindow(selectedWindow.value)
  void artJobStore.refreshAll()
}

async function refresh(): Promise<void> {
  await artJobStore.refreshAll()
}

onMounted(async () => {
  if (!userStore.isAdmin) return
  selectedWindow.value = artJobStore.windowHours
  await Promise.all([
    serverStore.initialize({ force: false, fetchRemote: true }),
    artJobStore.refreshAll(),
  ])
})
</script>
