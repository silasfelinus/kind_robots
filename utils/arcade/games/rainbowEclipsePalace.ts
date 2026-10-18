/**
 * Authored Act VIII encounter director: the Eclipse Palace (S08), the artificial heart of the ocean sky:
 * an eclipse corona, a captive armada and heart spires. Local 60 Hz frames start straight after Act VII's
 * aftermath (ACT-STRUCTURE: the mirror corridor turns into the palace approach). World bible S08 beats:
 * E24 harbinger warnings open the corona; recognizable legacy motifs return, one Act's family per section,
 * now in elite formations; and the captive armada asks the Act's question, how to free the captives
 * without erasing them. A captive is never an enemy: its hull soaks every shot, and only the glowing collar
 * above it takes damage. Break the collar and the captive flies free (captivesFreed); leave it and it
 * drifts back into the palace. After the Herald guardian (see rainbowGuardian), the council (the Act's
 * mid-Act TURN) lets earlier rescues answer: the navigator, Nemi's colony, the courier, the depot
 * survivors and a stopped relay each add their support. The climb up the heart spires ends at the core
 * before B08 Prism Leviathan. A clean run takes about ten minutes. Wave ids start at 7000.
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

export type PalaceEnemy =
  | 'harbinger'
  | 'spiral'
  | 'captive'
  | 'cutter'
  | 'lantern'
  | 'mirror'
  | 'clawstrike'
  | 'pistol'
  | 'skate'
  | 'dolphin'
  | 'hammerhead'
  | 'salvager'
  | 'turret'
  | 'brood'
  | 'bulwark'
  | 'squid'
  | 'prism'
export type PalaceStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type PalaceSceneId = 'A08.OPEN' | 'A08.TURN' | 'A08.CORE' | 'A08.AFTER'
export type PalaceDialogue = { speaker: string; text: string }
export type PalaceWave = RainbowWave<PalaceEnemy>
export type PalaceSpawn = RainbowSpawn<PalaceEnemy>
/** What the crew carried up from earlier Acts, and how many captives it has freed so far. */
export type PalaceFlags = {
  rescuedNemi: boolean
  rescuedCourier: boolean
  freedDepot: boolean
  stoppedRelay: boolean
  rescuedNavigator: boolean
  captivesFreed: number
}

const AUTHORED_PALACE = {
  openingEnds: 300,
  turnStarts: 31500,
  bossStarts: 31800,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 7000,
  /** The council (the mid-Act TURN) opens the section after the guardian. */
  councilAt: 9900,
} as const

const AUTHORED_PALACE_SECTIONS = [
  { name: 'Corona gate', from: 300, to: 1800 },
  { name: 'Captive armada', from: 1800, to: 3300 },
  { name: 'Lantern hall', from: 3300, to: 4800 },
  { name: 'Trench echoes', from: 4800, to: 6300 },
  { name: 'Convoy of the collared', from: 6300, to: 8100 },
  { name: 'Herald guardian', from: 8100, to: 9900 },
  { name: 'The council', from: 9900, to: 11700 },
  { name: 'Wreck motifs', from: 11700, to: 13500 },
  { name: 'Reef motifs', from: 13500, to: 15300 },
  { name: 'Glass motifs', from: 15300, to: 17100 },
  { name: 'Captive column', from: 17100, to: 18900 },
  { name: 'Lower heart spires', from: 18900, to: 20700 },
  { name: 'Elite formations', from: 20700, to: 22500 },
  { name: 'Second armada', from: 22500, to: 24300 },
  { name: 'Upper heart spires', from: 24300, to: 26100 },
  { name: 'Corona storm', from: 26100, to: 27900 },
  { name: 'Last captives', from: 27900, to: 29700 },
  { name: 'Core approach', from: 29700, to: 31500 },
] as const

/** The Herald guardian holds the palace after the convoy; no waves fly in its section. */
const AUTHORED_PALACE_GUARDIAN: RainbowGuardianSection = {
  name: 'Herald guardian',
  from: 8100,
  to: 9900,
  kind: 'herald',
}

