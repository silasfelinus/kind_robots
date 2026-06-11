// /stores/helpers/rewardRoller.ts
import type { Rarity } from '@/stores/rewardStore'
import type { RolledReward } from '@/stores/generatorStore'

export type RewardType =
  | 'SKILL'
  | 'ITEM'
  | 'POWER'
  | 'PET'
  | 'MAGIC'
  | 'FAVOR'

export type RewardSlotConfig = {
  key: string
  count?: number
  baseRarity?: Rarity
  requiredTypes?: RewardType[]
  bonusTypes?: RewardType[]
  typeDriftChance?: number
  rarityUpgradeChance?: number
}

const DEFAULT_COUNT = 6

const DEFAULT_REWARD_TYPES: RewardType[] = [
  'ITEM',
  'SKILL',
  'POWER',
  'PET',
  'MAGIC',
  'FAVOR',
]

const RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: 'COMMON', weight: 68 },
  { rarity: 'UNCOMMON', weight: 18 },
  { rarity: 'RARE', weight: 10 },
  { rarity: 'EPIC', weight: 3 },
  { rarity: 'LEGENDARY', weight: 0.85 },
  { rarity: 'MYTHIC', weight: 0.15 },
]

export const DEFAULT_REWARD_SLOT_CONFIGS: Record<string, RewardSlotConfig> = {
  'starting-item': {
    key: 'starting-item',
    count: 6,
    baseRarity: 'COMMON',
    requiredTypes: ['ITEM'],
    bonusTypes: DEFAULT_REWARD_TYPES,
    typeDriftChance: 0.18,
    rarityUpgradeChance: 0.24,
  },
  'starting-skill': {
    key: 'starting-skill',
    count: 6,
    baseRarity: 'COMMON',
    requiredTypes: ['SKILL'],
    bonusTypes: DEFAULT_REWARD_TYPES,
    typeDriftChance: 0.18,
    rarityUpgradeChance: 0.24,
  },
  rewards: {
    key: 'rewards',
    count: 6,
    baseRarity: 'COMMON',
    requiredTypes: DEFAULT_REWARD_TYPES,
    bonusTypes: DEFAULT_REWARD_TYPES,
    typeDriftChance: 0.24,
    rarityUpgradeChance: 0.28,
  },
}

function randomFrom<T>(items: T[]): T | null {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)] ?? null
}

function rollWeightedRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * total

  for (const entry of RARITY_WEIGHTS) {
    roll -= entry.weight

    if (roll <= 0) {
      return entry.rarity
    }
  }

  return 'COMMON'
}

function normalizeRewardType(value: unknown): RewardType | '' {
  const normalized = String(value ?? '').trim().toUpperCase()

  if (
    normalized === 'SKILL' ||
    normalized === 'ITEM' ||
    normalized === 'POWER' ||
    normalized === 'PET' ||
    normalized === 'MAGIC' ||
    normalized === 'FAVOR'
  ) {
    return normalized
  }

  return ''
}

export function getRolledRewardType(reward: RolledReward): RewardType | '' {
  const rewardWithLooseShape = reward as RolledReward & {
    rewardType?: unknown
    type?: unknown
    category?: unknown
    payload?: Record<string, unknown> | null
  }

  return (
    normalizeRewardType(rewardWithLooseShape.rewardType) ||
    normalizeRewardType(rewardWithLooseShape.payload?.rewardType) ||
    normalizeRewardType(rewardWithLooseShape.payload?.type) ||
    normalizeRewardType(rewardWithLooseShape.type) ||
    normalizeRewardType(rewardWithLooseShape.category) ||
    ''
  )
}

function rewardMatchesType(
  reward: RolledReward,
  rewardType: RewardType,
): boolean {
  return getRolledRewardType(reward) === rewardType
}

function pushUniqueReward(
  target: RolledReward[],
  reward: RolledReward,
  count: number,
): void {
  if (target.length >= count) return
  if (target.some((option) => option.id === reward.id)) return

  target.push(reward)
}

