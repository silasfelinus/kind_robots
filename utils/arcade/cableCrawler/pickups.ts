// /utils/arcade/cableCrawler/pickups.ts
//
// Pickups that drop out of surged glitches (conductor kr-arcade/t-065, CABINETS.md section 8,
// "Power and meta"). Each lies where its glitch was rebooted for a while; the plug picks it up by
// crawling over it.
//
//   capacitor    battery +20 seconds
//   heat sink    five seconds of slow crawl, for a tight turn
//   insulation   one free pass through your own cable
//   coil         winds eight cells off the tail end
//   magnet       for ten seconds, sparks next to the plug jump to it

export type PickupKind =
  'capacitor' | 'heatsink' | 'insulation' | 'coil' | 'magnet'

export const PICKUP_KINDS: readonly PickupKind[] = [
  'capacitor',
  'heatsink',
  'insulation',
  'coil',
  'magnet',
]

export const PICKUP_NAMES: Record<PickupKind, string> = {
  capacitor: 'CAPACITOR +20S',
  heatsink: 'HEAT SINK: SLOW',
  insulation: 'INSULATION',
  coil: 'COIL: -8 CABLE',
  magnet: 'MAGNET',
}

export type Pickup = { k: number; kind: PickupKind; life: number }

/** The chance a rebooted glitch drops a pickup, and how long one lies about. */
export const PICKUP_CHANCE = 0.35
export const PICKUP_LIFE = 60 * 12
export const CAPACITOR_TICKS = 60 * 20
export const HEATSINK_TICKS = 60 * 5
/** How much slower the plug crawls under a heat sink. */
export const HEATSINK_SLOW = 1.7
export const COIL_CELLS = 8
export const MAGNET_TICKS = 60 * 10
export const INSULATION_MAX = 3

/** A pickup kind from a roll in [0, 1). */
export function pickupFor(roll: number): PickupKind {
  return PICKUP_KINDS[
    Math.min(PICKUP_KINDS.length - 1, Math.floor(roll * PICKUP_KINDS.length))
  ]!
}
