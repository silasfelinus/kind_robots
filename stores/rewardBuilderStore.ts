// stores/rewardBuilderStore.ts
//
// UI flow state machine for the Reward Builder.
// Owns: active card, step navigation, staged values, completed cards.
// Delegates all data operations to rewardStore (CRUD, localStorage, server).
//
// On finishCard: writes staged values directly into rewardStore.rewardForm fields.
// On save: calls rewardStore.saveReward().

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useRewardStore } from '@/stores/rewardStore'
import { performFetch } from '@/stores/utils'
import {
  REWARD_CARDS,
  REWARD_EXAMPLES,
  type RewardCard,
  type RewardStep,
} from '@/stores/helpers/rewardCards'

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rewardBuilderState'
const isClient = typeof window !== 'undefined'

// Core cards required before art unlocks
const CORE_CARD_KEYS = ['type', 'rarity', 'name', 'power'] as const

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

export const useRewardBuilderStore = defineStore('rewardBuilderStore', () => {
  const rewardStore = useRewardStore()

  // ── UI flow state ─────────────────────────────────────────────────────────

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

  const visibleCards = computed<RewardCard[]>(() =>
    REWARD_CARDS.filter((card) => {
      if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
        return false
      if (completedCards[card.key] && card.key !== 'art') return false
      return true
    }),
  )

  const activeCard = computed<RewardCard | null>(() =>
    activeCardKey.value
      ? (REWARD_CARDS.find((c) => c.key === activeCardKey.value) ?? null)
      : null,
  )

  const activeStep = computed<RewardStep | null>(
    () => activeCard.value?.steps[activeStepIndex.value] ?? null,
  )

  const isLastStep = computed(
    () =>
      !activeCard.value ||
      activeStepIndex.value >= activeCard.value.steps.length - 1,
  )

  const isFirstStep = computed(() => activeStepIndex.value === 0)

  // Examples for the current reward type (shown in the power step)
  const currentTypeExamples = computed(() => {
    const type = (rewardStore.rewardForm.rewardType as string) ?? 'SKILL'
    return REWARD_EXAMPLES[type] ?? REWARD_EXAMPLES.SKILL ?? []
  })

  // ── Card selection ─────────────────────────────────────────────────────────

  function selectCard(cardKey: string) {
    const card = REWARD_CARDS.find((c) => c.key === cardKey)
    if (!card) return

    activeCardKey.value = cardKey
    activeStepIndex.value = 0
    llmError.value = null

    for (const step of card.steps) {
      if (!step.field) continue
      const existing = (rewardStore.rewardForm as Record<string, unknown>)[
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

  // ── Step navigation ────────────────────────────────────────────────────────

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

  // ── Finish card ────────────────────────────────────────────────────────────

  function finishCard() {
    if (!activeCard.value) return
    const card = activeCard.value

    // Art card
    if (card.key === 'art') {
      completedCards['art'] = Boolean(
        rewardStore.rewardForm.artPrompt?.trim() ||
        rewardStore.rewardForm.imagePath ||
        rewardStore.rewardForm.artImageId,
      )
      persistState()
      _advanceToNextCard(card.key)
      return
    }

    // Write staged values into rewardStore.rewardForm
    for (const step of card.steps) {
      if (!step.field) continue
      const val = stagedValues[step.key] ?? ''
      ;(rewardStore.rewardForm as Record<string, unknown>)[step.field] = val

      // label mirrors text (short display name)
      if (step.field === 'text') {
        rewardStore.rewardForm.label = val
      }
    }

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

  // ── Section removal ────────────────────────────────────────────────────────

  function removeSection(cardKey: string) {
    const card = REWARD_CARDS.find((c) => c.key === cardKey)
    if (!card) return
    for (const field of card.restoresFields) {
      if (field === 'imagePath') {
        rewardStore.rewardForm.imagePath = null
        continue
      }
      if (field === 'artImageId') {
        rewardStore.rewardForm.artImageId = null
        continue
      }
      if (field === 'artPrompt') {
        rewardStore.rewardForm.artPrompt = null
        continue
      }
      ;(rewardStore.rewardForm as Record<string, unknown>)[field] = ''
    }
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
          builder: 'reward',
          server: serverSnapshot,
          field,
          stepKey,
          current,
          context: {
            rewardType: rewardStore.rewardForm.rewardType,
            rarity: rewardStore.rewardForm.rarity,
            text: rewardStore.rewardForm.text,
            power: rewardStore.rewardForm.power,
            collection: rewardStore.rewardForm.collection,
            examples: currentTypeExamples.value.slice(0, 3),
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

  // ── Art prompt ────────────────────────────────────────────────────────────

  function buildArtPrompt(): string {
    const f = rewardStore.rewardForm
    const parts: string[] = []

    if (f.text?.trim()) parts.push(f.text.trim())
    if (f.rewardType) parts.push(`type: ${String(f.rewardType).toLowerCase()}`)
    if (f.rarity) parts.push(`${String(f.rarity).toLowerCase()} rarity`)
    if (f.power?.trim()) parts.push(`effect: ${f.power.trim().slice(0, 80)}`)
    parts.push(
      'card art, fantasy illustration, item portrait, vivid and specific',
    )

    const prompt = parts.filter(Boolean).join(', ')
    rewardStore.rewardForm.artPrompt = prompt
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
    rewardStore.startAddingReward()
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  return {
    activeCardKey,
    activeStepIndex,
    stagedValues,
    completedCards,
    llmLoading,
    llmError,

    visibleCards,
    activeCard,
    activeStep,
    isLastStep,
    isFirstStep,
    coreComplete,
    currentTypeExamples,

    get rewardForm() {
      return rewardStore.rewardForm
    },
    get isSaving() {
      return rewardStore.isSaving
    },
    get lastError() {
      return rewardStore.error
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

    saveReward: () => rewardStore.saveReward(),
  }
})
