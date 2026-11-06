// utils/rulerHooked/console.ts
//
// Presentation data for the kingdom-decay console (ruler-hooked/t-054): the
// meter labels, the five-tab deck, the region names the map uses, and the
// reign-health tier the illuminated chrome takes. Pure and framework-free.

import { AXIS_KEYS } from '~/types/ruler-hooked'
import type { AxisKey, KingdomHealth, RegionKey } from '~/types/ruler-hooked'

/** Player-facing names. Joy reads as "Hearts", as in the 2026-11-05 mockups. */
export const AXIS_LABEL: Record<AxisKey, string> = {
  joy: 'Hearts',
  nature: 'Nature',
  prosperity: 'Prosperity',
  order: 'Order',
  treasury: 'Treasury',
}

/** The four left-hand meters; treasury is the coin capsule in the HUD. */
export const METER_AXES: readonly AxisKey[] = [
  'joy',
  'nature',
  'prosperity',
  'order',
]

export const AXIS_ICON: Record<AxisKey | 'coins', string> = {
  joy: 'kind-icon:heart',
  nature: 'kind-icon:tree',
  prosperity: 'kind-icon:money',
  order: 'kind-icon:crown',
  treasury: 'kind-icon:coin',
  coins: 'kind-icon:coin',
}

export type ConsoleTab = 'lake' | 'map' | 'court' | 'gear' | 'fishopedia'

export const CONSOLE_TABS: readonly {
  id: ConsoleTab
  label: string
  icon: string
}[] = [
  { id: 'lake', label: 'Lake', icon: 'kind-icon:fish' },
  { id: 'map', label: 'Map', icon: 'kind-icon:map' },
  { id: 'court', label: 'Court', icon: 'kind-icon:crown' },
  { id: 'gear', label: 'Gear', icon: 'kind-icon:bag' },
  { id: 'fishopedia', label: 'Fishopedia', icon: 'kind-icon:book-open' },
]

/** The tab `step` places away from `current`, wrapping at both ends. */
export function stepTab(current: ConsoleTab, step: number): ConsoleTab {
  const ids = CONSOLE_TABS.map((t) => t.id)
  const at = Math.max(0, ids.indexOf(current))
  const n = ids.length
  return ids[(((at + step) % n) + n) % n] ?? 'lake'
}

export type ReignTier = 'pristine' | 'strained' | 'rotten'

/** Mean of every kingdom axis, 0..100. */
export function reignMean(health: KingdomHealth): number {
  const total = AXIS_KEYS.reduce((sum, key) => sum + (health[key] ?? 0), 0)
  return total / AXIS_KEYS.length
}

/**
 * The chronicle's condition. A new reign (every axis 50) opens pristine; a
 * reign that sinks below 50 on average strains the book, and below 30 it rots.
 */
export function reignTier(health: KingdomHealth): ReignTier {
  const mean = reignMean(health)
  if (mean >= 50) return 'pristine'
  if (mean >= 30) return 'strained'
  return 'rotten'
}

export const REGION_NAME: Partial<Record<RegionKey, string>> = {
  sky: 'The Sky',
  far_shore: 'The Far Shore',
  treeline: 'The Wildwood',
  village_edge: 'The Village',
  castle_grounds: 'Castle Grounds',
  lake: 'Castle Lake',
  near_bank: 'The Near Bank',
}

/** Where each region's name sits on the painted map, in % of the frame. */
export const REGION_PIN: Partial<Record<RegionKey, { x: number; y: number }>> =
  {
    sky: { x: 50, y: 9 },
    far_shore: { x: 22, y: 31 },
    treeline: { x: 76, y: 27 },
    village_edge: { x: 18, y: 47 },
    castle_grounds: { x: 74, y: 45 },
    lake: { x: 50, y: 64 },
    near_bank: { x: 34, y: 87 },
  }
