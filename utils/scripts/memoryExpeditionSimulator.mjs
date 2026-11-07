// Pure, versioned expedition simulation. No browser, Pinia, or Classic Match state.
export const EXPEDITION_VERSION = 1
const FLOOR_COUNT = 3
const ROOM_KINDS = [
  'story',
  'treasure',
  'puzzle',
  'monster',
  'stranger',
  'rest',
]

function seedValue(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('Expedition seed must be an unsigned 32-bit integer')
  }
  return seed >>> 0
}

function nextRandom(state) {
  const next = (Math.imul(state, 1664525) + 1013904223) >>> 0
  return [next, next / 0x100000000]
}

export function createExpedition(seed) {
  let rng = seedValue(seed)
  const floors = Array.from({ length: FLOOR_COUNT }, (_, floorIndex) => {
    const remaining = [...ROOM_KINDS]
    const rooms = []
    while (remaining.length) {
      let roll
      ;[rng, roll] = nextRandom(rng)
      const [kind] = remaining.splice(Math.floor(roll * remaining.length), 1)
      rooms.push({
        id: `f${floorIndex + 1}-r${rooms.length + 1}`,
        kind,
        status: 'unvisited',
        outcome: null,
      })
    }
    return { id: `floor-${floorIndex + 1}`, rooms }
  })
  return { version: EXPEDITION_VERSION, seed, floors, events: [] }
}

export function resolveExpeditionRoom(expedition, roomId, outcome) {
  if (
    expedition?.version !== EXPEDITION_VERSION ||
    !Array.isArray(expedition.floors)
  ) {
    throw new TypeError('Unsupported expedition save')
  }
  if (
    typeof outcome !== 'string' ||
    !/^[a-z][a-z0-9-]{0,39}$/.test(outcome) ||
    outcome === '__proto__'
  ) {
    throw new TypeError('Invalid room outcome')
  }
  const matches = expedition.floors
    .flatMap((floor) => floor.rooms)
    .filter((room) => room.id === roomId)
  if (matches.length !== 1) throw new RangeError('Unknown or ambiguous room')
  const room = matches[0]
  if (room.status === 'resolved') return expedition
  if (room.status !== 'unvisited') throw new TypeError('Invalid room state')
  const floors = expedition.floors.map((floor) => ({
    ...floor,
    rooms: floor.rooms.map((candidate) =>
      candidate.id === roomId
        ? { ...candidate, status: 'resolved', outcome }
        : candidate,
    ),
  }))
  return {
    ...expedition,
    floors,
    events: [...expedition.events, { type: 'room-resolved', roomId, outcome }],
  }
}
