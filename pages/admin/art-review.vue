<template>
  <main class="playbook-studio kr-surface gap-0">
    <header-page-bar>
      <div
        class="flex min-w-0 flex-1 items-center gap-2"
        data-testid="art-review-page-bar"
      >
        <NuxtLink
          to="/admin/playbook-forge"
          class="kr-btn-ghost shrink-0 gap-1"
          title="Temporary · Ecotone art ledgers"
        >
          <Icon name="kind-icon:chevron-left" class="size-4" /> Playbook Studio
        </NuxtLink>
        <button
          type="button"
          class="kr-btn-ghost ml-auto shrink-0"
          aria-label="Refresh statuses"
          :disabled="loading"
          @click="load"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
        </button>
      </div>
    </header-page-bar>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="m-6 rounded-2xl border border-error/50 p-8 text-center"
    >
      <p class="text-lg font-black">Administrator access required</p>
    </div>

    <div v-else class="kr-scroll @container px-4 py-5 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <h2
            class="font-serif text-4xl font-black uppercase leading-none @3xl:text-5xl"
          >
            {{ round.title }}
          </h2>
          <p class="mt-2 max-w-3xl text-base-content/80">{{ round.blurb }}</p>
        </div>
        <div
          class="flex flex-wrap rounded-full border border-base-content/25 p-0.5"
          role="tablist"
          aria-label="Round"
        >
          <button
            v-for="option in ART_REVIEW_ROUNDS"
            :key="option.id"
            type="button"
            role="tab"
            class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[.14em]"
            :class="
              roundId === option.id
                ? 'bg-primary text-primary-content'
                : 'text-base-content/75 hover:text-base-content'
            "
            :aria-selected="roundId === option.id"
            @click="pickRound(option.id)"
          >
            {{ option.title }}
          </button>
        </div>
      </div>

      <p
        v-if="error"
        class="mt-4 rounded-xl border border-error/50 px-3 py-2 text-sm text-error"
        role="status"
      >
        {{ error }}
      </p>

      <section
        v-if="round.notes.recommendation || round.notes.people"
        class="mt-5 grid gap-3 @4xl:grid-cols-3"
      >
        <article
          v-for="(text, key) in round.notes"
          :key="key"
          class="rounded-2xl border border-base-content/15 bg-base-200/70 p-4"
        >
          <p class="studio-subhead">
            {{ key === 'recommendation' ? 'Recommendation' : `Review: ${key}` }}
          </p>
          <p class="mt-1 text-sm leading-relaxed text-base-content/85">
            {{ text }}
          </p>
        </article>
      </section>

      <h3 class="studio-heading mt-8">Lanes</h3>
      <p class="mt-1 text-xs text-base-content/65">
        Render time runs from the relay claiming a job to its image being saved:
        it includes loading the model (the first job on a lane pays it) and the
        upload. Wait is time in the queue before the claim.
      </p>
      <div
        class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <article
          v-for="stat in laneStats"
          :key="stat.lane.key"
          class="rounded-2xl border p-4 transition"
          :class="
            shortlist.includes(stat.lane.key)
              ? 'border-primary bg-primary/10'
              : 'border-base-content/15 bg-base-200/70'
          "
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-bold leading-tight">{{ stat.lane.label }}</p>
              <p class="truncate text-[11px] text-base-content/60">
                {{ stat.lane.checkpoint || stat.lane.engine }}
              </p>
            </div>
            <button
              v-if="round.lanes.length > 1"
              type="button"
              class="studio-chip shrink-0"
              :class="shortlist.includes(stat.lane.key) ? 'is-on' : ''"
              :aria-pressed="shortlist.includes(stat.lane.key)"
              @click="toggleShortlist(stat.lane.key)"
            >
              {{
                shortlist.includes(stat.lane.key) ? 'Shortlisted' : 'Shortlist'
              }}
            </button>
          </div>
          <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-base-300/60 p-1.5">
              <dt
                class="text-[10px] uppercase tracking-wider text-base-content/60"
              >
                Median
              </dt>
              <dd class="font-black">{{ formatSeconds(stat.median) }}</dd>
            </div>
            <div class="rounded-lg bg-base-300/60 p-1.5">
              <dt
                class="text-[10px] uppercase tracking-wider text-base-content/60"
              >
                Fastest
              </dt>
              <dd class="font-black">{{ formatSeconds(stat.min) }}</dd>
            </div>
            <div class="rounded-lg bg-base-300/60 p-1.5">
              <dt
                class="text-[10px] uppercase tracking-wider text-base-content/60"
              >
                Slowest
              </dt>
              <dd class="font-black">{{ formatSeconds(stat.max) }}</dd>
            </div>
          </dl>
          <p class="mt-2 text-xs text-base-content/70">
            {{ stat.done }} of {{ stat.total }} done<span v-if="stat.failed">
              · {{ stat.failed }} failed</span
            ><span v-if="stat.waiting"> · {{ stat.waiting }} waiting</span>
          </p>
        </article>
      </div>
      <p
        v-if="round.lanes.length > 1 && shortlist.length"
        class="mt-3 text-sm text-base-content/80"
      >
        Shortlist ({{ shortlist.length }}):
        {{
          shortlist
            .map((key) => round.lanes.find((l) => l.key === key)?.label ?? key)
            .join(', ')
        }}. Tell Claude these and they become Ecotone art styles.
      </p>

      <h3 class="studio-heading mt-8">
        {{ round.lanes.length > 1 ? 'Side by side' : 'Every render' }}
      </h3>
      <div class="mt-3 overflow-x-auto pb-2">
        <div
          class="grid gap-3"
          :style="{
            gridTemplateColumns:
              round.lanes.length > 1
                ? `minmax(9rem, 12rem) repeat(${round.lanes.length}, minmax(10.5rem, 1fr))`
                : 'repeat(auto-fill, minmax(min(100%, 13rem), 1fr))',
          }"
        >
          <template v-if="round.lanes.length > 1">
            <span />
            <p
              v-for="lane in round.lanes"
              :key="lane.key"
              class="text-xs font-bold uppercase tracking-[.14em]"
              :class="
                shortlist.includes(lane.key)
                  ? 'text-primary'
                  : 'text-base-content/80'
              "
            >
              {{ lane.label }}
            </p>
          </template>
          <template v-for="subject in round.subjects" :key="subject.key">
            <div v-if="round.lanes.length > 1" class="flex flex-col gap-1 pr-1">
              <p class="font-serif text-base font-black leading-tight">
                {{ subject.title }}
              </p>
              <p class="text-[11px] text-base-content/60">
                {{ subject.size }} · seed {{ subject.seed ?? '—' }}
              </p>
              <button
                type="button"
                class="self-start text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
                @click="promptFor = subject"
              >
                Prompt
              </button>
            </div>
            <button
              v-for="lane in round.lanes"
              :key="`${subject.key}-${lane.key}`"
              type="button"
              class="group flex flex-col overflow-hidden rounded-xl border bg-base-200 text-left transition hover:border-primary"
              :class="
                shortlist.includes(lane.key)
                  ? 'border-primary/60'
                  : 'border-base-content/15'
              "
              :disabled="!jobFor(subject, lane.key)"
              @click="open(subject, lane)"
            >
              <span
                class="relative block w-full overflow-hidden bg-base-300"
                :class="aspectFor(subject)"
              >
                <img
                  v-if="jobFor(subject, lane.key)?.image"
                  :src="jobFor(subject, lane.key)!.image!.thumbnailUrl"
                  :alt="`${subject.title}, ${lane.label}`"
                  loading="lazy"
                  class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  v-else
                  class="absolute inset-0 grid place-items-center p-2 text-center text-xs font-bold uppercase tracking-wider text-base-content/55"
                >
                  {{ statusLabel(jobFor(subject, lane.key)) }}
                </span>
              </span>
              <span
                class="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px]"
              >
                <span class="truncate font-bold">
                  {{ round.lanes.length > 1 ? lane.label : subject.title }}
                </span>
                <span
                  class="shrink-0 font-mono"
                  :class="
                    jobFor(subject, lane.key)?.status === 'FAILED'
                      ? 'text-error'
                      : 'text-base-content/75'
                  "
                  >{{ cellTime(jobFor(subject, lane.key)) }}</span
                >
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <dialog ref="lightbox" class="modal" @close="closeLightbox">
      <div
        v-if="viewing"
        class="modal-box max-w-5xl border border-primary/40 bg-base-100 p-0 text-base-content"
      >
        <div class="grid @container gap-0 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div class="grid min-h-64 place-items-center bg-black">
            <img
              v-if="fullSrc || viewing.job?.image?.thumbnailUrl"
              :src="fullSrc || viewing.job?.image?.thumbnailUrl"
              :alt="`${viewing.subject.title}, ${viewing.lane.label}`"
              class="max-h-[80dvh] w-full object-contain"
            />
            <p v-else class="p-6 text-sm text-base-content/70">
              {{ statusLabel(viewing.job) }}
            </p>
          </div>
          <div class="flex flex-col gap-2 p-4 text-sm">
            <p class="studio-subhead">{{ viewing.lane.label }}</p>
            <p class="font-serif text-xl font-black leading-tight">
              {{ viewing.subject.title }}
            </p>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt class="text-base-content/60">Render</dt>
              <dd>{{ formatSeconds(viewing.job?.renderSeconds) }}</dd>
              <dt class="text-base-content/60">Queue wait</dt>
              <dd>{{ formatSeconds(viewing.job?.waitSeconds) }}</dd>
              <dt class="text-base-content/60">Status</dt>
              <dd>
                {{ viewing.job?.status ?? 'Unknown'
                }}<template v-if="(viewing.job?.attempts ?? 0) > 1">
                  · {{ viewing.job?.attempts }} attempts</template
                >
              </dd>
              <dt class="text-base-content/60">Checkpoint</dt>
              <dd class="break-all">
                {{
                  viewing.job?.image?.checkpoint ||
                  viewing.lane.checkpoint ||
                  viewing.lane.engine
                }}
              </dd>
              <dt class="text-base-content/60">Seed · steps</dt>
              <dd>
                {{ viewing.job?.image?.seed ?? viewing.subject.seed ?? '—' }} ·
                {{ viewing.job?.image?.steps ?? viewing.lane.steps ?? '—' }}
              </dd>
              <dt class="text-base-content/60">Size</dt>
              <dd>{{ viewing.subject.size || '—' }}</dd>
              <dt class="text-base-content/60">Job · image</dt>
              <dd class="font-mono">
                {{ viewing.jobId }} · {{ viewing.job?.image?.id ?? '—' }}
              </dd>
            </dl>
            <p
              v-if="viewing.job?.error"
              class="rounded-lg border border-error/40 p-2 text-xs text-error"
            >
              {{ viewing.job.error }}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-base-content/75">
              {{ viewing.subject.prompt }}
            </p>
            <form method="dialog" class="mt-auto">
              <button type="submit" class="studio-gold-button w-full">
                Close
              </button>
            </form>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>

    <dialog ref="promptDialog" class="modal" @close="promptFor = null">
      <div
        v-if="promptFor"
        class="modal-box border border-primary/40 bg-base-100 text-base-content"
      >
        <p class="studio-subhead">Prompt</p>
        <p class="mt-1 font-serif text-lg font-black">{{ promptFor.title }}</p>
        <p class="mt-2 text-sm leading-relaxed text-base-content/85">
          {{ promptFor.prompt }}
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button type="submit" class="studio-gold-button">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import { resolveArtImageSource } from '~/utils/artImageSource'
import {
  ART_REVIEW_ROUNDS,
  artReviewJobIds,
  type ArtReviewLane,
  type ArtReviewSubject,
} from '~/utils/ecotone/artReview'

