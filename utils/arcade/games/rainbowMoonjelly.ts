/**
 * Authored Act II encounter director. Uses local 60 Hz frames after the
 * Pinkwake aftermath, so the global combat tick and inventory never reset.
 * The waves are authored formations (see rainbowFormations) in eighteen sections that follow the world
 * bible's S02 beats: the lantern gap lesson, linked relays, skimmer bead rain, breakable coral cover
 * and a bell remix, the Lantern guardian (see rainbowGuardian), then twelve escalations (tendril maze,
 * lantern lattice, moonrise surge, bell canyon, relay storm, bell veil, tendril crossing, lantern
 * choir, glow drift, coral orchard, tide of bells, colony wake). Wave ids start at 1000 so Act II
 * formations never share a school with Act I.
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

export type MoonjellyEnemy =
  'lantern' | 'relay' | 'skimmer' | 'coral' | 'mortar'
export type MoonjellyStage =
  'opening' | 'waves' | 'turn' | 'remix' | 'approach' | 'boss' | 'aftermath'
export type MoonjellySceneId = 'A02.OPEN' | 'A02.TURN' | 'A02.AFTER'
export type MoonjellyDialogue = { speaker: string; text: string }
export type MoonjellyWave = RainbowWave<MoonjellyEnemy>
export type MoonjellySpawn = RainbowSpawn<MoonjellyEnemy>

const AUTHORED_MOONJELLY = {
  openingEnds: 300,
  nemiAppears: 1680,
  turnStarts: 3900,
  turnEnds: 4200,
  approachStarts: 30300,
  bossStarts: 30600,
  aftermathFrames: 360,
  lineFrames: 96,
  waveBase: 1000,
} as const

const AUTHORED_MOONJELLY_SECTIONS = [
  { name: 'Lantern gap lesson', from: 300, to: 1500 },
  { name: 'Relay links', from: 1500, to: 2700 },
  { name: 'Skimmer rain', from: 2700, to: 3900 },
  { name: 'Coral cover', from: 4200, to: 5700 },
  { name: 'Bell remix', from: 5700, to: 6900 },
  { name: 'Lantern guardian', from: 6900, to: 8700 },
  { name: 'Tendril maze', from: 8700, to: 10500 },
  { name: 'Lantern lattice', from: 10500, to: 12300 },
  { name: 'Moonrise surge', from: 12300, to: 14100 },
  { name: 'Bell canyon', from: 14100, to: 15900 },
  { name: 'Relay storm', from: 15900, to: 17700 },
  { name: 'Bell veil', from: 17700, to: 19500 },
  { name: 'Tendril crossing', from: 19500, to: 21300 },
  { name: 'Lantern choir', from: 21300, to: 23100 },
  { name: 'Glow drift', from: 23100, to: 24900 },
  { name: 'Coral orchard', from: 24900, to: 26700 },
  { name: 'Tide of bells', from: 26700, to: 28500 },
  { name: 'Colony wake', from: 28500, to: 30300 },
] as const

/** The Lantern guardian holds the Act between the Bell remix and the escalations; no waves fly in its section. */
const AUTHORED_MOONJELLY_GUARDIAN: RainbowGuardianSection = {
  name: 'Lantern guardian',
  from: 6900,
  to: 8700,
  kind: 'lantern',
}

