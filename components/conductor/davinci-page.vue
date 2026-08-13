<!-- /components/conductor/davinci-page.vue -->
<template>
  <project-front-page class="kr-surface" slug="davinci" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:castle" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Live a life
          </h3>
        </div>

        <div
          v-if="errorMessage"
          role="alert"
          class="alert alert-warning rounded-2xl text-sm"
        >
          <Icon name="kind-icon:warning" class="size-5" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Logged out -->
        <div
          v-if="!userStore.isLoggedIn"
          class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/40 px-6 py-10 text-center"
        >
          <Icon name="kind-icon:castle" class="size-9 text-primary/50" />
          <p class="max-w-md text-sm text-base-content/65">
            Log in to seed a life, make choices, and leave a legacy.
          </p>
          <NuxtLink to="/login" class="btn btn-primary btn-sm rounded-xl">
            Log in to play
          </NuxtLink>
        </div>

        <!-- Resuming an existing run -->
        <div
          v-else-if="phase === 'loading'"
          class="h-40 animate-pulse rounded-2xl border border-base-300 bg-base-200"
        />

        <!-- Start a new life -->
        <form
          v-else-if="phase === 'start'"
          class="flex flex-col gap-3"
          @submit.prevent="startLife"
        >
          <p class="text-sm text-base-content/70">
            Seed a fresh life. You'll move through a run of chapters, each
            choice nudging your legacy, wealth, love, wisdom, health, freedom,
            fame, creation, community, and mystery — then your story resolves
            into one of many possible endings.
          </p>
          <label class="form-control w-full max-w-sm">
            <span class="label-text mb-1 text-xs font-semibold"
              >Protagonist name (optional)</span
            >
            <input
              v-model="protagonistName"
              type="text"
              maxlength="255"
              placeholder="Who are you?"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>
          <label class="form-control w-full max-w-sm">
            <span class="label-text mb-1 text-xs font-semibold"
              >Genre (optional)</span
            >
            <input
              v-model="genre"
              type="text"
              maxlength="255"
              placeholder="e.g. quiet epic, folk tale, heist"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>
          <button
            type="submit"
            class="btn btn-primary btn-sm w-fit gap-1.5 rounded-xl"
            :disabled="submitting"
          >
            <span
              v-if="submitting"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:sparkles" class="size-4" />
            Begin a life
          </button>
        </form>

        <!-- Playing -->
        <div v-else-if="phase === 'playing' && run" class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p
              class="text-sm font-black uppercase tracking-wide text-base-content/60"
            >
              {{ run.protagonistName || run.title }}
            </p>
            <p class="text-xs font-semibold text-base-content/50">
              <template v-if="narrationMode === 'ai'">
                Chapter {{ chapterIndex }}
                <span v-if="narratorName" class="text-base-content/40"
                  >· narrated by {{ narratorName }}</span
                >
              </template>
              <template v-else>
                Chapter {{ Math.min(chapterIndex, chapterCount) }} of
                {{ chapterCount }}
              </template>
            </p>
            <button
              type="button"
              class="btn btn-ghost btn-xs gap-1 rounded-lg text-base-content/40 normal-case hover:text-error"
              :disabled="submitting"
              @click="abandonRun"
            >
              <Icon name="kind-icon:close" class="size-3.5" />
              Abandon this life
            </button>
          </div>

          <div class="grid grid-cols-5 gap-2 sm:grid-cols-10">
            <div
              v-for="dim in DAVINCI_DIMENSIONS"
              :key="dim"
              class="flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center"
              :class="dimensionPillClass(statMap[dim] ?? 0)"
              :title="`${DIMENSION_LABELS[dim]}: ${statMap[dim] ?? 0}`"
            >
              <span
                class="text-[0.55rem] font-black uppercase tracking-wide text-base-content/60"
              >
                {{ DIMENSION_LABELS[dim] }}
              </span>
              <span
                class="text-xs font-black"
                :class="dimensionValueClass(statMap[dim] ?? 0)"
                >{{ statMap[dim] ?? 0 }}</span
              >
            </div>
          </div>

          <!-- Narrator is composing this chapter -->
          <div
            v-if="narrating"
            class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-8 text-center"
          >
            <span class="loading loading-dots loading-lg text-primary/70" />
            <p class="text-xs font-semibold text-base-content/50">
              {{ narratorName || 'The narrator' }} is writing chapter
              {{ chapterIndex }}…
            </p>
          </div>

          <!-- Narration failed. Per the narration-layer spec a broken chapter
               surfaces a visible retry rather than a silently fabricated one,
               so the curated pool is offered as an explicit, labelled choice
               instead of a transparent fallback. -->
          <div
            v-else-if="narrationError"
            class="flex flex-col items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center"
          >
            <Icon name="kind-icon:warning" class="size-8 text-warning/70" />
            <p class="text-sm text-base-content/70">
              The narrator is having trouble with this chapter.
            </p>
            <p class="text-xs text-base-content/50">{{ narrationError }}</p>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                class="btn btn-primary btn-sm gap-1.5 rounded-xl"
                :disabled="narrating"
                @click="narrateChapter()"
              >
                <Icon name="kind-icon:refresh" class="size-4" />
                Try again
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm rounded-xl"
                @click="useCuratedChapters"
              >
                Play the written chapters instead
              </button>
            </div>
          </div>

          <div
            v-else-if="currentChapter"
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4"
          >
            <h4 v-if="currentChapter.title" class="text-base font-black">
              {{ currentChapter.title }}
            </h4>
            <NarrativeArtStatus
              v-if="currentChapterArt"
              :art="currentChapterArt"
              :label="`Illustration for chapter ${chapterIndex}`"
              @retry="retryCurrentChapterArt"
            />
            <p
              class="whitespace-pre-line text-sm leading-relaxed text-base-content/75"
            >
              {{ currentChapter.narrative }}
            </p>
            <div class="flex flex-col gap-2">
              <button
                v-for="choice in currentChapter.choices"
                :key="choice.label"
                type="button"
                class="btn btn-outline btn-sm h-auto min-h-8 justify-start whitespace-normal rounded-xl py-1.5 text-left normal-case"
                :disabled="submitting"
                @click="chooseOption(choice)"
              >
                {{ choice.label }}
              </button>
            </div>
            <p
              v-if="currentChapter.milestoneCandidate"
              class="text-[0.65rem] italic text-base-content/40"
            >
              This life seems headed toward
              {{ currentChapter.milestoneCandidate }}.
            </p>
          </div>

          <!-- The run may be ended any time after chapter 3 (narration-layer
               spec): enough chapters for a meaningful spread of dimensions.
               The narrator never decides when a life ends — the player does. -->
          <div
            v-if="!narrating && (canEndRun || !currentChapter)"
            class="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
          >
            <Icon name="kind-icon:trophy" class="size-8 text-primary/70" />
            <p class="text-sm text-base-content/70">
              {{
                currentChapter
                  ? 'You can keep living, or draw the line here and see what it all added up to.'
                  : "Your chapters are told. It's time to see how this life resolves."
              }}
            </p>
            <button
              type="button"
              class="btn btn-primary btn-sm gap-1.5 rounded-xl"
              :disabled="submitting"
              @click="resolveLife"
            >
              <span
                v-if="submitting"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:trophy" class="size-4" />
              See your ending
            </button>
          </div>
        </div>

        <!-- Ending -->
        <div
          v-else-if="phase === 'ending' && endingData"
          class="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
        >
          <span
            class="badge badge-sm rounded-lg font-black"
            :class="victoryBadgeClass(endingData.victoryType)"
          >
            {{ endingData.victoryType }}
          </span>
          <h4 class="text-xl font-black">{{ endingData.title }}</h4>
          <NarrativeArtStatus
            v-if="endingArt"
            class="w-full max-w-md"
            :art="endingArt"
            :label="`Illustration for how ${run?.protagonistName || 'this life'} ended`"
            @retry="retryEndingArt"
          />
          <p class="max-w-md text-sm text-base-content/70">
            {{ endingData.summary }}
          </p>
          <p v-if="awardedNote" class="text-xs font-semibold text-success">
            {{ awardedNote }}
          </p>
          <button
            type="button"
            class="btn btn-outline btn-sm gap-1.5 rounded-xl"
            @click="playAgain"
          >
            <Icon name="kind-icon:refresh" class="size-4" />
            Live another life
          </button>
        </div>
      </section>

      <section
        class="flex flex-col items-start gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:trophy" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Endings on record
          </h3>
        </div>
        <p class="text-sm text-base-content/70">
          Each life resolves into one of the seeded endings below — reach it
          once and the matching achievement is yours for good.
        </p>
        <p v-if="totalEndings > 0" class="text-xs text-base-content/60">
          {{ totalEndings }} ending{{ totalEndings === 1 ? '' : 's' }} seeded so
          far.
        </p>
        <ul v-if="recentEndings.length" class="flex flex-col gap-1">
          <li v-for="ending in recentEndings" :key="ending.id">
            <span class="text-sm text-base-content/80">{{ ending.label }}</span>
          </li>
        </ul>
      </section>
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useAchievementStore } from '@/stores/achievementStore'
import { createNarrativeArtJobsController } from '@/stores/helpers/narrativeArtJobsHelper'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'

