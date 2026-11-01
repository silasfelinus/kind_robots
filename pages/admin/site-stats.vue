<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide @container p-4 md:p-6">
      <header-page-bar>
        <div
          class="flex min-w-0 flex-1 items-center justify-end gap-2 px-1"
          data-testid="site-stats-bar"
        >
          <div class="join" role="group" aria-label="Range">
            <button
              v-for="option in RANGES"
              :key="option"
              type="button"
              class="btn join-item btn-sm"
              :class="days === option ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="days === option"
              @click="pickRange(option)"
            >
              {{ option }}d
            </button>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square"
            aria-label="Refresh"
            :disabled="stats.loading"
            @click="load"
          >
            <span
              v-if="stats.loading"
              class="loading loading-spinner loading-xs"
            />
            <icon v-else name="kind-icon:refresh" class="size-4" />
          </button>
        </div>
      </header-page-bar>

      <p class="text-sm text-base-content/70">
        First-party daily counts · no cookies, IPs or user agents stored
      </p>

      <div v-if="!ready" class="grid min-h-64 place-items-center">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>
      <div
        v-else-if="!userStore.isAdmin"
        class="mt-6 rounded-2xl border border-error/50 p-8 text-center"
      >
        <p class="text-lg font-black">Administrator access required</p>
      </div>

      <template v-else>
        <p
          v-if="stats.error"
          class="mt-4 rounded-2xl border border-error/50 px-4 py-2 text-sm text-error"
        >
          {{ stats.error }}
        </p>

        <section
          class="mt-5 grid grid-cols-2 gap-3 @3xl:grid-cols-4"
          aria-label="Totals"
        >
          <div
            v-for="tile in tiles"
            :key="tile.label"
            class="rounded-2xl border border-base-content/10 bg-base-200/60 p-4"
          >
            <p
              class="text-xs font-bold uppercase tracking-[.16em] text-base-content/60"
            >
              {{ tile.label }}
            </p>
            <p class="mt-1 text-3xl font-black tabular-nums">
              {{ tile.value }}
            </p>
          </div>
        </section>

        <section
          class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/40 p-4"
          aria-label="Daily views and visits"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-black uppercase tracking-[.16em]">
              Daily views and visits
            </h2>
            <div class="flex items-center gap-4 text-xs text-base-content/70">
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-sm bg-primary" /> Views
              </span>
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-sm bg-secondary" /> Visits
              </span>
            </div>
          </div>
          <p class="mt-1 h-5 text-sm tabular-nums text-base-content/80">
            <template v-if="focusDay">
              <span class="font-bold">{{ dayLabel(focusDay.day) }}</span>
              · {{ focusDay.views.toLocaleString() }} views ·
              {{ focusDay.visits.toLocaleString() }} visits
            </template>
          </p>
          <div class="mt-2 flex gap-2">
            <div
              class="flex h-48 w-8 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-base-content/60"
            >
              <span>{{ chartMax.toLocaleString() }}</span>
              <span>0</span>
            </div>
            <div
              class="flex h-48 min-w-0 flex-1 items-end gap-px border-b border-base-content/20"
              @mouseleave="hoverIndex = null"
            >
              <div
                v-for="(day, index) in daily"
                :key="day.day"
                class="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center gap-px rounded-t-sm outline-none focus-visible:bg-base-content/10"
                :class="hoverIndex === index ? 'bg-base-content/10' : ''"
                tabindex="0"
                :aria-label="`${dayLabel(day.day)}: ${day.views} views, ${day.visits} visits`"
                @mouseenter="hoverIndex = index"
                @focus="hoverIndex = index"
              >
                <span
                  class="w-1/2 max-w-3 rounded-t bg-primary"
                  :style="{ height: barHeight(day.views) }"
                />
                <span
                  class="w-1/2 max-w-3 rounded-t bg-secondary"
                  :style="{ height: barHeight(day.visits) }"
                />
              </div>
            </div>
          </div>
          <div
            class="ml-10 mt-1 flex justify-between text-[10px] text-base-content/60"
          >
            <span>{{ daily[0] ? dayLabel(daily[0].day) : '' }}</span>
            <span>{{
              daily.length ? dayLabel(daily[daily.length - 1]!.day) : ''
            }}</span>
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer text-base-content/70">
              Daily table
            </summary>
            <table class="table table-xs mt-2">
              <thead>
                <tr>
                  <th>Day</th>
                  <th class="text-right">Views</th>
                  <th class="text-right">Visits</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in [...daily].reverse()" :key="day.day">
                  <td>{{ day.day }}</td>
                  <td class="text-right tabular-nums">{{ day.views }}</td>
                  <td class="text-right tabular-nums">{{ day.visits }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </section>

        <section class="mt-4 grid grid-cols-1 gap-3 @3xl:grid-cols-3">
          <div
            v-for="list in lists"
            :key="list.title"
            class="rounded-2xl border border-base-content/10 bg-base-200/40 p-4"
          >
            <h2 class="text-sm font-black uppercase tracking-[.16em]">
              {{ list.title }}
            </h2>
            <p
              v-if="!list.rows.length"
              class="mt-3 text-sm text-base-content/60"
            >
              {{ list.empty }}
            </p>
            <ol v-else class="mt-3 flex flex-col gap-1.5">
              <li
                v-for="row in list.rows"
                :key="row.key"
                class="relative overflow-hidden rounded-lg px-2 py-1"
              >
                <span
                  class="absolute inset-y-0 left-0 rounded-lg bg-primary/15"
                  :style="{ width: share(row.count, list.rows) }"
                />
                <span
                  class="relative flex items-center justify-between gap-3 text-sm"
                >
                  <span class="truncate font-mono" :title="row.key">{{
                    row.key
                  }}</span>
                  <span class="shrink-0 font-bold tabular-nums">{{
                    row.count.toLocaleString()
                  }}</span>
                </span>
              </li>
            </ol>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSiteStatsStore } from '~/stores/siteStatsStore'
