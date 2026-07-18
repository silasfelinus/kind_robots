<!-- /components/art/artjob-manager.vue -->
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
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">ArtJob Pipeline</h2>
          <p class="text-xs text-base-content/60">
            Queue, creative briefs, servers, uptime & errors over the last
            {{ windowHours }}h.
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
        class="kr-note kr-note-error p-2 text-xs font-normal"
      >
        {{ artJobStore.error }}
      </div>

      <div
        v-if="bulkRetryMessage"
        class="kr-note p-2 text-xs font-normal"
        :class="bulkRetryHasFailures ? 'kr-note-warning' : 'kr-note-success'"
      >
        {{ bulkRetryMessage }}
      </div>

      <div
        v-if="stats?.oldestPending"
        class="kr-note kr-note-warning p-2 text-xs font-normal"
      >
        Oldest PENDING job #{{ stats.oldestPending.id }} has been waiting
        {{ formatAge(stats.oldestPending.ageSeconds) }} — if this keeps
        climbing, the relay isn't draining the queue (check the relay process &
        KR_BASE_URL).
      </div>

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
                  <span :class="statusClass(server.lastStatus)">
                    {{ server.lastStatus }}
                  </span>
                  <span v-if="server.lastCheckedAt">
                    · {{ formatTime(server.lastCheckedAt) }}
                  </span>
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
                  >
                    · {{ srv.avgLatencyMs }}ms
                  </span>
                </span>
              </div>
              <div class="flex h-4 items-end gap-px overflow-hidden">
                <span
                  v-for="(sample, index) in srv.samples"
                  :key="index"
                  class="h-full flex-1"
                  :class="sample.ok ? 'bg-success' : 'bg-error'"
                  :title="`${sample.status} @ ${formatTime(sample.checkedAt)}`"
                />
                <span
                  v-if="!srv.samples.length"
                  class="text-[11px] text-base-content/40"
                >
                  no samples yet — relay heartbeat not reporting
                </span>
              </div>
            </div>
            <p v-if="!uptime.length" class="text-xs text-base-content/50">
              No ComfyUI/SD servers to track.
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold">Queue</h3>
            <span
              v-if="(stats?.staleRunningCount ?? 0) > 0"
              class="badge badge-xs badge-error rounded-2xl"
              title="RUNNING jobs on a stale claim (relay likely died mid-render)"
            >
              {{ stats?.staleRunningCount }} stale
            </span>
            <span class="text-[11px] text-base-content/50">
              {{ stats?.imagesCreatedInWindow ?? 0 }} imgs / {{ windowHours }}h
            </span>
            <button
              v-if="failedJobCount > 0"
              type="button"
              class="btn btn-error btn-xs rounded-2xl"
              :disabled="artJobStore.reenqueueingFailedJobs"
              :title="`Clone all ${failedJobCount} failed jobs into fresh pending attempts`"
              @click="reenqueueAllFailed"
            >
              <span
                v-if="artJobStore.reenqueueingFailedJobs"
                class="loading loading-spinner loading-xs"
              />
              Re-enqueue all failed ({{ failedJobCount }})
            </button>
            <button
              v-if="uncuratedJobs.length"
              type="button"
              class="btn btn-secondary btn-xs rounded-2xl"
              :disabled="bulkCurating"
              :title="`Ask Conductor to curate ${uncuratedJobs.length} finished job(s) shown here`"
              @click="requestBulkCuration"
            >
              <span
                v-if="bulkCurating"
                class="loading loading-spinner loading-xs"
              />
              Curate finished ({{ uncuratedJobs.length }})
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
              @click="artJobStore.fetchJobs(filter)"
            >
              {{ filter }}
              <span class="ml-1 font-mono opacity-70">
                {{ statusCount(filter) }}
              </span>
            </button>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <article
            v-for="job in artJobStore.jobs"
            :key="job.id"
            class="flex min-w-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/30 p-3"
          >
            <div class="flex min-w-0 gap-3">
              <a
                v-if="jobImageShowable(job)"
                :href="jobImageSrc(job)"
                target="_blank"
                rel="noopener"
                :title="`Open ArtImage ${job.artImageId}`"
                class="shrink-0"
              >
                <video
                  v-if="jobImageKind(job) === 'video'"
                  :src="jobImageSrc(job)"
                  class="h-24 w-20 rounded-2xl border border-base-300 object-cover sm:h-28 sm:w-24"
                  muted
                  playsinline
                  preload="metadata"
                  @error="markImageFailed(job)"
                />
                <img
                  v-else
                  :src="jobImageSrc(job)"
                  class="h-24 w-20 rounded-2xl border border-base-300 object-cover sm:h-28 sm:w-24"
                  alt="generated art"
                  @error="markImageFailed(job)"
                />
              </a>
              <div
                v-else
                :title="jobImageDiag(job)"
                class="flex h-24 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-dashed border-base-300 bg-base-100 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-base-content/40 sm:h-28 sm:w-24"
              >
                <span>{{ jobPlaceholder(job) }}</span>
                <span
                  v-if="jobImageReason(job)"
                  class="text-[8px] font-normal normal-case leading-tight text-base-content/50"
                  >{{ jobImageReason(job) }}</span
                >
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-mono text-xs font-semibold"
                    >#{{ job.id }}</span
                  >
                  <span
                    class="badge badge-xs rounded-2xl"
                    :class="jobStatusClass(job.status)"
                  >
                    {{ job.status }}
                  </span>
                  <span class="badge badge-outline badge-xs rounded-2xl">
                    {{ job.engine }}
                  </span>
                  <span
                    v-if="job.projectSlug"
                    class="badge badge-secondary badge-xs rounded-2xl"
                  >
                    {{ job.projectSlug }}
                  </span>
                  <span
                    v-if="jobRetryMode(job)"
                    class="badge badge-xs rounded-2xl"
                    :class="
                      jobRetryMode(job) === 'OVERWRITE'
                        ? 'badge-warning'
                        : 'badge-info'
                    "
                  >
                    {{
                      jobRetryMode(job) === 'OVERWRITE'
                        ? 'replace asset'
                        : 'new attempt'
                    }}
                  </span>
                  <span
                    v-if="curatorVerdict(job)"
                    class="badge badge-xs rounded-2xl"
                    :class="curatorBadgeClass(job)"
                    :title="`Conductor curated this job${
                      curatorScore(job) !== null
                        ? ` — ${curatorScore(job)}/100`
                        : ''
                    }`"
                  >
                    curator: {{ curatorVerdict(job)?.toLowerCase() }}
                    <span
                      v-if="curatorScore(job) !== null"
                      class="ml-1 font-mono opacity-80"
                    >
                      {{ curatorScore(job) }}
                    </span>
                  </span>
                </div>

                <p
                  class="mt-2 whitespace-pre-wrap wrap-break-word text-sm font-medium leading-relaxed"
                >
                  {{
                    jobPrompt(job) || 'Prompt unavailable for this legacy job.'
                  }}
                </p>

                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="chip in jobSummaryChips(job)"
                    :key="chip"
                    class="badge badge-ghost badge-sm rounded-2xl text-[10px]"
                  >
                    {{ chip }}
                  </span>
                </div>

                <p class="mt-2 text-[11px] text-base-content/60">
                  {{ jobDestination(job) }} · queued
                  {{ formatAgeFrom(job.createdAt) }} ago
                </p>
              </div>

              <button
                type="button"
                class="btn btn-ghost btn-xs shrink-0 rounded-2xl"
                :disabled="!jobPrompt(job)"
                @click="copyPrompt(job)"
              >
                {{ copiedJobId === job.id ? 'Copied' : 'Copy' }}
              </button>
            </div>

            <div
              v-if="job.error"
              class="kr-note kr-note-error p-2 text-xs font-normal"
            >
              {{ job.error }}
            </div>

            <div
              v-if="jobRetryMode(job)"
              class="rounded-2xl border border-info/30 bg-info/10 p-2 text-xs"
            >
              <span v-if="jobRetryMode(job) === 'OVERWRITE'">
                This attempt will replace ArtImage #{{ jobRetryTarget(job) }}
                while preserving that canonical id. The prior render will be
                archived for job/trainer history.
              </span>
              <span v-else>
                This is a fresh output derived from job #{{
                  jobRetrySource(job)
                }}. It will create a separate ArtImage.
              </span>
            </div>

            <details class="rounded-2xl border border-base-300 bg-base-100">
              <summary
                class="cursor-pointer select-none px-3 py-2 text-xs font-semibold"
              >
                Full creative brief & routing
              </summary>
              <div class="flex flex-col gap-3 border-t border-base-300 p-3">
                <div>
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50"
                  >
                    Prompt
                  </div>
                  <p
                    class="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed"
                  >
                    {{ jobPrompt(job) || 'Prompt unavailable.' }}
                  </p>
                </div>

                <div v-if="jobNegativePrompt(job)">
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50"
                  >
                    Negative prompt
                  </div>
                  <p
                    class="mt-1 whitespace-pre-wrap wrap-break-word text-xs text-base-content/70"
                  >
                    {{ jobNegativePrompt(job) }}
                  </p>
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <div class="rounded-xl bg-base-200/60 p-2">
                    <div
                      class="text-[10px] uppercase tracking-wide text-base-content/50"
                    >
                      Destination
                    </div>
                    <div class="mt-1 text-xs font-medium">
                      {{ jobDestination(job) }}
                    </div>
                  </div>
                  <div class="rounded-xl bg-base-200/60 p-2">
                    <div
                      class="text-[10px] uppercase tracking-wide text-base-content/50"
                    >
                      Output
                    </div>
                    <div class="mt-1 text-xs font-medium">
                      {{ jobOutput(job) }}
                    </div>
                  </div>
                  <div class="rounded-xl bg-base-200/60 p-2">
                    <div
                      class="text-[10px] uppercase tracking-wide text-base-content/50"
                    >
                      Created
                    </div>
                    <div class="mt-1 text-xs font-medium">
                      {{ formatDateTime(job.createdAt) }}
                    </div>
                  </div>
                  <div class="rounded-xl bg-base-200/60 p-2">
                    <div
                      class="text-[10px] uppercase tracking-wide text-base-content/50"
                    >
                      Relay
                    </div>
                    <div class="mt-1 text-xs font-medium">
                      {{ job.claimedBy || 'Waiting for a relay' }}
                      <span v-if="job.claimedAt">
                        · {{ formatDateTime(job.claimedAt) }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="jobRetryMode(job)"
                    class="rounded-xl bg-base-200/60 p-2 sm:col-span-2"
                  >
                    <div
                      class="text-[10px] uppercase tracking-wide text-base-content/50"
                    >
                      Retry lineage
                    </div>
                    <div class="mt-1 text-xs font-medium">
                      {{ retryLineage(job) }}
                    </div>
                  </div>
                </div>

                <div v-if="jobSettings(job).length">
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50"
                  >
                    Generation settings
                  </div>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <span
                      v-for="setting in jobSettings(job)"
                      :key="`${setting.label}:${setting.value}`"
                      class="badge badge-outline badge-sm h-auto min-h-6 rounded-2xl py-1 text-[10px]"
                    >
                      {{ setting.label }}: {{ setting.value }}
                    </span>
                  </div>
                </div>

                <div v-if="jobSourceImages(job).length">
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50"
                  >
                    Source / guide images
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <a
                      v-for="source in jobSourceImages(job)"
                      :key="source.name"
                      :href="source.src"
                      target="_blank"
                      rel="noopener"
                      class="group"
                    >
                      <img
                        :src="source.src"
                        :alt="source.name"
                        class="h-24 w-20 rounded-xl border border-base-300 object-cover transition-transform group-hover:scale-105"
                      />
                      <div
                        class="mt-1 max-w-20 truncate text-[10px] text-base-content/50"
                      >
                        {{ source.name }}
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </details>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-[11px] text-base-content/50">
                Attempt {{ job.attempts }} · priority {{ job.priority }}
              </div>
              <div class="flex flex-wrap items-center gap-1">
                <details class="dropdown dropdown-end">
                  <summary
                    class="btn btn-ghost btn-xs rounded-2xl"
                    :class="{ 'btn-disabled': isRetrying(job.id) }"
                  >
                    <span
                      v-if="isRetrying(job.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Try again
                  </summary>
                  <ul
                    class="menu dropdown-content z-30 mt-1 w-72 rounded-2xl border border-base-300 bg-base-100 p-2 text-xs shadow-xl"
                  >
                    <li>
                      <button
                        type="button"
                        :disabled="isRetrying(job.id)"
                        @click="retryJob(job, 'NEW_OUTPUT')"
                      >
                        <span>
                          <strong>Make a new output</strong>
                          <span class="block text-[11px] opacity-60">
                            Fresh seed, separate ArtImage, original stays
                            intact.
                          </span>
                        </span>
                      </button>
                    </li>
                    <li v-if="job.status === 'DONE' && job.artImageId">
                      <button
                        type="button"
                        class="text-warning"
                        :disabled="isRetrying(job.id)"
                        @click="askToOverwrite(job)"
                      >
                        <span>
                          <strong
                            >Replace ArtImage #{{ job.artImageId }}</strong
                          >
                          <span class="block text-[11px] opacity-70">
                            Keep the id and links; archive the current render.
                          </span>
                        </span>
                      </button>
                    </li>
                  </ul>
                </details>
                <button
                  v-if="canCurate(job)"
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl"
                  :class="curationRequested(job) ? 'text-success' : ''"
                  :disabled="
                    isRequestingCuration(job.id) || curationRequested(job)
                  "
                  :title="
                    curationRequested(job)
                      ? 'Conductor has this job queued for curation'
                      : 'Ask Conductor to score this finished render and add a curator verdict'
                  "
                  @click="requestCuration(job)"
                >
                  <span
                    v-if="isRequestingCuration(job.id)"
                    class="loading loading-spinner loading-xs"
                  />
                  {{
                    curationRequested(job)
                      ? 'Curation requested'
                      : 'Request curation'
                  }}
                </button>
                <button
                  v-if="job.status !== 'DONE'"
                  type="button"
                  class="btn btn-ghost btn-xs rounded-2xl"
                  title="Reset this same job to PENDING after a failure or stale claim"
                  @click="artJobStore.requeueJob(job.id)"
                >
                  Resume job
                </button>
                <button
                  v-if="job.status !== 'DONE' && job.status !== 'CANCELLED'"
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
            v-if="!artJobStore.jobs.length"
            class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-xs text-base-content/50 xl:col-span-2"
          >
            No {{ artJobStore.jobStatusFilter }} jobs.
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="overwriteJob"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overwrite-art-title"
      @click.self="overwriteJob = null"
    >
      <div
        class="w-full max-w-lg rounded-3xl border border-warning/40 bg-base-100 p-5 shadow-2xl"
      >
        <h3 id="overwrite-art-title" class="text-lg font-semibold">
          Replace ArtImage #{{ overwriteJob.artImageId }}?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-base-content/70">
          The server will generate a fresh attempt and keep this ArtImage id, so
          every Dream, Bot, Reward, collection, or other record linked to it
          sees the replacement. The current pixels are archived under a new
          ArtImage id and historical ArtJobs keep pointing to that archived
          render.
        </p>
        <div class="mt-3 rounded-2xl bg-base-200 p-3 text-xs">
          <div class="font-semibold">Prompt</div>
          <p class="mt-1 line-clamp-4 whitespace-pre-wrap">
            {{ jobPrompt(overwriteJob) || 'Prompt unavailable.' }}
          </p>
        </div>
        <p class="mt-3 text-xs text-base-content/60">
          Concrete seeds are refreshed automatically so this is a real new
          attempt, not a byte-for-byte rerun.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            @click="overwriteJob = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-warning btn-sm rounded-2xl"
            :disabled="isRetrying(overwriteJob.id)"
            @click="confirmOverwrite"
          >
            <span
              v-if="isRetrying(overwriteJob.id)"
              class="loading loading-spinner loading-xs"
            />
            Generate and replace
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ArtJob } from '~/prisma/generated/prisma/client'
import {
  useArtJobStore,
  type ArtJobRetryMode,
  type ArtJobStatus,
} from '@/stores/artJobStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type JsonRecord = Record<string, unknown>
type JobSetting = { label: string; value: string }
type SourceImage = { name: string; src: string }

const artJobStore = useArtJobStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const selectedWindow = ref(24)
const checkingServerId = ref<number | null>(null)
const copiedJobId = ref<number | null>(null)
const overwriteJob = ref<ArtJob | null>(null)
const bulkRetryMessage = ref('')
const bulkRetryHasFailures = ref(false)

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
const failedJobCount = computed(() => stats.value?.queueDepth.FAILED ?? 0)
const isLoading = computed(
  () =>
    artJobStore.loadingStats ||
    artJobStore.loadingUptime ||
    artJobStore.loadingJobs,
)

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonRecord
}

function scalarToString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return ''
}

function payloadRecord(job: ArtJob): JsonRecord {
  return asRecord(job.payload) ?? {}
}

function retryRecord(job: ArtJob): JsonRecord {
  return asRecord(payloadRecord(job).retry) ?? {}
}

function directScalar(record: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = scalarToString(record[key])
    if (value) return value
  }
  return ''
}

function nestedScalar(value: unknown, keys: string[], depth = 0): string {
  if (depth > 5 || value === null || value === undefined) return ''

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = nestedScalar(item, keys, depth + 1)
      if (found) return found
    }
    return ''
  }

  const record = asRecord(value)
  if (!record) return ''

  const direct = directScalar(record, keys)
  if (direct) return direct

  for (const [key, child] of Object.entries(record)) {
    if (
      key === 'imageData' ||
      key === 'sourceImageBase64' ||
      key === 'firstImageBase64' ||
      key === 'secondImageBase64'
    ) {
      continue
    }

    const found = nestedScalar(child, keys, depth + 1)
    if (found) return found
  }

  return ''
}

function payloadScalar(job: ArtJob, keys: string[]): string {
  const payload = payloadRecord(job)
  return directScalar(payload, keys) || nestedScalar(payload.workflow, keys)
}

function workflowPrompt(job: ArtJob, kind: 'positive' | 'negative'): string {
  const workflow = asRecord(payloadRecord(job).workflow)
  if (!workflow) return ''

  for (const value of Object.values(workflow)) {
    const node = asRecord(value)
    if (!node) continue

    const classType = directScalar(node, ['class_type']).toLowerCase()
    if (!classType.includes('cliptextencode')) continue

    const inputs = asRecord(node.inputs)
    if (!inputs) continue

    const meta = asRecord(node._meta) ?? {}
    const title = directScalar(meta, ['title']).toLowerCase()
    const isNegative = `${title} ${classType}`.includes('negative')

    if (kind === 'negative' && !isNegative) continue
    if (kind === 'positive' && isNegative) continue

    const text = directScalar(inputs, ['text', 'clip_l', 't5xxl'])
    if (text) return text
  }

  return ''
}

function jobPrompt(job: ArtJob): string {
  const payload = payloadRecord(job)
  return (
    directScalar(payload, [
      'promptString',
      'artPrompt',
      'positivePrompt',
      'prompt',
    ]) || workflowPrompt(job, 'positive')
  )
}

function jobNegativePrompt(job: ArtJob): string {
  const payload = payloadRecord(job)
  return (
    directScalar(payload, ['negativePrompt', 'negative_prompt', 'negative']) ||
    workflowPrompt(job, 'negative')
  )
}

function jobDimensions(job: ArtJob): string {
  const width = payloadScalar(job, ['width'])
  const height = payloadScalar(job, ['height'])
  return width && height ? `${width}×${height}` : ''
}

function jobModel(job: ArtJob): string {
  return payloadScalar(job, ['checkpoint', 'ckpt_name', 'model_name', 'model'])
}

function jobSaveRecord(job: ArtJob): JsonRecord {
  return asRecord(payloadRecord(job).save) ?? {}
}

function jobDestination(job: ArtJob): string {
  const save = jobSaveRecord(job)
  const designer = directScalar(save, ['designer'])
  const hasSaveSettings = Object.keys(save).length > 0
  const visibility = save.isPublic === false ? 'private' : 'public'
  const maturity = save.isMature === true ? 'mature' : 'general'
  const saveLabel = hasSaveSettings
    ? `${visibility}/${maturity}`
    : 'save defaults'
  const target = job.projectSlug
    ? `project ${job.projectSlug}`
    : 'default art gallery'
  const result = job.artImageId ? ` · ArtImage #${job.artImageId}` : ''
  const credit = designer ? ` · ${designer}` : ''
  return `${target}${result} · ${saveLabel}${credit}`
}

