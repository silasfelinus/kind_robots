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
            Paginated queue, editable generation briefs, render health, and recovery tools.
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
        :class="repairPreview?.unresolvedCount ? 'border-warning/40 bg-warning/10' : 'border-success/40 bg-success/10'"
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
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
            {{ status }}
          </div>
          <div class="mt-1 text-2xl font-black">{{ statusCount(status) }}</div>
        </div>
      </div>

      <div class="grid gap-3 xl:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Art servers</h3>
            <button
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="artJobStore.queuePaused ? 'btn-success' : 'btn-warning btn-outline'"
              :disabled="artJobStore.togglingQueuePause"
              @click="artJobStore.setQueuePaused(!artJobStore.queuePaused)"
            >
              {{ artJobStore.queuePaused ? 'Resume queue' : 'Pause queue' }}
            </button>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="server in serverStore.artServers"
              :key="server.id"
              class="rounded-xl border border-base-200 p-2"
            >
              <div class="truncate text-sm font-semibold">
                {{ server.label || server.title }}
              </div>
              <div class="mt-1 text-[11px] text-base-content/60">
                {{ server.serverType }} · {{ server.lastStatus }}
              </div>
            </div>
            <p v-if="!serverStore.artServers.length" class="text-xs text-base-content/50">
              No art servers registered.
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h3 class="mb-2 text-sm font-semibold">Uptime · {{ windowHours }}h</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="server in uptime"
              :key="server.serverId"
              class="flex items-center justify-between gap-3 rounded-xl bg-base-200/50 p-2 text-xs"
            >
              <span class="truncate font-semibold">{{ server.title }}</span>
              <span :class="uptimeClass(server.uptimePct)">
                {{ server.uptimePct === null ? 'no data' : `${server.uptimePct}%` }}
                <span v-if="server.avgLatencyMs !== null" class="text-base-content/50">
                  · {{ server.avgLatencyMs }}ms
                </span>
              </span>
            </div>
            <p v-if="!uptime.length" class="text-xs text-base-content/50">
              No uptime samples yet.
            </p>
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold">Queue browser</h3>
              <span class="text-[11px] text-base-content/50">
                Showing {{ pageStart }}–{{ pageEnd }} of {{ artJobStore.jobTotalCount }}
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
                :class="artJobStore.jobStatusFilter === filter ? 'btn-primary' : 'btn-ghost'"
                @click="changeStatus(filter)"
              >
                {{ filter }}
                <span class="ml-1 font-mono opacity-70">{{ statusCount(filter) }}</span>
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
                :disabled="!artJobStore.jobHasPreviousPage || artJobStore.loadingJobs"
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
                :disabled="!artJobStore.jobHasNextPage || artJobStore.loadingJobs"
                @click="artJobStore.setJobPage(artJobStore.jobPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div class="mt-3 grid gap-3 xl:grid-cols-2">
          <article
            v-for="job in artJobStore.jobs"
            :key="job.id"
            class="flex min-w-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/30 p-3"
          >
            <div class="flex min-w-0 gap-3">
              <a
                v-if="jobImageSrc(job)"
                :href="jobImageSrc(job)"
                target="_blank"
                rel="noopener"
                class="shrink-0"
                :title="`Open ArtImage ${job.artImageId}`"
              >
                <img
                  :src="jobImageSrc(job)"
                  alt="Generated ArtJob output"
                  class="h-28 w-24 rounded-2xl border border-base-300 object-cover"
                  data-missing-image-report="false"
                />
              </a>
              <div
                v-else
                class="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 text-center text-[10px] font-semibold uppercase text-base-content/40"
              >
                {{ job.status }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="font-mono text-xs font-semibold">#{{ job.id }}</span>
                  <span class="badge badge-xs rounded-2xl" :class="jobStatusClass(job.status)">
                    {{ job.status }}
                  </span>
                  <span class="badge badge-outline badge-xs rounded-2xl">{{ job.engine }}</span>
                  <span
                    v-if="job.projectSlug"
                    class="badge badge-secondary badge-xs rounded-2xl"
                  >
                    {{ job.projectSlug }}
                  </span>
                </div>
                <p class="mt-2 line-clamp-5 whitespace-pre-wrap text-sm font-medium leading-relaxed">
                  {{ jobPrompt(job) || 'Prompt unavailable.' }}
                </p>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="setting in jobSettings(job).slice(0, 6)"
                    :key="setting"
                    class="badge badge-ghost badge-sm h-auto rounded-2xl py-1 text-[10px]"
                  >
                    {{ setting }}
                  </span>
                </div>
                <p class="mt-2 text-[11px] text-base-content/50">
                  {{ formatDateTime(job.createdAt) }} · attempt {{ job.attempts }} · priority {{ job.priority }}
                </p>
              </div>
            </div>

            <div
              v-if="job.error"
              class="rounded-2xl border border-error/30 bg-error/10 p-2 text-xs text-error"
            >
              {{ job.error }}
            </div>

            <details class="rounded-2xl border border-base-300 bg-base-100">
              <summary class="cursor-pointer px-3 py-2 text-xs font-semibold">
                Full prompt and generation fields
              </summary>
              <div class="flex flex-col gap-3 border-t border-base-300 p-3 text-xs">
                <div>
                  <div class="font-semibold uppercase tracking-wide text-base-content/50">Prompt</div>
                  <p class="mt-1 whitespace-pre-wrap leading-relaxed">{{ jobPrompt(job) }}</p>
                </div>
                <div>
                  <div class="font-semibold uppercase tracking-wide text-base-content/50">
                    Negative prompt
                  </div>
                  <p class="mt-1 whitespace-pre-wrap text-base-content/70">
                    {{ jobNegativePrompt(job) || 'None' }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="setting in jobSettings(job)"
                    :key="setting"
                    class="badge badge-outline badge-sm h-auto rounded-2xl py-1 text-[10px]"
                  >
                    {{ setting }}
                  </span>
                </div>
              </div>
            </details>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-2xl"
                :disabled="!jobPrompt(job)"
                @click="copyPrompt(job)"
              >
                {{ copiedJobId === job.id ? 'Copied' : 'Copy prompt' }}
              </button>

              <div class="flex flex-wrap items-center gap-1">
                <button
                  v-if="isEditableInPlace(job)"
                  type="button"
                  class="btn btn-primary btn-xs rounded-2xl"
                  @click="openEditor(job, 'EDIT')"
                >
                  Edit & queue
                </button>
                <button
                  v-else-if="job.status === 'RUNNING'"
                  type="button"
                  class="btn btn-primary btn-xs rounded-2xl"
                  @click="openEditor(job, 'NEW_OUTPUT')"
                >
                  Edit as new job
                </button>
                <button
                  v-if="job.status === 'DONE'"
                  type="button"
                  class="btn btn-primary btn-xs rounded-2xl"
                  @click="openEditor(job, 'NEW_OUTPUT')"
                >
                  Edited output
                </button>
                <button
                  v-if="job.status === 'DONE' && job.artImageId"
                  type="button"
                  class="btn btn-warning btn-xs rounded-2xl"
                  @click="openEditor(job, 'OVERWRITE')"
                >
                  Edit & replace
                </button>
                <button
                  v-if="job.status === 'FAILED'"
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl"
                  @click="artJobStore.requeueJob(job.id)"
                >
                  Resume unchanged
                </button>
                <button
                  v-if="job.status === 'DONE' && job.artImageId"
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl"
                  :disabled="curationRequested(job)"
                  @click="requestCuration(job)"
                >
                  {{ curationRequested(job) ? 'Curation requested' : 'Curate' }}
                </button>
                <button
                  v-if="job.status === 'PENDING' || job.status === 'RUNNING'"
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl text-error"
                  @click="artJobStore.cancelJob(job.id)"
                >
                  Cancel
                </button>
              </div>
            </div>
          </article>

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
          <span class="text-xs">Page {{ artJobStore.jobPage }} of {{ artJobStore.jobPageCount }}</span>
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
  type WeakPromptRepairResult,
} from '@/stores/artJobStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type JsonRecord = Record<string, unknown>
type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'

const artJobStore = useArtJobStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const selectedWindow = ref(24)
const pageSizeInput = ref('20')
const pageInput = ref('1')
const copiedJobId = ref<number | null>(null)
const editorJob = ref<ArtJobRecord | null>(null)
const editorAction = ref<EditorAction>('EDIT')
const repairPreview = ref<WeakPromptRepairResult | null>(null)
const repairMessage = ref('')

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

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function scalar(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function nestedScalar(value: unknown, keys: string[], depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    for (const child of value) {
      const result = nestedScalar(child, keys, depth + 1)
      if (result) return result
    }
    return ''
  }

  const record = asRecord(value)
  for (const key of keys) {
    const direct = scalar(record[key])
    if (direct) return direct
  }
  for (const child of Object.values(record)) {
    const result = nestedScalar(child, keys, depth + 1)
    if (result) return result
  }
  return ''
}

function payloadScalar(job: ArtJobRecord, keys: string[]): string {
  const payload = asRecord(job.payload)
  for (const key of keys) {
    const direct = scalar(payload[key])
    if (direct) return direct
  }
  return nestedScalar(payload.workflow, keys)
}

function workflowPrompt(job: ArtJobRecord, kind: 'positive' | 'negative'): string {
  const workflow = asRecord(asRecord(job.payload).workflow)
  for (const value of Object.values(workflow)) {
    const node = asRecord(value)
    const classType = scalar(node.class_type).toLowerCase()
    const inputs = asRecord(node.inputs)
    const title = scalar(asRecord(node._meta).title).toLowerCase()
    const isNegative = title.includes('negative')
    if (kind === 'negative' && !isNegative) continue
    if (kind === 'positive' && isNegative) continue
    if (!classType.includes('clip') && !classType.includes('wildcard')) continue
    const text =
      scalar(inputs.text) ||
      scalar(inputs.wildcard_text) ||
      scalar(inputs.populated_text) ||
      scalar(inputs.t5xxl) ||
      scalar(inputs.clip_l)
    if (text) return text
  }
  return ''
}

function jobPrompt(job: ArtJobRecord): string {
  return (
    payloadScalar(job, ['promptString', 'artPrompt', 'positivePrompt', 'prompt']) ||
    workflowPrompt(job, 'positive')
  )
}

function jobNegativePrompt(job: ArtJobRecord): string {
  return (
    payloadScalar(job, ['negativePrompt', 'negative_prompt', 'negative']) ||
    workflowPrompt(job, 'negative')
  )
}

function jobSettings(job: ArtJobRecord): string[] {
  const values = [
    ['size', `${payloadScalar(job, ['width'])}×${payloadScalar(job, ['height'])}`],
    ['model', payloadScalar(job, ['checkpoint', 'ckpt_name', 'unet_name', 'model_name'])],
    ['sampler', payloadScalar(job, ['sampler', 'sampler_name'])],
    ['scheduler', payloadScalar(job, ['scheduler'])],
    ['steps', payloadScalar(job, ['steps'])],
    ['cfg', payloadScalar(job, ['cfg', 'cfg_scale'])],
    ['guidance', payloadScalar(job, ['guidance'])],
    ['denoise', payloadScalar(job, ['denoise'])],
    ['seed', payloadScalar(job, ['seed', 'noise_seed'])],
  ]

  return values
    .filter(([, value]) => value && value !== '×')
    .map(([label, value]) => `${label}: ${value}`)
}

function jobImageSrc(job: ArtJobRecord): string {
  if (typeof job.artImageId !== 'number') return ''
  return artJobStore.imageSrcById[job.artImageId] || ''
}

function statusCount(status: ArtJobStatus | 'ALL'): number {
  const depth = stats.value?.queueDepth ?? {}
  if (status === 'ALL') {
    return Object.values(depth).reduce((total, count) => total + count, 0)
  }
  return depth[status] ?? 0
}

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-ghost'
  return 'badge-warning'
}

function uptimeClass(value: number | null): string {
  if (value === null) return 'text-base-content/50'
  if (value >= 99) return 'text-success'
  if (value >= 90) return 'text-warning'
  return 'text-error'
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

function isEditableInPlace(job: ArtJobRecord): boolean {
  return ['PENDING', 'FAILED', 'CANCELLED'].includes(job.status)
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

async function requestCuration(job: ArtJobRecord): Promise<void> {
  await artJobStore.requestCuration(job.id)
}

function curationRequested(job: ArtJobRecord): boolean {
  return artJobStore.curationRequestedIds.includes(job.id) ||
    Boolean(asRecord(asRecord(job.payload).curation).curator)
}

async function copyPrompt(job: ArtJobRecord): Promise<void> {
  const prompt = jobPrompt(job)
  if (!prompt || !navigator.clipboard) return
  await navigator.clipboard.writeText(prompt)
  copiedJobId.value = job.id
  window.setTimeout(() => {
    if (copiedJobId.value === job.id) copiedJobId.value = null
  }, 1500)
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
