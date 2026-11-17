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
                  <strong class="block truncate text-sm">{{ lane.title }}</strong>
                  <small class="block text-xs opacity-70">{{ lane.tone }}</small>
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
                  {{ jobFor(lane.key) ? 'Waiting for render' : 'No accepted ArtJob' }}
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
          Fifty playable identities. Each can lead or accompany the party.
          Visual species and body descriptions live in these private art briefs,
          not in the character names, dialogue or player-facing biography.
        </p>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="person in CHARACTERS"
            :key="person.id"
            class="rounded-xl border border-base-content/15 bg-base-200 p-3"
          >
            <div class="flex items-start gap-3">
              <DeepheartPortrait :id="person.id" size="sm" class="w-20 shrink-0" />
              <div class="min-w-0">
                <h3 class="font-bold">{{ person.name }}</h3>
                <p class="text-xs opacity-70">
                  {{ ROLES[person.role].label }} ·
                  {{ person.gender === 'w' ? 'she/her' : person.gender === 'm' ? 'he/him' : 'they/them' }}
                </p>
                <p class="mt-1 text-xs">{{ person.blurb }}</p>
              </div>
            </div>
            <details class="mt-2 text-xs">
              <summary class="cursor-pointer font-semibold">
                Private visual art prompt
              </summary>
              <p class="mt-2 leading-relaxed">{{ ANTHRO_LOOK[person.id] }}</p>
            </details>
          </article>
        </div>
      </section>

      <section
        v-else
        class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3"
        aria-label="Art direction canon"
      >
        <div class="mx-auto grid max-w-4xl gap-4 text-sm md:grid-cols-2">
          <article class="rounded-xl bg-base-200 p-4">
            <h2 class="mb-2 text-lg font-bold">Animation, not live action</h2>
            <p>
              Bold expressive western-animation silhouettes, cel shadows,
              painterly backgrounds and grown-up cinematic lighting. Bright
              personalities in a dark, dangerous world. Dynamic posing matters
              more than prettified anatomy.
            </p>
          </article>
          <article class="rounded-xl bg-base-200 p-4">
            <h2 class="mb-2 text-lg font-bold">Every person is an animal person</h2>
            <p>
              Mammals, birds, reptiles, amphibians and insects share this
              world. Distinct snouts, muzzles, ears, scales, feathers, tails,
              wings and different body builds. The illustrated species belongs
              in prompts. On screen: Oona the Guardian, Vex the Rogue.
            </p>
          </article>
          <article class="rounded-xl bg-base-200 p-4">
            <h2 class="mb-2 text-lg font-bold">Violence with consequences</h2>
            <p>
              These are fighters entering genuinely threatening crypts.
              Injuries, scuffed armour, monstrous teeth and rich shadow
              belong here. Avoid toy-like chibi proportions and frictionless
              heroic poses.
            </p>
          </article>
          <article class="rounded-xl bg-base-200 p-4">
            <h2 class="mb-2 text-lg font-bold">Tenderness, carefully staged</h2>
            <p>
              The waterfall trial depicts two clearly adult, established
              partners. They share an affectionate bathing moment while
              waterfall spray, mist, water and foreground stone obscure
              private anatomy. This is romance, not explicit erotica.
            </p>
          </article>
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
      <img :src="zoomSrc" alt="Selected Deepheart art comparison" class="max-h-[86vh] max-w-full object-contain" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtJobStore } from '~/stores/artJobStore'
import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import { ANTHRO_LOOK } from '~/utils/deepheart/anthro'
import { CHARACTERS, ROLES } from '~/utils/deepheart/roster'
import {
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
  { key: 'canon', label: 'World & style' },
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
  () => jobs.value.filter((job) => job.status === 'DONE' && job.artImageId).length,
)
type Review = { score: number; note: string }
const reviews = ref<Record<string, Review>>({})
const storageKey = 'deepheart-anthro-style-trial-2026-11-16'

function cellKey(lane: string) {
  return selectedSubject.value + ':' + lane
}

function jobFor(lane: string) {
  return (
    jobs.value.find(
      (job) =>
        job.subjectKey === selectedSubject.value && job.laneKey === lane,
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
        art.loadJobImage(
          job.artImageId!,
          job.updatedAt ?? '',
          true,
        ),
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
watch(canAccess, (allowed) => {
  if (allowed) void refresh()
}, { immediate: true })
</script>
