// /stores/helpers/rewardRoller.ts
import type { Rarity } from '@/stores/rewardStore'
import type { RolledReward } from '@/stores/generatorStore'

export type RewardCategory =
  | 'item'
  | 'skill'
  | 'ability'
  | 'character'
  | 'location'
  | 'title'
  | 'lore'
  | 'theme'
  | 'treasure'
  | 'gear'
  | 'equipment'

export type RewardSlotConfig = {
  key: string
  count?: number
  baseRarity?: Rarity
  guaranteedCategories?: RewardCategory[]
  bonusCategories?: RewardCategory[]
  categoryUpgradeChance?: number
  rarityUpgradeChance?: number
}

const DEFAULT_COUNT = 6

const DEFAULT_CATEGORIES: RewardCategory[] = [
  'item',
  'skill',
  'character',
  'location',
  'title',
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
    guaranteedCategories: ['item'],
    bonusCategories: DEFAULT_CATEGORIES,
    categoryUpgradeChance: 0.18,
    rarityUpgradeChance: 0.24,
  },
  'starting-skill': {
    key: 'starting-skill',
    count: 6,
    baseRarity: 'COMMON',
    guaranteedCategories: ['skill'],
    bonusCategories: DEFAULT_CATEGORIES,
    categoryUpgradeChance: 0.18,
    rarityUpgradeChance: 0.24,
  },
  rewards: {
    key: 'rewards',
    count: 6,
    baseRarity: 'COMMON',
    guaranteedCategories: DEFAULT_CATEGORIES,
    bonusCategories: DEFAULT_CATEGORIES,
    categoryUpgradeChance: 0.24,
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
    if (roll <= 0) return entry.rarity
  }

  return 'COMMON'
}

function getRewardCategory(reward: RolledReward): string {
  const payload = (reward as unknown as { payload?: Record<string, unknown> })
    .payload

  return String(
    payload?.category ??
      payload?.type ??
      payload?.kind ??
      (reward as unknown as { category?: string }).category ??
      (reward as unknown as { type?: string }).type ??
      '',
  ).toLowerCase()
}

function rewardMatchesCategory(
  reward: RolledReward,
  category: RewardCategory,
): boolean {
  const rewardCategory = getRewardCategory(reward)

  if (!rewardCategory) return true

  if (category === 'skill') {
    return rewardCategory.includes('skill') || rewardCategory.includes('ability')
  }

  if (category === 'ability') {
    return rewardCategory.includes('ability') || rewardCategory.includes('skill')
  }

  if (category === 'item') {
    return (
      rewardCategory.includes('item') ||
      rewardCategory.includes('treasure') ||
      rewardCategory.includes('gear') ||
      rewardCategory.includes('equipment')
    )
  }

  return rewardCategory.includes(category)
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
    guaranteedCategories: DEFAULT_CATEGORIES,
    bonusCategories: DEFAULT_CATEGORIES,
    categoryUpgradeChance: 0.2,
    rarityUpgradeChance: 0.25,
  }

  const count = config.count ?? DEFAULT_COUNT
  const baseRarity = config.baseRarity ?? 'COMMON'
  const guaranteedCategories = config.guaranteedCategories?.length
    ? config.guaranteedCategories
    : DEFAULT_CATEGORIES
  const bonusCategories = config.bonusCategories?.length
    ? config.bonusCategories
    : DEFAULT_CATEGORIES

  const options: RolledReward[] = []

  for (const category of guaranteedCategories) {
    if (options.length >= count) break

    const upgradedCategory =
      Math.random() < (config.categoryUpgradeChance ?? 0)
        ? randomFrom(bonusCategories) ?? category
        : category

    const rarity =
      Math.random() < (config.rarityUpgradeChance ?? 0)
        ? rollWeightedRarity()
        : baseRarity

    const rolled = rollFromGenerator(rarity, count * 3)

    for (const reward of rolled) {
      if (!rewardMatchesCategory(reward, upgradedCategory)) continue
      pushUniqueReward(options, reward, count)
      break
    }
  }

  for (let attempt = 0; attempt < 10 && options.length < count; attempt++) {
    const rarity = attempt === 0 ? baseRarity : rollWeightedRarity()
    const category = randomFrom(bonusCategories) ?? 'item'
    const rolled = rollFromGenerator(rarity, count * 3)

    for (const reward of rolled) {
      if (!rewardMatchesCategory(reward, category)) continue
      pushUniqueReward(options, reward, count)
      if (options.length >= count) break
    }
  }

  if (!options.length) {
    return rollFromGenerator(baseRarity, count)
  }

  return options.slice(0, count)
}