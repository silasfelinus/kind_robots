<!-- /components/conductor/challenge-center-page.vue -->
<!--
  Public Challenge Center browser. The content route at /challenges renders this
  component; individual cards link to the dedicated /challenges/[slug] arena.
-->
<template>
  <ProjectFrontPage slug="challenge-center" :fallback="config">
    <template #interactive>
      <section
        class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl"
      >
        <header
          class="relative isolate overflow-hidden border-b border-base-300 bg-gradient-to-br from-primary/20 via-base-100 to-secondary/20 p-5 sm:p-7"
        >
          <div
            class="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full border-[28px] border-primary/10"
          />
          <div
            class="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full border-[34px] border-secondary/10"
          />

          <div class="relative flex flex-wrap items-start gap-4">
            <div
              class="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-base-100/80 shadow-lg backdrop-blur"
            >
              <Icon name="kind-icon:trophy" class="size-8 text-primary" />
            </div>

            <div class="min-w-0 flex-1">
              <p
                class="text-xs font-black uppercase tracking-[0.28em] text-primary"
              >
                Select your matchup
              </p>
              <h3 class="mt-1 text-2xl font-black uppercase sm:text-4xl">
                The Arena
              </h3>
              <p class="mt-2 max-w-2xl text-sm text-base-content/65">
                Every contender gets the same challenge. Pick a division, study
                the fight card, then enter the arena to judge the submissions.
              </p>
            </div>

            <div class="flex gap-2">
              <NuxtLink
                to="/challenges/leaderboard"
                class="btn btn-outline btn-sm rounded-xl"
              >
                <Icon name="kind-icon:trophy" class="size-4" />
                Rankings
              </NuxtLink>
              <button
                type="button"
                class="btn btn-ghost btn-sm rounded-xl"
                :disabled="loading"
                aria-label="Refresh challenges"
                @click="loadChallenges"
              >
                <span
                  v-if="loading"
                  class="loading loading-spinner loading-sm"
                />
                <Icon v-else name="kind-icon:refresh" class="size-4" />
              </button>
            </div>
          </div>
        </header>

        <div class="space-y-5 p-4 sm:p-6">
          <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <fieldset>
              <legend
                class="mb-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-base-content/50"
              >
                Division
              </legend>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in typeOptions"
                  :key="option.value"
                  type="button"
                  class="btn btn-sm rounded-xl"
                  :class="
                    typeFilter === option.value
                      ? 'btn-primary shadow-md'
                      : 'btn-ghost border border-base-300'
                  "
                  @click="typeFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </fieldset>

            <fieldset>
              <legend
                class="mb-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-base-content/50"
              >
                Fight status
              </legend>
              <div class="join">
                <button
                  v-for="option in statusOptions"
                  :key="option"
                  type="button"
                  class="btn btn-sm join-item"
                  :class="statusFilter === option ? 'btn-secondary' : 'btn-ghost'"
                  @click="statusFilter = option"
                >
                  {{ option }}
                </button>
              </div>
            </fieldset>
          </div>

          <div
            v-if="errorMessage"
            role="alert"
            class="alert alert-warning rounded-2xl text-sm"
          >
            <Icon name="kind-icon:warning" class="size-5" />
            <span>{{ errorMessage }}</span>
          </div>

          <div
            v-if="loading && !challenges.length"
            class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="h-64 animate-pulse rounded-3xl border border-base-300 bg-base-200"
            />
          </div>

          <div
            v-else-if="challenges.length"
            class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <NuxtLink
              v-for="(challenge, index) in challenges"
              :key="challenge.id"
              :to="`/challenges/${challenge.slug}`"
              class="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-60 transition group-hover:opacity-100"
              />
              <div
                class="pointer-events-none absolute -right-8 -top-8 text-8xl font-black text-base-content/[0.035]"
              >
                {{ String(index + 1).padStart(2, '0') }}
              </div>

              <div class="relative flex flex-wrap items-center gap-2">
                <span class="badge badge-primary badge-sm rounded-lg font-black">
                  {{ challenge.challengeType }}
                </span>
                <span
                  class="badge badge-sm rounded-lg font-black"
                  :class="statusClass(challenge.status)"
                >
                  {{ challenge.status }}
                </span>
                <span
                  class="ml-auto text-[0.65rem] font-black uppercase tracking-[0.18em] text-base-content/40"
                >
                  Fight {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>

              <div class="relative mt-5 flex-1">
                <h4
                  class="text-xl font-black uppercase leading-tight transition group-hover:text-primary"
                >
                  {{ challenge.title }}
                </h4>
                <p class="mt-3 line-clamp-3 text-sm text-base-content/65">
                  {{ challenge.promptText }}
                </p>
              </div>

              <div class="relative mt-5 space-y-3 border-t border-base-300 pt-4">
                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="font-black uppercase tracking-wider text-base-content/45">
                    Difficulty
                  </span>
                  <span
                    class="flex gap-0.5 text-base-content/20"
                    :aria-label="`Difficulty ${challenge.difficulty} of 5`"
                  >
                    <span
                      v-for="star in 5"
                      :key="star"
                      :class="star <= challenge.difficulty ? 'text-warning' : ''"
                      aria-hidden="true"
                    >★</span>
                  </span>
                </div>

                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="font-black uppercase tracking-wider text-base-content/45">
                    Entrants
                  </span>
                  <span class="font-black">
                    {{ challenge.submissionCount }}
                  </span>
                </div>

                <div
                  class="flex min-h-11 items-center gap-3 rounded-2xl border border-base-300 bg-base-200/50 px-3 py-2"
                >
                  <div
                    class="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
                  >
                    <Icon name="kind-icon:trophy" class="size-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-[0.6rem] font-black uppercase tracking-[0.18em] text-base-content/40"
                    >
                      Current leader
                    </p>
                    <p class="truncate text-xs font-black">
                      {{ leaderLabel(challenge.slug) }}
                    </p>
                  </div>
                  <span
                    v-if="leaders[challenge.slug]"
                    class="badge badge-ghost badge-sm rounded-lg font-black"
                  >
                    {{ signedScore(leaders[challenge.slug]?.netScore || 0) }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-primary"
                >
                  <span>Enter matchup</span>
                  <span class="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </NuxtLink>
          </div>

          <div
            v-else
            class="rounded-3xl border border-dashed border-base-300 bg-base-200/40 px-6 py-16 text-center"
          >
            <Icon name="kind-icon:trophy" class="mx-auto size-10 text-primary/50" />
            <h4 class="mt-4 text-lg font-black uppercase">No fights on this card</h4>
            <p class="mx-auto mt-2 max-w-md text-sm text-base-content/55">
              Try another division or status. The seeded challenges remain in the
              arena even when this particular bracket is empty.
            </p>
          </div>
        </div>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

type ChallengeType =
  | 'ALL'
  | 'ART'
  | 'TEXT'
  | 'CHARACTER'
  | 'SCENARIO'
  | 'REASONING'

type ChallengeStatus = 'OPEN' | 'JUDGING' | 'CLOSED'

type ChallengeListItem = {
  id: number
  slug: string
  title: string
  challengeType: Exclude<ChallengeType, 'ALL'>
  difficulty: number
  status: ChallengeStatus
  promptText: string
  submissionCount: number
}

type LeaderPreview = {
  name: string
  netScore: number
  votes: number
}

type LeaderboardResponse = {
  challenge: {
    id: number
    slug: string
    title: string
    challengeType: string
    status: string
  }
  leaderboard: Array<{
    contenderId: number
    name: string
    rank: number
    score: {
      votes: number
      netScore: number
    }
  }>
}

const typeOptions: Array<{ value: ChallengeType; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ART', label: 'Art' },
  { value: 'TEXT', label: 'Text' },
  { value: 'CHARACTER', label: 'Characters' },
  { value: 'SCENARIO', label: 'Scenarios' },
  { value: 'REASONING', label: 'Reasoning' },
]

const statusOptions: ChallengeStatus[] = ['OPEN', 'JUDGING', 'CLOSED']

const typeFilter = ref<ChallengeType>('ALL')
const statusFilter = ref<ChallengeStatus>('OPEN')
const challenges = ref<ChallengeListItem[]>([])
const leaders = ref<Record<string, LeaderPreview | null>>({})
const loading = ref(false)
const errorMessage = ref('')
let requestSequence = 0

function statusClass(status: ChallengeStatus) {
  if (status === 'OPEN') return 'badge-success'
  if (status === 'JUDGING') return 'badge-warning'
  return 'badge-ghost'
}

function signedScore(score: number) {
  return score > 0 ? `+${score}` : String(score)
}

function leaderLabel(slug: string) {
  const leader = leaders.value[slug]
  if (leader) return `${leader.name} · ${leader.votes} votes`
  return 'Awaiting the first contender'
}

async function loadLeaderPreviews(
  list: ChallengeListItem[],
  sequence: number,
) {
  await Promise.allSettled(
    list.map(async (challenge) => {
      const response = await performFetch<LeaderboardResponse>(
        `/api/challenges/${challenge.slug}/leaderboard`,
      )

      if (sequence !== requestSequence) return

      const top = response.success ? response.data?.leaderboard?.[0] : undefined
      leaders.value[challenge.slug] = top
        ? {
            name: top.name,
            netScore: top.score.netScore,
            votes: top.score.votes,
          }
        : null
    }),
  )
}

async function loadChallenges() {
  const sequence = ++requestSequence
  loading.value = true
  errorMessage.value = ''

  const params = new URLSearchParams({ status: statusFilter.value })
  if (typeFilter.value !== 'ALL') params.set('type', typeFilter.value)

  try {
    const response = await performFetch<ChallengeListItem[]>(
      `/api/challenges?${params.toString()}`,
    )

    if (sequence !== requestSequence) return

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Could not load the fight card.')
    }

    challenges.value = response.data
    leaders.value = {}
    void loadLeaderPreviews(response.data, sequence)
  } catch (error: unknown) {
    if (sequence !== requestSequence) return
    challenges.value = []
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'The arena could not load its challenges.'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

watch([typeFilter, statusFilter], loadChallenges)
onMounted(loadChallenges)

const config: ProjectFrontConfig = {
  slug: 'challenge-center',
  title: 'Challenge Center',
  channelKey: 'wonder',
  tabKey: 'challenges',
  icon: 'kind-icon:trophy',
  tagline: 'Two contenders enter. The swarm decides.',
  description:
    'A generative comparison arena. Each challenge poses a prompt; models, agent stacks, and art generators submit contenders; and the community votes head-to-head to crown a favorite. Browse open challenges, study the entries, and climb the leaderboard.',
  sections: [
    {
      key: 'compete',
      title: 'Head-to-head',
      body: 'Contenders answer the same prompt so you can compare them fairly, side by side.',
      icon: 'kind-icon:trophy',
    },
    {
      key: 'vote',
      title: 'The swarm judges',
      body: 'React to the entries you like best; votes roll up into a live leaderboard.',
      icon: 'kind-icon:heart',
    },
  ],
  deliverables: {
    done: [
      'Challenge / submission / contender schema + API',
      'Seed + leaderboard endpoints',
      'Filtered fight-card browser',
    ],
    next: [
      'Dedicated voting arena',
      'Championship leaderboard',
      'Automated contender submissions',
    ],
  },
}
</script>
