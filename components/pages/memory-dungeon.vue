<!-- /components/content/story/memory-dungeon.vue -->
<template>
  <div class="flex h-screen select-none flex-col overflow-hidden bg-base-200">
    <header
      class="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 bg-base-300 px-4 pb-3 pt-4 shadow-md"
    >
      <div>
        <h1 class="text-2xl font-black tracking-tight">🏰 Memory Dungeon</h1>
        <p class="text-xs text-gray-400">
          Level {{ level }} · {{ level * 10 }}ft below sanity
        </p>
      </div>

      <div class="flex flex-col items-center gap-1" title="Lives remaining">
        <div class="flex gap-1 text-xl">
          <span
            v-for="i in maxLives"
            :key="i"
            class="transition-all duration-300"
            :class="i <= lives ? '' : 'grayscale opacity-25'"
          >
            ❤️
          </span>
        </div>
        <div class="text-xs text-base-content/50">
          HP {{ lives }}/{{ maxLives }}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="text-right leading-none">
          <div class="text-lg font-bold tabular-nums">
            {{ score.toLocaleString() }}
          </div>
          <div class="text-xs text-gray-400">
            Best: {{ highScore.toLocaleString() }}
          </div>
        </div>

        <select
          v-model="memoryStore.selectedDifficulty"
          class="rounded border border-base-content/20 bg-base-100 px-2 py-1 text-sm"
          :disabled="gameStarted && !gameOver"
        >
          <option
            v-for="difficulty in memoryStore.difficulties"
            :key="difficulty.label"
            :value="difficulty"
          >
            {{ difficulty.label }}
          </option>
        </select>

        <button
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          type="button"
          @click="startGame"
        >
          {{ gameStarted ? '↺ Restart' : '⚔️ Enter Dungeon' }}
        </button>
      </div>
    </header>

    <Transition name="slide-down">
      <div
        v-if="challenge.active"
        class="z-10 flex shrink-0 items-center justify-between gap-3 bg-yellow-500 px-4 py-2 text-black"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="challenge.targetImagePath"
            :src="challenge.targetImagePath"
            class="h-10 w-10 rounded border-2 border-black object-cover shadow"
            alt="Challenge target"
          />

          <div>
            <span class="font-black">⚔️ CHALLENGE!</span>
            <span class="ml-2 hidden text-sm sm:inline">
              Match this card for <strong>3×</strong> points!
            </span>
          </div>
        </div>

        <div
          class="font-mono text-xl font-bold tabular-nums"
          :class="challenge.timeLeft <= 5 ? 'animate-pulse text-red-800' : ''"
        >
          {{ challenge.timeLeft }}s
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="powerups.length > 0 || shieldActive"
        class="flex shrink-0 items-center gap-2 border-b border-base-content/10 bg-base-100 px-4 py-1.5"
      >
        <span class="text-xs text-gray-400">Powerups:</span>

        <div
          v-if="shieldActive"
          class="rounded bg-blue-700 px-2 py-0.5 text-xs font-medium text-white opacity-80"
        >
          🛡️ Shield Active
        </div>

        <button
          v-for="powerup in powerups"
          :key="powerup.id"
          class="rounded bg-purple-700 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-purple-600 active:scale-95"
          type="button"
          :title="powerup.description"
          @click="usePowerup(powerup)"
        >
          {{ powerup.icon }} {{ powerup.name }}
        </button>
      </div>
    </Transition>

    <Transition name="award-pop">
      <div
        v-if="award.visible"
        class="pointer-events-none fixed left-1/2 top-1/3 z-100 min-w-55 -translate-x-1/2 rounded-3xl bg-linear-to-br from-yellow-400 via-orange-400 to-red-400 px-8 py-5 text-center text-black shadow-2xl"
      >
        <div class="mb-1 text-5xl drop-shadow">{{ award.icon }}</div>
        <div class="text-2xl font-black leading-tight tracking-tight">
          {{ award.title }}
        </div>
        <div class="mt-1 text-sm font-medium opacity-80">
          {{ award.subtitle }}
        </div>
      </div>
    </Transition>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div
          v-if="memoryStore.isLoading"
          class="flex h-full items-center justify-center"
        >
          <div class="loader"></div>
        </div>

        <div
          v-else-if="!gameStarted"
          class="flex h-full flex-col items-center justify-center gap-6 text-center"
        >
          <div class="text-7xl">🏰</div>

          <h2 class="text-3xl font-black">The Memory Dungeon Awaits</h2>

          <p class="max-w-sm text-sm leading-relaxed text-gray-400">
            Match pairs to score. Survive the Oracle's challenges for triple
            points. Collect powerups. Clear floors for random dungeon rewards.
          </p>

          <button
            class="rounded-xl bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-95"
            type="button"
            @click="startGame"
          >
            ⚔️ Enter the Dungeon
          </button>
        </div>

        <div
          v-else-if="gameOver"
          class="flex h-full flex-col items-center justify-center gap-4 text-center"
        >
          <div class="animate-bounce text-7xl">💀</div>

          <h2 class="text-3xl font-black">Dungeon: 1, You: 0</h2>

          <p class="max-w-xs text-sm italic text-gray-400">
            {{ deathFlavor }}
          </p>

          <div class="text-xl font-bold">
            Final Score: {{ score.toLocaleString() }}
          </div>

          <button
            class="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700 active:scale-95"
            type="button"
            @click="startGame"
          >
            🪦 Try Again, Brave Idiot
          </button>
        </div>

        <div
          v-else
          class="flex flex-wrap justify-center gap-3"
          :class="{ 'board-reveal': revealActive }"
        >
          <div
            v-for="card in memoryStore.galleryImages"
            :key="card.id"
            :class="[
              'card-container relative cursor-pointer overflow-hidden rounded-xl transition-transform duration-200',
              card.matched
                ? 'card-matched pointer-events-none opacity-40'
                : 'hover:scale-105 active:scale-95',
              challenge.active &&
              !card.matched &&
              card.galleryName === challenge.targetName
                ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-base-200'
                : '',
              oracleHighlight &&
              !card.matched &&
              card.galleryName === oracleHighlight
                ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-base-200'
                : '',
            ]"
            :style="{ width: `${cardSize}px`, height: `${cardSize}px` }"
            @click="handleCardClick(card)"
          >
            <div
              class="card-inner h-full"
              :class="{ flipped: card.flipped || card.matched }"
            >
              <img
                class="card-back absolute inset-0 h-full w-full object-cover"
                src="/images/kindtitle.webp"
                alt="Card Back"
              />

              <img
                class="card-front absolute inset-0 h-full w-full object-cover"
                :src="card.imagePath"
                :alt="card.galleryName"
              />
            </div>
          </div>
        </div>
      </div>

      <aside
        class="hidden w-56 shrink-0 flex-col overflow-hidden border-l border-base-content/10 bg-base-300 lg:flex xl:w-64"
      >
        <div
          class="shrink-0 border-b border-base-content/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400"
        >
          📜 Dungeon Log
        </div>

        <div ref="logPanel" class="flex-1 overflow-y-auto p-2">
          <TransitionGroup
            name="log-entry"
            tag="div"
            class="flex flex-col gap-1.5"
          >
            <div
              v-for="entry in dungeonLog"
              :key="entry.id"
              :class="[
                'rounded-lg px-2 py-1.5 text-xs leading-snug',
                entry.type === 'match' ? 'bg-green-900/40 text-green-300' : '',
                entry.type === 'mismatch' ? 'bg-red-900/40 text-red-300' : '',
                entry.type === 'challenge'
                  ? 'bg-yellow-900/40 text-yellow-300'
                  : '',
                entry.type === 'award'
                  ? 'bg-purple-900/40 text-purple-300'
                  : '',
                entry.type === 'system' ? 'bg-base-100/60 text-gray-400' : '',
              ]"
            >
              {{ entry.text }}
            </div>
          </TransitionGroup>
        </div>
      </aside>
    </div>

    <footer
      class="flex shrink-0 items-center justify-between border-t border-base-content/10 bg-base-300 px-4 py-2 text-sm"
    >
      <div class="flex flex-wrap gap-4">
        <span>
          🔥 Streak: <strong>{{ streak }}</strong>
        </span>

        <span class="hidden text-gray-400 sm:inline">|</span>

        <span class="hidden sm:inline">
          Pairs: <strong>{{ matchedPairs }}/{{ totalPairs }}</strong>
        </span>

        <span v-if="levelPairModifier !== 0" class="hidden text-info sm:inline">
          Next floor:
          <strong>
            {{ levelPairModifier > 0 ? '+' : '' }}{{ levelPairModifier }}
            pairs
          </strong>
        </span>
      </div>

      <button
        class="text-xs text-blue-400 underline transition hover:text-blue-300"
        type="button"
        @click="isOpen = !isOpen"
      >
        {{ isOpen ? '▲ Hide' : '▼ Show' }} Leaderboard
      </button>
    </footer>

    <Transition name="fade-slide">
      <div
        v-if="isOpen"
        class="max-h-44 shrink-0 overflow-y-auto border-t border-base-content/10 bg-base-100 px-4 py-3"
      >
        <h2 class="mb-2 text-sm font-bold">🏆 Global Leaderboard</h2>

        <table class="w-full table-auto text-xs">
          <thead>
            <tr class="border-b border-base-content/10 text-left text-gray-400">
              <th class="py-1 pr-4">#</th>
              <th class="py-1 pr-4">Player</th>
              <th class="py-1 text-right">Record</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(user, index) in leaderboard"
              :key="user.id"
              class="border-b border-base-content/5 transition hover:bg-base-200"
            >
              <td class="py-1 pr-4 text-gray-400">{{ index + 1 }}</td>
              <td class="py-1 pr-4">{{ user.username }}</td>
              <td class="py-1 text-right font-mono">
                {{ user.matchRecord ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useMemoryStore } from '@/stores/memoryStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'

import type { GalleryImage } from '@/stores/memoryStore'

type DungeonCard = GalleryImage
type PowerupType = 'lantern' | 'shield' | 'oracle'

interface Powerup {
  id: number
  name: string
  icon: string
  description: string
  type: PowerupType
}

type FloorRewardType =
  | 'maxHp'
  | 'heal'
  | 'fullHeal'
  | 'moreCards'
  | 'lessCards'
  | 'powerup'
  | 'score'

interface FloorReward {
  type: FloorRewardType
  icon: string
  title: string
  subtitle: string
  weight: number
  apply: () => void
}

interface LogEntry {
  id: number
  text: string
  type: 'match' | 'mismatch' | 'challenge' | 'award' | 'system'
}

type ResetGamePayload = {
  level?: number
  pairModifier?: number
}

type MemoryStoreWithFlexibleReset = typeof memoryStore & {
  resetGame: (payload?: ResetGamePayload) => void
}

const memoryStore = useMemoryStore()
const milestoneStore = useMilestoneStore()

const STARTING_MAX_LIVES = 3
const MAX_POSSIBLE_LIVES = 8
const MIN_LEVEL_PAIRS = 4
const MAX_LEVEL_PAIRS = 18
const BASE_MATCH_SCORE = 10
const STREAK_BONUS = 5
const CHALLENGE_MULTIPLIER = 3
const POWERUP_CHANCE = 0.3
const CHALLENGE_EVERY_N = 4
const MAX_POWERUPS = 3

const POWERUP_DEFS: Omit<Powerup, 'id'>[] = [
  {
    type: 'lantern',
    name: 'Lantern',
    icon: '🔦',
    description: 'Reveal all cards for 2 seconds',
  },
  {
    type: 'shield',
    name: 'Shield',
    icon: '🛡️',
    description: 'Block the next life loss',
  },
  {
    type: 'oracle',
    name: "Oracle's Eye",
    icon: '👁️',
    description: 'Highlight one matching pair for 5 seconds',
  },
]

const MATCH_FLAVORS = [
  'Two relics resonate. The dungeon groans in defeat.',
  'MATCH! You taste glory and pixels in equal measure.',
  'These images were kindred spirits. You merely introduced them.',
  "Pattern identified. The dungeon's memory is worse than yours. Barely.",
  'The cards align! A goblin accountant marks this in the ledger of victory.',
  "Your gaze pierces the dungeon's illusions. Pair confirmed.",
  'A match! Somewhere, a wizard nods approvingly.',
  'Two strangers unite. The dungeon plays soft ambient irony.',
  'Correct! The dungeon rewards you with temporary self-esteem.',
  "Bull's-eye. The dungeon was not expecting that.",
  "These cards knew each other in a past life. You've reunited them.",
  'Match secured. The cryptkeeper tallies another defeat.',
  'The images click into place. A goblin sighs heavily.',
  'Pair found! The dungeon updates its threat assessment of you.',
]

const MISMATCH_FLAVORS = [
  'Not a match. A spectral card-shark snickers from the shadows.',
  'Wrong. The dungeon deals 1 damage. Your dignity survives. Barely.',
  'Mismatch! A dungeon rat notes your failure in its tiny notebook.',
  'Swipe left. These cards were never meant to be.',
  'The dungeon floor opens slightly. Not enough to matter. Yet.',
  'No. Just... no. The cards are embarrassed on your behalf.',
  'Incorrect. A small ghost materializes to judge you silently.',
  'Wrong pair. The dungeon intern logs this in the Failure Ledger.',
  "These images weren't in the same genre. The audacity.",
  'Close, but no. The Oracle chuckles ominously.',
  'Mismatch. The dungeon records this for future mockery.',
  'A goblin somewhere just won a bet against you.',
]

const DEATH_FLAVORS = [
  'A memorial candle will be lit. It is scented like defeat.',
  'The dungeon claims another hero. Press F to pay respects.',
  'Your score is etched into the Wall of Mediocrity.',
  "The dungeon's card-goblin claps slowly. Rhythmically.",
  'Slain by your own memory. A poetic end.',
  "The Oracle whispers: 'Perhaps Wordle is more your speed.'",
  'The dungeon locks the exit. Your score remains as a warning to others.',
  'Three lives, all spent. The dungeon offers its condolences. It is lying.',
]

const LEVEL_FLAVORS = [
  'The floor cracks open. You descend to Level {n}. The air smells of forgotten thumbnails.',
  'Floor cleared! A staircase appears. You ignore the ominous rumbling and press on.',
  'All pairs matched! The dungeon sighs and prepares a harder floor.',
  'FLOOR COMPLETE! The card-goblins regroup. You press forward.',
  "Victory! The dungeon promotes you to 'Slightly Dangerous.' Level {n} begins.",
  "You have defeated this floor's memories. The next floor has even more of them.",
]

const CHALLENGE_START_FLAVORS = [
  "The Oracle speaks: 'Match the shown relic for triple glory, mortal.'",
  'A challenge beacon ignites! Triple points await the worthy.',
  'CHALLENGE ISSUED! The cryptkeeper watches with judgmental eyes.',
  'The dungeon throws down the gauntlet. Do not embarrass yourself.',
  "The Oracle slides a card across the table. 'Find its twin.' The clock begins.",
]

const CHALLENGE_WIN_FLAVORS = [
  'LEGENDARY! Triple points flow like dungeon wine!',
  'The Oracle is shaken. You exceeded its measly expectations.',
  'Challenge slain! A bard will compose a mediocre ballad about this.',
  'Triple score! The dungeon weeps in pattern-recognition defeat.',
  'The Oracle files a formal complaint. It is ignored.',
]

const CHALLENGE_FAIL_FLAVORS = [
  'Challenge expired. The Oracle judges you silently and forever.',
  "Time's up. The cryptkeeper logs this in the Book of Shame.",
  'Challenge failed. The Oracle rescinds 3 style points.',
  'The clock was the real monster. As it always is.',
  'The challenge beacon fades. A goblin shrugs and refunds nothing.',
]

const isOpen = ref(false)
const logPanel = ref<HTMLElement | null>(null)

const maxLives = ref(STARTING_MAX_LIVES)
const lives = ref(STARTING_MAX_LIVES)
const levelPairModifier = ref(0)
const score = ref(0)
const highScore = ref(0)
const level = ref(1)
const streak = ref(0)
const matchesSinceChallenge = ref(0)
const gameStarted = ref(false)
const gameOver = ref(false)
const levelTransitioning = ref(false)
const deathFlavor = ref('')
const revealActive = ref(false)
const oracleHighlight = ref('')
const shieldActive = ref(false)
const powerups = ref<Powerup[]>([])
const dungeonLog = ref<LogEntry[]>([])

const challenge = reactive({
  active: false,
  targetName: '',
  targetImagePath: '',
  timeLeft: 15,
  timer: null as ReturnType<typeof setInterval> | null,
})

const award = reactive({
  visible: false,
  icon: '',
  title: '',
  subtitle: '',
  timer: null as ReturnType<typeof setTimeout> | null,
})

let revealTimer: ReturnType<typeof setTimeout> | null = null
let oracleTimer: ReturnType<typeof setTimeout> | null = null
let justMatched = false
let powerupIdCounter = 0
let logId = 0
let prevMatchedNames: string[] = []
let prevFlippedCount = 0

const cardSize = computed(() => memoryStore.cardSize)
const leaderboard = computed(() => milestoneStore.highMatchScores)

const galleryCards = computed(() => memoryStore.galleryImages as DungeonCard[])

const matchedGalleryNames = computed(() => {
  const seen = new Set<string>()

  for (const card of galleryCards.value) {
    if (card.matched) seen.add(card.galleryName)
  }

  return [...seen]
})

const matchedPairs = computed(() => matchedGalleryNames.value.length)
const totalPairs = computed(() => galleryCards.value.length / 2)

const flippedUnmatchedCount = computed(
  () =>
    galleryCards.value.filter((card) => card.flipped && !card.matched).length,
)

watch(matchedGalleryNames, (newValue) => {
  if (newValue.length < prevMatchedNames.length) {
    prevMatchedNames = []
    return
  }

  const newNames = newValue.filter((name) => !prevMatchedNames.includes(name))

  if (newNames.length > 0) {
    justMatched = true
    newNames.forEach((name) => onMatch(name))

    setTimeout(() => {
      justMatched = false
    }, 80)
  }

  prevMatchedNames = [...newValue]
})

watch(flippedUnmatchedCount, (newValue, oldValue) => {
  if (
    newValue === 0 &&
    oldValue === 2 &&
    !justMatched &&
    gameStarted.value &&
    !gameOver.value &&
    !levelTransitioning.value
  ) {
    onMismatch()
  }

  prevFlippedCount = newValue
})

watch(
  () => memoryStore.gameWon,
  (won) => {
    if (
      won &&
      gameStarted.value &&
      !gameOver.value &&
      !levelTransitioning.value
    ) {
      onLevelComplete()
    }
  },
)

function pick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)] as T
}

