// /stores/helpers/randomHelper.ts
import type { Dream } from '~/prisma/generated/prisma/client'
import type { ArtListEntry } from '@/stores/seeds/artList'

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

export type RandomListItem = {
  id: number
  title: string
  dreamType: 'RANDOMLIST'
  isPublic: boolean
  isMature: boolean
  userId: number | null
  designer: string | null
  examplesJson: string
  content: string[]
  source: 'preset' | 'user'
}

type RandomPool = {
  key: string
  title: string
  values: readonly string[]
}
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


function parseJsonStringArray(value: string): string[] {
  try {
    return safeStringArray(JSON.parse(value || '[]'))
  } catch {
    return []
  }
}

function safeTitle(dream: Dream): string {
  const title = (dream.title ?? '').trim()
  if (title) return title

  const fallback = (dream.pitch ?? dream.description ?? '').trim()
  if (fallback) return fallback.slice(0, 80)

  return `Random List #${dream.id}`
}

export function artListToRandomListItem(entry: ArtListEntry): RandomListItem {
  const key = (entry as { id?: string }).id ?? entry.title

  return {
    id: stableNegativeId(`preset:${key}`),
    title: entry.title,
    dreamType: 'RANDOMLIST',
    userId: null,
    isPublic: true,
    isMature: false,
    designer: 'system',
    examplesJson: JSON.stringify(entry.content),
    content: [...entry.content],
    source: 'preset',
  }
}

export function getAllPresetLists(entries: ArtListEntry[]): RandomListItem[] {
  return entries.map(artListToRandomListItem)
}

export function dreamToRandomListItem(dream: Dream): RandomListItem {
  const examplesJson =
    typeof dream.examples === 'string'
      ? dream.examples
      : typeof dream.pitch === 'string'
        ? dream.pitch
        : '[]'

  return {
    id: dream.id,
    title: safeTitle(dream),
    dreamType: 'RANDOMLIST',
    userId: dream.userId ?? null,
    isPublic: dream.isPublic ?? false,
    isMature: dream.isMature ?? false,
    designer: dream.designer ?? null,
    examplesJson,
    content: parseJsonStringArray(examplesJson),
    source: 'user',
  }
}

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
