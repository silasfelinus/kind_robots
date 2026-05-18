// /stores/helpers/characterHelper.ts
import { useRandomCharacterData } from '~/stores/utils/randomCharacter'
import type { Character } from '~/prisma/generated/prisma/client'

export const rarityOptions = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
] as const

export type Rarity = (typeof rarityOptions)[number]

export const rewardTypeOptions = [
  'SKILL',
  'ITEM',
  'TREASURE',
  'TITLE',
  'POWER',
  'STORY',
] as const

export type RewardType = (typeof rewardTypeOptions)[number]

export type CharacterStatKey =
  | 'luck'
  | 'might'
  | 'wits'
  | 'grace'
  | 'charm'
  | 'empathy'

export type RewardSlotKey =
  | 'common-skill'
  | 'rare-skill'
  | 'common-item'
  | 'rare-item'

export type RandomizerKeys =
  | 'name'
  | 'honorific'
  | 'class'
  | 'genre'
  | 'species'
  | 'personality'
  | 'backstory'
  | 'quirks'
  | CharacterStatKey

export type CharacterRewardDraft = {
  id?: number | null
  slotKey: RewardSlotKey
  label: string
  text: string
  power: string
  collection: string
  rewardType: RewardType
  rarity: Rarity
  icon: string
  imagePath: string
  artImageId?: number | null
  artPrompt: string
}

export type RewardPromptSlot = {
  key: RewardSlotKey
  label: string
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
  characterClass: string
  species: string
  genderIdentity: string
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

export type RandomizerReturnType = {
  [K in RandomizerKeys]: K extends CharacterStatKey ? Rarity : string
}

export const characterStatFields: Array<{
  key: CharacterStatKey
  label: string
}> = [
  {
    key: 'luck',
    label: 'Luck',
  },
  {
    key: 'might',
    label: 'Might',
  },
  {
    key: 'wits',
    label: 'Wits',
  },
  {
    key: 'grace',
    label: 'Grace',
  },
  {
    key: 'charm',
    label: 'Charm',
  },
  {
    key: 'empathy',
    label: 'Empathy',
  },
]

export const randomizerMap: Record<RandomizerKeys, () => string | Rarity> = {
  name: () => useRandomCharacterData().randomName(),
  honorific: () => useRandomCharacterData().randomHonorific(),
  class: () => useRandomCharacterData().randomClass(),
  genre: () => useRandomCharacterData().randomGenre(),
  species: () => useRandomCharacterData().randomSpecies(),
  personality: () => useRandomCharacterData().randomPersonality(),
  backstory: () => useRandomCharacterData().randomBackstory(),
  quirks: () => useRandomCharacterData().randomQuirk(),
  luck: () => randomRarity(),
  might: () => randomRarity(),
  wits: () => randomRarity(),
  grace: () => randomRarity(),
  charm: () => randomRarity(),
  empathy: () => randomRarity(),
}

export function getRandomValue<K extends RandomizerKeys>(
  key: K,
): RandomizerReturnType[K] | null {
  const fn = randomizerMap[key]

  return fn ? (fn() as RandomizerReturnType[K]) : null
}

export function updateFieldWithRandomValue(
  form: Partial<Character> & Partial<Record<CharacterStatKey, Rarity>>,
  key: RandomizerKeys,
) {
  const value = getRandomValue(key)

  if (value !== null) {
    form[key] = value as never
  }
}

export function randomRarity(): Rarity {
  const roll = Math.random()

  if (roll < 0.45) return 'COMMON'
  if (roll < 0.7) return 'UNCOMMON'
  if (roll < 0.87) return 'RARE'
  if (roll < 0.96) return 'EPIC'
  if (roll < 0.995) return 'LEGENDARY'

  return 'MYTHIC'
}

export function rerollStats(): Record<CharacterStatKey, Rarity> {
  return {
    luck: randomRarity(),
    might: randomRarity(),
    wits: randomRarity(),
    grace: randomRarity(),
    charm: randomRarity(),
    empathy: randomRarity(),
  }
}

export function defaultRewardSlots(): RewardPromptSlot[] {
  return [
    {
      key: 'common-skill',
      label: 'Common Skill',
      rewardType: 'SKILL',
      rarity: 'COMMON',
      icon: 'kind-icon:bolt',
    },
    {
      key: 'rare-skill',
      label: 'Rare Skill',
      rewardType: 'SKILL',
      rarity: 'RARE',
      icon: 'kind-icon:comet',
    },
    {
      key: 'common-item',
      label: 'Common Item',
      rewardType: 'ITEM',
      rarity: 'COMMON',
      icon: 'kind-icon:backpack',
    },
    {
      key: 'rare-item',
      label: 'Rare Item',
      rewardType: 'ITEM',
      rarity: 'RARE',
      icon: 'kind-icon:gem',
    },
  ]
}

export function createEmptyRewardDraft(
  slot: RewardPromptSlot,
): CharacterRewardDraft {
  return {
    id: null,
    slotKey: slot.key,
    label: '',
    text: '',
    power: '',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarity: slot.rarity,
    icon: slot.icon,
    imagePath: '',
    artImageId: null,
    artPrompt: '',
  }
}

export function createEmptyCharacterSheet(userId = 10): CharacterSheetDraft {
  return {
    id: null,
    name: '',
    honorific: 'adventurer',
    title: '',
    role: '',
    characterClass: '',
    species: '',
    genderIdentity: '',
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

export function fallbackRewardIcon(draft: CharacterRewardDraft): string {
  if (draft.icon) return draft.icon
  if (draft.rewardType === 'SKILL') return 'kind-icon:bolt'
  if (draft.rewardType === 'ITEM') return 'kind-icon:gem'
  return 'kind-icon:gift'
}
