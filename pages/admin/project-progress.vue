<template>
  <main class="kr-surface flex h-full min-h-0 flex-col overflow-hidden">
    <header-page-bar>
      <div class="flex flex-wrap items-center gap-2">
        <strong class="text-sm font-black">Project progress</strong>
        <label class="text-xs">
          Timeframe
          <select v-model.number="days" class="select select-xs">
            <option v-for="day in ranges" :key="day" :value="day">
              {{ day }} days
            </option>
          </select>
        </label>
        <label class="text-xs">
          Project
          <select v-model="selected" class="select select-xs max-w-48">
            <option value="">All projects</option>
            <option v-for="slug in slugs" :key="slug" :value="slug">
              {{ name(slug) }}
            </option>
          </select>
        </label>
        <button class="kr-btn-xs btn-outline" @click="refresh">Refresh</button>
      </div>
    </header-page-bar>
    <div v-if="!ready || store.historyPending" class="p-6 text-center">
      Loading committed history…
    </div>
    <div v-else-if="!userStore.isAdmin" class="p-6 text-center">
      Administrators only.
    </div>
    <div v-else-if="store.historyError || !history" class="p-6 text-center">
      {{ store.historyError || 'No historical projection has been synced yet.' }}
    </div>
    <div v-else class="kr-scroll min-h-0 flex-1 overflow-auto p-3">
      <p class="mb-3 text-sm opacity-75">
        Committed finite tasks completed / total. Pacific dates; latest day
        may be partial. Scope changes can lower percentages. Gaps are missing
        history, not zero. Source: {{ history.sourceCommitSha.slice(0, 12) }}.
      </p>
      <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="row in rows"
          :key="row.slug"
          class="kr-panel min-w-0 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <button
              class="text-left text-sm font-black"
              @click="selected = row.slug"
            >
              {{ name(row.slug) }}
            </button>
            <span class="kr-badge-outline text-xs">
              {{ row.delta === null ? 'Unknown' : row.delta > 0 ? '+' + row.delta + ' done' : row.delta < 0 ? row.delta + ' done' : 'No net change' }}
            </span>
          </div>
          <p class="text-xs opacity-70">
            {{ row.last ? row.last.done + ' / ' + row.last.total + ' tasks done' : 'Latest snapshot unavailable' }}
          </p>
          <div
            class="mt-2 flex h-24 items-end gap-px rounded-lg bg-base-300/30 p-1"
            role="img"
            :aria-label="name(row.slug) + ' completion history'"
          >
            <div
              v-for="(point, i) in row.points"
              :key="dates[i]"
              class="relative flex h-full min-w-0 flex-1 items-end"
              :title="dates[i] + ': ' + (point ? point.done + '/' + point.total : 'missing')"
            >
              <div
                v-if="progressPercent(point) !== null"
                class="w-full rounded-t-sm bg-primary"
                :style="{ height: Math.max(2, progressPercent(point) ?? 0) + '%' }"
              />
              <div v-else class="h-1 w-full bg-base-content/20" />
            </div>
          </div>
          <div class="flex justify-between text-[10px] opacity-70">
            <span>{{ dates[0] }}</span>
            <span>{{ dates[dates.length - 1] }}</span>
          </div>
          <p v-if="row.delta === 0 && row.last && row.last.done < row.last.total" class="mt-1 text-xs text-warning">
            Unfinished; no net completed-task movement in this window.
          </p>
          <details v-if="selected" class="mt-2 text-xs">
            <summary class="cursor-pointer">Daily values</summary>
            <div v-for="(point, i) in row.points" :key="dates[i]" class="flex justify-between">
              <span>{{ dates[i] }}</span>
              <span>{{ point ? point.done + '/' + point.total : 'Unavailable' }}</span>
            </div>
          </details>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import { useUserStore } from '@/stores/userStore'
import {
  completedDelta,
  progressPercent,
} from '@/utils/projectProgressHistory'

const store = useConductorStore()
const userStore = useUserStore()
const ready = ref(false)
const ranges = [7, 14, 30, 90]
const days = ref(14)
const selected = ref('')
const history = computed(() => store.progressHistory)
const slugs = computed(() => Object.keys(history.value?.series ?? {}).sort())
const dates = computed(() => history.value?.dates.slice(-(days.value + 1)) ?? [])

function name(slug: string): string {
  return slug.replaceAll('-', ' ')
}

const rows = computed(() =>
  slugs.value
    .filter((slug) => !selected.value || slug === selected.value)
    .map((slug) => {
      const points = history.value?.series[slug]?.slice(-(days.value + 1)) ?? []
      return {
        slug,
        points,
        delta: completedDelta(points),
        last: points[points.length - 1] ?? null,
      }
    })
    .sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity)),
)

async function refresh(): Promise<void> {
  if (userStore.isAdmin) await store.fetchProgressHistory()
}

onMounted(async () => {
  await userStore.initialize()
  await refresh()
  ready.value = true
})
</script>
