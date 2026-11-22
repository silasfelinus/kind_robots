/** Alternate Act A: Lantern Nursery. An authored score for a hidden sea-creature sanctuary.
 * Campaign integration, checkpoints and production art remain outstanding in t-028.
 */
import { buildFormationSchedule, wave } from './rainbowFormations'
import type { RainbowSpawn, RainbowWave } from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type NurseryEnemy = 'angler' | 'pistol' | 'skate' | 'clawstrike'
export type NurseryWave = RainbowWave<NurseryEnemy>
export type NurserySpawn = RainbowSpawn<NurseryEnemy>

export const NURSERY = {
  name: 'Lantern Nursery',
  waveBase: 9200,
  openingEnds: 240,
  turnStarts: 4380,
  bossStarts: 4680,
} as const

export const NURSERY_SECTIONS = [
  { name: 'Luminous eggs', from: 240, to: 1080 },
  { name: 'Sleeping shoal', from: 1080, to: 1920 },
  { name: 'Broken lanterns', from: 1920, to: 2760 },
  { name: 'Nursery heart', from: 2760, to: 3600 },
  { name: 'Lantern matriarch', from: 3600, to: 4380 },
] as const

export const NURSERY_GUARDIAN: RainbowGuardianSection = {
  name: 'Lantern matriarch',
  from: 3600,
  to: 4380,
  kind: 'matriarch',
}

/** Teach false pickup halos, remix with bubble rings, subvert with skates,
 * and test reading sniper marks while guarding the nursery's living heart.
 */
export const NURSERY_WAVES: readonly NurseryWave[] = [
  wave(300, 'angler', 'single', 1, 0.3),
  wave(480, 'angler', 'single', 1, 0.7),
  wave(660, 'pistol', 'single', 1, 0.5),
  wave(840, 'angler', 'pair', 2, 0.25),
  wave(1020, 'pistol', 'single', 1, 0.7),
  wave(1140, 'pistol', 'pair', 2, 0.3),
  wave(1320, 'angler', 'single', 1, 0.5),
  wave(1500, 'pistol', 'column', 2, 0.5, { spread: 0.4 }),
  wave(1680, 'angler', 'pair', 2, 0.2),
  wave(1860, 'pistol', 'pair', 2, 0.65),
  wave(1980, 'skate', 'line', 3, 0.3),
  wave(2160, 'angler', 'single', 1, 0.75),
  wave(2340, 'skate', 'stair', 3, 0.2),
  wave(2520, 'pistol', 'single', 1, 0.5),
  wave(2700, 'skate', 'line', 3, 0.7),
  wave(2820, 'clawstrike', 'single', 1, 0.2),
  wave(3000, 'angler', 'pair', 2, 0.4),
  wave(3180, 'clawstrike', 'single', 1, 0.8),
  wave(3360, 'skate', 'vee', 3, 0.5),
  wave(3540, 'pistol', 'pair', 2, 0.25),
]

/**
 * X1 is a separate, earned flight, not the short safe-corridor remix inside
 * Act III. The rescued navigator opens the nursery after the trench is cleared.
 * The low-lane majority opts in; ties follow the lead seat.
 */
export function nurseryDetourFor(
  positions: readonly number[],
  rescuedNemi: boolean,
  trenchCleared: boolean,
): boolean {
  if (!rescuedNemi || !trenchCleared || positions.length === 0) return false
  const low = positions.filter((y) => Number.isFinite(y) && y >= 135).length
  return (
    low > positions.length / 2 ||
    (low === positions.length / 2 &&
      Number.isFinite(positions[0]) &&
      positions[0]! >= 135)
  )
}

export const NURSERY_FLIGHT = {
  id: 'X1',
  name: 'Lantern Nursery',
  end: 5100,
  guardianFrom: NURSERY_GUARDIAN.from,
  guardianTo: NURSERY_GUARDIAN.to,
} as const

/** Standalone sections include a deliberate post-guardian exit for Act IV. */
export const NURSERY_FLIGHT_SECTIONS = [
  { name: 'Luminous eggs', from: 240, to: 1080 },
  { name: 'Sleeping shoal', from: 1080, to: 1920 },
  { name: 'Broken lanterns', from: 1920, to: 2760 },
  { name: 'Nursery heart', from: 2760, to: 3600 },
  { name: 'Lantern matriarch', from: 3600, to: 4380 },
  { name: 'Safe passage home', from: 4380, to: 5100 },
] as const

export type NurseryFlightPhase =
  'opening' | 'waves' | 'guardian' | 'exit' | 'done'

export function nurseryFlightPhase(frame: number): NurseryFlightPhase {
  if (frame < NURSERY.openingEnds) return 'opening'
  if (frame < NURSERY_GUARDIAN.from) return 'waves'
  if (frame < NURSERY_GUARDIAN.to) return 'guardian'
  if (frame < NURSERY_FLIGHT.end) return 'exit'
  return 'done'
}