// Mirrors server/utils/davinci.ts DAVINCI_DIMENSIONS — bit order is a
// display concern here (the server owns the real resolve math), but keeping
// the same order avoids a confusing mismatch with the ending's outcomeKey.
const DIMENSION_LABELS: Record<string, string> = {
  legacy: 'Legacy',
  wealth: 'Wealth',
  love: 'Love',
  wisdom: 'Wisdom',
  health: 'Health',
  freedom: 'Freedom',
  fame: 'Fame',
  creation: 'Creation',
  community: 'Community',
  mystery: 'Mystery',
}
const DAVINCI_DIMENSIONS = Object.keys(DIMENSION_LABELS)

interface LifeChoiceOption {
  label: string
  effects: Record<string, number>
}
interface LifeChapterDef {
  key: string
  title: string
  narrative: string
  choices: LifeChoiceOption[]
}

// A curated pool of chapters, each built around one of the design brief's
// narrative device patterns (docs/design-brief.md in the conductor repo).
// Effects are deltas on arbitrary LifeStat keys; the server only reads the
// 10 DAVINCI_DIMENSIONS at resolve time, so every choice here stays inside
// that vocabulary.
const CHAPTERS: LifeChapterDef[] = [
  {
    key: 'the-spark',
    title: 'The Spark',
    narrative:
      'A merchant offers you an apprenticeship that promises quick coin, but the trade is grueling and keeps you from the family workshop where your name might have been remembered.',
    choices: [
      {
        label: 'Take the quick coin',
        effects: { wealth: 2, health: -1, legacy: -1 },
      },
      {
        label: 'Stay and learn the family craft',
        effects: { legacy: 2, creation: 1, wealth: -1 },
      },
      {
        label: 'Split your time between both',
        effects: { wealth: 1, legacy: 1, health: -1 },
      },
    ],
  },
  {
    key: 'the-bargain',
    title: 'The Bargain',
    narrative:
      'Your village asks you to give up your wandering season to help rebuild after the flood.',
    choices: [
      {
        label: 'Stay and rebuild together',
        effects: { community: 2, freedom: -1 },
      },
      {
        label: "Leave as planned — they'll manage",
        effects: { freedom: 2, community: -1 },
      },
      {
        label: 'Send resources instead of yourself',
        effects: { community: 1, wealth: -1 },
      },
    ],
  },
  {
    key: 'the-mentor',
    title: 'The Mentor',
    narrative:
      'A wandering robot elder offers to teach you a forgotten craft, if you can sit with its riddles.',
    choices: [
      {
        label: 'Study every riddle patiently',
        effects: { wisdom: 2, mystery: 1 },
      },
      {
        label: 'Learn quickly and move on',
        effects: { creation: 1, wisdom: 1 },
      },
      {
        label: 'Politely decline — you trust your own path',
        effects: { freedom: 1, wisdom: -1 },
      },
    ],
  },
  {
    key: 'the-dream-gate',
    title: 'The Dream Gate',
    narrative:
      "A recurring dream shows a door that isn't there. Tonight, you could try to open it.",
    choices: [
      {
        label: 'Step through',
        effects: { mystery: 2, creation: 1, health: -1 },
      },
      {
        label: 'Sketch what you saw instead',
        effects: { creation: 2, mystery: 1 },
      },
      { label: 'Ignore it and sleep', effects: { health: 1, mystery: -1 } },
    ],
  },
  {
    key: 'the-false-victory',
    title: 'The False Victory',
    narrative:
      'Your work wins public acclaim, but the celebration keeps you from the people who knew you before it.',
    choices: [
      { label: 'Chase the acclaim further', effects: { fame: 2, love: -1 } },
      { label: 'Go home instead', effects: { love: 2, fame: -1 } },
      { label: 'Try to hold both', effects: { fame: 1, love: 1, health: -1 } },
    ],
  },
  {
    key: 'the-return',
    title: 'The Return',
    narrative:
      'You pass the crossroads where you once made a choice you still think about.',
    choices: [
      {
        label: 'Make the opposite choice this time',
        effects: { wisdom: 2, freedom: 1 },
      },
      {
        label: "Confirm you'd choose the same",
        effects: { legacy: 2, wisdom: 1 },
      },
      {
        label: 'Walk past without looking back',
        effects: { freedom: 1, wisdom: -1 },
      },
    ],
  },
  {
    key: 'the-inheritance',
    title: 'The Inheritance',
    narrative:
      'What you build now, someone else will inherit — a student, a child, a town.',
    choices: [
      {
        label: 'Build for the next generation',
        effects: { legacy: 2, community: 1, wealth: -1 },
      },
      { label: 'Build for yourself, now', effects: { wealth: 2, legacy: -1 } },
      {
        label: 'Build for no one — build for the joy of it',
        effects: { creation: 2, legacy: -1 },
      },
    ],
  },
  {
    key: 'the-collapse',
    title: 'The Collapse',
    narrative:
      'The dimension you have neglected most starts to fail — your body, or your standing, or your circle. Something buckles.',
    choices: [
      {
        label: 'Rest and recover, whatever the cost',
        effects: { health: 2, wealth: -1 },
      },
      { label: 'Push through it', effects: { freedom: 1, health: -2 } },
      { label: 'Ask for help', effects: { community: 1, health: 1 } },
    ],
  },
]
const chapterCount = CHAPTERS.length