function jobOutput(job: ArtJob): string {
  const dimensions = jobDimensions(job) || 'engine default size'
  if (job.artImageId) return `${dimensions} · ArtImage #${job.artImageId}`
  if (job.status === 'DONE') return `${dimensions} · output record missing`
  return `${dimensions} · awaiting generated output`
}

function jobRetryMode(job: ArtJob): ArtJobRetryMode | null {
  const mode = directScalar(retryRecord(job), ['mode']).toUpperCase()
  return mode === 'NEW_OUTPUT' || mode === 'OVERWRITE' ? mode : null
}

function jobRetrySource(job: ArtJob): number | null {
  const value = Number(retryRecord(job).sourceJobId)
  return Number.isInteger(value) && value > 0 ? value : null
}

function jobRetryTarget(job: ArtJob): number | null {
  const value = Number(retryRecord(job).targetArtImageId)
  return Number.isInteger(value) && value > 0 ? value : null
}

function retryLineage(job: ArtJob): string {
  const retry = retryRecord(job)
  const mode = jobRetryMode(job)
  const source = jobRetrySource(job)
  const root = Number(retry.rootJobId)
  const target = jobRetryTarget(job)
  const archived = Number(retry.archivedArtImageId)
  const parts = [
    mode === 'OVERWRITE' ? 'replace canonical asset' : 'create new output',
    source ? `source job #${source}` : '',
    Number.isInteger(root) && root > 0 ? `root job #${root}` : '',
    target ? `target ArtImage #${target}` : '',
    Number.isInteger(archived) && archived > 0
      ? `prior render archived as ArtImage #${archived}`
      : '',
    retry.refreshSeed === true ? 'fresh seeds' : '',
  ]
  return parts.filter(Boolean).join(' · ')
}

