// stores/botBuilderStore.ts
//
// UI flow state machine for the Bot Builder.
// Wraps the real botStore — owns only UI flow state.
// Data writes go through botStore.setBotForm().
// Save delegates to botStore.saveBot().
//
// Special handling:
//   - personality: multi-select, stored pipe-separated
//   - botIntro: pipe-separated multi-entry (1–4 intros)
//   - modules: comma-separated chip selection

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useBotStore } from '@/stores/botStore'
import { performFetch } from '@/stores/utils'
import {
  BOT_CARDS,
  type BotCard,
  type BotStep,
} from '@/stores/helpers/botCards'

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'botBuilderState'
const isClient = typeof window !== 'undefined'
const INTRO_SEP = ' | '
const CORE_CARD_KEYS = ['type', 'identity', 'prompt'] as const

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

// Intro helpers (pipe-separated, plain string field in DB)
export function parseIntros(raw: string): string[] {
  if (!raw.trim()) return ['']
  return raw
    .split(INTRO_SEP)
    .map((s: string) => s.trim())
    .filter(Boolean)
}
export function joinIntros(entries: string[]): string {
  return entries.filter((s: string) => s.trim()).join(INTRO_SEP)
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useBotBuilderStore = defineStore('botBuilderStore', () => {
  const botStore = useBotStore()

  // ── UI flow state ──────────────────────────────────────────────────────

  const activeCardKey = ref<string | null>(null)
  const activeStepIndex = ref(0)
  const stagedValues = reactive<Record<string, string>>({})
  const completedCards = reactive<Record<string, boolean>>({})

  // Multi-entry intros managed as array; joined to string on finish
  const introEntries = ref<string[]>([''])
  // Multi-select personality managed as array; joined to pipe-sep on finish
  const selectedTraits = ref<string[]>([])

  const llmLoading = ref(false)
  const llmError = ref<string | null>(null)

  // ── Unlock gates ────────────────────────────────────────────────────────

  const coreComplete = computed(() =>
    CORE_CARD_KEYS.every((k) => completedCards[k]),
  )

  // ── Deck ────────────────────────────────────────────────────────────────

  const visibleCards = computed<BotCard[]>(() =>
    BOT_CARDS.filter((card: BotCard) => {
      if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
        return false
      if (completedCards[card.key] && card.key !== 'art') return false
      return true
    }),
  )

  const activeCard = computed<BotCard | null>(() =>
    activeCardKey.value
      ? (BOT_CARDS.find((c: BotCard) => c.key === activeCardKey.value) ?? null)
      : null,
  )

  const activeStep = computed<BotStep | null>(
    () => activeCard.value?.steps[activeStepIndex.value] ?? null,
  )

  const isLastStep = computed(
    () =>
      !activeCard.value ||
      activeStepIndex.value >= activeCard.value.steps.length - 1,
  )

  const isFirstStep = computed(() => activeStepIndex.value === 0)

  // ── Card selection ───────────────────────────────────────────────────────

  function selectCard(cardKey: string) {
    const card = BOT_CARDS.find((c: BotCard) => c.key === cardKey)
    if (!card) return

    activeCardKey.value = cardKey
    activeStepIndex.value = 0
    llmError.value = null

    for (const step of card.steps) {
      if (!step.field) continue
      if (step.field === 'botIntro') {
        introEntries.value = parseIntros(botStore.botForm.botIntro ?? '')
        if (!introEntries.value.length) introEntries.value = ['']
        continue
      }
      if (step.field === 'personality') {
        const raw = botStore.botForm.personality ?? ''
        selectedTraits.value = raw
          ? raw
              .split('|')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : []
        continue
      }
      const existing = (botStore.botForm as Record<string, unknown>)[step.field]
      stagedValues[step.key] = typeof existing === 'string' ? existing : ''
    }
  }

  function cancelCard() {
    activeCardKey.value = null
    activeStepIndex.value = 0
    llmError.value = null
  }

  function skipCard() {
    if (!activeCard.value || activeCard.value.required) return
    completedCards[activeCard.value.key] = true
    persistState()
    _advanceToNextCard(activeCard.value.key)
  }

  // ── Step navigation ──────────────────────────────────────────────────────

  function setStagedValue(stepKey: string, value: string) {
    stagedValues[stepKey] = value
    persistState()
  }

  function nextStep() {
    if (!activeCard.value) return
    if (activeStepIndex.value < activeCard.value.steps.length - 1)
      activeStepIndex.value++
  }

  function prevStep() {
    if (activeStepIndex.value > 0) activeStepIndex.value--
  }

  function selectPresetChoice(stepKey: string, value: string) {
    stagedValues[stepKey] = value
    persistState()
    if (isLastStep.value) finishCard()
    else nextStep()
  }

  // ── Personality (multi-select) ───────────────────────────────────────────

  function toggleTrait(trait: string) {
    const idx = selectedTraits.value.indexOf(trait)
    if (idx >= 0) {
      selectedTraits.value.splice(idx, 1)
    } else {
      selectedTraits.value.push(trait)
    }
    persistState()
  }

  function removeTrait(trait: string) {
    selectedTraits.value = selectedTraits.value.filter(
      (t: string) => t !== trait,
    )
    persistState()
  }

  // ── Intro management ─────────────────────────────────────────────────────

  function addIntro() {
    if (introEntries.value.length < 4) introEntries.value.push('')
  }

  function removeIntro(index: number) {
    if (introEntries.value.length > 1) {
      introEntries.value.splice(index, 1)
    }
  }

  function setIntro(index: number, value: string) {
    introEntries.value[index] = value
    persistState()
  }

  async function refineIntro(index: number, current: string): Promise<void> {
    llmLoading.value = true
    llmError.value = null
    try {
      type SuggestResult = { value: string }
      const result = await performFetch<SuggestResult>('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder: 'bot',
          server: _serverSnapshot(),
          field: 'botIntro',
          stepKey: `intro-${index}`,
          current,
          context: {
            name: botStore.botForm.name,
            BotType: botStore.botForm.BotType,
            prompt: botStore.botForm.prompt,
            personality: selectedTraits.value.join('|'),
            introIndex: index,
            otherIntros: introEntries.value.filter((_, i) => i !== index),
          },
        }),
      })
      if (result.success && result.data?.value) {
        setIntro(index, result.data.value)
      } else {
        llmError.value = result.message ?? 'Nothing useful returned.'
      }
    } catch (error) {
      llmError.value =
        error instanceof Error ? error.message : 'Refinement failed.'
    } finally {
      llmLoading.value = false
    }
  }

  async function generateAllIntros(): Promise<void> {
    llmLoading.value = true
    llmError.value = null
    try {
      type SuggestResult = { value: string }
      const result = await performFetch<SuggestResult>('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder: 'bot',
          server: _serverSnapshot(),
          field: 'botIntros',
          stepKey: 'botIntros',
          current: '',
          context: {
            name: botStore.botForm.name,
            BotType: botStore.botForm.BotType,
            prompt: botStore.botForm.prompt,
            personality: selectedTraits.value.join('|'),
            count: Math.max(introEntries.value.filter(Boolean).length, 2),
          },
        }),
      })
      if (result.success && result.data?.value) {
        const generated = result.data.value.includes(INTRO_SEP)
          ? result.data.value
              .split(INTRO_SEP)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [result.data.value.trim()]
        introEntries.value = generated.length ? generated : ['']
        persistState()
      } else {
        llmError.value = result.message ?? 'Nothing useful returned.'
      }
    } catch (error) {
      llmError.value =
        error instanceof Error ? error.message : 'Generate failed.'
    } finally {
      llmLoading.value = false
    }
  }

  // ── Modules (comma-separated chips) ─────────────────────────────────────

  function toggleModule(moduleKey: string) {
    const current = botStore.botForm.modules ?? ''
    const parts = current
      ? current
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
    const idx = parts.indexOf(moduleKey)
    if (idx >= 0) {
      parts.splice(idx, 1)
    } else {
      parts.push(moduleKey)
    }
    botStore.setBotForm({ modules: parts.join(', ') })
    persistState()
  }

  function activeModules(): string[] {
    const raw = botStore.botForm.modules ?? ''
    return raw
      ? raw
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  }

  // ── Finish card ──────────────────────────────────────────────────────────

  function finishCard() {
    if (!activeCard.value) return
    const card = activeCard.value

    if (card.key === 'art') {
      completedCards['art'] = Boolean(
        botStore.botForm.artPrompt?.trim() || botStore.botForm.artImageId,
      )
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    if (card.key === 'intros') {
      const joined = joinIntros(introEntries.value)
      botStore.setBotForm({ botIntro: joined })
      completedCards[card.key] = Boolean(joined)
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    if (card.key === 'personality') {
      const joined = selectedTraits.value.join('|')
      botStore.setBotForm({ personality: joined || null })
      completedCards[card.key] = selectedTraits.value.length > 0
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    if (card.key === 'extras') {
      // modules already written live via toggleModule; just write theme
      const patch: Record<string, unknown> = {}
      for (const step of card.steps) {
        if (!step.field || step.field === 'modules') continue
        patch[step.field] = stagedValues[step.key] ?? ''
      }
      botStore.setBotForm(patch)
      completedCards[card.key] = true
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Standard card
    const patch: Record<string, unknown> = {}
    for (const step of card.steps) {
      if (!step.field) continue
      patch[step.field] = stagedValues[step.key] ?? ''
    }
    botStore.setBotForm(patch)

    completedCards[card.key] = true
    persistState()
    _advanceToNextCard(card.key)
  }

  function _advanceToNextCard(previousKey: string) {
    activeCardKey.value = null
    activeStepIndex.value = 0
    const next = visibleCards.value.find(
      (c: BotCard) => c.key !== previousKey && !completedCards[c.key],
    )
    if (next) selectCard(next.key)
  }

  // ── Section removal ──────────────────────────────────────────────────────

  function removeSection(cardKey: string) {
    const card = BOT_CARDS.find((c: BotCard) => c.key === cardKey)
    if (!card) return

    if (cardKey === 'personality') {
      selectedTraits.value = []
      botStore.setBotForm({ personality: null })
      completedCards[cardKey] = false
      if (activeCardKey.value === cardKey) cancelCard()
      persistState()
      return
    }
    if (cardKey === 'intros') {
      introEntries.value = ['']
      botStore.setBotForm({ botIntro: '' })
      completedCards[cardKey] = false
      if (activeCardKey.value === cardKey) cancelCard()
      persistState()
      return
    }

    const patch: Record<string, unknown> = {}
    for (const field of card.restoresFields) {
      if (field === 'artImageId') {
        patch.artImageId = null
        continue
      }
      patch[field] = ''
    }
    botStore.setBotForm(patch)
    completedCards[cardKey] = false
    if (activeCardKey.value === cardKey) cancelCard()
    persistState()
  }

  // ── LLM suggest ─────────────────────────────────────────────────────────

  async function callSuggest(
    field: string,
    stepKey: string,
    current: string,
  ): Promise<{ success: boolean; message?: string }> {
    llmLoading.value = true
    llmError.value = null
    try {
      type SuggestResult = { value: string }
      const result = await performFetch<SuggestResult>('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder: 'bot',
          server: _serverSnapshot(),
          field,
          stepKey,
          current,
          context: {
            name: botStore.botForm.name,
            BotType: botStore.botForm.BotType,
            prompt: botStore.botForm.prompt,
            personality: selectedTraits.value.join('|'),
          },
        }),
      })
      if (result.success && result.data?.value) {
        setStagedValue(stepKey, result.data.value)
        return { success: true }
      }
      const msg = result.message ?? 'Nothing useful returned.'
      llmError.value = msg
      return { success: false, message: msg }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Suggestion failed.'
      llmError.value = msg
      return { success: false, message: msg }
    } finally {
      llmLoading.value = false
    }
  }

  // ── Art prompt ───────────────────────────────────────────────────────────

  function buildArtPrompt(): string {
    const f = botStore.botForm
    const parts: string[] = []
    if (f.name?.trim()) parts.push(f.name.trim())
    if (f.BotType?.trim()) parts.push(`${f.BotType} bot`)
    if (f.personality?.trim())
      parts.push(f.personality.split('|').slice(0, 3).join(', '))
    if (f.tagline?.trim()) parts.push(f.tagline.trim())
    parts.push(
      'digital avatar, character portrait, AI entity, stylized illustration',
    )
    const prompt = parts.filter(Boolean).join(', ')
    botStore.setBotForm({ artPrompt: prompt })
    return prompt
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _serverSnapshot() {
    const serverStore = useServerStore()
    const activeServer = serverStore.activeTextServer
    return activeServer
      ? {
          serverType: activeServer.serverType ?? null,
          baseUrl: activeServer.baseUrl ?? null,
          endpointPath: activeServer.endpointPath ?? null,
          model: activeServer.model ?? null,
        }
      : undefined
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  function persistState(): void {
    saveToStorage({
      completedCards: { ...completedCards },
      stagedValues: { ...stagedValues },
      introEntries: [...introEntries.value],
      selectedTraits: [...selectedTraits.value],
      activeCardKey: activeCardKey.value,
      activeStepIndex: activeStepIndex.value,
    })
  }

  function restoreState(): void {
    const saved = loadFromStorage()
    if (!saved || typeof saved !== 'object') return
    const s = saved as Record<string, unknown>
    if (s.completedCards && typeof s.completedCards === 'object')
      Object.assign(completedCards, s.completedCards)
    if (s.stagedValues && typeof s.stagedValues === 'object')
      Object.assign(stagedValues, s.stagedValues)
    if (Array.isArray(s.introEntries))
      introEntries.value = s.introEntries as string[]
    if (Array.isArray(s.selectedTraits))
      selectedTraits.value = s.selectedTraits as string[]
    if (typeof s.activeCardKey === 'string')
      activeCardKey.value = s.activeCardKey
    if (typeof s.activeStepIndex === 'number')
      activeStepIndex.value = s.activeStepIndex
  }

  function clearStorage(): void {
    if (!isClient) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  function resetBuilder() {
    activeCardKey.value = null
    activeStepIndex.value = 0
    llmLoading.value = false
    llmError.value = null
    introEntries.value = ['']
    selectedTraits.value = []
    clearStorage()
    for (const k of Object.keys(stagedValues)) delete stagedValues[k]
    for (const k of Object.keys(completedCards)) delete completedCards[k]
    botStore.startAddingBot()
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  return {
    activeCardKey,
    activeStepIndex,
    stagedValues,
    completedCards,
    introEntries,
    selectedTraits,
    llmLoading,
    llmError,

    visibleCards,
    activeCard,
    activeStep,
    isLastStep,
    isFirstStep,
    coreComplete,

    get botForm() {
      return botStore.botForm
    },
    get isSaving() {
      return botStore.isSaving
    },
    get lastError() {
      return botStore.lastError
    },

    selectCard,
    cancelCard,
    skipCard,
    nextStep,
    prevStep,
    setStagedValue,
    selectPresetChoice,
    toggleTrait,
    removeTrait,
    addIntro,
    removeIntro,
    setIntro,
    refineIntro,
    generateAllIntros,
    toggleModule,
    activeModules,
    finishCard,
    removeSection,
    callSuggest,
    buildArtPrompt,
    persistState,
    restoreState,
    clearStorage,
    resetBuilder,

    saveBot: () => botStore.saveBot(),
  }
})
