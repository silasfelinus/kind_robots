<!-- /components/watchlist/watchlist-browse.vue -->
<!--
  Browse/filter/stats UI for the Media Watchlist personal log
  (media-watchlist/t-009, t-010), wired to GET /api/media-entries and
  GET /api/media-entries/stats per conductor
  projects/media-watchlist/BROWSE-UX.md. Admin-only (this is Silas's private
  log) -- renders a locked notice for any non-admin viewer instead of erroring.
  Selecting an entry opens watchlist-entry-detail.vue (BROWSE-UX.md §3/§5).
  Export downloads GET /api/media-entries/export (media-watchlist/t-006,
  t-012), honoring the current search/year/type/starred/month/season/sort
  filters. The Year pill selector, Month multi-select, Season number filter
  (TV only), and the two extra stats tiles (comics read, TV seasons) close
  the BROWSE-UX.md §2/§4 gaps -- the API already computed/accepted this
  data, it just wasn't wired into the UI yet (media-watchlist/t-006, t-012).
  The "most active month" line (media-watchlist/t-013, BROWSE-UX.md §1) reuses
  the same stats.get.ts countByMonth breakdown that already powers the Month
  filter chips -- no backend change needed, just picking the max and naming it.
  "Recent entries" (media-watchlist/t-015, BROWSE-UX.md §1's last gap) is a
  fixed, unfiltered global view -- a separate GET /api/media-entries?take=10&
  sort=date_desc call that ignores the active search/year/type/starred/month/
  season state entirely, per that spec.
  "Year over year" (media-watchlist/t-006, BROWSE-UX.md §4's last gap) is a
  side-by-side per-year table (totals by media type, most-watched month),
  gated to 2+ years of data; rides along on the existing loadStats() call --
  stats.get.ts's new yearComparison field is unfiltered by the active year,
  same as the years list.
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
      <!-- Most active month (BROWSE-UX.md §1) -->
      <p
        v-if="mostActiveMonth"
        class="kr-panel-flat px-4 py-2 text-center text-sm font-semibold text-base-content/70"
      >
        You consumed the most in {{ mostActiveMonth.label }}:
        {{ mostActiveMonth.count }} entries
      </p>

      <!-- Recent entries (BROWSE-UX.md §1) -- fixed global view, no filters -->
      <div
        v-if="recentEntries.length"
        class="rounded-3xl border border-base-300 bg-base-100 p-4"
      >
        <p class="mb-2 text-xs font-semibold uppercase text-base-content/50">
          Recent entries
        </p>
        <ul class="flex flex-col gap-1">
          <li
            v-for="entry in recentEntries"
            :key="`recent-${entry.id}`"
            class="flex items-center gap-2 text-sm"
          >
            <Icon
              :name="MEDIA_TYPE_ICON[entry.mediaType]"
              class="size-3.5 shrink-0 text-base-content/50"
            />
            <span class="truncate font-semibold text-base-content">{{
              entry.title
            }}</span>
            <span class="ml-auto shrink-0 text-xs text-base-content/50">{{
              formatDate(entry)
            }}</span>
          </li>
        </ul>
      </div>

      <!-- Stats strip -->
      <div
        v-if="stats"
        class="grid grid-cols-2 gap-2 rounded-3xl border border-base-300 bg-base-100 p-4 sm:grid-cols-3 lg:grid-cols-6"
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
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            stats.comicIssuesRead
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >comics read</span
          >
        </div>
        <div
          class="flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center"
        >
          <span class="text-lg font-black text-base-content">{{
            stats.tvSeasonCount
          }}</span>
          <span class="text-xs font-semibold text-base-content/50"
            >TV seasons ({{ stats.tvShowCount }} shows)</span
          >
        </div>
      </div>

      <!-- Year-over-year comparison (BROWSE-UX.md §4) -->
      <div
        v-if="stats && showYearComparison"
        class="overflow-x-auto rounded-3xl border border-base-300 bg-base-100 p-4"
      >
        <p class="mb-2 text-xs font-semibold uppercase text-base-content/50">
          Year over year
        </p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="row in stats.yearComparison"
                :key="row.year"
                class="text-right"
              >
                {{ row.year }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="chip in MEDIA_TYPE_CHIPS" :key="chip.value">
              <td class="font-semibold text-base-content/70">
                {{ chip.label }}
              </td>
              <td
                v-for="row in stats.yearComparison"
                :key="row.year"
                class="text-right"
              >
                {{ countForChipGroup(row, chip.group) }}
              </td>
            </tr>
            <tr class="font-semibold">
              <td>Total</td>
              <td
                v-for="row in stats.yearComparison"
                :key="row.year"
                class="text-right"
              >
                {{ row.totalCount }}
              </td>
            </tr>
            <tr>
              <td class="font-semibold text-base-content/70">
                Most watched month
              </td>
              <td
                v-for="row in stats.yearComparison"
                :key="row.year"
                class="text-right"
              >
                {{
                  row.mostWatchedMonth
                    ? monthLabel(row.mostWatchedMonth.month)
                    : '—'
                }}
              </td>
            </tr>
          </tbody>
        </table>
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
          v-if="stats?.years.length"
          type="button"
          class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeYear === null
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="activeYear === null"
          @click="activeYear = null"
        >
          All years
        </button>
        <button
          v-for="yearOption in stats?.years ?? []"
          :key="yearOption"
          type="button"
          class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            activeYear === yearOption
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="activeYear === yearOption"
          @click="activeYear = activeYear === yearOption ? null : yearOption"
        >
          {{ yearOption }}
        </button>

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

        <div class="dropdown">
          <button
            type="button"
            tabindex="0"
            class="btn btn-sm gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="
              activeMonths.size
                ? 'btn-primary'
                : 'btn-ghost border border-base-300'
            "
            :aria-pressed="activeMonths.size > 0"
          >
            <Icon name="kind-icon:clock" class="size-3.5" />
            {{ activeMonths.size ? `Month (${activeMonths.size})` : 'Month' }}
          </button>
          <div
            tabindex="0"
            class="dropdown-content z-10 mt-1 grid grid-cols-4 gap-1 kr-panel-flat p-2 shadow-lg"
          >
            <button
              v-for="monthOption in MONTH_LABELS"
              :key="monthOption.value"
              type="button"
              class="btn btn-xs rounded-lg"
              :class="
                activeMonths.has(monthOption.value)
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :aria-pressed="activeMonths.has(monthOption.value)"
              @click="toggleMonth(monthOption.value)"
            >
              {{ monthOption.label }}
            </button>
          </div>
        </div>

        <label
          v-if="showSeasonFilter"
          class="flex items-center gap-1.5 text-xs font-semibold text-base-content/60"
        >
          Season
          <input
            v-model.number="season"
            type="number"
            min="1"
            max="99"
            placeholder="Any"
            aria-label="Season number (TV only)"
            class="input input-sm input-bordered w-16 rounded-xl"
          />
        </label>

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

        <button
          type="button"
          class="btn btn-ghost btn-sm ml-auto gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="exportCsv"
        >
          <Icon name="kind-icon:download" class="size-3.5" />
          Export CSV
        </button>
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
          class="flex min-h-32 items-center justify-center kr-panel-flat"
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

type YearComparisonRow = {
  year: number
  totalCount: number
  countByType: Record<string, number>
  mostWatchedMonth: { month: number; count: number } | null
}

type MediaEntryStats = {
  years: number[]
  totalCount: number
  starredCount: number
  countByMonth: Record<string, number>
  audiobookHours: number
  pagesRead: number
  comicIssuesRead: number
  tvShowCount: number
  tvSeasonCount: number
  yearComparison: YearComparisonRow[]
}

type MediaEntryStatsResponse = {
  success: boolean
  data: MediaEntryStats
}

// media-watchlist/t-016: every chip's `group` is the full set of MediaType
// values it filters for, so all 12 enum values are reachable from the Browse
// filters -- not just the 6 that get their own chip. Grouping mirrors the
// icon-sibling judgment calls in MEDIA_TYPE_ICON below (NOVELLA -> Books,
// ANIME -> TV, PODCAST -> Audiobooks, SHORT -> Movies, VIDEO_GAME_SHORT ->
// Games); THEATRE gets its own chip since it has no icon sibling.
const MEDIA_TYPE_CHIPS: {
  value: MediaType
  label: string
  group: MediaType[]
}[] = [
  { value: 'MOVIE', label: 'Movies', group: ['MOVIE', 'SHORT'] },
  { value: 'TV', label: 'TV', group: ['TV', 'ANIME'] },
  { value: 'BOOK', label: 'Books', group: ['BOOK', 'NOVELLA'] },
  { value: 'COMIC', label: 'Comics', group: ['COMIC'] },
  {
    value: 'AUDIOBOOK',
    label: 'Audiobooks',
    group: ['AUDIOBOOK', 'PODCAST'],
  },
  {
    value: 'VIDEO_GAME',
    label: 'Games',
    group: ['VIDEO_GAME', 'VIDEO_GAME_SHORT'],
  },
  { value: 'THEATRE', label: 'Theatre', group: ['THEATRE'] },
]

// Recent-entries grouping (media-watchlist/t-015, BROWSE-UX.md §1). Covers
// every MediaType (not just the MEDIA_TYPE_CHIPS subset), grouping the rarer
// types under the closest visual sibling since there's no dedicated icon:
// NOVELLA -> book, ANIME -> video (TV), PODCAST -> microphone (AUDIOBOOK),
// SHORT -> movie, VIDEO_GAME_SHORT -> dice (VIDEO_GAME).
const MEDIA_TYPE_ICON: Record<MediaType, string> = {
  MOVIE: 'kind-icon:movie',
  TV: 'kind-icon:video',
  BOOK: 'kind-icon:book',
  NOVELLA: 'kind-icon:book',
  AUDIOBOOK: 'kind-icon:microphone',
  COMIC: 'kind-icon:menu-book',
  VIDEO_GAME: 'kind-icon:dice',
  ANIME: 'kind-icon:video',
  PODCAST: 'kind-icon:microphone',
  THEATRE: 'kind-icon:theater',
  SHORT: 'kind-icon:movie',
  VIDEO_GAME_SHORT: 'kind-icon:dice',
}

const MONTH_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin === true)

const search = ref('')
const activeYear = ref<number | null>(null)
const activeTypes = ref<Set<MediaType>>(new Set())
const activeMonths = ref<Set<number>>(new Set())
const season = ref<number | null>(null)
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
const recentEntries = ref<MediaEntrySummary[]>([])

function monthLabel(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
  })
}

