/**
 * Authored Act IV encounter director: the Rosefin Express (S04), a neon migratory current where civilian
 * convoys ride light rails. Local 60 Hz frames start when the crew launches from Act III's salvage dock,
 * so the global combat tick and inventory never reset. World bible S04 beats: an acceleration intro, then
 * one new craft per lesson. E13 dolphin pairs pulse their beacons, dive across each other's lanes and
 * stagger in the middle (double damage while they do). E14 couriers flicker their cargo light, then dash
 * across and drop a cargo mine that bursts into a ring. E15 eels light a short vertical barrier that only
 * its bright ends can damage. A convoy merge remix leads to the Courier guardian (see rainbowGuardian),
 * then the escort beat: a civilian courier pod runs the rails while the craft dive at it (the S04 choice,
 * rescuedCourier). Ten escalations follow, two of them surges where the whole current speeds up. A clean
 * run of Act IV takes about ten minutes. The TURN waits at the express terminal before B04 Delphion
 * (ACT-STRUCTURE: B04 dolphin fleet chooses freedom; the courier's fate is acknowledged). Wave ids start at
 * 3000 so Act IV formations never share a school with earlier Acts.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'
import {
  recutTimeline,
  reinforcements,
  withReinforcements,
} from './rainbowPacing'

export type RosefinEnemy = 'dolphin' | 'courier' | 'eel' | 'mortar'
export type RosefinStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type RosefinSceneId =
  'A04.OPEN' | 'A04.ESCORT' | 'A04.TURN' | 'A04.AFTER'
export type RosefinDialogue = { speaker: string; text: string }
export type RosefinWave = RainbowWave<RosefinEnemy>
export type RosefinSpawn = RainbowSpawn<RosefinEnemy>

const AUTHORED_ROSEFIN = {
  openingEnds: 300,
  turnStarts: 31500,
  bossStarts: 31800,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 3000,
  /** The salvage dock between Acts III and IV: A launches after dockMinFrames, or it launches itself. */
  dockMinFrames: 120,
  dockMaxFrames: 600,
} as const

const AUTHORED_ROSEFIN_SECTIONS = [
  { name: 'Express launch', from: 300, to: 1800 },
  { name: 'Dolphin pairs', from: 1800, to: 3300 },
  { name: 'Courier lanes', from: 3300, to: 4800 },
  { name: 'Eel gates', from: 4800, to: 6300 },
  { name: 'Convoy merge', from: 6300, to: 8100 },
  { name: 'Courier guardian', from: 8100, to: 9900 },
  { name: 'Convoy escort', from: 9900, to: 11700 },
  { name: 'Surge rails', from: 11700, to: 13500 },
  { name: 'Twin crossings', from: 13500, to: 15300 },
  { name: 'Eel weave', from: 15300, to: 17100 },
  { name: 'Courier rush', from: 17100, to: 18900 },
  { name: 'Aurora surge', from: 18900, to: 20700 },
  { name: 'Pod storm', from: 20700, to: 22500 },
  { name: 'Rail switch', from: 22500, to: 24300 },
  { name: 'Mirror pairs', from: 24300, to: 26100 },
  { name: 'Signal yard', from: 26100, to: 27900 },
  { name: 'Night freight', from: 27900, to: 29700 },
  { name: 'Terminus rails', from: 29700, to: 31500 },
] as const

/** The Courier guardian holds the Act after the convoy merge; no waves fly in its section. */
const AUTHORED_ROSEFIN_GUARDIAN: RainbowGuardianSection = {
  name: 'Courier guardian',
  from: 8100,
  to: 9900,
  kind: 'courier',
}

/**
 * The escort beat: two comms lines from commsFrom (after the guardian has stopped firing to escape), then
 * a civilian courier pod enters at podAppears and drifts across the rails. Enemy shots that touch it wear
 * its hull down; if it leaves the left edge intact the crew has rescued the courier.
 */
const AUTHORED_ROSEFIN_ESCORT = {
  commsFrom: 9708,
  podAppears: 10020,
  podY: 150,
  podSpeed: 0.42,
  podHull: 6,
  podRadius: 13,
  rescueScore: 1500,
} as const

