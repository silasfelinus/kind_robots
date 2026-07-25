// /stores/helpers/randomHelper.ts
//
// This helper intentionally contains only procedural language pools. Reusable
// creative concepts belong to Facets; items, skills, powers, pets, magic, and
// favors belong to Rewards.
import { adjectiveList } from '@/stores/utils/randomAdjective'
import { honorificList } from '@/stores/utils/randomHonorific'
import { nameList } from '@/stores/utils/randomName'
import { nounList } from '@/stores/utils/randomNoun'
import { verbList } from '@/stores/utils/randomVerb'
import { useRandomEncounter } from '@/stores/utils/randomEncounter'

type RandomPool = {
  key: string
  title: string
  values: readonly string[]
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (entry): entry is string =>
      typeof entry === 'string' && entry.trim().length > 0,
  )
}

export const basicSinglePools: RandomPool[] = [
  { key: 'adjective', title: 'Adjective', values: adjectiveList },
  { key: 'honorific', title: 'Honorific', values: honorificList },
  { key: 'name', title: 'Name', values: nameList },
  { key: 'noun', title: 'Noun', values: nounList },
  { key: 'verb', title: 'Verb', values: verbList },
  {
    key: 'encounter',
    title: 'Encounter',
    values: [useRandomEncounter().message],
  },
]

export function getRandom(key: string, count = 1): string[] {
  const pool = basicSinglePools.find(
    (entry) => entry.key.toLowerCase() === key.toLowerCase(),
  )
  if (!pool) return []

  const values = safeStringArray(pool.values)
  return [...values]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(Math.max(1, count), values.length))
}

export const supportedKeys: string[] = basicSinglePools.map((entry) => entry.key)
