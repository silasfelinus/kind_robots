// /stores/helpers/characterHelper.ts
import { useRandomCharacterData } from '~/stores/utils/randomCharacter'
import type { Character } from '~/server/generated/prisma'

export type RandomizerKeys =
  | 'name'
  | 'honorific'
  | 'class'
  | 'genre'
  | 'species'
  | 'personality'
  | 'backstory'
  | 'inventory'
  | 'quirks'
  | 'skills'
  | 'statName1'
  | 'statName2'
  | 'statName3'
  | 'statName4'
  | 'statName5'
  | 'statName6'
  | 'statValue1'
  | 'statValue2'
  | 'statValue3'
  | 'statValue4'
  | 'statValue5'
  | 'statValue6'

export type RandomizerReturnType = {
  [K in RandomizerKeys]: K extends `statValue${string}` ? number : string
}

export const randomizerMap: Record<RandomizerKeys, () => string | number> = {
  name: () => useRandomCharacterData().randomName(),
  honorific: () => useRandomCharacterData().randomHonorific(),
  class: () => useRandomCharacterData().randomClass(),
  genre: () => useRandomCharacterData().randomGenre(),
  species: () => useRandomCharacterData().randomSpecies(),
  personality: () => useRandomCharacterData().randomPersonality(),
  backstory: () => useRandomCharacterData().randomBackstory(),
  inventory: () => useRandomCharacterData().randomInventory(),
  quirks: () => useRandomCharacterData().randomQuirk(),
  skills: () => useRandomCharacterData().randomSkill(),
  statName1: () => 'Luck',
  statName2: () => 'Swol',
  statName3: () => 'Wits',
  statName4: () => 'Flexibility',
  statName5: () => 'Rizz',
  statName6: () => 'Empathy',
  statValue1: () => Math.floor(Math.random() * 100),
  statValue2: () => Math.floor(Math.random() * 100),
  statValue3: () => Math.floor(Math.random() * 100),
  statValue4: () => Math.floor(Math.random() * 100),
  statValue5: () => Math.floor(Math.random() * 100),
  statValue6: () => Math.floor(Math.random() * 100),
}

export function getRandomValue<K extends RandomizerKeys>(
  key: K,
): RandomizerReturnType[K] | null {
  const fn = randomizerMap[key]
  return fn ? (fn() as RandomizerReturnType[K]) : null
}

export function updateFieldWithRandomValue(
  form: Partial<Character>,
  key: RandomizerKeys,
) {
  const value = getRandomValue(key)
  if (value !== null) form[key] = value as any
}

export function rerollStats(): Partial<
  Pick<
    Character,
    | 'statValue1'
    | 'statValue2'
    | 'statValue3'
    | 'statValue4'
    | 'statValue5'
    | 'statValue6'
  >
> {
  const roll = () =>
    Array.from({ length: 10 }, () => Math.floor(Math.random() * 10 + 1)).reduce(
      (a, b) => a + b,
    )

  return {
    statValue1: roll(),
    statValue2: roll(),
    statValue3: roll(),
    statValue4: roll(),
    statValue5: roll(),
    statValue6: roll(),
  }
}
