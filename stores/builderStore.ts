// /stores/builderStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import {
  EMPTY_BUILDER_SPLASH,
  builderUtilityCards,
  type BuilderCard,
  type BuilderProjectConfig,
  type BuilderRewardOption,
  type BuilderSheet,
  type BuilderSplash,
  type BuilderStatEntry,
  type BuilderStep,
  type BuilderUtilityCard,
} from '@/stores/helpers/builderCards'
import {
  builderArrayFromPiped,
  builderStepCanFinish,
  clearBuilderCardFields,
  clearBuilderSnapshot,
  cloneBuilderValue,
  createBuilderSnapshot,
  defaultFinishBuilderCard,
  findBuilderUtilityCard,
  getBuilderCard,
  getBuilderStep,
  getBuilderStepValue,
  getVisibleBuilderCards,
  loadBuilderSnapshot,
  mergeBuilderSheet,
  resetBuilderObject,
  saveBuilderSnapshot,
  selectBuilderChoiceValue,
} from '@/stores/helpers/builderHelper'

const DEFAULT_BUILDER_KEY = 'default'

function defaultBuilderSheet(): BuilderSheet {
  return {
    name: '',
    title: '',
    description: '',
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    userId: 10,
    isPublic: true,
    isMature: false,
    rewards: {},
    stats: [],
  }
}

const defaultBuilderConfig: BuilderProjectConfig = {
  key: DEFAULT_BUILDER_KEY,
  label: 'Builder',
  title: 'Builder',
  modelType: 'builder',
  artPurpose: 'builder',
  artImageRole: 'builder',
  artTitle: 'Builder Art Designer',
  artDescription:
    'Create, upload, select, or generate art for this builder sheet.',
  storageKey: 'kindrobots.builder.default.v1',
  cards: [],
  splash: EMPTY_BUILDER_SPLASH,
  defaultSheet: defaultBuilderSheet,
  coreCardKeys: [],
  requiredCardKeys: [],
  finalCardKey: 'art',
  utilityCards: builderUtilityCards,
  clearFieldDefaults: {
    imagePath: null,
    artImageId: null,
    userId: 10,
    isPublic: true,
    isMature: false,
    rewards: {},
    stats: [],
  },
  persistActiveCard: true,
  allowCompletedCardsInDeck: false,
}

