// stores/scenarioBuilderStore.ts
//
// UI flow state machine for the Scenario Builder.
// Wraps the real scenarioStore — owns only UI flow state.
// Data writes go directly to scenarioStore.scenarioForm fields.
// Save delegates to scenarioStore.saveScenario().
//
// Intros: scenarioStore.scenarioForm.intros is string[] in memory.
// introEntries ref stays in sync with it — the source of truth is the store.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { performFetch } from '@/stores/utils'
import {
  SCENARIO_CARDS,
  type ScenarioCard,
  type ScenarioStep,
} from '@/stores/helpers/scenarioCards'

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'scenarioBuilderState'
const isClient = typeof window !== 'undefined'
const CORE_CARD_KEYS = ['genre', 'title', 'description', 'intros'] as const

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

export const useScenarioBuilderStore = defineStore(
  'scenarioBuilderStore',
  () => {
    const scenarioStore = useScenarioStore()

    // ── UI flow state ──────────────────────────────────────────────────────

    const activeCardKey = ref<string | null>(null)
    const activeStepIndex = ref(0)
    const stagedValues = reactive<Record<string, string>>({})
    const completedCards = reactive<Record<string, boolean>>({})

    // introEntries mirrors scenarioStore.scenarioForm.intros (string[])
    const introEntries = ref<string[]>([''])

    const llmLoading = ref(false)
    const llmError = ref<string | null>(null)

    // ── Unlock gates ────────────────────────────────────────────────────────

    const coreComplete = computed(() =>
      CORE_CARD_KEYS.every((k) => completedCards[k]),
    )

    // ── Deck ────────────────────────────────────────────────────────────────

    const visibleCards = computed<ScenarioCard[]>(() =>
      SCENARIO_CARDS.filter((card: ScenarioCard) => {
        if (card.unlockCondition === 'coreComplete' && !coreComplete.value)
          return false
        if (completedCards[card.key] && card.key !== 'art') return false
        return true
      }),
    )

    const activeCard = computed<ScenarioCard | null>(() =>
      activeCardKey.value
        ? (SCENARIO_CARDS.find(
            (c: ScenarioCard) => c.key === activeCardKey.value,
          ) ?? null)
        : null,
    )

    const activeStep = computed<ScenarioStep | null>(
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
      const card = SCENARIO_CARDS.find((c: ScenarioCard) => c.key === cardKey)
      if (!card) return

      activeCardKey.value = cardKey
      activeStepIndex.value = 0
      llmError.value = null

      for (const step of card.steps) {
        if (!step.field) continue
        if (step.field === 'intros') {
          // Sync from store's normalised string[]
          const stored = scenarioStore.scenarioForm.intros
          introEntries.value =
            Array.isArray(stored) && stored.length ? [...stored] : ['']
          continue
        }
        const existing = (
          scenarioStore.scenarioForm as Record<string, unknown>
        )[step.field]
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
      if (stepKey === 'scenarioGenre') {
        // Multi-select: append to comma-separated list
        const current = stagedValues[stepKey] ?? ''
        const parts = current
          ? current.split(', ').map((s: string) => s.trim())
          : []
        if (value && !parts.includes(value)) parts.push(value)
        stagedValues[stepKey] = parts.join(', ')
        persistState()
        return
      }
      stagedValues[stepKey] = value
      persistState()
      if (isLastStep.value) finishCard()
      else nextStep()
    }

    function removeGenre(genre: string) {
      const current = stagedValues['scenarioGenre'] ?? ''
      const parts = current
        .split(', ')
        .map((s: string) => s.trim())
        .filter((g) => g !== genre)
      stagedValues['scenarioGenre'] = parts.join(', ')
      persistState()
    }

    // ── Intro management ─────────────────────────────────────────────────────

    function addIntro() {
      if (introEntries.value.length < 5) {
        introEntries.value.push('')
      }
    }

    function removeIntro(index: number) {
      if (introEntries.value.length > 1) {
        introEntries.value.splice(index, 1)
        _syncIntrosToStore()
      }
    }

    function setIntro(index: number, value: string) {
      introEntries.value[index] = value
      _syncIntrosToStore()
      persistState()
    }

    function _syncIntrosToStore() {
      scenarioStore.scenarioForm.intros = introEntries.value.filter((s) =>
        s.trim(),
      )
    }

    async function refineIntro(index: number, current: string): Promise<void> {
      llmLoading.value = true
      llmError.value = null
      try {
        const serverSnapshot = _serverSnapshot()
        type SuggestResult = { value: string }
        const result = await performFetch<SuggestResult>('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            builder: 'scenario',
            server: serverSnapshot,
            field: 'intro',
            stepKey: `intro-${index}`,
            current,
            context: {
              title: scenarioStore.scenarioForm.title,
              description: scenarioStore.scenarioForm.description,
              genres: scenarioStore.scenarioForm.genres,
              introIndex: index,
              totalIntros: introEntries.value.length,
              otherIntros: introEntries.value.filter((_, i) => i !== index),
            },
          }),
        })
        if (result.success && result.data?.value) {
          setIntro(index, result.data.value)
        } else {
          llmError.value =
            result.message ?? 'The model returned nothing useful.'
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
        const serverSnapshot = _serverSnapshot()
        type SuggestResult = { value: string }
        const result = await performFetch<SuggestResult>('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            builder: 'scenario',
            server: serverSnapshot,
            field: 'intros',
            stepKey: 'scenarioIntros',
            current: '',
            context: {
              title: scenarioStore.scenarioForm.title,
              description: scenarioStore.scenarioForm.description,
              genres: scenarioStore.scenarioForm.genres,
              count: Math.max(introEntries.value.filter(Boolean).length, 2),
            },
          }),
        })
        if (result.success && result.data?.value) {
          // Response is pipe-separated; parse into array
          const raw = result.data.value
          const generated = raw.includes(' | ')
            ? raw
                .split(' | ')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [raw.trim()]
          introEntries.value = generated.length ? generated : ['']
          _syncIntrosToStore()
          persistState()
        } else {
          llmError.value =
            result.message ?? 'The model returned nothing useful.'
        }
      } catch (error) {
        llmError.value =
          error instanceof Error ? error.message : 'Generate all failed.'
      } finally {
        llmLoading.value = false
      }
    }

    // ── Finish card ──────────────────────────────────────────────────────────

    function finishCard() {
      if (!activeCard.value) return
      const card = activeCard.value

      if (card.key === 'art') {
        completedCards['art'] = Boolean(
          scenarioStore.scenarioForm.artPrompt?.trim() ||
          scenarioStore.scenarioForm.artImageId,
        )
        persistState()
        _advanceToNextCard(card.key)
        return
      }

      if (card.key === 'intros') {
        _syncIntrosToStore()
        completedCards[card.key] = Boolean(
          introEntries.value.some((s) => s.trim()),
        )
        persistState()
        _advanceToNextCard(card.key)
        return
      }

      if (card.key === 'classification') {
        // Already written directly to scenarioForm via scenario-classification.vue
        completedCards[card.key] = true
        persistState()
        _advanceToNextCard(card.key)
        return
      }

      // Write staged values to scenarioStore.scenarioForm
      for (const step of card.steps) {
        if (!step.field) continue
        ;(scenarioStore.scenarioForm as Record<string, unknown>)[step.field] =
          stagedValues[step.key] ?? ''
      }

      completedCards[card.key] = true
      persistState()
      _advanceToNextCard(card.key)
    }

    function _advanceToNextCard(previousKey: string) {
      activeCardKey.value = null
      activeStepIndex.value = 0
      const next = visibleCards.value.find(
        (c: ScenarioCard) => c.key !== previousKey && !completedCards[c.key],
      )
      if (next) selectCard(next.key)
    }

    // ── Section removal ──────────────────────────────────────────────────────

    function removeSection(cardKey: string) {
      const card = SCENARIO_CARDS.find((c: ScenarioCard) => c.key === cardKey)
      if (!card) return

      for (const field of card.restoresFields) {
        if (field === 'artImageId') {
          scenarioStore.scenarioForm.artImageId = null
          continue
        }
        if (field === 'imagePath') {
          scenarioStore.scenarioForm.imagePath = null
          continue
        }
        if (field === 'difficulty') {
          scenarioStore.scenarioForm.difficulty = null
          continue
        }
        ;(scenarioStore.scenarioForm as Record<string, unknown>)[field] = ''
      }
      if (cardKey === 'intros') {
        introEntries.value = ['']
        scenarioStore.scenarioForm.intros = []
      }
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
            builder: 'scenario',
            server: _serverSnapshot(),
            field,
            stepKey,
            current,
            context: {
              title: scenarioStore.scenarioForm.title,
              description: scenarioStore.scenarioForm.description,
              genres: scenarioStore.scenarioForm.genres,
              inspirations: scenarioStore.scenarioForm.inspirations,
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

    // ── Art prompt ───────────────────────────────────────────────────────────

    function buildArtPrompt(): string {
      const f = scenarioStore.scenarioForm
      const parts: string[] = []
      if (f.title?.trim()) parts.push(f.title.trim())
      if (f.genres?.trim()) parts.push(f.genres.trim())
      if (f.description?.trim()) parts.push(String(f.description).slice(0, 150))
      if (f.locations?.trim()) parts.push(`setting: ${f.locations}`)
      parts.push('scenario illustration, narrative scene, dramatic composition')
      const prompt = parts.filter(Boolean).join(', ')
      scenarioStore.scenarioForm.artPrompt = prompt
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
      if (Array.isArray(s.introEntries)) {
        introEntries.value = s.introEntries as string[]
        _syncIntrosToStore()
      }
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
      clearStorage()
      for (const k of Object.keys(stagedValues)) delete stagedValues[k]
      for (const k of Object.keys(completedCards)) delete completedCards[k]
      scenarioStore.deselectScenario()
    }

    // ── Exports ───────────────────────────────────────────────────────────────

    return {
      activeCardKey,
      activeStepIndex,
      stagedValues,
      completedCards,
      introEntries,
      llmLoading,
      llmError,

      visibleCards,
      activeCard,
      activeStep,
      isLastStep,
      isFirstStep,
      coreComplete,

      // Proxies so components only need this store
      get scenarioForm() {
        return scenarioStore.scenarioForm
      },
      get isSaving() {
        return scenarioStore.isSaving
      },
      get lastError() {
        return scenarioStore.lastError
      },

      selectCard,
      cancelCard,
      skipCard,
      nextStep,
      prevStep,
      setStagedValue,
      selectPresetChoice,
      removeGenre,
      addIntro,
      removeIntro,
      setIntro,
      refineIntro,
      generateAllIntros,
      finishCard,
      removeSection,
      callSuggest,
      buildArtPrompt,
      persistState,
      restoreState,
      clearStorage,
      resetBuilder,

      saveScenario: () => scenarioStore.saveScenario(),
    }
  },
)
