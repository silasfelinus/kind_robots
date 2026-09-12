<!-- /components/art/artjob-queue-browser.vue -->
<template>
  <section class="kr-surface gap-0">
    <div
      v-if="!userStore.isAdmin"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center text-warning"
    >
      The ArtJob dashboard is admin-only.
    </div>

    <div v-else class="flex h-full kr-scroll flex-col gap-3 p-3">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">ArtJob Pipeline</h2>
          <p class="kr-text-dim-xs-60">
            Paginated queue, editable generation briefs, render health, and
            recovery tools.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model.number="selectedWindow"
            class="select select-bordered select-sm rounded-2xl"
            @change="onWindowChange"
          >
            <option :value="6">6h metrics</option>
            <option :value="24">24h metrics</option>
            <option :value="72">3d metrics</option>
            <option :value="168">7d metrics</option>
          </select>
          <button
            type="button"
            class="btn btn-secondary btn-sm rounded-2xl"
            title="Watch finished renders full screen, newest first"
            @click="slideshowOpen = true"
          >
            Slideshow
          </button>
          <button
            type="button"
            class="kr-btn-primary-2xl"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="kr-spinner-xs" />
            Refresh
          </button>
        </div>
      </header>

      <div
        v-if="artJobStore.error"
        class="kr-note kr-note-error p-3 font-normal"
      >
        {{ artJobStore.error }}
      </div>

      <div
        v-if="stats?.oldestPending"
        class="kr-note kr-note-warning p-3 text-xs text-warning-content font-normal"
      >
        Oldest pending job #{{ stats.oldestPending.id }} has waited
        {{ formatAge(stats.oldestPending.ageSeconds) }}.
      </div>

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
      >
        <button
          v-for="filter in statusFilters"
          :key="filter"
          type="button"
          class="kr-panel-flat p-3 text-left transition hover:border-primary/50 hover:bg-base-200/50"
          :class="
            artJobStore.jobStatusFilter === filter
              ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
              : ''
          "
          :aria-pressed="artJobStore.jobStatusFilter === filter"
          :title="`Show ${filter} jobs in the queue browser`"
          @click="changeStatus(filter)"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide"
              :class="
                artJobStore.jobStatusFilter === filter
                  ? 'text-primary'
                  : 'text-base-content/50'
              "
            >
              {{ filter }}
            </span>
            <span
              v-if="artJobStore.jobStatusFilter === filter"
              class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary"
            >
              <span v-if="artJobStore.loadingJobs" class="kr-spinner-xs" />
              Showing
            </span>
          </div>
          <div class="kr-text-black-2xl mt-1">{{ statusCount(filter) }}</div>
        </button>
      </div>

      <div class="grid gap-3 xl:grid-cols-2">
        <div class="kr-panel-flat p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Private art servers</h3>
            <button
              type="button"
              class="kr-btn-xs-2xl"
              :class="
                artJobStore.queuePaused
                  ? 'btn-success'
                  : 'btn-warning btn-outline'
              "
              :disabled="artJobStore.togglingQueuePause"
              @click="artJobStore.setQueuePaused(!artJobStore.queuePaused)"
            >
              {{ artJobStore.queuePaused ? 'Resume queue' : 'Pause queue' }}
            </button>
          </div>
          <div
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2"
          >
            <div
              v-for="server in privateArtServers"
              :key="server.id"
              class="rounded-xl border border-base-200 p-2"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="serverStatusDotClass(server.lastStatus)"
                    :title="server.lastStatus"
                  />
                  <span class="truncate text-sm font-semibold">
                    {{ server.label || server.title }}
                  </span>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="kr-btn-xs btn-ghost px-2"
                    :disabled="refreshingServerIds.includes(server.id)"
                    title="Re-check this server now"
                    @click="refreshServer(server.id)"
                  >
                    <span
                      v-if="refreshingServerIds.includes(server.id)"
                      class="kr-spinner-xs"
                    />
                    <span v-else>Refresh</span>
                  </button>
                  <button
                    type="button"
                    class="kr-btn-xs btn-ghost px-2 text-error"
                    :disabled="removingServerIds.includes(server.id)"
                    title="Remove this server"
                    @click="removeServer(server)"
                  >
                    <span
                      v-if="removingServerIds.includes(server.id)"
                      class="kr-spinner-xs"
                    />
                    <span v-else>Remove</span>
                  </button>
                </div>
              </div>
              <div class="mt-1 text-[11px] text-base-content/60">
                {{ server.serverType }} · {{ server.lastStatus }}
              </div>
            </div>
            <p v-if="!privateArtServers.length" class="kr-text-dim-xs">
              No private art servers registered.
            </p>
          </div>
        </div>

        <div class="kr-panel-flat p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Uptime · {{ windowHours }}h</h3>
            <div
              class="flex items-center gap-3 text-[10px] text-base-content/50"
            >
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-success" /> up
              </span>
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-error" /> down
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="server in uptime"
              :key="server.serverId"
              class="rounded-xl bg-base-200/50 p-2"
            >
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="truncate font-semibold">{{ server.title }}</span>
                <span :class="uptimeClass(server.uptimePct)">
                  {{
                    server.uptimePct === null
                      ? 'no data'
                      : `${server.uptimePct}%`
                  }}
                  <span
                    v-if="server.avgLatencyMs !== null"
                    class="text-base-content/50"
                  >
                    · {{ server.avgLatencyMs }}ms
                  </span>
                </span>
              </div>
              <div
                v-if="server.samples.length"
                class="mt-2 flex h-8 items-stretch gap-px overflow-hidden rounded"
              >
                <span
                  v-for="(sample, index) in server.samples"
                  :key="index"
                  class="min-w-0 flex-1 rounded-sm"
                  :class="sample.ok ? 'bg-success' : 'bg-error'"
                  :title="sampleTooltip(sample)"
                />
              </div>
              <p v-else class="mt-2 text-[11px] text-base-content/40">
                No samples in this window.
              </p>
            </div>
            <p v-if="!uptime.length" class="kr-text-dim-xs">
              No uptime samples yet.
            </p>
          </div>
        </div>
      </div>

      <section class="kr-panel-flat p-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold">Queue browser</h3>
            <span class="text-[11px] text-base-content/50">
              {{ artJobStore.jobStatusFilter }} · showing {{ pageStart }}–{{
                pageEnd
              }}
              of {{ artJobStore.jobTotalCount }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-200 bg-base-200/30 p-2"
          >
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <label class="flex items-center gap-2">
                <span class="font-semibold">Per page</span>
                <input
                  v-model="pageSizeInput"
                  list="artjob-page-size-presets"
                  type="number"
                  min="1"
                  max="100"
                  class="kr-input-rounded-xl input-xs w-20"
                  @keyup.enter="applyPageSize"
                />
              </label>
              <button
                type="button"
                class="kr-btn-ghost-xs"
                :disabled="artJobStore.loadingJobs"
                @click="applyPageSize"
              >
                Apply
              </button>
              <span class="text-base-content/50">1–100; default 20</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="kr-btn-ghost-xs-2xl"
                :disabled="
                  !artJobStore.jobHasPreviousPage || artJobStore.loadingJobs
                "
                @click="artJobStore.setJobPage(artJobStore.jobPage - 1)"
              >
                Previous
              </button>
              <label class="flex items-center gap-1 text-xs">
                <span>Page</span>
                <input
                  v-model="pageInput"
                  type="number"
                  min="1"
                  :max="artJobStore.jobPageCount"
                  class="kr-input-rounded-xl input-xs w-16 text-center"
                  @keyup.enter="applyPage"
                />
                <span>of {{ artJobStore.jobPageCount }}</span>
              </label>
              <button
                type="button"
                class="kr-btn-ghost-xs-2xl"
                :disabled="
                  !artJobStore.jobHasNextPage || artJobStore.loadingJobs
                "
                @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="artJobStore.loadingJobs && !artJobStore.jobs.length"
          class="mt-3 flex min-h-40 flex-col items-center justify-center gap-3 kr-panel-dashed-plain text-center"
        >
          <span class="loading loading-spinner loading-md text-primary" />
          <p class="kr-text-dim-sm-70">{{ queueLoadMessage }}</p>
        </div>

        <div
          v-else
          class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3"
        >
          <artjob-queue-card
            v-for="job in artJobStore.jobs"
            :key="job.id"
            :job="job"
            @edit="openEditor"
          />

          <div
            v-if="!artJobStore.jobs.length && !artJobStore.loadingJobs"
            class="kr-text-dim-sm-50 kr-panel-dashed-plain text-center xl:col-span-2"
          >
            No {{ artJobStore.jobStatusFilter }} jobs on this page.
          </div>
        </div>

        <div
          v-if="artJobStore.jobPageCount > 1"
          class="mt-3 flex items-center justify-center gap-2 border-t border-base-200 pt-3"
        >
          <button
            type="button"
            class="kr-btn-ghost-2xl"
            :disabled="!artJobStore.jobHasPreviousPage"
            @click="artJobStore.setJobPage(artJobStore.jobPage - 1)"
          >
            Previous
          </button>
          <span class="text-xs"
            >Page {{ artJobStore.jobPage }} of
            {{ artJobStore.jobPageCount }}</span
          >
          <button
            type="button"
            class="kr-btn-ghost-2xl"
            :disabled="!artJobStore.jobHasNextPage"
            @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
          >
            Next
          </button>
        </div>
      </section>
    </div>

    <artjob-slideshow v-if="slideshowOpen" @close="slideshowOpen = false" />

    <artjob-editor
      v-if="editorJob"
      :job="editorJob"
      :action="editorAction"
      @close="editorJob = null"
    />

    <datalist id="artjob-page-size-presets">
      <option value="20" />
      <option value="50" />
      <option value="100" />
    </datalist>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useArtJobStore,
  type ArtJobRecord,
  type ArtJobStatus,
  type UptimeSample,
} from '@/stores/artJobStore'
import { useLoadStore } from '@/stores/loadStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Server } from '@/stores/serverStore'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'

