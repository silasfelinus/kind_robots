// stores/adventureStore.ts
//
// Pure flow state machine for the CYOA character builder.
// Owns: active card, step navigation, staged values, reward options.
// Does NOT own: API calls, LLM calls, final character save.
//
// Model-agnostic — the AdventureSheet maps cleanly onto the Character
// schema (name now nullable, presentation/drive/achievements promoted to Text).
// Other builders can adapt this store for different entity models.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import {
  ADVENTURE_CARDS,
  type AdventureCard,
  type AdventureStep,
} from '@/stores/helpers/adventureCards'
import { useGeneratorStore, type RolledReward } from '@/stores/generatorStore'
import type { Rarity } from '@/stores/rewardStore'

// ── Types ──────────────────────────────────────────────────────────────────

const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'adventureBuilderState'

export type StatEntry = {
  key: string
  name: string
  display: string // emoji shown in the stat grid
  value: number // 0 = unassigned, 1–6 = assigned
}

/**
 * The working character sheet.
 * Field names match the Character Prisma model directly —
 * no aliasing, no transformation needed at save time.
 */
export type AdventureSheet = {
  // Identity
  name: string
  honorific: string
  role: string
  genre: string
  // Origin
  species: string
  class: string
  alignment: string
  // Identity
  gender: string
  // Personality
  personality: string
  // Background
  backstory: string
  quirks: string
  // Art
  artPrompt: string
  imagePath: string | null
  artImageId: number | null
  // Stats — values 0 (unset) or 1–6
  stats: StatEntry[]
  // Rarity tiers derived from stat allocation
  luck: Rarity
  might: Rarity
  wits: Rarity
  grace: Rarity
  charm: Rarity
  empathy: Rarity
  // Reward slots keyed by rewardSlotKey e.g. 'common-skill'
  rewards: Record<string, RolledReward>
  // Meta
  userId: number
  isPublic: boolean
  isMature: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

export const STAT_BLOCKS = [1, 2, 3, 4, 5, 6] as const

/** Cards whose completion unlocks the skill slots. */
const CORE_CARD_KEYS = [
  'role',
  'name',
  'origin',
  'identity',
  'personality',
  'stats',
  'background',
] as const

/** Cards whose completion unlocks the portrait slot. */
const ALL_REQUIRED_KEYS = [
  ...CORE_CARD_KEYS,
  'common-skill',
  'uncommon-skill',
  'rare-skill',
] as const

/** Base rarity for each reward card. */
const SLOT_BASE_RARITY: Record<string, Rarity> = {
  'common-skill': 'COMMON',
  'uncommon-skill': 'UNCOMMON',
  'rare-skill': 'RARE',
}

// ── Defaults ───────────────────────────────────────────────────────────────

function defaultStats(): StatEntry[] {
  return [
    { key: 'luck', name: 'Luck', display: '🍀', value: 0 },
    { key: 'swol', name: 'Swol', display: '💪', value: 0 },
    { key: 'wits', name: 'Wits', display: '🧠', value: 0 },
    { key: 'flexibility', name: 'Flexibility', display: '🤸', value: 0 },
    { key: 'rizz', name: 'Rizz', display: '✨', value: 0 },
    { key: 'empathy', name: 'Empathy', display: '💜', value: 0 },
  ]
}

function defaultSheet(userId = 10): AdventureSheet {
  return {
    name: '',
    honorific: 'adventurer',
    role: '',
    genre: '',
    species: '',
    class: '',
    alignment: '',
    gender: '',
    personality: '',
    backstory: '',
    quirks: '',
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    stats: defaultStats(),
    luck: 'COMMON',
    might: 'COMMON',
    wits: 'COMMON',
    grace: 'COMMON',
    charm: 'COMMON',
    empathy: 'COMMON',
    rewards: {},
    userId,
    isPublic: true,
    isMature: false,
  }
}

// ── Stat tier helper ───────────────────────────────────────────────────────

function tierFromValue(v: number): Rarity {
  if (v >= 6) return 'MYTHIC'
  if (v === 5) return 'LEGENDARY'
  if (v === 4) return 'EPIC'
  if (v === 3) return 'RARE'
  if (v === 2) return 'UNCOMMON'
  return 'COMMON'
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function saveToStorage(data: unknown): void {
  if (!isClient) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadFromStorage(): unknown {
  if (!isClient) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAdventureStore = defineStore('adventureStore', () => {
  const generator = useGeneratorStore()

  // ── Session state ──────────────────────────────────────────────────────

  const activeCardKey = ref<string | null>(null)
  const activeStepIndex = ref(0)

  /**
   * Staged values for the active card's steps.
   * Key = step.key, value = user's input string.
   * Written to sheet only when the card is finished.
   */
  const stagedValues = reactive<Record<string, string>>({})

  /** Completed card keys. */
  const completedCards = reactive<Record<string, boolean>>({})

  // Stats
  const selectedStatBlock = ref<number | null>(null)
  const draftStats = reactive<StatEntry[]>(defaultStats())

  // Rewards
  /** Rolled options per slot. Key = rewardSlotKey. */
  const rewardOptions = reactive<Record<string, RolledReward[]>>({})
  /** Selected option id per slot. Key = rewardSlotKey. */
  const selectedRewardId = reactive<Record<string, string>>({})

  // Sheet
  const sheet = reactive<AdventureSheet>(defaultSheet())

  // Status
  const llmLoading = ref(false)
  const llmError = ref<string | null>(null)
  const saveMessage = ref('')
  const saveError = ref('')

  // ── Unlock gates ───────────────────────────────────────────────────────

  const coreComplete = computed(() =>
    CORE_CARD_KEYS.every((k) => completedCards[k]),
  )

  const allComplete = computed(() =>
    ALL_REQUIRED_KEYS.every((k) => completedCards[k]),
  )

  // ── Deck ───────────────────────────────────────────────────────────────

  const visibleCards = computed<AdventureCard[]>(() =>
    ADVENTURE_CARDS.filter((card) => {
      if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
        return false
      if (card.unlockCondition === 'allComplete' && !allComplete.value)
        return false
      // Completed cards leave the hand (portrait card always stays)
      if (completedCards[card.key] && card.key !== 'art') return false
      return true
    }),
  )

  const activeCard = computed<AdventureCard | null>(() =>
    activeCardKey.value
      ? (ADVENTURE_CARDS.find((c) => c.key === activeCardKey.value) ?? null)
      : null,
  )

  const activeStep = computed<AdventureStep | null>(
    () => activeCard.value?.steps[activeStepIndex.value] ?? null,
  )

  const isLastStep = computed(
    () =>
      !activeCard.value ||
      activeStepIndex.value >= activeCard.value.steps.length - 1,
  )

  const isFirstStep = computed(() => activeStepIndex.value === 0)

  // ── Stat computed ──────────────────────────────────────────────────────

  const usedStatValues = computed(() =>
    draftStats.map((s) => s.value).filter((v) => v > 0),
  )

  const statAllocationComplete = computed(() => {
    const sorted = draftStats.map((s) => s.value).sort((a, b) => a - b)
    return sorted.join(',') === '1,2,3,4,5,6'
  })

  // ── Reward computed ────────────────────────────────────────────────────

  const activeRewardOptions = computed<RolledReward[]>(
    () => rewardOptions[activeCard.value?.rewardSlotKey ?? ''] ?? [],
  )

  const activeSelectedRewardId = computed<string>(
    () => selectedRewardId[activeCard.value?.rewardSlotKey ?? ''] ?? '',
  )

  // ── Finish eligibility ─────────────────────────────────────────────────

  const canFinish = computed(() => {
    if (!activeStep.value) return false
    const { inputType } = activeStep.value
    if (inputType === 'stats') return statAllocationComplete.value
    if (inputType === 'reward') {
      const slotKey = activeCard.value?.rewardSlotKey
      return slotKey ? Boolean(selectedRewardId[slotKey]) : false
    }
    return true // text, long, list, preset, art
  })

  // ── Card selection ─────────────────────────────────────────────────────

  function selectCard(cardKey: string) {
    const card = ADVENTURE_CARDS.find((c) => c.key === cardKey)
    if (!card) return

    activeCardKey.value = cardKey
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    llmError.value = null

    // Pre-fill staged values from what's already on the sheet
    for (const step of card.steps) {
      if (step.field) {
        const existing = (sheet as Record<string, unknown>)[step.field]
        stagedValues[step.key] = typeof existing === 'string' ? existing : ''
      }
    }

    // Mirror sheet stats into draftStats if re-entering the stats card
    if (card.key === 'stats') {
      for (const ds of draftStats) {
        ds.value = sheet.stats.find((s) => s.key === ds.key)?.value ?? 0
      }
    }

    // Roll reward options (or reuse existing roll)
    if (card.rewardSlotKey) {
      if (!rewardOptions[card.rewardSlotKey]?.length) {
        rollRewardOptions(card.rewardSlotKey)
      }
      // Restore previous selection if user had picked one before clearing
      if (!selectedRewardId[card.rewardSlotKey]) {
        const existing = sheet.rewards[card.rewardSlotKey]
        if (existing) selectedRewardId[card.rewardSlotKey] = existing.id
      }
    }
  }

  /** Pick a random card from the visible deck. */
  function randomCard() {
    if (!visibleCards.value.length) return
    const pick = visibleCards.value[
      Math.floor(Math.random() * visibleCards.value.length)
    ] as AdventureCard
    selectCard(pick.key)
  }

  function cancelCard() {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    llmError.value = null
  }

  // ── Step navigation ────────────────────────────────────────────────────

  function setStagedValue(stepKey: string, value: string) {
    stagedValues[stepKey] = value
    persistState()
  }

  function nextStep() {
    if (!activeCard.value) return
    if (activeStepIndex.value < activeCard.value.steps.length - 1) {
      activeStepIndex.value++
    }
  }

  function prevStep() {
    if (activeStepIndex.value > 0) activeStepIndex.value--
  }

  /**
   * Select a preset choice for the current step.
   * If the choice carries a value (not opensCustom / opensList),
   * commit immediately and advance or finish.
   */
  function selectPresetChoice(stepKey: string, value: string) {
    stagedValues[stepKey] = value
    persistState()
    if (isLastStep.value) {
      finishCard()
    } else {
      nextStep()
    }
  }

  // ── Finish card ────────────────────────────────────────────────────────

  function finishCard() {
    if (!activeCard.value) return
    saveError.value = ''
    const card = activeCard.value

    // Stats card
    if (card.key === 'stats') {
      if (!statAllocationComplete.value) {
        saveError.value =
          'Assign each stat a unique value from 1 to 6 before finishing.'
        return
      }
      syncStatTiers()
      completedCards['stats'] = true
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Reward card
    if (card.rewardSlotKey) {
      const optionId = selectedRewardId[card.rewardSlotKey]
      const option = rewardOptions[card.rewardSlotKey]?.find(
        (o) => o.id === optionId,
      )
      if (option) sheet.rewards[card.rewardSlotKey] = option
      completedCards[card.key] = true
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Art card
    if (card.key === 'art') {
      completedCards['art'] = Boolean(
        sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId,
      )
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Standard card — write staged values to sheet fields
    for (const step of card.steps) {
      if (!step.field) continue
      ;(sheet as Record<string, unknown>)[step.field] =
        stagedValues[step.key] ?? ''
    }

    completedCards[card.key] = true
    persistState()
    _advanceToNextCard(card.key)
  }

  function _advanceToNextCard(previousKey: string) {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null

    const next = visibleCards.value.find(
      (c) => c.key !== previousKey && !completedCards[c.key],
    )
    if (next) selectCard(next.key)
  }

  // ── Section removal ────────────────────────────────────────────────────

  function removeSection(cardKey: string) {
    const card = ADVENTURE_CARDS.find((c) => c.key === cardKey)
    if (!card) return

    for (const field of card.restoresFields) {
      _clearSheetField(field)
    }

    completedCards[cardKey] = false
    if (activeCardKey.value === cardKey) cancelCard()
  }

  function _clearSheetField(field: string) {
    // Stats block
    if (field === 'stats') {
      for (const s of sheet.stats) s.value = 0
      for (const s of draftStats) s.value = 0
      sheet.luck =
        sheet.might =
        sheet.wits =
        sheet.grace =
        sheet.charm =
        sheet.empathy =
          'COMMON'
      return
    }
    // Nullables
    if (field === 'imagePath') {
      sheet.imagePath = null
      return
    }
    if (field === 'artImageId') {
      sheet.artImageId = null
      return
    }
    if (field === 'artPrompt') {
      sheet.artPrompt = ''
      return
    }
    // Dropped fields — silently ignore if restoration is attempted
    if (['title', 'presentation', 'drive', 'achievements'].includes(field))
      return
    // Reward slots
    if (field in SLOT_BASE_RARITY) {
      delete sheet.rewards[field]
      selectedRewardId[field] = ''
      rewardOptions[field] = []
      completedCards[field] = false
      return
    }
    // String fields
    const key = field as keyof AdventureSheet
    if (typeof sheet[key] === 'string') {
      ;(sheet as Record<string, unknown>)[field] =
        field === 'honorific' ? 'adventurer' : ''
    }
  }

  // ── Stat assignment ────────────────────────────────────────────────────

  function selectStatBlock(block: number) {
    selectedStatBlock.value = selectedStatBlock.value === block ? null : block
  }

  function assignStat(statKey: string) {
    if (!selectedStatBlock.value) return
    const block = selectedStatBlock.value

    // Unassign this block from any other slot first
    for (const stat of draftStats) {
      if (stat.key !== statKey && stat.value === block) stat.value = 0
    }

    const target = draftStats.find((s) => s.key === statKey)
    if (target) target.value = block
    selectedStatBlock.value = null
  }

  function rollAllStats() {
    const shuffled = [...STAT_BLOCKS].sort(() => Math.random() - 0.5)
    draftStats.forEach((stat, i) => {
      stat.value = shuffled[i] ?? 0
    })
    selectedStatBlock.value = null
  }

  function syncStatTiers() {
    const val = (key: string) =>
      draftStats.find((s) => s.key === key)?.value ?? 0

    sheet.luck = tierFromValue(val('luck'))
    sheet.might = tierFromValue(val('swol'))
    sheet.wits = tierFromValue(val('wits'))
    sheet.grace = tierFromValue(val('flexibility'))
    sheet.charm = tierFromValue(val('rizz'))
    sheet.empathy = tierFromValue(val('empathy'))

    // Mirror into sheet.stats for display
    for (const ds of draftStats) {
      const target = sheet.stats.find((s) => s.key === ds.key)
      if (target) target.value = ds.value
    }
  }

  // ── Reward rolling ─────────────────────────────────────────────────────

  function rollRewardOptions(cardKey: string) {
    const base = SLOT_BASE_RARITY[cardKey] ?? 'COMMON'
    rewardOptions[cardKey] = generator.rollRewardOptions(base, 4)
    selectedRewardId[cardKey] = ''
  }

  function selectRewardOption(slotKey: string, optionId: string) {
    selectedRewardId[slotKey] = optionId
  }

  // ── Suggest (no LLM) ──────────────────────────────────────────────────

  /**
   * Fill the current step using the generator store.
   * Steps with needsLLM: true are handled by the parent component via API.
   */
  function suggestCurrentStep() {
    if (!activeStep.value) return
    const step = activeStep.value

    if (step.inputType === 'stats') {
      rollAllStats()
      return
    }

    if (step.inputType === 'reward' && activeCard.value?.rewardSlotKey) {
      rollRewardOptions(activeCard.value.rewardSlotKey)
      return
    }

    if (step.key === 'alignment') {
      stagedValues[step.key] = generator.generateAlignment()
      return
    }

    if (step.generatorKey) {
      const val = generator.generateOne(step.generatorKey, '')
      if (val) {
        if (step.appendSuggest && stagedValues[step.key]?.trim()) {
          // Append with comma separator instead of replacing
          const existing = stagedValues[step.key].trimEnd()
          const separator = existing.endsWith(',') ? ' ' : ', '
          stagedValues[step.key] = existing + separator + val
        } else {
          stagedValues[step.key] = val
        }
      }
    }
  }

  // ── Art prompt assembly ────────────────────────────────────────────────

  /**
   * Assemble an art prompt from the user-selected sheet fields.
   * Writes to sheet.artPrompt and returns the resulting string.
   */
  function buildArtPrompt(includeFields: string[]): string {
    const parts: string[] = []
    const inc = (key: string, value: string, prefix?: string) => {
      if (includeFields.includes(key) && value.trim()) {
        parts.push(prefix ? `${prefix}: ${value}` : value)
      }
    }

    if (includeFields.includes('name') && sheet.name)
      parts.push(`Character portrait of ${sheet.name}`)

    inc('species', sheet.species)
    inc('class', sheet.class)
    inc('personality', sheet.personality, 'personality')
    inc('genre', sheet.genre ? `${sheet.genre} aesthetic` : '')
    inc('role', sheet.role ? `the ${sheet.role}` : '')
    inc('alignment', sheet.alignment)

    const skillText = Object.values(sheet.rewards)
      .map((r) => `${r.rarity.toLowerCase()} skill: ${r.label}`)
      .join(', ')

    if (skillText) parts.push(`skills: ${skillText}`)

    if (includeFields.includes('backstory') && sheet.backstory)
      parts.push(`context: ${sheet.backstory.slice(0, 120)}`)

    parts.push(
      'expressive presence, strong silhouette, detailed design, vivid narrative quality',
    )

    const prompt = parts.filter(Boolean).join(', ')
    sheet.artPrompt = prompt
    return prompt
  }

  /**
   * Apply art generation results to the sheet.
   * Called by adventure-art after generation completes.
   */
  function updateArt(payload: {
    artPrompt?: string
    imagePath?: string | null
    artImageId?: number | null
  }) {
    if (payload.artPrompt !== undefined) sheet.artPrompt = payload.artPrompt
    if (payload.imagePath !== undefined)
      sheet.imagePath = payload.imagePath ?? null
    if (payload.artImageId !== undefined)
      sheet.artImageId = payload.artImageId ?? null

    completedCards['art'] = Boolean(
      sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId,
    )
  }

  // ── LLM suggest via active text server ───────────────────────────────────

  async function callSuggest(
    field: string,
    stepKey: string,
    current: string,
  ): Promise<{ success: boolean; message?: string }> {
    llmLoading.value = true
    llmError.value = null
    try {
      const serverStore = useServerStore()
      const activeServer = serverStore.activeTextServer
      const serverSnapshot = activeServer
        ? {
            serverType: activeServer.serverType ?? null,
            baseUrl: activeServer.baseUrl ?? null,
            endpointPath: activeServer.endpointPath ?? null,
            model: activeServer.model ?? null,
          }
        : undefined
      type SuggestResult = { value: string }
      const result = await performFetch<SuggestResult>(
        '/api/adventure/suggest',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server: serverSnapshot,
            field,
            stepKey,
            current,
            sheet,
          }),
        },
      )
      if (result.success && result.data?.value) {
        setStagedValue(stepKey, result.data.value)
        return { success: true }
      }
      const msg =
        result.message ?? 'The language model returned nothing useful.'
      llmError.value = msg
      return { success: false, message: msg }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Suggestion request failed.'
      llmError.value = msg
      return { success: false, message: msg }
    } finally {
      llmLoading.value = false
    }
  }

  async function callArtSuggest(
    current: string,
  ): Promise<{ success: boolean; message?: string }> {
    llmLoading.value = true
    llmError.value = null
    try {
      const serverStore = useServerStore()
      const activeServer = serverStore.activeTextServer
      const serverSnapshot = activeServer
        ? {
            serverType: activeServer.serverType ?? null,
            baseUrl: activeServer.baseUrl ?? null,
            endpointPath: activeServer.endpointPath ?? null,
            model: activeServer.model ?? null,
          }
        : undefined
      type SuggestResult = { value: string }
      const result = await performFetch<SuggestResult>(
        '/api/adventure/suggest',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server: serverSnapshot,
            field: 'artPrompt',
            stepKey: 'art',
            current,
            sheet,
          }),
        },
      )
      if (result.success && result.data?.value) {
        sheet.artPrompt = result.data.value
        return { success: true }
      }
      const msg =
        result.message ?? 'Art prompt refinement returned nothing useful.'
      llmError.value = msg
      return { success: false, message: msg }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Art suggest request failed.'
      llmError.value = msg
      return { success: false, message: msg }
    } finally {
      llmLoading.value = false
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  function persistState(): void {
    saveToStorage({
      sheet: {
        ...sheet,
        stats: sheet.stats.map((s) => ({ ...s })),
        rewards: { ...sheet.rewards },
      },
      completedCards: { ...completedCards },
      stagedValues: { ...stagedValues },
      draftStats: draftStats.map((s) => ({ ...s })),
      rewardOptions: { ...rewardOptions },
      selectedRewardId: { ...selectedRewardId },
      activeCardKey: activeCardKey.value,
      activeStepIndex: activeStepIndex.value,
    })
  }

  function restoreState(): void {
    const saved = loadFromStorage()
    if (!saved || typeof saved !== 'object') return

    const s = saved as Record<string, unknown>

    // Restore sheet fields
    if (s.sheet && typeof s.sheet === 'object') {
      const savedSheet = s.sheet as Partial<AdventureSheet>
      const keys: Array<keyof AdventureSheet> = [
        'name',
        'honorific',
        'role',
        'genre',
        'species',
        'class',
        'alignment',
        'gender',
        'personality',
        'backstory',
        'quirks',
        'artPrompt',
        'imagePath',
        'artImageId',
        'luck',
        'might',
        'wits',
        'grace',
        'charm',
        'empathy',
        'userId',
        'isPublic',
        'isMature',
      ]
      for (const key of keys) {
        if (key in savedSheet) {
          ;(sheet as Record<string, unknown>)[key] =
            savedSheet[key] ?? (sheet as Record<string, unknown>)[key]
        }
      }
      // Restore stats array
      if (Array.isArray(savedSheet.stats)) {
        for (const saved of savedSheet.stats) {
          const target = sheet.stats.find((s) => s.key === saved.key)
          if (target && typeof saved.value === 'number')
            target.value = saved.value
        }
      }
      // Restore rewards
      if (savedSheet.rewards && typeof savedSheet.rewards === 'object') {
        Object.assign(sheet.rewards, savedSheet.rewards)
      }
    }

    // Restore completedCards
    if (s.completedCards && typeof s.completedCards === 'object') {
      Object.assign(completedCards, s.completedCards)
    }

    // Restore stagedValues
    if (s.stagedValues && typeof s.stagedValues === 'object') {
      Object.assign(stagedValues, s.stagedValues)
    }

    // Restore draftStats
    if (Array.isArray(s.draftStats)) {
      for (const saved of s.draftStats as Array<{
        key: string
        value: number
      }>) {
        const target = draftStats.find((d) => d.key === saved.key)
        if (target && typeof saved.value === 'number')
          target.value = saved.value
      }
    }

    // Restore reward options and selections
    if (s.rewardOptions && typeof s.rewardOptions === 'object') {
      Object.assign(rewardOptions, s.rewardOptions)
    }
    if (s.selectedRewardId && typeof s.selectedRewardId === 'object') {
      Object.assign(selectedRewardId, s.selectedRewardId)
    }

    // Restore active card/step — but don't auto-navigate to it yet
    if (typeof s.activeCardKey === 'string') {
      activeCardKey.value = s.activeCardKey
    }
    if (typeof s.activeStepIndex === 'number') {
      activeStepIndex.value = s.activeStepIndex
    }
  }

  function clearStorage(): void {
    if (!isClient) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  // ── Reset ──────────────────────────────────────────────────────────────

  function resetAdventure(userId = 10) {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    llmLoading.value = false
    llmError.value = null
    saveMessage.value = ''
    saveError.value = ''
    clearStorage()

    for (const k of Object.keys(stagedValues)) delete stagedValues[k]
    for (const k of Object.keys(completedCards)) delete completedCards[k]
    for (const k of Object.keys(rewardOptions)) delete rewardOptions[k]
    for (const k of Object.keys(selectedRewardId)) delete selectedRewardId[k]

    Object.assign(sheet, defaultSheet(userId))
    draftStats.splice(0, draftStats.length, ...defaultStats())
  }

  // ── Exports ────────────────────────────────────────────────────────────

  return {
    // State
    activeCardKey,
    activeStepIndex,
    stagedValues,
    completedCards,
    selectedStatBlock,
    draftStats,
    rewardOptions,
    selectedRewardId,
    sheet,
    llmLoading,
    llmError,
    saveMessage,
    saveError,
    // Computed
    visibleCards,
    activeCard,
    activeStep,
    isLastStep,
    isFirstStep,
    canFinish,
    coreComplete,
    allComplete,
    usedStatValues,
    statAllocationComplete,
    activeRewardOptions,
    activeSelectedRewardId,
    // Constants
    statBlocks: STAT_BLOCKS,
    // Actions
    selectCard,
    randomCard,
    cancelCard,
    callSuggest,
    callArtSuggest,
    persistState,
    restoreState,
    clearStorage,
    nextStep,
    prevStep,
    setStagedValue,
    selectPresetChoice,
    finishCard,
    removeSection,
    selectStatBlock,
    assignStat,
    rollAllStats,
    selectRewardOption,
    rollRewardOptions,
    suggestCurrentStep,
    buildArtPrompt,
    updateArt,
    resetAdventure,
  }
})
