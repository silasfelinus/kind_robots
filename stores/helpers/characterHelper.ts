// /stores/helpers/characterHelper.ts
import type { Rarity, RewardType } from '~/prisma/generated/prisma/client'
import type {
  BuilderRewardOption,
  BuilderSheet,
  BuilderStatEntry,
} from '@/stores/helpers/builderCards'

export type CharacterStatKey =
  | 'luck'
  | 'might'
  | 'wits'
  | 'grace'
  | 'charm'
  | 'empathy'

export type CharacterRewardSlotKey = 'starting-skill' | 'starting-item'

export type CharacterRewardDraft = {
  id?: number | null
  rewardId?: number | null
  slotKey: CharacterRewardSlotKey
  label: string
  text: string
  power: string
  collection: string
  rewardType: RewardType
  rarity: Rarity
  icon: string
  imagePath: string | null
  artImageId?: number | null
  artPrompt: string
}

export type RewardPromptSlot = {
  key: CharacterRewardSlotKey
  label: string
  description?: string
  rewardType: RewardType
  rarity: Rarity
  icon: string
}

export type CharacterSheetDraft = {
  id: number | null
  name: string
  honorific: string
  title: string
  role: string
  class: string
  species: string
  gender: string
  presentation: string
  genre: string
  alignment: string
  personality: string
  drive: string
  backstory: string
  achievements: string
  quirks: string
  luck: Rarity
  might: Rarity
  wits: Rarity
  grace: Rarity
  charm: Rarity
  empathy: Rarity
  artPrompt: string
  artImageId: number | null
  imagePath: string | null
  userId: number
  designer: string | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  rewards: CharacterRewardDraft[]
}

export const CHARACTER_CORE_CARD_KEYS = [
  'species',
  'gender',
  'alignment',
  'class',
  'personality',
  'quirks',
  'backstory',
  'stats',
]

export const CHARACTER_REQUIRED_CARD_KEYS = [
  ...CHARACTER_CORE_CARD_KEYS,
  'starting-skill',
  'starting-item',
]

export const characterStatFields: Array<{
  key: CharacterStatKey
  label: string
}> = [
  { key: 'luck', label: 'Luck' },
  { key: 'might', label: 'Might' },
  { key: 'wits', label: 'Wits' },
  { key: 'grace', label: 'Grace' },
  { key: 'charm', label: 'Charm' },
  { key: 'empathy', label: 'Empathy' },
]

function tierFromValue(value: number): Rarity {
  if (value >= 6) return 'MYTHIC'
  if (value === 5) return 'LEGENDARY'
  if (value === 4) return 'EPIC'
  if (value === 3) return 'RARE'
  if (value === 2) return 'UNCOMMON'

  return 'COMMON'
}

function numericRewardIdFromOptionId(id: string): number {
  const numericId = Number(id)

  if (Number.isFinite(numericId) && numericId > 0) {
    return numericId
  }

  return Array.from(id).reduce((total, char) => {
    return total + char.charCodeAt(0)
  }, 0)
}

function rewardPayloadType(option: BuilderRewardOption): RewardType | null {
  const payloadType = option.payload?.rewardType
  const rawReward = option.payload?.reward

  if (isRewardType(payloadType)) {
    return payloadType
  }

  if (rawReward && typeof rawReward === 'object' && 'rewardType' in rawReward) {
    const rewardType = (rawReward as { rewardType?: unknown }).rewardType

    if (isRewardType(rewardType)) {
      return rewardType
    }
  }

  return null
}

function isRewardType(value: unknown): value is RewardType {
  return (
    value === 'SKILL' ||
    value === 'ITEM' ||
    value === 'POWER' ||
    value === 'PET' ||
    value === 'MAGIC' ||
    value === 'FAVOR'
  )
}

function rewardTypeFromSlot(slotKey: string): RewardType {
  if (slotKey.includes('skill')) return 'SKILL'
  if (slotKey.includes('item')) return 'ITEM'

  return 'ITEM'
}

function rewardTypeLabel(slotKey: string, reward: BuilderRewardOption): string {
  return (
    rewardPayloadType(reward) ?? rewardTypeFromSlot(slotKey)
  ).toLowerCase()
}

export function defaultCharacterRewardSlots(): RewardPromptSlot[] {
  return [
    {
      key: 'starting-skill',
      label: 'Starting Skill',
      description:
        'A reliable trick, talent, spell, habit, or dramatic problem-solving button.',
      rewardType: 'SKILL',
      rarity: 'COMMON',
      icon: 'kind-icon:sparkles',
    },
    {
      key: 'starting-item',
      label: 'Starting Item',
      description:
        'A useful object, suspicious artifact, lucky tool, or inventory goblin.',
      rewardType: 'ITEM',
      rarity: 'COMMON',
      icon: 'kind-icon:treasure',
    },
  ]
}

export function createEmptyCharacterRewardDraft(
  slot: RewardPromptSlot,
): CharacterRewardDraft {
  return {
    id: null,
    rewardId: null,
    slotKey: slot.key,
    label: '',
    text: '',
    power: '',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarity: slot.rarity,
    icon: slot.icon,
    imagePath: null,
    artImageId: null,
    artPrompt: '',
  }
}