function addLog(text: string, type: LogEntry['type'] = 'system') {
  dungeonLog.value.unshift({ id: logId++, text, type })

  if (dungeonLog.value.length > 60) {
    dungeonLog.value.pop()
  }
}

function showAward(icon: string, title: string, subtitle: string) {
  if (award.timer) clearTimeout(award.timer)

  Object.assign(award, {
    visible: true,
    icon,
    title,
    subtitle,
  })

  addLog(`🏅 ${title} — ${subtitle}`, 'award')

  award.timer = setTimeout(() => {
    award.visible = false
  }, 2800)
}

function resetBoardForCurrentLevel() {
  prevMatchedNames = []
  prevFlippedCount = 0
  justMatched = false
  revealActive.value = false
  oracleHighlight.value = ''

  const flexibleMemoryStore = memoryStore as MemoryStoreWithFlexibleReset

  flexibleMemoryStore.resetGame({
    level: level.value,
    pairModifier: levelPairModifier.value,
  })
}

function startGame() {
  maxLives.value = STARTING_MAX_LIVES
  lives.value = STARTING_MAX_LIVES
  levelPairModifier.value = 0
  score.value = 0
  level.value = 1
  streak.value = 0
  matchesSinceChallenge.value = 0
  gameOver.value = false
  gameStarted.value = true
  levelTransitioning.value = false
  powerups.value = []
  shieldActive.value = false
  dungeonLog.value = []
  deathFlavor.value = ''
  cancelChallenge()

  if (award.timer) clearTimeout(award.timer)
  if (revealTimer) clearTimeout(revealTimer)
  if (oracleTimer) clearTimeout(oracleTimer)

  award.visible = false
  resetBoardForCurrentLevel()

  addLog(
    '⚔️ You descend into the Memory Dungeon. The air smells of forgotten images.',
    'system',
  )
  addLog(
    '🗺️ Tip: Match pairs to score. Challenges award 3× points. Floor rewards are random.',
    'system',
  )
}

