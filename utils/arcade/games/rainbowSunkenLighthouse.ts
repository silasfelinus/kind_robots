import { buildFormationSchedule, wave } from './rainbowFormations'
import type { RainbowSpawn, RainbowWave } from './rainbowFormations'
import { CROWN_REEF_PYLONS } from './rainbowCrownReef'
import type { RainbowGuardianSection } from './rainbowGuardian'

/**
 * X3, Sunken Lighthouse Ring: an earned detour between Acts VI and VII.
 * This is the complete authored encounter score and six-lamp objective model;
 * the separate flight adapter, checkpoint, guardian sprite and art are t-028
 * work still outstanding. Nothing in this module silently launches a detour.
 */
export type LighthouseEnemy =
  'mirror' | 'squid' | 'harbinger' | 'prism' | 'mortar'
export type LighthouseWave = RainbowWave<LighthouseEnemy>
export type LighthouseSpawn = RainbowSpawn<LighthouseEnemy>
export type LighthousePhase = 'opening' | 'waves' | 'turn' | 'boss'

export const LIGHTHOUSE = {
  id: 'X3',
  name: 'Sunken Lighthouse Ring',
  waveBase: 9600,
  openingEnds: 240,
  turnStarts: 7320,
  bossStarts: 7680,
  end: 7980,
  guardianFrom: 6690,
  guardianTo: 7320,
  guardianName: 'Drowned Bellkeeper',
  lampsToLight: 6,
  lampWindowFrames: 90,
} as const

/** The cleared relay offers X3 through the upper corridor. A tied crew follows
 * its lead pilot, and a locked route never silently opens. */
export function lighthouseDetourFor(
  positions: readonly number[],
  unlocked: boolean,
): boolean {
  if (!unlocked || positions.length === 0) return false
  const high = positions.filter((y) => y < 135).length
  return (
    high > positions.length / 2 ||
    (high === positions.length / 2 && positions[0]! < 135)
  )
}

/** A resumed X3 detour must prove it belonged to a genuinely silenced relay.
 * Its clock cannot be smuggled into an unrelated Act VI checkpoint. */
export function lighthouseCheckpointValid(
  act: number,
  frame: number,
  c: {
    lighthouseStartedAt?: number
    lighthouseFrame?: number
    reefRoute?: 'relay' | 'cache' | null
    reefSettled?: boolean
    pylonsDown?: number
  },
): boolean {
  return (
    act === 6 &&
    lighthouseRouteUnlocked(
      c.reefRoute ?? null,
      c.reefSettled === true,
      c.pylonsDown ?? 0,
    ) &&
    Number.isInteger(c.lighthouseStartedAt) &&
    c.lighthouseStartedAt! > 0 &&
    Number.isInteger(c.lighthouseFrame) &&
    (c.lighthouseFrame === 0 ||
      LIGHTHOUSE_SECTIONS.some(
        (section) => section.from === c.lighthouseFrame,
      )) &&
    frame === c.lighthouseStartedAt! + c.lighthouseFrame!
  )
}

export const LIGHTHOUSE_GUARDIAN: RainbowGuardianSection = {
  name: LIGHTHOUSE.guardianName,
  from: LIGHTHOUSE.guardianFrom,
  to: LIGHTHOUSE.guardianTo,
  kind: 'lampkeeper',
}

/** The X3 guardian exists only in its own window on an earned Act VI relay. */
export function lighthouseGuardianActive(
  frame: number,
  route: 'relay' | 'cache' | null,
  settled: boolean,
  pylonsDown: number,
): boolean {
  return (
    lighthouseRouteUnlocked(route, settled, pylonsDown) &&
    frame >= LIGHTHOUSE_GUARDIAN.from &&
    frame < LIGHTHOUSE_GUARDIAN.to
  )
}

export const LIGHTHOUSE_SECTIONS = [
  { name: 'Bell one: the drowned approach', from: 240, to: 1530 },
  { name: 'Bell two: a false reflection', from: 1530, to: 2820 },
  { name: 'Bells three and four: crossed beams', from: 2820, to: 4110 },
  { name: 'Bell five: a quiet signal', from: 4110, to: 5400 },
  { name: 'Bell six: the last flame', from: 5400, to: 6690 },
  { name: 'Drowned Bellkeeper', from: 6690, to: 7320 },
] as const