// Temporary checkpoint review (conductor weird-humboldt t-043): every render
// in the Ecotone art ledgers side by side, with live status and timings, and
// a shortlist for picking which checkpoints become Ecotone art styles.

type ReviewJob = {
  id: number
  status: string
  engine: string
  attempts: number
  error: string | null
  renderSeconds: number | null
  waitSeconds: number | null
  image: null | {
    id: number
    thumbnailUrl: string
    checkpoint: string | null
    seed: number | null
    steps: number | null
  }
}

useHead({ title: 'Checkpoint review' })

const SHORTLIST_KEY = 'ecotone-checkpoint-shortlist'
const userStore = useUserStore()
const ready = ref(false)
const loading = ref(false)
const error = ref('')
const roundId = ref(ART_REVIEW_ROUNDS[0]!.id)
const jobs = ref<Record<number, ReviewJob>>({})
const shortlist = ref<string[]>([])
const lightbox = ref<HTMLDialogElement | null>(null)
const promptDialog = ref<HTMLDialogElement | null>(null)
const promptFor = ref<ArtReviewSubject | null>(null)
const viewing = ref<null | {
  subject: ArtReviewSubject
  lane: ArtReviewLane
  jobId: number
  job: ReviewJob | undefined
}>(null)
const fullSrc = ref('')