/** A captive drifts slowly; its collar rides this far above the hull and is the only part that takes damage. */
export const PALACE_CAPTIVE = {
  speed: 0.45,
  collarOffset: 22,
  collarRadius: 9,
  hullHalfWidth: 20,
  hullHalfHeight: 14,
  freeScore: 300,
} as const

const AUTHORED_PALACE_WAVES: readonly PalaceWave[] = [
  // Corona gate: harbingers glow on the eclipse corona; every pattern starts with its warning.
  wave(420, 'harbinger', 'single', 1, 0.5),
  wave(720, 'spiral', 'vee', 3, 0.3),
  wave(960, 'harbinger', 'single', 1, 0.7),
  wave(1200, 'spiral', 'line', 3, 0.6),
  wave(1440, 'harbinger', 'pair', 2, 0.25),
  // Captive armada: captives in collars drift through; shoot the collar, never the hull.
  wave(1860, 'captive', 'single', 1, 0.55),
  wave(2160, 'cutter', 'single', 1, 0.2),
  wave(2400, 'captive', 'single', 1, 0.35),
  wave(2640, 'cutter', 'single', 1, 0.8),
  wave(2880, 'captive', 'pair', 2, 0.3),
  // Lantern hall: Moonjelly lanterns and mirror eels: two old lessons side by side.
  wave(3360, 'lantern', 'single', 1, 0.5),
  wave(3600, 'mirror', 'single', 1, 0.3),
  wave(3840, 'lantern', 'pair', 2, 0.25),
  wave(4080, 'mirror', 'single', 1, 0.7),
  wave(4320, 'lantern', 'single', 1, 0.5),
  wave(4560, 'mirror', 'pair', 2, 0.2),
  // Trench echoes: clawstrike lanes, pistol bubbles and skate glass, the Trench remixed.
  wave(4860, 'clawstrike', 'single', 1, 0.4),
  wave(5100, 'pistol', 'single', 1, 0.7),
  wave(5340, 'skate', 'single', 1, 0.3),
  wave(5580, 'clawstrike', 'single', 1, 0.6),
  wave(5820, 'pistol', 'pair', 2, 0.25),
  wave(6060, 'skate', 'single', 1, 0.5),
  // Convoy of the collared: a captive column under dolphin escort and hammerhead pursuit.
  wave(6360, 'captive', 'column', 2, 0.5, { spread: 0.5 }),
  wave(6600, 'dolphin', 'pair', 2, 0.2),
  wave(6900, 'hammerhead', 'single', 1, 0.75),
  wave(7140, 'captive', 'single', 1, 0.3),
  wave(7380, 'dolphin', 'single', 1, 0.6),
  wave(7620, 'hammerhead', 'single', 1, 0.25),
  wave(7860, 'captive', 'single', 1, 0.65),
  // The council: the crew decides how to free the captives, then the climb resumes.
  wave(10260, 'captive', 'single', 1, 0.5),
  wave(10500, 'harbinger', 'single', 1, 0.3),
  wave(10740, 'captive', 'pair', 2, 0.25),
  wave(10980, 'mirror', 'single', 1, 0.7),
  wave(11220, 'captive', 'single', 1, 0.4),
  wave(11460, 'harbinger', 'single', 1, 0.6),
  // Wreck motifs: cutters, hammerheads and salvagers, the Wreckyard in palace gold.
  wave(11760, 'cutter', 'pair', 2, 0.2),
  wave(12000, 'hammerhead', 'single', 1, 0.5),
  wave(12240, 'salvager', 'single', 1, 0.3),
  wave(12480, 'cutter', 'single', 1, 0.7),
  wave(12720, 'hammerhead', 'single', 1, 0.6),
  wave(12960, 'salvager', 'single', 1, 0.45),
  wave(13200, 'captive', 'single', 1, 0.5),
  // Reef motifs: turrets, bulwarks and broodships, the Crown Reef rebuilt in the palace.
  wave(13560, 'turret', 'single', 1, 0.3),
  wave(13800, 'brood', 'single', 1, 0.6),
  wave(14040, 'bulwark', 'single', 1, 0.5),
  wave(14280, 'turret', 'pair', 2, 0.2),
  wave(14520, 'captive', 'single', 1, 0.45),
  wave(14760, 'bulwark', 'single', 1, 0.3),
  wave(15000, 'brood', 'single', 1, 0.7),
  // Glass motifs: mirror eels, crystal squids and prisms from the Glass Current.
  wave(15360, 'mirror', 'pair', 2, 0.25),
  wave(15600, 'squid', 'single', 1, 0.5),
  wave(15840, 'prism', 'single', 1, 0.3),
  wave(16080, 'mirror', 'single', 1, 0.7),
  wave(16320, 'squid', 'pair', 2, 0.2),
  wave(16560, 'prism', 'single', 1, 0.6),
  wave(16800, 'captive', 'single', 1, 0.4),
  // Captive column: a long column of captives behind harbinger warnings.
  wave(17160, 'harbinger', 'single', 1, 0.3),
  wave(17340, 'captive', 'column', 2, 0.6, { spread: 0.5 }),
  wave(17640, 'harbinger', 'single', 1, 0.7),
  wave(17880, 'captive', 'single', 1, 0.35),
  wave(18120, 'harbinger', 'pair', 2, 0.25),
  wave(18360, 'captive', 'pair', 2, 0.3),
  wave(18600, 'squid', 'single', 1, 0.5),
  // Lower heart spires: the first heart spires; prisms and turrets on every ledge.
  wave(18960, 'prism', 'pair', 2, 0.2),
  wave(19200, 'turret', 'single', 1, 0.5),
  wave(19440, 'prism', 'single', 1, 0.5),
  wave(19680, 'turret', 'pair', 2, 0.25),
  wave(19920, 'captive', 'single', 1, 0.55),
  wave(20160, 'prism', 'single', 1, 0.35),
  wave(20400, 'turret', 'single', 1, 0.7),
  // Elite formations: the Crown sends its best: cutter vees and mirror lines.
  wave(20760, 'cutter', 'vee', 3, 0.5),
  wave(21060, 'mirror', 'line', 3, 0.3),
  wave(21360, 'cutter', 'vee', 3, 0.4),
  wave(21660, 'mirror', 'line', 3, 0.7),
  wave(21960, 'hammerhead', 'pair', 2, 0.25),
  wave(22200, 'cutter', 'line', 3, 0.5),
  // Second armada: captives in pairs; their collars sit above the hull.
  wave(22560, 'captive', 'pair', 2, 0.25),
  wave(22860, 'dolphin', 'single', 1, 0.6),
  wave(23100, 'captive', 'single', 1, 0.45),
  wave(23340, 'squid', 'single', 1, 0.3),
  wave(23580, 'captive', 'pair', 2, 0.3),
  wave(23820, 'dolphin', 'pair', 2, 0.2),
  wave(24060, 'captive', 'single', 1, 0.6),
  // Upper heart spires: bulwarks and harbingers guard the upper spires.
  wave(24360, 'bulwark', 'single', 1, 0.4),
  wave(24600, 'harbinger', 'single', 1, 0.6),
  wave(24840, 'squid', 'pair', 2, 0.2),
  wave(25080, 'bulwark', 'single', 1, 0.6),
  wave(25320, 'harbinger', 'single', 1, 0.3),
  wave(25560, 'prism', 'pair', 2, 0.25),
  wave(25800, 'bulwark', 'single', 1, 0.5),
  // Corona storm: every family at once, each still telegraphed.
  wave(26160, 'harbinger', 'single', 1, 0.5),
  wave(26340, 'clawstrike', 'single', 1, 0.3),
  wave(26580, 'mirror', 'pair', 2, 0.2),
  wave(26820, 'turret', 'single', 1, 0.6),
  wave(27060, 'hammerhead', 'single', 1, 0.4),
  wave(27300, 'squid', 'pair', 2, 0.25),
  wave(27540, 'pistol', 'single', 1, 0.7),
  // Last captives: the last of the armada, lightly guarded; free as many as you can reach.
  wave(28020, 'captive', 'single', 1, 0.3),
  wave(28320, 'captive', 'single', 1, 0.7),
  wave(28620, 'harbinger', 'single', 1, 0.5),
  wave(28860, 'captive', 'pair', 2, 0.25),
  wave(29160, 'captive', 'single', 1, 0.5),
  wave(29400, 'mirror', 'single', 1, 0.3),
  // Core approach: the climb ends at the heart; the Leviathan waits below it.
  wave(29760, 'harbinger', 'pair', 2, 0.25),
  wave(30000, 'prism', 'single', 1, 0.5),
  wave(30240, 'mirror', 'pair', 2, 0.2),
  wave(30480, 'bulwark', 'single', 1, 0.5),
  wave(30720, 'harbinger', 'single', 1, 0.3),
  wave(30960, 'squid', 'pair', 2, 0.2),
  wave(31200, 'prism', 'single', 1, 0.6),
]

