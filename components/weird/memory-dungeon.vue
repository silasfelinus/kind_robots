<!-- /components/content/story/memory-test.vue -->
<template>
  <div class="flex flex-col h-screen bg-base-200 select-none overflow-hidden">
    <!-- ─── Header ─── -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 bg-base-300 shadow-md z-10 shrink-0"
    >
      <div>
        <h1 class="text-2xl font-black tracking-tight">🏰 Memory Dungeon</h1>
        <p class="text-xs text-gray-400">
          Level {{ level }} · {{ level * 10 }}ft below sanity
        </p>
      </div>

      <!-- Lives -->
      <div class="flex gap-1 text-xl" title="Lives remaining">
        <span
          v-for="i in MAX_LIVES"
          :key="i"
          class="transition-all duration-300"
          :class="i <= lives ? '' : 'grayscale opacity-25'"
          >❤️</span
        >
      </div>

      <!-- Score + Controls -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="text-right leading-none">
          <div class="font-bold text-lg tabular-nums">
            {{ score.toLocaleString() }}
          </div>
          <div class="text-gray-400 text-xs">
            Best: {{ highScore.toLocaleString() }}
          </div>
        </div>
        <select
          v-model="memoryStore.selectedDifficulty"
          class="border border-base-content/20 rounded px-2 py-1 text-sm bg-base-100"
        >
          <option
            v-for="d in memoryStore.difficulties"
            :key="d.label"
            :value="d"
          >
            {{ d.label }}
          </option>
        </select>
        <button
          @click="startGame"
          class="px-3 py-1.5 rounded font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition"
        >
          {{ gameStarted ? '↺ Restart' : '⚔️ Enter Dungeon' }}
        </button>
      </div>
    </header>

    <!-- ─── Challenge Banner ─── -->
    <Transition name="slide-down">
      <div
        v-if="challenge.active"
        class="flex items-center justify-between px-4 py-2 bg-yellow-500 text-black gap-3 z-10 shrink-0"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="challenge.targetImagePath"
            :src="challenge.targetImagePath"
            class="w-10 h-10 rounded object-cover border-2 border-black shadow"
            alt="Challenge target"
          />
          <div>
            <span class="font-black">⚔️ CHALLENGE!</span>
            <span class="ml-2 text-sm hidden sm:inline"
              >Match this card for <strong>3×</strong> points!</span
            >
          </div>
        </div>
        <div
          class="font-mono font-bold text-xl tabular-nums"
          :class="challenge.timeLeft <= 5 ? 'text-red-800 animate-pulse' : ''"
        >
          {{ challenge.timeLeft }}s
        </div>
      </div>
    </Transition>

    <!-- ─── Powerup Bar ─── -->
    <Transition name="fade">
      <div
        v-if="powerups.length > 0 || shieldActive"
        class="flex items-center gap-2 px-4 py-1.5 bg-base-100 border-b border-base-content/10 shrink-0"
      >
        <span class="text-xs text-gray-400">Powerups:</span>
        <div
          v-if="shieldActive"
          class="px-2 py-0.5 rounded text-xs bg-blue-700 text-white font-medium opacity-80"
        >
          🛡️ Shield Active
        </div>
        <button
          v-for="pu in powerups"
          :key="pu.id"
          @click="usePowerup(pu)"
          :title="pu.description"
          class="px-2 py-0.5 rounded text-xs bg-purple-700 text-white hover:bg-purple-600 active:scale-95 transition font-medium"
        >
          {{ pu.icon }} {{ pu.name }}
        </button>
      </div>
    </Transition>

    <!-- ─── Award Toast ─── -->
    <Transition name="award-pop">
      <div
        v-if="award.visible"
        class="fixed top-1/3 left-1/2 -translate-x-1/2 z-100 pointer-events-none bg-linear-to-br from-yellow-400 via-orange-400 to-red-400 text-black px-8 py-5 rounded-3xl shadow-2xl text-center min-w-55"
      >
        <div class="text-5xl mb-1 drop-shadow">{{ award.icon }}</div>
        <div class="font-black text-2xl leading-tight tracking-tight">
          {{ award.title }}
        </div>
        <div class="text-sm mt-1 font-medium opacity-80">
          {{ award.subtitle }}
        </div>
      </div>
    </Transition>

    <!-- ─── Main Area ─── -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- Game Board -->
      <div class="flex-1 overflow-y-auto p-4 min-h-0">
        <!-- Loading -->
        <div
          v-if="memoryStore.isLoading"
          class="flex justify-center items-center h-full"
        >
          <div class="loader"></div>
        </div>

        <!-- Splash / Not Started -->
        <div
          v-else-if="!gameStarted"
          class="flex flex-col items-center justify-center h-full gap-6 text-center"
        >
          <div class="text-7xl">🏰</div>
          <h2 class="text-3xl font-black">The Memory Dungeon Awaits</h2>
          <p class="text-gray-400 max-w-sm text-sm leading-relaxed">
            Match pairs to score. Survive the Oracle's challenges for triple
            points. Collect powerups. Descend ever deeper into pixelated
            madness.
          </p>
          <button
            @click="startGame"
            class="px-8 py-3 rounded-xl text-white font-bold text-lg bg-blue-600 hover:bg-blue-700 transition shadow-lg active:scale-95"
          >
            ⚔️ Enter the Dungeon
          </button>
        </div>

        <!-- Game Over -->
        <div
          v-else-if="gameOver"
          class="flex flex-col items-center justify-center h-full gap-4 text-center"
        >
          <div class="text-7xl animate-bounce">💀</div>
          <h2 class="text-3xl font-black">Dungeon: 1 — You: 0</h2>
          <p class="text-gray-400 italic max-w-xs text-sm">{{ deathFlavor }}</p>
          <div class="font-bold text-xl">
            Final Score: {{ score.toLocaleString() }}
          </div>
          <button
            @click="startGame"
            class="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition active:scale-95"
          >
            🪦 Try Again, Brave Idiot
          </button>
        </div>

        <!-- Cards -->
        <div
          v-else
          class="flex flex-wrap justify-center gap-3"
          :class="{ 'board-reveal': revealActive }"
        >
          <div
            v-for="card in memoryStore.galleryImages"
            :key="card.id"
            :class="[
              'card-container relative rounded-xl overflow-hidden cursor-pointer transition-transform duration-200',
              card.matched
                ? 'card-matched opacity-40 pointer-events-none'
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
            :style="{ width: cardSize + 'px', height: cardSize + 'px' }"
            @click="handleCardClick(card)"
          >
            <div
              class="card-inner h-full"
              :class="{ flipped: card.flipped || card.matched }"
            >
              <img
                class="card-back absolute inset-0 w-full h-full object-cover"
                src="/images/kindtitle.webp"
                alt="Card Back"
              />
              <img
                class="card-front absolute inset-0 w-full h-full object-cover"
                :src="card.imagePath"
                :alt="card.galleryName"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Dungeon Log Sidebar (desktop) ─── -->
      <aside
        class="hidden lg:flex flex-col w-56 xl:w-64 bg-base-300 border-l border-base-content/10 overflow-hidden shrink-0"
      >
        <div
          class="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-base-content/10 shrink-0"
        >
          📜 Dungeon Log
        </div>
        <div class="flex-1 overflow-y-auto p-2" ref="logPanel">
          <TransitionGroup
            name="log-entry"
            tag="div"
            class="flex flex-col gap-1.5"
          >
            <div
              v-for="entry in dungeonLog"
              :key="entry.id"
              :class="[
                'text-xs px-2 py-1.5 rounded-lg leading-snug',
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

    <!-- ─── Footer ─── -->
    <footer
      class="flex items-center justify-between px-4 py-2 bg-base-300 border-t border-base-content/10 text-sm shrink-0"
    >
      <div class="flex gap-4">
        <span
          >🔥 Streak: <strong>{{ streak }}</strong></span
        >
        <span class="hidden sm:inline text-gray-400">|</span>
        <span class="hidden sm:inline"
          >Pairs: <strong>{{ matchedPairs }}/{{ totalPairs }}</strong></span
        >
      </div>
      <button
        @click="isOpen = !isOpen"
        class="text-blue-400 hover:text-blue-300 text-xs underline transition"
      >
        {{ isOpen ? '▲ Hide' : '▼ Show' }} Leaderboard
      </button>
    </footer>

    <!-- ─── Leaderboard ─── -->
    <Transition name="fade-slide">
      <div
        v-if="isOpen"
        class="bg-base-100 border-t border-base-content/10 max-h-44 overflow-y-auto px-4 py-3 shrink-0"
      >
        <h2 class="font-bold text-sm mb-2">🏆 Global Leaderboard</h2>
        <table class="table-auto w-full text-xs">
          <thead>
            <tr class="text-gray-400 border-b border-base-content/10 text-left">
              <th class="py-1 pr-4">#</th>
              <th class="py-1 pr-4">Player</th>
              <th class="py-1 text-right">Record</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, i) in leaderboard"
              :key="user.id"
              class="border-b border-base-content/5 hover:bg-base-200 transition"
            >
              <td class="py-1 pr-4 text-gray-400">{{ i + 1 }}</td>
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'