/** Lamps appear in increasing order, never during the guardian fight. */
export const LIGHTHOUSE_LAMPS = [
  { id: 'lamp-1', at: 720, lane: 0.27 },
  { id: 'lamp-2', at: 1740, lane: 0.72 },
  { id: 'lamp-3', at: 2910, lane: 0.36 },
  { id: 'lamp-4', at: 3780, lane: 0.76 },
  { id: 'lamp-5', at: 5010, lane: 0.18 },
  { id: 'lamp-6', at: 6330, lane: 0.58 },
] as const

/**
 * The reveal depends on an actually silenced relay from Act VI, not merely
 * discovering the relay lane or carrying a saved medal from another slot.
 */
export function lighthouseRouteUnlocked(
  route: 'relay' | 'cache' | null,
  settled: boolean,
  pylonsDown: number,
): boolean {
  return route === 'relay' && settled && pylonsDown >= CROWN_REEF_PYLONS
}

export const LIGHTHOUSE_WAVES: readonly LighthouseWave[] = [
  // Teach a single real glint amid phantom reflection fire.
  wave(330, 'mirror', 'single', 1, 0.3),
  wave(570, 'mirror', 'single', 1, 0.73),
  wave(810, 'squid', 'single', 1, 0.5),
  wave(1050, 'mirror', 'pair', 2, 0.33),
  wave(1260, 'squid', 'single', 1, 0.3),
  wave(1440, 'mirror', 'line', 3, 0.74),
  // Mirror the first bell's lanes, then introduce a long prism tell.
  wave(1620, 'mirror', 'single', 1, 0.72),
  wave(1860, 'prism', 'single', 1, 0.24),
  wave(2100, 'squid', 'pair', 2, 0.46),
  wave(2340, 'mirror', 'stair', 3, 0.27),
  wave(2580, 'prism', 'single', 1, 0.78),
  wave(2730, 'mirror', 'pair', 2, 0.37),
  // The third bell asks pilots to read two different threats at once.
  wave(2910, 'harbinger', 'single', 1, 0.33),
  wave(3150, 'squid', 'single', 1, 0.7),
  wave(3390, 'mirror', 'vee', 3, 0.48),
  wave(3630, 'harbinger', 'single', 1, 0.73),
  wave(3900, 'prism', 'single', 1, 0.25),
  wave(4050, 'squid', 'pair', 2, 0.42),
  // A gentle recovery corridor preserves a clean path to the fifth light.
  wave(4260, 'mirror', 'single', 1, 0.25),
  wave(4560, 'squid', 'single', 1, 0.67),
  wave(4680, 'mirror', 'single', 1, 0.28),
  wave(4830, 'mirror', 'pair', 2, 0.44),
  wave(5130, 'prism', 'single', 1, 0.72),
  wave(5310, 'mirror', 'single', 1, 0.3),
  // Final exam: read glints, split pellets and timed prism beams together.
  wave(5520, 'harbinger', 'single', 1, 0.3),
  wave(5730, 'mirror', 'stair', 3, 0.67, { step: -1 }),
  wave(5970, 'squid', 'pair', 2, 0.35),
  wave(6210, 'prism', 'single', 1, 0.7),
  wave(6450, 'harbinger', 'single', 1, 0.43),
  wave(6570, 'mirror', 'pair', 2, 0.27),
]