const artJobStore = useArtJobStore()
const loadStore = useLoadStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const selectedWindow = ref(24)
const pageSizeInput = ref('20')
const pageInput = ref('1')
const queueLoadMessage = ref(loadStore.randomLoadMessage())
const editorJob = ref<ArtJobRecord | null>(null)
const slideshowOpen = ref(false)
const editorAction = ref<EditorAction>('EDIT')
const refreshingServerIds = ref<number[]>([])
const removingServerIds = ref<number[]>([])

const statusFilters: Array<ArtJobStatus | 'ALL'> = [
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
const privateArtServers = computed<Server[]>(() =>
  serverStore.artServers.filter(
    (server: Server) =>
      server.serverType === 'COMFY' || server.serverType === 'A1111',
  ),
)
const isLoading = computed(
  () =>
    artJobStore.loadingStats ||
    artJobStore.loadingUptime ||
    artJobStore.loadingJobs,
)
const pageStart = computed(() => {
  if (!artJobStore.jobTotalCount) return 0
  return (artJobStore.jobPage - 1) * artJobStore.jobPageSize + 1
})
const pageEnd = computed(() =>
  Math.min(
    artJobStore.jobPage * artJobStore.jobPageSize,
    artJobStore.jobTotalCount,
  ),
)

watch(
  () => artJobStore.jobPage,
  (page) => {
    pageInput.value = String(page)
  },
)
watch(
  () => artJobStore.jobPageSize,
  (size) => {
    pageSizeInput.value = String(size)
  },
)

function statusCount(status: ArtJobStatus | 'ALL'): number {
  const depth = stats.value?.queueDepth ?? {}
  if (status === 'ALL') {
    return Object.values(depth).reduce((total, count) => total + count, 0)
  }
  return depth[status] ?? 0
}

function uptimeClass(value: number | null): string {
  if (value === null) return 'text-base-content/50'
  if (value >= 99) return 'text-success'
  if (value >= 90) return 'text-warning'
  return 'text-error'
}

function serverStatusDotClass(status: string | null | undefined): string {
  if (status === 'ONLINE') return 'bg-success'
  if (status === 'OFFLINE') return 'bg-error'
  if (status === 'DEGRADED') return 'bg-warning'
  return 'bg-base-content/30'
}

function sampleTooltip(sample: UptimeSample): string {
  const when = formatDateTime(sample.checkedAt)
  const state = sample.ok ? 'up' : 'down'
  const latency = sample.latencyMs === null ? '' : ` · ${sample.latencyMs}ms`
  return `${when} · ${state}${latency}`
}

async function refreshServer(id: number): Promise<void> {
  if (refreshingServerIds.value.includes(id)) return
  refreshingServerIds.value = [...refreshingServerIds.value, id]
  try {
    await serverStore.testServerHealth(id)
    await artJobStore.fetchUptime()
  } finally {
    refreshingServerIds.value = refreshingServerIds.value.filter(
      (serverId) => serverId !== id,
    )
  }
}

async function removeServer(server: Server): Promise<void> {
  if (removingServerIds.value.includes(server.id)) return
  const confirmed = window.confirm(
    `Remove art server "${server.label || server.title}"? This deletes the server record.`,
  )
  if (!confirmed) return

  removingServerIds.value = [...removingServerIds.value, server.id]
  try {
    const result = await serverStore.deleteServer(server.id)
    if (result.success) {
      await artJobStore.fetchUptime()
    } else {
      artJobStore.error = result.message || 'Failed to remove server.'
    }
  } finally {
    removingServerIds.value = removingServerIds.value.filter(
      (serverId) => serverId !== server.id,
    )
  }
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function openEditor(job: ArtJobRecord, action: EditorAction): void {
  editorJob.value = job
  editorAction.value = action
}

async function changeStatus(status: ArtJobStatus | 'ALL'): Promise<void> {
  queueLoadMessage.value = loadStore.randomLoadMessage()
  await artJobStore.fetchJobs(status, 1)
}

async function applyPageSize(): Promise<void> {
  const size = Number(pageSizeInput.value)
  queueLoadMessage.value = loadStore.randomLoadMessage()
  await artJobStore.setJobPageSize(Number.isFinite(size) ? size : 20)
}

async function applyPage(): Promise<void> {
  const page = Number(pageInput.value)
  queueLoadMessage.value = loadStore.randomLoadMessage()
  await artJobStore.setJobPage(Number.isFinite(page) ? page : 1)
}

function onWindowChange(): void {
  artJobStore.setWindow(selectedWindow.value)
  void artJobStore.refreshAll()
}

async function refresh(): Promise<void> {
  queueLoadMessage.value = loadStore.randomLoadMessage()
  await artJobStore.refreshAll()
}

async function loadSecondaryDashboardData(): Promise<void> {
  await Promise.all([
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ force: false, fetchRemote: true })]),
    artJobStore.fetchStats(),
    artJobStore.fetchUptime(),
    artJobStore.fetchQueueControl(),
  ])
}

onMounted(async () => {
  if (!userStore.isAdmin) return
  selectedWindow.value = artJobStore.windowHours
  pageSizeInput.value = String(artJobStore.jobPageSize || 20)
  pageInput.value = String(artJobStore.jobPage || 1)

  if (artJobStore.jobs.length) {
    void artJobStore.fetchJobs()
    void loadSecondaryDashboardData()
    return
  }

  queueLoadMessage.value = loadStore.randomLoadMessage()
  await artJobStore.fetchJobs()
  void loadSecondaryDashboardData()
})
</script>