/**
 * Silas's playtest recut (conductor rainbow t-023, after Act I's in kind_robots#3806): Act VIII keeps its
 * teaching sections, its guardian, every scripted moment and the escalations below; the sections listed
 * are cut out of its clock, and every later wave and event moves up by the time they took.
 */
const CUT = recutTimeline(AUTHORED_PALACE_SECTIONS, [
  'Convoy of the collared',
  'Wreck motifs',
  'Reef motifs',
  'Glass motifs',
  'Captive column',
  'Lower heart spires',
  'Elite formations',
  'Second armada',
  'Upper heart spires',
  'Corona storm',
])
export const PALACE = {
  ...AUTHORED_PALACE,
  turnStarts: CUT.at(AUTHORED_PALACE.turnStarts),
  bossStarts: CUT.at(AUTHORED_PALACE.bossStarts),
  councilAt: CUT.at(AUTHORED_PALACE.councilAt),
} as const
export const PALACE_SECTIONS = CUT.sections
export const PALACE_GUARDIAN: RainbowGuardianSection = {
  ...AUTHORED_PALACE_GUARDIAN,
  from: CUT.at(AUTHORED_PALACE_GUARDIAN.from),
  to: CUT.at(AUTHORED_PALACE_GUARDIAN.to),
}
/** The recut keeps the teaching waves sparse; these schools of cheaper craft fill the rest (t-023). */
export const PALACE_REINFORCEMENTS = reinforcements<PalaceWave['kind']>(
  CUT.sections,
  {
    kinds: ['spiral', 'cutter', 'lantern', 'skate'],
    every: {
      'Corona gate': 420,
      'Captive armada': 360,
      'Lantern hall': 300,
      'Trench echoes': 300,
      'The council': 360,
      'Last captives': 360,
      'Core approach': 420,
    },
  },
)
export const PALACE_WAVES: readonly PalaceWave[] = withReinforcements(
  CUT.waves(AUTHORED_PALACE_WAVES),
  PALACE_REINFORCEMENTS,
)

