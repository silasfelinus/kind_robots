<!-- /components/watchlist/watchlist-browse.vue -->
<!--
  Browse/filter/stats UI for the Media Watchlist personal log
  (media-watchlist/t-009, t-010), wired to GET /api/media-entries and
  GET /api/media-entries/stats per conductor
  projects/media-watchlist/BROWSE-UX.md. Admin-only (this is Silas's private
  log) -- renders a locked notice for any non-admin viewer instead of erroring.
  Selecting an entry opens watchlist-entry-detail.vue (BROWSE-UX.md §3/§5).
  The Stats view's CSV export (§4) is a separate, smaller follow-on -- still
  out of scope here.
-->
<template>
  <section class="flex flex-col gap-4">
    <div
      v-if="!isAdmin"
      class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
    >
      <Icon name="kind-icon:lock" class="mx-auto size-8 text-base-content/30" />
      <p class="mt-2 text-sm font-semibold text-base-content/60">
        This is a private personal log. Sign in as an admin to browse it.
      </p>
    </div>

    <template v-else>
      <!-- Stats strip -->
      <div
        v-if="stats"
        class="grid grid-cols-2 gap-2 rounded-3xl border border-base-300 bg-base-100 p-4 sm:grid-cols-4"
      >
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            stats.totalCount
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >entries</span
          >
        </div>
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            stats.starredCount
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >starred</span
          >
        </div>
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            Math.round(stats.audiobookHours)
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >audiobook hrs</span
          >
        </div>
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            stats.pagesRead
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >pages read</span
          >
        </div>
      </div>

      <!-- Filters -->
      <div
        class="flex flex-wrap items-center gap-2 rounded-3xl border border-base-300 bg-base-100 p-3"
      >
        <input
          v-model="search"
          type="search"
          placeholder="Search title or author…"
          class="input input-sm input-bordered w-full rounded-xl sm:w-56"
        />

        <button
          v-for="type in MEDIA_TYPE_CHIPS"
          :key="type.value"
          type="button"
          class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeTypes.has(type.value)
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="activeTypes.has(type.value)"
          @click="toggleType(type.value)"
        >
          {{ type.label }}
        </button>

        <button
          type="button"
          class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            starredOnly ? 'btn-primary' : 'btn-ghost border border-base-300'
          "
          :aria-pressed="starredOnly"
          @click="starredOnly = !starredOnly"
        >
          <Icon name="kind-icon:star" class="size-3.5" />
          Starred
        </button>

        <select
          v-model="sort"
          class="select select-sm select-bordered rounded-xl"
          aria-label="Sort order"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="title_asc">Title A–Z</option>
          <option value="title_desc">Title Z–A</option>
          <option value="starred_first">Starred first</option>
        </select>
      </div>

      <!-- Results -->
      <div aria-live="polite" aria-atomic="true">
        <div
          v-if="errorMessage"
          class="rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {{ errorMessage }}
        </div>

        <div
          v-else-if="isLoading && !entries.length"
          class="flex min-h-32 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
        >
          <span class="loading loading-spinner loading-md text-primary" />
          <span class="sr-only">Loading entries…</span>
        </div>

        <div
          v-else-if="!entries.length"
          class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center"
        >
          <Icon
            name="kind-icon:movie"
            class="mx-auto size-10 text-base-content/25"
          />
          <p class="mt-2 font-black">No entries found</p>
          <p class="mt-1 text-sm text-base-content/55">
            Try adjusting your filters.
          </p>
        </div>
      </div>

      <watchlist-entry-detail
        v-if="selectedEntry"
        :key="`detail-${selectedEntry.id}`"
        :entry="selectedEntry"
        @updated="handleEntryUpdated"
      >
        <template #close>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="selectedId = null"
          >
            <Icon name="kind-icon:close" class="size-4" />
          </button>
        </template>
      </watchlist-entry-detail>

      <ul v-if="!errorMessage && entries.length" class="flex flex-col gap-1.5">
        <li v-for="entry in entries" :key="entry.id">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-2xl border bg-base-100 px-4 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="
              selectedId === entry.id
                ? 'border-primary'
                : 'border-base-300 hover:border-base-content/20'
            "
            :aria-pressed="selectedId === entry.id"
            @click="selectedId = selectedId === entry.id ? null : entry.id"
          >
            <div class="flex min-w-0 items-center gap-2">
              <Icon
                v-if="entry.starred"
                name="kind-icon:star"
                class="size-3.5 shrink-0 text-warning"
              />
              <span class="truncate text-sm font-semibold text-base-content">{{
                entry.title
              }}</span>
            </div>
            <div
              class="flex shrink-0 items-center gap-2 text-xs text-base-content/50"
            >
              <span
                v-if="entry.rating"
                class="badge badge-warning badge-sm gap-0.5 rounded-lg"
              >
                <Icon name="kind-icon:star" class="size-3" />{{ entry.rating }}
              </span>
              <span class="badge badge-ghost badge-sm rounded-lg">{{
                entry.mediaType
              }}</span>
              <span>{{ formatDate(entry) }}</span>
            </div>
          </button>
        </li>
      </ul>

      <div v-if="canShowMore" class="flex justify-center">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :disabled="isLoading"
          @click="showMore"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          Show more
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import type { MediaType } from '~/prisma/generated/prisma/client'
import type { MediaEntryDetail } from './watchlist-entry-detail.vue'

