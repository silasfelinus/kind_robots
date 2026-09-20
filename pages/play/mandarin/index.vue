<!-- /pages/play/mandarin/index.vue
     mandarin-tutor/t-028: the guided course, and the front door to Mandarin Tutor.

     Silas, 2026-09-20: "i want a real front end interface. We start, are given an
     introduction, then shown cards that give info, basically, a streamlined teaching
     interface."

     What used to live at this route is now /play/mandarin/browse -- unchanged, one click
     away, and still the right surface for roaming the catalog, searching, building custom
     decks, or free drilling. It stopped being the front door because it is a tool: it
     asks a newcomer to pick a mode, pick a deck, and pick a view before it teaches them
     anything.

     This page owns the sequence and every write. utils/mandarinCourse.ts decides what a
     word's teaching looks like, mandarin-course-card.vue renders one screen of it, and
     neither of those touches the store or the network. -->
<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-3xl space-y-4 px-3 py-4 sm:px-5 sm:py-6"
    >
      <!-- Loading ------------------------------------------------------- -->
      <div
        v-if="loading && !initialized"
        class="grid min-h-[60vh] place-items-center kr-panel-flat rounded-3xl"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="kr-text-bold-sm mt-3 text-base-content/55">
            Loading the catalog…
          </p>
        </div>
      </div>

      <div
        v-else-if="store.error"
        class="alert alert-error text-sm"
        role="alert"
      >
        <span>{{ store.error }}</span>
        <button class="kr-btn-plain" type="button" @click="store.loadCatalog()">
          Retry
        </button>
      </div>

      <!-- Start ---------------------------------------------------------- -->
      <template v-else-if="!running">
        <section class="kr-panel-section-plain shadow-lg text-center">
          <p class="text-6xl leading-none font-semibold">汉字</p>
          <p class="kr-text-black-2xl mt-3">Mandarin Tutor</p>
          <p class="mx-auto mt-3 max-w-prose leading-relaxed">
            A course that teaches you what the characters are actually doing —
            which piece carries the meaning, which piece carries the sound, and
            which other words are built the same way — and only then asks you to
            recall them.
          </p>

          <div
            v-if="pointTotals.totalPoints > 0"
            class="mt-4 flex flex-wrap items-center justify-center gap-1"
          >
            <span class="kr-badge-primary-sm"
              >{{ pointTotals.totalPoints }} points</span
            >
            <span class="kr-badge-ghost-sm"
              >{{ pointTotals.lessonsCompleted }} words learned</span
            >
            <span v-if="dueCount" class="kr-badge-outline-sm badge-primary"
              >{{ dueCount }} due</span
            >
          </div>

          <button
            type="button"
            class="kr-btn-primary-md-2xl mx-auto mt-6 flex"
            :disabled="!sessionLessons.length"
            @click="begin"
          >
            {{ startLabel }}
            <Icon name="kind-icon:forward" class="kr-icon-5" />
          </button>

          <p class="kr-text-faded-xs mt-3">
            {{ sessionLessons.length }}
            {{ sessionLessons.length === 1 ? 'word' : 'words' }} in this session
            · from
            <b>{{ selectedSet?.label || 'the starter deck' }}</b>
          </p>
        </section>

        <section class="kr-panel-section-flat">
          <p class="kr-text-semibold-sm">Or go your own way</p>
          <p class="kr-text-faded-xs mt-1">
            The course is a route through the catalog, not a fence around it.
          </p>

          <div
            class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-2"
          >
            <NuxtLink
              to="/play/mandarin/browse"
              class="kr-panel-flat p-3 text-left transition hover:border-primary/40"
            >
              <p class="kr-text-semibold-sm">Browse the catalog</p>
              <p class="kr-text-faded-xs mt-1 leading-relaxed">
                Decks, search, custom sets, the gallery, and free drilling —
                everything the workspace has always done.
              </p>
            </NuxtLink>

            <NuxtLink
              to="/play/mandarin/sound-families"
              class="kr-panel-flat p-3 text-left transition hover:border-primary/40"
            >
              <p class="kr-text-semibold-sm">Read by sound family</p>
              <p class="kr-text-faded-xs mt-1 leading-relaxed">
                Every sound component in the catalog with its family underneath
                — 青 and everything built on it, drifted readings included.
              </p>
            </NuxtLink>
          </div>

          <div v-if="introDismissed" class="kr-panel-divider">
            <button
              type="button"
              class="kr-btn-ghost-xs-plain"
              @click="replayIntro"
            >
              Show the introduction again
            </button>
          </div>
        </section>
      </template>

      <!-- Running --------------------------------------------------------- -->
      <template v-else>
        <header class="flex flex-wrap items-center justify-between gap-2">
          <button type="button" class="kr-btn-ghost-xs-plain" @click="quit">
            <Icon name="kind-icon:arrow-left" class="kr-icon-4" />
            End session
          </button>

          <div class="flex items-center gap-2">
            <span
              v-if="lastAward"
              class="kr-badge-success-sm"
              :title="lastAward.reason"
            >
              +{{ lastAward.points }}
            </span>
            <span v-if="pointTotals.totalPoints > 0" class="kr-badge-ghost-sm">
              {{ pointTotals.totalPoints }} pts
            </span>
          </div>
        </header>

        <div>
          <progress
            class="progress progress-primary h-2 w-full"
            :value="progress.wordsDone"
            :max="Math.max(progress.wordsTotal, 1)"
            :aria-label="`${progress.wordsDone} of ${progress.wordsTotal} words complete`"
          />
          <p class="kr-text-dim-xs-45 mt-1 text-right">
            <template v-if="currentStep?.kind === 'intro'"
              >Introduction</template
            >
            <template v-else>
              {{ progress.wordsDone }} of {{ progress.wordsTotal }} words
            </template>
          </p>
        </div>

        <MandarinCourseCard
          v-if="currentStep"
          :step="currentStep"
          :lesson="currentLesson"
          :revealed="revealed"
          :is-review="currentIsReview"
          :art-url="currentArtUrl"
          @reveal="revealed = true"
          @rate="onRate"
          @speak="speakCurrent"
          @art-error="markArtBroken"
        />

        <nav class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            class="kr-btn-ghost-plain"
            :disabled="stepIndex === 0"
            @click="back"
          >
            <Icon name="kind-icon:back" class="kr-icon-4" />
            Back
          </button>

          <NuxtLink
            v-if="currentLesson"
            :to="lessonLink(currentLesson.key)"
            class="kr-btn-ghost-xs-plain"
            title="Open the full reference page for this word"
          >
            Full lesson
          </NuxtLink>

          <!-- The recall beat advances by rating, never by Continue: a card you can skip
               past without answering is not a recall test. -->
          <button
            v-if="currentStep?.kind === 'done'"
            type="button"
            class="kr-btn-primary-md-plain"
            @click="finish"
          >
            Done
          </button>
          <button
            v-else-if="!awaitingRating"
            type="button"
            class="kr-btn-primary-md-plain"
            @click="next"
          >
            Continue
            <Icon name="kind-icon:forward" class="kr-icon-4" />
          </button>
          <span v-else class="kr-text-faded-xs">Rate it to continue</span>
        </nav>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  useMandarinTutorStore,
  type StudyRating,
} from '@/stores/mandarinTutorStore'
import {
  buildCoursePlan,
  courseProgress,
  runTeachesAnything,
} from '@/utils/mandarinCourse'
import type { MandarinLesson } from '@/utils/mandarinLesson'