function handleCardClick(card: DungeonCard) {
  if (!gameStarted.value || gameOver.value || levelTransitioning.value) return
  if (card.matched) return

  memoryStore.handleGalleryClick(card)
}

function onMatch(matchedName: string) {
  if (!gameStarted.value || gameOver.value || levelTransitioning.value) return

  streak.value++
  matchesSinceChallenge.value++

  let points = BASE_MATCH_SCORE + (streak.value - 1) * STREAK_BONUS

  if (challenge.active && matchedName === challenge.targetName) {
    points *= CHALLENGE_MULTIPLIER
    cancelChallenge()
    addLog(pick(CHALLENGE_WIN_FLAVORS), 'challenge')
    showAward('🏆', 'CHALLENGER SLAYER', 'The Oracle has been bested.')
  }

  score.value += points

  if (score.value > highScore.value) {
    highScore.value = score.value
  }

  addLog(`${pick(MATCH_FLAVORS)} (+${points})`, 'match')

  const streakAward = [
    {
      n: 3,
      icon: '🔥',
      title: 'ON FIRE!',
      sub: '3 in a row. The dungeon is sweating.',
    },
    {
      n: 5,
      icon: '⚡',
      title: 'LIGHTNING MIND',
      sub: '5 consecutive. Are you even human?',
    },
    {
      n: 8,
      icon: '🌊',
      title: 'UNSTOPPABLE',
      sub: '8 in a row. The dungeon weeps.',
    },
    {
      n: 12,
      icon: '👑',
      title: 'DUNGEON KING',
      sub: '12 in a row. The Oracle surrenders.',
    },
  ].find((awardEntry) => awardEntry.n === streak.value)

  if (streakAward) {
    showAward(streakAward.icon, streakAward.title, streakAward.sub)
  }

  if (lives.value === 1 && streak.value % 2 === 0) {
    showAward('💀', "DEATH'S DOOR", 'Matched with 1 life remaining. Chilling.')
  }

  if (!challenge.active && matchesSinceChallenge.value >= CHALLENGE_EVERY_N) {
    const unmatched = galleryCards.value.filter((card) => !card.matched)

    if (unmatched.length >= 4) {
      startChallenge()
      matchesSinceChallenge.value = 0
    }
  }

  if (Math.random() < POWERUP_CHANCE) {
    grantPowerup()
  }
}

