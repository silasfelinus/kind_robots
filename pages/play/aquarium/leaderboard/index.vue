<!-- /pages/play/aquarium/leaderboard/index.vue
     Species-collected leaderboard (cthulhuquarium/t-018) -- unauthenticated,
     paginated, read-only. Backed by GET /api/aquarium/leaderboard
     (server/utils/aquarium.ts's getSpeciesLeaderboard). Ranked on distinct
     species collected, never coins -- see that function's own comment for
     why. Display name only, same consent boundary as /play/aquarium/browse:
     only players with at least one public tank are ranked. -->
<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-3xl space-y-5 px-3 py-5 sm:px-6 sm:py-8"
    >
      <nav class="flex items-center justify-between gap-3">
        <NuxtLink to="/play/aquarium" class="btn btn-ghost btn-sm rounded-xl">
          <Icon name="kind-icon:arrow-left" class="size-4" />
          Your tank
        </NuxtLink>
      </nav>

      <header
        class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-lg sm:p-7"
      >
        <p class="text-xs font-black uppercase tracking-[0.25em] text-primary">
          Cthulhuquarium
        </p>
        <h2 class="mt-1 text-3xl font-black uppercase sm:text-4xl">
          Leaderboard
        </h2>
        <p class="mt-2 max-w-2xl text-sm text-base-content/65">
          Ranked by species collected. Coins aren't scored here.
        </p>
      </header>

      <div
        v-if="loading && !entries.length"
        class="kr-panel-flat grid min-h-[40vh] place-items-center rounded-3xl"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="mt-3 text-sm font-bold text-base-content/55">
            Tallying specimens…
          </p>
        </div>
      </div>

      <div
        v-else-if="errorMessage && !entries.length"
        class="rounded-3xl border border-error/30 bg-error/10 p-8 text-center"
      >
        <Icon name="kind-icon:warning" class="mx-auto size-10 text-error" />
        <p class="mt-3 text-xl font-black">Could not load the leaderboard</p>
        <p class="mt-2 text-sm text-base-content/65">{{ errorMessage }}</p>
        <button class="btn btn-error btn-sm mt-5 rounded-xl" @click="load()">
          Try again
        </button>
      </div>

      <div
        v-else-if="!entries.length"
        class="kr-panel-flat border-dashed rounded-3xl px-6 py-16 text-center"
      >
        <Icon name="kind-icon:fish" class="mx-auto size-12 text-primary/40" />
        <h2 class="mt-4 text-2xl font-black uppercase">No ranks yet</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-base-content/60">
          Nobody with a public tank has collected a species yet.
        </p>
      </div>

      <template v-else>
        <ol class="flex flex-col gap-2">
          <li
            v-for="entry in entries"
            :key="entry.userId"
            class="flex items-center gap-3 kr-panel-flat p-3 shadow-sm"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-black"
            >
              {{ entry.rank }}
            </span>
            <div
              class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-base-300 bg-base-200"
            >
              <img
                v-if="entry.avatarImage"
                :src="normalizeImagePath(entry.avatarImage)"
                :alt="entry.username"
                class="h-full w-full object-cover"
              />
              <Icon
                v-else
                name="kind-icon:user"
                class="size-4 text-primary/60"
              />
            </div>
            <p class="min-w-0 flex-1 truncate text-sm font-bold">
              @{{ entry.username }}
            </p>
            <p class="shrink-0 text-sm font-black text-primary">
              {{ entry.speciesCollected }} species
            </p>
          </li>
        </ol>

        <div class="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="loading || skip <= 0"
            @click="prevPage"
          >
            <Icon name="kind-icon:arrow-left" class="size-4" />
            Higher ranks
          </button>
          <p class="text-xs font-bold text-base-content/50">
            {{ Math.min(skip + entries.length, total) }} of {{ total }}
          </p>
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="loading || skip + entries.length >= total"
            @click="nextPage"
          >
            Lower ranks
            <Icon name="kind-icon:arrow-right" class="size-4" />
          </button>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import type { PaginationMeta } from '@/types/api'

interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  avatarImage: string | null
  speciesCollected: number
}

const TAKE = 25

const entries = ref<LeaderboardEntry[]>([])
const total = ref(0)
const skip = ref(0)
const loading = ref(false)
const errorMessage = ref('')

useHead({ title: 'Leaderboard · Cthulhuquarium' })

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await performFetch<LeaderboardEntry[], PaginationMeta>(
      `/api/aquarium/leaderboard?take=${TAKE}&skip=${skip.value}`,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Could not load the leaderboard.')
    }
    entries.value = response.data
    total.value = response.meta?.total ?? response.data.length
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load the leaderboard.'
  } finally {
    loading.value = false
  }
}

function nextPage(): void {
  skip.value += TAKE
  void load()
}

function prevPage(): void {
  skip.value = Math.max(0, skip.value - TAKE)
  void load()
}

onMounted(load)
</script>
