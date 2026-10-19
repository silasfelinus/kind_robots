/**
 * Authored Act V encounter director: the Blossom Wreckyard (S05), a ship graveyard of petal hulls and dock
 * machinery where the Rosefin convoy's route ends. Local 60 Hz frames start straight after Act IV's
 * aftermath (ACT-STRUCTURE: the convoy leads directly into the wreckage). World bible S05 beats, one new
 * craft per lesson: E16 shark cutters open their jaws twice while they slide onto a pilot's lane, then
 * charge straight down it; E17 hammerheads lock two fin pods that each fire a missile, and either pod can be
 * shot off to open a safe lane; E18 octopus salvagers point four arms, fire along them and grab a loose
 * pickup unless a hit jams the grab first; and a moving scrap field of wreck slabs that soak every shot. A
 * wreck merge remix leads to the Salvager guardian (see rainbowGuardian) and ten escalations. Then the
 * pre-boss choice (COMMS bible S05; flag freedDepot): Maribel wants every survivor saved, Solenne sets a
 * forty-second boundary, and the crew flies high to liberate the survivor depot or low to raid the armory.
 * Both routes rejoin in the Regent's wake before B05 Sawtooth Regent. A clean run takes about ten minutes.
 * Wave ids start at 4000 so Act V formations never share a school with earlier Acts.
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

export type WreckEnemy =
  'cutter' | 'hammerhead' | 'salvager' | 'scrap' | 'mortar'
export type WreckStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type WreckSceneId = 'A05.OPEN' | 'A05.FORK' | 'A05.TURN' | 'A05.AFTER'
export type WreckDialogue = { speaker: string; text: string }
export type WreckWave = RainbowWave<WreckEnemy>
export type WreckSpawn = RainbowSpawn<WreckEnemy>
/** S05's route: high to liberate the survivor depot, or low to raid the armory. */
export type WreckRoute = 'depot' | 'armory'

const AUTHORED_WRECK = {
  openingEnds: 300,
  turnStarts: 32100,
  bossStarts: 32400,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 4000,
} as const

const AUTHORED_WRECK_SECTIONS = [
  { name: 'Cutter lanes', from: 300, to: 1800 },
  { name: 'Hammerhead pods', from: 1800, to: 3300 },
  { name: 'Salvager arms', from: 3300, to: 4800 },
  { name: 'Scrap field', from: 4800, to: 6300 },
  { name: 'Wreck merge', from: 6300, to: 8100 },
  { name: 'Salvager guardian', from: 8100, to: 9900 },
  { name: 'Petal hulls', from: 9900, to: 11700 },
  { name: 'Pod crossfire', from: 11700, to: 13500 },
  { name: 'Grab yard', from: 13500, to: 15300 },
  { name: 'Slab drift', from: 15300, to: 17100 },
  { name: 'Jaw parade', from: 17100, to: 18900 },
  { name: 'Dock cranes', from: 18900, to: 20700 },
  { name: 'Rust tide', from: 20700, to: 22500 },
  { name: 'Keel graveyard', from: 22500, to: 24300 },
  { name: 'Bloom wreck', from: 24300, to: 26100 },
  { name: 'Signal wreck', from: 26100, to: 27900 },
  { name: 'Depot or armory', from: 27900, to: 30300 },
  { name: "Regent's wake", from: 30300, to: 32100 },
] as const

/** The Salvager guardian holds the Act after the wreck merge; no waves fly in its section. */
const AUTHORED_WRECK_GUARDIAN: RainbowGuardianSection = {
  name: 'Salvager guardian',
  from: 8100,
  to: 9900,
  kind: 'salvager',
}

/**
 * The fork: three comms lines from markFrom, the crew's position decides at decideAt, and the forty-second
 * branch ends at rejoinAt. On the depot route survivor pods drift out every podEvery frames; the crew frees
 * the depot by reaching at least podsToFree of them.
 */
const AUTHORED_WRECK_FORK = {
  markFrom: 27612,
  decideAt: 27900,
  rejoinAt: 30300,
  splitY: 135,
  podEvery: 300,
  pods: 7,
  podsToFree: 5,
  podScore: 400,
  armoryScore: 3000,
} as const