const INTRO_SEEN_KEY = 'kind-robots:mandarin-course:intro-seen:v1'

/**
 * How many words one session teaches.
 *
 * A session has to end somewhere: a progress bar reading "0 of 500" is not encouragement,
 * it is a wall. Eight is small enough to finish in a sitting and large enough to be worth
 * sitting down for. Ending is not a cap on studying -- the closing screen offers another
 * session immediately -- it is just a place to stop, which is the opposite of the endless
 * drip Silas ruled out.
 */
const SESSION_WORD_TARGET = 8

const store = useMandarinTutorStore()
const {
  cards,
  loading,
  initialized,
  selectedSet,
  studyCards,
  pointTotals,
  lastAward,
  studyDiagnostics,
  completedLessonKeys,
} = storeToRefs(store)

const running = ref(false)
const stepIndex = ref(0)
const revealed = ref(false)
const introDismissed = ref(false)
const forceIntro = ref(false)
const brokenArtKeys = ref<Set<string>>(new Set())

const dueCount = computed(() => studyDiagnostics.value?.dueCount ?? 0)

/**
 * The words this session teaches: unlearned first, then already-learned ones as review.
 *
 * Deck order is preserved within each group rather than shuffled. A curated beginner deck
 * is already ordered by usefulness, and randomising it would throw that away for the sake
 * of variety nobody asked for.
 */
const sessionLessons = computed<MandarinLesson[]>(() => {
  const learned = completedLessonKeys.value
  const fresh: string[] = []
  const review: string[] = []

  for (const card of studyCards.value) {
    ;(learned.has(card.key) ? review : fresh).push(card.key)
  }

  return [...fresh, ...review]
    .slice(0, SESSION_WORD_TARGET)
    .map((key) => store.lessonFor(key))
    .filter((lesson): lesson is MandarinLesson => Boolean(lesson))
})

