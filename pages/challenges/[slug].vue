<template>
  <main class="min-h-screen bg-base-200/40 px-3 py-5 sm:px-6 sm:py-8">
    <div class="mx-auto max-w-7xl space-y-5">
      <nav class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/challenges" class="btn btn-ghost btn-sm rounded-xl">
          <Icon name="kind-icon:arrow-left" class="size-4" />
          Fight card
        </NuxtLink>
        <NuxtLink
          to="/challenges/leaderboard"
          class="btn btn-outline btn-sm rounded-xl"
        >
          <Icon name="kind-icon:trophy" class="size-4" />
          Rankings
        </NuxtLink>
      </nav>

      <div
        v-if="loading && !challenge"
        class="grid min-h-[60vh] place-items-center rounded-3xl border border-base-300 bg-base-100"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="mt-3 text-sm font-bold text-base-content/55">
            Building the matchup…
          </p>
        </div>
      </div>

      <div
        v-else-if="errorMessage && !challenge"
        class="rounded-3xl border border-error/30 bg-error/10 p-8 text-center"
      >
        <Icon name="kind-icon:warning" class="mx-auto size-10 text-error" />
        <h1 class="mt-3 text-xl font-black">Arena unavailable</h1>
        <p class="mt-2 text-sm text-base-content/65">{{ errorMessage }}</p>
        <button class="btn btn-error btn-sm mt-5 rounded-xl" @click="loadChallenge">
          Try again
        </button>
      </div>

      <template v-else-if="challenge">
        <header
          class="relative isolate overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl sm:p-8"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"
          />
          <div
            class="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border-[36px] border-primary/10"
          />
          <div
            class="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full border-[40px] border-secondary/10"
          />

          <div class="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-primary rounded-lg font-black">
                  {{ challenge.challengeType }}
                </span>
                <span class="badge rounded-lg font-black" :class="statusClass">
                  {{ challenge.status }}
                </span>
                <span class="badge badge-ghost rounded-lg font-black">
                  {{ challenge.Submissions.length }} contenders
                </span>
              </div>

              <p
                class="mt-5 text-xs font-black uppercase tracking-[0.3em] text-primary"
              >
                Championship matchup
              </p>
              <h1
                class="mt-2 max-w-4xl text-3xl font-black uppercase leading-none sm:text-5xl"
              >
                {{ challenge.title }}
              </h1>
              <p class="mt-5 max-w-4xl text-base leading-relaxed text-base-content/75">
                {{ challenge.promptText }}
              </p>

              <div
                v-if="challenge.judgeNotes"
                class="mt-5 max-w-4xl rounded-2xl border border-secondary/25 bg-secondary/10 p-4"
              >
                <p
                  class="text-[0.65rem] font-black uppercase tracking-[0.22em] text-secondary"
                >
                  Judges' brief
                </p>
                <p class="mt-2 text-sm leading-relaxed">
                  {{ challenge.judgeNotes }}
                </p>
              </div>
            </div>

            <div
              class="grid min-w-40 place-items-center rounded-3xl border border-primary/20 bg-base-100/75 p-5 text-center shadow-lg backdrop-blur"
            >
              <span class="text-xs font-black uppercase tracking-[0.2em] text-base-content/45">
                Difficulty
              </span>
              <span
                class="mt-2 text-2xl tracking-widest text-warning"
                :aria-label="`Difficulty ${challenge.difficulty} of 5`"
              >
                <span
                  v-for="star in 5"
                  :key="star"
                  :class="star > challenge.difficulty ? 'opacity-20' : ''"
                >★</span>
              </span>
              <span class="mt-3 text-5xl font-black italic text-primary">VS</span>
            </div>
          </div>
        </header>

        <div
          v-if="!isLoggedIn"
          class="alert rounded-2xl border border-warning/30 bg-warning/10"
        >
          <Icon name="kind-icon:warning" class="size-5" />
          <span>
            Browse freely, but sign in before voting. Each account gets exactly one
            current vote per submission.
          </span>
        </div>

        <div
          v-if="voteMessage"
          class="alert rounded-2xl"
          :class="voteStatus === 'error' ? 'alert-error' : 'alert-success'"
        >
          <Icon
            :name="voteStatus === 'error' ? 'kind-icon:warning' : 'kind-icon:check'"
            class="size-5"
          />
          <span>{{ voteMessage }}</span>
        </div>

        <section v-if="challenge.Submissions.length" class="relative">
          <div
            v-if="challenge.Submissions.length === 2"
            class="pointer-events-none absolute left-1/2 top-20 z-20 hidden -translate-x-1/2 lg:grid"
          >
            <div
              class="grid size-20 place-items-center rounded-full border-4 border-base-100 bg-gradient-to-br from-primary to-secondary text-3xl font-black italic text-white shadow-2xl"
            >
              VS
            </div>
          </div>

          <div class="grid gap-5" :class="arenaGridClass">
            <article
              v-for="submission in challenge.Submissions"
              :key="submission.id"
              class="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              :class="submission.rank === 1 ? 'border-warning/60' : 'border-base-300'"
            >
              <div
                class="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent"
                :class="submission.rank === 1 ? 'opacity-100' : 'opacity-45'"
              />

              <header class="relative flex items-start gap-4 p-5 pb-4">
                <div
                  class="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-xl font-black text-primary shadow-sm"
                >
                  {{ contenderInitial(submission) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      v-if="submission.rank"
                      class="badge rounded-lg font-black"
                      :class="submission.rank === 1 ? 'badge-warning' : 'badge-ghost'"
                    >
                      #{{ submission.rank }}
                    </span>
                    <span class="badge badge-outline badge-sm rounded-lg">
                      {{ submission.variantKey }}
                    </span>
                  </div>
                  <h2 class="mt-2 truncate text-xl font-black uppercase">
                    {{ submission.Contender?.name || 'Mystery contender' }}
                  </h2>
                  <p class="truncate text-xs font-bold text-base-content/45">
                    {{ contenderSubtitle(submission) }}
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="text-2xl font-black"
                    :class="scoreClass(submission.score.netScore)"
                  >
                    {{ signedScore(submission.score.netScore) }}
                  </p>
                  <p
                    class="text-[0.65rem] font-black uppercase tracking-wider text-base-content/40"
                  >
                    {{ submission.score.votes }} votes
                  </p>
                </div>
              </header>

              <div class="flex-1 border-y border-base-300 bg-base-200/35 p-4 sm:p-5">
                <img
                  v-if="submission.ArtImage && artImageUrl(submission.ArtImage)"
                  :src="artImageUrl(submission.ArtImage)"
                  :alt="submission.Contender?.name || 'Challenge submission'"
                  class="aspect-square w-full rounded-2xl border border-base-300 object-cover shadow-inner"
                />

                <div
                  v-else-if="submission.Character"
                  class="rounded-2xl border border-primary/20 bg-primary/5 p-5"
                >
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    Character entry
                  </p>
                  <h3 class="mt-2 text-2xl font-black">
                    {{ entityTitle(submission.Character, 'Unnamed character') }}
                  </h3>
                  <p
                    class="mt-3 whitespace-pre-line text-sm leading-relaxed text-base-content/70"
                  >
                    {{ entityDescription(submission.Character) }}
                  </p>
                </div>

                <div
                  v-else-if="submission.Scenario"
                  class="rounded-2xl border border-secondary/20 bg-secondary/5 p-5"
                >
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-secondary">
                    Scenario entry
                  </p>
                  <h3 class="mt-2 text-2xl font-black">
                    {{ entityTitle(submission.Scenario, 'Untitled scenario') }}
                  </h3>
                  <p
                    class="mt-3 whitespace-pre-line text-sm leading-relaxed text-base-content/70"
                  >
                    {{ entityDescription(submission.Scenario) }}
                  </p>
                </div>

                <div
                  v-else-if="submission.outputText"
                  class="rounded-2xl border border-base-300 bg-base-100 p-5"
                >
                  <p
                    class="whitespace-pre-line text-sm leading-relaxed"
                    :class="expandedIds.has(submission.id) ? '' : 'line-clamp-[12]'"
                  >
                    {{ submission.outputText }}
                  </p>
                  <button
                    v-if="submission.outputText.length > 700"
                    class="btn btn-ghost btn-xs mt-3 rounded-lg"
                    type="button"
                    @click="toggleExpanded(submission.id)"
                  >
                    {{
                      expandedIds.has(submission.id)
                        ? 'Show less'
                        : 'Read full entry'
                    }}
                  </button>
                </div>

                <div
                  v-else
                  class="grid min-h-48 place-items-center rounded-2xl border border-dashed border-base-300 text-sm text-base-content/45"
                >
                  This contender has no displayable output yet.
                </div>

                <details
                  v-if="submission.promptUsed"
                  class="collapse collapse-arrow mt-4 rounded-2xl border border-base-300 bg-base-100"
                >
                  <summary
                    class="collapse-title min-h-0 py-3 text-xs font-black uppercase tracking-wider"
                  >
                    Exact prompt used
                  </summary>
                  <div
                    class="collapse-content whitespace-pre-line text-xs text-base-content/65"
                  >
                    {{ submission.promptUsed }}
                  </div>
                </details>
              </div>

              <footer class="space-y-4 p-5">
                <div class="grid grid-cols-4 gap-2 text-center text-xs">
                  <div class="rounded-xl bg-success/10 px-2 py-2">
                    <span class="block text-lg">♥</span>
                    <strong>{{ submission.score.loved }}</strong>
                  </div>
                  <div class="rounded-xl bg-info/10 px-2 py-2">
                    <span class="block text-lg">👏</span>
                    <strong>{{ submission.score.clapped }}</strong>
                  </div>
                  <div class="rounded-xl bg-warning/10 px-2 py-2">
                    <span class="block text-lg">👎</span>
                    <strong>{{ submission.score.booed }}</strong>
                  </div>
                  <div class="rounded-xl bg-error/10 px-2 py-2">
                    <span class="block text-lg">✕</span>
                    <strong>{{ submission.score.hated }}</strong>
                  </div>
                </div>

                <div>
                  <p
                    class="mb-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-base-content/45"
                  >
                    Cast or change your vote
                  </p>
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      v-for="reaction in reactionOptions"
                      :key="reaction.value"
                      type="button"
                      class="btn btn-sm rounded-xl"
                      :class="
                        submission.myReaction === reaction.value
                          ? reaction.activeClass
                          : 'btn-ghost border border-base-300'
                      "
                      :disabled="
                        !isLoggedIn ||
                        votingSubmissionId === submission.id ||
                        challenge.status === 'CLOSED'
                      "
                      @click="vote(submission.id, reaction.value)"
                    >
                      <span
                        v-if="
                          votingSubmissionId === submission.id &&
                          pendingReaction === reaction.value
                        "
                        class="loading loading-spinner loading-xs"
                      />
                      <span v-else>{{ reaction.icon }}</span>
                      {{ reaction.label }}
                    </button>
                  </div>
                </div>
              </footer>
            </article>
          </div>
        </section>

        <section
          v-else
          class="rounded-3xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center"
        >
          <Icon name="kind-icon:trophy" class="mx-auto size-12 text-primary/40" />
          <h2 class="mt-4 text-2xl font-black uppercase">Waiting for contenders</h2>
          <p class="mx-auto mt-2 max-w-xl text-sm text-base-content/60">
            The challenge is live, but no ready submissions have entered the arena yet.
          </p>
        </section>

        <section
          v-if="challenge.leaderboard.length"
          class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-lg sm:p-7"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.25em] text-primary">
                Live scorecard
              </p>
              <h2 class="mt-1 text-2xl font-black uppercase">Challenge rankings</h2>
            </div>
            <NuxtLink
              to="/challenges/leaderboard"
              class="btn btn-ghost btn-sm rounded-xl"
            >
              Full championship table →
            </NuxtLink>
          </div>

          <div class="mt-5 grid gap-2">
            <div
              v-for="entry in challenge.leaderboard"
              :key="entry.contenderId"
              class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border border-base-300 bg-base-200/40 px-4 py-3"
            >
              <span
                class="grid size-9 place-items-center rounded-xl bg-primary/10 font-black text-primary"
              >
                #{{ entry.rank }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-black">{{ entry.name }}</p>
                <p class="text-xs text-base-content/45">
                  {{ entry.submissions }}
                  {{ entry.submissions === 1 ? 'entry' : 'entries' }} ·
                  {{ entry.score.votes }} votes
                </p>
              </div>
              <span class="hidden text-xs font-bold text-base-content/45 sm:inline">
                ♥ {{ entry.score.loved }} · 👏 {{ entry.score.clapped }} · 👎
                {{ entry.score.booed }} · ✕ {{ entry.score.hated }}
              </span>
              <span
                class="text-lg font-black"
                :class="scoreClass(entry.score.netScore)"
              >
                {{ signedScore(entry.score.netScore) }}
              </span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

type ReactionType = 'LOVED' | 'CLAPPED' | 'BOOED' | 'HATED'

type ChallengeScore = {
  loved: number
  clapped: number
  booed: number
  hated: number
  votes: number
  netScore: number
}

type Contender = {
  id: number
  slug: string
  name: string
  kind: string
  provider: string | null
  model: string | null
  generator: string | null
  description: string | null
}

type ArtImagePreview = {
  id: number
  imagePath: string | null
  thumbnailPath: string | null
  fileName: string | null
  promptString: string | null
}

type LinkedEntity = {
  name?: string | null
  title?: string | null
  description?: string | null
  content?: string | null
  flavorText?: string | null
}

type ChallengeSubmission = {
  id: number
  contenderId: number | null
  variantKey: string
  promptUsed: string | null
  outputText: string | null
  Contender: Contender | null
  ArtImage: ArtImagePreview | null
  Character: LinkedEntity | null
  Scenario: LinkedEntity | null
  score: ChallengeScore
  rank: number | null
  myReaction: ReactionType | null
}

type ChallengeLeaderboardEntry = {
  contenderId: number
  slug: string
  name: string
  submissions: number
  rank: number
  score: ChallengeScore
}

type ChallengeDetail = {
  id: number
  slug: string
  title: string
  challengeType: string
  difficulty: number
  status: 'OPEN' | 'JUDGING' | 'CLOSED'
  promptText: string
  judgeNotes: string | null
  Submissions: ChallengeSubmission[]
  leaderboard: ChallengeLeaderboardEntry[]
}

const reactionOptions: Array<{
  value: ReactionType
  label: string
  icon: string
  activeClass: string
}> = [
  { value: 'LOVED', label: 'Loved', icon: '♥', activeClass: 'btn-success' },
  { value: 'CLAPPED', label: 'Clapped', icon: '👏', activeClass: 'btn-info' },
  { value: 'BOOED', label: 'Booed', icon: '👎', activeClass: 'btn-warning' },
  { value: 'HATED', label: 'Hated', icon: '✕', activeClass: 'btn-error' },
]

const route = useRoute()
const userStore = useUserStore()
const challenge = ref<ChallengeDetail | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const voteMessage = ref('')
const voteStatus = ref<'success' | 'error' | ''>('')
const votingSubmissionId = ref<number | null>(null)
const pendingReaction = ref<ReactionType | null>(null)
const expandedIds = ref(new Set<number>())
let requestSequence = 0

const slug = computed(() => String(route.params.slug || '').trim())
const isLoggedIn = computed(() => Boolean(userStore.user?.id))
const statusClass = computed(() => {
  if (challenge.value?.status === 'OPEN') return 'badge-success'
  if (challenge.value?.status === 'JUDGING') return 'badge-warning'
  return 'badge-ghost'
})
const arenaGridClass = computed(() => {
  if (challenge.value?.Submissions.length === 2) return 'lg:grid-cols-2'
  return 'md:grid-cols-2 xl:grid-cols-3'
})

useHead(() => ({
  title: challenge.value
    ? `${challenge.value.title} · Challenge Center`
    : 'Challenge Center Arena',
}))

function contenderInitial(submission: ChallengeSubmission) {
  return (submission.Contender?.name || '?').trim().charAt(0).toUpperCase()
}

function contenderSubtitle(submission: ChallengeSubmission) {
  const contender = submission.Contender
  if (!contender) return 'Unregistered contender'
  return contender.model || contender.generator || contender.provider || contender.kind
}

function artImageUrl(image: ArtImagePreview) {
  return image.thumbnailPath || image.imagePath || ''
}

function entityTitle(entity: LinkedEntity, fallback: string) {
  return entity.name || entity.title || fallback
}

function entityDescription(entity: LinkedEntity) {
  return (
    entity.description ||
    entity.flavorText ||
    entity.content ||
    'No description supplied.'
  )
}

function signedScore(score: number) {
  return score > 0 ? `+${score}` : String(score)
}

function scoreClass(score: number) {
  if (score > 0) return 'text-success'
  if (score < 0) return 'text-error'
  return 'text-base-content'
}

function toggleExpanded(id: number) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

async function loadChallenge() {
  if (!slug.value) return

  const sequence = ++requestSequence
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await performFetch<ChallengeDetail>(
      `/api/challenges/${encodeURIComponent(slug.value)}`,
    )

    if (sequence !== requestSequence) return

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Could not load this challenge.')
    }

    challenge.value = response.data
  } catch (error: unknown) {
    if (sequence !== requestSequence) return
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load this challenge.'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

async function vote(submissionId: number, reactionType: ReactionType) {
  if (!isLoggedIn.value) {
    voteStatus.value = 'error'
    voteMessage.value = 'Sign in before voting.'
    return
  }

  votingSubmissionId.value = submissionId
  pendingReaction.value = reactionType
  voteMessage.value = ''
  voteStatus.value = ''

  try {
    const response = await performFetch<{ reactionType: ReactionType }>(
      `/api/challenges/submissions/${submissionId}/reaction`,
      {
        method: 'POST',
        body: JSON.stringify({ reactionType }),
      },
    )

    if (!response.success) {
      throw new Error(response.message || 'Your vote could not be recorded.')
    }

    voteStatus.value = 'success'
    voteMessage.value = 'Vote recorded. You can change it at any time.'
    await loadChallenge()
  } catch (error: unknown) {
    voteStatus.value = 'error'
    voteMessage.value =
      error instanceof Error ? error.message : 'Your vote could not be recorded.'
  } finally {
    votingSubmissionId.value = null
    pendingReaction.value = null
  }
}

watch(slug, loadChallenge)
onMounted(loadChallenge)
</script>