// BROWSE-UX.md §1: "Most active month: 'You consumed the most in [Month]: N
// entries'". countByMonth is keyed by month number as a string (1-12); pick
// the highest count and name it. No entry -> hide the line rather than
// showing a false "January: 0".
const mostActiveMonth = computed(() => {
  const counts = stats.value?.countByMonth
  if (!counts) return null
  let bestMonth: number | null = null
  let bestCount = 0
  for (const [monthKey, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count
      bestMonth = Number(monthKey)
    }
  }
  if (bestMonth === null) return null
  return { label: monthLabel(bestMonth), count: bestCount }
})

// Year-over-year comparison (BROWSE-UX.md §4) only makes sense with 2+ years
// of data to compare.
const showYearComparison = computed(
  () => (stats.value?.yearComparison.length ?? 0) >= 2,
)

const canShowMore = computed(() => entries.value.length < total.value)
const selectedEntry = computed(
  () => entries.value.find((entry) => entry.id === selectedId.value) ?? null,
)

// Season (BROWSE-UX.md §2) only applies to TV entries, so only show/send it
// when TV is the active filter or no type filter narrows the results away
// from TV at all.
const showSeasonFilter = computed(
  () => activeTypes.value.size === 0 || activeTypes.value.has('TV'),
)
watch(showSeasonFilter, (visible) => {
  if (!visible) season.value = null
})

