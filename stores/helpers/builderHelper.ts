// /stores/helpers/builderHelper.ts
import type {
  BuilderCard,
  BuilderChoice,
  BuilderFieldValue,
  BuilderFinishContext,
  BuilderFinishResult,
  BuilderProjectConfig,
  BuilderRewardOption,
  BuilderSheet,
  BuilderSnapshot,
  BuilderStatEntry,
  BuilderStep,
  BuilderUtilityCard,
  DashboardTabConfig,
} from '@/stores/helpers/builderCards'

const isClient = typeof window !== 'undefined'

export function prefixBuilderKey(builderKey: string, cardKey: string): string {
  return `${builderKey}-${cardKey}`
}

export function unprefixBuilderKey(builderKey: string, tabKey: string): string {
  const prefix = `${builderKey}-`
  return tabKey.startsWith(prefix) ? tabKey.slice(prefix.length) : tabKey
}

export function builderCardsToDashboardTabs(
  builderKey: string,
  cards: BuilderCard[],
): DashboardTabConfig[] {
  return cards.map((card) => ({
    key: prefixBuilderKey(builderKey, card.key),
    label: card.label,
    icon: card.icon,
    title: card.title,
    summary: card.tagline,
  }))
}

export function makeBuilderId(prefix = 'builder'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function cloneBuilderValue<T>(value: T): T {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

export function normalizeBuilderText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

export function builderArrayFromPiped(value: string): string[] {
  return value
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function builderPipedFromArray(values: string[]): string {
  return values
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join('|')
}

export function getBuilderCard(
  cards: BuilderCard[],
  cardKey: string | null,
): BuilderCard | null {
  if (!cardKey) return null
  return cards.find((card) => card.key === cardKey) ?? null
}

export function getBuilderStep(
  card: BuilderCard | null,
  stepIndex: number,
): BuilderStep | null {
  return card?.steps[stepIndex] ?? null
}

export function getBuilderStepValue(
  sheet: BuilderSheet,
  step: BuilderStep,
  stagedValues: Record<string, string>,
): string {
  const staged = stagedValues[step.key]
  if (staged !== undefined) return staged
  if (!step.field) return step.defaultValue ?? ''
  return normalizeBuilderText(sheet[step.field]) || step.defaultValue || ''
}

export function setBuilderFieldValue(
  sheet: BuilderSheet,
  field: string,
  value: BuilderFieldValue,
): void {
  sheet[field] = value
}

export function applyBuilderStepToSheet(
  sheet: BuilderSheet,
  step: BuilderStep,
  stagedValues: Record<string, string>,
): void {
  if (!step.field) return

  const raw = stagedValues[step.key] ?? step.defaultValue ?? ''

  if (step.multiSelect) {
    sheet[step.field] = raw
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join('|')
    return
  }

  sheet[step.field] = raw
}

export function clearBuilderField(
  sheet: BuilderSheet,
  field: string,
  config?: BuilderProjectConfig,
): void {
  if (config?.clearFieldDefaults && field in config.clearFieldDefaults) {
    sheet[field] = cloneBuilderValue(config.clearFieldDefaults[field])
    return
  }

  const current = sheet[field]

  if (Array.isArray(current)) {
    sheet[field] = []
    return
  }

  if (typeof current === 'boolean') {
    sheet[field] = false
    return
  }

  if (typeof current === 'number') {
    sheet[field] = 0
    return
  }

  if (current && typeof current === 'object') {
    sheet[field] = {}
    return
  }

  sheet[field] = ''
}

export function clearBuilderCardFields(
  sheet: BuilderSheet,
  card: BuilderCard,
  config?: BuilderProjectConfig,
): void {
  for (const field of card.restoresFields) {
    clearBuilderField(sheet, field, config)
  }
}

export function isBuilderCoreComplete(
  completedCards: Record<string, boolean>,
  coreCardKeys: string[] = [],
): boolean {
  if (!coreCardKeys.length) return false
  return coreCardKeys.every((key) => Boolean(completedCards[key]))
}

export function isBuilderAllComplete(
  completedCards: Record<string, boolean>,
  requiredCardKeys: string[] = [],
): boolean {
  if (!requiredCardKeys.length) return false
  return requiredCardKeys.every((key) => Boolean(completedCards[key]))
}

export function isBuilderCardUnlocked(args: {
  card: BuilderCard
  completedCards: Record<string, boolean>
  coreCardKeys?: string[]
  requiredCardKeys?: string[]
}): boolean {
  const {
    card,
    completedCards,
    coreCardKeys = [],
    requiredCardKeys = [],
  } = args

  if (!card.unlockCondition || card.unlockCondition === 'always') return true

  if (card.unlockCondition === 'coreComplete') {
    return isBuilderCoreComplete(completedCards, coreCardKeys)
  }

  if (card.unlockCondition === 'allComplete') {
    return isBuilderAllComplete(completedCards, requiredCardKeys)
  }

  return Boolean(completedCards[card.unlockCondition])
}

export function getVisibleBuilderCards(args: {
  cards: BuilderCard[]
  completedCards: Record<string, boolean>
  coreCardKeys?: string[]
  requiredCardKeys?: string[]
  finalCardKey?: string
  allowCompletedCardsInDeck?: boolean
}): BuilderCard[] {
  const {
    cards,
    completedCards,
    coreCardKeys = [],
    requiredCardKeys = [],
    finalCardKey,
    allowCompletedCardsInDeck = false,
  } = args

  return cards.filter((card) => {
    const unlocked = isBuilderCardUnlocked({
      card,
      completedCards,
      coreCardKeys,
      requiredCardKeys,
    })

    if (!unlocked) return false
    if (allowCompletedCardsInDeck) return true
    if (finalCardKey && card.key === finalCardKey) return true
    return !completedCards[card.key]
  })
}

export function selectBuilderChoiceValue(args: {
  step: BuilderStep
  choice: BuilderChoice
  stagedValues: Record<string, string>
  selectedChoiceValues: Record<string, string[]>
}): string {
  const { step, choice, stagedValues, selectedChoiceValues } = args

  if (!step.multiSelect) {
    stagedValues[step.key] = choice.value
    selectedChoiceValues[step.key] = choice.value ? [choice.value] : []

    return choice.value
  }

  const current =
    selectedChoiceValues[step.key] ??
    builderArrayFromPiped(stagedValues[step.key] ?? '')

  const exists = current.includes(choice.value)

  const next = exists
    ? current.filter((entry) => entry !== choice.value)
    : [...current, choice.value]

  selectedChoiceValues[step.key] = next

  const value = builderPipedFromArray(next)
  stagedValues[step.key] = value

  return value
}

export function createBuilderSnapshot<TSheet extends BuilderSheet>(args: {
  builderKey: string
  sheet: TSheet
  completedCards: Record<string, boolean>
  stagedValues: Record<string, string>
  activeCardKey: string | null
  activeStepIndex: number
  selectedListOptions: Record<string, string[]>
  selectedChoiceValues: Record<string, string[]>
  rewardOptions: Record<string, BuilderRewardOption[]>
  selectedRewardId: Record<string, string>
  draftStats: BuilderStatEntry[]
}): BuilderSnapshot<TSheet> {
  return {
    builderKey: args.builderKey,
    sheet: cloneBuilderValue(args.sheet),
    completedCards: { ...args.completedCards },
    stagedValues: { ...args.stagedValues },
    activeCardKey: args.activeCardKey,
    activeStepIndex: args.activeStepIndex,
    selectedListOptions: cloneBuilderValue(args.selectedListOptions),
    selectedChoiceValues: cloneBuilderValue(args.selectedChoiceValues),
    rewardOptions: cloneBuilderValue(args.rewardOptions),
    selectedRewardId: { ...args.selectedRewardId },
    draftStats: cloneBuilderValue(args.draftStats),
    updatedAt: Date.now(),
  }
}

export function saveBuilderSnapshot<TSheet extends BuilderSheet>(
  storageKey: string,
  snapshot: BuilderSnapshot<TSheet>,
): void {
  if (!isClient) return

  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot))
  } catch (error) {
    console.warn('[builderHelper] saveBuilderSnapshot failed:', error)
  }
}