interface LifeStatRow {
  key: string
  value: number
}
interface LifeChoiceRow {
  id: number
  chapter: number
}
interface LifeEndingData {
  id: number
  title: string
  slug: string
  summary: string
  victoryType: 'VICTORY' | 'FAILURE' | 'MIXED' | 'SECRET'
}
// Mirrors the LifeRunArt row shape server/utils/davinci.ts's getLifeRunForUser
// returns, joined with just enough ArtImage to resolve a display path.
interface LifeRunArtRow {
  id: number
  chapter: number | null
  sceneType: string
  prompt: string
  artImageId: number
  ArtImage: { imagePath: string | null; path: string | null } | null
}
interface LifeRunRecord {
  id: number
  title: string
  status: 'ACTIVE' | 'COMPLETE' | 'ABANDONED'
  protagonistName: string | null
  outcomeKey: string | null
  Stats: LifeStatRow[]
  Choices: LifeChoiceRow[]
  Ending: LifeEndingData | null
  Art?: LifeRunArtRow[]
}
interface ChoiceResponseData {
  stats: LifeStatRow[]
}

// Mirrors DaVinciNarrationResult in server/utils/davinciNarration.ts. The
// server has already clamped every delta and rejected any dimension outside
// DAVINCI_DIMENSIONS by the time this reaches the client — nothing here
// re-derives effects, it only passes the chosen option's validated `effects`
// straight through to POST /choices.
interface NarrationChoice {
  id: string
  choiceText: string
  effects: Record<string, number>
}
interface NarrationResponseData {
  narrativeText: string
  choices: NarrationChoice[]
  artPrompt: string | null
  milestoneCandidate: string | null
  chapter: number
  narrator: string
}

