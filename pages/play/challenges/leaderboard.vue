<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-7xl space-y-5 px-3 py-5 sm:px-6 sm:py-8"
    >
      <nav class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/play/challenges" class="btn btn-ghost btn-sm rounded-xl">
          <Icon name="kind-icon:arrow-left" class="size-4" />
          Fight card
        </NuxtLink>
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-xl"
          :disabled="loading"
          @click="loadLeaderboard"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
          Refresh
        </button>
      </nav>

      <header
        class="relative isolate overflow-hidden kr-panel-flat p-5 shadow-xl sm:p-8"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br from-warning/20 via-transparent to-primary/20"
        />
        <div
          class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[44px] border-warning/10"
        />
        <div
          class="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.3em] text-warning"
            >
              Championship standings
            </p>
            <p
              class="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl"
            >
              Hall of contenders
            </p>
            <p class="mt-4 max-w-3xl text-base text-base-content/70">
              Every reaction counts. Compare total score, victories, and win
              rate across the whole arena or inside one challenge division.
            </p>
          </div>
          <div
            class="grid size-36 place-items-center rounded-full border-8 border-warning/30 bg-base-100/80 text-center shadow-2xl backdrop-blur"
          >
            <div>
              <Icon
                name="kind-icon:trophy"
                class="mx-auto size-10 text-warning"
              />
              <p class="mt-1 text-xs font-black uppercase tracking-widest">
                Champion
              </p>
            </div>
          </div>
        </div>
      </header>

      <section class="kr-panel-flat p-4 shadow-lg sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <fieldset>
            <legend
              class="mb-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-base-content/45"
            >
              Weight class
            </legend>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="btn btn-sm rounded-xl"
                :class="
                  typeFilter === option.value
                    ? 'btn-primary'
                    : 'btn-ghost border border-base-300'
                "
                @click="selectType(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>
          <p class="text-xs font-bold text-base-content/45">
            {{ leaderboard.length }} ranked
            {{
              facetFilter === 'contender'
                ? 'contenders'
                : facetLabel(facetFilter) + ' groups'
            }}
          </p>
        </div>
      </section>

      <section v-if="errorMessage" class="kr-note kr-note-error">
        {{ errorMessage }}
      </section>

      <section
        v-if="loading && !leaderboard.length"
        class="grid min-h-64 place-items-center kr-panel-flat"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </section>

      <section
        v-else-if="!leaderboard.length"
        class="grid min-h-64 place-items-center rounded-3xl border border-dashed border-base-300 bg-base-100/70 p-8 text-center"
      >
        <div>
          <Icon
            name="kind-icon:trophy"
            class="mx-auto size-12 text-base-content/25"
          />
          <p class="mt-3 text-xl font-black">No contenders yet</p>
          <p class="mt-1 max-w-md text-sm text-base-content/55">
            Run a challenge and react to the result to put the first score on
            the board.
          </p>
        </div>
      </section>

      <section v-else class="grid gap-3">
        <article
          v-for="(entry, index) in leaderboard"
          :key="entry.id"
          class="grid gap-3 rounded-3xl border border-base-300 bg-base-100 p-3 shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-4"
        >
          <div
            class="grid size-12 shrink-0 place-items-center rounded-2xl border border-base-300 bg-base-200 text-lg font-black"
            :class="index < 3 ? 'text-warning' : 'text-base-content/45'"
          >
            #{{ index + 1 }}
          </div>

          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-3">
              <img
                v-if="entry.imageUrl"
                :src="entry.imageUrl"
                :alt="entry.name"
                class="size-14 shrink-0 rounded-2xl border border-base-300 object-cover"
              />
              <div
                v-else
                class="grid size-14 shrink-0 place-items-center rounded-2xl border border-base-300 bg-base-200"
              >
                <Icon :name="entry.icon" class="size-6 text-primary" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-lg font-black">{{ entry.name }}</p>
                <p class="truncate text-xs font-bold text-base-content/45">
                  {{ entry.subtitle }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="grid grid-cols-3 gap-2 sm:min-w-[19rem] sm:grid-cols-3"
          >
            <div class="rounded-2xl bg-base-200 p-3 text-center">
              <p class="text-[0.6rem] font-black uppercase tracking-wider text-base-content/40">
                Score
              </p>
              <p class="text-xl font-black">{{ entry.score }}</p>
            </div>
            <div class="rounded-2xl bg-base-200 p-3 text-center">
              <p class="text-[0.6rem] font-black uppercase tracking-wider text-base-content/40">
                Wins
              </p>
              <p class="text-xl font-black">{{ entry.wins }}</p>
            </div>
            <div class="rounded-2xl bg-base-200 p-3 text-center">
              <p class="text-[0.6rem] font-black uppercase tracking-wider text-base-content/40">
                Win rate
              </p>
              <p class="text-xl font-black">{{ entry.winRate }}%</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useChallengeStore } from '@/stores/challengeStore'
import { useFacetStore } from '@/stores/facetStore'

const challengeStore = useChallengeStore()
const facetStore = useFacetStore()

const loading = ref(false)
const errorMessage = ref('')
const typeFilter = ref('all')
const facetFilter = ref('contender')

const typeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Bot', value: 'BOT' },
  { label: 'Character', value: 'CHARACTER' },
  { label: 'Scenario', value: 'SCENARIO' },
]

const leaderboard = computed(() =>
  challengeStore.leaderboard.filter((entry) => {
    if (typeFilter.value !== 'all' && entry.entityType !== typeFilter.value)
      return false
    if (facetFilter.value === 'contender') return true
    return entry.facets?.some((facet) => facet.slug === facetFilter.value)
  }),
)

function facetLabel(slug: string) {
  return facetStore.facets.find((facet) => facet.slug === slug)?.label ?? slug
}

function selectType(value: string) {
  typeFilter.value = value
}

async function loadLeaderboard() {
  loading.value = true
  errorMessage.value = ''
  try {
    await Promise.all([
      challengeStore.loadLeaderboard(),
      facetStore.facets.length ? Promise.resolve() : facetStore.loadFacets(),
    ])
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to load leaderboard.'
  } finally {
    loading.value = false
  }
}

onMounted(loadLeaderboard)
</script>