export function loadBuilderSnapshot<TSheet extends BuilderSheet>(
  storageKey: string,
): BuilderSnapshot<TSheet> | null {
  if (!isClient) return null

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw) as BuilderSnapshot<TSheet>
  } catch (error) {
    console.warn('[builderHelper] loadBuilderSnapshot failed:', error)
    localStorage.removeItem(storageKey)
    return null
  }
}

export function clearBuilderSnapshot(storageKey: string): void {
  if (!isClient) return
  localStorage.removeItem(storageKey)
}

export function mergeBuilderSheet<TSheet extends BuilderSheet>(
  target: TSheet,
  source: Partial<TSheet>,
): void {
  for (const [key, value] of Object.entries(source)) {
    target[key as keyof TSheet] = cloneBuilderValue(
      value,
    ) as TSheet[keyof TSheet]
  }
}

export function resetBuilderObject(target: Record<string, unknown>): void {
  for (const key of Object.keys(target)) {
    delete target[key]
  }
}

export function builderStepCanFinish(args: {
  step: BuilderStep | null
  stagedValues: Record<string, string>
  selectedRewardId: Record<string, string>
  statAllocationComplete: boolean
  activeCard: BuilderCard | null
}): boolean {
  const {
    step,
    stagedValues,
    selectedRewardId,
    statAllocationComplete,
    activeCard,
  } = args

  if (!step) return false
  if (step.inputType === 'stats') return statAllocationComplete

  if (step.inputType === 'reward') {
    const slotKey = activeCard?.rewardSlotKey
    return slotKey ? Boolean(selectedRewardId[slotKey]) : false
  }

  if (!step.required) return true

  return Boolean((stagedValues[step.key] ?? '').trim())
}

