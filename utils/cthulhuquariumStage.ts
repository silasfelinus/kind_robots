// /utils/cthulhuquariumStage.ts
//
// The small constants both tank renderers share: the owner's canvas
// (components/cthulhuquarium/cthulhuquarium-game.vue) and the read-only
// visitor's window (components/cthulhuquarium/cthulhuquarium-tank-view.vue).
// One copy here so a visitor never sees a different room, a different decor
// glyph or a different fallback colour from the one the owner arranged.

import { artByName, backgroundArt } from './cthulhuquariumArt'

export interface StageCrop {
  x: number
  y: number
  w: number
  h: number
}

// The legacy parlour plate (t-065) is a painting of a tank on a wall, not the
// inside of one: until the canon's interior renders arrive, draw only its
// water, cropped to the stage's 16:9.
export const LEGACY_PARLOUR_CROP: StageCrop = {
  x: 0.163,
  y: 0.14,
  w: 0.674,
  h: 0.66,
}

/** The tank background to draw for `key`, and the crop it needs (if any). */
export function tankBackground(key: string | null | undefined): {
  url: string | null
  crop: StageCrop | null
} {
  const url = backgroundArt(key) ?? backgroundArt('parlour')
  const crop =
    url && url === artByName('bg-parlour') ? LEGACY_PARLOUR_CROP : null
  return { url, crop }
}

// cthulhuquarium/t-017: decor icons drawn as simple glyphs. Must stay in sync
// with server/utils/aquariumEconomy.ts's DECOR_CATALOG icons by hand, same
// convention as everywhere else the client mirrors a server-owned constant.
export const DECOR_ICONS: Record<string, string> = {
  pebble_bed: '🪨',
  driftwood: '🪵',
  coral_spire: '🪸',
  sunken_chest: '🧰',
  glow_kelp: '🌿',
  ceramic_ruin: '🏺',
}

export function decorIcon(kind: string): string {
  return DECOR_ICONS[kind] ?? '❖'
}

/** Deterministic hue for a species with no Monster.hue yet. */
export function fallbackHue(slug: string): number {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0
  }
  return hash % 360
}

/** One occupant as the read-only tank view draws it. */
export interface TankViewOccupant {
  id: number
  slug: string
  behavior?: string | null
  size?: number | null
  hunger?: number | null
  hue?: number | null
}

/** One placed decor object; x/y are 0-100 percent of the stage. */
export interface TankViewDecor {
  id: number
  kind: string
  x: number
  y: number
}