export function builderRewardOptionToCharacterRewardDraft(
  slotKey: CharacterRewardSlotKey,
  option: BuilderRewardOption,
): CharacterRewardDraft {
  const rawReward = option.payload?.reward
  const reward =
    rawReward && typeof rawReward === 'object'
      ? (rawReward as Record<string, unknown>)
      : {}

  const rewardType = rewardPayloadType(option) ?? rewardTypeFromSlot(slotKey)

  const rewardId =
    typeof option.payload?.rewardId === 'number'
      ? option.payload.rewardId
      : typeof reward.rewardId === 'number'
        ? reward.rewardId
        : numericRewardIdFromOptionId(option.id)

  const effect =
    typeof reward.effect === 'string' && reward.effect.trim()
      ? reward.effect
      : (option.description ?? '')

  return {
    id: null,
    rewardId,
    slotKey,
    label: option.label,
    text: option.description ?? option.label,
    power: effect,
    collection: 'starting-character-reward',
    rewardType,
    rarity: (option.rarity ?? 'COMMON') as Rarity,
    icon:
      option.icon ?? fallbackRewardIcon({ rewardType, rarity: option.rarity }),
    imagePath: option.imagePath ?? null,
    artImageId:
      typeof reward.artImageId === 'number' ? reward.artImageId : null,
    artPrompt: typeof reward.artPrompt === 'string' ? reward.artPrompt : '',
  }
}

export function createEmptyCharacterSheet(userId = 10): CharacterSheetDraft {
  return {
    id: null,
    name: '',
    honorific: 'adventurer',
    title: '',
    role: '',
    class: '',
    species: '',
    gender: '',
    presentation: '',
    genre: '',
    alignment: '',
    personality: '',
    drive: '',
    backstory: '',
    achievements: '',
    quirks: '',
    luck: 'COMMON',
    might: 'COMMON',
    wits: 'COMMON',
    grace: 'COMMON',
    charm: 'COMMON',
    empathy: 'COMMON',
    artPrompt: '',
    artImageId: null,
    imagePath: null,
    userId,
    designer: null,
    isPublic: true,
    isMature: false,
    isActive: true,
    rewards: [],
  }
}

export function syncCharacterStatTiers(sheet: BuilderSheet): void {
  const stats = Array.isArray(sheet.stats)
    ? (sheet.stats as BuilderStatEntry[])
    : []

  const valueFor = (key: string) =>
    stats.find((entry) => entry.key === key)?.value ?? 0

  sheet.luck = tierFromValue(valueFor('luck'))
  sheet.might = tierFromValue(valueFor('swol'))
  sheet.wits = tierFromValue(valueFor('wits'))
  sheet.grace = tierFromValue(valueFor('flexibility'))
  sheet.charm = tierFromValue(valueFor('rizz'))
  sheet.empathy = tierFromValue(valueFor('empathy'))
}

export function buildCharacterArtPrompt(sheet: BuilderSheet): string {
  const parts: string[] = []

  const add = (value: unknown, prefix?: string) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return

    parts.push(prefix ? `${prefix}: ${text}` : text)
  }

  if (typeof sheet.name === 'string' && sheet.name.trim()) {
    parts.push(`Character portrait of ${sheet.name.trim()}`)
  }

  add(sheet.species)
  add(sheet.class)
  add(sheet.personality, 'personality')

  if (typeof sheet.genre === 'string' && sheet.genre.trim()) {
    parts.push(`${sheet.genre.trim()} aesthetic`)
  }

  add(sheet.alignment)

  const rewards = sheet.rewards

  if (rewards && typeof rewards === 'object' && !Array.isArray(rewards)) {
    const rewardText = Object.entries(
      rewards as Record<string, BuilderRewardOption>,
    )
      .map(([slotKey, reward]) => {
        const rarity = reward.rarity?.toLowerCase() ?? 'special'
        const label = reward.label || 'Unnamed Reward'
        const type = rewardTypeLabel(slotKey, reward)

        return `${rarity} ${type}: ${label}`
      })
      .join(', ')

    if (rewardText) {
      parts.push(`starting rewards: ${rewardText}`)
    }
  }

  if (typeof sheet.backstory === 'string' && sheet.backstory.trim()) {
    parts.push(`context: ${sheet.backstory.trim().slice(0, 120)}`)
  }

  parts.push(
    'expressive presence, strong silhouette, detailed design, vivid narrative quality',
  )

  return parts.filter(Boolean).join(', ')
}

export function fallbackRewardIcon(input: {
  rewardType?: RewardType | string | null
  rarity?: Rarity | string | null
  icon?: string | null
}): string {
  if (input.icon) return input.icon

  if (input.rewardType === 'SKILL') return 'kind-icon:sparkles'
  if (input.rewardType === 'ITEM') return 'kind-icon:treasure'
  if (input.rewardType === 'POWER') return 'kind-icon:bolt'
  if (input.rewardType === 'PET') return 'kind-icon:heart'
  if (input.rewardType === 'MAGIC') return 'kind-icon:wand'
  if (input.rewardType === 'FAVOR') return 'kind-icon:star'

  return 'kind-icon:gift'
}

export const ADVENTURE_CORE_CARD_KEYS = CHARACTER_CORE_CARD_KEYS
export const ADVENTURE_REQUIRED_CARD_KEYS = CHARACTER_REQUIRED_CARD_KEYS
export const syncAdventureStatTiers = syncCharacterStatTiers
export const buildAdventureArtPrompt = buildCharacterArtPrompt