// The unified shape the template renders, whichever source produced it.
interface ActiveChapter {
  title: string | null
  narrative: string
  choices: LifeChoiceOption[]
  milestoneCandidate: string | null
}

// Chapters may be told by the narrator ('ai') or drawn from the curated pool
// ('curated'). Curated is never entered silently — the player either picks it
// after a narration failure, or the run has no narrator available.
type NarrationMode = 'ai' | 'curated'

// A run can be ended any time after this many recorded chapters.
const MIN_CHAPTERS_BEFORE_ENDING = 3

const STORAGE_KEY = 'davinci-active-life-run-id'

const userStore = useUserStore()
const achievementStore = useAchievementStore()

const phase = ref<'loading' | 'start' | 'playing' | 'ending'>('loading')
const run = ref<LifeRunRecord | null>(null)
const statMap = ref<Record<string, number>>({})
const playedCount = ref(0)
const endingData = ref<LifeEndingData | null>(null)
const awardedNote = ref<string | null>(null)
const errorMessage = ref('')
const submitting = ref(false)

const protagonistName = ref('')
const genre = ref('')

const narrationMode = ref<NarrationMode>('ai')
const narrating = ref(false)
const narrationError = ref('')
const narratorName = ref('')
const aiChapter = ref<ActiveChapter | null>(null)

