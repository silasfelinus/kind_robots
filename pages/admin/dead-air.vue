<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-testid="dead-air-private-cinema"
  >
    <header-page-bar>
      <div class="flex min-w-0 items-center gap-2 overflow-x-auto py-1">
        <strong class="shrink-0 text-sm font-black tracking-[.14em]">
          DEAD AIR
        </strong>
        <span class="kr-badge-outline shrink-0 text-xs">Private cinema</span>
        <span v-if="userStore.isAdmin" class="kr-text-dim-xs shrink-0">
          {{ films.length }} transmissions
        </span>
        <span class="flex-1" />
        <NuxtLink
          to="/play/video-generator?studio=music"
          class="kr-btn-xs btn-ghost shrink-0"
        >
          Video Studio
        </NuxtLink>
        <button
          v-if="userStore.isAdmin"
          type="button"
          class="kr-btn-xs btn-outline shrink-0"
          :disabled="store.loading"
          @click="refresh"
        >
          {{ store.loading ? 'Checking…' : 'Refresh' }}
        </button>
      </div>
    </header-page-bar>

    <div v-if="!ready" class="grid min-h-0 flex-1 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="kr-panel grid min-h-0 flex-1 place-items-center p-6 text-center"
    >
      This private screening room is available to administrators only.
    </div>
    <div
      v-else
      class="grid min-h-0 flex-1 gap-2 overflow-hidden p-2 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]"
    >
      <aside
        class="kr-panel kr-scroll min-h-0 overflow-y-auto p-2"
        aria-label="Dead Air private film archive"
      >
        <p class="mb-2 text-xs font-black uppercase tracking-wider opacity-65">
          Archive · newest first
        </p>
        <p v-if="store.error" role="alert" class="text-sm text-error">
          {{ store.error }}
        </p>
        <p v-if="!films.length" class="kr-text-dim-sm p-4 text-center">
          No private Dead Air broadcasts found. Films appear here after the
          producer creates a saved MusicVideo.
        </p>
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <button
            v-for="film in films"
            :key="film.id"
            type="button"
            class="flex min-w-0 gap-2 rounded-xl border p-2 text-left transition-colors"
            :class="
              selected?.id === film.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100/70 hover:border-primary/50'
            "
            :aria-pressed="selected?.id === film.id"
            :data-testid="'dead-air-film-' + film.id"
            @click="selectFilm(film.id)"
          >
            <div
              class="relative aspect-video w-[42%] shrink-0 overflow-hidden rounded-lg bg-neutral"
            >
              <img
                v-if="film.hasFinal && !posterFailures[film.id]"
                :src="store.posterUrl(film.id)"
                :alt="'Poster for ' + film.title"
                class="h-full w-full object-cover"
                loading="lazy"
                @error="posterFailures[film.id] = true"
              />
              <div
                v-else
                class="grid h-full place-items-center text-xl text-neutral-content"
                aria-hidden="true"
              >
                ◉
              </div>
            </div>
            <span class="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <strong class="line-clamp-2 text-sm leading-tight">
                {{ displayTitle(film.title) }}
              </strong>
              <small class="text-[11px] opacity-70">
                #{{ film.id }} · {{ dateLabel(film.createdAt) }}
              </small>
              <span class="flex flex-wrap gap-1">
                <span class="kr-badge-outline text-[10px]">
                  {{ film.hasFinal ? 'Final cut' : 'Rendering / draft' }}
                </span>
                <span class="kr-badge-outline text-[10px]">
                  {{ film.isPublic ? 'Public' : 'Private' }}
                </span>
              </span>
            </span>
          </button>
        </div>
      </aside>

      <section
        v-if="!selected"
        class="kr-panel grid min-h-0 place-items-center p-8 text-center"
      >
        <span class="kr-text-dim-sm">
          Select a private broadcast to screen and review it.
        </span>
      </section>
      <section
        v-else
        class="kr-scroll flex min-h-0 flex-col gap-2 overflow-y-auto"
        aria-label="Selected Dead Air screening"
      >
        <div class="kr-panel overflow-hidden p-2">
          <div class="relative mx-auto aspect-video max-h-[min(55vh,36rem)] w-full bg-black">
            <video
              v-if="selectedSummary?.hasFinal"
              :key="selected.id"
              :src="store.videoUrl(selected.id)"
              :poster="store.posterUrl(selected.id)"
              class="absolute inset-0 h-full w-full object-contain"
              controls
              playsinline
              preload="metadata"
              :aria-label="selected.title"
            />
            <div
              v-else
              class="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral via-base-300 to-neutral p-6 text-center"
            >
              <div>
                <strong class="text-lg">No verified final MP4 yet</strong>
                <p class="mt-2 text-sm opacity-75">
                  Production can be queued, rendering, or awaiting recovery.
                  Shot evidence and review notes remain available below.
                </p>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 px-1 pt-2">
            <h1 class="min-w-0 flex-1 truncate text-base font-black">
              {{ displayTitle(selected.title) }}
            </h1>
            <span class="kr-badge-outline text-xs">
              {{ selected.isPublic ? 'Public recording' : 'Private draft' }}
            </span>
            <span class="kr-badge-outline text-xs">{{ selected.status }}</span>
            <span class="kr-badge-outline text-xs">
              {{ selected.doc.scenes.length }} shots
            </span>
            <NuxtLink
              :to="{
                path: '/play/video-generator',
                query: { studio: 'music', video: String(selected.id) },
              }"
              class="kr-btn-xs btn-outline"
            >
              Open timeline
            </NuxtLink>
          </div>
        </div>

        <form
          class="kr-panel flex flex-wrap items-end gap-2 p-3"
          aria-label="Private editorial review"
          @submit.prevent="saveReview"
        >
          <div class="min-w-[12rem] flex-1">
            <p class="text-xs font-black uppercase tracking-wider">
              Editorial verdict
            </p>
            <div class="mt-1 flex gap-1" role="group" aria-label="Film review verdict">
              <button
                v-for="option in verdictOptions"
                :key="option.value"
                type="button"
                class="kr-btn-xs"
                :class="verdict === option.value ? 'btn-primary' : 'btn-outline'"
                :aria-pressed="verdict === option.value"
                @click="verdict = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <label class="min-w-[12rem] flex-[2] text-xs">
            Notes for the next private cut
            <textarea
              v-model="notes"
              maxlength="2000"
              rows="2"
              class="textarea textarea-bordered mt-1 min-h-14 w-full text-sm"
              placeholder="What landed, what to change, and what should never be lost"
            />
          </label>
          <button
            type="submit"
            class="kr-btn-xs btn-primary shrink-0"
            :disabled="store.saving"
          >
            {{ store.saving ? 'Saving…' : 'Save review' }}
          </button>
          <p
            v-if="reviewNotice"
            class="w-full text-xs"
            role="status"
          >
            {{ reviewNotice }}
          </p>
          <p v-if="store.error" class="w-full text-xs text-error" role="alert">
            {{ store.error }}
          </p>
          <p class="w-full text-[11px] opacity-65">
            Keep, Revise and Reject record private editorial feedback only.
            None of these choices publishes, deletes or changes film visibility.
          </p>
        </form>

        <details class="kr-panel min-h-0 p-3" data-testid="dead-air-shot-credits">
          <summary class="cursor-pointer text-sm font-bold">
            Shot credits, prompts and production evidence
          </summary>
          <p class="mt-2 text-xs opacity-70">
            Exact scene IDs, saved prompts and ArtJob IDs come from this film's
            owned production document. References and rights notes remain in
            the Conductor authored storyboard archive.
          </p>
          <ol class="mt-2 grid gap-2 lg:grid-cols-2">
            <li
              v-for="shot in selected.doc.scenes"
              :key="shot.id"
              class="min-w-0 rounded-lg border border-base-300 bg-base-100/70 p-3 text-xs"
            >
              <div class="flex flex-wrap items-center gap-2">
                <strong class="font-black">{{ shot.id }}</strong>
                <span class="opacity-70">
                  {{ shot.startSec }}–{{ shot.endSec }}s
                </span>
                <span class="kr-badge-outline">
                  {{ shot.motion.kind }}
                </span>
              </div>
              <p class="mt-2 leading-relaxed">{{ shot.prompt }}</p>
              <p v-if="shot.motionPrompt" class="mt-2 italic opacity-75">
                Movement: {{ shot.motionPrompt }}
              </p>
              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 opacity-80">
                <span v-if="shot.image.jobId">
                  Still ArtJob #{{ shot.image.jobId }}
                </span>
                <span v-if="shot.image.artImageId">
                  Still ArtImage #{{ shot.image.artImageId }}
                </span>
                <span v-if="shot.motion.jobId">
                  Motion ArtJob #{{ shot.motion.jobId }}
                </span>
                <span v-if="shot.motion.clipArtImageId">
                  Clip ArtImage #{{ shot.motion.clipArtImageId }}
                </span>
                <span v-if="store.sceneStatuses[shot.id]?.error" class="text-error">
                  {{ store.sceneStatuses[shot.id]?.error }}
                </span>
                <span
                  v-if="store.sceneStatuses[shot.id]?.status"
                  class="kr-badge-outline"
                >
                  {{ store.sceneStatuses[shot.id]?.status }}
                </span>
              </div>
            </li>
          </ol>
          <div class="mt-3 flex flex-wrap gap-3 text-xs">
            <a
              href="https://github.com/silasfelinus/conductor/tree/main/projects/dead-air/episodes"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary"
            >
              Authored storyboards &amp; cultural references
            </a>
            <a
              href="https://github.com/silasfelinus/conductor/blob/main/projects/dead-air/production-state.json"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary"
            >
              Private render and quality ledger
            </a>
          </div>
        </details>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'
