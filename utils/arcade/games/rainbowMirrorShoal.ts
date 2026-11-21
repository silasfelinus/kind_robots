import { buildFormationSchedule, wave } from './rainbowFormations'
import type { RainbowSpawn, RainbowWave } from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

/**
 * X4 Mirror Shoal: an earned Act VII to VIII detour. Reflected shapes are
 * warnings, not extra collision boxes. The route adapter, persistence, art
 * and actual cabinet flight remain separate t-028 delivery work.
 */
export type ShoalEnemy = 'mirror' | 'skate' | 'squid' | 'harbinger'
export type ShoalWave = RainbowWave<ShoalEnemy>
export type ShoalSpawn = RainbowSpawn<ShoalEnemy>

export const MIRROR_SHOAL = {
  id: 'X4',
  name: 'Mirror Shoal',
  waveBase: 10000,
  openingEnds: 300,
  guardianFrom: 15000,
  guardianTo: 17400,
  turnStarts: 17400,
  aftermathStarts: 17700,
  end: 18000,
  guardianName: 'Shoal Koi',
} as const

export const SHOAL_SECTIONS = [
  { name: 'Waterline', from: 300, to: 1800 },
  { name: 'Second horizon', from: 1800, to: 3300 },
  { name: 'Shimmer school', from: 3300, to: 4800 },
  { name: 'False reflection', from: 4800, to: 6300 },
  { name: 'Navigator signal', from: 6300, to: 7800 },
  { name: 'Split current', from: 7800, to: 9300 },
  { name: 'Ghost tide', from: 9300, to: 10800 },
  { name: 'Glass shallows', from: 10800, to: 12300 },
  { name: 'Silver knot', from: 12300, to: 13800 },
  { name: 'True horizon', from: 13800, to: 15000 },
  { name: 'Shoal Koi', from: 15000, to: 17400 },
] as const

/** Fly the high current to enter X4, low to return directly to Act VIII.
 * Co-op majority decides; a tied vote follows the lead pilot.
 */
export function mirrorShoalDetourFor(
  positions: readonly number[],
  unlocked: boolean,
): boolean {
  if (!unlocked || !positions.length) return false
  const high = positions.filter((y) => y < 135).length
  const low = positions.length - high
  return high > low || (high === low && positions[0]! < 135)
}

/** An X4 checkpoint uses Act VII's clock but never masquerades as an Act VII
 * section. The event and both clocks must agree, including on replay.
 */
export function mirrorShoalCheckpointValid(
  act: number,
  frame: number,
  c: {
    shoalStartedAt?: number
    shoalFrame?: number
  },
): boolean {
  return (
    act === 7 &&
    Number.isInteger(c.shoalStartedAt) &&
    c.shoalStartedAt! > 0 &&
    Number.isInteger(c.shoalFrame) &&
    (c.shoalFrame === 0 ||
      SHOAL_SECTIONS.some((section) => section.from === c.shoalFrame)) &&
    frame === c.shoalStartedAt! + c.shoalFrame!
  )
}

export const SHOAL_GUARDIAN: RainbowGuardianSection = {
  name: MIRROR_SHOAL.guardianName,
  from: MIRROR_SHOAL.guardianFrom,
  to: MIRROR_SHOAL.guardianTo,
  kind: 'shoalkoi',
}

/** Skill or kindness opens the Shoal; old-slot memories never do. */
export function mirrorShoalRouteUnlocked(
  rescuedNavigator: boolean,
  actSevenContinues: number,
): boolean {
  return (
    Number.isInteger(actSevenContinues) &&
    actSevenContinues >= 0 &&
    (rescuedNavigator || actSevenContinues === 0)
  )
}