export const useBuilderStore = defineStore('builderStore', () => {
  const registry = reactive<Record<string, BuilderProjectConfig>>({
    [DEFAULT_BUILDER_KEY]: defaultBuilderConfig,
  })

  const activeBuilderKey = ref(DEFAULT_BUILDER_KEY)
  const activeCardKey = ref<string | null>(null)
  const activeStepIndex = ref(0)

  const sheet = reactive<BuilderSheet>(defaultBuilderSheet())
  const stagedValues = reactive<Record<string, string>>({})
  const completedCards = reactive<Record<string, boolean>>({})
  const selectedListOptions = reactive<Record<string, string[]>>({})
  const selectedChoiceValues = reactive<Record<string, string[]>>({})
  const rewardOptions = reactive<Record<string, BuilderRewardOption[]>>({})
  const selectedRewardId = reactive<Record<string, string>>({})
  const draftStats = reactive<BuilderStatEntry[]>([])

  const selectedStatBlock = ref<number | null>(null)
  const isHydrated = ref(false)
  const isSuggesting = ref(false)
  const isSaving = ref(false)
  const lastError = ref<string | null>(null)
  const statusMessage = ref('')

  const activeConfig = computed<BuilderProjectConfig>(() => {
    return registry[activeBuilderKey.value] ?? defaultBuilderConfig
  })

  const activeArtConfig = computed(() => {
    const config = activeConfig.value

    const artPurpose =
      config.artPurpose ??
      (config.modelType === 'adventure'
        ? 'character'
        : config.modelType === 'character'
          ? 'character'
          : config.modelType === 'scenario'
            ? 'scenario'
            : config.modelType === 'reward'
              ? 'reward'
              : config.modelType === 'pitch'
                ? 'pitch'
                : config.modelType === 'dream'
                  ? 'dream'
                  : 'builder')

    const artImageRole =
      config.artImageRole ??
      (artPurpose === 'character'
        ? 'avatar'
        : artPurpose === 'scenario'
          ? 'scene'
          : artPurpose === 'reward'
            ? 'object'
            : artPurpose === 'pitch'
              ? 'cover'
              : artPurpose === 'dream'
                ? 'world'
                : 'builder')

    return {
      purpose: artPurpose,
      imageRole: artImageRole,
      title:
        config.artTitle ??
        (artPurpose === 'character'
          ? 'Character Avatar Designer'
          : `${config.label || config.title || 'Builder'} Art Designer`),
      description:
        config.artDescription ??
        (artPurpose === 'character'
          ? 'Create, upload, select, or generate avatar art for this character.'
          : 'Create, upload, select, or generate art for this builder sheet.'),
    }
  })

  const cards = computed<BuilderCard[]>(() => activeConfig.value.cards)

  const splash = computed<BuilderSplash>(() => activeConfig.value.splash)

  const utilityCards = computed<BuilderUtilityCard[]>(() => {
    return activeConfig.value.utilityCards?.length
      ? activeConfig.value.utilityCards
      : builderUtilityCards
  })

  const activeCard = computed<BuilderCard | null>(() => {
    return getBuilderCard(cards.value, activeCardKey.value)
  })

  const activeStep = computed<BuilderStep | null>(() => {
    return getBuilderStep(activeCard.value, activeStepIndex.value)
  })

  const isFirstStep = computed(() => activeStepIndex.value <= 0)

  const isLastStep = computed(() => {
    if (!activeCard.value) return true
    return activeStepIndex.value >= activeCard.value.steps.length - 1
  })

  const coreComplete = computed(() => {
    const required = activeConfig.value.coreCardKeys ?? []
    if (!required.length) return false
    return required.every((key) => Boolean(completedCards[key]))
  })

  const allComplete = computed(() => {
    const required = activeConfig.value.requiredCardKeys ?? []
    if (!required.length) return false
    return required.every((key) => Boolean(completedCards[key]))
  })

  const visibleCards = computed<BuilderCard[]>(() => {
    return getVisibleBuilderCards({
      cards: cards.value,
      completedCards,
      coreCardKeys: activeConfig.value.coreCardKeys,
      requiredCardKeys: activeConfig.value.requiredCardKeys,
      finalCardKey: activeConfig.value.finalCardKey,
      allowCompletedCardsInDeck: activeConfig.value.allowCompletedCardsInDeck,
    })
  })

  const completedCardList = computed<BuilderCard[]>(() => {
    return cards.value.filter((card) => completedCards[card.key])
  })

  const activeStepValue = computed(() => {
    if (!activeStep.value) return ''
    return getBuilderStepValue(sheet, activeStep.value, stagedValues)
  })

  const usedStatValues = computed(() => {
    return draftStats.map((entry) => entry.value).filter((value) => value > 0)
  })

  const statAllocationComplete = computed(() => {
    if (!draftStats.length) return false

    const values = draftStats.map((entry) => entry.value).sort((a, b) => a - b)
    return values.join(',') === '1,2,3,4,5,6'
  })

  const activeRewardOptions = computed<BuilderRewardOption[]>(() => {
    return rewardOptions[activeCard.value?.rewardSlotKey ?? ''] ?? []
  })

  const activeSelectedRewardId = computed(() => {
    return selectedRewardId[activeCard.value?.rewardSlotKey ?? ''] ?? ''
  })

  const canFinish = computed(() => {
    return builderStepCanFinish({
      step: activeStep.value,
      stagedValues,
      selectedRewardId,
      statAllocationComplete: statAllocationComplete.value,
      activeCard: activeCard.value,
    })
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function setStatus(message: string): void {
    statusMessage.value = message
  }

  function getUtilityCard(id: string): BuilderUtilityCard | undefined {
    return findBuilderUtilityCard(utilityCards.value, id)
  }

  function getUtilityImagePath(id: string): string | null {
    return getUtilityCard(id)?.imagePath ?? null
  }

  function registerBuilder(config: BuilderProjectConfig): void {
    registry[config.key] = config
  }

  function setBuilder(builderKey: string, hydrateState = true): void {
    const nextConfig = registry[builderKey]

    if (!nextConfig) {
      lastError.value = `Builder "${builderKey}" is not registered.`
      return
    }

    activeBuilderKey.value = builderKey
    resetRuntimeState(nextConfig)

    if (hydrateState) {
      hydrate()
    }
  }

  function resetRuntimeState(config = activeConfig.value): void {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    isHydrated.value = false
    isSuggesting.value = false
    isSaving.value = false
    lastError.value = null
    statusMessage.value = ''

    resetBuilderObject(stagedValues)
    resetBuilderObject(completedCards)
    resetBuilderObject(selectedListOptions)
    resetBuilderObject(selectedChoiceValues)
    resetBuilderObject(rewardOptions)
    resetBuilderObject(selectedRewardId)
    draftStats.splice(0, draftStats.length)

    resetBuilderObject(sheet)
    Object.assign(sheet, cloneBuilderValue(config.defaultSheet()))

    const initialStats = Array.isArray(sheet.stats)
      ? (sheet.stats as BuilderStatEntry[])
      : []

    draftStats.splice(0, draftStats.length, ...cloneBuilderValue(initialStats))
  }

  function selectCard(cardKey: string): void {
    const card = cards.value.find((entry) => entry.key === cardKey)

    if (!card) return

    activeCardKey.value = card.key
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    clearError()

    for (const step of card.steps) {
      stagedValues[step.key] = getBuilderStepValue(sheet, step, stagedValues)
      if (step.multiSelect) {
        selectedChoiceValues[step.key] = builderArrayFromPiped(
          stagedValues[step.key] ?? '',
        )
      }
    }

    if (card.steps.some((step) => step.inputType === 'stats')) {
      const source = Array.isArray(sheet.stats)
        ? (sheet.stats as BuilderStatEntry[])
        : []

      draftStats.splice(0, draftStats.length, ...cloneBuilderValue(source))
    }

    persist()
  }

  function randomCard(): void {
    if (!visibleCards.value.length) return

    const pick = visibleCards.value[
      Math.floor(Math.random() * visibleCards.value.length)
    ]

    if (pick) selectCard(pick.key)
  }

  function cancelCard(): void {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null
    clearError()
    persist()
  }

  function nextStep(): void {
    if (!activeCard.value) return

    if (activeStepIndex.value < activeCard.value.steps.length - 1) {
      activeStepIndex.value++
      persist()
    }
  }

  function prevStep(): void {
    if (activeStepIndex.value > 0) {
      activeStepIndex.value--
      persist()
    }
  }

  function setStagedValue(stepKey: string, value: string): void {
    stagedValues[stepKey] = value

    const step = cards.value
      .flatMap((card) => card.steps)
      .find((entry) => entry.key === stepKey)

    if (step?.multiSelect) {
      selectedChoiceValues[stepKey] = builderArrayFromPiped(value)
    }

    persist()
  }

  function selectPresetChoice(stepKey: string, value: string): void {
    const step = activeStep.value
    const choice = step?.choices?.find((entry) => entry.value === value)

    if (!step) return

    if (choice) {
      selectBuilderChoiceValue({
        step,
        choice,
        stagedValues,
        selectedChoiceValues,
      })
    } else {
      stagedValues[stepKey] = value
    }

    persist()

    if (step.multiSelect) return

    if (isLastStep.value) {
      finishCard()
    } else {
      nextStep()
    }
  }

  function selectListOption(stepKey: string, value: string): void {
    const current = selectedListOptions[stepKey] ?? []
    const exists = current.includes(value)
    const next = exists
      ? current.filter((entry) => entry !== value)
      : [...current, value]

    selectedListOptions[stepKey] = next
    stagedValues[stepKey] = next.join('|')
    persist()
  }

  function setRewardOptions(slotKey: string, options: BuilderRewardOption[]): void {
    rewardOptions[slotKey] = options
    if (!selectedRewardId[slotKey] && options[0]) {
      selectedRewardId[slotKey] = options[0].id
    }
    persist()
  }

  function selectRewardOption(slotKey: string, optionId: string): void {
    selectedRewardId[slotKey] = optionId
    persist()
  }

  function selectStatBlock(block: number): void {
    selectedStatBlock.value = selectedStatBlock.value === block ? null : block
  }

  function assignStat(statKey: string): void {
    if (!selectedStatBlock.value) return

    const block = selectedStatBlock.value

    for (const stat of draftStats) {
      if (stat.key !== statKey && stat.value === block) {
        stat.value = 0
      }
    }

    const target = draftStats.find((stat) => stat.key === statKey)
    if (target) target.value = block

    selectedStatBlock.value = null
    persist()
  }

  function rollAllStats(): void {
    const blocks = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5)

    draftStats.forEach((stat, index) => {
      stat.value = blocks[index] ?? 0
    })

    selectedStatBlock.value = null
    persist()
  }

  function finishCard(): void {
    if (!activeCard.value) return

    const result = defaultFinishBuilderCard({
      card: activeCard.value,
      step: activeStep.value,
      sheet,
      stagedValues,
      completedCards,
      rewardOptions,
      selectedRewardId,
      draftStats,
    })

    if (!result.success) {
      lastError.value = result.message ?? 'This card is not ready yet.'
      return
    }

    advanceToNextCard(activeCard.value.key)
    persist()
  }

  function advanceToNextCard(previousKey: string): void {
    activeCardKey.value = null
    activeStepIndex.value = 0
    selectedStatBlock.value = null

    const next = visibleCards.value.find(
      (card) => card.key !== previousKey && !completedCards[card.key],
    )

    if (next) selectCard(next.key)
  }

  function removeSection(cardKey: string): void {
    const card = cards.value.find((entry) => entry.key === cardKey)

    if (!card) return

    clearBuilderCardFields(sheet, card, activeConfig.value)
    completedCards[card.key] = false

    for (const step of card.steps) {
      delete stagedValues[step.key]
      delete selectedChoiceValues[step.key]
      delete selectedListOptions[step.key]
    }

    if (card.rewardSlotKey) {
      delete rewardOptions[card.rewardSlotKey]
      delete selectedRewardId[card.rewardSlotKey]
    }

    if (activeCardKey.value === card.key) {
      cancelCard()
    }

    persist()
  }

  function updateSheet(payload: Partial<BuilderSheet>): void {
    mergeBuilderSheet(sheet, payload)
    persist()
  }

  function updateArt(payload: {
    artPrompt?: string
    imagePath?: string | null
    artImageId?: number | null
  }): void {
    if (payload.artPrompt !== undefined) sheet.artPrompt = payload.artPrompt
    if (payload.imagePath !== undefined) sheet.imagePath = payload.imagePath
    if (payload.artImageId !== undefined) sheet.artImageId = payload.artImageId

    completedCards.art = Boolean(sheet.artPrompt || sheet.imagePath || sheet.artImageId)
    persist()
  }

  async function callSuggest(
    field = activeStep.value?.suggestField ?? activeStep.value?.field ?? '',
    stepKey = activeStep.value?.key ?? field,
    current = activeStepValue.value,
  ): Promise<{ success: boolean; message?: string }> {
    if (!field) {
      return { success: false, message: 'No field selected for suggestion.' }
    }

    isSuggesting.value = true
    clearError()

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
          builder: activeBuilderKey.value,
          server: serverSnapshot,
          field,
          stepKey,
          current,
          context: sheet,
          extra: {
            modelType: activeConfig.value.modelType,
            builderLabel: activeConfig.value.label,
            cardKey: activeCard.value?.key ?? null,
            cardTitle: activeCard.value?.title ?? null,
            stepTitle: activeStep.value?.title ?? null,
            instruction: activeStep.value?.suggestInstruction ?? null,
            configContext: activeConfig.value.suggestContext ?? {},
            stepContext: activeStep.value?.suggestContext ?? {},
            cardPayload: activeCard.value?.payload ?? {},
            stepPayload: activeStep.value?.payload ?? {},
          },
        }),
      })

      if (result.success && result.data?.value) {
        if (field === 'artPrompt') {
          sheet.artPrompt = result.data.value
        } else {
          setStagedValue(stepKey, result.data.value)
        }

        return { success: true }
      }

      const message = result.message ?? 'The model returned nothing useful.'
      lastError.value = message
      return { success: false, message }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Suggestion request failed.'
      lastError.value = message
      return { success: false, message }
    } finally {
      isSuggesting.value = false
    }
  }

  async function callArtSuggest(current = String(sheet.artPrompt ?? '')) {
    return callSuggest('artPrompt', 'art', current)
  }

  function persist(): void {
    const config = activeConfig.value

    saveBuilderSnapshot(
      config.storageKey,
      createBuilderSnapshot({
        builderKey: activeBuilderKey.value,
        sheet,
        completedCards,
        stagedValues,
        activeCardKey: config.persistActiveCard === false ? null : activeCardKey.value,
        activeStepIndex: config.persistActiveCard === false ? 0 : activeStepIndex.value,
        selectedListOptions,
        selectedChoiceValues,
        rewardOptions,
        selectedRewardId,
        draftStats,
      }),
    )
  }

  function hydrate(): void {
    const snapshot = loadBuilderSnapshot(activeConfig.value.storageKey)

    if (!snapshot) {
      isHydrated.value = true
      return
    }

    mergeBuilderSheet(sheet, snapshot.sheet)
    Object.assign(completedCards, snapshot.completedCards)
    Object.assign(stagedValues, snapshot.stagedValues)
    Object.assign(selectedListOptions, snapshot.selectedListOptions)
    Object.assign(selectedChoiceValues, snapshot.selectedChoiceValues)
    Object.assign(rewardOptions, snapshot.rewardOptions)
    Object.assign(selectedRewardId, snapshot.selectedRewardId)

    draftStats.splice(0, draftStats.length, ...cloneBuilderValue(snapshot.draftStats))
    activeCardKey.value = snapshot.activeCardKey
    activeStepIndex.value = snapshot.activeStepIndex
    isHydrated.value = true
  }

  function resetBuilder(clearSaved = true): void {
    const config = activeConfig.value

    if (clearSaved) {
      clearBuilderSnapshot(config.storageKey)
    }

    resetRuntimeState(config)
    isHydrated.value = true
  }

  function clearSavedBuilder(): void {
    clearBuilderSnapshot(activeConfig.value.storageKey)
  }

  return {
    registry,
    activeBuilderKey,
    activeCardKey,
    activeStepIndex,
    sheet,
    stagedValues,
    completedCards,
    selectedListOptions,
    selectedChoiceValues,
    rewardOptions,
    selectedRewardId,
    draftStats,
    selectedStatBlock,
    isHydrated,
    isSuggesting,
    isSaving,
    lastError,
    statusMessage,

    activeConfig,
    cards,
    splash,
    utilityCards,
    activeCard,
    activeStep,
    isFirstStep,
    isLastStep,
    coreComplete,
    allComplete,
    visibleCards,
    completedCardList,
    activeStepValue,
    usedStatValues,
    statAllocationComplete,
    activeRewardOptions,
    activeSelectedRewardId,
    canFinish,

    registerBuilder,
    setBuilder,
    resetRuntimeState,
    selectCard,
    randomCard,
    cancelCard,
    nextStep,
    prevStep,
    setStagedValue,
    selectPresetChoice,
    selectListOption,
    setRewardOptions,
    selectRewardOption,
    selectStatBlock,
    assignStat,
    rollAllStats,
    finishCard,
    advanceToNextCard,
    removeSection,
    updateSheet,
    updateArt,
    callSuggest,
    callArtSuggest,
    persist,
    hydrate,
    resetBuilder,
    clearSavedBuilder,
    clearError,
    setLastError,
    setStatus,
    getUtilityCard,
    getUtilityImagePath,
activeArtConfig,
  }
})
