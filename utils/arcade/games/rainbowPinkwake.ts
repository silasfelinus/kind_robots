/**
 * Act I director. One fixed tick is 1/60 s; no random or wall-clock scheduling.
 * A01.OPEN / TURN / AFTER play only in deliberately safe corridors.
 * The waves are authored formations (see rainbowFormations) in eighteen sections that follow the world
 * bible's S01 beats: a picket school, spiral eddies, anchor mine corridors with one open lane, urchin
 * escorts and a remix, the Urchin guardian (see rainbowGuardian), then twelve escalations (buoy shoal,
 * riptide run, pearl storm, coral chicane, urchin nursery, tidal crescendo, glass buoy maze, pearl
 * rain, mirror shallows, anchor bloom, moon gate, seahorse wake). A clean run of Act I takes about ten
 * minutes; verifyRainbowFirstClear measures ordinary pilots against the world bible's 10-15 minute
 * per-Act target.
 */
import {
  buildFormationSchedule,
  formationMembers,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type PinkwakeEnemy = 'picket' | 'spiral' | 'anchor' | 'urchin'
export type PinkwakeSceneId = 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER'
export type PinkwakeStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type PinkwakeWave = RainbowWave<PinkwakeEnemy>
export type PinkwakeSpawn = RainbowSpawn<PinkwakeEnemy>

export const PINKWAKE = {
  openingEnds: 300,
  stationAppears: 2880,
  turnStarts: 31800,
  bossStarts: 32100,
  sceneLineFrames: 96,
  aftermathFrames: 390,
} as const

export const PINKWAKE_SECTIONS = [
  { name: 'Picket school', from: 300, to: 2100 },
  { name: 'Spiral eddies', from: 2100, to: 3900 },
  { name: 'Mine corridors', from: 3900, to: 5700 },
  { name: 'Urchin escort', from: 5700, to: 7200 },
  { name: 'Estuary remix', from: 7200, to: 8400 },
  { name: 'Urchin guardian', from: 8400, to: 10200 },
  { name: 'Buoy shoal', from: 10200, to: 12000 },
  { name: 'Riptide run', from: 12000, to: 13800 },
  { name: 'Pearl storm', from: 13800, to: 15600 },
  { name: 'Coral chicane', from: 15600, to: 17400 },
  { name: 'Urchin nursery', from: 17400, to: 19200 },
  { name: 'Tidal crescendo', from: 19200, to: 21000 },
  { name: 'Glass buoy maze', from: 21000, to: 22800 },
  { name: 'Pearl rain', from: 22800, to: 24600 },
  { name: 'Mirror shallows', from: 24600, to: 26400 },
  { name: 'Anchor bloom', from: 26400, to: 28200 },
  { name: 'Moon gate', from: 28200, to: 30000 },
  { name: 'Seahorse wake', from: 30000, to: 31800 },
] as const

/** The Urchin guardian holds the Act between the Estuary remix and the escalations; no waves fly in its section. */
export const PINKWAKE_GUARDIAN: RainbowGuardianSection = {
  name: 'Urchin guardian',
  from: 8400,
  to: 10200,
  kind: 'urchin',
}

export const PINKWAKE_WAVES: readonly PinkwakeWave[] = [
  wave(360, 'picket', 'line', 3, 0.3),
  wave(540, 'picket', 'line', 3, 0.7),
  wave(720, 'picket', 'vee', 5, 0.5),
  wave(960, 'picket', 'column', 3, 0.5),
  wave(1140, 'picket', 'line', 4, 0.2),
  wave(1320, 'picket', 'line', 4, 0.8),
  wave(1500, 'picket', 'vee', 5, 0.5),
  wave(1680, 'picket', 'pair', 4, 0.2),
  wave(1860, 'picket', 'stair', 5, 0.15),
  wave(2040, 'picket', 'stair', 5, 0.85, { step: -1 }),
  wave(2160, 'spiral', 'single', 1, 0.5),
  wave(2340, 'spiral', 'pair', 2, 0.25),
  wave(2520, 'spiral', 'line', 2, 0.3),
  wave(2520, 'picket', 'line', 3, 0.75),
  wave(2700, 'spiral', 'vee', 3, 0.45),
  wave(2940, 'picket', 'line', 3, 0.25),
  wave(3060, 'spiral', 'column', 2, 0.35),
  wave(3240, 'picket', 'line', 3, 0.5),
  wave(3300, 'spiral', 'pair', 2, 0.2),
  wave(3480, 'spiral', 'stair', 4, 0.2),
  wave(3720, 'picket', 'vee', 5, 0.5),
  wave(3960, 'anchor', 'wall', 5, 0.2),
  wave(4260, 'anchor', 'wall', 5, 0.8),
  wave(4500, 'picket', 'line', 3, 0.5),
  wave(4620, 'anchor', 'wall', 5, 0.5),
  wave(4920, 'anchor', 'wall', 5, 0.3),
  wave(5040, 'spiral', 'single', 1, 0.3),
  wave(5220, 'anchor', 'wall', 5, 0.7),
  wave(5460, 'anchor', 'pair', 2, 0.15),
  wave(5460, 'picket', 'vee', 5, 0.5),
  wave(5760, 'urchin', 'single', 1, 0.5),
  wave(5760, 'picket', 'column', 2, 0.5, { spread: 0.3 }),
  wave(6060, 'urchin', 'single', 1, 0.3),
  wave(6060, 'picket', 'column', 2, 0.3, { spread: 0.3 }),
  wave(6360, 'urchin', 'single', 1, 0.7),
  wave(6360, 'picket', 'column', 2, 0.7, { spread: 0.3 }),
  wave(6660, 'urchin', 'pair', 2, 0.25),
  wave(6660, 'spiral', 'single', 1, 0.5),
  wave(6960, 'urchin', 'single', 1, 0.5),
  wave(6960, 'picket', 'pair', 4, 0.2),
  wave(7260, 'anchor', 'wall', 5, 0.5),
  wave(7440, 'spiral', 'pair', 2, 0.2),
  wave(7440, 'picket', 'line', 3, 0.5),
  wave(7620, 'urchin', 'single', 1, 0.3),
  wave(7620, 'anchor', 'single', 1, 0.75),
  wave(7800, 'picket', 'vee', 5, 0.5),
  wave(7860, 'spiral', 'pair', 2, 0.15),
  wave(8040, 'urchin', 'pair', 2, 0.3),
  wave(8220, 'picket', 'stair', 5, 0.1),
  // Buoy shoal: the school returns faster and doubled, with spirals cutting across it.
  wave(10260, 'picket', 'vee', 5, 0.3),
  wave(10440, 'picket', 'vee', 5, 0.7),
  wave(10620, 'spiral', 'line', 3, 0.5),
  wave(10740, 'picket', 'pair', 4, 0.15),
  wave(10920, 'spiral', 'stair', 4, 0.8, { step: -1 }),
  wave(11100, 'picket', 'column', 4, 0.5, { spread: 0.22 }),
  wave(11280, 'spiral', 'pair', 4, 0.3),
  wave(11460, 'picket', 'line', 5, 0.2),
  wave(11460, 'picket', 'line', 5, 0.8),
  wave(11700, 'spiral', 'vee', 5, 0.5),
  wave(11880, 'picket', 'stair', 5, 0.9, { step: -1 }),
  // Riptide run: mine walls whose corridor holds a picket file to clear before you pass.
  wave(12060, 'anchor', 'wall', 5, 0.35),
  wave(12240, 'picket', 'line', 3, 0.35),
  wave(12420, 'anchor', 'wall', 5, 0.65),
  wave(12600, 'urchin', 'single', 1, 0.65),
  wave(12780, 'anchor', 'wall', 5, 0.5),
  wave(12900, 'picket', 'line', 3, 0.5),
  wave(13080, 'anchor', 'wall', 5, 0.25),
  wave(13200, 'urchin', 'single', 1, 0.25),
  wave(13380, 'anchor', 'wall', 5, 0.75),
  wave(13500, 'picket', 'line', 4, 0.75),
  wave(13680, 'urchin', 'pair', 2, 0.2),
  // Pearl storm: every Act I craft at once, the densest stretch before the Pearl Seahorse.
  wave(13860, 'picket', 'vee', 5, 0.5),
  wave(13980, 'spiral', 'pair', 2, 0.15),
  wave(14100, 'urchin', 'single', 1, 0.5),
  wave(14100, 'picket', 'column', 2, 0.5, { spread: 0.36 }),
  wave(14280, 'anchor', 'pair', 2, 0.2),
  wave(14400, 'spiral', 'stair', 5, 0.1),
  wave(14580, 'picket', 'line', 5, 0.6),
  wave(14700, 'urchin', 'pair', 2, 0.3),
  wave(14880, 'spiral', 'vee', 5, 0.5),
  wave(15060, 'anchor', 'wall', 5, 0.5),
  wave(15180, 'picket', 'line', 4, 0.5),
  wave(15360, 'picket', 'stair', 5, 0.85, { step: -1 }),
  // Coral chicane: mine walls whose open lane swings top to bottom, each corridor holding a craft.
  wave(15660, 'anchor', 'wall', 5, 0.2),
  wave(15840, 'picket', 'line', 3, 0.2),
  wave(15960, 'anchor', 'wall', 5, 0.8),
  wave(16140, 'picket', 'line', 3, 0.8),
  wave(16260, 'anchor', 'wall', 5, 0.35),
  wave(16440, 'spiral', 'single', 1, 0.35),
  wave(16560, 'anchor', 'wall', 5, 0.65),
  wave(16740, 'picket', 'line', 3, 0.65),
  wave(16860, 'anchor', 'wall', 5, 0.5),
  wave(17040, 'urchin', 'single', 1, 0.5),
  wave(17220, 'picket', 'vee', 5, 0.5),
  // Urchin nursery: urchins in pairs behind picket screens, spirals stepping across both ways.
  wave(17460, 'urchin', 'pair', 2, 0.25),
  wave(17460, 'picket', 'column', 3, 0.5, { spread: 0.2 }),
  wave(17700, 'spiral', 'stair', 4, 0.15),
  wave(17880, 'urchin', 'single', 1, 0.5),
  wave(17880, 'picket', 'pair', 4, 0.15),
  wave(18120, 'spiral', 'stair', 4, 0.85, { step: -1 }),
  wave(18300, 'urchin', 'pair', 2, 0.35),
  wave(18480, 'picket', 'vee', 5, 0.5),
  wave(18660, 'urchin', 'single', 1, 0.2),
  wave(18660, 'spiral', 'pair', 2, 0.4),
  wave(18900, 'picket', 'line', 5, 0.5),
  wave(19020, 'urchin', 'pair', 2, 0.15),
  // Tidal crescendo: twin schools, crossing stairs and a mine wall.
  wave(19260, 'picket', 'vee', 5, 0.3),
  wave(19260, 'picket', 'vee', 5, 0.7),
  wave(19500, 'spiral', 'stair', 5, 0.1),
  wave(19680, 'anchor', 'wall', 5, 0.5),
  wave(19800, 'urchin', 'single', 1, 0.5),
  wave(19980, 'spiral', 'stair', 5, 0.9, { step: -1 }),
  wave(20160, 'picket', 'pair', 4, 0.2),
  wave(20340, 'urchin', 'pair', 2, 0.3),
  wave(20340, 'spiral', 'single', 1, 0.5),
  wave(20520, 'anchor', 'wall', 5, 0.3),
  wave(20640, 'picket', 'line', 4, 0.3),
  wave(20820, 'picket', 'stair', 5, 0.1),
  // Glass buoy maze: back-to-back mine walls whose open lanes step one notch at a time, so the ship
  // threads a staircase corridor, with spirals drifting through the open lane.
  wave(21060, 'anchor', 'wall', 5, 0.15),
  wave(21240, 'anchor', 'wall', 5, 0.3),
  wave(21360, 'spiral', 'single', 1, 0.3),
  wave(21420, 'anchor', 'wall', 5, 0.45),
  wave(21600, 'anchor', 'wall', 5, 0.6),
  wave(21720, 'spiral', 'single', 1, 0.6),
  wave(21780, 'anchor', 'wall', 5, 0.75),
  wave(21960, 'picket', 'line', 4, 0.75),
  wave(22140, 'anchor', 'wall', 5, 0.55),
  wave(22320, 'anchor', 'wall', 5, 0.35),
  wave(22500, 'picket', 'vee', 5, 0.35),
  // Pearl rain: urchins fall into formation behind columns of pickets, the densest urchin stretch.
  wave(22860, 'urchin', 'single', 1, 0.2),
  wave(22860, 'urchin', 'single', 1, 0.8),
  wave(23040, 'picket', 'column', 4, 0.5, { spread: 0.22 }),
  wave(23220, 'urchin', 'pair', 2, 0.3),
  wave(23400, 'spiral', 'vee', 5, 0.5),
  wave(23580, 'urchin', 'single', 1, 0.5),
  wave(23580, 'picket', 'pair', 4, 0.1),
  wave(23760, 'spiral', 'stair', 5, 0.85, { step: -1 }),
  wave(23940, 'urchin', 'pair', 2, 0.2),
  wave(24120, 'picket', 'column', 4, 0.5, { spread: 0.22 }),
  wave(24300, 'urchin', 'single', 1, 0.35),
  wave(24420, 'spiral', 'stair', 5, 0.1),
  // Mirror shallows: picket pairs mirror each other top and bottom, closing on the middle lanes.
  wave(24660, 'picket', 'pair', 4, 0.1),
  wave(24840, 'picket', 'pair', 4, 0.2),
  wave(25020, 'picket', 'pair', 4, 0.3),
  wave(25200, 'spiral', 'single', 1, 0.5),
  wave(25320, 'picket', 'pair', 4, 0.15),
  wave(25500, 'urchin', 'single', 1, 0.5),
  wave(25680, 'spiral', 'pair', 2, 0.25),
  wave(25860, 'picket', 'pair', 4, 0.35),
  wave(26040, 'spiral', 'vee', 5, 0.5),
  wave(26220, 'picket', 'line', 4, 0.5),
  // Anchor bloom: mine walls with an urchin waiting in each open lane.
  wave(26460, 'anchor', 'wall', 5, 0.3),
  wave(26580, 'urchin', 'single', 1, 0.3),
  wave(26760, 'anchor', 'wall', 5, 0.7),
  wave(26880, 'urchin', 'single', 1, 0.7),
  wave(27060, 'picket', 'vee', 5, 0.5),
  wave(27240, 'anchor', 'wall', 5, 0.5),
  wave(27360, 'urchin', 'pair', 2, 0.25),
  wave(27540, 'spiral', 'stair', 5, 0.1),
  wave(27720, 'anchor', 'wall', 5, 0.2),
  wave(27840, 'picket', 'line', 4, 0.2),
  wave(28020, 'urchin', 'single', 1, 0.6),
  // Moon gate: crossing spiral stairs frame a picket column, then a last mine gate.
  wave(28260, 'picket', 'vee', 5, 0.5),
  wave(28440, 'spiral', 'stair', 4, 0.15),
  wave(28620, 'spiral', 'stair', 4, 0.85, { step: -1 }),
  wave(28800, 'urchin', 'pair', 2, 0.3),
  wave(28980, 'picket', 'column', 4, 0.5, { spread: 0.22 }),
  wave(29160, 'anchor', 'wall', 5, 0.65),
  wave(29280, 'picket', 'line', 3, 0.65),
  wave(29460, 'spiral', 'vee', 5, 0.3),
  wave(29640, 'urchin', 'single', 1, 0.5),
  wave(29640, 'picket', 'pair', 4, 0.1),
  wave(29820, 'spiral', 'pair', 2, 0.2),
  // Seahorse wake: the Pearl Seahorse's escort school, every Act I craft one last time.
  wave(30060, 'picket', 'vee', 5, 0.5),
  wave(30180, 'spiral', 'pair', 2, 0.15),
  wave(30360, 'anchor', 'wall', 5, 0.65),
  wave(30480, 'picket', 'line', 4, 0.65),
  wave(30660, 'urchin', 'pair', 2, 0.25),
  wave(30840, 'spiral', 'stair', 5, 0.9, { step: -1 }),
  wave(31020, 'picket', 'vee', 5, 0.3),
  wave(31020, 'picket', 'vee', 5, 0.7),
  wave(31260, 'anchor', 'wall', 5, 0.5),
  wave(31380, 'urchin', 'single', 1, 0.5),
  wave(31560, 'picket', 'stair', 5, 0.9, { step: -1 }),
]

export const pinkwakeFormation = formationMembers<PinkwakeEnemy>

const schedule = buildFormationSchedule(PINKWAKE_WAVES)

/** Craft per wave, by wave index, for the school bonus. */
export const PINKWAKE_WAVE_SIZES: readonly number[] = schedule.sizes

export function pinkwakeStage(
  tick: number,
  defeatedAt: number | null,
): PinkwakeStage {
  if (defeatedAt !== null) return 'aftermath'
  if (tick < PINKWAKE.openingEnds) return 'opening'
  if (tick < PINKWAKE.turnStarts) return 'waves'
  if (tick < PINKWAKE.bossStarts) return 'turn'
  return 'boss'
}

/** Every craft that enters on this tick; empty outside the waves stage. */
export function pinkwakeSpawns(tick: number): readonly PinkwakeSpawn[] {
  if (tick < PINKWAKE.openingEnds || tick >= PINKWAKE.turnStarts) return []
  return schedule.at(tick)
}

export type PinkwakeDialogue = { speaker: string; text: string }
const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function pinkwakeDialogue(
  scene: PinkwakeSceneId,
  elapsed: number,
  playerCount: number,
  rescuedStation: boolean,
): PinkwakeDialogue | null {
  const pilots = PILOTS.slice(0, Math.max(1, Math.min(4, playerCount)))
  const lead = pilots[0]!
  const partner = pilots[pilots.length - 1]!
  const lines: Record<PinkwakeSceneId, PinkwakeDialogue[]> = {
    'A01.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Pinkwake Estuary ahead. Rescue beacons are answering with weapons fire.',
      },
      {
        speaker: lead,
        text: 'Then we fly close enough to learn why. Keep the civilians behind us.',
      },
      {
        speaker: partner === lead ? 'Lilt-7' : partner,
        text:
          partner === lead
            ? 'I will count safe passages. You provide the improbable part.'
            : 'I vote we ask politely, with our engines running.',
      },
    ],
    'A01.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'Hold fire a moment. The Pearl Seahorse carries a living escape pod.',
      },
      {
        speaker: partner,
        text: 'That changes everything. Target its weapons, not the passenger.',
      },
      {
        speaker: lead,
        text: rescuedStation
          ? 'Our station survivors can guide that pod out. We bring it home.'
          : 'We missed the station beacon. We can still bring this pod home.',
      },
    ],
    'A01.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The pod is free. Its distress signal was hidden beneath a command pulse.',
      },
      {
        speaker: lead,
        text: 'So the fleet is trapped, not invading. We rescue them one ship at a time.',
      },
      {
        speaker: partner === lead ? 'Lilt-7' : partner,
        text:
          partner === lead
            ? 'Plotting the Moonjelly Fields. I believe our mission just changed.'
            : 'Then onward. And nobody gets left in the wake.',
      },
    ],
  }
  const index = Math.floor(elapsed / PINKWAKE.sceneLineFrames)
  return lines[scene][index] ?? null
}

export function pinkwakeScene(
  tick: number,
  defeatedAt: number | null,
): { id: PinkwakeSceneId; elapsed: number } | null {
  if (defeatedAt !== null) {
    const elapsed = tick - defeatedAt
    return elapsed < PINKWAKE.aftermathFrames
      ? { id: 'A01.AFTER', elapsed }
      : null
  }
  if (tick < PINKWAKE.openingEnds) return { id: 'A01.OPEN', elapsed: tick }
  if (tick >= PINKWAKE.turnStarts && tick < PINKWAKE.bossStarts) {
    return { id: 'A01.TURN', elapsed: tick - PINKWAKE.turnStarts }
  }
  return null
}
