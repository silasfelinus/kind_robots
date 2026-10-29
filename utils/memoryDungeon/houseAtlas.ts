import type { HouseRoomId } from './house'

export const HOUSE_ATLAS_SIZE = 6
export const HOUSE_ATLAS_ROOM_IDS: readonly HouseRoomId[] = Array.from(
  { length: HOUSE_ATLAS_SIZE * HOUSE_ATLAS_SIZE },
  (_, index) => `HD-${String(index + 1).padStart(2, '0')}` as HouseRoomId,
)

export const HOUSE_ATLAS_PATHS = {
  original: '/images/memory-dungeon/house/maps/house-atlas.webp',
  mirrored: '/images/memory-dungeon/dark-briar/house/maps/house-atlas.webp',
} as const
