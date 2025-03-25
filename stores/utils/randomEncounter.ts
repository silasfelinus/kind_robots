// stores/utils/randomEncounter.ts

import { randomItem } from './randomItem'
import { dungeonEncounter } from './dungeonEncounter'
import { spaceEncounter } from './spaceEncounter'
import { noirEncounter } from './noirEncounter'

type Encounter = {
  genre: 'dungeon' | 'space' | 'noir'
  message: string
  xp: number
  memoryKey: string
}

const encounterMemoryKey = 'encounterMemory'

function loadMemory(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {}
  return JSON.parse(localStorage.getItem(encounterMemoryKey) || '{}')
}

function saveMemory(memory: Record<string, number>) {
  localStorage.setItem(encounterMemoryKey, JSON.stringify(memory))
}

export function randomEncounter(): Encounter {
  const memory = loadMemory()
  const genres: Encounter['genre'][] = ['dungeon', 'space', 'noir']
  const genre = randomItem(genres)
  const count = memory[genre] || 0

  let message = ''
  const xp = 15 + count * 5

  if (genre === 'dungeon') {
    message = dungeonEncounter(count)
  } else if (genre === 'space') {
    message = spaceEncounter(count)
  } else if (genre === 'noir') {
    message = noirEncounter(count)
  }

  memory[genre] = count + 1
  saveMemory(memory)

  return {
    genre,
    message,
    xp,
    memoryKey: genre,
  }
}
