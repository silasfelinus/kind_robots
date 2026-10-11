// /utils/arcade/rescueRally/powers.ts
//
// Rescue Rally's power-ups (conductor kr-arcade t-036, depth-pass/CABINETS.md section 1, "Power-ups,
// short and shown in the HUD"). Eight kinds; each lasts a few seconds (the bubble shield until it
// takes a hit, the pause button for one big freeze) and shows its timer in the HUD. They drop from
// broken crates and rebooted heavies, wait on the floor in some wave scripts, and one comes through a
// vent partway through every wave.

import { INK, RAMPS, pixelSprite } from '../snes'
import type { PixelSprite, Ramp } from '../snes'

export type PowerKind =
  | 'spread'
  | 'rapid'
  | 'bounce'
  | 'wide'
  | 'shield'
  | 'sprint'
  | 'magnet'
  | 'pause'

export type PowerSpec = {
  name: string
  /** How long it lasts once grabbed (ticks). */
  ticks: number
  ramp: Ramp
  /** What it does, for the table guide. */
  does: string
}

export const POWERS: Record<PowerKind, PowerSpec> = {
  spread: {
    name: 'SPREAD',
    ticks: 60 * 10,
    ramp: RAMPS.pink,
    does: 'a three-way beam',
  },
  rapid: {
    name: 'RAPID',
    ticks: 60 * 10,
    ramp: RAMPS.gold,
    does: 'double the fire rate',
  },
  bounce: {
    name: 'BOUNCE',
    ticks: 60 * 12,
    ramp: RAMPS.sky,
    does: 'beams ricochet off the walls once',
  },
  wide: {
    name: 'WIDE',
    ticks: 60 * 8,
    ramp: RAMPS.purple,
    does: 'a fat beam that goes straight through',
  },
  shield: {
    name: 'SHIELD',
    ticks: 60 * 20,
    ramp: RAMPS.teal,
    does: 'a bubble that takes one hit',
  },
  sprint: {
    name: 'SPRINT',
    ticks: 60 * 10,
    ramp: RAMPS.leaf,
    does: 'sprint shoes: extra speed',
  },
  magnet: {
    name: 'MAGNET',
    ticks: 60 * 10,
    ramp: RAMPS.rust,
    does: 'the family runs to you',
  },
  pause: {
    name: 'PAUSE',
    ticks: 60 * 3,
    ramp: RAMPS.steel,
    does: 'every foe freezes for three seconds',
  },
}

export const POWER_KINDS = Object.keys(POWERS) as PowerKind[]

/** A power-up lies on the floor this long before it fades. */
export const POWER_FLOOR_TICKS = 60 * 9
/** Chance a broken crate or a rebooted heavy (spawner, tank, hypno, sparker) leaves one. */
export const CRATE_DROP = 0.35
export const HEAVY_DROP = 0.12
/** Every wave, one comes through a vent this far in (if the wave is still going). */
export const VENT_POWER_AT = 60 * 14

/** A power-up from a roll in [0, 1): an even pick of the eight. */
export function powerFromRoll(roll: number): PowerKind {
  return POWER_KINDS[
    Math.min(POWER_KINDS.length - 1, Math.floor(roll * POWER_KINDS.length))
  ]!
}

const ICONS: Record<PowerKind, readonly string[]> = {
  spread: ['w...w', '.w.w.', '..w..', '..w..', '..w..'],
  rapid: ['.w.w.', 'w.w..', '.w.w.', 'w.w..', '.w.w.'],
  bounce: ['w....', '.w...', '..w.w', '...w.', '..w..'],
  wide: ['.www.', 'wwwww', 'wwwww', 'wwwww', '.www.'],
  shield: ['.www.', 'w...w', 'w...w', 'w...w', '.www.'],
  sprint: ['..ww.', '.ww..', 'wwwww', '..ww.', '.ww..'],
  magnet: ['w...w', 'w...w', 'w...w', 'w...w', '.www.'],
  pause: ['ww.ww', 'ww.ww', 'ww.ww', 'ww.ww', 'ww.ww'],
}

/** Each power-up's capsule: a bevelled gem in its colour with its glyph in white. */
export const POWER_SPRITES = Object.fromEntries(
  POWER_KINDS.map((kind) => {
    const r = POWERS[kind].ramp
    const glyph = ICONS[kind]
    const rows = [
      '..hhhhhhh..',
      '.hHHHHHHHs.',
      'hHH' + glyph[0]!.replace(/\./g, 'H') + 'HHs',
      'hHH' + glyph[1]!.replace(/\./g, 'H') + 'Hds',
      'hHH' + glyph[2]!.replace(/\./g, 'P') + 'Pds',
      'hPP' + glyph[3]!.replace(/\./g, 'P') + 'Pds',
      'hPP' + glyph[4]!.replace(/\./g, 'P') + 'dds',
      '.sPPPPPPdd.',
      '..sssssss..',
    ]
    return [
      kind,
      pixelSprite(rows, {
        h: r[4],
        H: r[3],
        P: r[2],
        d: r[1],
        s: r[0],
        w: '#ffffff',
        k: INK,
      }),
    ]
  }),
) as Record<PowerKind, PixelSprite>
