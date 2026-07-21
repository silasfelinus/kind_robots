<!-- /components/conductor/davinci-page.vue -->
<template>
  <ProjectFrontPage slug="davinci" :fallback="config">
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
              Chapter {{ Math.min(chapterIndex, chapterCount) }} of
              {{ chapterCount }}
            </p>
          </div>

          <div class="grid grid-cols-5 gap-2 sm:grid-cols-10">
            <div
              v-for="dim in DAVINCI_DIMENSIONS"
              :key="dim"
              class="flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center"
              :class="
                (statMap[dim] ?? 0) >= 1
                  ? 'border-success/40 bg-success/10'
                  : 'border-base-300 bg-base-200/40'
              "
              :title="`${DIMENSION_LABELS[dim]}: ${statMap[dim] ?? 0}`"
            >
              <span
                class="text-[0.55rem] font-black uppercase tracking-wide text-base-content/60"
              >
                {{ DIMENSION_LABELS[dim] }}
              </span>
              <span class="text-xs font-black">{{ statMap[dim] ?? 0 }}</span>
            </div>
          </div>

          <div
            v-if="currentChapterDef"
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4"
          >
            <h4 class="text-base font-black">{{ currentChapterDef.title }}</h4>
            <p class="text-sm leading-relaxed text-base-content/75">
              {{ currentChapterDef.narrative }}
            </p>
            <div class="flex flex-col gap-2">
              <button
                v-for="choice in currentChapterDef.choices"
                :key="choice.label"
                type="button"
                class="btn btn-outline btn-sm justify-start rounded-xl text-left normal-case"
                :disabled="submitting"
                @click="chooseOption(choice)"
              >
                {{ choice.label }}
              </button>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
          >
            <Icon name="kind-icon:trophy" class="size-8 text-primary/70" />
            <p class="text-sm text-base-content/70">
              Your chapters are told. It's time to see how this life resolves.
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
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useAchievementStore } from '@/stores/achievementStore'

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
interface LifeRunRecord {
  id: number
  title: string
  status: 'ACTIVE' | 'COMPLETE' | 'ABANDONED'
  protagonistName: string | null
  outcomeKey: string | null
  Stats: LifeStatRow[]
  Choices: LifeChoiceRow[]
  Ending: LifeEndingData | null
}
interface ChoiceResponseData {
  stats: LifeStatRow[]
}

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

const chapterIndex = computed(() => playedCount.value + 1)
const currentChapterDef = computed<LifeChapterDef | null>(() =>
  chapterIndex.value <= chapterCount
    ? (CHAPTERS[chapterIndex.value - 1] ?? null)
    : null,
)

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

  if (response.data.status === 'COMPLETE' && response.data.Ending) {
    endingData.value = response.data.Ending
    phase.value = 'ending'
  } else {
    phase.value = 'playing'
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
}

async function chooseOption(choice: LifeChoiceOption) {
  if (!run.value || !currentChapterDef.value) return
  submitting.value = true
  errorMessage.value = ''

  const response = await performFetch<ChoiceResponseData>(
    `/api/davinci/runs/${run.value.id}/choices`,
    {
      method: 'POST',
      body: JSON.stringify({
        chapter: chapterIndex.value,
        prompt: currentChapterDef.value.narrative,
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
  phase.value = 'start'
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
    href: '/davinci',
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
    ],
    next: ['Achievement gallery', 'Generated art per chapter'],
  },
}
</script>