const AUTHORED_WRECK_WAVES: readonly WreckWave[] = [
  // Cutter lanes: a cutter opens its jaws twice while it slides onto your lane, then charges down it.
  wave(420, 'cutter', 'single', 1, 0.5),
  wave(720, 'cutter', 'single', 1, 0.25),
  wave(960, 'cutter', 'single', 1, 0.75),
  wave(1200, 'cutter', 'single', 1, 0.4),
  wave(1440, 'cutter', 'pair', 2, 0.2),
  wave(1680, 'cutter', 'single', 1, 0.6),
  // Hammerhead pods: a hammerhead locks both fin pods; shoot one off to open a safe lane.
  wave(1860, 'hammerhead', 'single', 1, 0.5),
  wave(2220, 'hammerhead', 'single', 1, 0.3),
  wave(2520, 'cutter', 'single', 1, 0.7),
  wave(2760, 'hammerhead', 'single', 1, 0.65),
  wave(3060, 'hammerhead', 'pair', 2, 0.25),
  // Salvager arms: a salvager points four arms, fires along them and grabs loose pickups unless you hit it first.
  wave(3360, 'salvager', 'single', 1, 0.5),
  wave(3660, 'salvager', 'single', 1, 0.3),
  wave(3900, 'cutter', 'single', 1, 0.6),
  wave(4140, 'salvager', 'single', 1, 0.7),
  wave(4440, 'salvager', 'pair', 2, 0.25),
  wave(4680, 'cutter', 'single', 1, 0.4),
  // Scrap field: wreck slabs drift through and soak every shot; fly round them.
  wave(4860, 'scrap', 'single', 1, 0.3),
  wave(4980, 'scrap', 'single', 1, 0.7),
  wave(5160, 'cutter', 'single', 1, 0.5),
  wave(5340, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(5580, 'hammerhead', 'single', 1, 0.5),
  wave(5760, 'scrap', 'single', 1, 0.2),
  wave(5940, 'scrap', 'single', 1, 0.8),
  wave(6120, 'salvager', 'single', 1, 0.5),
  // Wreck merge: every craft of the wreckyard together, with scrap between them.
  wave(6360, 'cutter', 'single', 1, 0.3),
  wave(6540, 'hammerhead', 'single', 1, 0.6),
  wave(6720, 'scrap', 'single', 1, 0.5),
  wave(6900, 'salvager', 'single', 1, 0.25),
  wave(7140, 'cutter', 'pair', 2, 0.2),
  wave(7380, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(7560, 'hammerhead', 'single', 1, 0.35),
  wave(7740, 'salvager', 'single', 1, 0.7),
  wave(7920, 'cutter', 'single', 1, 0.5),
  // Petal hulls: broken petal hulls hide cutters; every charge comes out of the wreck.
  wave(9960, 'scrap', 'single', 1, 0.3),
  wave(10140, 'cutter', 'single', 1, 0.6),
  wave(10380, 'cutter', 'single', 1, 0.2),
  wave(10560, 'scrap', 'single', 1, 0.7),
  wave(10740, 'cutter', 'pair', 2, 0.25),
  wave(10980, 'salvager', 'single', 1, 0.5),
  wave(11160, 'scrap', 'single', 1, 0.4),
  wave(11340, 'cutter', 'single', 1, 0.75),
  // Pod crossfire: hammerheads high and low; take one pod from each.
  wave(11760, 'hammerhead', 'pair', 2, 0.2),
  wave(12060, 'cutter', 'single', 1, 0.5),
  wave(12300, 'hammerhead', 'single', 1, 0.5),
  wave(12540, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(12780, 'hammerhead', 'pair', 2, 0.3),
  wave(13080, 'cutter', 'single', 1, 0.4),
  // Grab yard: salvagers hunt the pickups the crew leaves behind.
  wave(13560, 'salvager', 'single', 1, 0.4),
  wave(13740, 'cutter', 'single', 1, 0.7),
  wave(13920, 'salvager', 'single', 1, 0.6),
  wave(14160, 'scrap', 'single', 1, 0.3),
  wave(14340, 'salvager', 'pair', 2, 0.2),
  wave(14580, 'hammerhead', 'single', 1, 0.5),
  wave(14820, 'salvager', 'single', 1, 0.3),
  wave(15000, 'cutter', 'single', 1, 0.5),
  // Slab drift: the scrap field thickens; cutters charge down the gaps.
  wave(15360, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(15540, 'scrap', 'single', 1, 0.5),
  wave(15720, 'cutter', 'single', 1, 0.25),
  wave(15900, 'scrap', 'single', 1, 0.15),
  wave(16080, 'scrap', 'single', 1, 0.85),
  wave(16260, 'cutter', 'single', 1, 0.6),
  wave(16440, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(16620, 'hammerhead', 'single', 1, 0.5),
  wave(16800, 'scrap', 'single', 1, 0.4),
  // Jaw parade: cutters in pairs and threes, each baited onto its own lane.
  wave(17160, 'cutter', 'pair', 2, 0.2),
  wave(17400, 'cutter', 'single', 1, 0.5),
  wave(17580, 'cutter', 'pair', 2, 0.35),
  wave(17820, 'salvager', 'single', 1, 0.5),
  wave(18000, 'cutter', 'line', 3, 0.3),
  wave(18240, 'cutter', 'pair', 2, 0.15),
  wave(18480, 'hammerhead', 'single', 1, 0.5),
  // Dock cranes: salvagers on the dock cranes, hammerheads under them.
  wave(18960, 'salvager', 'single', 1, 0.25),
  wave(19140, 'hammerhead', 'single', 1, 0.7),
  wave(19380, 'salvager', 'single', 1, 0.6),
  wave(19560, 'scrap', 'single', 1, 0.4),
  wave(19740, 'hammerhead', 'pair', 2, 0.25),
  wave(19980, 'salvager', 'single', 1, 0.4),
  wave(20160, 'cutter', 'pair', 2, 0.2),
  wave(20400, 'scrap', 'single', 1, 0.6),
  // Rust tide: a tide of scrap with every craft riding it.
  wave(20760, 'scrap', 'single', 1, 0.2),
  wave(20880, 'scrap', 'single', 1, 0.8),
  wave(21060, 'cutter', 'single', 1, 0.5),
  wave(21240, 'hammerhead', 'single', 1, 0.4),
  wave(21420, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(21600, 'salvager', 'single', 1, 0.6),
  wave(21780, 'cutter', 'pair', 2, 0.25),
  wave(22020, 'scrap', 'single', 1, 0.5),
  wave(22200, 'hammerhead', 'single', 1, 0.3),
  // Keel graveyard: the old fleet’s keels: hammerheads and salvagers in turn.
  wave(22560, 'hammerhead', 'single', 1, 0.3),
  wave(22800, 'salvager', 'single', 1, 0.6),
  wave(23040, 'hammerhead', 'pair', 2, 0.2),
  wave(23280, 'salvager', 'pair', 2, 0.3),
  wave(23520, 'cutter', 'single', 1, 0.5),
  wave(23760, 'hammerhead', 'single', 1, 0.6),
  wave(23940, 'salvager', 'single', 1, 0.35),
  // Bloom wreck: the great blossom wreck itself: all four hazards at once.
  wave(24360, 'cutter', 'pair', 2, 0.2),
  wave(24540, 'scrap', 'single', 1, 0.5),
  wave(24720, 'hammerhead', 'single', 1, 0.35),
  wave(24900, 'salvager', 'single', 1, 0.65),
  wave(25080, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(25260, 'cutter', 'line', 2, 0.6),
  wave(25440, 'hammerhead', 'pair', 2, 0.25),
  wave(25620, 'salvager', 'single', 1, 0.5),
  wave(25800, 'cutter', 'single', 1, 0.3),
  // Signal wreck: a last field before the depot and the armory come into view.
  wave(26160, 'scrap', 'single', 1, 0.4),
  wave(26340, 'cutter', 'single', 1, 0.6),
  wave(26520, 'hammerhead', 'single', 1, 0.5),
  wave(26760, 'salvager', 'single', 1, 0.3),
  wave(27000, 'cutter', 'pair', 2, 0.25),
  wave(27240, 'scrap', 'single', 1, 0.6),
  wave(27480, 'hammerhead', 'single', 1, 0.45),
  // Regent's wake: the routes rejoin in the Regent’s wake for one last stretch.
  wave(30360, 'cutter', 'pair', 2, 0.2),
  wave(30600, 'hammerhead', 'single', 1, 0.5),
  wave(30840, 'scrap', 'column', 2, 0.5, { spread: 0.5 }),
  wave(31080, 'salvager', 'single', 1, 0.4),
  wave(31320, 'cutter', 'line', 2, 0.6),
  wave(31560, 'hammerhead', 'pair', 2, 0.3),
  wave(31800, 'cutter', 'single', 1, 0.5),
]

/** The depot route's light escort waves, flown only on that route. */
const AUTHORED_WRECK_DEPOT_WAVES: readonly WreckWave[] = [
  wave(28020, 'cutter', 'single', 1, 0.7),
  wave(28500, 'scrap', 'single', 1, 0.75),
  wave(28980, 'cutter', 'single', 1, 0.8),
  wave(29460, 'salvager', 'single', 1, 0.7),
  wave(29940, 'cutter', 'single', 1, 0.75),
]

/** The armory route's heavy raid, flown only on that route. */
const AUTHORED_WRECK_ARMORY_WAVES: readonly WreckWave[] = [
  wave(27960, 'hammerhead', 'single', 1, 0.6),
  wave(28140, 'cutter', 'single', 1, 0.75),
  wave(28320, 'salvager', 'single', 1, 0.7),
  wave(28500, 'hammerhead', 'pair', 2, 0.3),
  wave(28740, 'cutter', 'pair', 2, 0.2),
  wave(28920, 'scrap', 'single', 1, 0.6),
  wave(29100, 'salvager', 'single', 1, 0.8),
  wave(29280, 'hammerhead', 'single', 1, 0.7),
  wave(29460, 'cutter', 'line', 2, 0.75),
  wave(29640, 'salvager', 'pair', 2, 0.3),
  wave(29820, 'hammerhead', 'single', 1, 0.65),
  wave(30000, 'cutter', 'pair', 2, 0.25),
]

/** Every Act V wave, both routes; a wave's id is WRECK.waveBase plus its index here. */
/**
 * Silas's playtest recut (conductor rainbow t-023, after Act I's in kind_robots#3806): Act V keeps its
 * teaching sections, its guardian, every scripted moment and the escalations below; the sections listed
 * are cut out of its clock, and every later wave and event moves up by the time they took.
 */
const CUT = recutTimeline(
  AUTHORED_WRECK_SECTIONS,
  [
    'Wreck merge',
    'Pod crossfire',
    'Grab yard',
    'Slab drift',
    'Jaw parade',
    'Dock cranes',
    'Rust tide',
    'Keel graveyard',
    'Bloom wreck',
    'Signal wreck',
  ],
  { [AUTHORED_WRECK_GUARDIAN.name]: 1020 },
)
export const WRECK = {
  ...AUTHORED_WRECK,
  turnStarts: CUT.at(AUTHORED_WRECK.turnStarts),
  bossStarts: CUT.at(AUTHORED_WRECK.bossStarts),
} as const
export const WRECK_FORK = {
  ...AUTHORED_WRECK_FORK,
  decideAt: CUT.at(AUTHORED_WRECK_FORK.decideAt),
  rejoinAt: CUT.at(AUTHORED_WRECK_FORK.rejoinAt),
  markFrom:
    CUT.at(AUTHORED_WRECK_FORK.decideAt) -
    (AUTHORED_WRECK_FORK.decideAt - AUTHORED_WRECK_FORK.markFrom),
} as const
export const WRECK_SECTIONS = CUT.sections
export const WRECK_GUARDIAN: RainbowGuardianSection = {
  ...AUTHORED_WRECK_GUARDIAN,
  from: CUT.at(AUTHORED_WRECK_GUARDIAN.from),
  to: CUT.at(AUTHORED_WRECK_GUARDIAN.to),
}
/** The recut keeps the teaching waves sparse; these schools of cheaper craft fill the rest (t-023). */
export const WRECK_REINFORCEMENTS = reinforcements<WreckWave['kind']>(
  CUT.sections,
  {
    kinds: ['cutter'],
    launcher: { kind: 'mortar', every: 1500 },
    every: {
      'Cutter lanes': 420,
      'Hammerhead pods': 300,
      'Salvager arms': 300,
      'Scrap field': 300,
      'Petal hulls': 420,
      "Regent's wake": 240,
    },
  },
)
export const WRECK_WAVES: readonly WreckWave[] = withReinforcements(
  CUT.waves(AUTHORED_WRECK_WAVES),
  WRECK_REINFORCEMENTS,
)
export const WRECK_DEPOT_WAVES: readonly WreckWave[] = CUT.waves(
  AUTHORED_WRECK_DEPOT_WAVES,
)
export const WRECK_ARMORY_WAVES: readonly WreckWave[] = CUT.waves(
  AUTHORED_WRECK_ARMORY_WAVES,
)

export const WRECK_ALL_WAVES: readonly WreckWave[] = [
  ...WRECK_WAVES,
  ...WRECK_DEPOT_WAVES,
  ...WRECK_ARMORY_WAVES,
]

/** Which route a wave belongs to, by its index in WRECK_ALL_WAVES; null flies on both. */
export function wreckWaveRoute(index: number): WreckRoute | null {
  if (index < WRECK_WAVES.length) return null
  return index < WRECK_WAVES.length + WRECK_DEPOT_WAVES.length
    ? 'depot'
    : 'armory'
}

const schedule = buildFormationSchedule(WRECK_ALL_WAVES, WRECK.waveBase)

/** Craft per wave, by wave index in WRECK_ALL_WAVES, for the school bonus. */
export const WRECK_WAVE_SIZES: readonly number[] = schedule.sizes

export function wreckStage(
  frame: number,
  defeatedAt: number | null,
): WreckStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < WRECK.openingEnds) return 'opening'
  if (frame < WRECK.turnStarts) return 'waves'
  if (frame < WRECK.bossStarts) return 'turn'
  return 'boss'
}

/**
 * The route the crew's position chooses at the fork: most living pilots above the line free the depot,
 * most below raid the armory, and a tie follows the lead pilot.
 */
export function wreckRouteFor(ys: readonly number[]): WreckRoute {
  const high = ys.filter((y) => y < WRECK_FORK.splitY).length
  const low = ys.length - high
  if (high !== low) return high > low ? 'depot' : 'armory'
  return ys[0] !== undefined && ys[0] < WRECK_FORK.splitY ? 'depot' : 'armory'
}

/** Every craft that enters on this Act V frame on this route; empty outside the waves stage. */
export function wreckSpawns(
  frame: number,
  route: WreckRoute | null,
): readonly WreckSpawn[] {
  if (wreckStage(frame, null) !== 'waves') return []
  return schedule.at(frame).filter((spawn) => {
    const only = wreckWaveRoute(spawn.wave - WRECK.waveBase)
    return only === null || only === route
  })
}

/** The depot route's survivor pods: where each one sets off, in Act V frames. */
export function wreckPodFrames(): number[] {
  return Array.from(
    { length: WRECK_FORK.pods },
    (_, i) => WRECK_FORK.decideAt + 60 + i * WRECK_FORK.podEvery,
  )
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function wreckDialogue(
  id: WreckSceneId,
  elapsed: number,
  players: number,
  route: WreckRoute | null = null,
  freedDepot = false,
): WreckDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  // CAST-BIBLE S05: Maribel wants every survivor, Solenne sets the boundary, Vivi will not lose the recordings.
  const keeper = crew.includes('Solenne') ? 'Solenne' : 'Lilt-7'
  const lines: Record<WreckSceneId, WreckDialogue[]> = {
    'A05.OPEN': [
      {
        speaker: 'Lilt-7',
        text: "Blossom Wreckyard. Petal hulls and old docks, and the convoy's route ends here.",
      },
      {
        speaker: lead,
        text: 'Survivors could be in any of these wrecks. Shoot carefully.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Shark cutters ahead. Their jaws open twice before they charge.',
      },
    ],
    'A05.FORK': [
      {
        speaker: lead,
        text: 'There are survivors in that depot. Every one of them is getting out.',
      },
      {
        speaker: keeper,
        text: 'Then forty seconds and not one more. High for the depot, low for the armory.',
      },
      crew.includes('Vivi')
        ? {
            speaker: 'Vivi',
            text: "The depot holds the fleet's recordings too. Bring them home with the crew.",
          }
        : {
            speaker: 'Lilt-7',
            text: "I've marked a route that leaves room for both. It is not a comfortable route.",
          },
    ],
    'A05.TURN': [
      {
        speaker: 'Lilt-7',
        text:
          route === 'armory'
            ? 'The armory is ours. Sawtooth Regent is guarding the breaker yard.'
            : freedDepot
              ? 'The survivors are aboard. Sawtooth Regent is guarding the breaker yard.'
              : 'We got some of them out. Sawtooth Regent is guarding the breaker yard.',
      },
      {
        speaker: wing,
        text: 'Its jaw opens before it charges. Read the jaw, not the teeth.',
      },
      {
        speaker: lead,
        text: 'Break its teeth, not its crew. Then we count who is still with us.',
      },
    ],
    'A05.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The Regent is disabled. Its broken teeth are falling like coral rain.',
      },
      {
        speaker: lead,
        text: freedDepot
          ? 'The rescued crew is safe. Now we face what this battle cost.'
          : 'We chose the guns over the depot. Now we face what that cost.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'A moment for the ships we could not bring home. Then we fly on.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / WRECK.lineFrames)] ?? null
}

export function wreckScene(
  frame: number,
  defeatedFrame: number | null,
): { id: WreckSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < WRECK.aftermathFrames ? { id: 'A05.AFTER', elapsed } : null
  }
  if (frame < WRECK.openingEnds) return { id: 'A05.OPEN', elapsed: frame }
  if (frame >= WRECK_FORK.markFrom && frame < WRECK_FORK.decideAt) {
    return { id: 'A05.FORK', elapsed: frame - WRECK_FORK.markFrom }
  }
  if (frame >= WRECK.turnStarts && frame < WRECK.bossStarts) {
    return { id: 'A05.TURN', elapsed: frame - WRECK.turnStarts }
  }
  return null
}