/** Stretches where the whole express current surges: the background and craft speed up together. */
const AUTHORED_ROSEFIN_SURGES = [
  { from: 300, to: 1800, peak: 1.5 },
  { from: 11700, to: 13500, peak: 1.45 },
  { from: 18900, to: 20700, peak: 1.45 },
] as const

/** The current's speed on this frame: 1 at cruise, easing up to a surge's peak over two seconds. */
export function rosefinSpeed(frame: number): number {
  for (const surge of ROSEFIN_SURGES) {
    if (frame < surge.from || frame >= surge.to) continue
    const ease = Math.min(
      1,
      (frame - surge.from) / 120,
      (surge.to - frame) / 120,
    )
    return 1 + (surge.peak - 1) * ease
  }
  return 1
}

const AUTHORED_ROSEFIN_WAVES: readonly RosefinWave[] = [
  // Express launch: the current accelerates under the crew; lone dolphins ride it in.
  wave(420, 'dolphin', 'single', 1, 0.3),
  wave(660, 'dolphin', 'single', 1, 0.7),
  wave(900, 'dolphin', 'single', 1, 0.5),
  wave(1140, 'dolphin', 'single', 1, 0.25),
  wave(1380, 'dolphin', 'single', 1, 0.75),
  wave(1620, 'dolphin', 'single', 1, 0.5),
  // Dolphin pairs: mirrored pairs beacon, dive across each other and stagger in the middle.
  wave(1860, 'dolphin', 'pair', 2, 0.25),
  wave(2100, 'dolphin', 'pair', 2, 0.15),
  wave(2340, 'dolphin', 'pair', 2, 0.3),
  wave(2580, 'dolphin', 'pair', 4, 0.2),
  wave(2880, 'dolphin', 'pair', 2, 0.1),
  wave(3120, 'dolphin', 'pair', 4, 0.3),
  // Courier lanes: a courier flickers its cargo light, then dashes and drops a cargo mine.
  wave(3360, 'courier', 'single', 1, 0.5),
  wave(3600, 'courier', 'single', 1, 0.25),
  wave(3780, 'courier', 'single', 1, 0.75),
  wave(4020, 'courier', 'line', 2, 0.4),
  wave(4260, 'dolphin', 'pair', 2, 0.2),
  wave(4440, 'courier', 'stair', 3, 0.2),
  wave(4680, 'courier', 'single', 1, 0.6),
  // Eel gates: eels light a short barrier; slip round the bright ends, never through.
  wave(4860, 'eel', 'single', 1, 0.5),
  wave(5160, 'eel', 'single', 1, 0.25),
  wave(5400, 'eel', 'single', 1, 0.75),
  wave(5640, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(5940, 'dolphin', 'pair', 2, 0.2),
  wave(6120, 'eel', 'single', 1, 0.4),
  // Convoy merge: all three craft merge into the express lanes together.
  wave(6360, 'dolphin', 'pair', 2, 0.2),
  wave(6540, 'courier', 'single', 1, 0.5),
  wave(6720, 'eel', 'single', 1, 0.3),
  wave(6900, 'dolphin', 'pair', 4, 0.25),
  wave(7140, 'courier', 'line', 2, 0.7),
  wave(7320, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(7560, 'courier', 'stair', 3, 0.15),
  wave(7740, 'dolphin', 'pair', 2, 0.1),
  wave(7920, 'eel', 'single', 1, 0.6),
  // Convoy escort: a civilian courier pod runs the rails; dolphins dive at it, not at you.
  wave(10140, 'dolphin', 'pair', 2, 0.2),
  wave(10440, 'dolphin', 'pair', 2, 0.3),
  wave(10740, 'courier', 'single', 1, 0.3),
  wave(10980, 'dolphin', 'pair', 2, 0.15),
  wave(11220, 'eel', 'single', 1, 0.25),
  wave(11460, 'dolphin', 'pair', 2, 0.25),
  // Surge rails: the express surges: couriers stream past at full speed.
  wave(11760, 'courier', 'line', 3, 0.3),
  wave(12000, 'courier', 'line', 3, 0.7),
  wave(12240, 'dolphin', 'pair', 2, 0.2),
  wave(12480, 'courier', 'stair', 4, 0.15),
  wave(12720, 'courier', 'stair', 4, 0.85, { step: -1 }),
  wave(12960, 'dolphin', 'pair', 4, 0.25),
  wave(13200, 'courier', 'line', 3, 0.5),
  // Twin crossings: pair after pair, each crossing a different stretch of the rails.
  wave(13560, 'dolphin', 'pair', 2, 0.1),
  wave(13740, 'dolphin', 'pair', 2, 0.25),
  wave(13920, 'dolphin', 'pair', 2, 0.4),
  wave(14100, 'eel', 'single', 1, 0.5),
  wave(14340, 'dolphin', 'pair', 4, 0.15),
  wave(14580, 'dolphin', 'pair', 4, 0.3),
  wave(14820, 'courier', 'single', 1, 0.5),
  wave(15000, 'dolphin', 'pair', 2, 0.2),
  // Eel weave: eels high and low leave a weaving channel through the middle.
  wave(15360, 'eel', 'single', 1, 0.2),
  wave(15540, 'eel', 'single', 1, 0.8),
  wave(15720, 'eel', 'single', 1, 0.5),
  wave(15900, 'dolphin', 'pair', 2, 0.15),
  wave(16080, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(16320, 'eel', 'single', 1, 0.35),
  wave(16500, 'courier', 'single', 1, 0.75),
  wave(16680, 'eel', 'single', 1, 0.65),
  wave(16860, 'dolphin', 'pair', 2, 0.3),
  // Courier rush: couriers in columns and stairs, every cargo mine a ring to read.
  wave(17160, 'courier', 'column', 2, 0.5, { spread: 0.5 }),
  wave(17400, 'courier', 'stair', 3, 0.2),
  wave(17640, 'dolphin', 'pair', 2, 0.25),
  wave(17880, 'courier', 'line', 3, 0.4),
  wave(18120, 'eel', 'single', 1, 0.6),
  wave(18300, 'courier', 'column', 3, 0.5, { spread: 0.3 }),
  wave(18540, 'courier', 'stair', 3, 0.8, { step: -1 }),
  // Aurora surge: a second surge under the aurora; every craft at speed.
  wave(18960, 'dolphin', 'pair', 2, 0.2),
  wave(19140, 'courier', 'line', 3, 0.5),
  wave(19320, 'eel', 'single', 1, 0.3),
  wave(19500, 'dolphin', 'pair', 4, 0.15),
  wave(19740, 'courier', 'stair', 3, 0.2),
  wave(19920, 'eel', 'single', 1, 0.7),
  wave(20100, 'dolphin', 'pair', 2, 0.3),
  wave(20280, 'courier', 'line', 3, 0.6),
  wave(20460, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  // Pod storm: cargo mines everywhere: couriers drop them in the dolphins’ dive lanes.
  wave(20760, 'courier', 'single', 1, 0.3),
  wave(20880, 'courier', 'single', 1, 0.7),
  wave(21060, 'dolphin', 'pair', 2, 0.2),
  wave(21240, 'courier', 'line', 2, 0.5),
  wave(21420, 'dolphin', 'pair', 2, 0.35),
  wave(21600, 'courier', 'stair', 3, 0.15),
  wave(21840, 'dolphin', 'pair', 4, 0.2),
  wave(22080, 'courier', 'column', 2, 0.5, { spread: 0.5 }),
  wave(22260, 'eel', 'single', 1, 0.5),
  // Rail switch: eels switch the rails while dolphin pairs cross between them.
  wave(22560, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(22800, 'dolphin', 'pair', 2, 0.1),
  wave(22980, 'eel', 'single', 1, 0.5),
  wave(23220, 'dolphin', 'pair', 2, 0.3),
  wave(23400, 'eel', 'single', 1, 0.2),
  wave(23580, 'eel', 'single', 1, 0.8),
  wave(23760, 'courier', 'line', 2, 0.5),
  wave(23940, 'dolphin', 'pair', 4, 0.2),
  wave(24120, 'eel', 'single', 1, 0.4),
  // Mirror pairs: pairs in fours, with couriers threading the gap they leave.
  wave(24360, 'dolphin', 'pair', 4, 0.15),
  wave(24660, 'courier', 'single', 1, 0.5),
  wave(24840, 'dolphin', 'pair', 4, 0.3),
  wave(25140, 'courier', 'line', 2, 0.5),
  wave(25320, 'dolphin', 'pair', 4, 0.2),
  wave(25620, 'eel', 'single', 1, 0.5),
  wave(25800, 'dolphin', 'pair', 2, 0.1),
  // Signal yard: the convoy’s signal yard: every craft in turn, then together.
  wave(26160, 'dolphin', 'pair', 2, 0.25),
  wave(26340, 'courier', 'stair', 3, 0.2),
  wave(26580, 'eel', 'single', 1, 0.6),
  wave(26760, 'dolphin', 'pair', 4, 0.2),
  wave(27000, 'courier', 'line', 3, 0.4),
  wave(27180, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(27420, 'dolphin', 'pair', 2, 0.3),
  wave(27600, 'courier', 'column', 2, 0.5, { spread: 0.5 }),
  // Night freight: dark freight rails: couriers and eels from both edges.
  wave(27960, 'courier', 'stair', 3, 0.85, { step: -1 }),
  wave(28140, 'eel', 'single', 1, 0.25),
  wave(28320, 'courier', 'stair', 3, 0.15),
  wave(28500, 'eel', 'single', 1, 0.75),
  wave(28680, 'dolphin', 'pair', 4, 0.2),
  wave(28920, 'courier', 'line', 3, 0.5),
  wave(29100, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(29340, 'dolphin', 'pair', 2, 0.15),
  // Terminus rails: the last rails before the terminal, at full pressure.
  wave(29760, 'dolphin', 'pair', 4, 0.2),
  wave(30000, 'eel', 'single', 1, 0.5),
  wave(30180, 'courier', 'line', 3, 0.3),
  wave(30360, 'dolphin', 'pair', 2, 0.1),
  wave(30540, 'eel', 'column', 2, 0.5, { spread: 0.5 }),
  wave(30780, 'courier', 'stair', 4, 0.15),
  wave(30960, 'dolphin', 'pair', 4, 0.3),
  wave(31200, 'courier', 'line', 2, 0.6),
]

/**
 * Silas's playtest recut (conductor rainbow t-023, after Act I's in kind_robots#3806): Act IV keeps its
 * teaching sections, its guardian, every scripted moment and the escalations below; the sections listed
 * are cut out of its clock, and every later wave and event moves up by the time they took.
 */
const CUT = recutTimeline(
  AUTHORED_ROSEFIN_SECTIONS,
  [
    'Convoy merge',
    'Twin crossings',
    'Eel weave',
    'Courier rush',
    'Aurora surge',
    'Pod storm',
    'Rail switch',
    'Mirror pairs',
    'Signal yard',
    'Night freight',
  ],
  { [AUTHORED_ROSEFIN_GUARDIAN.name]: 1020 },
)
export const ROSEFIN = {
  ...AUTHORED_ROSEFIN,
  turnStarts: CUT.at(AUTHORED_ROSEFIN.turnStarts),
  bossStarts: CUT.at(AUTHORED_ROSEFIN.bossStarts),
} as const
export const ROSEFIN_ESCORT = {
  ...AUTHORED_ROSEFIN_ESCORT,
  // The escort comms close the guardian's section, so they keep their distance from its (stretched) end.
  commsFrom:
    CUT.at(AUTHORED_ROSEFIN_GUARDIAN.to) -
    (AUTHORED_ROSEFIN_GUARDIAN.to - AUTHORED_ROSEFIN_ESCORT.commsFrom),
  podAppears: CUT.at(AUTHORED_ROSEFIN_ESCORT.podAppears),
} as const
export const ROSEFIN_SECTIONS = CUT.sections
export const ROSEFIN_GUARDIAN: RainbowGuardianSection = {
  ...AUTHORED_ROSEFIN_GUARDIAN,
  from: CUT.at(AUTHORED_ROSEFIN_GUARDIAN.from),
  to: CUT.at(AUTHORED_ROSEFIN_GUARDIAN.to),
}
export const ROSEFIN_SURGES = AUTHORED_ROSEFIN_SURGES.filter((surge) =>
  CUT.kept(surge.from),
).map((surge) => ({ ...surge, from: CUT.at(surge.from), to: CUT.at(surge.to) }))
/** The recut keeps the teaching waves sparse; these schools of cheaper craft fill the rest (t-023). */
export const ROSEFIN_REINFORCEMENTS = reinforcements<RosefinWave['kind']>(
  CUT.sections,
  {
    kinds: ['dolphin', 'courier'],
    launcher: { kind: 'mortar', every: 1500 },
    pairs: true,
    every: {
      'Dolphin pairs': 300,
      'Courier lanes': 300,
      'Eel gates': 300,
      'Convoy escort': 360,
      'Surge rails': 420,
      'Terminus rails': 240,
    },
  },
)
export const ROSEFIN_WAVES: readonly RosefinWave[] = withReinforcements(
  CUT.waves(AUTHORED_ROSEFIN_WAVES),
  ROSEFIN_REINFORCEMENTS,
)

const schedule = buildFormationSchedule(ROSEFIN_WAVES, ROSEFIN.waveBase)

/** Craft per wave, by wave index, for the school bonus. */
export const ROSEFIN_WAVE_SIZES: readonly number[] = schedule.sizes

export function rosefinStage(
  frame: number,
  defeatedAt: number | null,
): RosefinStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < ROSEFIN.openingEnds) return 'opening'
  if (frame < ROSEFIN.turnStarts) return 'waves'
  if (frame < ROSEFIN.bossStarts) return 'turn'
  return 'boss'
}

/** Every craft that enters on this Act IV frame; empty outside the waves stage. */
export function rosefinSpawns(frame: number): readonly RosefinSpawn[] {
  return rosefinStage(frame, null) === 'waves' ? schedule.at(frame) : []
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function rosefinDialogue(
  id: RosefinSceneId,
  elapsed: number,
  players: number,
  rescuedCourier = false,
): RosefinDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<RosefinSceneId, RosefinDialogue[]> = {
    'A04.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Rosefin Express. Civilian convoys ride these light rails, and the current is speeding up.',
      },
      {
        speaker: lead,
        text: 'Then we ride it with them. Keep every shot off the convoy.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Dolphin craft ahead, flying in mirrored pairs. Watch their beacons.',
      },
    ],
    'A04.ESCORT': [
      {
        speaker: 'Lilt-7',
        text: 'A courier pod is running the rails alone, and the dolphins are turning toward it.',
      },
      {
        speaker: wing,
        text: 'Then we are its escort. Stay between it and the dives until it clears the rails.',
      },
    ],
    'A04.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'The express terminal. Delphion is herding the dolphin fleet into the rails.',
      },
      {
        speaker: wing,
        text: 'Those dolphins are not crews. They are the ships, and something is steering them.',
      },
      {
        speaker: lead,
        text: 'Break the coupling, not the dolphins. Let them choose their own current.',
      },
    ],
    'A04.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The coupling is broken. The dolphin fleet is scattering, free.',
      },
      {
        speaker: lead,
        text: rescuedCourier
          ? 'The courier made it through, and its route data points at the wreckyard.'
          : 'We lost the courier, but its route data survived. It points at the wreckyard.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Then the convoy leads us into the wreckage. Stay close together.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / ROSEFIN.lineFrames)] ?? null
}

export function rosefinScene(
  frame: number,
  defeatedFrame: number | null,
): { id: RosefinSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < ROSEFIN.aftermathFrames
      ? { id: 'A04.AFTER', elapsed }
      : null
  }
  if (frame < ROSEFIN.openingEnds) return { id: 'A04.OPEN', elapsed: frame }
  if (frame >= ROSEFIN_ESCORT.commsFrom && frame < ROSEFIN_GUARDIAN.to) {
    return { id: 'A04.ESCORT', elapsed: frame - ROSEFIN_ESCORT.commsFrom }
  }
  if (frame >= ROSEFIN.turnStarts && frame < ROSEFIN.bossStarts) {
    return { id: 'A04.TURN', elapsed: frame - ROSEFIN.turnStarts }
  }
  return null
}
