<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="deepheart-art-bible"
  >
    <header-page-bar console-theme="deepheart">
      <div class="flex min-w-0 flex-1 items-center gap-3 px-2">
        <NuxtLink
          to="/admin/deepheart"
          class="btn btn-ghost btn-xs"
          aria-label="Back to Deepheart"
        >
          ← Delve
        </NuxtLink>
        <strong class="truncate text-sm uppercase tracking-widest">
          Deepheart · Art Bible
        </strong>
        <span class="ml-auto hidden text-xs opacity-70 sm:inline">
          Private director's room
        </span>
      </div>
    </header-page-bar>

    <section
      v-if="!canAccess"
      class="grid min-h-0 flex-1 place-items-center px-6 text-center"
    >
      <p class="max-w-md">
        The Deepheart art bible is available to administrators with mature
        previews enabled. The game remains available from the Delve link.
      </p>
    </section>
    <div v-else class="flex min-h-0 flex-1 flex-col gap-2 p-2">
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <div class="join" role="tablist" aria-label="Art bible sections">
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            role="tab"
            class="btn btn-sm join-item"
            :class="tab === item.key ? 'btn-primary' : 'btn-ghost'"
            :aria-selected="tab === item.key"
            @click="tab = item.key"
          >
            {{ item.label }}
          </button>
        </div>
        <span class="ml-auto text-xs opacity-75">
          {{ completed }}/{{ total }} rendered · {{ submitted }} accepted
        </span>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="refresh"
        >
          {{ loading ? 'Checking…' : 'Refresh jobs' }}
        </button>
      </div>

      <div
        class="flex shrink-0 flex-wrap gap-x-4 gap-y-1 rounded-xl border border-base-content/20 bg-base-200 px-3 py-2 text-xs"
        data-testid="dh-approved-models"
      >
        <span>
          Approved production style:
          <strong class="text-primary">{{
            DEEPHEART_APPROVED_ART_MODELS.standard.label
          }}</strong>
        </span>
        <span>
          Mature romance unlocks:
          <strong class="text-secondary">{{
            DEEPHEART_APPROVED_ART_MODELS.afterHours.label
          }}</strong>
          · private, adult-only
        </span>
      </div>

      <p v-if="error" class="alert alert-error text-xs" role="alert">
        {{ error }}
      </p>

      <section
        v-if="tab === 'compare'"
        class="flex min-h-0 flex-1 flex-col gap-2"
        aria-label="Model comparison"
      >
        <div
          class="flex shrink-0 gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Style test scenes"
        >
          <button
            v-for="subject in DEEPHEART_STYLE_SUBJECTS"
            :key="subject.key"
            type="button"
            role="tab"
            class="min-w-36 shrink-0 rounded-xl border p-2 text-left text-xs"
            :class="
              selectedSubject === subject.key
                ? 'border-primary bg-primary/20'
                : 'border-base-content/20 bg-base-200'
            "
            :aria-selected="selectedSubject === subject.key"
            :data-testid="'dh-style-' + subject.key"
            @click="selectSubject(subject.key)"
          >
            <strong class="block">{{ subject.title }}</strong>
            <small class="block opacity-70">{{ subject.subtitle }}</small>
          </button>
        </div>
        <p class="shrink-0 px-1 text-xs opacity-75">
          {{ activeSubject.purpose }} · fixed seed {{ activeSubject.seed }}
          across all eight lanes. Select an image to inspect it.
        </p>

        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto pb-3">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="lane in DEEPHEART_STYLE_LANES"
              :key="lane.key"
              class="flex min-w-0 flex-col overflow-hidden rounded-xl border border-base-content/15 bg-base-200"
              :data-testid="'dh-model-' + lane.key"
            >
              <div class="flex items-start justify-between gap-2 p-2">
                <div class="min-w-0">
                  <strong class="block truncate text-sm">{{
                    lane.title
                  }}</strong>
                  <small class="block text-xs opacity-70">{{
                    lane.tone
                  }}</small>
                </div>
                <span class="badge badge-sm">{{ statusFor(lane.key) }}</span>
              </div>
              <button
                type="button"
                class="grid w-full place-items-center overflow-hidden bg-base-300"
                :style="{ aspectRatio: activeSubject.aspect }"
                :disabled="!imageFor(lane.key)"
                :aria-label="'Inspect ' + lane.title + ' image'"
                @click="inspect(lane.key)"
              >
                <img
                  v-if="imageFor(lane.key)"
                  :src="imageFor(lane.key)"
                  :alt="activeSubject.title + ', ' + lane.title"
                  loading="lazy"
                  class="h-full w-full object-contain"
                />
                <span v-else class="px-3 text-center text-xs opacity-60">
                  {{
                    jobFor(lane.key)
                      ? 'Waiting for render'
                      : 'No accepted ArtJob'
                  }}
                </span>
              </button>
              <div class="grid gap-2 p-2 text-xs">
                <p class="break-all font-mono opacity-70">
                  {{ lane.model }}
                  <span v-if="jobFor(lane.key)">
                    · Job #{{ jobFor(lane.key)?.jobId }}
                  </span>
                </p>
                <label class="flex items-center justify-between gap-2">
                  Overall art direction
                  <select
                    class="select select-xs"
                    :value="scoreFor(lane.key)"
                    :aria-label="'Rate ' + lane.title"
                    @change="
                      setScore(
                        lane.key,
                        Number(($event.target as HTMLSelectElement).value),
                      )
                    "
                  >
                    <option :value="0">Unrated</option>
                    <option v-for="n in 5" :key="n" :value="n">
                      {{ n }} / 5
                    </option>
                  </select>
                </label>
                <details>
                  <summary class="cursor-pointer">Notes & critique</summary>
                  <textarea
                    class="textarea textarea-bordered mt-1 w-full text-xs"
                    :value="noteFor(lane.key)"
                    :aria-label="'Notes for ' + lane.title"
                    maxlength="700"
                    rows="2"
                    placeholder="Species, faces, drama, camera, clothing…"
                    @input="
                      setNote(
                        lane.key,
                        ($event.target as HTMLTextAreaElement).value,
                      )
                    "
                  />
                </details>
                <p v-if="jobFor(lane.key)?.error" class="text-error">
                  {{ jobFor(lane.key)?.error }}
                </p>
              </div>
            </article>
          </div>
          <p class="mt-3 text-xs opacity-60">
            Scores and notes are saved on this device. No model is promoted
            until the images have actually rendered and been reviewed.
          </p>
        </div>
      </section>

      <section
        v-else-if="tab === 'cast'"
        class="kr-scroll min-h-0 flex-1 overflow-y-auto p-1"
        aria-label="Character visual designs"
      >
        <p class="mb-3 text-sm opacity-80">
          Choose a painted delver to inspect their full character art,
          biography, original prompt and new ArtJob requests.
        </p>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <button
            v-for="person in CHARACTERS"
            :key="person.id"
            type="button"
            class="group min-w-0 overflow-hidden rounded-xl border border-base-content/20 bg-base-200 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="'Inspect ' + person.name"
            :data-testid="'dh-bible-cast-' + person.id"
            @click="openDetail('cast', person.id)"
          >
            <DeepheartPortrait
              :id="person.id"
              size="lg"
              class="!aspect-[3/4] w-full !rounded-none"
            />
            <div class="p-2">
              <h3 class="truncate font-semibold">{{ person.name }}</h3>
              <p class="text-xs opacity-70">
                {{ ROLES[person.role].label }} · Inspect &amp; repaint
              </p>
            </div>
          </button>
        </div>
      </section>

      <section
        v-else-if="tab === 'court'"
        class="kr-scroll min-h-0 flex-1 overflow-y-auto p-1"
        aria-label="Painted immortal court"
        data-testid="dh-pantheon-bible"
      >
        <p class="mb-3 text-sm opacity-80">
          All twelve human-faced immortals have completed Krea 2 encounter
          artwork. Inspect their paintings, court history and art prompts, or
          request a new character portrait.
        </p>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="deity in COURT_DEITIES"
            :key="deity.id"
            type="button"
            class="group min-w-0 overflow-hidden rounded-xl border border-base-content/20 bg-base-200 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            :data-testid="'dh-pantheon-' + deity.id"
            :aria-label="'Inspect ' + deity.name"
            @click="openDetail('court', deity.id)"
          >
            <img
              :src="deepheartArtSrc('court:' + deity.id)"
              :alt="deity.name + ' illustrated court encounter'"
              loading="lazy"
              class="aspect-[4/3] w-full bg-base-300 object-cover"
            />
            <div class="p-2">
              <p class="text-[0.65rem] uppercase tracking-wider opacity-70">
                Depth {{ deity.layer + 1 }} · {{ deity.mythicEcho }}
              </p>
              <h3 class="truncate font-semibold">{{ deity.name }}</h3>
              <p class="truncate text-xs italic opacity-70">
                {{ deity.epithet }}
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="focus"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="'Inspect ' + focusName"
      data-testid="dh-bible-subject-detail"
      @click.self="closeDetail"
      @keydown.esc="closeDetail"
    >
      <section
        class="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-primary/30 bg-base-200 shadow-2xl"
      >
        <div
          class="flex items-center justify-between gap-3 border-b border-base-content/15 px-4 py-2"
        >
          <div class="min-w-0">
            <p class="text-[0.65rem] uppercase tracking-widest text-primary">
              {{
                focus?.kind === 'court' ? 'Immortal court' : 'Character bible'
              }}
            </p>
            <h2 class="truncate text-lg font-bold">{{ focusName }}</h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="closeDetail"
          >
            Close
          </button>
        </div>
        <div
          class="kr-scroll grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,1fr)] md:p-4"
        >
          <div class="min-h-0">
            <img
              v-if="focusImage"
              :src="focusImage"
              :alt="focusName + ' full illustration'"
              class="max-h-[68dvh] w-full rounded-xl bg-base-300 object-contain"
            />
            <DeepheartPortrait
              v-else-if="focusCast"
              :id="focusCast.id"
              size="lg"
              class="mx-auto max-h-[68dvh] w-full max-w-lg"
            />
            <div
              v-else
              class="grid min-h-56 place-items-center rounded-xl bg-base-300 text-sm opacity-70"
            >
              Awaiting artwork
            </div>
            <p class="mt-2 text-xs opacity-70">
              {{
                focusJob?.status === 'DONE' && focusJob.artImageId && focusImage
                  ? 'Latest requested painting'
                  : 'Original approved illustration'
              }}
              · private director's copy
            </p>
          </div>
          <div class="space-y-3 text-sm">
            <template v-if="focusCast">
              <p class="text-xs uppercase text-primary">
                {{ ROLES[focusCast.role].label }}
              </p>
              <p>{{ focusCast.blurb }}</p>
              <p class="text-xs opacity-80">{{ focusCast.secret }}</p>
              <p class="text-xs italic opacity-80">{{ focusCast.arc }}</p>
            </template>
            <template v-else-if="focusDeity">
              <p class="text-xs uppercase text-primary">
                {{ focusDeity.mythicEcho }} · Depth {{ focusDeity.layer + 1 }}
              </p>
              <p class="font-semibold">{{ focusDeity.epithet }}</p>
              <p>{{ focusDeity.power }}</p>
              <p class="text-secondary">{{ focusDeity.obsession }}</p>
              <p class="opacity-80">{{ focusDeity.immortalTruth }}</p>
            </template>
            <details class="rounded-lg border border-base-content/20 p-3">
              <summary class="cursor-pointer font-medium">
                Original physical art prompt
              </summary>
              <p class="mt-2 text-xs leading-relaxed">{{ focusPrompt }}</p>
            </details>
            <div
              class="space-y-2 rounded-xl border border-primary/25 bg-base-300/65 p-3"
            >
              <h3 class="font-bold">Request new painted art</h3>
              <p class="text-xs opacity-80">
                Krea 2 · private · original image preserved. Add physical
                changes to pose, clothing, expression or lighting.
              </p>
              <textarea
                v-model="artNotes"
                class="textarea textarea-bordered w-full text-sm"
                rows="3"
                maxlength="350"
                placeholder="Optional changes for the next illustration…"
                aria-label="New art instructions"
              />
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="requesting || focusJobPending"
                data-testid="dh-bible-request-art"
                @click="requestPainting"
              >
                {{
                  requesting
                    ? 'Requesting…'
                    : focusJobPending
                      ? 'Render already queued'
                      : 'Request new Krea 2 painting'
                }}
              </button>
              <p v-if="focusJob" class="text-xs opacity-75">
                Latest ArtJob #{{ focusJob.jobId }} · {{ focusJob.status }}
              </p>
              <p v-if="artNotice" class="text-xs text-success" role="status">
                {{ artNotice }}
              </p>
              <p v-if="artError" class="text-xs text-error" role="alert">
                {{ artError }}
              </p>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="loadingArtJobs"
                @click="refreshBibleArt"
              >
                {{ loadingArtJobs ? 'Checking…' : 'Refresh painting status' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="zoomSrc"
      class="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Inspect full comparison image"
      @click.self="zoomSrc = ''"
    >
      <button
        type="button"
        class="btn btn-sm absolute right-4 top-4"
        @click="zoomSrc = ''"
      >
        Close
      </button>
      <img
        :src="zoomSrc"
        alt="Selected Deepheart art comparison"
        class="max-h-[86vh] max-w-full object-contain"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtJobStore } from '~/stores/artJobStore'
import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import { ANTHRO_LOOK } from '~/utils/deepheart/anthro'
import { COURT_DEITIES } from '~/utils/deepheart/court'
import { deepheartArtSrc } from '~/utils/deepheart/renderedArt'
import { CHARACTERS, ROLES } from '~/utils/deepheart/roster'
import {
  DEEPHEART_APPROVED_ART_MODELS,
  DEEPHEART_STYLE_LANES,
  DEEPHEART_STYLE_SUBJECTS,
  type DeepheartStyleJob,
} from '~/utils/deepheart/styleCheck'

const user = useUserStore()
const art = useArtJobStore()
const canAccess = computed(() => user.isAdmin && user.showMature)
const tabs = [
  { key: 'compare', label: 'Model comparison' },
  { key: 'cast', label: 'Character bible' },
  { key: 'court', label: 'Twelve gods' },
] as const
const tab = ref<(typeof tabs)[number]['key']>('compare')
const selectedSubject = ref<string>(DEEPHEART_STYLE_SUBJECTS[0].key)
const activeSubject = computed(
  () =>
    DEEPHEART_STYLE_SUBJECTS.find(
      (subject) => subject.key === selectedSubject.value,
    ) ?? DEEPHEART_STYLE_SUBJECTS[0],
)
const jobs = ref<DeepheartStyleJob[]>([])
const loading = ref(false)
const error = ref('')
const zoomSrc = ref('')
const total = DEEPHEART_STYLE_SUBJECTS.length * DEEPHEART_STYLE_LANES.length
const submitted = computed(() => jobs.value.length)
const completed = computed(
  () =>
    jobs.value.filter((job) => job.status === 'DONE' && job.artImageId).length,
)
type Review = { score: number; note: string }
const reviews = ref<Record<string, Review>>({})
const storageKey = 'deepheart-anthro-style-trial-2026-11-16'
type SubjectKind = 'cast' | 'court'
type BibleFocus = { kind: SubjectKind; id: string }
type BibleJob = BibleFocus & {
  jobId: number
  status: string
  artImageId: number | null
  updatedAt: string
}

const focus = ref<BibleFocus | null>(null)
const artNotes = ref('')
const artNotice = ref('')
const artError = ref('')
const requesting = ref(false)
const loadingArtJobs = ref(false)
const bibleJobs = ref<BibleJob[]>([])
const focusCast = computed(() =>
  focus.value?.kind === 'cast'
    ? CHARACTERS.find((person) => person.id === focus.value?.id)
    : null,
)
const focusDeity = computed(() =>
  focus.value?.kind === 'court'
    ? COURT_DEITIES.find((deity) => deity.id === focus.value?.id)
    : null,
)
const focusName = computed(
  () => focusCast.value?.name ?? focusDeity.value?.name ?? '',
)
const focusPrompt = computed(
  () =>
    (focusCast.value ? ANTHRO_LOOK[focusCast.value.id] : null) ??
    focusDeity.value?.look ??
    '',
)
const focusJob = computed(() =>
  bibleJobs.value.find(
    (job) => job.kind === focus.value?.kind && job.id === focus.value?.id,
  ),
)
const focusJobPending = computed(
  () =>
    focusJob.value?.status === 'PENDING' ||
    focusJob.value?.status === 'RUNNING',
)
const focusImage = computed(() => {
  if (!focus.value) return ''
  const latestId = focusJob.value?.artImageId
  const latest = latestId ? art.imageSrcById[latestId] : ''
  return (
    latest || deepheartArtSrc(`${focus.value.kind}:${focus.value.id}`) || ''
  )
})

async function refreshBibleArt() {
  if (!canAccess.value || loadingArtJobs.value) return
  loadingArtJobs.value = true
  artError.value = ''
  try {
    const result = await performFetch<{ jobs: BibleJob[] }>(
      '/api/deepheart/bible-art',
      {},
      1,
      30_000,
    )
    if (!result.success || !result.data)
      throw new Error(result.message || 'Could not read repaint jobs.')
    bibleJobs.value = result.data.jobs
    const selected = focus.value
    const job = bibleJobs.value.find(
      (item) => item.kind === selected?.kind && item.id === selected?.id,
    )
    if (job?.status === 'DONE' && job.artImageId)
      await art.loadJobImage(job.artImageId, job.updatedAt, true)
  } catch (cause) {
    artError.value =
      cause instanceof Error ? cause.message : 'Could not refresh art jobs.'
  } finally {
    loadingArtJobs.value = false
  }
}

function openDetail(kind: SubjectKind, id: string) {
  focus.value = { kind, id }
  artNotes.value = ''
  artNotice.value = ''
  artError.value = ''
  void refreshBibleArt()
  const known = bibleJobs.value.find(
    (job) => job.kind === kind && job.id === id,
  )
  if (known?.status === 'DONE' && known.artImageId)
    void art.loadJobImage(known.artImageId, known.updatedAt, true)
}

function closeDetail() {
  focus.value = null
  artNotes.value = ''
}

async function requestPainting() {
  if (
    !focus.value ||
    !canAccess.value ||
    requesting.value ||
    focusJobPending.value
  )
    return
  requesting.value = true
  artError.value = ''
  artNotice.value = ''
  try {
    const result = await performFetch<{
      jobId: number
      status: string
      reused: boolean
    }>(
      '/api/deepheart/bible-art',
      {
        method: 'POST',
        body: JSON.stringify({
          kind: focus.value.kind,
          id: focus.value.id,
          notes: artNotes.value,
        }),
      },
      1,
      45_000,
    )
    const jobId = Number(result.data?.jobId)
    if (!result.success || !Number.isInteger(jobId) || jobId <= 0)
      throw new Error(result.message || 'Could not queue a painting.')
    artNotice.value = result.data?.reused
      ? `ArtJob #${jobId} is already rendering.`
      : `ArtJob #${jobId} queued. The original painting is safe.`
    await refreshBibleArt()
  } catch (cause) {
    artError.value =
      cause instanceof Error ? cause.message : 'Could not queue the painting.'
  } finally {
    requesting.value = false
  }
}

function cellKey(lane: string) {
  return selectedSubject.value + ':' + lane
}

function jobFor(lane: string) {
  return (
    jobs.value.find(
      (job) => job.subjectKey === selectedSubject.value && job.laneKey === lane,
    ) ?? null
  )
}

function statusFor(lane: string) {
  const job = jobFor(lane)
  return job ? job.status.toLowerCase() : 'Not queued'
}

function imageFor(lane: string) {
  const id = jobFor(lane)?.artImageId
  return id ? (art.imageSrcById[id] ?? '') : ''
}

function inspect(lane: string) {
  zoomSrc.value = imageFor(lane)
}

async function loadSelectedImages() {
  if (!canAccess.value) return
  await Promise.all(
    jobs.value
      .filter(
        (job) =>
          job.subjectKey === selectedSubject.value &&
          job.status === 'DONE' &&
          job.artImageId,
      )
      .map((job) =>
        art.loadJobImage(job.artImageId!, job.updatedAt ?? '', true),
      ),
  )
}

async function refresh() {
  if (!canAccess.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await performFetch<{ jobs: DeepheartStyleJob[] }>(
      '/api/deepheart/style-check',
      {},
      1,
      30_000,
    )
    if (!result.success || !result.data)
      throw new Error(result.message || 'Could not read style ArtJobs.')
    jobs.value = result.data.jobs
    await loadSelectedImages()
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Art comparison unavailable.'
  } finally {
    loading.value = false
  }
  await refreshBibleArt()
}

function selectSubject(value: string) {
  selectedSubject.value = value
  void loadSelectedImages()
}

function scoreFor(lane: string) {
  return reviews.value[cellKey(lane)]?.score ?? 0
}

function noteFor(lane: string) {
  return reviews.value[cellKey(lane)]?.note ?? ''
}

function saveReviews() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(reviews.value))
  } catch {
    // Device storage is optional; the comparison remains usable.
  }
}

function setScore(lane: string, score: number) {
  const key = cellKey(lane)
  reviews.value = {
    ...reviews.value,
    [key]: { score, note: reviews.value[key]?.note ?? '' },
  }
  saveReviews()
}

function setNote(lane: string, note: string) {
  const key = cellKey(lane)
  reviews.value = {
    ...reviews.value,
    [key]: { score: reviews.value[key]?.score ?? 0, note: note.slice(0, 700) },
  }
  saveReviews()
}

onMounted(() => {
  try {
    const value = localStorage.getItem(storageKey)
    if (value) reviews.value = JSON.parse(value)
  } catch {
    reviews.value = {}
  }
})
watch(
  canAccess,
  (allowed) => {
    if (allowed) void refresh()
  },
  { immediate: true },
)
</script>