export const LIGHTHOUSE_TALKS = {
  opening: [
    {
      speaker: 'Lilt-7',
      text: 'The relay is dark. Six abandoned lighthouses are answering us.',
    },
    {
      speaker: 'Azure',
      text: 'These were rescue lights. The Crown erased their coordinates.',
    },
    {
      speaker: 'Maribel',
      text: 'Then we put them back where the living Ocean can find them.',
    },
  ],
  turn: [
    {
      speaker: 'Solenne',
      text: 'Sixth light steady. Something in the bell tower is waking.',
    },
    {
      speaker: 'Vivi',
      text: 'Let it toll. We can read a warning better than a silence.',
    },
    {
      speaker: 'Lilt-7',
      text: 'Its ring leaves a gap. Follow the light, not the echo.',
    },
  ],
  aftermath: [
    {
      speaker: 'Lilt-7',
      text: 'I lit these lamps once, before the Crown. I remember the switches. They stay lit now.',
    },
    {
      speaker: 'Azure',
      text: 'I can finally see the Glass Current as a route, not a trap.',
    },
    {
      speaker: 'Maribel',
      text: 'Then everyone gets a way home. Not just us.',
    },
  ],
} as const

const schedule = buildFormationSchedule(LIGHTHOUSE_WAVES, LIGHTHOUSE.waveBase)
export const LIGHTHOUSE_WAVE_SIZES = schedule.sizes

export function lighthouseStage(frame: number): LighthousePhase {
  if (frame < LIGHTHOUSE.openingEnds) return 'opening'
  if (frame < LIGHTHOUSE.turnStarts) return 'waves'
  if (frame < LIGHTHOUSE.bossStarts) return 'turn'
  return 'boss'
}

export function lighthouseSpawns(frame: number): readonly LighthouseSpawn[] {
  return lighthouseStage(frame) === 'waves' ? schedule.at(frame) : []
}

export function lighthouseLampAt(frame: number) {
  return LIGHTHOUSE_LAMPS.find((lamp) => lamp.at === frame) ?? null
}

/** A real lamp stays collectible for 90 frames after its appearance. The beam
 * is telegraphed in advance; bitmask ownership prevents double rewards. */
export function lighthouseCollectibleLamp(frame: number, mask: number) {
  if (
    !Number.isInteger(frame) ||
    !Number.isInteger(mask) ||
    mask < 0 ||
    mask >= 1 << LIGHTHOUSE.lampsToLight
  )
    return null
  return (
    LIGHTHOUSE_LAMPS.find(
      (lamp, index) =>
        frame >= lamp.at &&
        frame < lamp.at + LIGHTHOUSE.lampWindowFrames &&
        (mask & (1 << index)) === 0,
    ) ?? null
  )
}

/** A six-bit mask survives retries; collecting the same lamp twice is inert. */
export function lightLighthouseLamp(mask: number, lampNumber: number): number {
  if (
    !Number.isInteger(mask) ||
    mask < 0 ||
    mask >= 1 << LIGHTHOUSE.lampsToLight ||
    !Number.isInteger(lampNumber) ||
    lampNumber < 1 ||
    lampNumber > LIGHTHOUSE.lampsToLight
  )
    throw new Error('Invalid lighthouse progress')
  return mask | (1 << (lampNumber - 1))
}

export function lighthouseMedalEarned(mask: number): boolean {
  return mask === (1 << LIGHTHOUSE.lampsToLight) - 1
}

/**
 * The Bellkeeper's alternating authored volleys leave a real gap: a pearl
 * hoop with an empty four-pellet arc, followed by two crescent wings with a
 * clear aimed central lane. This geometry is independent of drawing or art.
 */
export function lighthouseBellkeeperVolley(
  volley: number,
  enraged = false,
): readonly { angle: number; speed: number }[] {
  if (!Number.isInteger(volley) || volley < 1)
    throw new Error('A bellkeeper volley needs a positive count')
  const speed = enraged ? 1.85 : 1.55
  if (volley % 2 === 0) {
    const angles = enraged ? [0.2, 0.32, 0.44, 0.58] : [0.25, 0.4, 0.55]
    return angles.flatMap((offset) => [
      { angle: Math.PI - offset, speed },
      { angle: Math.PI + offset, speed },
    ])
  }
  const count = enraged ? 18 : 14
  const gap = (volley * 5) % count
  const shots: Array<{ angle: number; speed: number }> = []
  for (let i = 0; i < count; i++)
    if ((i - gap + count) % count >= (enraged ? 5 : 4))
      shots.push({ angle: (i / count) * Math.PI * 2, speed })
  return shots
}