// ── Stores ─────────────────────────────────────────────────────────────────
const memoryStore = useMemoryStore()
const milestoneStore = useMilestoneStore()

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_LIVES = 3
const BASE_MATCH_SCORE = 10
const STREAK_BONUS = 5 // extra pts per match in a streak
const CHALLENGE_MULTIPLIER = 3
const POWERUP_CHANCE = 0.3 // 30% chance to earn a powerup on match
const CHALLENGE_EVERY_N = 4 // matches between challenges

// ── UI State ────────────────────────────────────────────────────────────────
const isOpen = ref(false)
const logPanel = ref<HTMLElement | null>(null)

// ── Game State ──────────────────────────────────────────────────────────────
const lives = ref(MAX_LIVES)
const score = ref(0)
const highScore = ref(0)
const level = ref(1)
const streak = ref(0)
const matchesSinceChallenge = ref(0)
const gameStarted = ref(false)
const gameOver = ref(false)
const deathFlavor = ref('')
const revealActive = ref(false)
const oracleHighlight = ref('')
const shieldActive = ref(false)

let revealTimer: ReturnType<typeof setTimeout> | null = null
let oracleTimer: ReturnType<typeof setTimeout> | null = null
let justMatched = false // suppresses false mismatch triggers on match frames

// ── Powerup Types ───────────────────────────────────────────────────────────
interface Powerup {
  id: number
  name: string
  icon: string
  description: string
  type: 'lantern' | 'shield' | 'oracle'
}
const powerups = ref<Powerup[]>([])
let powerupIdCounter = 0

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