function jobSummaryChips(job: ArtJob): string[] {
  const dimensions = jobDimensions(job)
  const model = jobModel(job)
  const sampler = payloadScalar(job, ['sampler', 'sampler_name'])
  const steps = payloadScalar(job, ['steps'])
  const seed = payloadScalar(job, ['seed', 'noise_seed'])

  const chips = [
    dimensions,
    model,
    sampler,
    steps ? `${steps} steps` : '',
    seed ? `seed ${seed}` : '',
  ]

  return chips.filter((chip): chip is string => Boolean(chip)).slice(0, 6)
}

function jobSettings(job: ArtJob): JobSetting[] {
  const settings: Array<[string, string]> = [
    ['Size', jobDimensions(job)],
    ['Model', jobModel(job)],
    ['Sampler', payloadScalar(job, ['sampler', 'sampler_name'])],
    ['Scheduler', payloadScalar(job, ['scheduler'])],
    ['Steps', payloadScalar(job, ['steps'])],
    ['CFG', payloadScalar(job, ['cfg', 'cfg_scale'])],
    ['Guidance', payloadScalar(job, ['guidance'])],
    ['Denoise', payloadScalar(job, ['denoise'])],
    ['Seed', payloadScalar(job, ['seed', 'noise_seed'])],
    ['Checkpoint', payloadScalar(job, ['checkpoint', 'ckpt_name'])],
  ]

  const seen = new Set<string>()
  return settings
    .filter(([, value]) => Boolean(value))
    .filter(([label, value]) => {
      const key = `${label}:${value}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(([label, value]) => ({ label, value }))
}

function normalizeImageData(value: unknown): string {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw) return ''
  if (raw.startsWith('data:image/') || raw.startsWith('http')) return raw
  return `data:image/png;base64,${raw}`
}

function jobSourceImages(job: ArtJob): SourceImage[] {
  const payload = payloadRecord(job)
  const sources: SourceImage[] = []
  const images = Array.isArray(payload.images) ? payload.images : []

  for (const [index, image] of images.entries()) {
    const record = asRecord(image)
    if (!record) continue
    const src = normalizeImageData(record.imageData)
    if (!src) continue
    sources.push({
      name: directScalar(record, ['name']) || `source-${index + 1}`,
      src,
    })
  }

  const directImages: Array<[string, unknown]> = [
    ['source image', payload.sourceImageBase64],
    ['first frame', payload.firstImageBase64],
    ['last frame', payload.secondImageBase64],
  ]

  for (const [name, value] of directImages) {
    const src = normalizeImageData(value)
    if (src) sources.push({ name, src })
  }

  const unique = new Map<string, SourceImage>()
  for (const source of sources) {
    if (!unique.has(source.src)) unique.set(source.src, source)
  }

  return [...unique.values()].slice(0, 3)
}

function statusCount(filter: ArtJobStatus | 'ALL'): number {
  const depth = stats.value?.queueDepth ?? {}
  if (filter === 'ALL') {
    return Object.values(depth).reduce((total, count) => total + count, 0)
  }
  return depth[filter] ?? 0
}

function statusClass(status: string): string {
  if (status === 'ONLINE') return 'text-success'
  if (status === 'OFFLINE') return 'text-error'
  if (status === 'DEGRADED') return 'text-warning'
  return 'text-base-content/50'
}

function jobImageSrc(job: { artImageId?: number | null }): string {
  if (typeof job.artImageId !== 'number') return ''
  return artJobStore.imageSrcById[job.artImageId] || ''
}

function jobImageInfo(job: { artImageId?: number | null }) {
  if (typeof job.artImageId !== 'number') return null
  return artJobStore.imageInfoById[job.artImageId] || null
}

// Track srcs whose <img>/<video> failed to load (e.g. a path that 404s) so the
// tile can fall back to the diagnostic instead of a silent broken-image icon.
// Keyed by src string, so a re-render with a new src is shown again.
const failedSrcs = ref<Set<string>>(new Set())
function markImageFailed(job: { artImageId?: number | null }) {
  const s = jobImageSrc(job)
  if (s) failedSrcs.value = new Set(failedSrcs.value).add(s)
}
function jobImageFailed(job: { artImageId?: number | null }): boolean {
  const s = jobImageSrc(job)
  return !!s && failedSrcs.value.has(s)
}
function jobImageShowable(job: { artImageId?: number | null }): boolean {
  return !!jobImageSrc(job) && !jobImageFailed(job)
}

// 'video' → render <video>; 'image' → <img>; anything else → placeholder.
function jobImageKind(job: { artImageId?: number | null }): string {
  return jobImageInfo(job)?.kind ?? 'none'
}

// Short keyword shown under the placeholder label so a blank tile at a glance
// says WHY (no bytes vs. bad data vs. unresolved path) rather than just "No image".
function jobImageReason(job: { artImageId?: number | null }): string {
  if (jobImageFailed(job)) return 'load failed (404?)'
  const info = jobImageInfo(job)
  if (!info || info.kind !== 'none') return ''
  const d = info.diag
  if (!d.hasImageData && d.imagePath === '(none)' && d.path === '(none)')
    return 'no bytes stored'
  if (d.imageDataShape === 'unusable') return 'bad imageData'
  if (d.imagePath !== '(none)' || d.path !== '(none)') return 'unresolved path'
  return 'no source'
}

// Full field dump for the hover tooltip — the "show output of the path file" ask:
// exactly what the row holds so a blank can be traced to missing bytes vs. format.
function jobImageDiag(job: { artImageId?: number | null }): string {
  const info = jobImageInfo(job)
  if (!info) return `ArtImage ${job.artImageId ?? '—'}: not loaded yet`
  const d = info.diag
  const lines = [
    `reason: ${info.reason}`,
    `kind: ${info.kind}  ·  used: ${d.usedField}`,
    `imageData: ${d.hasImageData ? d.imageDataShape : 'empty'}`,
    `fileType: ${d.fileType}`,
    `imagePath: ${d.imagePath}`,
    `path: ${d.path}`,
  ]
  if (jobImageFailed(job))
    lines.unshift(`LOAD FAILED — attempted: ${jobImageSrc(job)}`)
  return lines.join('\n')
}

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-ghost'
  return 'badge-warning'
}

function jobPlaceholder(job: ArtJob): string {
  if (job.status === 'DONE') return 'No image'
  if (job.status === 'FAILED') return 'Failed'
  if (job.status === 'CANCELLED') return 'Cancelled'
  if (job.status === 'RUNNING') return 'Rendering'
  return 'Queued'
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

function formatAgeFrom(value: string | Date | null): string {
  if (!value) return 'unknown'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'unknown'
  return formatAge(Math.max(0, Math.round((Date.now() - timestamp) / 1000)))
}

function formatTime(value: string | Date | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
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

function isRetrying(jobId: number): boolean {
  return artJobStore.retryingJobIds.includes(jobId)
}

async function retryJob(job: ArtJob, mode: ArtJobRetryMode): Promise<void> {
  await artJobStore.reenqueueJob(job.id, mode)
}

// Only finished jobs with a generated ArtImage can be curated (the curator scores
// the rendered pixels) — same gate the feedback endpoint enforces.
function canCurate(job: ArtJob): boolean {
  return job.status === 'DONE' && typeof job.artImageId === 'number'
}

function hasCuratorVerdict(job: ArtJob): boolean {
  return Boolean(asRecord(payloadRecord(job).curation)?.curator)
}

// Conductor's curator verdict/score, once it has scored a finished job — surfaced
// on the queue card so the queue and the trainer panel agree at a glance.
function curatorFeedback(job: ArtJob): JsonRecord | null {
  return asRecord(asRecord(payloadRecord(job).curation)?.curator)
}

function curatorVerdict(job: ArtJob): string {
  const verdict = curatorFeedback(job)?.verdict
  return typeof verdict === 'string' ? verdict.toUpperCase() : ''
}

function curatorScore(job: ArtJob): number | null {
  const score = curatorFeedback(job)?.score
  return typeof score === 'number' ? score : null
}

function curatorBadgeClass(job: ArtJob): string {
  const verdict = curatorVerdict(job)
  if (verdict === 'PROMOTE') return 'badge-success'
  if (verdict === 'REVISE') return 'badge-warning'
  if (verdict === 'REJECT') return 'badge-error'
  return 'badge-ghost'
}

function curationRequested(job: ArtJob): boolean {
  return (
    hasCuratorVerdict(job) || artJobStore.curationRequestedIds.includes(job.id)
  )
}

function isRequestingCuration(jobId: number): boolean {
  return artJobStore.curationRequestingIds.includes(jobId)
}

// Curatable jobs currently loaded that Conductor has not already curated or been
// asked to curate — the bulk button's target set.
const uncuratedJobs = computed(() =>
  artJobStore.jobs.filter((job) => canCurate(job) && !curationRequested(job)),
)

const bulkCurating = ref(false)

async function requestCuration(job: ArtJob): Promise<void> {
  await artJobStore.requestCuration(job.id)
}

async function requestBulkCuration(): Promise<void> {
  const ids = uncuratedJobs.value.map((job) => job.id)
  if (!ids.length) return
  bulkCurating.value = true
  try {
    await artJobStore.requestCuration(ids)
  } finally {
    bulkCurating.value = false
  }
}

async function reenqueueAllFailed(): Promise<void> {
  const count = failedJobCount.value
  if (!count || artJobStore.reenqueueingFailedJobs) return

  const confirmed = window.confirm(
    `Re-enqueue all ${count} failed art jobs as fresh outputs? The failed jobs and their errors will remain in history.`,
  )
  if (!confirmed) return

  bulkRetryMessage.value = ''
  bulkRetryHasFailures.value = false

  const result = await artJobStore.reenqueueFailedJobs()
  if (!result) return

  bulkRetryHasFailures.value = result.failedCount > 0
  bulkRetryMessage.value =
    result.requestedCount === 0
      ? 'No failed art jobs were found.'
      : result.failedCount > 0
        ? `Queued ${result.queuedCount} of ${result.requestedCount} failed jobs. ${result.failedCount} could not be queued.`
        : `Re-enqueued all ${result.queuedCount} failed jobs as fresh outputs.`
}

function askToOverwrite(job: ArtJob): void {
  overwriteJob.value = job
}

async function confirmOverwrite(): Promise<void> {
  const job = overwriteJob.value
  if (!job) return
  const queued = await artJobStore.reenqueueJob(job.id, 'OVERWRITE')
  if (queued) overwriteJob.value = null
}

async function copyPrompt(job: ArtJob): Promise<void> {
  const prompt = jobPrompt(job)
  if (!prompt || !navigator.clipboard) return

  try {
    await navigator.clipboard.writeText(prompt)
    copiedJobId.value = job.id
    window.setTimeout(() => {
      if (copiedJobId.value === job.id) copiedJobId.value = null
    }, 1600)
  } catch {
    copiedJobId.value = null
  }
}

async function checkHealth(id: number): Promise<void> {
  checkingServerId.value = id
  try {
    await serverStore.testServerHealth(id)
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