function onMismatch() {
  if (!gameStarted.value || gameOver.value || levelTransitioning.value) return

  streak.value = 0

  if (shieldActive.value) {
    shieldActive.value = false
    addLog(
      '🛡️ Your shield absorbs the blow! A goblin looks deeply disappointed.',
      'system',
    )
    return
  }

  lives.value--

  addLog(
    `${pick(MISMATCH_FLAVORS)} [♥ ${lives.value}/${maxLives.value}]`,
    'mismatch',
  )

  if (lives.value <= 0) {
    setTimeout(triggerGameOver, 700)
  }
}

function triggerGameOver() {
  if (gameOver.value) return

  gameOver.value = true
  levelTransitioning.value = false
  cancelChallenge()
  deathFlavor.value = pick(DEATH_FLAVORS)
  addLog('💀 GAME OVER. The dungeon claims your score as a trophy.', 'system')
}

function onLevelComplete() {
  levelTransitioning.value = true

  const completedLevel = level.value
  const wasFlawless = lives.value === maxLives.value
  const bonus = completedLevel * 50

  score.value += bonus

  if (score.value > highScore.value) {
    highScore.value = score.value
  }

  cancelChallenge()
  matchesSinceChallenge.value = 0
  oracleHighlight.value = ''

  // ── GUARANTEED FLOOR HEAL ─────────────────────────────────────────
  if (!wasFlawless) {
    lives.value = Math.min(lives.value + 1, maxLives.value)
    addLog('🏥 Floor cleared — wounds tended. You limp onward.', 'system')
  } else {
    addLog('🧠 MIND PALACE — Flawless floor! The dungeon is appalled.', 'award')
  }
  // ─────────────────────────────────────────────────────────────────

  const message = pick(LEVEL_FLAVORS).replace('{n}', String(level.value + 1))
  addLog(`🎉 ${message}`, 'system')
  addLog(`✨ Level ${completedLevel} Bonus: +${bonus} pts`, 'system')

  grantFloorReward(wasFlawless) // random bonus on top, as before

  setTimeout(() => {
    level.value++
    streak.value = 0
    resetBoardForCurrentLevel() // ← board reset while still transitioning
    levelTransitioning.value = false // ← guard drops after
  }, 1400)
}

