<template>
  <main class="min-h-screen bg-base-200/40 px-3 py-5 sm:px-6 sm:py-8">
    <div class="mx-auto max-w-7xl space-y-5">
      <nav class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/challenges" class="btn btn-ghost btn-sm rounded-xl">
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
        class="relative isolate overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl sm:p-8"
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
            <h1
              class="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl"
            >
              Hall of contenders
            </h1>
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

      <section
        class="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-lg sm:p-6"
      >
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
        <div class="mt-4 border-t border-base-300 pt-4">
          <fieldset>
            <legend
              class="mb-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-base-content/45"
            >
              Comparison axis
            </legend>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in facetOptions"
                :key="option.value"
                type="button"
                class="btn btn-sm rounded-xl"
                :class="
                  facetFilter === option.value
                    ? 'btn-secondary'
                    : 'btn-ghost border border-base-300'
                "
                @click="selectFacet(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>
        </div>
      </section>

      <div v-if="errorMessage" class="alert alert-error rounded-2xl">
        <Icon name="kind-icon:warning" class="size-5" />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="loading && !leaderboard.length"
        class="grid gap-4 md:grid-cols-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="h-72 animate-pulse rounded-3xl border border-base-300 bg-base-100"
        />
      </div>

      <section v-else-if="leaderboard.length" class="space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <article
            v-for="entry in podium"
            :key="entry.key"
            class="relative overflow-hidden rounded-3xl border bg-base-100 p-5 text-center shadow-xl"
            :class="
              entry.rank === 1
                ? 'border-warning/60 md:-translate-y-3'
                : 'border-base-300'
            "
          >
            <div
              class="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary via-warning to-secondary"
              :class="entry.rank === 1 ? 'opacity-100' : 'opacity-45'"
            />
            <div
              class="mx-auto mt-3 grid size-20 place-items-center rounded-full border-4 border-base-100 bg-primary/10 text-3xl font-black text-primary shadow-lg"
            >
              {{ entry.name.slice(0, 1).toUpperCase() }}
            </div>
            <span
              class="badge mt-4 rounded-lg font-black"
              :class="entry.rank === 1 ? 'badge-warning' : 'badge-ghost'"
            >
              #{{ entry.rank }}
            </span>
            <h2 class="mt-3 text-xl font-black uppercase">{{ entry.name }}</h2>
            <p class="mt-1 text-xs font-bold text-base-content/45">
              {{ entry.subtitle }}
            </p>
            <p
              class="mt-5 text-5xl font-black"
              :class="scoreClass(entry.score.netScore)"
            >
              {{ signedScore(entry.score.netScore) }}
            </p>
            <p
              class="text-xs font-black uppercase tracking-widest text-base-content/40"
            >
              total score
            </p>
            <div class="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-xl bg-base-200 p-3">
                <strong class="block text-lg">{{
                  entry.challengesAttempted
                }}</strong>
                <span class="text-[0.65rem] uppercase text-base-content/45"
                  >fights</span
                >
              </div>
              <div class="rounded-xl bg-warning/10 p-3">
                <strong class="block text-lg">{{ entry.challengesWon }}</strong>
                <span class="text-[0.65rem] uppercase text-base-content/45"
                  >wins</span
                >
              </div>
              <div class="rounded-xl bg-primary/10 p-3">
                <strong class="block text-lg">{{ entry.winRate }}%</strong>
                <span class="text-[0.65rem] uppercase text-base-content/45"
                  >rate</span
                >
              </div>
            </div>
          </article>
        </div>

        <div
          class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg"
        >
          <div class="overflow-x-auto">
            <table class="table">
              <thead class="bg-base-200/70 text-xs uppercase tracking-wider">
                <tr>
                  <th>Rank</th>
                  <th>
                    {{
                      facetFilter === 'contender'
                        ? 'Contender'
                        : facetLabel(facetFilter)
                    }}
                  </th>
                  <th class="text-right">Fights</th>
                  <th class="text-right">Wins</th>
                  <th class="text-right">Win rate</th>
                  <th class="text-right">Votes</th>
                  <th class="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in normalizedLeaderboard"
                  :key="entry.key"
                  class="hover"
                >
                  <td>
                    <span class="badge badge-ghost rounded-lg font-black"
                      >#{{ entry.rank }}</span
                    >
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div
                        class="grid size-10 place-items-center rounded-xl bg-primary/10 font-black text-primary"
                      >
                        {{ entry.name.slice(0, 1).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-black">{{ entry.name }}</p>
                        <p class="text-xs text-base-content/45">
                          {{ entry.subtitle }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="text-right font-bold">
                    {{ entry.challengesAttempted }}
                  </td>
                  <td class="text-right font-bold">
                    {{ entry.challengesWon }}
                  </td>
                  <td class="text-right font-bold">{{ entry.winRate }}%</td>
                  <td class="text-right font-bold">{{ entry.score.votes }}</td>
                  <td
                    class="text-right text-lg font-black"
                    :class="scoreClass(entry.score.netScore)"
                  >
                    {{ signedScore(entry.score.netScore) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        v-else-if="!loading"
        class="rounded-3xl border border-dashed border-base-300 bg-base-100 p-10 text-center"
      >
        <Icon
          name="kind-icon:trophy"
          class="mx-auto size-12 text-base-content/25"
        />
        <h2 class="mt-4 text-xl font-black">No rankings yet</h2>
        <p class="mt-2 text-sm text-base-content/55">
          This division needs scored submissions before a champion can emerge.
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
type ChallengeType =
  | ''
  | 'ART'
  | 'TEXT'
  | 'CHARACTER'
  | 'SCENARIO'
  | 'REASONING'
type Facet = 'contender' | 'kind' | 'provider' | 'model' | 'generator'

type ContenderLeaderboardEntry = {
  contenderId: number
  slug: string
  name: string
  rank: number
  challengesAttempted: number
  challengesWon: number
  winRate: number
  score: {
    votes: number
    netScore: number
  }
}

type FacetLeaderboardEntry = {
  value: string
  contenderSlugs: string[]
  rank: number
  challengesAttempted: number
  challengesWon: number
  winRate: number
  score: {
    votes: number
    netScore: number
  }
}

type LeaderboardResponse = {
  success: boolean
  message: string
  data?: Array<ContenderLeaderboardEntry | FacetLeaderboardEntry>
}

type DisplayEntry = {
  key: string
  name: string
  subtitle: string
  rank: number
  challengesAttempted: number
  challengesWon: number
  winRate: number
  score: { votes: number; netScore: number }
}

const typeOptions: Array<{ label: string; value: ChallengeType }> = [
  { label: 'All divisions', value: '' },
  { label: 'Art', value: 'ART' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Characters', value: 'CHARACTER' },
  { label: 'Scenarios', value: 'SCENARIO' },
  { label: 'Reasoning', value: 'REASONING' },
]

const facetOptions: Array<{ label: string; value: Facet }> = [
  { label: 'By contender', value: 'contender' },
  { label: 'By model', value: 'model' },
  { label: 'By generator', value: 'generator' },
  { label: 'By provider', value: 'provider' },
  { label: 'By kind', value: 'kind' },
]

const typeFilter = ref<ChallengeType>('')
const facetFilter = ref<Facet>('contender')
const leaderboard = ref<
  Array<ContenderLeaderboardEntry | FacetLeaderboardEntry>
>([])
const loading = ref(false)
const errorMessage = ref('')

function isContenderEntry(
  entry: ContenderLeaderboardEntry | FacetLeaderboardEntry,
): entry is ContenderLeaderboardEntry {
  return 'contenderId' in entry
}

function facetLabel(facet: Facet): string {
  return (
    facetOptions
      .find((option) => option.value === facet)
      ?.label.replace('By ', '') ?? facet
  )
}

const normalizedLeaderboard = computed<DisplayEntry[]>(() =>
  leaderboard.value.map((entry) =>
    isContenderEntry(entry)
      ? {
          key: `contender-${entry.contenderId}`,
          name: entry.name,
          subtitle: entry.slug,
          rank: entry.rank,
          challengesAttempted: entry.challengesAttempted,
          challengesWon: entry.challengesWon,
          winRate: entry.winRate,
          score: entry.score,
        }
      : {
          key: `facet-${entry.value}`,
          name: entry.value,
          subtitle: `${entry.contenderSlugs.length} ${entry.contenderSlugs.length === 1 ? 'contender' : 'contenders'}`,
          rank: entry.rank,
          challengesAttempted: entry.challengesAttempted,
          challengesWon: entry.challengesWon,
          winRate: entry.winRate,
          score: entry.score,
        },
  ),
)

const podium = computed(() => normalizedLeaderboard.value.slice(0, 3))

function signedScore(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function scoreClass(value: number): string {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-base-content'
}

async function loadLeaderboard(): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
    const query: Record<string, string> = {}
    if (typeFilter.value) query.type = typeFilter.value
    if (facetFilter.value !== 'contender') query.facet = facetFilter.value

    const response = await $fetch<LeaderboardResponse>(
      '/api/challenges/leaderboard',
      {
        query: Object.keys(query).length ? query : undefined,
      },
    )

    if (!response.success) {
      throw new Error(response.message || 'Leaderboard fetch failed')
    }

    leaderboard.value = response.data ?? []
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Leaderboard fetch failed'
  } finally {
    loading.value = false
  }
}

function selectType(value: ChallengeType): void {
  if (typeFilter.value === value) return
  typeFilter.value = value
  void loadLeaderboard()
}

function selectFacet(value: Facet): void {
  if (facetFilter.value === value) return
  facetFilter.value = value
  void loadLeaderboard()
}

onMounted(() => {
  void loadLeaderboard()
})
</script>