export const SHOAL_WAVES: readonly ShoalWave[] = [
  // Learn which half of a reflection is real, then read paired shadows.
  wave(360, 'mirror', 'single', 1, 0.23),
  wave(660, 'skate', 'single', 1, 0.76),
  wave(960, 'mirror', 'pair', 2, 0.52),
  wave(1260, 'squid', 'single', 1, 0.33),
  wave(1560, 'mirror', 'line', 3, 0.7),
  wave(1860, 'skate', 'pair', 2, 0.25),
  wave(2160, 'mirror', 'stair', 3, 0.42),
  wave(2460, 'squid', 'single', 1, 0.72),
  // Alternate real skates with the reflected squid shoal.
  wave(2760, 'squid', 'single', 1, 0.27),
  wave(3060, 'mirror', 'pair', 2, 0.68),
  wave(3360, 'squid', 'pair', 2, 0.46),
  wave(3660, 'skate', 'line', 3, 0.21),
  wave(3960, 'mirror', 'single', 1, 0.75),
  wave(4260, 'squid', 'pair', 2, 0.31),
  wave(4560, 'skate', 'stair', 3, 0.72),
  wave(4860, 'mirror', 'vee', 3, 0.5),
  // The first harbinger asks pilots to hold a line through ghost fire.
  wave(5160, 'harbinger', 'single', 1, 0.29),
  wave(5460, 'mirror', 'pair', 2, 0.7),
  wave(5760, 'harbinger', 'single', 1, 0.73),
  wave(6060, 'skate', 'pair', 2, 0.37),
  wave(6360, 'mirror', 'stair', 3, 0.27),
  wave(6660, 'harbinger', 'single', 1, 0.56),
  wave(6960, 'squid', 'pair', 2, 0.69),
  wave(7260, 'mirror', 'line', 3, 0.43),
  // Mirror stairs and skate wings cross the middle without sealing it.
  wave(7560, 'skate', 'single', 1, 0.74),
  wave(7860, 'mirror', 'pair', 2, 0.23),
  wave(8160, 'skate', 'vee', 3, 0.54),
  wave(8460, 'squid', 'single', 1, 0.29),
  wave(8760, 'mirror', 'stair', 3, 0.77),
  wave(9060, 'skate', 'pair', 2, 0.42),
  wave(9360, 'harbinger', 'single', 1, 0.7),
  wave(9660, 'mirror', 'line', 3, 0.35),
  // Restore a quiet lane before the last knot of reflections.
  wave(9960, 'mirror', 'single', 1, 0.3),
  wave(10260, 'squid', 'pair', 2, 0.68),
  wave(10560, 'harbinger', 'single', 1, 0.47),
  wave(10860, 'mirror', 'vee', 3, 0.26),
  wave(11160, 'skate', 'line', 3, 0.75),
  wave(11460, 'squid', 'single', 1, 0.53),
  wave(11760, 'harbinger', 'single', 1, 0.27),
  wave(12060, 'mirror', 'pair', 2, 0.72),
  // Final exam: four families in alternating channels, no duplicate wave ids.
  wave(12360, 'harbinger', 'single', 1, 0.75),
  wave(12660, 'mirror', 'pair', 2, 0.28),
  wave(12960, 'squid', 'pair', 2, 0.5),
  wave(13260, 'skate', 'stair', 3, 0.71),
  wave(13560, 'mirror', 'vee', 3, 0.43),
  wave(13860, 'harbinger', 'single', 1, 0.35),
  wave(14160, 'skate', 'pair', 2, 0.65),
  wave(14460, 'mirror', 'line', 3, 0.52),
]

export const SHOAL_TALKS = {
  opening: [
    {
      speaker: 'Lilt-7',
      text: 'Two horizons. Only one of them has a tide. Follow the living one.',
    },
    {
      speaker: 'Azure',
      text: 'Those bright echoes are maps of where ships used to be.',
    },
    {
      speaker: 'Vivi',
      text: 'Then we stop chasing reflections. Let the ghosts go first.',
    },
  ],
  turn: [
    {
      speaker: 'Solenne',
      text: 'The Shoal Koi is splitting the current across our sights.',
    },
    {
      speaker: 'Maribel',
      text: 'The hollow shots are beautiful. Watch for the solid edges.',
    },
    {
      speaker: 'Lilt-7',
      text: 'Its phantom half cannot hurt us. I remember why it was made.',
    },
  ],
  aftermath: [
    {
      speaker: 'Lilt-7',
      text: 'The Shoal remembers a promise the Crown made to the Ocean.',
    },
    {
      speaker: 'Azure',
      text: 'Protect, and ask. I would like to hear the rest of that order.',
    },
    {
      speaker: 'Vivi',
      text: 'Keep the echo. The Motherland does not get to erase this one.',
    },
  ],
} as const

const schedule = buildFormationSchedule(SHOAL_WAVES, MIRROR_SHOAL.waveBase)
export const SHOAL_WAVE_SIZES = schedule.sizes

export type ShoalPhase =
  | 'opening'
  | 'waves'
  | 'guardian'
  | 'turn'
  | 'aftermath'
  | 'complete'

export function mirrorShoalStage(frame: number): ShoalPhase {
  if (frame < MIRROR_SHOAL.openingEnds) return 'opening'
  if (frame < MIRROR_SHOAL.guardianFrom) return 'waves'
  if (frame < MIRROR_SHOAL.guardianTo) return 'guardian'
  if (frame < MIRROR_SHOAL.aftermathStarts) return 'turn'
  if (frame < MIRROR_SHOAL.end) return 'aftermath'
  return 'complete'
}

export function mirrorShoalSpawns(frame: number): readonly ShoalSpawn[] {
  return mirrorShoalStage(frame) === 'waves' ? schedule.at(frame) : []
}

/** Still Water demands a no-hit Shoal clear, not just a no-continue run. */
export function mirrorShoalMedalEarned(hits: number): boolean {
  return Number.isInteger(hits) && hits === 0
}