export function defaultFinishBuilderCard<TSheet extends BuilderSheet>(
  context: BuilderFinishContext<TSheet>,
): BuilderFinishResult {
  const { card, sheet, stagedValues, completedCards } = context

  if (card.key === 'art') {
    completedCards[card.key] = Boolean(
      normalizeBuilderText(sheet.artPrompt).trim() ||
      normalizeBuilderText(sheet.imagePath).trim() ||
      Number(sheet.artImageId ?? 0) > 0,
    )

    return { handled: true, success: true }
  }

  if (card.rewardSlotKey) {
    const optionId = context.selectedRewardId[card.rewardSlotKey]
    const option = context.rewardOptions[card.rewardSlotKey]?.find(
      (entry) => entry.id === optionId,
    )

    if (!option) {
      return {
        handled: true,
        success: false,
        message: 'Pick a reward before finishing this card.',
      }
    }

    const builderSheet = sheet as BuilderSheet
    const rewards = builderSheet['rewards']

    const nextRewards =
      rewards && typeof rewards === 'object' && !Array.isArray(rewards)
        ? { ...(rewards as Record<string, unknown>) }
        : {}

    nextRewards[card.rewardSlotKey] = option
    builderSheet['rewards'] = nextRewards
    completedCards[card.key] = true

    return { handled: true, success: true }
  }

  if (card.steps.some((step) => step.inputType === 'stats')) {
    const builderSheet = sheet as BuilderSheet
    builderSheet['stats'] = cloneBuilderValue(context.draftStats)
    completedCards[card.key] = true

    return { handled: true, success: true }
  }

  for (const step of card.steps) {
    applyBuilderStepToSheet(sheet, step, stagedValues)
  }

  completedCards[card.key] = true

  return { handled: true, success: true }
}

export function findBuilderUtilityCard(
  cards: BuilderUtilityCard[] | undefined,
  id: string,
): BuilderUtilityCard | undefined {
  return cards?.find((card) => card.id === id)
}
