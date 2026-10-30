import { HOUSE_ROOMS, type HouseRoomId } from './house'
import { HOUSE_ATLAS_ROOM_IDS, HOUSE_ATLAS_SIZE } from './houseAtlas'

export interface HouseAtlasFallbackCell {
  id: HouseRoomId
  index: number
  x: number
  y: number
  kind: string
  doors: Readonly<Record<'north' | 'east' | 'south' | 'west', boolean>>
  walls: readonly string[]
}

const ROOM_SIZE = 100
const DOOR_START = 37
const DOOR_END = 63

function passage(from: HouseRoomId, to: HouseRoomId | undefined): boolean {
  if (!to) return false
  return (
    HOUSE_ROOMS[from]?.exits.includes(to) === true ||
    HOUSE_ROOMS[to]?.exits.includes(from) === true
  )
}

function wall(
  x: number,
  y: number,
  direction: 'north' | 'east' | 'south' | 'west',
  hasDoor: boolean,
): string {
  const horizontal = direction === 'north' || direction === 'south'
  const startX = x + (direction === 'east' ? ROOM_SIZE : 0)
  const startY = y + (direction === 'south' ? ROOM_SIZE : 0)
  if (horizontal)
    return hasDoor
      ? `M ${startX} ${startY} h ${DOOR_START} M ${startX + DOOR_END} ${startY} h ${ROOM_SIZE - DOOR_END}`
      : `M ${startX} ${startY} h ${ROOM_SIZE}`
  return hasDoor
    ? `M ${startX} ${startY} v ${DOOR_START} M ${startX} ${startY + DOOR_END} v ${ROOM_SIZE - DOOR_END}`
    : `M ${startX} ${startY} v ${ROOM_SIZE}`
}

/**
 * A readable architectural fallback while the two Krea2 atlases render or
 * their media URLs are unavailable. Draw only actual adjacent authored exits.
 * Magical/nonlocal passages remain in the interactive passage controls rather
 * than appearing as physically impossible doors on the floorplan.
 */
export const HOUSE_ATLAS_FALLBACK_CELLS: readonly HouseAtlasFallbackCell[] =
  HOUSE_ATLAS_ROOM_IDS.map((id, index) => {
    const row = Math.floor(index / HOUSE_ATLAS_SIZE)
    const column = index % HOUSE_ATLAS_SIZE
    const x = column * ROOM_SIZE
    const y = row * ROOM_SIZE
    const doors = {
      north:
        row > 0 && passage(id, HOUSE_ATLAS_ROOM_IDS[index - HOUSE_ATLAS_SIZE]),
      east:
        column < HOUSE_ATLAS_SIZE - 1 &&
        passage(id, HOUSE_ATLAS_ROOM_IDS[index + 1]),
      south:
        row < HOUSE_ATLAS_SIZE - 1 &&
        passage(id, HOUSE_ATLAS_ROOM_IDS[index + HOUSE_ATLAS_SIZE]),
      west: column > 0 && passage(id, HOUSE_ATLAS_ROOM_IDS[index - 1]),
    }
    return {
      id,
      index,
      x,
      y,
      kind: HOUSE_ROOMS[id]!.kind,
      doors,
      walls: (['north', 'east', 'south', 'west'] as const).map((direction) =>
        wall(x, y, direction, doors[direction]),
      ),
    }
  })