/**
 * Standalone checkpoint proof. A legacy Act III fork must not masquerade as
 * an X1 flight; the starting tick and section boundary must both be exact.
 */
export function nurseryFlightCheckpointValid(
  act: number,
  frame: number,
  c: {
    nurseryStartedAt?: number
    nurseryFrame?: number
    rescuedNemi?: boolean
    trenchRoute?: 'vault' | 'safe' | null
    routeSettled?: boolean
  },
): boolean {
  return (
    act === 3 &&
    c.rescuedNemi === true &&
    c.routeSettled === true &&
    c.trenchRoute !== null &&
    c.trenchRoute !== undefined &&
    Number.isInteger(c.nurseryStartedAt) &&
    c.nurseryStartedAt! > 0 &&
    Number.isInteger(c.nurseryFrame) &&
    (c.nurseryFrame === 0 ||
      NURSERY_FLIGHT_SECTIONS.some(
        (section) => section.from === c.nurseryFrame,
      )) &&
    frame === c.nurseryStartedAt! + c.nurseryFrame!
  )
}

/** Three authored communication scenes frame a rescue, never a hunt. */
export const NURSERY_TALKS = {
  opening: [
    {
      speaker: 'Lilt-7',
      text: "Nemi's signal comes from a nursery someone erased from our charts.",
    },
    {
      speaker: 'Vivi',
      text: "Those aren't enemy beacons. They're hatchlings learning to glow.",
    },
    {
      speaker: 'Solenne',
      text: 'Weapons clear of the nests. We protect their crossing.',
    },
  ],
  turn: [
    {
      speaker: 'Maribel',
      text: 'The matriarch guards her young. See the safe seam in her warning?',
    },
    {
      speaker: 'Azure',
      text: "I'll thread that seam. No shots near the eggs.",
    },
    {
      speaker: 'Lilt-7',
      text: 'She is warning the strangers to leave, not asking for a war.',
    },
  ],
  aftermath: [
    {
      speaker: 'Lilt-7',
      text: 'One safe route home. I can carry it past the Motherland censors.',
    },
    {
      speaker: 'Vivi',
      text: 'Tell Nemi the lanterns are free to keep their own sky.',
    },
    {
      speaker: 'Maribel',
      text: 'A living nursery is worth more than any medal.',
    },
  ],
} as const

const schedule = buildFormationSchedule(NURSERY_WAVES, NURSERY.waveBase)
export const NURSERY_WAVE_SIZES: readonly number[] = schedule.sizes

export function nurseryStage(frame: number) {
  if (frame < NURSERY.openingEnds) return 'opening'
  if (frame < NURSERY.turnStarts) return 'waves'
  if (frame < NURSERY.bossStarts) return 'turn'
  return 'boss'
}

export function nurserySpawns(frame: number): readonly NurserySpawn[] {
  return nurseryStage(frame) === 'waves' ? schedule.at(frame) : []
}

/**
 * Map the authored Nursery clock into an earned in-flight route window.
 * Translate every crossed source frame, not only the landing frame: recut
 * timelines can advance by multiple Nursery frames per cabinet tick.
 */
export function nurseryRouteSpawns(
  frame: number,
  routeStart: number,
  routeEnd: number,
): readonly NurserySpawn[] {
  if (
    !Number.isInteger(frame) ||
    !Number.isInteger(routeStart) ||
    !Number.isInteger(routeEnd) ||
    routeEnd <= routeStart ||
    frame < routeStart ||
    frame >= routeEnd
  )
    return []

  const duration = routeEnd - routeStart
  const authored = NURSERY.turnStarts - NURSERY.openingEnds
  const progress = frame - routeStart
  const from =
    NURSERY.openingEnds + Math.floor(((progress - 1) * authored) / duration)
  const to = NURSERY.openingEnds + Math.floor((progress * authored) / duration)
  const spawns: NurserySpawn[] = []
  for (let sourceFrame = from + 1; sourceFrame <= to; sourceFrame++)
    spawns.push(...nurserySpawns(sourceFrame))
  return spawns
}

/** The living Nursery's guardian occupies the final portion of the earned Act III fork. */
export function nurseryGuardianWindow(
  routeStart: number,
  routeEnd: number,
): { from: number; to: number } {
  const duration = routeEnd - routeStart
  const authored = NURSERY.turnStarts - NURSERY.openingEnds
  return {
    from:
      routeStart +
      Math.ceil(
        ((NURSERY_GUARDIAN.from - NURSERY.openingEnds) * duration) / authored,
      ),
    to: routeEnd,
  }
}