function handleEntryUpdated(updated: MediaEntryDetail) {
  const index = entries.value.findIndex((entry) => entry.id === updated.id)
  if (index !== -1)
    entries.value[index] = { ...entries.value[index], ...updated }

  const recentIndex = recentEntries.value.findIndex(
    (entry) => entry.id === updated.id,
  )
  if (recentIndex !== -1) {
    recentEntries.value[recentIndex] = {
      ...recentEntries.value[recentIndex],
      ...updated,
    }
  }
}

// Sums a year-comparison row's per-type counts across a chip's full group
// (e.g. TV chip = TV + ANIME), same fold-in as expandActiveTypes() below.
function countForChipGroup(row: YearComparisonRow, group: MediaType[]): number {
  return group.reduce((sum, type) => sum + (row.countByType[type] ?? 0), 0)
}

function toggleType(type: MediaType) {
  const next = new Set(activeTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  activeTypes.value = next
}

// media-watchlist/t-016: activeTypes stores chip values (e.g. 'TV'), but each
// chip's group can cover more than one MediaType (e.g. TV + ANIME) -- expand
// before sending to the API so a folded-in sibling type is actually matched.
const CHIP_GROUP_BY_VALUE = new Map(
  MEDIA_TYPE_CHIPS.map((chip) => [chip.value, chip.group]),
)
function expandActiveTypes(active: Set<MediaType>): MediaType[] {
  const expanded = new Set<MediaType>()
  for (const value of active) {
    for (const type of CHIP_GROUP_BY_VALUE.get(value) ?? [value]) {
      expanded.add(type)
    }
  }
  return Array.from(expanded)
}

function toggleMonth(month: number) {
  const next = new Set(activeMonths.value)
  if (next.has(month)) next.delete(month)
  else next.add(month)
  activeMonths.value = next
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
    const res = await $fetch<MediaEntryStatsResponse, string>(
      '/api/media-entries/stats',
      { query: { year: activeYear.value || undefined } },
    )
    if (res?.success) stats.value = res.data
  } catch {
    /* stats strip is non-critical; leave it hidden on failure */
  }
}

