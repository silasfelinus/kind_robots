// /stores/memoryStore.ts
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import confetti from 'canvas-confetti'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { useDisplayStore } from './displayStore'
import { useMilestoneStore } from './milestoneStore'
import { useUserStore } from './userStore'
import { usePromptStore } from './promptStore'
import { useArtStore } from './artStore'
import { handleError, performFetch } from './utils'

type NotificationType = 'error' | 'info' | 'success'
type PowerupId = 'lantern' | 'shield' | 'compass' | 'jellybean'
type AwardKind = 'score' | 'life' | 'powerup' | 'shield' | 'multiplier'
type RewardMode = 'manual' | 'text' | 'image' | 'both'

export interface GalleryImage {
  id: number
  pairId: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}

export interface DifficultyOption {
  label: string
  pairs: number
  columns: number
  lives: number
  challengeBonus: number
  levelPairStep: number
}

export interface MemoryPowerup {
  id: PowerupId
  label: string
  icon: string
  description: string
  uses: number
}

export interface MemoryAward {
  id: string
  kind: AwardKind
  label: string
  icon: string
  description: string
  scoreBonus?: number
  livesBonus?: number
  powerupId?: PowerupId
}

interface CustomNotification {
  type: NotificationType
  message: string
}

interface RewardPromptBundle {
  textPrompt: string
  artPrompt: string
}

const isClient = typeof window !== 'undefined'
const highScoreStorageKey = 'memoryDungeonHighScore'
const rewardModeStorageKey = 'memoryDungeonRewardMode'
const autoClaimRewardsStorageKey = 'memoryDungeonAutoClaimRewards'

const roundFlavors = [
  'You enter the Hall of Suspiciously Repeated Portraits. Every artifact has a twin. Probably tax reasons.',
  'The dungeon smells like old carpet, hot circuitry, and goblin ambition.',
  'A butterfly in a tiny helmet salutes you. The dungeon refuses to explain.',
  'You descend into the Archive of Mildly Cursed JPEGs.',
  'The cards shuffle themselves with the confidence of a villain who read one strategy blog.',
  'A mimic whispers, “Pick me.” That seems legally actionable.',
  'The lanterns flicker. Somewhere nearby, a skeleton is losing at solitaire.',
  'You find a sign reading: Memory required. Bravery optional. Snacks forbidden.',
]

const matchFlavors = [
  'A perfect match. Somewhere, a skeleton updates a spreadsheet.',
  'The artifacts click together like destiny with better image compression.',
  'The dungeon nods approvingly, then immediately pretends it did not.',
  'You found the pair. The mimic union hates this one trick.',
  'Correct. A tiny goblin accountant reluctantly awards points.',
  'The cards agree. Reality becomes 3% less embarrassing.',
  'Nice match. The dungeon briefly considers respecting you.',
]

const missFlavors = [
  'No match. A goblin quietly writes “skill issue” on the wall.',
  'The cards disagree, and honestly, they seem smug about it.',
  'A trapdoor opens emotionally, but not physically. Lucky.',
  'The dungeon coughs. It sounded judgmental.',
  'Incorrect. Somewhere, a bat with a clipboard marks you down.',
  'The artifacts refuse to pair. Dramatic little rectangles.',
  'Not a match. The dungeon whispers, “bold choice.”',
]

const challengeFlavors = [
  'The dungeon points at this artifact with unnecessary theatrical lighting.',
  'A tiny quest goblin demands this exact match next. He has a hat, so he outranks us.',
  'The butterfly oracle has chosen. She will not be taking questions.',
  'This is the cursed target. Match it next and look smug about it.',
  'The dungeon dares you to find this pair before it gets emotionally attached.',
]

const challengeSuccessFlavors = [
  'Challenge complete. The goblin judge slams a tiny gavel and awards bonus points.',
  'The target pair has been conquered. The dungeon makes a disappointed chandelier noise.',
  'Correct target. The butterfly oracle does one dignified backflip.',
  'You nailed the challenge. Somewhere, a mimic updates its résumé.',
]

const awardFlavors = [
  'Surprise loot! The dungeon briefly forgets it was trying to defeat you.',
  'A treasure butterfly appears and throws glitter with legal consequences.',
  'Bonus found. Probability is wearing a fake mustache today.',
  'The dungeon coughs up a reward. Gross, but useful.',
  'A suspiciously generous goblin hands you a prize and refuses eye contact.',
]

