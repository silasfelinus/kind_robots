<!-- /components/conductor/challenge-center-page.vue -->
<!--
  Public front page for the Challenge Center project. Browses generative
  challenges from /api/challenges, opens one to see its contenders' submissions,
  and surfaces the leaderboard. Art submissions reuse <image-card> (with its
  built-in reactions for voting). Degrades to a friendly empty state before any
  challenges are seeded.
-->
<template>
  <ProjectFrontPage slug="challenge-center" :fallback="config">
    <template #interactive>
      <section
        class="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <div class="mb-3 flex items-center gap-2">
          <Icon name="kind-icon:trophy" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            The Arena
          </h3>
          <button
            v-if="selected"
            type="button"
            class="btn btn-ghost btn-xs ml-auto rounded-lg"
            @click="selected = null"
          >
            <Icon name="kind-icon:chevron-left" class="size-3.5" />All
            challenges
          </button>
          <button
            v-else
            type="button"
            class="btn btn-ghost btn-xs ml-auto rounded-lg"
            :disabled="loading"
            @click="loadChallenges"
          >
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="size-3.5" />
          </button>
        </div>

        <!-- Loading -->
        <div
          v-if="loading && !challenges.length"
          class="grid gap-3 sm:grid-cols-2"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="h-24 animate-pulse rounded-2xl border border-base-300 bg-base-200"
          />
        </div>

        <!-- Challenge list -->
        <div v-else-if="!selected" class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="ch in challenges"
            :key="ch.id"
            type="button"
            class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
            @click="openChallenge(ch)"
          >
            <div class="flex items-center gap-2">
              <span class="badge badge-primary badge-sm rounded-lg">{{
                ch.challengeType
              }}</span>
              <span class="badge badge-ghost badge-sm rounded-lg"
                >difficulty {{ ch.difficulty }}</span
              >
              <span
                class="badge badge-sm ml-auto rounded-lg"
                :class="ch.status === 'OPEN' ? 'badge-success' : 'badge-ghost'"
                >{{ ch.status }}</span
              >
            </div>
            <p class="font-black leading-tight">{{ ch.title }}</p>
            <p class="line-clamp-2 text-xs text-base-content/60">
              {{ ch.promptText }}
            </p>
            <span class="text-xs font-semibold text-primary/70"
              >{{ ch.Submissions?.length || 0 }} contenders →</span
            >
          </button>
          <p
            v-if="!challenges.length"
            class="col-span-full py-10 text-center text-sm text-base-content/50"
          >
            No challenges are open yet. The arena is being set up — check back
            soon.
          </p>
        </div>

        <!-- Selected challenge detail -->
        <div v-else class="space-y-4">
          <div class="rounded-2xl border border-base-300 bg-base-200/50 p-4">
            <h4 class="text-lg font-black">{{ selected.title }}</h4>
            <p class="mt-1 text-sm text-base-content/70">
              {{ selected.promptText }}
            </p>
          </div>

          <p
            class="text-xs font-semibold uppercase tracking-wide text-base-content/50"
          >
            Contenders
          </p>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="sub in selected.Submissions || []"
              :key="sub.id"
              class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <image-card
                v-if="sub.ArtImage"
                :art-image="sub.ArtImage"
                compact
                :show-prompt="false"
                :show-meta="false"
              />
              <p
                v-else-if="sub.outputText"
                class="whitespace-pre-wrap text-sm text-base-content/75"
              >
                {{ sub.outputText }}
              </p>
              <p v-else class="text-xs italic text-base-content/40">
                Submission pending render.
              </p>
              <p
                v-if="sub.agentModel"
                class="text-xs font-semibold text-base-content/50"
              >
                {{ sub.agentModel }}
              </p>
            </article>
            <p
              v-if="!selected.Submissions || !selected.Submissions.length"
              class="col-span-full py-8 text-center text-sm text-base-content/50"
            >
              No contenders have entered this challenge yet.
            </p>
          </div>
        </div>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

type Submission = {
  id: number
  agentModel?: string | null
  outputText?: string | null
  ArtImage?: ArtImage | null
}
type Challenge = {
  id: number
  slug: string
  title: string
  challengeType: string
  difficulty: number
  status: string
  promptText: string
  Submissions?: Submission[]
}

const challenges = ref<Challenge[]>([])
const selected = ref<Challenge | null>(null)
const loading = ref(false)

async function loadChallenges() {
  loading.value = true
  try {
    const res = await performFetch<Challenge[]>('/api/challenges')
    if (res.success && res.data) challenges.value = res.data
  } catch {
    /* empty-state UI covers this */
  } finally {
    loading.value = false
  }
}

async function openChallenge(ch: Challenge) {
  selected.value = ch
  try {
    const res = await performFetch<Challenge>(`/api/challenges/${ch.slug}`)
    if (res.success && res.data) selected.value = res.data
  } catch {
    /* keep the summary we already have */
  }
}

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
    ],
    next: [
      'Voting reactions surfaced inline',
      'Automated contender submissions',
    ],
  },
}
</script>