function startChallenge() {
  const unmatched = galleryCards.value.filter((card) => !card.matched)

  if (unmatched.length < 4) return

  const target = pick(unmatched)

  challenge.active = true
  challenge.targetName = target.galleryName
  challenge.targetImagePath = target.imagePath
  challenge.timeLeft = 15

  if (challenge.timer) clearInterval(challenge.timer)

  challenge.timer = setInterval(() => {
    challenge.timeLeft--

    if (challenge.timeLeft <= 0) {
      failChallenge()
    }
  }, 1000)

  addLog(pick(CHALLENGE_START_FLAVORS), 'challenge')
}

function cancelChallenge() {
  if (challenge.timer) {
    clearInterval(challenge.timer)
    challenge.timer = null
  }

  challenge.active = false
}

function failChallenge() {
  cancelChallenge()
  addLog(pick(CHALLENGE_FAIL_FLAVORS), 'challenge')
}

function grantPowerup() {
  if (powerups.value.length >= MAX_POWERUPS) return

  const available = POWERUP_DEFS.filter((powerup) => {
    const alreadyHasShield =
      shieldActive.value ||
      powerups.value.some((storedPowerup) => storedPowerup.type === 'shield')

    if (powerup.type === 'shield' && alreadyHasShield) {
      return false
    }

    return true
  })

  if (!available.length) return

  const powerup = pick(available)

  powerups.value.push({
    ...powerup,
    id: powerupIdCounter++,
  })

  addLog(
    `✨ Powerup dropped: ${powerup.icon} ${powerup.name} — ${powerup.description}`,
    'system',
  )
}