// Contextual in-run art (davinci/t-020). The narrator proposes an artPrompt
// per chapter and the resolve screen synthesizes one for the ending; both are
// requested through the same shared /api/art/enqueue narrativeContext
// pipeline Storybook and Taskmaster already use (product: 'davinci'), then
// persisted as a LifeRunArt row once the queued job resolves to a real
// ArtImage — see server/utils/davinci.ts's attachLifeRunArt. Reading/choosing
// never blocks on this: chapterArt/endingArt render a pending/skeleton state
// via <NarrativeArtStatus> until the illustration is ready.
const narrativeArtJobs = createNarrativeArtJobsController()
const chapterArt = ref<Record<number, NarrativeArtJobState>>({})
const endingArt = ref<NarrativeArtJobState | null>(null)
const lastArtPrompt = ref<string | null>(null)

const chapterIndex = computed(() => playedCount.value + 1)

const curatedChapter = computed<ActiveChapter | null>(() => {
  if (chapterIndex.value > chapterCount) return null
  const def = CHAPTERS[chapterIndex.value - 1]
  if (!def) return null
  return {
    title: def.title,
    narrative: def.narrative,
    choices: def.choices,
    milestoneCandidate: null,
  }
})

const currentChapter = computed<ActiveChapter | null>(() =>
  narrationMode.value === 'ai' ? aiChapter.value : curatedChapter.value,
)

const canEndRun = computed(
  () => playedCount.value >= MIN_CHAPTERS_BEFORE_ENDING,
)

const currentChapterArt = computed<NarrativeArtJobState | undefined>(
  () => chapterArt.value[chapterIndex.value],
)

function retryCurrentChapterArt() {
  const chapter = chapterIndex.value
  const art = chapterArt.value[chapter]
  if (!art) return
  narrativeArtJobs.retry(art, (next) => updateChapterArt(chapter, next))
}

function retryEndingArt() {
  if (!endingArt.value) return
  narrativeArtJobs.retry(endingArt.value, updateEndingArt)
}

function statsToMap(stats: LifeStatRow[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const stat of stats) map[stat.key] = stat.value
  return map
}

function victoryBadgeClass(type: LifeEndingData['victoryType']) {
  switch (type) {
    case 'VICTORY':
      return 'badge-success'
    case 'FAILURE':
      return 'badge-error'
    case 'SECRET':
      return 'badge-secondary'
    default:
      return 'badge-warning'
  }
}

// The dimension grid previously only distinguished "has any positive value"
// (success green) from everything else, including dimensions the player has
// actively driven negative (health: -2 in "The Collapse", wealth: -1 in "The
// Spark", etc. — several curated chapters have negative-effect choices by
// design). A negative dimension looked identical to an untouched, neutral
// one, so a player watching their stats had no visual signal that a choice
// had cost them something until they read the small numeral. Three-way tone
// now matches the shared status-tint formula (border-{status}/40 +
// bg-{status}/10) already used for success here and for .kr-note elsewhere.
function dimensionPillClass(value: number): string {
  if (value >= 1) return 'border-success/40 bg-success/10'
  if (value < 0) return 'border-error/40 bg-error/10'
  return 'border-base-300 bg-base-200/40'
}