const schedule = buildFormationSchedule(PALACE_WAVES, PALACE.waveBase)

/** Craft per wave, by wave index, for the school bonus. */
export const PALACE_WAVE_SIZES: readonly number[] = schedule.sizes

/** Captives authored in the Act: how many the crew could free. */
export const PALACE_CAPTIVES = PALACE_WAVE_SIZES.filter(
  (_, i) => PALACE_WAVES[i]!.kind === 'captive',
).reduce((sum, size) => sum + size, 0)

export function palaceStage(
  frame: number,
  defeatedAt: number | null,
): PalaceStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < PALACE.openingEnds) return 'opening'
  if (frame < PALACE.turnStarts) return 'waves'
  if (frame < PALACE.bossStarts) return 'turn'
  return 'boss'
}

/** Every craft that enters on this Act VIII frame; empty outside the waves stage. */
export function palaceSpawns(frame: number): readonly PalaceSpawn[] {
  return palaceStage(frame, null) === 'waves' ? schedule.at(frame) : []
}

/**
 * The allies earlier rescues bring to the council, in the order they speak. Each one also adds support
 * when the council opens (see the engine): a shield and some charge per ally.
 */
export function palaceAllies(flags: PalaceFlags): string[] {
  return [
    flags.rescuedNavigator && 'Navigator',
    flags.rescuedNemi && 'Nemi',
    flags.rescuedCourier && 'Courier',
    flags.freedDepot && 'Survivors',
    flags.stoppedRelay && 'Relay',
  ].filter((ally): ally is string => Boolean(ally))
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const
const ALLY_LINES: Record<string, PalaceDialogue> = {
  Navigator: {
    speaker: 'Navigator',
    text: 'I mapped these collars on my way out. Break the bright ring and they wake as themselves.',
  },
  Nemi: {
    speaker: 'Nemi',
    text: 'My colony is singing to them through the walls. They can hear us; they are choosing to wake.',
  },
  Courier: {
    speaker: 'Courier',
    text: 'Their route codes match the convoy you saved. They are crews, not cargo.',
  },
  Survivors: {
    speaker: 'Survivor',
    text: 'We wore those collars too. Tell them someone is coming, and that we made it out.',
  },
  Relay: {
    speaker: 'Lilt-7',
    text: 'With the damage relay stopped, the collars cannot punish them for waking. Go gently.',
  },
}

export function palaceDialogue(
  id: PalaceSceneId,
  elapsed: number,
  players: number,
  flags: PalaceFlags = {
    rescuedNemi: false,
    rescuedCourier: false,
    freedDepot: false,
    stoppedRelay: false,
    rescuedNavigator: false,
    captivesFreed: 0,
  },
): PalaceDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const ally = palaceAllies(flags)[0]
  const lines: Record<PalaceSceneId, PalaceDialogue[]> = {
    'A08.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Eclipse Palace. Every captive in that armada is still alive inside its collar.',
      },
      {
        speaker: lead,
        text: 'Then nobody fires on a captive. Shoot the collar, never the ship.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Harbingers on the corona. Wait for the glow, then move.',
      },
    ],
    'A08.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'The captives are wired into the palace. How do we free them without erasing who they are?',
      },
      ally
        ? ALLY_LINES[ally]!
        : {
            speaker: lead,
            text: 'Nobody here to vouch for us. Then we free them gently, one collar at a time.',
          },
      crew.includes('Azure')
        ? {
            speaker: 'Azure',
            text: 'We do not cut them loose. We unlock them, and we let them choose where to fly.',
          }
        : {
            speaker: lead,
            text: 'We unlock, we do not cut. That is how we got this far, and it is how we finish.',
          },
    ],
    'A08.CORE': [
      {
        speaker: 'Lilt-7',
        text: 'The Prism Leviathan guards the heart. Its spire locks hold the whole whale fleet.',
      },
      {
        speaker: wing,
        text: 'Break the four locks on its back, not the whale. Then its core settles.',
      },
      {
        speaker: lead,
        text: 'Then we free it like every captive on the way up.',
      },
    ],
    'A08.AFTER': [
      {
        speaker: 'Lilt-7',
        text: "The Leviathan's spire locks are open. The whale fleet remembers how to swim.",
      },
      {
        speaker: lead,
        text:
          flags.captivesFreed > 0
            ? `We freed ${flags.captivesFreed} captives on the climb, and not one of them was erased.`
            : 'The captives drifted past us. We come back for every one of them.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: "The Crown's heart is open. Whatever we choose next, we choose it together.",
      },
    ],
  }
  return lines[id][Math.floor(elapsed / PALACE.lineFrames)] ?? null
}

export function palaceScene(
  frame: number,
  defeatedFrame: number | null,
): { id: PalaceSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < PALACE.aftermathFrames
      ? { id: 'A08.AFTER', elapsed }
      : null
  }
  if (frame < PALACE.openingEnds) return { id: 'A08.OPEN', elapsed: frame }
  if (
    frame >= PALACE.councilAt &&
    frame < PALACE.councilAt + 3 * PALACE.lineFrames
  )
    return { id: 'A08.TURN', elapsed: frame - PALACE.councilAt }
  if (frame >= PALACE.turnStarts && frame < PALACE.bossStarts)
    return { id: 'A08.CORE', elapsed: frame - PALACE.turnStarts }
  return null
}
