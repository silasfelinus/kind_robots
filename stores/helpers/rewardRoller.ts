// /stores/helpers/rewardRoller.ts
import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'
import type { RolledReward } from '@/stores/generatorStore'

export type RewardSlotConfig = {
  key: string
  count?: number
  baseRarity?: Rarity
  requiredTypes?: RewardType[]
  bonusTypes?: RewardType[]
  typeDriftChance?: number
  rarityUpgradeChance?: number
}

type RollFromGeneratorInput = {
  baseRarity: Rarity
  count: number
  rewardTypes?: RewardType[]
}

type RollRewardOptionsInput = {
  slotKey: string
  rollFromGenerator: (input: RollFromGeneratorInput) => RolledReward[]
  slotConfigs?: Record<string, RewardSlotConfig>
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

function chooseRarity(baseRarity: Rarity, upgradeChance: number): Rarity {
  return Math.random() < upgradeChance ? rollWeightedRarity() : baseRarity
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

function rollForTypes({
  rewardTypes,
  baseRarity,
  count,
  rarityUpgradeChance,
  rollFromGenerator,
}: {
  rewardTypes: RewardType[]
  baseRarity: Rarity
  count: number
  rarityUpgradeChance: number
  rollFromGenerator: (input: RollFromGeneratorInput) => RolledReward[]
}): RolledReward[] {
  for (let attempt = 0; attempt < 8; attempt++) {
    const rarity =
      attempt === 0
        ? baseRarity
        : chooseRarity(baseRarity, rarityUpgradeChance)

    const rolled = rollFromGenerator({
      baseRarity: rarity,
      count: count * 4,
      rewardTypes,
    })

    if (rolled.length) {
      return rolled
    }
  }

  return []
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

    const rolled = rollForTypes({
      rewardTypes: [rewardType],
      baseRarity,
      count,
      rarityUpgradeChance,
      rollFromGenerator,
    })

    const reward = rolled.find((entry) => entry.rewardType === rewardType)

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

    const rolled = rollFromGenerator({
      baseRarity: rarity,
      count: count * 4,
      rewardTypes: [rewardType],
    })

    for (const reward of rolled) {
      if (reward.rewardType !== rewardType) continue

      pushUniqueReward(options, reward, count)

      if (options.length >= count) break
    }
  }

  for (let attempt = 0; attempt < 8 && options.length < count; attempt++) {
    const rarity = chooseRarity(baseRarity, rarityUpgradeChance)

    const rolled = rollFromGenerator({
      baseRarity: rarity,
      count: count * 4,
      rewardTypes: bonusTypes,
    })

    for (const reward of rolled) {
      if (!bonusTypes.includes(reward.rewardType)) continue

      pushUniqueReward(options, reward, count)

      if (options.length >= count) break
    }
  }

  return options.slice(0, count)
}