// ── Challenge ───────────────────────────────────────────────────────────────
const challenge = reactive({
  active: false,
  targetName: '',
  targetImagePath: '',
  timeLeft: 15,
  timer: null as ReturnType<typeof setInterval> | null,
})

// ── Award Toast ─────────────────────────────────────────────────────────────
const award = reactive({
  visible: false,
  icon: '',
  title: '',
  subtitle: '',
  timer: null as ReturnType<typeof setTimeout> | null,
})

// ── Dungeon Log ──────────────────────────────────────────────────────────────
interface LogEntry {
  id: number
  text: string
  type: 'match' | 'mismatch' | 'challenge' | 'award' | 'system'
}
const dungeonLog = ref<LogEntry[]>([])
let logId = 0

// ── Computed ─────────────────────────────────────────────────────────────────
const cardSize = computed(() => memoryStore.cardSize)
const leaderboard = computed(() => milestoneStore.highMatchScores)

const matchedGalleryNames = computed(() => {
  const seen = new Set<string>()
  for (const c of memoryStore.galleryImages as any[]) {
    if (c.matched) seen.add(c.galleryName)
  }
  return [...seen]
})

const matchedPairs = computed(() => matchedGalleryNames.value.length)
const totalPairs = computed(
  () => (memoryStore.galleryImages as any[]).length / 2,
)

const flippedUnmatchedCount = computed(
  () =>
    (memoryStore.galleryImages as any[]).filter((c) => c.flipped && !c.matched)
      .length,
)

// ── Watchers ──────────────────────────────────────────────────────────────────
let prevMatchedNames: string[] = []
let prevFlippedCount = 0

watch(matchedGalleryNames, (newVal) => {
  if (newVal.length < prevMatchedNames.length) {
    // Board was reset
    prevMatchedNames = []
    return
  }
  const newNames = newVal.filter((n) => !prevMatchedNames.includes(n))
  if (newNames.length > 0) {
    justMatched = true
    newNames.forEach((n) => onMatch(n))
    setTimeout(() => {
      justMatched = false
    }, 80)
  }
  prevMatchedNames = [...newVal]
})

