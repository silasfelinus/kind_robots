// /stores/helpers/randomHelper.ts
import type { Pitch } from '@prisma/client'
import type { ArtListEntry } from '@/stores/seeds/artList'

// 🎯 Raw array lists (all refactored from useRandomX())
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
import { useRandomEncounter } from '@/stores/utils/randomEncounter' // still a function

// 🛠 Converts an ArtListEntry into a Pitch-like object
export function artListToPitch(entry: ArtListEntry): Pitch {
  return {
    id: -1,
    title: entry.title,
    pitch: '',
    PitchType: 'RANDOMLIST',
    userId: 0,
    isPublic: true,
    isMature: false,
    examples: JSON.stringify(entry.content),
    createdAt: new Date(0),
    updatedAt: new Date(0),
    designer: 'system',
    flavorText: null,
    highlightImage: null,
    imagePrompt: null,
    description: null,
    artImageId: null,
  }
}

// 🔁 Used for converting arrays into Pitch objects directly
function arrayToPitch(id: string, title: string, content: string[]): Pitch {
  return {
    id: -1,
    title,
    pitch: '',
    PitchType: 'RANDOMLIST',
    userId: 0,
    isPublic: true,
    isMature: false,
    examples: JSON.stringify(content),
    createdAt: new Date(0),
    updatedAt: new Date(0),
    designer: 'system',
    flavorText: null,
    highlightImage: null,
    imagePrompt: null,
    description: null,
    artImageId: null,
  }
}

// 🧠 Combine all known single-value sources into mock Pitch[] (local only)
export const basicSinglePitches: Pitch[] = [
  arrayToPitch('adjective', 'Adjective', adjectiveList),
  arrayToPitch('animal', 'Animal', animalList),
  arrayToPitch('backstory', 'Backstory', backstoryList),
  arrayToPitch('class', 'Class', classList),
  arrayToPitch('color', 'Color', colorList),
  arrayToPitch('genre', 'Genre', genreList),
  arrayToPitch('honorific', 'Honorific', honorificList),
  arrayToPitch('inventory', 'Inventory', inventoryList),
  arrayToPitch('item', 'Item', itemList),
  arrayToPitch('material', 'Material', materialList),
  arrayToPitch('name', 'Name', nameList),
  arrayToPitch('noun', 'Noun', nounList),
  arrayToPitch('personality', 'Personality', personalityList),
  arrayToPitch('quirk', 'Quirk', quirkList),
  arrayToPitch('skill', 'Skill', skillList),
  arrayToPitch('species', 'Species', speciesList),
  arrayToPitch('verb', 'Verb', verbList),
  arrayToPitch('encounter', 'Encounter', [useRandomEncounter().message]),
]

// 🔀 Random string picker from any known key
export function getRandom(key: string, count = 1): string[] {
  const pitch = basicSinglePitches.find(
    (p) => p.title?.toLowerCase() === key.toLowerCase(),
  )
  if (!pitch) return []
  const list = pitch.examples ? JSON.parse(pitch.examples) : []
  const shuffled = [...list].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, list.length))
}

// 🧱 Map from ArtListEntry[] to mock Pitches
export function getAllPresetPitches(entries: ArtListEntry[]): Pitch[] {
  return entries.map(artListToPitch)
}

export const supportedKeys: string[] = basicSinglePitches
  .map((p) => p.title?.toLowerCase())
  .filter(Boolean) as string[]
