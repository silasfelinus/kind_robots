// stores/utils/randomEncounter.ts


import { dungeonEncounter } from './dungeonEncounter'
import { spaceEncounter } from './spaceEncounter'
import { noirEncounter } from './noirEncounter'

type Genre = 'dungeon' | 'space' | 'noir'

export function randomChoice<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

type Encounter = {
  genre: Genre
  message: string
  xp: number
  memoryKey: Genre
}

const encounterMemoryKey = 'encounterMemory'

function loadMemory(): Record<Genre, number> {
  if (typeof localStorage === 'undefined') return { dungeon: 0, space: 0, noir: 0 }
  return JSON.parse(localStorage.getItem(encounterMemoryKey) || '{}')
}

function saveMemory(memory: Record<Genre, number>) {
  localStorage.setItem(encounterMemoryKey, JSON.stringify(memory))
}

export function randomEncounter(): Encounter {
  const memory = loadMemory()
  const genres: Genre[] = ['dungeon', 'space', 'noir']
  const genre = randomChoice(genres)
  const count = memory[genre] || 0
  const xp = 15 + count * 5

  let message = ''

  switch (genre) {
    case 'dungeon':
      message = dungeonEncounter(count)
      break
    case 'space':
      message = spaceEncounter(count)
      break
    case 'noir':
      message = noirEncounter(count)
      break
    default:
      message = 'You wander into the void... nothing responds.'
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