const gameOverFlavors = [
  'You have been defeated by rectangles. History will be weirdly quiet about this.',
  'The dungeon eats your last life, then leaves a Yelp review about your strategy.',
  'A tragic end. Very marketable. The goblins are already workshopping the musical.',
  'You fall bravely, mostly because the cards were being extremely rude.',
]

const winFlavors = [
  'Dungeon cleared. The cards are matched, the goblins are annoyed, and the butterflies are unionizing.',
  'Victory! The dungeon pretends this was all part of its plan.',
  'You cleared the level. A tiny skeleton applauds with unreasonable sincerity.',
  'Every pair is found. The dungeon legally has to respect you now.',
]

const rewardTitles = [
  'The Goblin Treasury Opens',
  'Butterfly Oracle Loot Drop',
  'The Mimic Apologizes',
  'A Chest With Suspicious Vibes',
  'The Dungeon Grants A Weird Boon',
  'Tiny Skeleton Standing Ovation',
]

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function randomEntry<T>(items: T[], fallback: T): T {
  if (!items.length) return fallback

  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? fallback
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function normalizeImagePath(value: unknown): string {
  if (typeof value !== 'string') return ''

  if (value.startsWith('http') || value.startsWith('/')) {
    return value
  }

  return `/images/gallery/${value}`
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

export const useMemoryStore = defineStore('memoryStore', () => {
  const userStore = useUserStore()
  const milestoneStore = useMilestoneStore()
  const displayStore = useDisplayStore()
  const promptStore = usePromptStore()
  const artStore = useArtStore()

  const difficulties: DifficultyOption[] = [
    {
      label: 'Goblin Picnic',
      pairs: 4,
      columns: 4,
      lives: 6,
      challengeBonus: 75,
      levelPairStep: 1,
    },
    {
      label: 'Haunted Hallway',
      pairs: 6,
      columns: 4,
      lives: 5,
      challengeBonus: 125,
      levelPairStep: 1,
    },
    {
      label: 'Mimic Audit',
      pairs: 8,
      columns: 4,
      lives: 4,
      challengeBonus: 175,
      levelPairStep: 2,
    },
    {
      label: 'Butterfly Catacombs',
      pairs: 12,
      columns: 6,
      lives: 3,
      challengeBonus: 250,
      levelPairStep: 2,
    },
  ]

  const selectedDifficulty = ref<DifficultyOption>(difficulties[0]!)
  const galleryImages = ref<GalleryImage[]>([])
  const gameWon = ref(false)
  const gameOver = ref(false)
  const isLoading = ref(false)
  const boardLocked = ref(false)
  const score = ref(0)
  const highScore = ref(0)
  const lives = ref(selectedDifficulty.value.lives)
  const maxLives = ref(selectedDifficulty.value.lives)
  const level = ref(1)
  const streak = ref(0)
  const comboMultiplier = ref(1)
  const challengeTargetPairId = ref<number | null>(null)
  const challengeBonus = ref(selectedDifficulty.value.challengeBonus)
  const challengeFlavor = ref('')
  const roundFlavor = ref('')
  const eventFlavor = ref('')
  const activeAward = ref<MemoryAward | null>(null)
  const notification = ref<CustomNotification | null>(null)
  const shielded = ref(false)
  const nextMatchDouble = ref(false)
  const isInitialized = ref(false)

  const rewardTitle = ref('')
  const rewardMode = ref<RewardMode>('manual')
  const autoClaimRewards = ref(false)
  const rewardTextPrompt = ref('')
  const rewardArtPrompt = ref('')
  const rewardText = ref('')
  const rewardArt = ref<ArtImage | null>(null)
  const rewardLoading = ref(false)
  const rewardTextLoading = ref(false)
  const rewardArtLoading = ref(false)
  const rewardClaimed = ref(false)
  const rewardError = ref('')

  const powerups = ref<MemoryPowerup[]>([])

  let firstSelected: GalleryImage | null = null
  let winProcessing = false

  const matchRecord = computed(() => userStore.matchRecord ?? 0)

  const pairsNeeded = computed(() => {
    const basePairs = selectedDifficulty.value.pairs
    const levelBonus =
      Math.max(0, level.value - 1) * selectedDifficulty.value.levelPairStep

    return Math.min(basePairs + levelBonus, 18)
  })

  const numberOfCards = computed(() => pairsNeeded.value * 2)

  const matchedPairs = computed(() => {
    const matched = new Set<number>()

    for (const card of galleryImages.value) {
      if (card.matched) {
        matched.add(card.pairId)
      }
    }

    return matched.size
  })

  const remainingPairs = computed(() =>
    Math.max(0, pairsNeeded.value - matchedPairs.value),
  )

  const challengeTarget = computed(() => {
    if (challengeTargetPairId.value === null) return null

    return (
      galleryImages.value.find(
        (card) => card.pairId === challengeTargetPairId.value && !card.matched,
      ) ?? null
    )
  })

  const cardSize = computed(() => {
    const screen = displayStore.viewportSize
    const cards = numberOfCards.value

    if (screen === 'small') {
      if (cards <= 8) return 76
      if (cards <= 12) return 68
      if (cards <= 18) return 58
      return 50
    }

    if (screen === 'medium') {
      if (cards <= 8) return 104
      if (cards <= 12) return 92
      if (cards <= 18) return 78
      return 68
    }

    if (screen === 'large') {
      if (cards <= 8) return 130
      if (cards <= 12) return 116
      if (cards <= 18) return 96
      return 86
    }

    if (cards <= 8) return 150
    if (cards <= 12) return 132
    if (cards <= 18) return 112
    return 96
  })

  const boardColumns = computed(() => {
    const screen = displayStore.viewportSize

    if (screen === 'small') return 4
    if (screen === 'medium')
      return Math.min(selectedDifficulty.value.columns, 5)

    return selectedDifficulty.value.columns
  })

  const gameBoardStyle = computed(() => ({
    gridTemplateColumns: `repeat(${boardColumns.value}, minmax(0, ${cardSize.value}px))`,
  }))

  const notificationClasses = computed(() => {
    const base = 'rounded-2xl border px-4 py-3 text-sm font-semibold'

    if (!notification.value) return base

    if (notification.value.type === 'error') {
      return `${base} border-error/40 bg-error/10 text-error`
    }

    if (notification.value.type === 'success') {
      return `${base} border-success/40 bg-success/10 text-success`
    }

    return `${base} border-info/40 bg-info/10 text-info`
  })

  const runStatus = computed(() => {
    if (rewardLoading.value) return 'Claiming Reward'
    if (gameOver.value) return 'Defeated'
    if (gameWon.value) return 'Level Cleared'
    if (isLoading.value) return 'Summoning Cards'
    return 'Exploring'
  })

  const rewardReady = computed(() => gameWon.value && !gameOver.value)

  const canClaimReward = computed(
    () =>
      rewardReady.value &&
      !rewardLoading.value &&
      rewardMode.value !== 'manual' &&
      !rewardClaimed.value,
  )

  function clearNotification(): void {
    notification.value = null
  }

  function setNotification(type: NotificationType, message: string): void {
    notification.value = { type, message }
  }

  function triggerConfetti(): void {
    if (!isClient) return

    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.65 },
    })
  }

  function createStartingPowerups(): MemoryPowerup[] {
    return [
      {
        id: 'lantern',
        label: 'Lantern',
        icon: 'kind-icon:lightbulb',
        description: 'Reveal every unmatched card for a heartbeat.',
        uses: 1,
      },
      {
        id: 'shield',
        label: 'Shield',
        icon: 'kind-icon:shield',
        description: 'Block the next failed match.',
        uses: 1,
      },
      {
        id: 'compass',
        label: 'Compass',
        icon: 'kind-icon:compass',
        description: 'Reveal one hidden matching pair.',
        uses: 1,
      },
      {
        id: 'jellybean',
        label: 'Jellybean',
        icon: 'kind-icon:jellybean',
        description: 'Double the next successful match.',
        uses: 1,
      },
    ]
  }

  function resetTurnState(): void {
    firstSelected = null
    boardLocked.value = false
  }

  function resetRewardState(): void {
    rewardTitle.value = ''
    rewardTextPrompt.value = ''
    rewardArtPrompt.value = ''
    rewardText.value = ''
    rewardArt.value = null
    rewardLoading.value = false
    rewardTextLoading.value = false
    rewardArtLoading.value = false
    rewardClaimed.value = false
    rewardError.value = ''
  }

  function resetRunStats(): void {
    score.value = 0
    level.value = 1
    streak.value = 0
    comboMultiplier.value = 1
    lives.value = selectedDifficulty.value.lives
    maxLives.value = selectedDifficulty.value.lives
    challengeBonus.value = selectedDifficulty.value.challengeBonus
    shielded.value = false
    nextMatchDouble.value = false
    activeAward.value = null
    powerups.value = createStartingPowerups()
    resetRewardState()
  }

  function updateHighScore(): void {
    if (score.value <= highScore.value) return

    highScore.value = score.value
    safeSetLocalStorage(highScoreStorageKey, String(score.value))
  }

  async function submitScoreIfNeeded(): Promise<void> {
    updateHighScore()

    try {
      await milestoneStore.initialize()

      if (score.value > matchRecord.value) {
        await milestoneStore.updateMatchRecord(score.value)
      }

      if (score.value >= 50) {
        await milestoneStore.rewardMilestone(5)
      }
    } catch (error) {
      handleError(error, 'updating memory dungeon score')
    }
  }

  function normalizeImagePath(value: unknown): string {
    if (typeof value !== 'string') return ''

    if (value.startsWith('http') || value.startsWith('/')) {
      return value
    }

    return `/images/gallery/${value}`
  }

  function extractArtImagePath(image: unknown): string {
    if (!image || typeof image !== 'object') return ''

    const record = image as Record<string, unknown>

    const candidates = [
      record.imagePath,
      record.path,
      record.thumbnailPath,
      record.url,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return normalizeImagePath(candidate)
      }
    }

    // Fall back to base64 data if present
    if (typeof record.imageData === 'string' && record.imageData) {
      const fileType =
        typeof record.fileType === 'string' && record.fileType
          ? record.fileType
          : 'png'
      return `data:image/${fileType};base64,${record.imageData}`
    }

    return ''
  }

  async function generateMemoryGameImages(): Promise<void> {
    try {
      isLoading.value = true
      boardLocked.value = true
      gameWon.value = false
      gameOver.value = false
      activeAward.value = null
      clearNotification()
      resetTurnState()

      // Make sure the art store has images loaded
      await artStore.initialize({
        fetchRemote: !artStore.hasCachedImages,
        hydrateImages: true,
      })

      const showMature = artStore.showMature
      const pool = artStore.artImages.filter((image) => {
        if (!image) return false
        if (!showMature && image.isMature) return false
        return Boolean(extractArtImagePath(image))
      })

      if (pool.length < 2) {
        throw new Error(
          'The dungeon could not find enough art images for a memory board. Generate some art first!',
        )
      }

      // Shuffle and slice the required number of unique images
      const needed = Math.min(pairsNeeded.value, pool.length)
      const picked = shuffle(pool).slice(0, needed)

      const imagePaths = picked
        .map((image) => extractArtImagePath(image))
        .filter(Boolean)

      if (imagePaths.length < 2) {
        throw new Error(
          'The dungeon could not extract enough valid image paths from the art collection.',
        )
      }

      galleryImages.value = shuffle(
        imagePaths.flatMap((imagePath, pairId) => [
          {
            id: pairId * 2,
            pairId,
            galleryName: `Dungeon artifact ${pairId + 1}`,
            imagePath,
            flipped: false,
            matched: false,
          },
          {
            id: pairId * 2 + 1,
            pairId,
            galleryName: `Dungeon artifact ${pairId + 1}`,
            imagePath,
            flipped: false,
            matched: false,
          },
        ]),
      ).map((card, index) => ({
        ...card,
        id: index,
      }))

      chooseChallengeTarget()

      roundFlavor.value = randomEntry(
        roundFlavors,
        'The dungeon prepares a fresh room of suspiciously duplicated artifacts.',
      ).replace('{level}', String(level.value))

      eventFlavor.value = `Level ${level.value} begins. ${remainingPairs.value} pairs lurk in the gloom.`
    } catch (error) {
      galleryImages.value = []
      setNotification(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to load memory dungeon.',
      )
      handleError(error, 'generating memory dungeon images')
    } finally {
      isLoading.value = false
      boardLocked.value = false
    }
  }

  function chooseChallengeTarget(): void {
    const unmatchedPairIds = [
      ...new Set(
        galleryImages.value
          .filter((card) => !card.matched)
          .map((card) => card.pairId),
      ),
    ]

    if (!unmatchedPairIds.length) {
      challengeTargetPairId.value = null
      challengeFlavor.value = ''
      return
    }

    challengeTargetPairId.value = randomEntry(
      unmatchedPairIds,
      unmatchedPairIds[0]!,
    )
    challengeFlavor.value = randomEntry(
      challengeFlavors,
      'The dungeon has selected a target. It is being weirdly intense about it.',
    )
  }

  function getPowerup(powerupId: PowerupId): MemoryPowerup | undefined {
    return powerups.value.find((powerup) => powerup.id === powerupId)
  }

  function updatePowerupUses(powerupId: PowerupId, amount: number): void {
    const powerup = getPowerup(powerupId)

    if (!powerup) return

    powerup.uses = Math.max(0, powerup.uses + amount)
  }

  function createAward(): MemoryAward {
    const possibleAwards: MemoryAward[] = [
      {
        id: createId('score'),
        kind: 'score',
        label: 'Goblin Refund',
        icon: 'kind-icon:jellybean',
        description: 'The dungeon reimburses you for emotional damages.',
        scoreBonus: 75 + level.value * 15,
      },
      {
        id: createId('life'),
        kind: 'life',
        label: 'Heart in a Jar',
        icon: 'kind-icon:heart',
        description: 'You recover one life. The jar is best left unexplained.',
        livesBonus: 1,
      },
      {
        id: createId('lantern'),
        kind: 'powerup',
        label: 'Lantern Moth',
        icon: 'kind-icon:lightbulb',
        description:
          'A moth joins the party and brings suspiciously useful lighting.',
        powerupId: 'lantern',
      },
      {
        id: createId('compass'),
        kind: 'powerup',
        label: 'Butterfly Compass',
        icon: 'kind-icon:compass',
        description:
          'The compass points toward a pair, but looks smug about it.',
        powerupId: 'compass',
      },
      {
        id: createId('shield'),
        kind: 'shield',
        label: 'Goblin Insurance',
        icon: 'kind-icon:shield',
        description: 'The next mistake is blocked by paperwork.',
      },
      {
        id: createId('multiplier'),
        kind: 'multiplier',
        label: 'Combo Gremlin',
        icon: 'kind-icon:magic',
        description: 'Your next scoring burst gets extra gremlin math.',
      },
    ]

    return randomEntry(possibleAwards, possibleAwards[0]!)
  }

  function applyAward(award: MemoryAward): void {
    activeAward.value = award

    if (award.scoreBonus) {
      score.value += award.scoreBonus
    }

    if (award.livesBonus) {
      lives.value = Math.min(maxLives.value, lives.value + award.livesBonus)
    }

    if (award.kind === 'powerup' && award.powerupId) {
      updatePowerupUses(award.powerupId, 1)
    }

    if (award.kind === 'shield') {
      shielded.value = true
    }

    if (award.kind === 'multiplier') {
      comboMultiplier.value = Math.min(8, comboMultiplier.value + 1)
    }

    eventFlavor.value = `${randomEntry(awardFlavors, 'Surprise loot appears.')} ${award.description}`
  }

  function maybeGrantAward(chance: number): void {
    if (Math.random() > chance) return

    applyAward(createAward())
  }

  function calculateMatchScore(challengeMatched: boolean): number {
    const baseScore = 100
    const streakBonus = streak.value * 15
    const challengeScore = challengeMatched ? challengeBonus.value : 0
    const doubleBonus = nextMatchDouble.value ? 2 : 1

    return Math.round(
      (baseScore + streakBonus + challengeScore) *
        comboMultiplier.value *
        doubleBonus,
    )
  }

  async function handleMatch(card: GalleryImage): Promise<void> {
    const challengeMatched = card.pairId === challengeTargetPairId.value
    const points = calculateMatchScore(challengeMatched)

    streak.value += 1
    comboMultiplier.value = Math.min(6, 1 + Math.floor(streak.value / 3))
    score.value += points
    nextMatchDouble.value = false

    if (challengeMatched) {
      eventFlavor.value = `${randomEntry(
        challengeSuccessFlavors,
        'Challenge complete. The dungeon is furious and impressed.',
      )} +${points}`
      maybeGrantAward(0.55)
    } else {
      eventFlavor.value = `${randomEntry(matchFlavors, 'A match!')} +${points}`
      maybeGrantAward(0.18)
    }

    chooseChallengeTarget()

    await checkForWin()
  }

  function handleMiss(): void {
    streak.value = 0
    comboMultiplier.value = 1

    if (shielded.value) {
      shielded.value = false
      eventFlavor.value =
        'Goblin Insurance activates. The mistake is blocked by a very boring contract.'
      return
    }

    lives.value = Math.max(0, lives.value - 1)
    score.value = Math.max(0, score.value - 25)
    eventFlavor.value = randomEntry(
      missFlavors,
      'Not a match. The dungeon judges you.',
    )

    if (lives.value <= 0) {
      gameOver.value = true
      boardLocked.value = true
      eventFlavor.value = randomEntry(
        gameOverFlavors,
        'The dungeon claims another brave memory explorer.',
      )
      void submitScoreIfNeeded()
    }
  }

  function buildRewardPrompt(): RewardPromptBundle {
    const title = randomEntry(rewardTitles, 'The Dungeon Grants A Weird Boon')
    const difficulty = selectedDifficulty.value.label
    const lifeText = `${lives.value}/${maxLives.value}`
    const resultSummary = `Level ${level.value} cleared with ${score.value} score, ${lifeText} lives, ${streak.value} streak, ${difficulty} difficulty.`

    rewardTitle.value = title

    const textPrompt = [
      'Write a short, unexpectedly funny dungeon reward scene for a whimsical Kind Robots memory game.',
      'The player just cleared a level by matching pairs of magical image cards.',
      `Run summary: ${resultSummary}`,
      'Tone: clever, warm, weird, playful, a little gobliny, no sentimentality.',
      'Include: the reward name, one strange magical effect, and one punchline.',
      'Length: 80 to 130 words.',
    ].join('\n')

    const artPrompt = [
      'playful whimsical fantasy reward chest in a magical memory dungeon',
      'rainbow butterfly oracle',
      'tiny goblin accountant',
      'glowing paired cards',
      'kind robots aesthetic',
      'cozy magical dungeon',
      'storybook illustration',
      'bright friendly colors',
      'soft lighting',
      'high detail',
      `reward title: ${title}`,
      `game stats: level ${level.value}, score ${score.value}`,
    ].join(', ')

    rewardTextPrompt.value = textPrompt
    rewardArtPrompt.value = artPrompt

    return {
      textPrompt,
      artPrompt,
    }
  }

  async function generateRewardText(textPrompt: string): Promise<string> {
    rewardTextLoading.value = true

    try {
      await promptStore.initialize()
      promptStore.addPromptToArray(textPrompt)
      promptStore.currentPrompt = textPrompt
      promptStore.promptField = textPrompt

      const text = await promptStore.streamPromptCompletion(textPrompt)

      rewardText.value =
        text.trim() ||
        'The dungeon opens a chest full of dramatic lighting and one coupon for emotional goblin support.'

      return rewardText.value
    } catch (error) {
      handleError(error, 'generating memory dungeon reward text')
      rewardError.value =
        error instanceof Error
          ? error.message
          : 'Failed to generate reward text.'

      return ''
    } finally {
      rewardTextLoading.value = false
    }
  }

  async function generateRewardArt(
    artPrompt: string,
  ): Promise<ArtImage | null> {
    rewardArtLoading.value = true

    try {
      await artStore.initialize()

      promptStore.promptField = artPrompt
      promptStore.currentPrompt = artPrompt
      promptStore.setPromptsFromString(artPrompt)

      const response = await artStore.generateArt({
        promptString: artPrompt,
        negativePrompt:
          'blurry, low quality, scary horror, gore, grimdark, unreadable text, watermark',
        pitch: rewardTitle.value || 'Memory Dungeon Reward',
        userId: userStore.userId || 10,
        checkpoint: artStore.artForm.checkpoint || '',
        sampler: artStore.artForm.sampler || '',
        steps: artStore.artForm.steps ?? 25,
        designer: userStore.username || 'Kind Designer',
        cfg: artStore.artForm.cfg ?? 7,
        cfgHalf: artStore.artForm.cfgHalf ?? false,
        isMature: false,
        isPublic: true,
        seed: null,
        promptId: null,
        pitchId: null,
        serverId: artStore.artForm.serverId ?? null,
        serverName: artStore.artForm.serverName ?? null,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Reward art generation failed.')
      }

      rewardArt.value = response.data
      return response.data
    } catch (error) {
      handleError(error, 'generating memory dungeon reward art')
      rewardError.value =
        error instanceof Error
          ? error.message
          : 'Failed to generate reward art.'

      return null
    } finally {
      rewardArtLoading.value = false
    }
  }

  // in memoryStore.ts — add this action, keep selectCard for the old UI
  function flipCard(card: GalleryImage): void {
    if (boardLocked.value || card.flipped || card.matched) return

    card.flipped = true

    if (!firstSelected) {
      firstSelected = card
      return
    }

    boardLocked.value = true

    if (firstSelected.pairId === card.pairId && firstSelected.id !== card.id) {
      card.matched = true
      firstSelected.matched = true
      firstSelected = null
      boardLocked.value = false
      return
    }

    const missed = firstSelected
    firstSelected = null

    window.setTimeout(() => {
      card.flipped = false
      missed.flipped = false
      boardLocked.value = false
    }, 700)
  }

  async function claimLevelReward(mode = rewardMode.value): Promise<void> {
    if (!rewardReady.value || rewardLoading.value || mode === 'manual') return

    rewardLoading.value = true
    rewardError.value = ''
    rewardClaimed.value = false

    const prompts = buildRewardPrompt()

    try {
      if (mode === 'text' || mode === 'both') {
        await generateRewardText(prompts.textPrompt)
      }

      if (mode === 'image' || mode === 'both') {
        await generateRewardArt(prompts.artPrompt)
      }

      rewardClaimed.value = true
      setNotification(
        'success',
        'Reward claimed. The dungeon is pretending this was intentional.',
      )
    } catch (error) {
      handleError(error, 'claiming memory dungeon reward')
      rewardError.value =
        error instanceof Error ? error.message : 'Failed to claim level reward.'
      setNotification('error', rewardError.value)
    } finally {
      rewardLoading.value = false
    }
  }

  async function checkForWin(): Promise<void> {
    if (winProcessing) return
    if (!galleryImages.value.length) return
    if (!galleryImages.value.every((card) => card.matched)) return

    winProcessing = true

    try {
      gameWon.value = true
      boardLocked.value = true
      eventFlavor.value = randomEntry(winFlavors, 'Dungeon cleared.')
      triggerConfetti()
      buildRewardPrompt()
      await submitScoreIfNeeded()

      if (autoClaimRewards.value && rewardMode.value !== 'manual') {
        await claimLevelReward(rewardMode.value)
      }
    } finally {
      winProcessing = false
    }
  }

  async function selectCard(card: GalleryImage): Promise<void> {
    if (boardLocked.value || gameOver.value || gameWon.value) return
    if (card.flipped || card.matched) return

    card.flipped = true

    if (!firstSelected) {
      firstSelected = card
      return
    }

    boardLocked.value = true

    if (firstSelected.pairId === card.pairId && firstSelected.id !== card.id) {
      card.matched = true
      firstSelected.matched = true

      const matchedCard = card
      firstSelected = null

      window.setTimeout(() => {
        boardLocked.value = false
        void handleMatch(matchedCard)
      }, 350)

      return
    }

    window.setTimeout(() => {
      card.flipped = false

      if (firstSelected) {
        firstSelected.flipped = false
      }

      firstSelected = null
      handleMiss()

      if (!gameOver.value) {
        boardLocked.value = false
      }
    }, 700)
  }

  function revealCards(cards: GalleryImage[], duration = 1200): void {
    if (!cards.length) return

    boardLocked.value = true

    for (const card of cards) {
      if (!card.matched) {
        card.flipped = true
      }
    }

    window.setTimeout(() => {
      for (const card of cards) {
        if (!card.matched) {
          card.flipped = false
        }
      }

      firstSelected = null
      boardLocked.value = false
    }, duration)
  }

  function useLantern(): void {
    const cards = galleryImages.value.filter((card) => !card.matched)

    revealCards(cards, 1400)
    eventFlavor.value =
      'The Lantern Moth reveals the board. Everyone act surprised.'
  }

  function useCompass(): void {
    const pairIds = [
      ...new Set(
        galleryImages.value
          .filter((card) => !card.matched)
          .map((card) => card.pairId),
      ),
    ]

    const pairId = randomEntry(pairIds, pairIds[0] ?? 0)
    const cards = galleryImages.value.filter((card) => card.pairId === pairId)

    revealCards(cards, 1500)
    eventFlavor.value =
      'The Butterfly Compass points toward a pair and looks unbearably pleased.'
  }

  function useShield(): void {
    shielded.value = true
    eventFlavor.value =
      'Goblin Insurance is active. Your next miss gets smothered in paperwork.'
  }

  function useJellybean(): void {
    nextMatchDouble.value = true
    eventFlavor.value =
      'Chrono Jellybean armed. Your next match gets suspiciously profitable.'
  }

  function usePowerup(powerupId: PowerupId): void {
    if (boardLocked.value || gameOver.value || gameWon.value) return

    const powerup = getPowerup(powerupId)

    if (!powerup || powerup.uses <= 0) {
      setNotification(
        'info',
        'That powerup is empty. The dungeon has terrible refill policies.',
      )
      return
    }

    updatePowerupUses(powerupId, -1)

    if (powerupId === 'lantern') {
      useLantern()
      return
    }

    if (powerupId === 'compass') {
      useCompass()
      return
    }

    if (powerupId === 'shield') {
      useShield()
      return
    }

    useJellybean()
  }

  async function startDungeonRun(): Promise<void> {
    resetRunStats()
    await generateMemoryGameImages()
  }

  async function resetGame(payload?: {
    level?: number
    pairModifier?: number
  }): Promise<void> {
    if (payload?.level !== undefined) level.value = payload.level
    // pairModifier isn't a store concept — component owns it, ignore here
    gameWon.value = false
    gameOver.value = false
    boardLocked.value = false
    firstSelected = null
    await generateMemoryGameImages()
  }
  async function advanceLevel(): Promise<void> {
    level.value += 1
    gameWon.value = false
    gameOver.value = false
    boardLocked.value = false
    firstSelected = null
    activeAward.value = null
    resetRewardState()
    lives.value = Math.min(maxLives.value, lives.value + 1)
    challengeBonus.value =
      selectedDifficulty.value.challengeBonus + level.value * 25
    roundFlavor.value = randomEntry(
      roundFlavors,
      'The dungeon rearranges itself with suspicious enthusiasm.',
    )
    eventFlavor.value = `Level ${level.value} opens. The dungeon has escalated from rude to theatrical.`
    await generateMemoryGameImages()
  }

  function setRewardMode(mode: RewardMode): void {
    rewardMode.value = mode
    safeSetLocalStorage(rewardModeStorageKey, mode)
  }

  function setAutoClaimRewards(value: boolean): void {
    autoClaimRewards.value = value
    safeSetLocalStorage(autoClaimRewardsStorageKey, String(value))
  }

  function loadPreferences(): void {
    const savedHighScore = safeGetLocalStorage(highScoreStorageKey)
    const parsedHighScore = savedHighScore ? Number(savedHighScore) : 0

    highScore.value = Number.isFinite(parsedHighScore) ? parsedHighScore : 0

    const savedRewardMode = safeGetLocalStorage(rewardModeStorageKey)

    if (
      savedRewardMode === 'manual' ||
      savedRewardMode === 'text' ||
      savedRewardMode === 'image' ||
      savedRewardMode === 'both'
    ) {
      rewardMode.value = savedRewardMode
    }

    autoClaimRewards.value =
      safeGetLocalStorage(autoClaimRewardsStorageKey) === 'true'
  }

  async function initialize(options: { force?: boolean } = {}): Promise<void> {
    if (isInitialized.value && !options.force) return

    loadPreferences()
    powerups.value = createStartingPowerups()
    lives.value = selectedDifficulty.value.lives
    maxLives.value = selectedDifficulty.value.lives
    challengeBonus.value = selectedDifficulty.value.challengeBonus
    isInitialized.value = true

    await promptStore.initialize()
    await artStore.initialize()

    if (!galleryImages.value.length || options.force) {
      await startDungeonRun()
    }
  }

  function resetInitialization(): void {
    isInitialized.value = false
  }

  watch(selectedDifficulty, () => {
    if (!isInitialized.value) return
    void startDungeonRun()
  })

  watch(rewardMode, (value) => {
    safeSetLocalStorage(rewardModeStorageKey, value)
  })

  watch(autoClaimRewards, (value) => {
    safeSetLocalStorage(autoClaimRewardsStorageKey, String(value))
  })

  return {
    difficulties,
    selectedDifficulty,
    galleryImages,
    gameWon,
    gameOver,
    isLoading,
    boardLocked,
    score,
    highScore,
    lives,
    maxLives,
    level,
    streak,
    comboMultiplier,
    challengeTargetPairId,
    challengeTarget,
    challengeBonus,
    challengeFlavor,
    roundFlavor,
    eventFlavor,
    activeAward,
    notification,
    notificationClasses,
    shielded,
    nextMatchDouble,
    powerups,
    isInitialized,

    rewardTitle,
    rewardMode,
    autoClaimRewards,
    rewardTextPrompt,
    rewardArtPrompt,
    rewardText,
    rewardArt,
    rewardLoading,
    rewardTextLoading,
    rewardArtLoading,
    rewardClaimed,
    rewardError,
    rewardReady,
    canClaimReward,

    matchRecord,
    pairsNeeded,
    numberOfCards,
    matchedPairs,
    remainingPairs,
    cardSize,
    boardColumns,
    gameBoardStyle,
    runStatus,

    initialize,
    resetInitialization,
    selectCard,
    handleGalleryClick: selectCard,
    usePowerup,
    startDungeonRun,
    resetGame,
    advanceLevel,
    clearNotification,
    setRewardMode,
    setAutoClaimRewards,
    buildRewardPrompt,
    claimLevelReward,
    generateRewardText,
    generateRewardArt,
    flipCard,
  }
})
