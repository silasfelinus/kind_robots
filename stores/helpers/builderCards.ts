// /stores/helpers/builderCards.ts
export type BuilderInputType =
  | 'preset'
  | 'text'
  | 'long'
  | 'stats'
  | 'reward'
  | 'list'
  | 'art'
  | 'toggle'
  | 'visibility'
  | 'relation-picker'
  | 'collection-picker'
  | 'custom'

export type BuilderUnlockCondition =
  | 'always'
  | 'coreComplete'
  | 'allComplete'
  | string

export type BuilderFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | Record<string, unknown>
  | Array<Record<string, unknown>>

export type BuilderSheet = Record<string, BuilderFieldValue>

export type BuilderChoice = {
  value: string
  label: string
  subtext?: string
  icon?: string
  image?: string
  color?: string
  opensCustom?: boolean
  opensList?: boolean
  listOptions?: string[]
  payload?: Record<string, unknown>
}

export type BuilderStep = {
  key: string
  title: string
  narrative: string
  inputType: BuilderInputType
  field?: string
  choices?: BuilderChoice[]
  listOptions?: string[]
  generatorKey?: string
  placeholder?: string
  inputLabel?: string
  heroImage?: string
  needsLLM?: boolean
  multiSelect?: boolean
  required?: boolean
  defaultValue?: string
  suggestField?: string
  suggestInstruction?: string
  suggestContext?: Record<string, unknown>
  payload?: Record<string, unknown>
}

export type BuilderArtPurpose =
  | 'user'
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'builder'

export type BuilderCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish?: string
  deckImage?: string
  heroImage?: string
  tagline: string
  narrative: string
  required?: boolean
  rewardSlotKey?: string
  restoresFields: string[]
  unlockCondition?: BuilderUnlockCondition
  steps: BuilderStep[]
  payload?: Record<string, unknown>
}

export type BuilderSplash = {
  title: string
  subtitle?: string
  tagline: string
  description: string
  imagePath: string
  ctaLabel?: string
  secondaryLabel?: string
}

export type BuilderUtilityCard = {
  id: string
  label: string
  imagePath: string
  description: string
  icon?: string
}

export type BuilderStatEntry = {
  key: string
  name: string
  display: string
  value: number
  rarity?: string
}

export type BuilderRewardOption = {
  id: string
  label: string
  description?: string
  rarity?: string
  icon?: string
  imagePath?: string | null
  payload?: Record<string, unknown>
}

export type BuilderSuggestPayload = {
  builder: string
  field: string
  stepKey: string
  current: string
  context: BuilderSheet
  extra?: Record<string, unknown>
}

export type BuilderProjectConfig<TSheet extends BuilderSheet = BuilderSheet> = {
  key: string
  label: string
  title: string
  modelType: string
  storageKey: string
  cards: BuilderCard[]
  splash: BuilderSplash
  defaultSheet: () => TSheet
  coreCardKeys?: string[]
  requiredCardKeys?: string[]
  finalCardKey?: string
  utilityCards?: BuilderUtilityCard[]
  suggestContext?: Record<string, unknown>
  clearFieldDefaults?: Record<string, BuilderFieldValue>
  persistActiveCard?: boolean
  allowCompletedCardsInDeck?: boolean
  artPurpose?: BuilderArtPurpose
  artImageRole?: string
  artTitle?: string
  artDescription?: string
}

export type BuilderSnapshot<TSheet extends BuilderSheet = BuilderSheet> = {
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
  updatedAt: number
}

export type BuilderFinishContext<TSheet extends BuilderSheet = BuilderSheet> = {
  card: BuilderCard
  step: BuilderStep | null
  sheet: TSheet
  stagedValues: Record<string, string>
  completedCards: Record<string, boolean>
  rewardOptions: Record<string, BuilderRewardOption[]>
  selectedRewardId: Record<string, string>
  draftStats: BuilderStatEntry[]
}

export type BuilderFinishResult = {
  handled: boolean
  success: boolean
  message?: string
}

export const builderUtilityCards: BuilderUtilityCard[] = [
  {
    id: 'splash',
    label: 'Builder Splash',
    imagePath: '/images/builder/utility/splash.webp',
    description: 'Default splash image for reusable builder flows.',
    icon: 'kind-icon:sparkles',
  },
  {
    id: 'empty-card',
    label: 'Empty Card',
    imagePath: '/images/builder/utility/empty-card.webp',
    description: 'Fallback image for cards that do not have art yet.',
    icon: 'kind-icon:cards',
  },
  {
    id: 'loading',
    label: 'Builder Loading',
    imagePath: '/images/builder/utility/loading.webp',
    description: 'Fallback loading image for suggestion and generation states.',
    icon: 'kind-icon:bubble-loading',
  },
  {
    id: 'error',
    label: 'Builder Error',
    imagePath: '/images/builder/utility/error.webp',
    description: 'Fallback error image for builder flows.',
    icon: 'kind-icon:warning',
  },
]

export const EMPTY_BUILDER_SPLASH: BuilderSplash = {
  title: 'Builder',
  tagline: 'Make the thing. Name the thing. Give the thing consequences.',
  description:
    'A reusable card-based builder flow for Kind Robots models and experiments.',
  imagePath: '/images/builder/utility/splash.webp',
  ctaLabel: 'Start Building',
}
