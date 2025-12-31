// /stores/helpers/randomHelper.ts
import type { Pitch } from '~/server/generated/prisma'
import type { ArtListEntry } from '@/stores/seeds/artList'

// 🎯 Raw single-value pools
import { adjectiveList } from '@/stores/utils/randomAdjective'
import { animalList } from '@/stores/utils/randomAnimal'
import { backstoryList } from '@/stores/utils/randomBackstory'
import { classList } from '@/stores/utils/randomClass'
import { colorList } from '@/stores/utils/randomColor'
import { genreList } from '@/stores/utils/randomGenre'
import { honorificList } from '@/stores/utils/randomHonorific'
import { inventoryList } from '@/stores/utils/randomInventory'
import { itemList } from '@/stores/utils/randomItem'
import { materialList } from '@/stores/utils/randomMaterial'
import { nameList } from '@/stores/utils/randomName'
import { nounList } from '@/stores/utils/randomNoun'
import { personalityList } from '@/stores/utils/randomPersonality'
import { quirkList } from '@/stores/utils/randomQuirks'
import { skillList } from '@/stores/utils/randomSkills'
import { speciesList } from '@/stores/utils/randomSpecies'
import { verbList } from '@/stores/utils/randomVerb'
import { useRandomEncounter } from '@/stores/utils/randomEncounter'

/* ---------------------------------------------
 * Types
 * -------------------------------------------*/

export type RandomListItem = {
  id: number
  title: string
  PitchType: 'RANDOMLIST'
  isPublic: boolean
  isMature: boolean
  userId: number | null
  designer: string | null
  examplesJson: string
  source: 'preset' | 'user'
}

type RandomPool = {
  key: string
  title: string
  values: string[]
}

/* ---------------------------------------------
 * Utilities
 * -------------------------------------------*/

function stableNegativeId(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  const positive = Math.abs(hash) || 1
  return -positive
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  )
}

/* ---------------------------------------------
 * Preset list conversion
 * -------------------------------------------*/

export function artListToRandomListItem(entry: ArtListEntry): RandomListItem {
  const key = (entry as { id?: string }).id ?? entry.title

  return {
    id: stableNegativeId(`preset:${key}`),
    title: entry.title,
    PitchType: 'RANDOMLIST',
    userId: null,
    isPublic: true,
    isMature: false,
    designer: 'system',
    examplesJson: JSON.stringify(entry.content),
    source: 'preset',
  }
}

export function getAllPresetLists(entries: ArtListEntry[]): RandomListItem[] {
  return entries.map(artListToRandomListItem)
}

/* ---------------------------------------------
 * User list conversion
 * -------------------------------------------*/

export function pitchToRandomListItem(p: Pitch): RandomListItem {
  return {
    id: p.id,
    title: p.title,
    PitchType: 'RANDOMLIST',
    userId: p.userId ?? null,
    isPublic: p.isPublic,
    isMature: p.isMature,
    designer: null,
    examplesJson: typeof p.pitch === 'string' ? p.pitch : '[]',
    source: 'user',
  }
}

/* ---------------------------------------------
 * Single-value random pools
 * -------------------------------------------*/

export const basicSinglePools: RandomPool[] = [
  { key: 'adjective', title: 'Adjective', values: adjectiveList },
  { key: 'animal', title: 'Animal', values: animalList },
  { key: 'backstory', title: 'Backstory', values: backstoryList },
  { key: 'class', title: 'Class', values: classList },
  { key: 'color', title: 'Color', values: colorList },
  { key: 'genre', title: 'Genre', values: genreList },
  { key: 'honorific', title: 'Honorific', values: honorificList },
  { key: 'inventory', title: 'Inventory', values: inventoryList },
  { key: 'item', title: 'Item', values: itemList },
  { key: 'material', title: 'Material', values: materialList },
  { key: 'name', title: 'Name', values: nameList },
  { key: 'noun', title: 'Noun', values: nounList },
  { key: 'personality', title: 'Personality', values: personalityList },
  { key: 'quirk', title: 'Quirk', values: quirkList },
  { key: 'skill', title: 'Skill', values: skillList },
  { key: 'species', title: 'Species', values: speciesList },
  { key: 'verb', title: 'Verb', values: verbList },
  {
    key: 'encounter',
    title: 'Encounter',
    values: [useRandomEncounter().message],
  },
]

/* ---------------------------------------------
 * Random selection helpers
 * -------------------------------------------*/

export function getRandom(key: string, count = 1): string[] {
  const pool = basicSinglePools.find(
    (p) => p.key.toLowerCase() === key.toLowerCase(),
  )
  if (!pool) return []

  const values = safeStringArray(pool.values)
  const shuffled = [...values].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, values.length))
}

export const supportedKeys: string[] = basicSinglePools.map((p) => p.key)