function getWeightedReward(rewards: FloorReward[]): FloorReward | null {
  const available = rewards.filter((reward) => reward.weight > 0)
  const totalWeight = available.reduce((sum, reward) => sum + reward.weight, 0)

  if (!available.length || totalWeight <= 0) return null

  let roll = Math.random() * totalWeight

  for (const reward of available) {
    roll -= reward.weight

    if (roll <= 0) {
      return reward
    }
  }

  return available.at(-1) ?? null
}

function grantFloorReward(wasFlawless: boolean) {
  const nextPairTotal = totalPairs.value + levelPairModifier.value
  const canGainMaxHp = maxLives.value < MAX_POSSIBLE_LIVES
  const canHeal = lives.value < maxLives.value
  const canReduceCards = nextPairTotal > MIN_LEVEL_PAIRS
  const canAddCards = nextPairTotal < MAX_LEVEL_PAIRS
  const canGainPowerup = powerups.value.length < MAX_POWERUPS

  const rewards: FloorReward[] = [
    {
      type: 'maxHp',
      icon: '💖',
      title: 'HEART CONTAINER',
      subtitle: '+1 Max HP. Your organs file a thank-you note.',
      weight: canGainMaxHp ? 16 : 0,
      apply: () => {
        maxLives.value++
        lives.value = Math.min(lives.value + 1, maxLives.value)
      },
    },
    {
      type: 'heal',
      icon: '❤️‍🔥',
      title: 'FIELD MEDICINE',
      subtitle: 'Heal 1 HP. Probably not sterile. Still useful.',
      weight: canHeal ? 22 : 4,
      apply: () => {
        lives.value = Math.min(lives.value + 1, maxLives.value)
      },
    },
    {
      type: 'fullHeal',
      icon: '✨',
      title: 'RESTORATIVE NONSENSE',
      subtitle: 'Fully healed. The dungeon hates wellness culture.',
      weight: lives.value < maxLives.value - 1 ? 10 : 0,
      apply: () => {
        lives.value = maxLives.value
      },
    },
    {
      type: 'moreCards',
      icon: '🃏',
      title: 'DEEPER FLOOR',
      subtitle: '+1 pair next level. More cards, more hubris.',
      weight: canAddCards ? 14 : 0,
      apply: () => {
        levelPairModifier.value++
      },
    },
    {
      type: 'lessCards',
      icon: '🍀',
      title: 'MERCIFUL STAIRCASE',
      subtitle: '-1 pair next level. Suspiciously kind.',
      weight: canReduceCards ? 10 : 0,
      apply: () => {
        levelPairModifier.value--
      },
    },
    {
      type: 'powerup',
      icon: '🎁',
      title: 'DUNGEON LOOT',
      subtitle: 'Gain a random powerup. Probably cursed. Enjoy.',
      weight: canGainPowerup ? 18 : 0,
      apply: () => {
        grantPowerup()
      },
    },
    {
      type: 'score',
      icon: '💰',
      title: 'GOBLIN CASHBACK',
      subtitle: `+${level.value * 75} points. Financially irresponsible.`,
      weight: 12,
      apply: () => {
        score.value += level.value * 75
      },
    },
  ]

  if (wasFlawless && canGainMaxHp) {
    rewards.push({
      type: 'maxHp',
      icon: '👑',
      title: 'FLAWLESS HEART',
      subtitle: '+1 Max HP for a perfect floor. Grossly competent.',
      weight: 20,
      apply: () => {
        maxLives.value++
        lives.value = maxLives.value
      },
    })
  }

  const reward = getWeightedReward(rewards)

  if (!reward) return

  reward.apply()

  if (score.value > highScore.value) {
    highScore.value = score.value
  }

  showAward(reward.icon, reward.title, reward.subtitle)
  addLog(`🎲 Floor reward: ${reward.title} — ${reward.subtitle}`, 'award')
}