const AUTHORED_MOONJELLY_WAVES: readonly MoonjellyWave[] = [
  wave(330, 'lantern', 'single', 1, 0.5),
  wave(540, 'lantern', 'pair', 2, 0.25),
  wave(780, 'lantern', 'single', 1, 0.3),
  wave(900, 'lantern', 'single', 1, 0.7),
  wave(1080, 'lantern', 'pair', 2, 0.2),
  wave(1320, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(1560, 'relay', 'line', 3, 0.25),
  wave(1800, 'relay', 'line', 3, 0.3),
  wave(1980, 'relay', 'column', 3, 0.5),
  wave(2160, 'relay', 'vee', 3, 0.5),
  wave(2340, 'relay', 'pair', 4, 0.2),
  wave(2520, 'lantern', 'single', 1, 0.5),
  wave(2520, 'relay', 'line', 3, 0.15),
  wave(2760, 'skimmer', 'line', 4, 0.15),
  wave(2940, 'skimmer', 'line', 4, 0.3),
  wave(3120, 'skimmer', 'stair', 5, 0.1),
  wave(3360, 'skimmer', 'pair', 4, 0.2),
  wave(3600, 'skimmer', 'line', 3, 0.15),
  wave(3600, 'lantern', 'single', 1, 0.7),
  wave(3780, 'skimmer', 'vee', 5, 0.3),
  wave(4260, 'coral', 'wall', 3, 0.5),
  wave(4500, 'relay', 'line', 3, 0.5),
  wave(4740, 'coral', 'wall', 4, 0.3),
  wave(4980, 'lantern', 'pair', 2, 0.3),
  wave(5160, 'coral', 'wall', 4, 0.7),
  wave(5400, 'relay', 'column', 3, 0.5),
  wave(5400, 'skimmer', 'line', 3, 0.15),
  wave(5760, 'lantern', 'single', 1, 0.5),
  wave(5760, 'relay', 'pair', 2, 0.2),
  wave(6000, 'coral', 'wall', 3, 0.4),
  wave(6240, 'skimmer', 'stair', 5, 0.1),
  wave(6480, 'relay', 'vee', 5, 0.5),
  wave(6720, 'lantern', 'pair', 2, 0.25),
  // Tendril maze: coral walls whose corridors hold relay files, with skimmer rain over the top.
  wave(8760, 'coral', 'wall', 4, 0.5),
  wave(8940, 'relay', 'line', 3, 0.5),
  wave(9120, 'skimmer', 'line', 4, 0.15),
  wave(9300, 'coral', 'wall', 4, 0.3),
  wave(9420, 'relay', 'line', 3, 0.3),
  wave(9660, 'coral', 'wall', 4, 0.7),
  wave(9780, 'relay', 'line', 3, 0.7),
  wave(9960, 'skimmer', 'stair', 5, 0.1),
  wave(10200, 'lantern', 'single', 1, 0.5),
  wave(10320, 'relay', 'pair', 4, 0.2),
  // Lantern lattice: two lanterns' fans at once, so the gap lesson becomes a gap choice.
  wave(10560, 'lantern', 'pair', 2, 0.3),
  wave(10740, 'relay', 'vee', 5, 0.5),
  wave(10920, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(11100, 'relay', 'column', 3, 0.5),
  wave(11280, 'skimmer', 'line', 4, 0.2),
  wave(11460, 'lantern', 'single', 1, 0.25),
  wave(11460, 'relay', 'line', 3, 0.75),
  wave(11700, 'lantern', 'pair', 2, 0.2),
  wave(11880, 'relay', 'stair', 5, 0.15),
  wave(12060, 'skimmer', 'vee', 5, 0.3),
  // Moonrise surge: every Act II craft, building to the Aurelia Array.
  wave(12360, 'relay', 'vee', 5, 0.5),
  wave(12540, 'coral', 'wall', 3, 0.5),
  wave(12660, 'skimmer', 'line', 4, 0.1),
  wave(12840, 'lantern', 'pair', 2, 0.25),
  wave(13020, 'relay', 'column', 4, 0.5, { spread: 0.2 }),
  wave(13200, 'coral', 'wall', 4, 0.35),
  wave(13320, 'relay', 'line', 3, 0.35),
  wave(13500, 'skimmer', 'stair', 5, 0.1),
  wave(13680, 'lantern', 'single', 1, 0.5),
  wave(13680, 'relay', 'pair', 4, 0.15),
  wave(13860, 'skimmer', 'vee', 5, 0.3),
  // Bell canyon: coral walls open high, then low, each gap guarded by a lantern's fan.
  wave(14160, 'coral', 'wall', 4, 0.2),
  wave(14340, 'lantern', 'single', 1, 0.2),
  wave(14520, 'coral', 'wall', 4, 0.8),
  wave(14700, 'lantern', 'single', 1, 0.8),
  wave(14880, 'relay', 'vee', 5, 0.5),
  wave(15060, 'coral', 'wall', 4, 0.5),
  wave(15240, 'relay', 'line', 3, 0.5),
  wave(15420, 'skimmer', 'line', 4, 0.15),
  wave(15600, 'lantern', 'pair', 2, 0.25),
  wave(15720, 'relay', 'column', 3, 0.5),
  // Relay storm: relay files crossing in both directions under skimmer rain.
  wave(15960, 'relay', 'stair', 5, 0.1),
  wave(16140, 'relay', 'stair', 5, 0.9, { step: -1 }),
  wave(16320, 'skimmer', 'vee', 5, 0.5),
  wave(16500, 'relay', 'column', 4, 0.5, { spread: 0.2 }),
  wave(16680, 'lantern', 'single', 1, 0.5),
  wave(16800, 'relay', 'pair', 4, 0.15),
  wave(16980, 'skimmer', 'line', 4, 0.85),
  wave(17160, 'relay', 'vee', 5, 0.3),
  wave(17340, 'relay', 'vee', 5, 0.7),
  wave(17520, 'skimmer', 'stair', 5, 0.1),
  // Bell veil: the colony's outer screen, every Act II craft at once.
  wave(17760, 'lantern', 'pair', 2, 0.2),
  wave(17940, 'coral', 'wall', 3, 0.5),
  wave(18060, 'relay', 'line', 3, 0.5),
  wave(18240, 'skimmer', 'line', 4, 0.1),
  wave(18420, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(18600, 'relay', 'stair', 5, 0.15),
  wave(18780, 'coral', 'wall', 4, 0.65),
  wave(18900, 'relay', 'line', 3, 0.65),
  wave(19080, 'lantern', 'single', 1, 0.35),
  wave(19080, 'skimmer', 'vee', 5, 0.5),
  wave(19260, 'relay', 'pair', 4, 0.2),
  // Tendril crossing: coral walls whose gaps zig-zag across the field while skimmers rain through them.
  wave(19560, 'coral', 'wall', 4, 0.25),
  wave(19740, 'skimmer', 'line', 4, 0.25),
  wave(19920, 'coral', 'wall', 4, 0.75),
  wave(20100, 'skimmer', 'line', 4, 0.75),
  wave(20280, 'coral', 'wall', 4, 0.4),
  wave(20400, 'relay', 'line', 3, 0.4),
  wave(20580, 'coral', 'wall', 4, 0.6),
  wave(20700, 'relay', 'line', 3, 0.6),
  wave(20880, 'skimmer', 'stair', 5, 0.1),
  wave(21060, 'lantern', 'single', 1, 0.5),
  // Lantern choir: three lanterns sing at once, so the gap lesson becomes a gap rhythm.
  wave(21360, 'lantern', 'single', 1, 0.2),
  wave(21480, 'lantern', 'single', 1, 0.5),
  wave(21600, 'lantern', 'single', 1, 0.8),
  wave(21780, 'relay', 'vee', 5, 0.5),
  wave(21960, 'lantern', 'pair', 2, 0.25),
  wave(22140, 'skimmer', 'line', 4, 0.5),
  wave(22320, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(22500, 'relay', 'stair', 5, 0.85, { step: -1 }),
  wave(22680, 'lantern', 'single', 1, 0.35),
  wave(22680, 'relay', 'pair', 4, 0.15),
  wave(22920, 'skimmer', 'vee', 5, 0.5),
  // Glow drift: skimmer rain over relay vees, with single lanterns marking the gaps.
  wave(23160, 'skimmer', 'line', 4, 0.2),
  wave(23340, 'relay', 'vee', 5, 0.5),
  wave(23520, 'lantern', 'single', 1, 0.3),
  wave(23640, 'skimmer', 'line', 4, 0.7),
  wave(23820, 'relay', 'column', 3, 0.5),
  wave(24000, 'lantern', 'single', 1, 0.7),
  wave(24120, 'skimmer', 'stair', 5, 0.1),
  wave(24300, 'relay', 'pair', 4, 0.2),
  wave(24480, 'lantern', 'pair', 2, 0.25),
  wave(24660, 'skimmer', 'vee', 5, 0.5),
  // Coral orchard: coral walls in rows, each corridor holding a relay file.
  wave(24960, 'coral', 'wall', 4, 0.3),
  wave(25140, 'relay', 'line', 3, 0.3),
  wave(25320, 'coral', 'wall', 4, 0.7),
  wave(25500, 'relay', 'line', 3, 0.7),
  wave(25680, 'lantern', 'single', 1, 0.5),
  wave(25800, 'coral', 'wall', 3, 0.5),
  wave(25980, 'skimmer', 'line', 4, 0.15),
  wave(26160, 'coral', 'wall', 4, 0.4),
  wave(26280, 'relay', 'line', 3, 0.4),
  wave(26460, 'lantern', 'pair', 2, 0.2),
  // Tide of bells: lanterns high and low, then relay stairs and a last coral gate.
  wave(26760, 'lantern', 'single', 1, 0.2),
  wave(26880, 'lantern', 'single', 1, 0.8),
  wave(27060, 'relay', 'vee', 5, 0.5),
  wave(27240, 'skimmer', 'stair', 5, 0.1),
  wave(27420, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(27600, 'relay', 'stair', 5, 0.85, { step: -1 }),
  wave(27780, 'coral', 'wall', 4, 0.5),
  wave(27900, 'relay', 'line', 3, 0.5),
  wave(28080, 'skimmer', 'vee', 5, 0.3),
  wave(28260, 'lantern', 'pair', 2, 0.25),
  // Colony wake: the Aurelia Array's escort colony, every Act II craft one last time.
  wave(28560, 'relay', 'vee', 5, 0.5),
  wave(28740, 'coral', 'wall', 4, 0.3),
  wave(28860, 'relay', 'line', 3, 0.3),
  wave(29040, 'lantern', 'pair', 2, 0.2),
  wave(29220, 'skimmer', 'stair', 5, 0.1),
  wave(29400, 'coral', 'wall', 4, 0.7),
  wave(29520, 'relay', 'line', 3, 0.7),
  wave(29700, 'lantern', 'single', 1, 0.5),
  wave(29700, 'skimmer', 'line', 4, 0.15),
  wave(29880, 'relay', 'column', 4, 0.5, { spread: 0.2 }),
  wave(30060, 'skimmer', 'vee', 5, 0.3),
]

/**
 * Silas's playtest recut (conductor rainbow t-023, after Act I's in kind_robots#3806): Act II keeps its
 * teaching sections, its guardian, every scripted moment and the escalations below; the sections listed
 * are cut out of its clock, and every later wave and event moves up by the time they took.
 */
const CUT = recutTimeline(
  AUTHORED_MOONJELLY_SECTIONS,
  [
    'Bell remix',
    'Lantern lattice',
    'Moonrise surge',
    'Bell canyon',
    'Relay storm',
    'Bell veil',
    'Tendril crossing',
    'Lantern choir',
    'Glow drift',
    'Coral orchard',
    'Tide of bells',
  ],
  { [AUTHORED_MOONJELLY_GUARDIAN.name]: 1020 },
)
export const MOONJELLY = {
  ...AUTHORED_MOONJELLY,
  nemiAppears: CUT.at(AUTHORED_MOONJELLY.nemiAppears),
  turnStarts: CUT.at(AUTHORED_MOONJELLY.turnStarts),
  turnEnds: CUT.at(AUTHORED_MOONJELLY.turnEnds),
  approachStarts: CUT.at(AUTHORED_MOONJELLY.approachStarts),
  bossStarts: CUT.at(AUTHORED_MOONJELLY.bossStarts),
} as const
export const MOONJELLY_SECTIONS = CUT.sections
export const MOONJELLY_GUARDIAN: RainbowGuardianSection = {
  ...AUTHORED_MOONJELLY_GUARDIAN,
  from: CUT.at(AUTHORED_MOONJELLY_GUARDIAN.from),
  to: CUT.at(AUTHORED_MOONJELLY_GUARDIAN.to),
}
/** The recut keeps the teaching waves sparse; these schools of cheaper craft fill the rest (t-023). */
export const MOONJELLY_REINFORCEMENTS = reinforcements<MoonjellyWave['kind']>(
  CUT.sections,
  {
    kinds: ['lantern', 'skimmer', 'relay'],
    launcher: { kind: 'mortar', every: 1500 },
    every: {
      'Relay links': 300,
      'Skimmer rain': 300,
      'Coral cover': 300,
      'Tendril maze': 420,
      'Colony wake': 240,
    },
  },
)
export const MOONJELLY_WAVES: readonly MoonjellyWave[] = withReinforcements(
  CUT.waves(AUTHORED_MOONJELLY_WAVES),
  MOONJELLY_REINFORCEMENTS,
)

const schedule = buildFormationSchedule(MOONJELLY_WAVES, MOONJELLY.waveBase)

/** Craft per wave, by wave index (id minus waveBase), for the school bonus. */
export const MOONJELLY_WAVE_SIZES: readonly number[] = schedule.sizes

export function moonjellyStage(
  frame: number,
  defeatedAt: number | null,
): MoonjellyStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < MOONJELLY.openingEnds) return 'opening'
  if (frame < MOONJELLY.turnStarts) return 'waves'
  if (frame < MOONJELLY.turnEnds) return 'turn'
  if (frame < MOONJELLY.approachStarts) return 'remix'
  if (frame < MOONJELLY.bossStarts) return 'approach'
  return 'boss'
}

/** Every craft that enters on this Act II frame; empty outside the waves and remix stages. */
export function moonjellySpawns(frame: number): readonly MoonjellySpawn[] {
  const stage = moonjellyStage(frame, null)
  if (stage !== 'waves' && stage !== 'remix') return []
  return schedule.at(frame)
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function moonjellyDialogue(
  id: MoonjellySceneId,
  elapsed: number,
  players: number,
  rescuedNemi: boolean,
): MoonjellyDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<MoonjellySceneId, MoonjellyDialogue[]> = {
    'A02.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Moonjelly Fields. This whole reef is broadcasting one call, over and over.',
      },
      {
        speaker: lead,
        text: 'Command calls it a war signal. Follow the current, and only shoot what shoots first.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Those bells are beautiful. The lightning inside them is less charming.',
      },
    ],
    'A02.TURN': [
      {
        speaker: 'Lilt-7',
        text: rescuedNemi
          ? 'Nemi is aboard. She says the lights are asking us to leave.'
          : 'We lost the Nemi beacon. The current still carries her warning: go home.',
      },
      {
        speaker: wing,
        text: 'The call changes pitch every time one of their ships goes down.',
      },
      {
        speaker: lead,
        text: 'The Aurelia Array holds the colony together. We break its lock, they scatter.',
      },
    ],
    'A02.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The colony is scattering. I know that call. It is not a war signal. It is a lullaby.',
      },
      {
        speaker: lead,
        text: 'Command translated it for us, Lilt. Why would they get it wrong?',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'The trench ahead holds the Motherland’s old relay network. Maybe it remembers.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / MOONJELLY.lineFrames)] ?? null
}

export function moonjellyScene(
  frame: number,
  defeatedFrame: number | null,
): { id: MoonjellySceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < MOONJELLY.aftermathFrames
      ? { id: 'A02.AFTER', elapsed }
      : null
  }
  if (frame < MOONJELLY.openingEnds) return { id: 'A02.OPEN', elapsed: frame }
  if (frame >= MOONJELLY.turnStarts && frame < MOONJELLY.turnEnds) {
    return { id: 'A02.TURN', elapsed: frame - MOONJELLY.turnStarts }
  }
  return null
}