// The list/browse endpoint returns the full MediaEntry row (no `select`
// clause), so every field the detail panel needs (review, rating, external
// links, ...) is already present on each entry -- the detail panel reuses
// this same type rather than requiring a second per-entry fetch.
type MediaEntrySummary = MediaEntryDetail

type MediaEntriesResponse = {
  success: boolean
  data: MediaEntrySummary[]
  count: number
  total: number
}

type MediaEntryStats = {
  totalCount: number
  starredCount: number
  audiobookHours: number
  pagesRead: number
}

type MediaEntryStatsResponse = {
  success: boolean
  data: MediaEntryStats
}

const MEDIA_TYPE_CHIPS: { value: MediaType; label: string }[] = [
  { value: 'MOVIE', label: 'Movies' },
  { value: 'TV', label: 'TV' },
  { value: 'BOOK', label: 'Books' },
  { value: 'COMIC', label: 'Comics' },
  { value: 'AUDIOBOOK', label: 'Audiobooks' },
  { value: 'VIDEO_GAME', label: 'Games' },
]

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin === true)

const search = ref('')
const activeTypes = ref<Set<MediaType>>(new Set())
const starredOnly = ref(false)
const sort = ref<
  'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'starred_first'
>('date_desc')
const take = 50
const skip = ref(0)

const entries = ref<MediaEntrySummary[]>([])
const total = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const stats = ref<MediaEntryStats | null>(null)
const selectedId = ref<number | null>(null)

const canShowMore = computed(() => entries.value.length < total.value)
const selectedEntry = computed(
  () => entries.value.find((entry) => entry.id === selectedId.value) ?? null,
)

function handleEntryUpdated(updated: MediaEntryDetail) {
  const index = entries.value.findIndex((entry) => entry.id === updated.id)
  if (index !== -1)
    entries.value[index] = { ...entries.value[index], ...updated }
}

function toggleType(type: MediaType) {
  const next = new Set(activeTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  activeTypes.value = next
}

function formatDate(entry: MediaEntrySummary): string {
  if (!entry.watchedMonth) return 'Date unknown'
  const month = new Date(2000, entry.watchedMonth - 1, 1).toLocaleString(
    'en-US',
    { month: 'short' },
  )
  return entry.watchedDay ? `${month} ${entry.watchedDay}` : month
}

async function loadStats(): Promise<void> {
  try {
    const res = await $fetch<MediaEntryStatsResponse>(
      '/api/media-entries/stats',
    )
    if (res?.success) stats.value = res.data
  } catch {
    /* stats strip is non-critical; leave it hidden on failure */
  }
}

async function loadEntries(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch<MediaEntriesResponse>('/api/media-entries', {
      query: {
        search: search.value || undefined,
        mediaType: activeTypes.value.size
          ? Array.from(activeTypes.value).join(',')
          : undefined,
        starred: starredOnly.value ? 'true' : undefined,
        sort: sort.value,
        take,
        skip: skip.value,
      },
    })

    if (!res?.success) {
      throw new Error('Failed to load the watchlist.')
    }

    entries.value =
      skip.value === 0 ? res.data : [...entries.value, ...res.data]
    total.value = res.total
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to load the watchlist.'
  } finally {
    isLoading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    skip.value = 0
    void loadEntries()
  }, 300)
})

watch([activeTypes, starredOnly, sort], () => {
  skip.value = 0
  void loadEntries()
})

function showMore() {
  skip.value += take
  void loadEntries()
}

onMounted(() => {
  if (!isAdmin.value) return
  void loadStats()
  void loadEntries()
})
</script>