function dimensionValueClass(value: number): string {
  if (value >= 1) return 'text-success'
  if (value < 0) return 'text-error'
  return ''
}

// Best-effort: the illustration is decorative, so a failed attach never
// surfaces an error to the player — the run keeps working either way.
async function persistLifeRunArt(
  chapter: number | null,
  sceneType: 'THRESHOLD' | 'ENDING',
  prompt: string,
  artImageId: number,
) {
  if (!run.value) return
  await performFetch(`/api/davinci/runs/${run.value.id}/art`, {
    method: 'POST',
    body: JSON.stringify({ chapter, sceneType, prompt, artImageId }),
  }).catch(() => null)
}

function updateChapterArt(chapter: number, art: NarrativeArtJobState) {
  const wasDone = chapterArt.value[chapter]?.status === 'done'
  chapterArt.value = { ...chapterArt.value, [chapter]: art }
  if (!wasDone && art.status === 'done' && art.artImageId) {
    void persistLifeRunArt(
      chapter,
      'THRESHOLD',
      art.promptString,
      art.artImageId,
    )
  }
}

function updateEndingArt(art: NarrativeArtJobState) {
  const wasDone = endingArt.value?.status === 'done'
  endingArt.value = art
  if (!wasDone && art.status === 'done' && art.artImageId) {
    void persistLifeRunArt(null, 'ENDING', art.promptString, art.artImageId)
  }
}

// Chapter-transition art (sceneType THRESHOLD): requested once per chapter,
// the moment the narrator proposes a non-null artPrompt for it. Skipped for
// chapters that already have art (a resumed run's hydrated rows, or a
// duplicate narrate() call for the same chapter).
function requestChapterArt(chapter: number, artPrompt: string) {
  if (!run.value || chapterArt.value[chapter]) return
  void narrativeArtJobs.enqueue(
    {
      product: 'davinci',
      sessionId: `davinci-run-${run.value.id}`,
      beatId: `chapter-${chapter}`,
      moment: 'chapter',
      narrative: artPrompt,
      title: run.value.protagonistName || run.value.title,
    },
    (art) => updateChapterArt(chapter, art),
  )
}

// Ending art (sceneType ENDING): a personalized illustration of this specific
// run's outcome, distinct from the shared per-outcomeKey ending art seeded by
// scripts/generate_davinci_endings.py. Prefers the narrator's last proposed
// artPrompt (the freshest visual detail for how this life was trending);
// falls back to a synthesized prompt from the ending itself when no chapter
// ever proposed one (e.g. the curated fallback pool, which has no narrator).
function requestEndingArt() {
  if (!run.value || !endingData.value || endingArt.value) return
  const ending = endingData.value
  const artPrompt =
    lastArtPrompt.value ||
    `The moment this life resolved: ${ending.title} — ${ending.summary}`
  void narrativeArtJobs.enqueue(
    {
      product: 'davinci',
      sessionId: `davinci-run-${run.value.id}`,
      beatId: `ending-${run.value.id}`,
      moment: 'finale',
      narrative: artPrompt,
      title: run.value.protagonistName || run.value.title,
      objective: ending.title,
    },
    updateEndingArt,
  )
}