const showIntro = computed(
  () =>
    forceIntro.value ||
    (!introDismissed.value && !completedLessonKeys.value.size),
)

const startLabel = computed(() => {
  if (!sessionLessons.value.length) return 'Nothing to study'
  if (showIntro.value) return 'Start learning'
  return 'Begin session'
})

// Frozen when the session begins: the plan must not resurrect or reorder itself
// underneath the learner when completeLesson() lands and completedLessonKeys changes.
const plan = ref<ReturnType<typeof buildCoursePlan>>([])

const currentStep = computed(() => plan.value[stepIndex.value] ?? null)

const currentLesson = computed<MandarinLesson | null>(() => {
  const step = currentStep.value
  if (!step || step.kind !== 'word') return null
  return store.lessonFor(step.cardKey)
})

/** True when the current word's run is a bare recall, i.e. a review of a known word. */
const currentIsReview = computed(() => {
  const step = currentStep.value
  if (!step || step.kind !== 'word') return false
  const run = plan.value.filter(
    (entry) => entry.kind === 'word' && entry.cardKey === step.cardKey,
  )
  return !runTeachesAnything(run)
})

const awaitingRating = computed(
  () =>
    currentStep.value?.kind === 'word' && currentStep.value.beat === 'recall',
)

const progress = computed(() => courseProgress(plan.value, stepIndex.value))

const currentArtUrl = computed(() => {
  const key = currentLesson.value?.key
  if (!key || brokenArtKeys.value.has(key)) return ''
  return store.illustrationUrl(key) || store.canonicalArtUrls[key] || ''
})

function markArtBroken(cardKey: string) {
  if (brokenArtKeys.value.has(cardKey)) return
  brokenArtKeys.value = new Set(brokenArtKeys.value).add(cardKey)
}

function lessonLink(key: string): string {
  return `/play/mandarin/learn/${encodeURIComponent(key)}`
}

function readIntroSeen(): boolean {
  if (!import.meta.client) return false
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    // Private windows and blocked site data throw here. Losing the flag only means the
    // orientation is offered again, which is harmless.
    return false
  }
}

function writeIntroSeen() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // Same: not worth surfacing.
  }
}

function begin() {
  if (!sessionLessons.value.length) return
  plan.value = buildCoursePlan({
    lessons: sessionLessons.value,
    learnedKeys: completedLessonKeys.value,
    includeIntro: showIntro.value,
  })
  stepIndex.value = 0
  revealed.value = false
  running.value = true

  if (showIntro.value) {
    introDismissed.value = true
    forceIntro.value = false
    writeIntroSeen()
  }
}

function replayIntro() {
  forceIntro.value = true
  begin()
}

function quit() {
  running.value = false
  plan.value = []
  stepIndex.value = 0
  revealed.value = false
}

function finish() {
  quit()
  void store.loadStudyDiagnostics()
}

function advance() {
  revealed.value = false
  if (stepIndex.value < plan.value.length - 1) stepIndex.value += 1
}

function next() {
  const step = currentStep.value

  // Reaching a word's recall beat means its teaching screens have all been shown, which
  // is the honest moment to record the lesson as read. A bare-recall review run has no
  // teaching screens, so it claims nothing -- the server enforces once-per-card too, but
  // the client should not send a claim it knows is empty.
  const upcoming = plan.value[stepIndex.value + 1]
  if (
    upcoming?.kind === 'word' &&
    upcoming.beat === 'recall' &&
    step?.kind === 'word' &&
    !currentIsReview.value
  ) {
    void store.completeLesson(upcoming.cardKey)
  }

  advance()
}

function back() {
  revealed.value = false
  if (stepIndex.value > 0) stepIndex.value -= 1
}

function onRate(rating: StudyRating) {
  const step = currentStep.value
  if (!step || step.kind !== 'word' || step.beat !== 'recall') return
  store.rateCard(step.cardKey, rating)
  advance()
}

function speakCurrent() {
  const key = currentLesson.value?.key
  if (!key) return
  void store.speak(cards.value.find((card) => card.key === key) ?? null)
}

// The art probe is per-card and lazy in the store; nudge it as the learner arrives so the
// illustration is there by the time the "meet it" screen renders rather than after.
watch(
  () => currentLesson.value?.key ?? null,
  (key) => {
    if (key) void store.probeCanonicalIllustration(key)
  },
)

onMounted(async () => {
  introDismissed.value = readIntroSeen()
  await store.initialize()
})

useHead({
  title: 'Mandarin Tutor · Kind Robots',
})
</script>
