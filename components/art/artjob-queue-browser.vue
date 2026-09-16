<!-- /components/art/artjob-queue-browser.vue -->
<template>
  <section class="kr-surface gap-0">
    <div
      v-if="!userStore.isAdmin"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center text-warning"
    >
      The ArtJob dashboard is admin-only.
    </div>

    <!--
      No h-full here. kr-scroll is already `min-h-0 flex-1 overflow-y-auto`,
      and h-full pins the child to the parent's full height on top of that,
      over-constraining the flex child that is supposed to be sized BY the
      flex line. Every other page using this primitive (lora-triage, etc.)
      omits it.
    -->
    <div v-else class="flex kr-scroll flex-col gap-2 p-2">
      <div
        class="flex flex-wrap items-center gap-1 border-b border-base-200 pb-1.5"
      >
        <button
          v-for="filter in statusFilters"
          :key="filter"
          type="button"
          class="btn btn-ghost btn-sm h-9 min-h-9 gap-1.5 rounded-full border border-base-300 px-3.5 text-xs font-semibold"
          :class="
            artJobStore.jobStatusFilter === filter
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-base-content/55'
          "
          :aria-pressed="artJobStore.jobStatusFilter === filter"
          :title="`Show ${filter} jobs`"
          @click="changeStatus(filter)"
        >
          <span>{{ filter }}</span>
          <span class="font-black text-base-content">{{
            statusCount(filter)
          }}</span>
          <span
            v-if="
              artJobStore.jobStatusFilter === filter && artJobStore.loadingJobs
            "
            class="kr-spinner-xs"
          />
        </button>

        <span
          v-if="stats?.oldestPending"
          class="inline-flex h-6 items-center rounded-full px-1.5 text-[10px] text-warning"
          :title="`Oldest pending job #${stats.oldestPending.id}`"
        >
          #{{ stats.oldestPending.id }} ·
          {{ formatAge(stats.oldestPending.ageSeconds) }}
        </span>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-1">
          <details class="dropdown dropdown-end">
            <summary
              class="btn btn-ghost btn-xs h-6 min-h-6 list-none gap-1 rounded-full border border-base-300 px-2 text-[10px] [&::-webkit-details-marker]:hidden"
              title="Art server health and queue controls"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="serverStatusDotClass(primaryArtServer?.lastStatus)"
              />
              <span>{{
                primaryArtServer?.label || primaryArtServer?.title || 'Health'
              }}</span>
              <span
                v-if="
                  primaryUptime?.uptimePct !== null &&
                  primaryUptime?.uptimePct !== undefined
                "
                :class="uptimeClass(primaryUptime.uptimePct)"
              >
                {{ primaryUptime.uptimePct }}%
              </span>
              <span
                v-if="
                  primaryUptime?.avgLatencyMs !== null &&
                  primaryUptime?.avgLatencyMs !== undefined
                "
                class="text-base-content/45"
              >
                {{ primaryUptime.avgLatencyMs }}ms
              </span>
              <span
                v-if="artJobStore.queuePaused"
                class="font-bold text-warning"
              >
                paused
              </span>
            </summary>

            <div
              class="dropdown-content z-50 mt-1 w-[min(38rem,calc(100vw-2rem))] rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold">Health</span>
                  <select
                    v-model.number="selectedWindow"
                    class="select select-bordered select-xs h-7 min-h-7 rounded-xl"
                    aria-label="Uptime window"
                    @change="onWindowChange"
                  >
                    <option :value="6">6h</option>
                    <option :value="24">24h</option>
                    <option :value="72">3d</option>
                    <option :value="168">7d</option>
                  </select>
                </div>

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
                v-if="privateArtServers.length"
                class="mt-2 flex flex-col gap-1.5"
              >
                <div
                  v-for="server in privateArtServers"
                  :key="server.id"
                  class="flex items-center justify-between gap-2 rounded-xl border border-base-200 px-2 py-1.5"
                >
                  <div class="flex min-w-0 items-center gap-2 text-xs">
                    <span
                      class="h-2 w-2 shrink-0 rounded-full"
                      :class="serverStatusDotClass(server.lastStatus)"
                      :title="server.lastStatus"
                    />
                    <span class="truncate font-semibold">
                      {{ server.label || server.title }}
                    </span>
                    <span class="text-[10px] text-base-content/45">
                      {{ server.serverType }} · {{ server.lastStatus }}
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
              </div>

              <div
                v-if="sampledUptime.length"
                class="mt-2 flex flex-col gap-1.5 border-t border-base-200 pt-2"
              >
                <div
                  v-for="server in sampledUptime"
                  :key="server.serverId"
                  class="rounded-xl bg-base-200/40 p-2"
                >
                  <div
                    class="flex items-center justify-between gap-3 text-[11px]"
                  >
                    <span class="truncate font-semibold">{{
                      server.title
                    }}</span>
                    <span :class="uptimeClass(server.uptimePct)">
                      {{ server.uptimePct }}%
                      <span
                        v-if="server.avgLatencyMs !== null"
                        class="text-base-content/45"
                      >
                        · {{ server.avgLatencyMs }}ms
                      </span>
                    </span>
                  </div>
                  <div
                    class="mt-1.5 flex h-4 items-stretch gap-px overflow-hidden rounded"
                  >
                    <span
                      v-for="(sample, index) in server.samples"
                      :key="index"
                      class="min-w-0 flex-1 rounded-sm"
                      :class="sample.ok ? 'bg-success' : 'bg-error'"
                      :title="sampleTooltip(sample)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </details>

          <button
            type="button"
            class="btn btn-secondary btn-xs h-6 min-h-6 rounded-full px-2 text-[10px]"
            title="Watch finished renders full screen, newest first"
            @click="slideshowOpen = true"
          >
            Slideshow
          </button>
          <button
            type="button"
            class="btn btn-primary btn-xs h-6 min-h-6 rounded-full px-2 text-[10px]"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="kr-spinner-xs" />
            Refresh
          </button>

          <select
            v-model="pageSizeInput"
            class="select select-bordered select-xs h-6 min-h-6 rounded-xl px-2 text-[10px]"
            aria-label="Jobs per page"
            :disabled="artJobStore.loadingJobs"
            @change="applyPageSize"
          >
            <option value="20">20/page</option>
            <option value="50">50/page</option>
            <option value="100">100/page</option>
          </select>

          <button
            type="button"
            class="btn btn-ghost btn-xs h-6 min-h-6 rounded-xl px-1.5"
            :disabled="
              !artJobStore.jobHasPreviousPage || artJobStore.loadingJobs
            "
            aria-label="Previous queue page"
            @click="artJobStore.setJobPage(artJobStore.jobPage - 1)"
          >
            ‹
          </button>
          <label class="flex h-6 items-center gap-1 text-[10px]">
            <span class="sr-only">Queue page</span>
            <input
              v-model="pageInput"
              type="number"
              min="1"
              :max="artJobStore.jobPageCount"
              class="kr-input-rounded-xl input-xs h-6 w-11 text-center text-[10px]"
              @keyup.enter="applyPage"
            />
            <span class="text-base-content/40"
              >/{{ artJobStore.jobPageCount }}</span
            >
          </label>
          <button
            type="button"
            class="btn btn-ghost btn-xs h-6 min-h-6 rounded-xl px-1.5"
            :disabled="!artJobStore.jobHasNextPage || artJobStore.loadingJobs"
            aria-label="Next queue page"
            @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
          >
            ›
          </button>
        </div>
      </div>

      <div
        v-if="artJobStore.error"
        class="kr-note kr-note-error p-2 text-xs font-normal"
      >
        {{ artJobStore.error }}
      </div>

      <div
        v-if="artJobStore.loadingJobs && !artJobStore.jobs.length"
        class="flex min-h-40 flex-col items-center justify-center gap-3 kr-panel-dashed-plain text-center"
      >
        <span class="kr-loading-primary-md" />
        <p class="kr-text-dim-sm-70">{{ queueLoadMessage }}</p>
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3"
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
        class="flex items-center justify-center gap-2 border-t border-base-200 pt-2"
      >
        <button
          type="button"
          class="kr-btn-ghost-2xl"
          :disabled="!artJobStore.jobHasPreviousPage"
          @click="artJobStore.setJobPage(artJobStore.jobPage - 1)"
        >
          Previous
        </button>
        <span class="text-xs">
          Page {{ artJobStore.jobPage }} of {{ artJobStore.jobPageCount }}
        </span>
        <button
          type="button"
          class="kr-btn-ghost-2xl"
          :disabled="!artJobStore.jobHasNextPage"
          @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <artjob-slideshow v-if="slideshowOpen" @close="slideshowOpen = false" />

    <artjob-editor
      v-if="editorJob"
      :job="editorJob"
      :action="editorAction"
      @close="editorJob = null"
    />
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
const privateArtServers = computed<Server[]>(() =>
  serverStore.artServers.filter(
    (server: Server) =>
      server.serverType === 'COMFY' || server.serverType === 'A1111',
  ),
)
const primaryArtServer = computed(() => privateArtServers.value[0] ?? null)
const sampledUptime = computed(() =>
  uptime.value.filter(
    (server) =>
      server.samples.length > 0 ||
      server.uptimePct !== null ||
      server.avgLatencyMs !== null,
  ),
)
const primaryUptime = computed(() => {
  const serverId = primaryArtServer.value?.id
  if (serverId) {
    const match = sampledUptime.value.find(
      (server) => server.serverId === serverId,
    )
    if (match) return match
  }
  return sampledUptime.value[0] ?? null
})
const isLoading = computed(
  () =>
    artJobStore.loadingStats ||
    artJobStore.loadingUptime ||
    artJobStore.loadingJobs,
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