// Rehydrates already-attached LifeRunArt rows into displayable, terminal
// ('done') job states — no polling needed, the image is already resolved.
function hydrateArtFromRun(data: LifeRunRecord) {
  chapterArt.value = {}
  endingArt.value = null
  const timestamp = new Date().toISOString()
  for (const row of data.Art ?? []) {
    const imagePath = row.ArtImage?.imagePath || row.ArtImage?.path || null
    const state: NarrativeArtJobState = {
      dedupeKey: `davinci:${data.id}:${row.sceneType}:${row.chapter ?? 'ending'}:${row.id}`,
      product: 'davinci',
      sessionId: `davinci-run-${data.id}`,
      beatId: row.chapter ? `chapter-${row.chapter}` : `ending-${data.id}`,
      moment: row.sceneType === 'ENDING' ? 'finale' : 'chapter',
      surface: 'scene-landscape',
      profileKey: 'davinci-narrative-krea4',
      promptString: row.prompt,
      status: 'done',
      artImageId: row.artImageId,
      imagePath,
      error: null,
      requestedAt: timestamp,
      updatedAt: timestamp,
    }
    if (row.sceneType === 'ENDING') {
      endingArt.value = state
    } else if (row.chapter) {
      chapterArt.value[row.chapter] = state
    }
  }
}

async function resumeRun(id: number) {
  phase.value = 'loading'
  const response = await performFetch<LifeRunRecord>(`/api/davinci/runs/${id}`)
  if (!response.success || !response.data) {
    localStorage.removeItem(STORAGE_KEY)
    phase.value = 'start'
    return
  }

  run.value = response.data
  statMap.value = statsToMap(response.data.Stats || [])
  playedCount.value = response.data.Choices?.length ?? 0
  hydrateArtFromRun(response.data)

  if (response.data.status === 'COMPLETE' && response.data.Ending) {
    endingData.value = response.data.Ending
    phase.value = 'ending'
    requestEndingArt()
  } else {
    phase.value = 'playing'
    if (narrationMode.value === 'ai') await narrateChapter()
  }
}

async function startLife() {
  submitting.value = true
  errorMessage.value = ''

  const title = protagonistName.value.trim() || 'An Unwritten Life'
  const response = await performFetch<LifeRunRecord>('/api/davinci/runs', {
    method: 'POST',
    body: JSON.stringify({
      title,
      protagonistName: protagonistName.value.trim() || null,
      genre: genre.value.trim() || null,
    }),
  })

  submitting.value = false

  if (!response.success || !response.data) {
    errorMessage.value = response.message || 'Could not start a new life.'
    return
  }

  run.value = response.data
  statMap.value = {}
  playedCount.value = 0
  endingData.value = null
  awardedNote.value = null
  localStorage.setItem(STORAGE_KEY, String(response.data.id))
  phase.value = 'playing'
  if (narrationMode.value === 'ai') await narrateChapter()
}

// Asks the narration layer for the current chapter. Writes nothing — the
// returned effects only reach the database when the player picks an option and
// chooseOption() posts it to /choices.
async function narrateChapter() {
  if (!run.value) return
  narrating.value = true
  narrationError.value = ''
  aiChapter.value = null

  const response = await performFetch<NarrationResponseData>(
    `/api/davinci/runs/${run.value.id}/narrate`,
    {
      method: 'POST',
      body: JSON.stringify({ chapter: chapterIndex.value }),
    },
  )

  narrating.value = false

  if (!response.success || !response.data) {
    narrationError.value =
      response.message || 'The narrator could not be reached.'
    return
  }

  narratorName.value = response.data.narrator || ''
  aiChapter.value = {
    title: null,
    narrative: response.data.narrativeText,
    choices: response.data.choices.map((choice) => ({
      label: choice.choiceText,
      effects: choice.effects,
    })),
    milestoneCandidate: response.data.milestoneCandidate,
  }

  if (response.data.artPrompt) {
    lastArtPrompt.value = response.data.artPrompt
    requestChapterArt(response.data.chapter, response.data.artPrompt)
  }
}

function useCuratedChapters() {
  narrationMode.value = 'curated'
  narrationError.value = ''
  aiChapter.value = null
}

async function chooseOption(choice: LifeChoiceOption) {
  const chapter = currentChapter.value
  if (!run.value || !chapter) return
  submitting.value = true
  errorMessage.value = ''

  const response = await performFetch<ChoiceResponseData>(
    `/api/davinci/runs/${run.value.id}/choices`,
    {
      method: 'POST',
      body: JSON.stringify({
        chapter: chapterIndex.value,
        prompt: chapter.narrative,
        choiceText: choice.label,
        effects: choice.effects,
      }),
    },
  )

  submitting.value = false

  if (!response.success || !response.data) {
    errorMessage.value =
      response.message || 'That choice did not land — try again.'
    return
  }

  statMap.value = statsToMap(response.data.stats || [])
  playedCount.value += 1

  if (narrationMode.value === 'ai') await narrateChapter()
}

