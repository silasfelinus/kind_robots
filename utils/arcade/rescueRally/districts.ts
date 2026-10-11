// /utils/arcade/rescueRally/districts.ts
//
// Rescue Rally — Citywide Reboot's campaign (conductor kr-arcade t-036, depth-pass/CABINETS.md section
// 1, "Structure" and "The districts"). The hero sweeps the city district by district: each district
// is eight wave scripts (waves.ts) closing on its boss (bosses.ts), on its own floor with its own
// music (music.ts). The Shelter (shelter.ts) opens between districts, and progress saves at each
// district's start. Past the last district the rally loops round the city, harder.

import { RAMPS } from '../snes'
import type { Ramp } from '../snes'
import type { MusicLoop } from '../sound'
import { FACTORY_MUSIC, PLAZA_MUSIC } from './music'
import { NEON_PLAZA, TOY_FACTORY } from './waves'
import type { WaveScript } from './waves'

export type DistrictId = 'plaza' | 'factory'

export type District = {
  id: DistrictId
  name: string
  /** One line on its title card. */
  tagline: string
  floor: {
    /** [band dark, band light] of the floor's gradient. */
    bands: readonly [string, string]
    seam: string
    accent: Ramp
    /** The bevelled rim round the arena. */
    rim: Ramp
    /** What is painted on the floor's middle. */
    emblem: 'heart' | 'gear'
  }
  music: MusicLoop
  waves: readonly WaveScript[]
}

export const WAVES_PER_DISTRICT = 8

export const DISTRICTS: readonly District[] = [
  {
    id: 'plaza',
    name: 'NEON PLAZA',
    tagline: 'WHERE THE GLITCH BEGAN',
    floor: {
      bands: [RAMPS.night[1], RAMPS.night[3]],
      seam: RAMPS.purple[3],
      accent: RAMPS.teal,
      rim: RAMPS.purple,
      emblem: 'heart',
    },
    music: PLAZA_MUSIC,
    waves: NEON_PLAZA,
  },
  {
    id: 'factory',
    name: 'TOY FACTORY',
    tagline: 'MIND THE BELTS',
    floor: {
      bands: ['#2a1608', '#5a3414'],
      seam: RAMPS.gold[2],
      accent: RAMPS.gold,
      rim: RAMPS.rust,
      emblem: 'gear',
    },
    music: FACTORY_MUSIC,
    waves: TOY_FACTORY,
  },
]

/** Waves in one sweep of the city. */
export const CAMPAIGN_WAVES = DISTRICTS.length * WAVES_PER_DISTRICT

export type WaveSpot = {
  script: WaveScript
  /** Which time round the city (1 the first). */
  loop: number
  /** Index into DISTRICTS, and the wave within it (0-7). */
  district: number
  index: number
}

/** Where global wave `n` (1-based) falls in the campaign. */
export function waveAt(n: number): WaveSpot {
  const i = Math.max(0, Math.floor(n) - 1)
  const inLoop = i % CAMPAIGN_WAVES
  const district = Math.floor(inLoop / WAVES_PER_DISTRICT)
  const index = inLoop % WAVES_PER_DISTRICT
  return {
    script: DISTRICTS[district]!.waves[index]!,
    loop: Math.floor(i / CAMPAIGN_WAVES) + 1,
    district,
    index,
  }
}

/** The global wave number a district starts on, in a given loop. */
export function districtStart(district: number, loop = 1): number {
  return (loop - 1) * CAMPAIGN_WAVES + district * WAVES_PER_DISTRICT + 1
}
