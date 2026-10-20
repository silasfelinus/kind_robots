// The fortress rooms as the painted drafts frame them (conductor
// projects/emperor-of-dust/art/concepts/painted-screens.webp): each room is a
// painted scene with a gilt title plate and one line of italic copy. Icons are
// the single-colour kind-icons, so they take the gilt `text-warning`.

import type { LocalFactionId } from './types'

export type RoomId =
  'briefing' | 'throne' | 'quests' | 'barracks' | 'market' | 'map' | 'chronicle'

export type RoomDef = {
  id: RoomId
  label: string
  title: string
  tagline: string
  icon: string
}

export const ROOMS: readonly RoomDef[] = [
  {
    id: 'briefing',
    label: 'Briefing',
    title: 'Morning Briefing',
    tagline: 'Dispatches from the roads, read before the doors open.',
    icon: 'kind-icon:book-open',
  },
  {
    id: 'throne',
    label: 'Throne room',
    title: 'Throne Room',
    tagline:
      'Hear the people. Weigh their words. A kingdom is built on what you choose to ignore.',
    icon: 'kind-icon:crown',
  },
  {
    id: 'quests',
    label: 'Quest room',
    title: 'Quest Room',
    tagline: 'Send the right people. Every journey changes them.',
    icon: 'kind-icon:scroll',
  },
  {
    id: 'barracks',
    label: 'Barracks',
    title: 'Barracks',
    tagline: 'People are your greatest resource.',
    icon: 'kind-icon:person',
  },
  {
    id: 'market',
    label: 'Market',
    title: 'Market',
    tagline: 'Stock changes as the roads change.',
    icon: 'kind-icon:coin',
  },
  {
    id: 'map',
    label: 'Map room',
    title: 'Map Room',
    tagline: 'A fractured land. Many hands. All watching.',
    icon: 'kind-icon:star',
  },
  {
    id: 'chronicle',
    label: 'Chronicle',
    title: 'Chronicle',
    tagline: 'Rewind a day, change a choice.',
    icon: 'kind-icon:time',
  },
]

export const roomDef = (id: RoomId): RoomDef =>
  ROOMS.find((room) => room.id === id) ?? ROOMS[0]!

// Rooms whose painted backdrop is at public/emperor-of-dust/rooms/<room>.webp
// (ledger: conductor projects/emperor-of-dust/art/ROOMS-ROUND-1.yaml). A room
// not listed here shows its candlelit gradient until its art is exported.
export const ROOM_ART: readonly RoomId[] = [
  'throne',
  'quests',
  'barracks',
  'market',
  'map',
  'chronicle',
]

export const roomArtUrl = (id: RoomId): string | undefined =>
  ROOM_ART.includes(id) ? `/emperor-of-dust/rooms/${id}.webp` : undefined

export const LOCAL_FACTION_ICONS: Record<LocalFactionId, string> = {
  ledger: 'kind-icon:coin',
  'old-houses': 'kind-icon:castle',
  yard: 'kind-icon:fire',
  lamplight: 'kind-icon:bookshelf',
  'gate-watch': 'kind-icon:eye',
}