async function resolveLife() {
  if (!run.value) return
  submitting.value = true
  errorMessage.value = ''

  const response = await performFetch<{
    achievementAwarded: boolean
    lifeAchievementAwarded: boolean
  }>(`/api/davinci/runs/${run.value.id}/resolve`, { method: 'POST' })

  if (!response.success) {
    submitting.value = false
    errorMessage.value = response.message || 'Could not resolve this life yet.'
    return
  }

  awardedNote.value =
    response.data?.achievementAwarded || response.data?.lifeAchievementAwarded
      ? 'A new achievement joins your record.'
      : null

  await resumeRun(run.value.id)
  await achievementStore.fetchAchievements()
  submitting.value = false
}

function playAgain() {
  localStorage.removeItem(STORAGE_KEY)
  run.value = null
  statMap.value = {}
  playedCount.value = 0
  endingData.value = null
  awardedNote.value = null
  protagonistName.value = ''
  genre.value = ''
  errorMessage.value = ''
  narrationMode.value = 'ai'
  narrationError.value = ''
  aiChapter.value = null
  chapterArt.value = {}
  endingArt.value = null
  lastArtPrompt.value = null
  phase.value = 'start'
}

// The only way to leave an in-progress run used to be manually clearing
// STORAGE_KEY from localStorage — never exposed in the UI. This gives players
// a real exit before MIN_CHAPTERS_BEFORE_ENDING, gated behind a confirm since
// it discards real progress. Reuses playAgain()'s reset logic rather than
// duplicating it.
function abandonRun() {
  if (submitting.value) return
  const confirmed = window.confirm(
    'Abandon this life and start over? This discards your progress so far.',
  )
  if (!confirmed) return
  playAgain()
}

onMounted(() => {
  achievementStore.fetchAchievements()

  if (!userStore.isLoggedIn) {
    phase.value = 'start'
    return
  }

  const storedId = localStorage.getItem(STORAGE_KEY)
  if (storedId) {
    resumeRun(Number(storedId))
  } else {
    phase.value = 'start'
  }
})

const davinciEndingAchievements = computed(() =>
  achievementStore.achievements.filter((achievement) =>
    achievement.triggerCode?.startsWith('davinci-ending-'),
  ),
)
const totalEndings = computed(() => davinciEndingAchievements.value.length)
const recentEndings = computed(() =>
  davinciEndingAchievements.value.slice(0, 3),
)

const config: ProjectFrontConfig = {
  slug: 'davinci',
  title: 'Da Vinci',
  channelKey: 'wonder',
  tabKey: 'davinci',
  icon: 'kind-icon:castle',
  tagline: 'Live a life. Leave a legacy.',
  description:
    'A generative life-and-legacy simulation. Each run seeds a life of ambition and craft, advances through chapters of choices that move your stats, collects art along the way, and resolves into an ending — with hundreds of achievements tracking every mark you leave.',
  launch: {
    label: 'Begin a life',
    href: '/play/davinci',
    icon: 'kind-icon:sparkles',
  },
  stats: [
    { label: 'achievements', value: '1000+', icon: 'kind-icon:trophy' },
    { label: 'endings', value: 'many', icon: 'kind-icon:book' },
  ],
  sections: [
    {
      key: 'choices',
      title: 'Chapters of choice',
      body: 'Every decision nudges your stats and bends the story toward a different legacy.',
      icon: 'kind-icon:map',
    },
    {
      key: 'legacy',
      title: 'A legacy that remembers',
      body: 'Runs collect generated art and unlock achievements that persist across lives.',
      icon: 'kind-icon:trophy',
    },
  ],
  deliverables: {
    done: [
      'Life-run schema (runs, choices, stats, endings, achievements)',
      'Da Vinci API surface',
      'Playable run UI',
      'Contextual chapter and ending art',
    ],
    next: ['Achievement gallery'],
  },
}
</script>
