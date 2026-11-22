/**
 * X2 Coral Comet Trail. A rescue detour from the Rosefin Express into the
 * Blossom Wreckyard: the saved courier charts the upper comet wake.
 *
 * Flight time is 310 seconds at 60 Hz. Four cadet trainers each have one
 * readable 180-frame rescue window. The guardian occupies a separate arena;
 * code driving the cabinet and art intake are separate follow-up work.
 */
import { buildFormationSchedule, wave } from './rainbowFormations'
import type { RainbowSpawn, RainbowWave } from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'
import { ROSEFIN } from './rainbowRosefin'

export type CometEnemy = 'dolphin' | 'courier' | 'eel' | 'cutter' | 'scrap'
export type CometWave = RainbowWave<CometEnemy>
export type CometSpawn = RainbowSpawn<CometEnemy>
export type CometPhase = 'opening' | 'waves' | 'guardian' | 'exit' | 'done'
export type CometGuardianOutcome = 'waiting' | 'defeated' | 'escaped'

export const COMET = {
  id: 'X2',
  name: 'Coral Comet Trail',
  waveBase: 9400,
  openingEnds: 240,
  guardianFrom: 16800,
  guardianTo: 18000,
  end: 18600,
  trainerCount: 4,
  trainerWindow: 180,
  trainerReach: 24,
} as const

export const COMET_SECTIONS = [
  { name: 'Courier wake', from: 240, to: 2160 },
  { name: 'Aster belt', from: 2160, to: 4080 },
  { name: 'Twin dolphin slipstream', from: 4080, to: 6000 },
  { name: 'Eel ribbon gates', from: 6000, to: 7920 },
  { name: 'Coral fragment crossing', from: 7920, to: 9840 },
  { name: 'Comet-eye surge', from: 9840, to: 11760 },
  { name: 'Cadet flight school', from: 11760, to: 13920 },
  { name: 'Last bright turn', from: 13920, to: 16800 },
  { name: 'Comet Herder', from: 16800, to: 18000 },
  { name: 'Homeward formation', from: 18000, to: 18600 },
] as const

export const COMET_GUARDIAN: RainbowGuardianSection = {
  name: 'Comet Herder',
  from: COMET.guardianFrom,
  to: COMET.guardianTo,
  kind: 'herder',
}

/** Four trainer signals; each appears exactly once at a different lane. */
export const COMET_CADETS = [
  { id: 'trainer-1', at: 1740, lane: 0.24 },
  { id: 'trainer-2', at: 5460, lane: 0.76 },
  { id: 'trainer-3', at: 10260, lane: 0.33 },
  { id: 'trainer-4', at: 15120, lane: 0.69 },
] as const

/** Fast bursts ease in and out so camera speed never changes without warning. */
export const COMET_SURGES = [
  { from: 240, to: 2160, peak: 1.4 },
  { from: 7920, to: 9840, peak: 1.6 },
  { from: 9840, to: 11760, peak: 1.65 },
  { from: 13920, to: 16800, peak: 1.5 },
] as const

export const COMET_TALKS = {
  opening: [
    {
      speaker: 'Lilt-7',
      text: 'The courier left a chart inside the signal. The comet has a safe wake.',
    },
    {
      speaker: 'Solenne',
      text: 'Four trainer pods never reached the fleet. We can still reach them.',
    },
    {
      speaker: 'Azure',
      text: 'Follow the blue current. I will hold the leading edge clear.',
    },
  ],
  turn: [
    {
      speaker: 'Vivi',
      text: 'The Herder is pushing whole coral slabs into our flight path.',
    },
    {
      speaker: 'Maribel',
      text: 'It marks the lane before each shove. Keep a way out for the cadets.',
    },
    {
      speaker: 'Lilt-7',
      text: 'It cannot turn the comet quickly. Read the warning, then slip past.',
    },
  ],
  aftermath: [
    {
      speaker: 'Solenne',
      text: 'Every trainer we brought home is one more pilot for the rescue.',
    },
    {
      speaker: 'Azure',
      text: 'The Wreckyard is ahead. Stay close to the convoy.',
    },
    {
      speaker: 'Lilt-7',
      text: 'The comet trail fades. The route we earned does not.',
    },
  ],
} as const

