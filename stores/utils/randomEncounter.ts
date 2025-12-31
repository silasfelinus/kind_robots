// stores/utils/randomEncounter.ts


import { useDungeonEncounter } from './dungeonEncounter'
import { useSpaceEncounter } from './spaceEncounter'
import { useNoirEncounter } from './noirEncounter'

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
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(encounterMemoryKey, JSON.stringify(memory))
}


export function useRandomEncounter(): Encounter {
  const memory = loadMemory()
  const genres: Genre[] = ['dungeon', 'space', 'noir']
  const genre = randomChoice(genres)
  const count = memory[genre] || 0
  const xp = 15 + count * 5

  let message = ''

  switch (genre) {
    case 'dungeon':
      message = useDungeonEncounter(count)
      break
    case 'space':
      message = useSpaceEncounter(count)
      break
    case 'noir':
      message = useNoirEncounter(count)
      break
    default:
      message = 'You wander into the void... nothing responds.'
  }

  // Avoid localStorage and mutation during SSR
  if (typeof window !== 'undefined') {
    memory[genre] = count + 1
    saveMemory(memory)
  }

  return {
    genre,
    message,
    xp,
    memoryKey: genre,
  }
}

