<!-- /components/art/artjob-feedback-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <div class="border-b border-base-300 p-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold">Art trainer</h3>
            <span class="badge badge-primary badge-sm rounded-2xl">
              {{ pendingCount }} waiting
            </span>
          </div>
          <p class="mt-1 text-xs text-base-content/60">
            Conductor curates finished jobs. Your verdict becomes training context
            for its next pass.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          :disabled="artJobStore.loadingTrainerJobs"
          @click="artJobStore.fetchTrainerJobs()"
        >
          <span
            v-if="artJobStore.loadingTrainerJobs"
            class="loading loading-spinner loading-xs"
          />
          Refresh
        </button>
      </div>

      <div class="mt-3 flex flex-wrap gap-1">
        <button
          v-for="option in reviewModes"
          :key="option.value"
          type="button"
          class="btn btn-xs rounded-2xl"
          :class="reviewMode === option.value ? 'btn-primary' : 'btn-ghost'"
          @click="reviewMode = option.value"
        >
          {{ option.label }}
          <span class="ml-1 font-mono opacity-70">
            {{ modeCount(option.value) }}
          </span>
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      <div v-if="visibleJobs.length" class="flex flex-col gap-3">
        <article
          v-for="job in visibleJobs"
          :key="job.id"
          class="rounded-2xl border border-base-300 bg-base-200/30 p-3"
        >
          <div class="flex gap-3">
            <a
              v-if="jobImageShowable(job)"
              :href="jobImageSrc(job)"
              target="_blank"
              rel="noopener"
              class="shrink-0"
            >
              <video
                v-if="jobImageKind(job) === 'video'"
                :src="jobImageSrc(job)"
                class="h-28 w-24 rounded-2xl border border-base-300 object-cover"
                muted
                playsinline
                preload="metadata"
                @error="markImageFailed(job)"
              />
              <img
                v-else
                :src="jobImageSrc(job)"
                class="h-28 w-24 rounded-2xl border border-base-300 object-cover"
                alt="curated generated art"
                @error="markImageFailed(job)"
              />
            </a>
            <div
              v-else
              :title="jobImageDiag(job)"
              class="flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-dashed border-base-300 bg-base-100 p-2 text-center text-[10px] uppercase tracking-wide text-base-content/40"
            >
              <span>{{ jobImageReason(job) || 'Loading art' }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-mono text-xs font-semibold">#{{ job.id }}</span>
                <span
                  class="badge badge-sm rounded-2xl"
                  :class="verdictClass(curatorFeedback(job)?.verdict)"
                >
                  {{ curatorFeedback(job)?.verdict || 'CURATED' }}
                </span>
                <span
                  v-if="curatorFeedback(job)?.score !== null"
                  class="badge badge-outline badge-sm rounded-2xl"
                >
                  {{ curatorFeedback(job)?.score }}/100
                </span>
                <span
                  v-if="job.projectSlug"
                  class="badge badge-secondary badge-sm rounded-2xl"
                >
                  {{ job.projectSlug }}
                </span>
              </div>

              <p class="mt-2 line-clamp-4 text-xs leading-relaxed">
                {{ jobPrompt(job) || 'Prompt unavailable for this legacy job.' }}
              </p>
            </div>
          </div>

          <div
            class="mt-3 rounded-2xl border border-info/30 bg-info/10 p-3 text-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold">Conductor's read</span>
              <span class="text-[10px] text-base-content/50">
                {{ formatDate(curatorFeedback(job)?.createdAt) }}
              </span>
            </div>
            <p
              v-if="curatorFeedback(job)?.summary"
              class="mt-1 leading-relaxed"
            >
              {{ curatorFeedback(job)?.summary }}
            </p>
            <ul
              v-if="curatorFeedback(job)?.reasons.length"
              class="mt-2 list-inside list-disc space-y-1 text-base-content/70"
            >
              <li
                v-for="reason in curatorFeedback(job)?.reasons"
                :key="reason"
              >
                {{ reason }}
              </li>
            </ul>
          </div>

          <div class="mt-3">
            <div
              class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50"
            >
              What should the trainer remember?
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <button
                v-for="tag in feedbackTags"
                :key="tag.value"
                type="button"
                class="btn btn-xs h-auto min-h-7 rounded-2xl py-1"
                :class="hasTag(job.id, tag.value) ? 'btn-secondary' : 'btn-ghost'"
                @click="toggleTag(job.id, tag.value)"
              >
                {{ tag.label }}
              </button>
            </div>

            <textarea
              v-model="notesByJob[job.id]"
              class="textarea textarea-bordered mt-2 min-h-20 w-full rounded-2xl text-xs"
              placeholder="What worked, what failed, or how the next prompt should change…"
            />
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              class="btn btn-success btn-sm rounded-2xl"
              :disabled="isSaving(job.id)"
              @click="saveFeedback(job, 'PROMOTE')"
            >
              Promote
            </button>
            <button
              type="button"
              class="btn btn-warning btn-sm rounded-2xl"
              :disabled="isSaving(job.id)"
              @click="saveFeedback(job, 'REVISE')"
            >
              Revise
            </button>
            <button
              type="button"
              class="btn btn-error btn-sm rounded-2xl"
              :disabled="isSaving(job.id)"
              @click="saveFeedback(job, 'REJECT')"
            >
              Reject
            </button>
          </div>

          <div
            v-if="humanFeedback(job)"
            class="mt-3 rounded-2xl border border-success/30 bg-success/10 p-2 text-xs"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">Your saved verdict</span>
              <span
                class="badge badge-sm rounded-2xl"
                :class="verdictClass(humanFeedback(job)?.verdict)"
              >
                {{ humanFeedback(job)?.verdict }}
              </span>
              <span class="text-[10px] text-base-content/50">
                {{ formatDate(humanFeedback(job)?.createdAt) }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div
        v-else
        class="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50"
      >
        <span v-if="artJobStore.loadingTrainerJobs">Loading curated jobs…</span>
        <template v-else-if="reviewMode === 'pending'">
          <span>
            Nothing is waiting for feedback. Ask Conductor to curate the day's
            finished art and it'll show up here.
          </span>
          <button
            type="button"
            class="btn btn-secondary btn-sm rounded-2xl"
            :disabled="requestingCuration"
            @click="requestCuration"
          >
            <span
              v-if="requestingCuration"
              class="loading loading-spinner loading-xs"
            />
            Request Conductor curation
          </button>
          <span v-if="curationNote" class="text-xs text-base-content/60">
            {{ curationNote }}
          </span>
        </template>
        <span v-else>No curated jobs match this filter.</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  useArtJobStore,
  type ArtFeedbackVerdict,
  type ArtJobFeedback,
  type ArtJobRecord,
} from '@/stores/artJobStore'

type ReviewMode = 'pending' | 'reviewed' | 'all'

const artJobStore = useArtJobStore()
const reviewMode = ref<ReviewMode>('pending')
const savingIds = ref<number[]>([])
const requestingCuration = ref(false)
const curationNote = ref('')
const notesByJob = reactive<Record<number, string>>({})
const tagsByJob = reactive<Record<number, string[]>>({})

const reviewModes: Array<{ value: ReviewMode; label: string }> = [
  { value: 'pending', label: 'Needs feedback' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'all', label: 'All curated' },
]

const feedbackTags = [
  { value: 'prompt-fit', label: 'Prompt fit' },
  { value: 'composition', label: 'Composition' },
  { value: 'palette', label: 'Palette' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'story', label: 'Story' },
  { value: 'anatomy', label: 'Anatomy' },
  { value: 'generic', label: 'Too generic' },
  { value: 'text', label: 'Text / watermark' },
  { value: 'collage', label: 'Collage' },
  { value: 'line-art', label: 'Line art' },
  { value: 'too-pretty', label: 'Beautified away' },
]

const pendingJobs = computed(() => {
  return artJobStore.trainerJobs.filter((job) => !humanFeedback(job))
})

const reviewedJobs = computed(() => {
  return artJobStore.trainerJobs.filter((job) => Boolean(humanFeedback(job)))
})

const pendingCount = computed(() => pendingJobs.value.length)

const visibleJobs = computed(() => {
  if (reviewMode.value === 'pending') return pendingJobs.value
  if (reviewMode.value === 'reviewed') return reviewedJobs.value
  return artJobStore.trainerJobs
})

watch(
  () => artJobStore.trainerJobs,
  (jobs) => {
    for (const job of jobs) {
      const human = humanFeedback(job)
      if (!(job.id in notesByJob)) notesByJob[job.id] = human?.summary || ''
      if (!(job.id in tagsByJob)) tagsByJob[job.id] = [...(human?.tags || [])]
    }
  },
  { deep: true, immediate: true },
)

function modeCount(mode: ReviewMode): number {
  if (mode === 'pending') return pendingJobs.value.length
  if (mode === 'reviewed') return reviewedJobs.value.length
  return artJobStore.trainerJobs.length
}

function curation(job: ArtJobRecord) {
  return job.payload?.curation || {}
}

function curatorFeedback(job: ArtJobRecord): ArtJobFeedback | undefined {
  return curation(job).curator
}

function humanFeedback(job: ArtJobRecord): ArtJobFeedback | undefined {
  return curation(job).human
}

function jobImageSrc(job: ArtJobRecord): string {
  if (typeof job.artImageId !== 'number') return ''
  return artJobStore.imageSrcById[job.artImageId] || ''
}

function jobImageInfo(job: ArtJobRecord) {
  if (typeof job.artImageId !== 'number') return null
  return artJobStore.imageInfoById[job.artImageId] || null
}

// Track srcs whose <img>/<video> failed to load (e.g. a path that 404s) so the
// tile falls back to the diagnostic instead of a silent broken-image icon.
const failedSrcs = ref<Set<string>>(new Set())
function markImageFailed(job: ArtJobRecord) {
  const s = jobImageSrc(job)
  if (s) failedSrcs.value = new Set(failedSrcs.value).add(s)
}
function jobImageFailed(job: ArtJobRecord): boolean {
  const s = jobImageSrc(job)
  return !!s && failedSrcs.value.has(s)
}
function jobImageShowable(job: ArtJobRecord): boolean {
  return !!jobImageSrc(job) && !jobImageFailed(job)
}

function jobImageKind(job: ArtJobRecord): string {
  return jobImageInfo(job)?.kind ?? 'none'
}

// Short keyword under the placeholder; '' while the image is still loading.
function jobImageReason(job: ArtJobRecord): string {
  if (jobImageFailed(job)) return 'load failed (404?)'
  const info = jobImageInfo(job)
  if (!info || info.kind !== 'none') return ''
  const d = info.diag
  if (!d.hasImageData && d.imagePath === '(none)' && d.path === '(none)') return 'no bytes stored'
  if (d.imageDataShape === 'unusable') return 'bad imageData'
  if (d.imagePath !== '(none)' || d.path !== '(none)') return 'unresolved path'
  return 'no source'
}

// Full field dump for the hover tooltip — what the row actually holds.
function jobImageDiag(job: ArtJobRecord): string {
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
  if (jobImageFailed(job)) lines.unshift(`LOAD FAILED — attempted: ${jobImageSrc(job)}`)
  return lines.join('\n')
}

function jobPrompt(job: ArtJobRecord): string {
  const payload: Record<string, unknown> = job.payload || {}
  for (const key of ['promptString', 'artPrompt', 'prompt']) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function verdictClass(verdict?: ArtFeedbackVerdict): string {
  if (verdict === 'PROMOTE') return 'badge-success'
  if (verdict === 'REVISE') return 'badge-warning'
  if (verdict === 'REJECT') return 'badge-error'
  return 'badge-ghost'
}

function formatDate(value?: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hasTag(jobId: number, tag: string): boolean {
  return tagsByJob[jobId]?.includes(tag) || false
}

function toggleTag(jobId: number, tag: string): void {
  const tags = tagsByJob[jobId] || []
  tagsByJob[jobId] = tags.includes(tag)
    ? tags.filter((value) => value !== tag)
    : [...tags, tag]
}

function isSaving(jobId: number): boolean {
  return savingIds.value.includes(jobId)
}

async function saveFeedback(
  job: ArtJobRecord,
  verdict: ArtFeedbackVerdict,
): Promise<void> {
  if (isSaving(job.id)) return
  savingIds.value = [...savingIds.value, job.id]

  try {
    await artJobStore.submitFeedback(job.id, {
      source: 'HUMAN',
      verdict,
      summary: notesByJob[job.id]?.trim() || null,
      tags: tagsByJob[job.id] || [],
      rubricKey: 'silas-art-trainer-v1',
    })
  } finally {
    savingIds.value = savingIds.value.filter((id) => id !== job.id)
  }
}

async function requestCuration(): Promise<void> {
  if (requestingCuration.value) return
  requestingCuration.value = true
  curationNote.value = ''
  try {
    const result = await artJobStore.requestWindowCuration()
    if (!result) {
      curationNote.value =
        'No finished art in this window to curate yet — generate some first.'
      return
    }
    const queued = result.requested.length + result.alreadyQueued.length
    curationNote.value = result.requested.length
      ? `Queued ${result.requested.length} job(s) for Conductor. Verdicts appear here after the next sweep.`
      : queued
        ? 'Already queued — waiting on Conductor to curate.'
        : 'No eligible finished jobs to curate in this window.'
  } finally {
    requestingCuration.value = false
  }
}
</script>