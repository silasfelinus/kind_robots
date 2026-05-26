// stores/pitchBuilderStore.ts
//
// UI flow state machine for the Pitch Builder.
// Owns: active card, step navigation, staged values.
// Delegates all data operations to pitchStore (CRUD, localStorage, server).
//
// On finishCard: writes staged values into pitchStore.pitchForm via setPitchForm.
// On save: calls pitchStore.savePitch().

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { usePitchStore, PitchType } from '@/stores/pitchStore'
import { performFetch } from '@/stores/utils'
import {
  PITCH_CARDS,
  type PitchCard,
  type PitchStep,
} from '@/stores/helpers/pitchCards'

// ── Types ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pitchBuilderState'
const isClient = typeof window !== 'undefined'

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

// Core cards that must be complete before art unlocks
const CORE_CARD_KEYS = ['type', 'pitch'] as const

// ── Store ──────────────────────────────────────────────────────────────────

export const usePitchBuilderStore = defineStore('pitchBuilderStore', () => {
  const pitchStore = usePitchStore()

  // ── UI flow state ────────────────────────────────────────────────────────

  const activeCardKey = ref<string | null>(null)
  const activeStepIndex = ref(0)
  const stagedValues = reactive<Record<string, string>>({})
  const completedCards = reactive<Record<string, boolean>>({})

  const llmLoading = ref(false)
  const llmError = ref<string | null>(null)

  // ── Unlock gates ──────────────────────────────────────────────────────────

  const coreComplete = computed(() =>
    CORE_CARD_KEYS.every((k) => completedCards[k]),
  )

  // ── Deck ──────────────────────────────────────────────────────────────────

  const visibleCards = computed<PitchCard[]>(() =>
    PITCH_CARDS.filter((card) => {
      if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
        return false
      if (completedCards[card.key] && card.key !== 'art') return false
      return true
    }),
  )

  const activeCard = computed<PitchCard | null>(() =>
    activeCardKey.value
      ? (PITCH_CARDS.find((c) => c.key === activeCardKey.value) ?? null)
      : null,
  )

  const activeStep = computed<PitchStep | null>(
    () => activeCard.value?.steps[activeStepIndex.value] ?? null,
  )

  const isLastStep = computed(
    () =>
      !activeCard.value ||
      activeStepIndex.value >= activeCard.value.steps.length - 1,
  )

  const isFirstStep = computed(() => activeStepIndex.value === 0)

  // Convenience proxy to pitchStore.pitchForm for template reads
  const form = computed(() => pitchStore.pitchForm)

  // ── Card selection ────────────────────────────────────────────────────────

  function selectCard(cardKey: string) {
    const card = PITCH_CARDS.find((c) => c.key === cardKey)
    if (!card) return

    activeCardKey.value = cardKey
    activeStepIndex.value = 0
    llmError.value = null

    // Pre-fill staged values from current pitchForm
    for (const step of card.steps) {
      if (!step.field) continue
      const existing = (pitchStore.pitchForm as Record<string, unknown>)[
        step.field
      ]
      stagedValues[step.key] = typeof existing === 'string' ? existing : ''
    }
  }

  function cancelCard() {
    activeCardKey.value = null
    activeStepIndex.value = 0
    llmError.value = null
  }

  function skipCard() {
    if (!activeCard.value?.required === false) return
    completedCards[activeCard.value!.key] = true
    persistState()
    _advanceToNextCard(activeCard.value!.key)
  }

  // ── Step navigation ───────────────────────────────────────────────────────

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

  // ── Finish card ───────────────────────────────────────────────────────────

  function finishCard() {
    if (!activeCard.value) return
    const card = activeCard.value

    // Build patch from staged values
    const patch: Record<string, unknown> = {}
    for (const step of card.steps) {
      if (!step.field) continue
      const val = stagedValues[step.key] ?? ''
      patch[step.field] = val

      // PitchType needs enum coercion
      if (step.field === 'PitchType') {
        patch.PitchType = val as PitchType
      }

      // title mirrors pitch
      if (step.field === 'pitch') {
        patch.title = val
      }
    }

    // Art card — write artPrompt + image fields
    if (card.key === 'art') {
      completedCards['art'] = Boolean(
        pitchStore.pitchForm.artPrompt?.trim() ||
        pitchStore.pitchForm.highlightImage ||
        pitchStore.pitchForm.artImageId,
      )
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Write into pitchStore.pitchForm
    pitchStore.setPitchForm(patch)

    completedCards[card.key] = true
    persistState()
    _advanceToNextCard(card.key)
  }

  function _advanceToNextCard(previousKey: string) {
    activeCardKey.value = null
    activeStepIndex.value = 0

    const next = visibleCards.value.find(
      (c) => c.key !== previousKey && !completedCards[c.key],
    )
    if (next) selectCard(next.key)
  }

  // ── Section removal ───────────────────────────────────────────────────────

  function removeSection(cardKey: string) {
    const card = PITCH_CARDS.find((c) => c.key === cardKey)
    if (!card) return

    const patch: Record<string, unknown> = {}
    for (const field of card.restoresFields) {
      if (field === 'highlightImage') patch.highlightImage = null
      else if (field === 'artImageId') patch.artImageId = null
      else patch[field] = ''
    }

    pitchStore.setPitchForm(patch)
    completedCards[cardKey] = false
    if (activeCardKey.value === cardKey) cancelCard()
    persistState()
  }

  // ── LLM suggest ───────────────────────────────────────────────────────────

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

      const result = await performFetch<SuggestResult>('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder: 'pitch',
          server: serverSnapshot,
          field,
          stepKey,
          current,
          context: {
            pitch: pitchStore.pitchForm.pitch,
            genre: pitchStore.pitchForm.genre,
            PitchType: pitchStore.pitchForm.PitchType,
          },
        }),
      })

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

  // ── Art prompt ────────────────────────────────────────────────────────────

  function buildArtPrompt(): string {
    const parts: string[] = []
    const f = pitchStore.pitchForm

    if (f.pitch?.trim()) parts.push(f.pitch.trim())
    if (f.genre?.trim()) parts.push(`${f.genre} aesthetic`)
    if (f.PitchType === PitchType.DREAM)
      parts.push('location concept, sense of place, atmospheric environment')
    parts.push('vivid, evocative, conceptual illustration')

    const prompt = parts.filter(Boolean).join(', ')
    pitchStore.setPitchForm({ artPrompt: prompt })
    return prompt
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  function persistState(): void {
    saveToStorage({
      completedCards: { ...completedCards },
      stagedValues: { ...stagedValues },
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

  // ── Reset ─────────────────────────────────────────────────────────────────

  function resetBuilder() {
    activeCardKey.value = null
    activeStepIndex.value = 0
    llmLoading.value = false
    llmError.value = null
    clearStorage()

    for (const k of Object.keys(stagedValues)) delete stagedValues[k]
    for (const k of Object.keys(completedCards)) delete completedCards[k]

    pitchStore.startAddingPitch()
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  return {
    // UI state
    activeCardKey,
    activeStepIndex,
    stagedValues,
    completedCards,
    llmLoading,
    llmError,

    // Computed
    visibleCards,
    activeCard,
    activeStep,
    isLastStep,
    isFirstStep,
    coreComplete,
    form,

    // Proxies to pitchStore (so components only need this store)
    get pitchForm() {
      return pitchStore.pitchForm
    },
    get isSaving() {
      return pitchStore.isSaving
    },
    get saveMessage() {
      return ''
    }, // pitchStore doesn't have saveMessage; use lastError
    get lastError() {
      return pitchStore.lastError
    },

    // Actions
    selectCard,
    cancelCard,
    skipCard,
    nextStep,
    prevStep,
    setStagedValue,
    selectPresetChoice,
    finishCard,
    removeSection,
    callSuggest,
    buildArtPrompt,
    persistState,
    restoreState,
    clearStorage,
    resetBuilder,

    // Delegate save to pitchStore directly
    savePitch: () => pitchStore.savePitch(),
  }
})