/** The upper fork wins by living-seat majority; equal votes follow lead seat. */
export function cometDetourFor(
  positions: readonly number[],
  rescuedCourier: boolean,
  actCleared: boolean,
): boolean {
  if (!rescuedCourier || !actCleared || positions.length === 0) return false
  if (positions.some((y) => !Number.isFinite(y))) return false
  const high = positions.filter((y) => y < 135).length
  return (
    high > positions.length / 2 ||
    (high === positions.length / 2 && positions[0]! < 135)
  )
}

export function cometPhase(frame: number): CometPhase {
  if (frame < COMET.openingEnds) return 'opening'
  if (frame < COMET.guardianFrom) return 'waves'
  if (frame < COMET.guardianTo) return 'guardian'
  if (frame < COMET.end) return 'exit'
  return 'done'
}

/** Only a real post-Act-IV frame and section boundary may resume X2. */
export function cometCheckpointValid(
  act: number,
  frame: number,
  c: {
    rescuedCourier?: boolean
    cometStartedAt?: number
    cometFrame?: number
    cometCadetsMask?: number
    cometGuardianOutcome?: CometGuardianOutcome
    cometHits?: number
  },
): boolean {
  return (
    act === 4 &&
    c.rescuedCourier === true &&
    Number.isInteger(c.cometStartedAt) &&
    c.cometStartedAt! > ROSEFIN.bossStarts + ROSEFIN.aftermathFrames &&
    Number.isInteger(c.cometFrame) &&
    (c.cometFrame === 0 ||
      COMET_SECTIONS.some((section) => section.from === c.cometFrame)) &&
    frame === c.cometStartedAt! + c.cometFrame! &&
    Number.isInteger(c.cometCadetsMask) &&
    c.cometCadetsMask! >= 0 &&
    c.cometCadetsMask! < 1 << COMET.trainerCount &&
    Number.isInteger(c.cometHits) &&
    c.cometHits! >= 0 &&
    c.cometHits! <= 999 &&
    (c.cometGuardianOutcome === 'waiting' ||
      c.cometGuardianOutcome === 'defeated' ||
      c.cometGuardianOutcome === 'escaped')
  )
}

/** Cadet pickup stays visible for three seconds and is collected only once. */
export function cometCadetAvailable(frame: number, mask: number) {
  if (!Number.isInteger(frame) || !Number.isInteger(mask)) return null
  if (mask < 0 || mask >= 1 << COMET.trainerCount) return null
  return (
    COMET_CADETS.find(
      (cadet, index) =>
        (mask & (1 << index)) === 0 &&
        frame >= cadet.at &&
        frame < cadet.at + COMET.trainerWindow,
    ) ?? null
  )
}

export function rescueCometCadet(mask: number, cadetNumber: number): number {
  if (
    !Number.isInteger(mask) ||
    mask < 0 ||
    mask >= 1 << COMET.trainerCount ||
    !Number.isInteger(cadetNumber) ||
    cadetNumber < 1 ||
    cadetNumber > COMET.trainerCount
  )
    throw new Error('Invalid Coral Comet rescue')
  return mask | (1 << (cadetNumber - 1))
}

/** A pod moves toward the co-op fleet long enough to be intercepted. */
export function cometCadetX(frame: number, appearsAt: number): number {
  return 135 - (frame - appearsAt) * 0.55
}

export function cometFullWing(mask: number): boolean {
  return mask === (1 << COMET.trainerCount) - 1
}

export function cometSpeed(frame: number): number {
  for (const surge of COMET_SURGES) {
    if (frame < surge.from || frame >= surge.to) continue
    const ease = Math.max(
      0,
      Math.min(1, (frame - surge.from) / 120, (surge.to - frame) / 120),
    )
    return 1 + (surge.peak - 1) * ease
  }
  return 1
}

/** Four small, outlined fragments fan outward from a destroyed coral slab.
 * No fragment points directly left: a central approach corridor remains open. */
export function cometCoralFragments(x: number, y: number) {
  return [-0.85, -0.45, 0.45, 0.85].map((angle) => ({
    x,
    y,
    vx: -1.4 * Math.cos(angle),
    vy: 1.4 * Math.sin(angle),
    grazed: 0,
  }))
}