watch(flippedUnmatchedCount, (newVal, oldVal) => {
  if (
    newVal === 0 &&
    oldVal === 2 &&
    !justMatched &&
    gameStarted.value &&
    !gameOver.value
  ) {
    onMismatch()
  }
  prevFlippedCount = newVal
})

watch(
  () => memoryStore.gameWon,
  (won) => {
    if (won && gameStarted.value && !gameOver.value) onLevelComplete()
  },
)

// ── Flavor Text Arrays ────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function addLog(text: string, type: LogEntry['type'] = 'system') {
  dungeonLog.value.unshift({ id: logId++, text, type })
  if (dungeonLog.value.length > 60) dungeonLog.value.pop()
}

function showAward(icon: string, title: string, subtitle: string) {
  if (award.timer) clearTimeout(award.timer)
  Object.assign(award, { visible: true, icon, title, subtitle })
  addLog(`🏅 ${title} — ${subtitle}`, 'award')
  award.timer = setTimeout(() => {
    award.visible = false
  }, 2800)
}

// ── Core Game Logic ────────────────────────────────────────────────────────────
function startGame() {
  lives.value = MAX_LIVES
  score.value = 0
  level.value = 1
  streak.value = 0
  matchesSinceChallenge.value = 0
  gameOver.value = false
  gameStarted.value = true
  powerups.value = []
  shieldActive.value = false
  dungeonLog.value = []
  prevMatchedNames = []
  prevFlippedCount = 0
  justMatched = false
  revealActive.value = false
  oracleHighlight.value = ''
  cancelChallenge()
  if (award.timer) clearTimeout(award.timer)
  award.visible = false
  memoryStore.resetGame()
  addLog(
    '⚔️ You descend into the Memory Dungeon. The air smells of forgotten images.',
    'system',
  )
  addLog(
    '🗺️ Tip: Match pairs to score. Challenges award 3× points. Powerups drop on luck.',
    'system',
  )
}

function handleCardClick(card: any) {
  if (!gameStarted.value || gameOver.value || card.matched) return
  memoryStore.handleGalleryClick(card)
}

function onMatch(matchedName: string) {
  if (!gameStarted.value || gameOver.value) return

  streak.value++
  matchesSinceChallenge.value++

  let points = BASE_MATCH_SCORE + (streak.value - 1) * STREAK_BONUS

  // Challenge resolution
  if (challenge.active && matchedName === challenge.targetName) {
    points *= CHALLENGE_MULTIPLIER
    cancelChallenge()
    addLog(pick(CHALLENGE_WIN_FLAVORS), 'challenge')
    showAward('🏆', 'CHALLENGER SLAYER', 'The Oracle has been bested.')
  }

  score.value += points
  if (score.value > highScore.value) highScore.value = score.value

  addLog(`${pick(MATCH_FLAVORS)} (+${points})`, 'match')

  // Streak milestone awards
  const STREAK_AWARDS = [
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
  ]
  const sa = STREAK_AWARDS.find((a) => a.n === streak.value)
  if (sa) showAward(sa.icon, sa.title, sa.sub)

  // One-life clutch award (random so it doesn't spam)
  if (lives.value === 1 && streak.value % 2 === 0) {
    showAward('💀', "DEATH'S DOOR", 'Matched with 1 life remaining. Chilling.')
  }

  // Trigger new challenge if cooldown elapsed
  if (!challenge.active && matchesSinceChallenge.value >= CHALLENGE_EVERY_N) {
    const unmatched = (memoryStore.galleryImages as any[]).filter(
      (c) => !c.matched,
    )
    if (unmatched.length >= 4) {
      startChallenge()
      matchesSinceChallenge.value = 0
    }
  }

  // Random powerup drop
  if (Math.random() < POWERUP_CHANCE) grantPowerup()
}

function onMismatch() {
  if (!gameStarted.value || gameOver.value) return

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
    `${pick(MISMATCH_FLAVORS)} [♥ ${lives.value}/${MAX_LIVES}]`,
    'mismatch',
  )

  if (lives.value <= 0) {
    setTimeout(triggerGameOver, 700)
  }
}

function triggerGameOver() {
  gameOver.value = true
  cancelChallenge()
  deathFlavor.value = pick(DEATH_FLAVORS)
  addLog('💀 GAME OVER. The dungeon claims your score as a trophy.', 'system')
}