import type { MusicVideoReviewVerdict } from '@/utils/musicVideoDoc'

const store = useMusicVideoStore()
const userStore = useUserStore()
const ready = ref(false)
const verdict = ref<MusicVideoReviewVerdict>('revise')
const notes = ref('')
const reviewNotice = ref('')
const posterFailures = reactive<Record<number, boolean>>({})
const verdictOptions = [
  { value: 'keep', label: 'Keep' },
  { value: 'revise', label: 'Revise' },
  { value: 'reject', label: 'Reject' },
] as const

const films = computed(() =>
  store.videos.filter(
    (video) => video.isOwner && video.title.startsWith('Dead Air:'),
  ),
)
const selected = computed(() =>
  store.current && films.value.some((video) => video.id === store.current?.id)
    ? store.current
    : null,
)
const selectedSummary = computed(
  () => films.value.find((film) => film.id === selected.value?.id) ?? null,
)

function displayTitle(title: string): string {
  return title.replace(/^Dead Air:\s*/, '')
}

function dateLabel(value: string): string {
  return value.slice(0, 10)
}

async function selectFilm(id: number): Promise<void> {
  if (!films.value.some((film) => film.id === id)) return
  reviewNotice.value = ''
  await store.select(id)
}

async function refresh(): Promise<void> {
  const currentId = selected.value?.id
  await store.loadList('dead-air')
  if (currentId && films.value.some((film) => film.id === currentId)) {
    await selectFilm(currentId)
  } else if (films.value.length) {
    await selectFilm(films.value[0]!.id)
  } else {
    store.close()
  }
}

async function saveReview(): Promise<void> {
  if (!selected.value || !userStore.isAdmin) return
  const saved = await store.savePrivateReview(verdict.value, notes.value)
  reviewNotice.value = saved
    ? 'Private review saved. Publication and deletion remain unchanged.'
    : 'Could not save this review. The film was not changed.'
}

watch(
  () => store.current?.doc.review,
  (review) => {
    verdict.value = review?.verdict ?? 'revise'
    notes.value = review?.notes ?? ''
    reviewNotice.value = ''
  },
  { immediate: true },
)

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    await refresh()
    store.startWatching()
  }
  ready.value = true
})

onBeforeUnmount(() => {
  store.stopWatching()
  store.close()
})
</script>