/** Comet Herder volleys alternate a readable high/low fan; the centre stays open. */
export function cometHerderVolley(volley: number, enraged = false) {
  if (!Number.isInteger(volley) || volley < 1)
    throw new Error('Invalid Herder volley number')
  const speed = enraged ? 2.1 : 1.65
  const centre = volley % 2 ? -0.55 : 0.55
  return [-0.22, -0.12, 0.12, 0.22].map((offset) => ({
    vx: -speed * Math.cos(centre + offset),
    vy: speed * Math.sin(centre + offset),
    grazed: 0,
  }))
}

export const COMET_WAVES: readonly CometWave[] = [
  wave(360, 'courier', 'single', 1, 0.3),
  wave(660, 'dolphin', 'pair', 2, 0.22),
  wave(960, 'courier', 'single', 1, 0.7),
  wave(1260, 'dolphin', 'line', 3, 0.45),
  wave(1560, 'courier', 'pair', 2, 0.3),
  wave(1860, 'dolphin', 'vee', 3, 0.5),
  wave(2280, 'scrap', 'single', 1, 0.25),
  wave(2580, 'courier', 'pair', 2, 0.35),
  wave(2880, 'scrap', 'column', 2, 0.5, { spread: 0.45 }),
  wave(3180, 'dolphin', 'pair', 2, 0.26),
  wave(3480, 'scrap', 'single', 1, 0.75),
  wave(3780, 'courier', 'line', 3, 0.65),
  wave(4200, 'dolphin', 'pair', 2, 0.2),
  wave(4500, 'eel', 'single', 1, 0.55),
  wave(4800, 'dolphin', 'vee', 3, 0.5),
  wave(5100, 'eel', 'pair', 2, 0.3),
  wave(5400, 'courier', 'line', 3, 0.6),
  wave(5700, 'dolphin', 'pair', 4, 0.25),
  wave(6120, 'eel', 'single', 1, 0.3),
  wave(6420, 'eel', 'pair', 2, 0.65),
  wave(6720, 'courier', 'single', 1, 0.5),
  wave(7020, 'eel', 'column', 3, 0.5, { spread: 0.25 }),
  wave(7320, 'dolphin', 'pair', 2, 0.3),
  wave(7620, 'eel', 'pair', 2, 0.75),
  wave(8040, 'scrap', 'single', 1, 0.22),
  wave(8340, 'cutter', 'single', 1, 0.68),
  wave(8640, 'scrap', 'pair', 2, 0.32),
  wave(8940, 'courier', 'line', 3, 0.5),
  wave(9240, 'cutter', 'pair', 2, 0.6),
  wave(9540, 'scrap', 'column', 3, 0.48, { spread: 0.25 }),
  wave(9960, 'courier', 'pair', 2, 0.22),
  wave(10260, 'cutter', 'single', 1, 0.74),
  wave(10560, 'dolphin', 'vee', 3, 0.44),
  wave(10860, 'scrap', 'pair', 2, 0.4),
  wave(11160, 'eel', 'single', 1, 0.68),
  wave(11460, 'courier', 'line', 3, 0.28),
  wave(11880, 'dolphin', 'pair', 4, 0.25),
  wave(12180, 'eel', 'pair', 2, 0.7),
  wave(12480, 'courier', 'pair', 2, 0.38),
  wave(12780, 'cutter', 'single', 1, 0.56),
  wave(13080, 'dolphin', 'vee', 3, 0.5),
  wave(13380, 'eel', 'pair', 2, 0.3),
  wave(13680, 'courier', 'line', 3, 0.67),
  wave(14100, 'cutter', 'single', 1, 0.3),
  wave(14400, 'eel', 'pair', 2, 0.67),
  wave(14700, 'scrap', 'column', 2, 0.5, { spread: 0.42 }),
  wave(15000, 'dolphin', 'pair', 4, 0.25),
  wave(15300, 'courier', 'vee', 3, 0.5),
  wave(15600, 'eel', 'pair', 2, 0.33),
  wave(15900, 'cutter', 'pair', 2, 0.7),
  wave(16200, 'scrap', 'single', 1, 0.5),
  wave(16500, 'courier', 'line', 3, 0.4),
]

const schedule = buildFormationSchedule(COMET_WAVES, COMET.waveBase)
export const COMET_WAVE_SIZES: readonly number[] = schedule.sizes

export function cometSpawns(frame: number): readonly CometSpawn[] {
  return cometPhase(frame) === 'waves' ? schedule.at(frame) : []
}