function onLevelComplete() {
  const wasFlawless = lives.value === MAX_LIVES
  const bonus = level.value * 50
  score.value += bonus
  if (score.value > highScore.value) highScore.value = score.value
  cancelChallenge()
  matchesSinceChallenge.value = 0
  oracleHighlight.value = ''

  const msg = pick(LEVEL_FLAVORS).replace('{n}', String(level.value + 1))
  addLog(`🎉 ${msg}`, 'system')
  addLog(`✨ Level ${level.value} Bonus: +${bonus} pts`, 'system')

  if (wasFlawless)
    showAward('🧠', 'MIND PALACE', 'Flawless floor! The dungeon is appalled.')

  level.value++
  powerups.value = []
  lives.value = MAX_LIVES // full restore between levels

  // Small delay so player can see the board briefly before reset
  setTimeout(() => {
    prevMatchedNames = []
    prevFlippedCount = 0
    justMatched = false
    memoryStore.resetGame()
  }, 1400)
}

// ── Challenge ──────────────────────────────────────────────────────────────────
function startChallenge() {
  const unmatched = (memoryStore.galleryImages as any[]).filter(
    (c) => !c.matched,
  )
  if (unmatched.length < 4) return
  const target = pick(unmatched)
  challenge.active = true
  challenge.targetName = target.galleryName
  challenge.targetImagePath = target.imagePath
  challenge.timeLeft = 15
  if (challenge.timer) clearInterval(challenge.timer)
  challenge.timer = setInterval(() => {
    challenge.timeLeft--
    if (challenge.timeLeft <= 0) failChallenge()
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

// ── Powerups ───────────────────────────────────────────────────────────────────
function grantPowerup() {
  if (powerups.value.length >= 3) return
  const available = POWERUP_DEFS.filter((p) => {
    if (
      p.type === 'shield' &&
      (shieldActive.value || powerups.value.some((pu) => pu.type === 'shield'))
    )
      return false
    return true
  })
  if (!available.length) return
  const def = pick(available)
  powerups.value.push({ ...def, id: powerupIdCounter++ })
  addLog(
    `✨ Powerup dropped: ${def.icon} ${def.name} — ${def.description}`,
    'system',
  )
}

function usePowerup(pu: Powerup) {
  powerups.value = powerups.value.filter((p) => p.id !== pu.id)

  if (pu.type === 'lantern') {
    // CSS-driven reveal via .board-reveal class; no store mutation needed
    revealActive.value = true
    addLog(
      '🔦 Lantern ignites! Cards revealed for 2 seconds. Memorize fast.',
      'system',
    )
    if (revealTimer) clearTimeout(revealTimer)
    revealTimer = setTimeout(() => {
      revealActive.value = false
    }, 2000)
  } else if (pu.type === 'shield') {
    shieldActive.value = true
    addLog(
      '🛡️ Shield raised! Your next mistake shall be forgiven. This time.',
      'system',
    )
  } else if (pu.type === 'oracle') {
    const unmatched = (memoryStore.galleryImages as any[]).filter(
      (c) => !c.matched,
    )
    const nameCount = new Map<string, number>()
    unmatched.forEach((c: any) =>
      nameCount.set(c.galleryName, (nameCount.get(c.galleryName) ?? 0) + 1),
    )
    const pairs = [...nameCount.entries()]
      .filter(([, v]) => v >= 2)
      .map(([k]) => k)
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

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }
})

onUnmounted(() => {
  cancelChallenge()
  if (revealTimer) clearTimeout(revealTimer)
  if (oracleTimer) clearTimeout(oracleTimer)
  if (award.timer) clearTimeout(award.timer)
})
</script>

<style scoped>
/* ── Card 3D Flip ── */
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

/* ── Lantern Reveal ──
   Pure CSS: when .board-reveal is on the board container, unflipped cards
   show their fronts without touching Pinia state.                          */
.board-reveal .card-container:not(.card-matched) .card-inner:not(.flipped) {
  transform: rotateY(180deg);
}

/* ── Loader ── */
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

/* ── Transitions ── */
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

/* Award pop with spring */
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

/* Log entry slide-in */
.log-entry-enter-active {
  transition: all 0.2s ease;
}
.log-entry-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

/* Matched card fade */
.card-matched {
  transition: opacity 0.4s ease;
}
</style>
