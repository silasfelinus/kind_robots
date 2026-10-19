/**
 * Act I director. One fixed tick is 1/60 s; no random or wall-clock scheduling.
 * A01.OPEN / TURN / AFTER and Lilt's section callouts play only in deliberately safe corridors.
 * Silas's first playtest (2026-10-17: "too easy and too long", "monotonous", "we need obstacles") recut the
 * Act from eighteen sections and nine minutes to eight dense ones and about three and a half minutes to the
 * Pearl Seahorse: a picket school, spiral eddies, mine corridors, an urchin escort past the first coral
 * spires, the Urchin guardian (see rainbowGuardian; beaten early, the Act moves straight on), a diving shoal,
 * a coral chicane of spires to weave through, the pearl storm, and the seahorse wake. Craft fire more than
 * once, divers lock a pilot's lane and swoop, urchins take a beating, and the coral spires cannot be shot.
 */
import {
  buildFormationSchedule,
  formationMembers,
  laneY,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'
import { recutTimeline } from './rainbowPacing'

export type PinkwakeEnemy =
  'picket' | 'spiral' | 'anchor' | 'urchin' | 'diver' | 'spire' | 'mortar'
export type PinkwakeSceneId =
  'A01.OPEN' | 'A01.TURN' | 'A01.AFTER' | PinkwakeCalloutId
/** Lilt's short callouts as a section begins, so no stretch of the Act goes quiet. */
export type PinkwakeCalloutId =
  | 'A01.EDDIES'
  | 'A01.MINES'
  | 'A01.ESCORT'
  | 'A01.GUARD'
  | 'A01.DIVE'
  | 'A01.CORAL'
  | 'A01.STORM'
  | 'A01.WAKE'
export type PinkwakeStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type PinkwakeWave = RainbowWave<PinkwakeEnemy>
export type PinkwakeSpawn = RainbowSpawn<PinkwakeEnemy>

const AUTHORED_PINKWAKE = {
  openingEnds: 300,
  stationAppears: 2280,
  turnStarts: 12300,
  bossStarts: 12600,
  sceneLineFrames: 96,
  aftermathFrames: 390,
} as const

const AUTHORED_PINKWAKE_SECTIONS = [
  { name: 'Picket school', from: 300, to: 1500 },
  { name: 'Spiral eddies', from: 1500, to: 2700 },
  { name: 'Mine corridors', from: 2700, to: 3900 },
  { name: 'Urchin escort', from: 3900, to: 5100 },
  { name: 'Urchin guardian', from: 5100, to: 6600 },
  { name: 'Diving shoal', from: 6600, to: 7800 },
  { name: 'Coral chicane', from: 7800, to: 9300 },
  { name: 'Pearl storm', from: 9300, to: 10800 },
  { name: 'Seahorse wake', from: 10800, to: 12300 },
] as const

/** The Urchin guardian holds the Act between the urchin escort and the diving shoal; no waves fly in its section. */
const AUTHORED_PINKWAKE_GUARDIAN: RainbowGuardianSection = {
  name: 'Urchin guardian',
  from: 5100,
  to: 6600,
  kind: 'urchin',
}

const AUTHORED_PINKWAKE_WAVES: readonly PinkwakeWave[] = [
  // Picket school: twin schools and stairs from the first breath.
  wave(330, 'picket', 'vee', 5, 0.5),
  wave(480, 'picket', 'line', 4, 0.25),
  wave(560, 'picket', 'line', 4, 0.75),
  wave(720, 'picket', 'stair', 5, 0.1),
  wave(840, 'picket', 'stair', 5, 0.9, { step: -1 }),
  wave(960, 'picket', 'vee', 5, 0.3),
  wave(1020, 'picket', 'vee', 5, 0.7),
  wave(1140, 'picket', 'column', 4, 0.5, { spread: 0.2 }),
  wave(1260, 'picket', 'pair', 6, 0.15),
  wave(1380, 'picket', 'line', 5, 0.5),
  // Spiral eddies: weaving spirals firing in threes through picket files.
  wave(1560, 'spiral', 'pair', 2, 0.2),
  wave(1620, 'picket', 'line', 4, 0.6),
  wave(1740, 'spiral', 'vee', 3, 0.5),
  wave(1860, 'picket', 'stair', 5, 0.15),
  wave(1980, 'spiral', 'line', 3, 0.3),
  wave(1980, 'spiral', 'line', 3, 0.7),
  wave(2160, 'picket', 'vee', 5, 0.5),
  wave(2280, 'spiral', 'stair', 4, 0.2),
  wave(2400, 'picket', 'pair', 4, 0.2),
  wave(2460, 'spiral', 'column', 3, 0.5, { spread: 0.25 }),
  wave(2580, 'picket', 'line', 5, 0.4),
  // Mine corridors: mine walls with one open lane, each corridor holding craft.
  wave(2760, 'anchor', 'wall', 5, 0.3),
  wave(2880, 'picket', 'line', 3, 0.3),
  wave(3000, 'anchor', 'wall', 5, 0.7),
  wave(3120, 'spiral', 'single', 1, 0.7),
  wave(3240, 'anchor', 'wall', 5, 0.45),
  wave(3300, 'picket', 'line', 4, 0.45),
  wave(3480, 'anchor', 'wall', 5, 0.25),
  wave(3540, 'urchin', 'single', 1, 0.25),
  wave(3720, 'anchor', 'wall', 5, 0.65),
  wave(3780, 'picket', 'vee', 5, 0.65),
  // Urchin escort: tough urchins ringing pellets behind picket screens, the first coral spires.
  wave(3960, 'urchin', 'single', 1, 0.3),
  wave(3960, 'picket', 'column', 2, 0.3, { spread: 0.3 }),
  wave(4200, 'urchin', 'single', 1, 0.7),
  wave(4200, 'picket', 'column', 2, 0.7, { spread: 0.3 }),
  wave(4380, 'spiral', 'vee', 3, 0.5),
  wave(4500, 'urchin', 'pair', 2, 0.25),
  wave(4620, 'picket', 'stair', 5, 0.1),
  wave(4800, 'urchin', 'single', 1, 0.5),
  wave(4860, 'diver', 'line', 3, 0.2),
  wave(4980, 'picket', 'vee', 5, 0.5),
  // Diving shoal: red-finned divers lock a pilot's lane and swoop.
  wave(6660, 'diver', 'line', 4, 0.2),
  wave(6780, 'diver', 'line', 4, 0.8),
  wave(6900, 'picket', 'vee', 5, 0.5),
  wave(7020, 'diver', 'pair', 4, 0.15),
  wave(7140, 'spiral', 'stair', 4, 0.2),
  wave(7260, 'diver', 'line', 5, 0.5),
  wave(7380, 'urchin', 'single', 1, 0.5),
  wave(7440, 'diver', 'pair', 4, 0.3),
  wave(7560, 'picket', 'line', 5, 0.2),
  wave(7620, 'spiral', 'vee', 3, 0.7),
  wave(7700, 'diver', 'line', 4, 0.5),
  // Coral chicane: craft in the gaps between spires that close from above and below in turn.
  wave(7900, 'picket', 'line', 3, 0.85),
  wave(8050, 'picket', 'line', 3, 0.15),
  wave(8200, 'spiral', 'single', 1, 0.85),
  wave(8350, 'picket', 'line', 3, 0.15),
  wave(8500, 'urchin', 'single', 1, 0.85),
  wave(8650, 'diver', 'line', 3, 0.15),
  wave(8800, 'picket', 'line', 3, 0.85),
  wave(8950, 'spiral', 'single', 1, 0.15),
  wave(9100, 'picket', 'line', 3, 0.85),
  // Pearl storm: every Act I craft at once, the densest stretch before the Pearl Seahorse.
  wave(9330, 'picket', 'vee', 5, 0.3),
  wave(9330, 'picket', 'vee', 5, 0.7),
  wave(9480, 'spiral', 'stair', 5, 0.1),
  wave(9600, 'urchin', 'pair', 2, 0.25),
  wave(9660, 'diver', 'line', 4, 0.5),
  wave(9780, 'anchor', 'wall', 5, 0.5),
  wave(9900, 'spiral', 'vee', 5, 0.5),
  wave(10020, 'urchin', 'single', 1, 0.5),
  wave(10020, 'picket', 'pair', 6, 0.1),
  wave(10140, 'diver', 'pair', 4, 0.2),
  wave(10260, 'spiral', 'stair', 5, 0.9, { step: -1 }),
  wave(10380, 'picket', 'column', 4, 0.5, { spread: 0.22 }),
  wave(10500, 'urchin', 'pair', 2, 0.3),
  wave(10620, 'diver', 'line', 5, 0.5),
  wave(10680, 'picket', 'stair', 5, 0.1),
  // Seahorse wake: the Pearl Seahorse's escort school among the last spires.
  wave(10860, 'picket', 'vee', 5, 0.5),
  wave(10980, 'spiral', 'pair', 2, 0.15),
  wave(11100, 'anchor', 'wall', 5, 0.65),
  wave(11220, 'diver', 'line', 4, 0.3),
  wave(11340, 'urchin', 'pair', 2, 0.25),
  wave(11460, 'spiral', 'stair', 5, 0.9, { step: -1 }),
  wave(11580, 'picket', 'vee', 5, 0.3),
  wave(11580, 'picket', 'vee', 5, 0.7),
  wave(11820, 'urchin', 'single', 1, 0.5),
  wave(11940, 'diver', 'pair', 4, 0.2),
  wave(12060, 'picket', 'stair', 5, 0.9, { step: -1 }),
  wave(12180, 'spiral', 'vee', 3, 0.5),
  // Mortars (Silas's second playtest, 2026-10-19: "something that launches something else that explodes"): each
  // anchors in the right third and lobs shells that burst into bomblets, which burst again into fans.
  wave(4140, 'mortar', 'single', 1, 0.8),
  wave(7080, 'mortar', 'single', 1, 0.2),
  wave(9420, 'mortar', 'single', 1, 0.8),
  wave(10080, 'mortar', 'single', 1, 0.2),
  wave(11040, 'mortar', 'single', 1, 0.2),
  wave(11700, 'mortar', 'single', 1, 0.8),
]

/**
 * Coral spires: terrain, not craft. Each rises from the floor or hangs from the ceiling to its tip lane, drifts
 * with the current, soaks every shot and hurts a pilot who touches it, so the crew flies around it.
 */
export type PinkwakeSpire = { at: number; top: boolean; tip: number }
const AUTHORED_PINKWAKE_SPIRES: readonly PinkwakeSpire[] = [
  { at: 4080, top: false, tip: 0.62 },
  { at: 4440, top: true, tip: 0.38 },
  { at: 4740, top: false, tip: 0.62 },
  { at: 7830, top: true, tip: 0.6 },
  { at: 7980, top: false, tip: 0.4 },
  { at: 8130, top: true, tip: 0.6 },
  { at: 8280, top: false, tip: 0.4 },
  { at: 8430, top: true, tip: 0.6 },
  { at: 8580, top: false, tip: 0.4 },
  { at: 8730, top: true, tip: 0.6 },
  { at: 8880, top: false, tip: 0.4 },
  { at: 9030, top: true, tip: 0.6 },
  { at: 9180, top: false, tip: 0.4 },
  { at: 11040, top: false, tip: 0.62 },
  { at: 11400, top: true, tip: 0.38 },
  { at: 11760, top: false, tip: 0.62 },
]

/**
 * Silas's second playtest (2026-10-19): "The miniboss died too quick, really quick." The Urchin guardian is
 * tougher now (rainbowGuardian), so its section runs 22 seconds longer and everything after it moves back;
 * beaten early, it still hands the Act on at once.
 */
const CUT = recutTimeline(AUTHORED_PINKWAKE_SECTIONS, [], {
  'Urchin guardian': 1320,
})
export const PINKWAKE = {
  ...AUTHORED_PINKWAKE,
  stationAppears: CUT.at(AUTHORED_PINKWAKE.stationAppears),
  turnStarts: CUT.at(AUTHORED_PINKWAKE.turnStarts),
  bossStarts: CUT.at(AUTHORED_PINKWAKE.bossStarts),
} as const
export const PINKWAKE_SECTIONS = CUT.sections
export const PINKWAKE_GUARDIAN: RainbowGuardianSection = {
  ...AUTHORED_PINKWAKE_GUARDIAN,
  from: CUT.at(AUTHORED_PINKWAKE_GUARDIAN.from),
  to: CUT.at(AUTHORED_PINKWAKE_GUARDIAN.to),
}
export const PINKWAKE_WAVES: readonly PinkwakeWave[] = CUT.waves(
  AUTHORED_PINKWAKE_WAVES,
).sort((a, b) => a.at - b.at)
export const PINKWAKE_SPIRES: readonly PinkwakeSpire[] =
  AUTHORED_PINKWAKE_SPIRES.map((spire) => ({ ...spire, at: CUT.at(spire.at) }))
export const SPIRE = { halfWidth: 12, speed: 0.9 } as const

/** The coral spires that rise on this tick. */
export function pinkwakeSpires(
  tick: number,
): ReadonlyArray<{ top: boolean; y: number }> {
  return PINKWAKE_SPIRES.filter((spire) => spire.at === tick).map((spire) => ({
    top: spire.top,
    y: laneY(spire.tip),
  }))
}

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
    'A01.EDDIES': [
      {
        speaker: 'Lilt-7',
        text: 'Spiral craft riding the eddies. They fire in threes: slip between the pellets.',
      },
      { speaker: lead, text: 'Copy. Loose and fast.' },
    ],
    'A01.MINES': [
      {
        speaker: 'Lilt-7',
        text: 'Mine walls ahead, one open lane each. Clear the craft in the lane, then go.',
      },
      {
        speaker: partner,
        text:
          partner === lead
            ? 'Threading it. Count me through, Lilt.'
            : 'Single file. Follow my wake.',
      },
    ],
    'A01.ESCORT': [
      {
        speaker: 'Lilt-7',
        text: 'Urchins take a beating and ring the water with pearls. Coral spires too: those you fly around.',
      },
      { speaker: lead, text: 'Rocks I can respect. Urchins, less so.' },
    ],
    'A01.GUARD': [
      {
        speaker: 'Lilt-7',
        text: 'Big contact! An urchin guardian. Its ring always leaves a gap: find it.',
      },
      {
        speaker: partner,
        text:
          partner === lead
            ? 'I see the gap. Breaking it open.'
            : 'On your wing. Take it apart.',
      },
    ],
    'A01.DIVE': [
      {
        speaker: 'Lilt-7',
        text: 'Divers! Red fins lock onto your lane and swoop. Do not hold still.',
      },
      { speaker: lead, text: 'Never planned to.' },
    ],
    'A01.CORAL': [
      {
        speaker: 'Lilt-7',
        text: 'Coral chicane. The spires close from above, then below: weave, do not ram.',
      },
      {
        speaker: partner,
        text:
          partner === lead
            ? 'Up, down, up. I have the rhythm.'
            : 'Up, down, up. Stay in my rhythm.',
      },
    ],
    'A01.STORM': [
      {
        speaker: 'Lilt-7',
        text: 'Everything in the estuary is coming at once. The Seahorse is close behind it.',
      },
      { speaker: lead, text: 'Then we answer with everything we have.' },
    ],
    'A01.WAKE': [
      {
        speaker: 'Lilt-7',
        text: 'The Pearl Seahorse is calling its escort home. Last school before the fight.',
      },
      {
        speaker: partner,
        text:
          partner === lead
            ? 'Shields up. Here it comes.'
            : 'Form up. Shields up.',
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

/** Lilt's callouts, at the start of each section after the first. */
const AUTHORED_PINKWAKE_CALLOUTS: ReadonlyArray<
  readonly [number, PinkwakeCalloutId]
> = [
  [1500, 'A01.EDDIES'],
  [2700, 'A01.MINES'],
  [3900, 'A01.ESCORT'],
  [5100, 'A01.GUARD'],
  [6600, 'A01.DIVE'],
  [7800, 'A01.CORAL'],
  [9300, 'A01.STORM'],
  [10800, 'A01.WAKE'],
]
export const PINKWAKE_CALLOUTS: ReadonlyArray<
  readonly [number, PinkwakeCalloutId]
> = AUTHORED_PINKWAKE_CALLOUTS.map(
  ([frame, id]) => [CUT.at(frame), id] as const,
)

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
  for (const [from, id] of PINKWAKE_CALLOUTS) {
    const elapsed = tick - from
    if (elapsed >= 0 && elapsed < 2 * PINKWAKE.sceneLineFrames)
      return { id, elapsed }
  }
  if (tick >= PINKWAKE.turnStarts && tick < PINKWAKE.bossStarts) {
    return { id: 'A01.TURN', elapsed: tick - PINKWAKE.turnStarts }
  }
  return null
}
