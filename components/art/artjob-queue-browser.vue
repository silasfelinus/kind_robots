<!-- /components/art/artjob-queue-browser.vue -->
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
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">ArtJob Pipeline</h2>
          <p class="text-xs text-base-content/60">
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
            class="btn btn-primary btn-sm rounded-2xl"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      </header>

      <div
        v-if="artJobStore.error"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ artJobStore.error }}
      </div>

      <div
        v-if="repairMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          repairPreview?.unresolvedCount
            ? 'border-warning/40 bg-warning/10'
            : 'border-success/40 bg-success/10'
        "
      >
        {{ repairMessage }}
      </div>

      <div
        v-if="stats?.oldestPending"
        class="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-content"
      >
        Oldest pending job #{{ stats.oldestPending.id }} has waited
        {{ formatAge(stats.oldestPending.ageSeconds) }}.
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="status in summaryStatuses"
          :key="status"
          class="kr-panel-flat p-3"
        >
          <div
            class="text-[11px] font-semibold uppercase tracking-wide text-base-content/50"
          >
            {{ status }}
          </div>
          <div class="mt-1 text-2xl font-black">{{ statusCount(status) }}</div>
        </div>
      </div>

      <div class="grid gap-3 xl:grid-cols-2">
        <div class="kr-panel-flat p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Private art servers</h3>
            <button
              type="button"
              class="btn btn-xs rounded-2xl"
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
          <div class="grid gap-2 sm:grid-cols-2">
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
                    class="btn btn-ghost btn-xs rounded-xl px-2"
                    :disabled="refreshingServerIds.includes(server.id)"
                    title="Re-check this server now"
                    @click="refreshServer(server.id)"
                  >
                    <span
                      v-if="refreshingServerIds.includes(server.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    <span v-else>Refresh</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-xl px-2 text-error"
                    :disabled="removingServerIds.includes(server.id)"
                    title="Remove this server"
                    @click="removeServer(server)"
                  >
                    <span
                      v-if="removingServerIds.includes(server.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    <span v-else>Remove</span>
                  </button>
                </div>
              </div>
              <div class="mt-1 text-[11px] text-base-content/60">
                {{ server.serverType }} · {{ server.lastStatus }}
              </div>
            </div>
            <p
              v-if="!privateArtServers.length"
              class="text-xs text-base-content/50"
            >
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
            <p v-if="!uptime.length" class="text-xs text-base-content/50">
              No uptime samples yet.
            </p>
          </div>
        </div>
      </div>

      <section class="kr-panel-flat p-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold">Queue browser</h3>
              <span class="text-[11px] text-base-content/50">
                Showing {{ pageStart }}–{{ pageEnd }} of
                {{ artJobStore.jobTotalCount }}
              </span>
              <button
                type="button"
                class="btn btn-secondary btn-xs rounded-2xl"
                :disabled="artJobStore.repairingWeakPrompts"
                @click="previewWeakPromptRepair"
              >
                <span
                  v-if="artJobStore.repairingWeakPrompts"
                  class="loading loading-spinner loading-xs"
                />
                Find bad prompts
              </button>
              <button
                v-if="repairPreview?.repairedCount"
                type="button"
                class="btn btn-warning btn-xs rounded-2xl"
                :disabled="artJobStore.repairingWeakPrompts"
                @click="runWeakPromptRepair"
              >
                Repair & queue {{ repairPreview.repairedCount }}
              </button>
            </div>

            <div class="flex flex-wrap gap-1">
              <button
                v-for="filter in statusFilters"
                :key="filter"
                type="button"
                class="btn btn-xs rounded-2xl"
                :class="
                  artJobStore.jobStatusFilter === filter
                    ? 'btn-primary'
                    : 'btn-ghost'
                "
                @click="changeStatus(filter)"
              >
                {{ filter }}
                <span class="ml-1 font-mono opacity-70">{{
                  statusCount(filter)
                }}</span>
              </button>
            </div>
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
                  class="input input-bordered input-xs w-20 rounded-xl"
                  @keyup.enter="applyPageSize"
                />
              </label>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl"
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
                class="btn btn-ghost btn-xs rounded-2xl"
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
                  class="input input-bordered input-xs w-16 rounded-xl text-center"
                  @keyup.enter="applyPage"
                />
                <span>of {{ artJobStore.jobPageCount }}</span>
              </label>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-2xl"
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

        <div class="mt-3 grid gap-3 xl:grid-cols-2">
          <artjob-queue-card
            v-for="job in artJobStore.jobs"
            :key="job.id"
            :job="job"
            @edit="openEditor"
          />

          <div
            v-if="!artJobStore.jobs.length && !artJobStore.loadingJobs"
            class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50 xl:col-span-2"
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
            class="btn btn-ghost btn-sm rounded-2xl"
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
            class="btn btn-ghost btn-sm rounded-2xl"
            :disabled="!artJobStore.jobHasNextPage"
            @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
          >
            Next
          </button>
        </div>
      </section>
    </div>

    <artjob-editor
      v-if="editorJob"
      :job="editorJob"
      :action="editorAction"
      @close="editorJob = null"
      @saved="repairPreview = null"
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
  type WeakPromptRepairResult,
} from '@/stores/artJobStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Server } from '@/stores/serverStore'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'