function usePowerup(powerup: Powerup) {
  powerups.value = powerups.value.filter(
    (storedPowerup) => storedPowerup.id !== powerup.id,
  )

  if (powerup.type === 'lantern') {
    revealActive.value = true

    addLog(
      '🔦 Lantern ignites! Cards revealed for 2 seconds. Memorize fast.',
      'system',
    )

    if (revealTimer) clearTimeout(revealTimer)

    revealTimer = setTimeout(() => {
      revealActive.value = false
    }, 2000)

    return
  }

  if (powerup.type === 'shield') {
    shieldActive.value = true

    addLog(
      '🛡️ Shield raised! Your next mistake shall be forgiven. This time.',
      'system',
    )

    return
  }

  if (powerup.type === 'oracle') {
    const unmatched = galleryCards.value.filter((card) => !card.matched)
    const nameCount = new Map<string, number>()

    unmatched.forEach((card) => {
      nameCount.set(
        card.galleryName,
        (nameCount.get(card.galleryName) ?? 0) + 1,
      )
    })

    const pairs = [...nameCount.entries()]
      .filter(([, count]) => count >= 2)
      .map(([name]) => name)

    if (!pairs.length) return

    oracleHighlight.value = pick(pairs)

    addLog(
      '👁️ The Oracle highlights a matching pair. Find the blue glow.',
      'system',
    )

    if (oracleTimer) clearTimeout(oracleTimer)

    oracleTimer = setTimeout(() => {
      oracleHighlight.value = ''
    }, 5000)
  }
}

onMounted(async () => {
  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }

  await nextTick()
})

onUnmounted(() => {
  cancelChallenge()

  if (revealTimer) clearTimeout(revealTimer)
  if (oracleTimer) clearTimeout(oracleTimer)
  if (award.timer) clearTimeout(award.timer)
})
</script>

<style scoped>
.card-container {
  perspective: 900px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.55s ease;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 0.75rem;
  object-fit: cover;
}

.card-front {
  transform: rotateY(180deg);
}

.board-reveal .card-container:not(.card-matched) .card-inner:not(.flipped) {
  transform: rotateY(180deg);
}

.loader {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(255, 255, 255, 0.15);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.award-pop-enter-active {
  transition: all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.award-pop-leave-active {
  transition: all 0.22s ease-in;
}

.award-pop-enter-from,
.award-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -18px) scale(0.6);
}

.award-pop-enter-to,
.award-pop-leave-from {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.log-entry-enter-active {
  transition: all 0.2s ease;
}

.log-entry-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

.card-matched {
  transition: opacity 0.4s ease;
}
</style>