function chooseRarity(baseRarity: Rarity, rarityUpgradeChance: number): Rarity {
  return Math.random() < rarityUpgradeChance ? rollWeightedRarity() : baseRarity
}

function findRewardByType(
  rewards: RolledReward[],
  rewardType: RewardType,
): RolledReward | null {
  return rewards.find((reward) => rewardMatchesType(reward, rewardType)) ?? null
}

function rollRequiredType({
  rewardType,
  baseRarity,
  count,
  rarityUpgradeChance,
  rollFromGenerator,
}: {
  rewardType: RewardType
  baseRarity: Rarity
  count: number
  rarityUpgradeChance: number
  rollFromGenerator: (baseRarity: Rarity, count: number) => RolledReward[]
}): RolledReward | null {
  for (let attempt = 0; attempt < 8; attempt++) {
    const rarity =
      attempt === 0
        ? baseRarity
        : chooseRarity(baseRarity, rarityUpgradeChance)

    const rolled = rollFromGenerator(rarity, count * 4)
    const match = findRewardByType(rolled, rewardType)

    if (match) {
      return match
    }
  }

  return null
}

type RollRewardOptionsInput = {
  slotKey: string
  rollFromGenerator: (baseRarity: Rarity, count: number) => RolledReward[]
  slotConfigs?: Record<string, RewardSlotConfig>
}

export function rollRewardOptionsForSlot({
  slotKey,
  rollFromGenerator,
  slotConfigs = DEFAULT_REWARD_SLOT_CONFIGS,
}: RollRewardOptionsInput): RolledReward[] {
  const config = slotConfigs[slotKey] ?? {
    key: slotKey,
    count: DEFAULT_COUNT,
    baseRarity: 'COMMON',
    requiredTypes: DEFAULT_REWARD_TYPES,
    bonusTypes: DEFAULT_REWARD_TYPES,
    typeDriftChance: 0.2,
    rarityUpgradeChance: 0.25,
  }

  const count = config.count ?? DEFAULT_COUNT
  const baseRarity = config.baseRarity ?? 'COMMON'
  const requiredTypes = config.requiredTypes?.length
    ? config.requiredTypes
    : DEFAULT_REWARD_TYPES
  const bonusTypes = config.bonusTypes?.length
    ? config.bonusTypes
    : DEFAULT_REWARD_TYPES
  const typeDriftChance = config.typeDriftChance ?? 0
  const rarityUpgradeChance = config.rarityUpgradeChance ?? 0

  const options: RolledReward[] = []

  for (const rewardType of requiredTypes) {
    if (options.length >= count) break

    const reward = rollRequiredType({
      rewardType,
      baseRarity,
      count,
      rarityUpgradeChance,
      rollFromGenerator,
    })

    if (reward) {
      pushUniqueReward(options, reward, count)
    }
  }

  for (let attempt = 0; attempt < 16 && options.length < count; attempt++) {
    const preferredType = randomFrom(requiredTypes) ?? 'ITEM'
    const rewardType =
      Math.random() < typeDriftChance
        ? randomFrom(bonusTypes) ?? preferredType
        : preferredType

    const rarity = chooseRarity(baseRarity, rarityUpgradeChance)
    const rolled = rollFromGenerator(rarity, count * 4)

    for (const reward of rolled) {
      if (!rewardMatchesType(reward, rewardType)) continue

      pushUniqueReward(options, reward, count)

      if (options.length >= count) break
    }
  }

  for (let attempt = 0; attempt < 8 && options.length < count; attempt++) {
    const rarity = chooseRarity(baseRarity, rarityUpgradeChance)
    const rolled = rollFromGenerator(rarity, count * 4)

    for (const reward of rolled) {
      const rewardType = getRolledRewardType(reward)

      if (!rewardType) continue
      if (!bonusTypes.includes(rewardType)) continue

      pushUniqueReward(options, reward, count)

      if (options.length >= count) break
    }
  }

  return options.slice(0, count)
}