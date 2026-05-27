// stores/dreamBuilderStore.ts
//
// UI flow state machine for the Dream Builder.
// Wraps the real dreamStore — owns only UI flow state.
// Data writes go through dreamStore.setDreamForm().
// Save delegates to dreamStore.saveDream().
//
// vibeTag is local-only (not in schema) — kept in builder state only,
// used to seed LLM context and atmosphere display.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useDreamStore } from '@/stores/dreamStore'
import { performFetch } from '@/stores/utils'
import {
  DREAM_CARDS,
  type DreamCard,
  type DreamStep,
  type DreamChoice,
} from '@/stores/helpers/dreamCards'

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dreamBuilderState'
const isClient = typeof window !== 'undefined'

const CORE_CARD_KEYS = ['atmosphere', 'title', 'description'] as const

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

export const useDreamBuilderStore = defineStore('dreamBuilderStore', () => {
  const dreamStore = useDreamStore()

  // ── UI flow state ──────────────────────────────────────────────────────

  const activeCardKey = ref<string | null>(null)
  const activeStepIndex = ref(0)
  const stagedValues = reactive<Record<string, string>>({})
  const completedCards = reactive<Record<string, boolean>>({})

  // vibeTag lives here — not in dreamStore.dreamForm (no schema column)
  const vibeTag = ref('')

  const llmLoading = ref(false)
  const llmError = ref<string | null>(null)

  // ── Unlock gates ────────────────────────────────────────────────────────

  const coreComplete = computed(() =>
    CORE_CARD_KEYS.every((k) => completedCards[k]),
  )

  // ── Deck ────────────────────────────────────────────────────────────────

  const visibleCards = computed<DreamCard[]>(() =>
    DREAM_CARDS.filter((card: DreamCard) => {
      if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
        return false
      // Access card stays re-enterable so users can change codes
      if (
        completedCards[card.key] &&
        card.key !== 'art' &&
        card.key !== 'access'
      )
        return false
      return true
    }),
  )

  const activeCard = computed<DreamCard | null>(() =>
    activeCardKey.value
      ? (DREAM_CARDS.find((c: DreamCard) => c.key === activeCardKey.value) ??
        null)
      : null,
  )

  const activeStep = computed<DreamStep | null>(
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
    const card = DREAM_CARDS.find((c: DreamCard) => c.key === cardKey)
    if (!card) return

    activeCardKey.value = cardKey
    activeStepIndex.value = 0
    llmError.value = null

    for (const step of card.steps) {
      if (!step.field) continue
      // vibeTag is local, all others from dreamForm
      if (step.field === 'vibeTag') {
        stagedValues[step.key] = vibeTag.value
        continue
      }
      const existing = (dreamStore.dreamForm as Record<string, unknown>)[
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
    // Skip privacyCode step unless CODE access mode selected
    const nextIndex = activeStepIndex.value + 1
    const next = activeCard.value.steps[nextIndex]
    if (
      next?.key === 'privacyCode' &&
      dreamStore.dreamForm.accessMode !== 'CODE'
    ) {
      if (nextIndex < activeCard.value.steps.length - 1) {
        activeStepIndex.value = nextIndex + 1
      } else {
        finishCard()
      }
      return
    }
    if (activeStepIndex.value < activeCard.value.steps.length - 1) {
      activeStepIndex.value++
    }
  }

  function prevStep() {
    if (activeStepIndex.value > 0) activeStepIndex.value--
  }

  function selectPresetChoice(stepKey: string, value: string) {
    stagedValues[stepKey] = value
    persistState()
    // Mirror accessMode immediately so nextStep logic works
    if (stepKey === 'accessMode') {
      dreamStore.setDreamForm({
        accessMode: value as 'OPEN' | 'PRIVATE' | 'CODE',
      })
    }
    if (isLastStep.value) finishCard()
    else nextStep()
  }

  // ── Finish card ──────────────────────────────────────────────────────────

  function finishCard() {
    if (!activeCard.value) return
    const card = activeCard.value

    // Art card
    if (card.key === 'art') {
      completedCards['art'] = Boolean(
        dreamStore.dreamForm.artPrompt?.trim() ||
        dreamStore.dreamForm.artImageId,
      )
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Atmosphere card — writes to vibeTag only (local)
    if (card.key === 'atmosphere') {
      vibeTag.value = stagedValues['atmosphere'] ?? ''
      completedCards[card.key] = true
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Standard card — write staged values to dreamStore.dreamForm
    const patch: Record<string, unknown> = {}
    for (const step of card.steps) {
      if (!step.field || step.field === 'vibeTag') continue
      patch[step.field] = stagedValues[step.key] ?? ''
    }
    dreamStore.setDreamForm(patch)

    completedCards[card.key] = true
    persistState()
    _advanceToNextCard(card.key)
  }

  function _advanceToNextCard(previousKey: string) {
    activeCardKey.value = null
    activeStepIndex.value = 0
    const next = visibleCards.value.find(
      (c: DreamCard) => c.key !== previousKey && !completedCards[c.key],
    )
    if (next) selectCard(next.key)
  }

  // ── Section removal ──────────────────────────────────────────────────────

  function removeSection(cardKey: string) {
    const card = DREAM_CARDS.find((c: DreamCard) => c.key === cardKey)
    if (!card) return

    if (cardKey === 'atmosphere') {
      vibeTag.value = ''
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
    dreamStore.setDreamForm(patch)

    completedCards[cardKey] = false
    if (activeCardKey.value === cardKey) cancelCard()
    persistState()
  }

  // ── Art prompt ───────────────────────────────────────────────────────────

  function buildArtPrompt(): string {
    const f = dreamStore.dreamForm
    const parts: string[] = []
    if (f.title?.trim()) parts.push(f.title.trim())
    if (vibeTag.value) parts.push(vibeTag.value)
    if (f.currentVibe?.trim()) parts.push(String(f.currentVibe).slice(0, 100))
    if (f.description?.trim()) parts.push(String(f.description).slice(0, 120))
    parts.push(
      'location illustration, sense of place, atmospheric environment art',
    )
    const prompt = parts.filter(Boolean).join(', ')
    dreamStore.setDreamForm({ artPrompt: prompt })
    return prompt
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
          builder: 'dream',
          server: serverSnapshot,
          field,
          stepKey,
          current,
          context: {
            vibeTag: vibeTag.value,
            title: dreamStore.dreamForm.title,
            description: dreamStore.dreamForm.description,
            currentVibe: dreamStore.dreamForm.currentVibe,
          },
        }),
      })

      if (result.success && result.data?.value) {
        setStagedValue(stepKey, result.data.value)
        return { success: true }
      }
      const msg = result.message ?? 'The model returned nothing useful.'
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

  // ── Persistence ──────────────────────────────────────────────────────────

  function persistState(): void {
    saveToStorage({
      completedCards: { ...completedCards },
      stagedValues: { ...stagedValues },
      vibeTag: vibeTag.value,
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
    if (typeof s.vibeTag === 'string') vibeTag.value = s.vibeTag
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
    vibeTag.value = ''
    clearStorage()
    for (const k of Object.keys(stagedValues)) delete stagedValues[k]
    for (const k of Object.keys(completedCards)) delete completedCards[k]
    dreamStore.startAddingDream()
  }

  // ── Exports ───────────────────────────────────────────────────────────────

  return {
    activeCardKey,
    activeStepIndex,
    stagedValues,
    completedCards,
    vibeTag,
    llmLoading,
    llmError,

    visibleCards,
    activeCard,
    activeStep,
    isLastStep,
    isFirstStep,
    coreComplete,

    // Proxies so components only need this store
    get dreamForm() {
      return dreamStore.dreamForm
    },
    get isSaving() {
      return dreamStore.isSaving
    },
    get lastError() {
      return dreamStore.error
    },

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

    // Delegate save
    saveDream: () => dreamStore.saveDream(),
  }
})
