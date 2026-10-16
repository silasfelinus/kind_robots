/**
 * Act I director. One fixed tick is 1/60 s; no random or wall-clock scheduling.
 * A01.OPEN / TURN / AFTER play only in deliberately safe corridors.
 * The waves are authored formations (see rainbowFormations) in five sections that follow the world
 * bible's S01 beats: a picket school, spiral eddies, anchor mine corridors with one open lane, urchin
 * escorts, then a remix. Act I runs about four minutes; the full 10-15 minute pacing remains t-007 work.
 */
import {
  buildFormationSchedule,
  formationMembers,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'

export type PinkwakeEnemy = 'picket' | 'spiral' | 'anchor' | 'urchin'
export type PinkwakeSceneId = 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER'
export type PinkwakeStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type PinkwakeWave = RainbowWave<PinkwakeEnemy>
export type PinkwakeSpawn = RainbowSpawn<PinkwakeEnemy>

export const PINKWAKE = {
  openingEnds: 300,
  stationAppears: 2880,
  turnStarts: 8400,
  bossStarts: 8700,
  sceneLineFrames: 96,
  aftermathFrames: 390,
} as const

export const PINKWAKE_SECTIONS = [
  { name: 'Picket school', from: 300, to: 2100 },
  { name: 'Spiral eddies', from: 2100, to: 3900 },
  { name: 'Mine corridors', from: 3900, to: 5700 },
  { name: 'Urchin escort', from: 5700, to: 7200 },
  { name: 'Estuary remix', from: 7200, to: 8400 },
] as const

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