import { useUserStore } from '~/stores/userStore'
import type { SiteStatRanked } from '~/utils/siteStats'

useHead({ title: 'Site Stats' })

const RANGES = [7, 30, 90] as const

const stats = useSiteStatsStore()
const userStore = useUserStore()
const ready = ref(false)
const days = ref<number>(30)
const hoverIndex = ref<number | null>(null)

const daily = computed(() => stats.summary?.daily ?? [])
const chartMax = computed(() =>
  Math.max(1, ...daily.value.map((day) => Math.max(day.views, day.visits))),
)
const focusDay = computed(() =>
  hoverIndex.value === null
    ? daily.value[daily.value.length - 1]
    : daily.value[hoverIndex.value],
)

const tiles = computed(() => {
  const totals = stats.summary?.totals ?? { views: 0, visits: 0, events: 0 }
  return [
    { label: 'Page views', value: totals.views.toLocaleString() },
    { label: 'Visits', value: totals.visits.toLocaleString() },
    { label: 'Events', value: totals.events.toLocaleString() },
    {
      label: 'Views per visit',
      value: totals.visits ? (totals.views / totals.visits).toFixed(1) : '–',
    },
  ]
})

const lists = computed(() => [
  {
    title: 'Top pages',
    rows: stats.summary?.topPaths ?? [],
    empty: 'No page views yet.',
  },
  {
    title: 'Top referrers',
    rows: stats.summary?.topReferrers ?? [],
    empty: 'No visits yet.',
  },
  {
    title: 'Top events',
    rows: stats.summary?.topEvents ?? [],
    empty: 'No events yet.',
  },
])

function barHeight(value: number): string {
  if (!value) return '0'
  return `max(2px, ${(value / chartMax.value) * 100}%)`
}

function share(count: number, rows: SiteStatRanked[]): string {
  const top = rows[0]?.count || 1
  return `${Math.round((count / top) * 100)}%`
}

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00.000Z`))
}

async function load() {
  hoverIndex.value = null
  await stats.fetchSummary(days.value)
}

async function pickRange(option: number) {
  days.value = option
  await load()
}

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await load()
})
</script>