// Fixed global view (BROWSE-UX.md §1) -- intentionally ignores the active
// search/year/type/starred/month/season filters, unlike loadEntries().
async function loadRecentEntries(): Promise<void> {
  try {
    const res = await $fetch<MediaEntriesResponse, string>(
      '/api/media-entries',
      { query: { take: 10, sort: 'date_desc' } },
    )
    if (res?.success) recentEntries.value = res.data
  } catch {
    /* recent-entries strip is non-critical; leave it hidden on failure */
  }
}

async function loadEntries(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch<MediaEntriesResponse, string>(
      '/api/media-entries',
      {
        query: {
          search: search.value || undefined,
          year: activeYear.value || undefined,
          mediaType: activeTypes.value.size
            ? expandActiveTypes(activeTypes.value).join(',')
            : undefined,
          starred: starredOnly.value ? 'true' : undefined,
          month: activeMonths.value.size
            ? Array.from(activeMonths.value)
                .sort((a, b) => a - b)
                .join(',')
            : undefined,
          season:
            showSeasonFilter.value && season.value ? season.value : undefined,
          sort: sort.value,
          take,
          skip: skip.value,
        },
      },
    )

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

watch([activeTypes, starredOnly, sort, activeMonths, season], () => {
  skip.value = 0
  void loadEntries()
})

// Year is the one filter the Stats strip itself also respects (BROWSE-UX.md
// §4's "year switcher"), so changing it reloads both entries and stats.
watch(activeYear, () => {
  skip.value = 0
  void loadEntries()
  void loadStats()
})

function showMore() {
  skip.value += take
  void loadEntries()
}

function exportCsv() {
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (activeYear.value) params.set('year', String(activeYear.value))
  if (activeTypes.value.size) {
    params.set('mediaType', expandActiveTypes(activeTypes.value).join(','))
  }
  if (starredOnly.value) params.set('starred', 'true')
  if (activeMonths.value.size) {
    params.set(
      'month',
      Array.from(activeMonths.value)
        .sort((a, b) => a - b)
        .join(','),
    )
  }
  if (showSeasonFilter.value && season.value) {
    params.set('season', String(season.value))
  }
  params.set('sort', sort.value)

  const link = document.createElement('a')
  link.href = `/api/media-entries/export?${params.toString()}`
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

onMounted(() => {
  if (!isAdmin.value) return
  void loadStats()
  void loadEntries()
  void loadRecentEntries()
})
</script>