const artJobStore = useArtJobStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const selectedWindow = ref(24)
const pageSizeInput = ref('20')
const pageInput = ref('1')
const editorJob = ref<ArtJobRecord | null>(null)
const editorAction = ref<EditorAction>('EDIT')
const repairPreview = ref<WeakPromptRepairResult | null>(null)
const repairMessage = ref('')
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
const summaryStatuses: ArtJobStatus[] = ['PENDING', 'RUNNING', 'FAILED', 'DONE']
const stats = computed(() => artJobStore.stats)
const uptime = computed(() => artJobStore.uptime)
const windowHours = computed(() => artJobStore.windowHours)
// Only self-hosted render servers (ComfyUI / Automatic1111). Cloud providers
// like OpenAI are omitted — this panel mirrors the private servers the uptime
// endpoint tracks, so no "OpenAI is up" indicators appear here.
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
    // Pull the freshly recorded health sample into the uptime graph.
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
  repairPreview.value = null
  await artJobStore.fetchJobs(status, 1)
}

async function applyPageSize(): Promise<void> {
  const size = Number(pageSizeInput.value)
  await artJobStore.setJobPageSize(Number.isFinite(size) ? size : 20)
}

async function applyPage(): Promise<void> {
  const page = Number(pageInput.value)
  await artJobStore.setJobPage(Number.isFinite(page) ? page : 1)
}

async function previewWeakPromptRepair(): Promise<void> {
  repairMessage.value = ''
  repairPreview.value = await artJobStore.repairWeakPrompts(true)
  if (!repairPreview.value) return
  repairMessage.value = `Scanned ${repairPreview.value.scannedCount} jobs: ${repairPreview.value.repairedCount} can be repaired automatically; ${repairPreview.value.unresolvedCount} need a human prompt.`
}

async function runWeakPromptRepair(): Promise<void> {
  const count = repairPreview.value?.repairedCount ?? 0
  if (!count) return
  const confirmed = window.confirm(
    `Repair and queue ${count} weak-prompt ArtJobs? Completed generic renders will use overwrite retries when they have a linked ArtImage.`,
  )
  if (!confirmed) return

  const result = await artJobStore.repairWeakPrompts(false)
  repairPreview.value = result
  if (!result) return
  repairMessage.value = `Repaired ${result.repairedCount} jobs. ${result.unresolvedCount} remain unresolved and were not guessed.`
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
  pageSizeInput.value = String(artJobStore.jobPageSize || 20)
  pageInput.value = String(artJobStore.jobPage || 1)
  await Promise.all([
    serverStore.initialize({ force: false, fetchRemote: true }),
    artJobStore.refreshAll(),
  ])
})
</script>