const round = computed(
  () =>
    ART_REVIEW_ROUNDS.find((r) => r.id === roundId.value) ??
    ART_REVIEW_ROUNDS[0]!,
)

function jobFor(subject: ArtReviewSubject, lane: string) {
  const id = subject.jobs[lane]
  return id ? jobs.value[id] : undefined
}

function aspectFor(subject: ArtReviewSubject) {
  const [w, h] = subject.size.split('x').map(Number)
  return w && h && h > w ? 'aspect-[2/3]' : 'aspect-[3/2]'
}

function formatSeconds(value?: number | null) {
  if (value === null || value === undefined) return '—'
  if (value < 90) return `${Math.round(value)}s`
  const minutes = Math.floor(value / 60)
  return `${minutes}m ${Math.round(value - minutes * 60)}s`
}

function statusLabel(job?: ReviewJob) {
  if (!job) return 'Not loaded'
  if (job.status === 'DONE') return 'Done, no image'
  return job.status.toLowerCase()
}

function cellTime(job?: ReviewJob) {
  if (!job) return ''
  if (job.status === 'DONE') return formatSeconds(job.renderSeconds)
  return job.status.toLowerCase()
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const laneStats = computed(() =>
  round.value.lanes.map((lane) => {
    const laneJobs = round.value.subjects
      .map((subject) => jobFor(subject, lane.key))
      .filter((job): job is ReviewJob => Boolean(job))
    const times = laneJobs
      .filter((job) => job.status === 'DONE' && job.renderSeconds !== null)
      .map((job) => job.renderSeconds as number)
    return {
      lane,
      total: round.value.subjects.filter((s) => s.jobs[lane.key]).length,
      done: laneJobs.filter((job) => job.status === 'DONE').length,
      failed: laneJobs.filter((job) => job.status === 'FAILED').length,
      waiting: laneJobs.filter((job) =>
        ['PENDING', 'RUNNING'].includes(job.status),
      ).length,
      median: median(times),
      min: times.length ? Math.min(...times) : null,
      max: times.length ? Math.max(...times) : null,
    }
  }),
)

async function load() {
  loading.value = true
  error.value = ''
  const ids = artReviewJobIds(round.value)
  // The server reads at most 300 jobs a call; the art standard has ~950.
  for (let start = 0; start < ids.length; start += 300) {
    const response = await performFetch<ReviewJob[]>(
      `/api/admin/art-review?ids=${ids.slice(start, start + 300).join(',')}`,
    )
    if (!response.success || !response.data) {
      error.value = response.message || 'Could not load the jobs.'
      break
    }
    jobs.value = {
      ...jobs.value,
      ...Object.fromEntries(response.data.map((job) => [job.id, job])),
    }
  }
  loading.value = false
}

function pickRound(id: string) {
  roundId.value = id
  void load()
}

function toggleShortlist(key: string) {
  shortlist.value = shortlist.value.includes(key)
    ? shortlist.value.filter((k) => k !== key)
    : [...shortlist.value, key]
}

watch(shortlist, (value) => {
  try {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(value))
  } catch {
    // The shortlist is a convenience; the page works without storage.
  }
})

async function open(subject: ArtReviewSubject, lane: ArtReviewLane) {
  const jobId = subject.jobs[lane.key]
  if (!jobId) return
  viewing.value = { subject, lane, jobId, job: jobs.value[jobId] }
  fullSrc.value = ''
  await nextTick()
  lightbox.value?.showModal()
  const imageId = jobs.value[jobId]?.image?.id
  if (!imageId) return
  const response = await performFetch<
    Parameters<typeof resolveArtImageSource>[0]
  >(`/api/art/image/${imageId}?includeImageData=true&showMature=true`)
  if (response.success && response.data && viewing.value?.jobId === jobId)
    fullSrc.value = resolveArtImageSource(response.data).src
}

function closeLightbox() {
  viewing.value = null
  fullSrc.value = ''
}

watch(promptFor, async (value) => {
  if (!value) return
  await nextTick()
  promptDialog.value?.showModal()
})

onMounted(async () => {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(SHORTLIST_KEY) ?? '[]',
    )
    if (Array.isArray(saved))
      shortlist.value = saved.filter((k): k is string => typeof k === 'string')
  } catch {
    shortlist.value = []
  }
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await load()
})
</script>

<style src="../../assets/css/playbook-studio.css"></style>
