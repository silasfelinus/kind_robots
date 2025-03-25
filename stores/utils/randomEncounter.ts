// stores/utils/randomEncounter.ts

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
  const genre: Encounter['genre'] = 'dungeon' // expandable
  const count = memory[genre] || 0

  const locations = [
    'a mossy crypt',
    'a glowing portal room',
    'a dusty treasure vault',
    'the trap-riddled chamber',
  ]

  const monsters = [
    'a kobold champion',
    'a sarcastic lich',
    'a mimic pretending to be a boss fight',
    'your own shadow, somehow!',
  ]

  const treasures = [
    'a spellbook that insults you when opened',
    'a mirror that shows alternate realities',
    'an orb with a heartbeat',
    'the Legendary Debug Stick™',
  ]

  let message = ''

  if (count < 3) {
    message = `🧭 You stumble into ${randomItem(locations)}, fight ${randomItem(monsters)}, and loot ${randomItem(treasures)}.`
  } else {
    message = `💡 You've been here before... ${randomItem(monsters)} returns with backup. But this time, the ${randomItem(treasures)} responds to your touch.`
  }

  memory[genre] = count + 1
  saveMemory(memory)

  return {
    genre,
    message,
    xp: 15 + count * 5,
    memoryKey: genre,
  }
}

function randomItem(list: string[]) {
  return list[Math.floor(Math.random() * list.length)]
}
