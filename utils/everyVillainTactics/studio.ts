import {
  FIRST_BELL_MAP,
  inside,
  lineOfSight,
  pathDistance,
  tileAt,
  type TacticalMap,
  type Tile,
  type Point,
} from './combat'
import {
  ruleProblems,
  type HazardKind,
  type StageHazard,
  type StageProp,
  type StageVictory,
  type StageWave,
  type WaveCrew,
} from './stageRules'
import { scriptProblems, type SceneScript } from './sceneGraph'
import { SCIENCE_WING_SCRIPT } from './scienceWingScript'
import { CROSSWALK_CRISIS_SCRIPT } from './crosswalkCrisisScript'
import { LAST_ORDER_SCRIPT } from './lastOrderScript'
import { FERRIS_WHEEL_SCRIPT } from './ferrisWheelScript'
import { SUNKEN_STREET_SCRIPT } from './sunkenStreetScript'
import { UNLICENSED_RESCUE_SCRIPT } from './unlicensedRescueScript'
import { CHORUS_RADIO_SCRIPT } from './chorusRadioScript'
import { HYDRANT_BLUE_SCRIPT } from './hydrantBlueScript'
import {
  CLOCKTOWER_COLLAPSE_SCRIPT,
  EQUATION_ESCAPED_SCRIPT,
} from './finalAccidentScripts'
import { CANDLE_VIGIL_SCRIPT } from './candleVigilScript'
import {
  ORCHARD_ORIGIN_SCRIPT,
  GLASS_ORIGIN_SCRIPT,
} from './gardenGlassScripts'
import { THUNDER_ORIGIN_SCRIPT, BELL_ORIGIN_SCRIPT } from './thunderBellScripts'
import {
  PROOF_ORIGIN_SCRIPT,
  HEARTH_ORIGIN_SCRIPT,
  APPLAUSE_ORIGIN_SCRIPT,
} from './proofHearthApplauseScripts'
import {
  ASH_ORIGIN_SCRIPT,
  BALCONY_ORIGIN_SCRIPT,
  BRIDGE_ORIGIN_SCRIPT,
  FERRY_ORIGIN_SCRIPT,
  RIG_ORIGIN_SCRIPT,
  FORECAST_ORIGIN_SCRIPT,
  KEYS_ORIGIN_SCRIPT,
  SLATE_ORIGIN_SCRIPT,
} from './mutantOriginScripts'
import {
  FURNACE_ORIGIN_SCRIPT,
  SKYWAY_ORIGIN_SCRIPT,
  FOUNDATION_ORIGIN_SCRIPT,
  PLATFORM_ORIGIN_SCRIPT,
  PARADE_ORIGIN_SCRIPT,
  BAKERY_ORIGIN_SCRIPT,
  MUSEUM_ORIGIN_SCRIPT,
  EDIT_ORIGIN_SCRIPT,
} from './techOriginScripts'
import {
  ORBIT_ORIGIN_SCRIPT,
  TREATY_ORIGIN_SCRIPT,
  FOSSIL_ORIGIN_SCRIPT,
  TIDE_ORIGIN_SCRIPT,
  WARRANT_ORIGIN_SCRIPT,
  FUTURE_ORIGIN_SCRIPT,
  CROWN_ORIGIN_SCRIPT,
  HIVE_ORIGIN_SCRIPT,
} from './alienOriginScripts'
import { ROOFTOP_BROADCAST_SCRIPT } from './rooftopBroadcastScript'
import { UNDER_COMET_BREACH_SCRIPT } from './underCometBreachScript'
import { PROM_NIGHT_FINALE_SCRIPT } from './promNightFinaleScript'

export type StudioBrush =
  | 'erase'
  | 'wall'
  | 'half-cover'
  | 'full-cover'
  | 'rise'
  | 'squad-spawn'
  | 'rival-spawn'
  | 'secret'
  | 'hazard'
  | 'civilian'
  | 'prop'
  | 'fire'
  | 'water'
  | 'collapse'
  | 'reinforce'
  | 'zone'

export type StageSpawn = { id: string; x: number; y: number }
export type StageDraft = {
  version: 1
  id: string
  title: string
  venue: string
  objective: string
  map: TacticalMap
  spawns: StageSpawn[]
  secrets: Point[]
  hazards: Point[]
  turnLimit: number | null
  encounter?: StageEncounter
  /** Picnickers and bystanders the squad can evacuate (one-shot objective). */
  civilians?: StageCivilian[]
  /** Authored opening/triggered/final scene set for this one-shot. */
  scenes?: 'picnic-panic'
  /** Destructible cover that breaks after enough shots (see stageRules). */
  props?: StageProp[]
  /** Fire, live water and weak floors that tick at the end of each round. */
  activeHazards?: StageHazard[]
  /** Telegraphed reinforcement waves. */
  waves?: StageWave[]
  /** How the battle is won; defeat every rival when absent. */
  victory?: StageVictory
  /** Authored opening/triggered/closing conversation tree. */
  script?: SceneScript
}
export type StageCivilian = { id: string; name: string; x: number; y: number }
/** Bystanders the civilian brush places, in order. */
export const BYSTANDER_NAMES = [
  'A lost tour group',
  'The ice-cream vendor',
  'A sleepy crossing guard',
  'Two chess players mid-game',
  'A dog walker with six dogs',
  'The marching-band drummer',
] as const
/** Rival line-ups the studio can field. Crews are canonical one-hit SPECIES
 * from villainHenchmen.json, each with its own telegraphed mechanic. */
export type StageEncounter =
  | 'warren-wreckers'
  | 'quarry-lieutenant'
  | 'wombat-ronin'
  | 'licensed-legends'
  | 'claim-cinders'
  | 'hushwings'
export const STAGE_ENCOUNTERS: ReadonlyArray<{
  id: StageEncounter | null
  label: string
}> = [
  { id: null, label: 'Rival heroes' },
  { id: 'warren-wreckers', label: 'Warren Wreckers · burrowing' },
  { id: 'wombat-ronin', label: 'Clockwork Wombat Ronin · teleporting' },
  { id: 'licensed-legends', label: 'Licensed Legends · wind-up toys' },
  { id: 'claim-cinders', label: 'Claim Cinders · delayed fire' },
  { id: 'hushwings', label: 'Hushwings · vacuum corridor' },
  { id: 'quarry-lieutenant', label: 'Mags Hardpan · lieutenant' },
]

const DEFAULT_SPAWNS: StageSpawn[] = [
  { id: 'backdraft', x: 0, y: 4 },
  { id: 'priya', x: 1, y: 5 },
  { id: 'hattie', x: 0, y: 2 },
  { id: 'pip', x: 7, y: 1 },
  { id: 'vee', x: 8, y: 3 },
  { id: 'remy', x: 7, y: 4 },
]
const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const at = (x: number, y: number) => x + ',' + y
const tile = (elevation = 0, wall = false, cover?: Tile['cover']): Tile => ({
  elevation,
  ...(wall ? { wall: true } : {}),
  ...(cover ? { cover } : {}),
})
const walls = (...points: Array<[number, number]>): Record<string, Tile> =>
  Object.fromEntries(points.map(([x, y]) => [at(x, y), tile(0, true)]))

export const STAGE_PRESETS: StageDraft[] = [
  {
    version: 1,
    id: 'first-bell',
    title: 'First Bell',
    venue: 'Academy auditorium',
    objective: 'Reach the rival patrol and open the sealed exits.',
    map: FIRST_BELL_MAP,
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 4, y: 5 }],
    hazards: [],
    turnLimit: null,
  },
  {
    version: 1,
    id: 'last-order',
    title: 'The Last Order',
    venue: 'Neon Row all-night diner',
    objective:
      'Vent the kitchen hood with Backdraft Flare at column 5, row 3, then rescue Mara before the eighth round.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([3, 0], [4, 0], [5, 0], [5, 5]),
        '2,2': tile(0, false, { east: 'half' }),
        '3,3': tile(0, false, { north: 'half' }),
        '6,4': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 3, y: 4 }],
    hazards: [],
    turnLimit: 8,
    civilians: [{ id: 'diner-cook', name: 'Mara, the night cook', x: 7, y: 2 }],
    props: [
      { id: 'diner-counter', x: 3, y: 3, cover: 'full', hp: 3 },
      { id: 'diner-booth', x: 6, y: 1, cover: 'half', hp: 2 },
      { id: 'service-cart', x: 2, y: 4, cover: 'half', hp: 1 },
    ],
    activeHazards: [
      { id: 'grease-fire', kind: 'fire', x: 5, y: 3 },
      { id: 'pan-fire', kind: 'fire', x: 6, y: 2 },
    ],
    victory: { kind: 'rescue', count: 1 },
    script: LAST_ORDER_SCRIPT,
  },
  {
    version: 1,
    id: 'ferris-wheel',
    title: 'Ferris Wheel Without Air',
    venue: 'Comet City pier carnival',
    objective:
      'Land Skyline’s Updraft Catch on the wind gauge at column 5, row 3 to stabilize both gondolas, then rescue both passengers before round eight.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [4, 5], [6, 0], [6, 5]),
        '2,2': tile(0, false, { east: 'half' }),
        '3,3': tile(0, false, { north: 'half' }),
        '5,2': tile(1),
        '5,4': tile(0, false, { west: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 4 },
      { id: 'priya', x: 3, y: 2 },
      { id: 'hattie', x: 0, y: 1 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [{ x: 5, y: 3 }],
    turnLimit: 8,
    civilians: [
      { id: 'wheel-upper', name: 'Child in the upper gondola', x: 7, y: 2 },
      { id: 'wheel-lower', name: 'Rider in the lower gondola', x: 7, y: 4 },
    ],
    props: [
      { id: 'ticket-booth', x: 3, y: 3, cover: 'half', hp: 2 },
      { id: 'wheel-rail', x: 5, y: 1, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'swaying-catwalk', kind: 'collapse', x: 5, y: 3, round: 4 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FERRIS_WHEEL_SCRIPT,
  },
  {
    version: 1,
    id: 'sunken-street',
    title: 'The Street That Sank',
    venue: 'Academy bus stop and sinking municipal water main',
    objective:
      'Brace the broken roadway with Cornerstone’s earth surge at column 5, row 3, then rescue both bus passengers before round nine.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [5, 0], [5, 5], [4, 5]),
        '3,2': tile(0, false, { north: 'half' }),
        '4,2': tile(1),
        '5,3': tile(0, false, { south: 'half' }),
        '6,1': tile(1),
        '6,4': tile(0, false, { west: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 4 },
      { id: 'priya', x: 1, y: 3 },
      { id: 'hattie', x: 0, y: 1 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 2, y: 5 }],
    hazards: [{ x: 5, y: 4 }],
    turnLimit: 9,
    civilians: [
      {
        id: 'sinkhole-driver',
        name: 'Bus driver at the steering wheel',
        x: 7,
        y: 2,
      },
      {
        id: 'sinkhole-student',
        name: 'Student trapped on the back seat',
        x: 7,
        y: 4,
      },
    ],
    props: [
      { id: 'buckled-asphalt', x: 3, y: 3, cover: 'half', hp: 2 },
      { id: 'bus-chassis', x: 6, y: 3, cover: 'full', hp: 3 },
      { id: 'waterworks-pump', x: 2, y: 2, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'burst-water-main', kind: 'water', x: 5, y: 1 },
      { id: 'sinking-curb', kind: 'collapse', x: 5, y: 4, round: 4 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: SUNKEN_STREET_SCRIPT,
  },
  {
    version: 1,
    id: 'unlicensed-rescue',
    title: 'The Unlicensed Rescue',
    venue: 'Comet City public library benefit concert',
    objective:
      'Shield a volunteer with Captain Valcourt’s cape at the west security gate, then evacuate both families before round eight.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [5, 0], [4, 5], [5, 5]),
        '3,2': tile(0, false, { east: 'half' }),
        '4,2': tile(1),
        '5,1': tile(0, false, { south: 'half' }),
        '6,4': tile(0, false, { west: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 2, y: 2 },
      { id: 'hattie', x: 0, y: 1 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [],
    turnLimit: 8,
    civilians: [
      { id: 'library-family', name: 'Family beside the dark lift', x: 7, y: 2 },
      {
        id: 'concert-ushers',
        name: 'Volunteer ushers behind the stage',
        x: 7,
        y: 4,
      },
    ],
    props: [
      { id: 'license-kiosk', x: 4, y: 3, cover: 'half', hp: 2 },
      { id: 'public-archive', x: 6, y: 1, cover: 'full', hp: 3 },
      { id: 'stage-speaker', x: 5, y: 4, cover: 'half', hp: 2 },
    ],
    activeHazards: [{ id: 'sparking-generator', kind: 'fire', x: 5, y: 3 }],
    victory: { kind: 'rescue', count: 2 },
    script: UNLICENSED_RESCUE_SCRIPT,
  },
  {
    version: 1,
    id: 'song-that-stopped',
    title: 'The Song That Stopped',
    venue: 'Comet City community radio tower during the blackout',
    objective:
      'Reach the elevated studio booth at column 4, row 3; use Chorus’s counter-melody there, then guide two groups out of the broadcast crush before round nine.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [5, 0], [4, 5], [5, 5]),
        '2,2': tile(0, false, { north: 'half' }),
        '3,2': tile(1),
        '4,2': tile(0, false, { east: 'half' }),
        '5,3': tile(0, false, { north: 'half' }),
        '6,4': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 1 },
      { id: 'hattie', x: 1, y: 4 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 2, y: 5 }],
    hazards: [],
    turnLimit: 9,
    civilians: [
      {
        id: 'radio-listeners',
        name: 'Listeners trapped at the tower gate',
        x: 7,
        y: 2,
      },
      {
        id: 'radio-volunteers',
        name: 'Emergency volunteers by the transmitter',
        x: 7,
        y: 4,
      },
    ],
    props: [
      { id: 'broadcast-mixer', x: 2, y: 3, cover: 'half', hp: 2 },
      { id: 'sponsor-transmitter', x: 5, y: 3, cover: 'full', hp: 3 },
      { id: 'antenna-service-box', x: 6, y: 1, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'sparking-relay', kind: 'fire', x: 5, y: 4 },
      { id: 'falling-antenna', kind: 'collapse', x: 6, y: 5, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: CHORUS_RADIO_SCRIPT,
  },
  {
    version: 1,
    id: 'hydrant-blue',
    title: 'Hydrant Blue',
    venue: 'Municipal fire station during a heat wave',
    objective:
      'Move Tidewarden beside the blue valve at column 5, row 3. Use her signature power on the valve, then evacuate both trapped crews before round nine.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [5, 0], [5, 1], [3, 5], [6, 5]),
        '2,2': tile(0, false, { east: 'half' }),
        '4,2': tile(1),
        '5,3': tile(0, false, { north: 'half' }),
        '6,2': tile(0, false, { west: 'full' }),
        '7,3': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 1 },
      { id: 'hattie', x: 1, y: 4 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 2, y: 4 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 9,
    civilians: [
      { id: 'hydrant-engine', name: 'Engine bay crew', x: 7, y: 1 },
      { id: 'hydrant-dispatch', name: 'Dispatch room crew', x: 7, y: 4 },
    ],
    props: [
      { id: 'hose-rack', x: 3, y: 3, cover: 'half', hp: 2 },
      { id: 'engine-cab', x: 6, y: 2, cover: 'full', hp: 3 },
      { id: 'dispatch-desk', x: 6, y: 4, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'engine-smoke', kind: 'fire', x: 5, y: 4 },
      { id: 'live-drain', kind: 'water', x: 3, y: 2 },
      { id: 'bay-gantry', kind: 'collapse', x: 7, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: HYDRANT_BLUE_SCRIPT,
  },
  {
    version: 1,
    id: 'clocktower-collapse',
    title: 'The Clocktower Collapse',
    venue: 'School clocktower at graduation',
    objective:
      'Reach the escapement at column 5, row 4 on an even round. Catch the lift with your signature, then evacuate the technician.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [4, 0], [6, 0], [6, 1], [4, 5], [7, 5]),
        '3,3': tile(1),
        '4,3': tile(1),
        '5,3': tile(1, false, { north: 'half' }),
        '6,2': tile(1),
        '6,3': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 2 },
      { id: 'hattie', x: 1, y: 4 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 2 },
      { id: 'remy', x: 8, y: 4 },
    ],
    secrets: [{ x: 5, y: 1 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 8,
    civilians: [
      { id: 'clock-technician', name: 'Lift technician', x: 6, y: 3 },
    ],
    props: [
      { id: 'gear-housing', x: 5, y: 2, cover: 'full', hp: 3 },
      { id: 'banner-crate', x: 2, y: 4, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'falling-platform', kind: 'collapse', x: 5, y: 4, round: 4 },
      { id: 'loose-clock-floor', kind: 'collapse', x: 3, y: 2, round: 6 },
    ],
    victory: { kind: 'rescue', count: 1 },
    script: CLOCKTOWER_COLLAPSE_SCRIPT,
  },
  {
    version: 1,
    id: 'equation-that-escaped',
    title: 'The Equation That Escaped',
    venue: 'Academy student science fair',
    objective:
      'Get a clear line of sight within four tiles of the faulty drone at column 6, row 3. Rewrite its proof with your signature, then evacuate both witnesses.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([3, 0], [3, 1], [3, 3], [3, 4], [6, 0], [6, 5]),
        '2,2': tile(0, false, { east: 'half' }),
        '4,2': tile(0),
        '5,2': tile(1),
        '6,2': tile(0, false, { west: 'half' }),
        '7,3': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 2, y: 5 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 9,
    civilians: [
      { id: 'equation-student', name: 'Science fair student', x: 7, y: 1 },
      { id: 'equation-judge', name: 'Visiting judge', x: 7, y: 4 },
    ],
    props: [
      { id: 'display-board', x: 4, y: 1, cover: 'full', hp: 2 },
      { id: 'printer', x: 5, y: 4, cover: 'half', hp: 3 },
    ],
    activeHazards: [
      { id: 'capacitor-fire', kind: 'fire', x: 6, y: 3 },
      { id: 'loose-motor-cable', kind: 'water', x: 4, y: 4 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: EQUATION_ESCAPED_SCRIPT,
  },
  {
    version: 1,
    id: 'candle-that-wouldnt-die',
    title: "The Candle That Wouldn't Die",
    venue: 'Rain-soaked vigil beneath the academy chapel',
    objective:
      'Stand beside the bronze lantern at column 5, row 4 with both AP free. Bind the candle with your one-use ritual, then evacuate both mourners.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 4], [2, 5], [6, 1], [6, 2], [6, 4]),
        '3,2': tile(0, false, { east: 'half' }),
        '4,3': tile(0),
        '5,3': tile(0, false, { north: 'half' }),
        '7,2': tile(1),
        '7,3': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 2 },
      { id: 'hattie', x: 1, y: 4 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'vigil-mourner', name: 'Sleeping mourner', x: 5, y: 1 },
      { id: 'vigil-caretaker', name: 'Chapel caretaker', x: 7, y: 4 },
    ],
    props: [
      { id: 'stone-pew', x: 4, y: 1, cover: 'full', hp: 3 },
      { id: 'offering-table', x: 5, y: 5, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'vigil-burning-banner', kind: 'fire', x: 5, y: 0 },
      { id: 'vigil-rain-puddle', kind: 'water', x: 3, y: 4 },
      { id: 'vigil-loose-masonry', kind: 'collapse', x: 4, y: 5, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: CANDLE_VIGIL_SCRIPT,
  },
  {
    version: 1,
    id: 'orchard-under-asphalt',
    title: 'The Orchard Under Asphalt',
    venue: 'Schoolyard community garden at demolition hour',
    objective:
      'Stand on the exposed root at column 5, row 3 with both AP free. Stitch the protective arch, then evacuate both gardeners.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 3],
          [2, 4],
          [5, 0],
          [5, 1],
          [6, 4],
          [6, 5],
        ),
        '3,2': tile(0, false, { west: 'half' }),
        '4,2': tile(0),
        '4,3': tile(1),
        '5,3': tile(1, false, { east: 'half' }),
        '7,2': tile(0, false, { south: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 1 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'orchard-child', name: 'Garden pupil', x: 6, y: 2 },
      { id: 'orchard-steward', name: 'Garden steward', x: 7, y: 4 },
    ],
    props: [
      { id: 'seedling-box', x: 3, y: 1, cover: 'half', hp: 2 },
      { id: 'demolition-barrier', x: 5, y: 4, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'orchard-cracked-paving', kind: 'collapse', x: 4, y: 4, round: 4 },
      { id: 'orchard-burst-pipe', kind: 'water', x: 5, y: 2 },
      { id: 'orchard-falling-curb', kind: 'collapse', x: 6, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: ORCHARD_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'future-in-the-glass',
    title: 'The Future in the Glass',
    venue: 'Hospital rooftop greenhouse surrounded by reflecting panes',
    objective:
      'With both AP free and a clear sightline within three tiles of the silver bowl at column 6, row 4, reframe the vision, then evacuate the patient and nurse.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [3, 0],
          [3, 1],
          [3, 2],
          [3, 4],
          [6, 0],
          [6, 1],
          [6, 5],
          [4, 5],
        ),
        '3,3': tile(1),
        '4,3': tile(1, false, { west: 'half' }),
        '5,3': tile(1),
        '6,3': tile(1),
        '7,2': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 5, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'glass-patient', name: 'Patient', x: 7, y: 1 },
      { id: 'glass-nurse', name: 'Night nurse', x: 7, y: 4 },
    ],
    props: [
      { id: 'greenhouse-bench', x: 4, y: 1, cover: 'half', hp: 2 },
      { id: 'planter-screen', x: 6, y: 2, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'glass-irrigation', kind: 'water', x: 4, y: 2 },
      { id: 'glass-cracked-pane', kind: 'collapse', x: 5, y: 2, round: 5 },
      { id: 'glass-roof-edge', kind: 'collapse', x: 5, y: 4, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: GLASS_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'overdue-thunder',
    title: 'Overdue Thunder',
    venue: "Academy library's floating study annex",
    objective:
      'Fold the storm at column 6, row 3 from a clear sightline within four tiles with both AP free, then evacuate the two readers.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 3],
          [2, 4],
          [4, 0],
          [6, 4],
          [6, 5],
          [7, 1],
        ),
        '2,2': tile(1),
        '4,2': tile(1, false, { west: 'half' }),
        '5,2': tile(1),
        '6,2': tile(1, false, { east: 'half' }),
        '7,4': tile(0, false, { south: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'thunder-reader', name: 'Injured reader', x: 7, y: 2 },
      { id: 'thunder-librarian', name: 'Annex librarian', x: 7, y: 5 },
    ],
    props: [
      { id: 'thunder-bookcase', x: 3, y: 1, cover: 'full', hp: 3 },
      { id: 'thunder-reading-desk', x: 6, y: 0, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'thunder-fallen-shelf', kind: 'collapse', x: 4, y: 3, round: 4 },
      { id: 'thunder-rain', kind: 'water', x: 6, y: 3 },
      { id: 'thunder-annex-edge', kind: 'collapse', x: 5, y: 4, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: THUNDER_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'bell-and-the-door',
    title: 'The Bell and the Door',
    venue: 'Academy discipline hall during an unannounced lockdown',
    objective:
      'Use the two-AP warding gesture beside the safe-room door at column 5, row 4, then evacuate the student and shelter attendant.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 4],
          [2, 5],
          [5, 0],
          [5, 1],
          [6, 5],
        ),
        '2,3': tile(0),
        '3,3': tile(0, false, { north: 'half' }),
        '4,3': tile(0),
        '5,3': tile(0, false, { west: 'half' }),
        '6,2': tile(1, false, { north: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'bell-outsider', name: 'Sanctuary student', x: 6, y: 2 },
      { id: 'bell-attendant', name: 'Shelter attendant', x: 7, y: 4 },
    ],
    props: [
      { id: 'bell-lectern', x: 3, y: 1, cover: 'half', hp: 2 },
      { id: 'bell-partition', x: 5, y: 4, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'bell-falling-balcony', kind: 'collapse', x: 4, y: 4, round: 5 },
      { id: 'bell-storm-water', kind: 'water', x: 5, y: 2 },
      { id: 'bell-cracked-threshold', kind: 'collapse', x: 6, y: 3, round: 8 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: BELL_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'when-two-plus-two-screamed',
    title: 'When Two Plus Two Screamed',
    venue: 'School mathematics symposium and floating staircase',
    objective:
      'Complete the bridge proof at column 7, row 3 from a clear sightline within five tiles with both AP free. Evacuate two stranded students.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [3, 0],
          [3, 1],
          [3, 3],
          [3, 4],
          [5, 4],
          [5, 5],
          [7, 0],
          [7, 1],
        ),
        '3,2': tile(1),
        '4,2': tile(1, false, { north: 'half' }),
        '5,2': tile(1),
        '6,2': tile(1),
        '7,3': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 6, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'proof-student', name: 'Symposium student', x: 7, y: 2 },
      { id: 'proof-assistant', name: 'Mathematics assistant', x: 7, y: 4 },
    ],
    props: [
      { id: 'proof-chalkboard', x: 4, y: 1, cover: 'full', hp: 3 },
      { id: 'proof-desk', x: 6, y: 0, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'proof-falling-step', kind: 'collapse', x: 4, y: 3, round: 4 },
      { id: 'proof-broken-vertex', kind: 'collapse', x: 6, y: 4, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: PROOF_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'heir-who-said-no',
    title: 'The Heir Who Said No',
    venue: 'Family estate greenhouse during an ancestral summoning',
    objective:
      'Read the contract at column 5, row 5 from within two tiles with clear sight and both AP free. Evacuate the gardener and summoned witness.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 3],
          [5, 0],
          [5, 1],
          [6, 3],
          [6, 4],
        ),
        '2,4': tile(0),
        '3,4': tile(0, false, { north: 'half' }),
        '4,4': tile(0),
        '4,3': tile(0, false, { east: 'half' }),
        '7,2': tile(1, false, { south: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 4 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 4 }],
    turnLimit: 10,
    civilians: [
      { id: 'hearth-gardener', name: 'Estate gardener', x: 7, y: 2 },
      { id: 'hearth-witness', name: 'Summoned witness', x: 7, y: 5 },
    ],
    props: [
      { id: 'hearth-planter', x: 3, y: 2, cover: 'half', hp: 2 },
      { id: 'hearth-cabinet', x: 5, y: 2, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'hearth-shattered-glass', kind: 'collapse', x: 4, y: 2, round: 5 },
      { id: 'hearth-irrigation', kind: 'water', x: 5, y: 4 },
      { id: 'hearth-falling-trellis', kind: 'collapse', x: 5, y: 3, round: 8 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: HEARTH_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'empty-applause',
    title: 'The Empty Applause',
    venue: 'Small community theater on opening night',
    objective:
      'Stand on the stage mark at column 5, row 3 with both AP free to rewrite the monologue. Evacuate the two performers.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 4],
          [2, 5],
          [5, 0],
          [5, 5],
          [6, 1],
          [6, 4],
        ),
        '3,2': tile(1, false, { west: 'half' }),
        '4,2': tile(1),
        '4,3': tile(1),
        '5,2': tile(1, false, { east: 'half' }),
        '6,3': tile(0, false, { south: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 3 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'applause-actor', name: 'Lead performer', x: 7, y: 2 },
      { id: 'applause-stagehand', name: 'Stagehand', x: 7, y: 4 },
    ],
    props: [
      { id: 'applause-scenery', x: 3, y: 1, cover: 'full', hp: 3 },
      { id: 'applause-piano', x: 5, y: 4, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'applause-falling-light', kind: 'collapse', x: 4, y: 1, round: 4 },
      { id: 'applause-curtain-drop', kind: 'collapse', x: 5, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: APPLAUSE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'ashes-of-the-ledger',
    title: 'Ashes of the Ledger',
    venue: 'City clinic during a records raid',
    objective:
      'Cut a safe escape hole through the reinforced door without igniting the charts. Stand beside column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 4], [5, 0], [6, 3], [6, 4]),
        '3,2': tile(0),
        '4,2': tile(0),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'ash-civilian-0', name: 'Clinic archivist', x: 7, y: 2 },
      { id: 'ash-civilian-1', name: 'Patient advocate', x: 7, y: 5 },
    ],
    props: [{ id: 'ash-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'ash-collapse', kind: 'collapse', x: 3, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: ASH_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'balcony-witness',
    title: 'The Balcony Witness',
    venue: 'Assembly hall and roof garden',
    objective:
      'Redirect the flock through the high windows to shield the witness. Get within 4 tiles of column 6, row 2 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 3], [4, 3], [5, 4], [6, 0], [6, 4]),
        '3,1': tile(1),
        '5,1': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 1 }],
    turnLimit: 10,
    civilians: [
      { id: 'balcony-civilian-0', name: 'Messenger handler', x: 7, y: 1 },
      { id: 'balcony-civilian-1', name: 'Roof gardener', x: 7, y: 4 },
    ],
    props: [{ id: 'balcony-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'balcony-collapse', kind: 'collapse', x: 5, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: BALCONY_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'bridge-of-last-chances',
    title: 'Bridge of Last Chances',
    venue: 'Condemned footbridge to temporary shelter',
    objective:
      "Reinforce the failing span with living stone at the bridge's center. Stand on column 5, row 4 with one AP free, then evacuate both civilians.",
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 4],
          [3, 0],
          [5, 5],
          [6, 1],
          [6, 5],
        ),
        '4,3': tile(0),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'bridge-civilian-0', name: 'Last family', x: 7, y: 2 },
      { id: 'bridge-civilian-1', name: 'Shelter volunteer', x: 7, y: 4 },
    ],
    props: [{ id: 'bridge-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'bridge-collapse', kind: 'collapse', x: 6, y: 2, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: BRIDGE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'ship-with-no-port',
    title: 'A Ship With No Port',
    venue: 'Storm-battered harbor ferry',
    objective:
      'Shape a temporary seawall beside the ferry channel. Get within 3 tiles of column 6, row 4 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 4], [4, 0], [4, 5], [6, 2], [6, 4]),
        '3,3': tile(1),
        '5,3': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'ferry-civilian-0', name: 'Ferry engineer', x: 7, y: 1 },
      { id: 'ferry-civilian-1', name: 'Displaced passengers', x: 7, y: 5 },
    ],
    props: [{ id: 'ferry-cover', x: 5, y: 2, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'ferry-collapse', kind: 'collapse', x: 4, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FERRY_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'four-hands-and-a-promise',
    title: 'Four Hands and a Promise',
    venue: 'Academy gym with a broken aerial rig',
    objective:
      "Stabilize the rig's ropes beside the failed anchor with four hands. Stand beside column 5, row 3 with one AP free, then evacuate both civilians.",
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 5], [5, 1], [6, 0], [6, 4]),
        '3,2': tile(0),
        '4,2': tile(0),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'rig-civilian-0', name: 'Stranded novice', x: 7, y: 2 },
      { id: 'rig-civilian-1', name: 'Rigging partner', x: 7, y: 4 },
    ],
    props: [{ id: 'rig-cover', x: 5, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'rig-collapse', kind: 'collapse', x: 4, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: RIG_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'probability-of-panic',
    title: 'A Probability of Panic',
    venue: 'Graduation rehearsal on a collapsing stage',
    objective:
      'Identify the keystone fault from a clear sightline and interrupt the chain reaction. Get within 4 tiles of column 6, row 3 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 3],
          [3, 5],
          [4, 4],
          [6, 0],
          [6, 1],
          [6, 4],
        ),
        '2,2': tile(1),
        '5,2': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'forecast-civilian-0', name: 'Rehearsal performer', x: 7, y: 2 },
      { id: 'forecast-civilian-1', name: 'Lighting technician', x: 7, y: 5 },
    ],
    props: [{ id: 'forecast-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'forecast-collapse', kind: 'collapse', x: 4, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FORECAST_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'keys-to-the-shelter',
    title: 'Keys to the Shelter',
    venue: 'Heritage shelter courtyard during a cold snap',
    objective:
      'Raise the ancestral shelter ward at the sealed doorway. Get within 2 tiles of column 5, row 4 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 4],
          [5, 0],
          [5, 5],
          [6, 2],
          [6, 4],
        ),
        '3,3': tile(0),
        '4,3': tile(0),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'keys-civilian-0', name: 'Stranded family', x: 7, y: 1 },
      { id: 'keys-civilian-1', name: 'Shelter attendant', x: 7, y: 4 },
    ],
    props: [{ id: 'keys-cover', x: 5, y: 2, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'keys-collapse', kind: 'collapse', x: 5, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: KEYS_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'friend-nobody-remembers',
    title: 'The Friend Nobody Remembers',
    venue: 'Student council election-night hall',
    objective:
      'Retrace the trustworthy relationship at the council table without removing the blocking patch. Stand on column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 4],
          [2, 5],
          [4, 0],
          [5, 4],
          [6, 1],
          [6, 5],
        ),
        '4,2': tile(1),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'slate-civilian-0', name: 'Council representative', x: 7, y: 2 },
      {
        id: 'slate-civilian-1',
        name: 'Coerced campaign volunteer',
        x: 7,
        y: 4,
      },
    ],
    props: [{ id: 'slate-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'slate-collapse', kind: 'collapse', x: 3, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: SLATE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'furnace-lift',
    title: 'The Furnace Lift',
    venue: 'Foundry apprentice exit',
    objective:
      'Weld the support bridge without overheating it. Stand beside column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 5], [5, 0], [6, 3], [7, 1]),
        '3,2': tile(0),
        '4,2': tile(0),
        '1,2': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'furnace-civilian-0', name: 'Foundry apprentice', x: 7, y: 2 },
      { id: 'furnace-civilian-1', name: 'Crane operator', x: 7, y: 5 },
    ],
    props: [{ id: 'furnace-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'furnace-collapse', kind: 'collapse', x: 5, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FURNACE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'last-skyway',
    title: 'The Last Skyway',
    venue: 'Aerial tram station during a communications outage',
    objective:
      'Rewrite the drone flight plan to establish a safe air corridor. Get within 4 tiles of column 6, row 2 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 4], [4, 3], [5, 5], [6, 0]),
        '3,1': tile(1),
        '5,1': tile(1),
        '1,3': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 1 }],
    turnLimit: 10,
    civilians: [
      { id: 'skyway-civilian-0', name: 'Trapped rescue pilot', x: 7, y: 1 },
      { id: 'skyway-civilian-1', name: 'Tram dispatcher', x: 7, y: 4 },
    ],
    props: [{ id: 'skyway-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'skyway-collapse', kind: 'collapse', x: 5, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: SKYWAY_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'foundation-day',
    title: 'Foundation Day',
    venue: 'Rainy townhouse relocation site',
    objective:
      "Deploy portable braces at the building's remaining exit. Stand on column 5, row 4 with one AP free, then evacuate both civilians.",
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 4],
          [3, 0],
          [5, 4],
          [6, 1],
          [6, 5],
        ),
        '4,3': tile(0),
        '1,4': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      {
        id: 'foundation-civilian-0',
        name: 'Tenant carrying belongings',
        x: 7,
        y: 2,
      },
      { id: 'foundation-civilian-1', name: 'Relocation volunteer', x: 7, y: 4 },
    ],
    props: [{ id: 'foundation-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'foundation-collapse', kind: 'collapse', x: 6, y: 2, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FOUNDATION_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'flooded-platform',
    title: 'The Flooded Platform',
    venue: 'Downtown subway during flash flooding',
    objective:
      'Tow the train car toward the evacuation ledge with the pressure suit. Get within 3 tiles of column 6, row 4 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 4], [4, 0], [4, 5], [6, 1]),
        '3,3': tile(1),
        '5,3': tile(1),
        '0,5': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'platform-civilian-0', name: 'Stranded commuter', x: 7, y: 2 },
      { id: 'platform-civilian-1', name: 'Transit technician', x: 7, y: 5 },
    ],
    props: [{ id: 'platform-cover', x: 6, y: 2, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'platform-collapse', kind: 'collapse', x: 4, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: PLATFORM_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'parade-that-couldnt-stop',
    title: "The Parade That Couldn't Stop",
    venue: "Veterans' welcome parade intersection",
    objective:
      'Synchronize a nonviolent formation break beside the signal relay. Stand beside column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 5], [5, 1], [6, 0]),
        '3,2': tile(0),
        '4,2': tile(0),
        '0,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'parade-civilian-0', name: 'Injured veteran', x: 7, y: 2 },
      { id: 'parade-civilian-1', name: 'Parade marshal', x: 7, y: 4 },
    ],
    props: [{ id: 'parade-cover', x: 5, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'parade-collapse', kind: 'collapse', x: 4, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: PARADE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'grandmas-password',
    title: "Grandma's Password",
    venue: 'Neighborhood bakery with sealed automated ovens',
    objective:
      'Override the door controller with the recipe-memory sequence without wiping the kitchen AI. Get within 4 tiles of column 6, row 3 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [3, 5], [4, 4], [6, 0], [6, 1]),
        '2,2': tile(1),
        '5,2': tile(1),
        '0,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'bakery-civilian-0', name: 'Classroom pupil', x: 7, y: 2 },
      { id: 'bakery-civilian-1', name: 'Bakery assistant', x: 7, y: 5 },
    ],
    props: [{ id: 'bakery-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'bakery-collapse', kind: 'collapse', x: 4, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: BAKERY_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'museum-of-tomorrow',
    title: 'The Museum of Tomorrow',
    venue: 'Corporate museum scholarship opening',
    objective:
      'Brace the scholarship elevator with prototype armor. Get within 2 tiles of column 5, row 4 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 2], [2, 4], [5, 0], [5, 5], [6, 2]),
        '3,3': tile(0),
        '4,3': tile(0),
        '1,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'museum-civilian-0', name: 'Scholarship student', x: 7, y: 1 },
      { id: 'museum-civilian-1', name: 'Museum guide', x: 7, y: 4 },
    ],
    props: [{ id: 'museum-cover', x: 5, y: 2, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'museum-collapse', kind: 'collapse', x: 5, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: MUSEUM_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'edited-rescue',
    title: 'The Edited Rescue',
    venue: 'Local news station during a student interview',
    objective:
      'Trace the missing camera angle from the public livestream console. Stand on column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 4],
          [2, 5],
          [4, 0],
          [5, 4],
          [6, 1],
          [6, 5],
        ),
        '4,2': tile(1),
        '0,0': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'edit-civilian-0', name: 'Student interviewee', x: 7, y: 2 },
      { id: 'edit-civilian-1', name: 'Camera operator', x: 7, y: 4 },
    ],
    props: [{ id: 'edit-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'edit-collapse', kind: 'collapse', x: 3, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: EDIT_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'refuge-in-orbit',
    title: 'A Refuge in Orbit',
    venue: 'Refugee shuttle during atmospheric reentry',
    objective:
      'Shape a solar shield around the failing sail without burning the hull. Get within 2 tiles of column 6, row 3 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 5], [5, 0], [6, 3], [7, 1]),
        '3,2': tile(0),
        '5,2': tile(0),
        '1,2': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'orbit-civilian-0', name: 'Shuttle navigator', x: 7, y: 2 },
      { id: 'orbit-civilian-1', name: 'Refugee family', x: 7, y: 5 },
    ],
    props: [{ id: 'orbit-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'orbit-collapse', kind: 'collapse', x: 5, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: ORBIT_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'treaty-in-the-clouds',
    title: 'The Treaty in the Clouds',
    venue: 'Cloudport visitor center above the college',
    objective:
      'Translate the pressure-wave treaty at the floating relay. Get within 4 tiles of column 6, row 2 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 4], [4, 3], [5, 5], [6, 0], [7, 3]),
        '3,1': tile(1),
        '5,1': tile(1),
        '1,3': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 1 }],
    turnLimit: 10,
    civilians: [
      { id: 'treaty-civilian-0', name: 'Stranded traveler', x: 7, y: 1 },
      { id: 'treaty-civilian-1', name: 'Student interpreter', x: 7, y: 4 },
    ],
    props: [{ id: 'treaty-cover', x: 5, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'treaty-collapse', kind: 'collapse', x: 3, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: TREATY_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'museum-that-moved',
    title: 'The Museum That Moved',
    venue: 'Academy exhibition of living mineral fossils',
    objective:
      'Read the mineral memories and raise an escape passage at the plinth. Stand on column 5, row 4 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls(
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 4],
          [3, 0],
          [5, 4],
          [6, 1],
          [7, 5],
        ),
        '4,3': tile(0),
        '1,4': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 4, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'fossil-civilian-0', name: 'Sentient fossil', x: 7, y: 2 },
      { id: 'fossil-civilian-1', name: 'Exhibition caretaker', x: 7, y: 4 },
    ],
    props: [{ id: 'fossil-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'fossil-collapse', kind: 'collapse', x: 5, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FOSSIL_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'song-for-the-drowned',
    title: 'A Song for the Drowned',
    venue: 'Coastal cleanup festival rescue pontoon',
    objective:
      "Redirect the tide using controlled harmony at the pontoon's acoustic beacon. Get within 3 tiles of column 6, row 4 with clear sight with one AP free, then evacuate both civilians.",
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 2], [2, 4], [4, 0], [4, 5], [6, 1], [7, 3]),
        '3,3': tile(1),
        '5,3': tile(1),
        '0,5': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'tide-civilian-0', name: 'Cleanup diver', x: 7, y: 2 },
      { id: 'tide-civilian-1', name: 'Vulnerable singer', x: 7, y: 5 },
    ],
    props: [{ id: 'tide-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'tide-collapse', kind: 'collapse', x: 6, y: 2, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: TIDE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'orders-from-home',
    title: 'Orders From Home',
    venue: 'Academy training yard around a crashed military capsule',
    objective:
      "Sever the command relay's capture net without touching the captives. Stand beside column 5, row 3 with one AP free, then evacuate both civilians.",
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [2, 5], [5, 1], [6, 0], [7, 3]),
        '3,2': tile(0),
        '4,2': tile(0),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'warrant-civilian-0', name: 'Capsule survivor', x: 7, y: 2 },
      { id: 'warrant-civilian-1', name: 'Civilian rescuer', x: 7, y: 4 },
    ],
    props: [{ id: 'warrant-cover', x: 5, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'warrant-collapse', kind: 'collapse', x: 6, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: WARRANT_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'small-future',
    title: 'A Small Future',
    venue: 'Community energy research laboratory',
    objective:
      'Recalibrate the confiscation device from the diagnostic terminal. Get within 4 tiles of column 6, row 3 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 3], [3, 5], [4, 4], [6, 0], [7, 1]),
        '2,2': tile(1),
        '5,2': tile(1),
        '0,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 5, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'future-civilian-0', name: 'Human inventor', x: 7, y: 2 },
      { id: 'future-civilian-1', name: 'Lab technician', x: 7, y: 5 },
    ],
    props: [{ id: 'future-cover', x: 3, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'future-collapse', kind: 'collapse', x: 4, y: 3, round: 7 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: FUTURE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'missing-coronation',
    title: 'The Missing Coronation',
    venue: 'Amphitheater and mirrored royal courtyard',
    objective:
      'Open the royal gateway without binding anyone to the crown. Get within 2 tiles of column 5, row 4 with clear sight with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 2], [2, 4], [5, 0], [5, 5], [7, 2]),
        '3,3': tile(0),
        '4,3': tile(0),
        '1,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 3 }],
    turnLimit: 10,
    civilians: [
      { id: 'crown-civilian-0', name: 'Transported student', x: 7, y: 1 },
      { id: 'crown-civilian-1', name: 'Council representative', x: 7, y: 4 },
    ],
    props: [{ id: 'crown-cover', x: 6, y: 2, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'crown-collapse', kind: 'collapse', x: 5, y: 3, round: 5 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: CROWN_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'everyone-inside',
    title: 'Everyone Inside',
    venue: 'Academy counseling lounge during a missing-person search',
    objective:
      'Offer a reversible empathic link at the counseling table, with an explicit opt-out. Stand on column 5, row 3 with one AP free, then evacuate both civilians.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([2, 0], [2, 1], [2, 4], [2, 5], [4, 0], [5, 4], [7, 1]),
        '4,2': tile(1),
        '0,0': tile(0, false, { east: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 2 },
      { id: 'priya', x: 1, y: 0 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 8, y: 0 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 8, y: 5 },
    ],
    secrets: [{ x: 3, y: 0 }],
    hazards: [{ x: 4, y: 2 }],
    turnLimit: 10,
    civilians: [
      { id: 'hive-civilian-0', name: 'Exchange student', x: 7, y: 2 },
      { id: 'hive-civilian-1', name: 'Missing friend', x: 7, y: 4 },
    ],
    props: [{ id: 'hive-cover', x: 4, y: 3, cover: 'half', hp: 2 }],
    activeHazards: [
      { id: 'hive-collapse', kind: 'collapse', x: 3, y: 3, round: 6 },
    ],
    victory: { kind: 'rescue', count: 2 },
    script: HIVE_ORIGIN_SCRIPT,
  },
  {
    version: 1,
    id: 'college-quad',
    title: 'The Fountain Standoff',
    venue: 'College quad',
    objective: 'Outmaneuver the patrol around the central fountain.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 2], [4, 3], [5, 2], [5, 3]),
        '3,2': tile(0, false, { east: 'half' }),
        '6,3': tile(0, false, { west: 'half' }),
        '2,4': tile(1),
        '6,1': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 3, y: 1 }],
    hazards: [],
    turnLimit: 9,
  },
  {
    version: 1,
    id: 'science-lab',
    title: 'Science Wing Lockdown',
    venue: 'Cramped science laboratory',
    objective: 'Clear two narrow research aisles before lockdown.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([3, 0], [3, 1], [3, 3], [3, 4], [5, 1], [5, 2], [5, 4]),
        '2,2': tile(0, false, { east: 'half', north: 'half' }),
        '4,2': tile(0, false, { west: 'full' }),
        '6,3': tile(0, false, { west: 'half' }),
        '6,4': tile(0, false, { south: 'half' }),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 4, y: 4 }],
    hazards: [{ x: 6, y: 2 }],
    turnLimit: 8,
    props: [
      { id: 'bench-west', x: 2, y: 3, cover: 'full', hp: 2 },
      { id: 'bench-east', x: 6, y: 3, cover: 'half', hp: 2 },
    ],
    activeHazards: [{ id: 'coolant-water', kind: 'water', x: 6, y: 2 }],
    script: SCIENCE_WING_SCRIPT,
  },
  {
    version: 1,
    id: 'crosswalk-crisis',
    title: 'Crosswalk Crisis',
    venue: 'Harborline and Third, Academy tram stop',
    objective:
      'Escort all three stranded pedestrians to safety in eight rounds. Fighting the patrol alone will not clear the crossing.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [5, 0]),
        '2,1': tile(0, false, { east: 'half' }),
        '4,2': tile(0, false, { west: 'full', east: 'full' }),
        '5,3': tile(0, false, { north: 'half' }),
        '6,4': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 5, y: 1 }],
    hazards: [],
    turnLimit: 8,
    props: [
      { id: 'delivery-van', x: 4, y: 2, cover: 'full', hp: 3 },
      { id: 'street-kiosk', x: 5, y: 3, cover: 'half', hp: 2 },
      { id: 'concrete-planter', x: 2, y: 1, cover: 'half', hp: 2 },
    ],
    activeHazards: [{ id: 'tram-runoff', kind: 'water', x: 4, y: 4 }],
    waves: [
      {
        round: 4,
        crew: 'licensed-legends',
        spawns: [
          { x: 8, y: 0 },
          { x: 8, y: 5 },
        ],
      },
    ],
    civilians: [
      { id: 'courier', name: 'The wheelchair courier', x: 3, y: 1 },
      { id: 'conductor', name: 'The tram conductor', x: 3, y: 4 },
      { id: 'twins', name: 'The two lost twins', x: 6, y: 5 },
    ],
    victory: { kind: 'rescue', count: 3 },
    script: CROSSWALK_CRISIS_SCRIPT,
  },
  {
    version: 1,
    id: 'rooftop-broadcast',
    title: 'Rooftop Broadcast',
    venue: 'Comet City harbor transmitter terrace',
    objective:
      'Hold the elevated antenna pad for two rounds before the eighth round. Avoid the collapsing catwalk and watch the rival reinforcement hatches.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [4, 5], [6, 0]),
        '2,1': tile(1),
        '3,1': tile(1),
        '3,2': tile(1, false, { north: 'half' }),
        '4,2': tile(2),
        '4,3': tile(2),
        '5,2': tile(1, false, { east: 'half' }),
        '5,3': tile(1),
        '6,2': tile(1),
        '5,4': tile(1),
        '2,4': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 5, y: 4 }],
    hazards: [],
    turnLimit: 8,
    props: [
      { id: 'antenna-cabinet', x: 4, y: 1, cover: 'full', hp: 3 },
      { id: 'roof-vent', x: 6, y: 3, cover: 'half', hp: 2 },
      { id: 'relay-case', x: 2, y: 3, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'catwalk-collapse', kind: 'collapse', x: 3, y: 3, round: 4 },
      { id: 'rainwater-cable', kind: 'water', x: 5, y: 1 },
    ],
    waves: [
      {
        round: 4,
        crew: 'licensed-legends',
        spawns: [{ x: 8, y: 0 }],
      },
    ],
    victory: {
      kind: 'hold-zone',
      rounds: 2,
      cells: [
        { x: 4, y: 2 },
        { x: 4, y: 3 },
      ],
    },
    script: ROOFTOP_BROADCAST_SCRIPT,
  },
  {
    version: 1,
    id: 'under-comet-breach',
    title: 'Under-Comet Breach',
    venue: 'Containment tunnels below Comet City Academy',
    objective:
      'Break the rival seal-keeper before the seventh round ends. Split your team across two tunnels, dodge live coolant and avoid the falling bridge.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([3, 0], [3, 5], [5, 0], [5, 5]),
        '2,1': tile(1, false, { east: 'half' }),
        '2,4': tile(1, false, { east: 'half' }),
        '3,2': tile(1),
        '3,3': tile(1),
        '4,2': tile(2),
        '4,3': tile(2),
        '5,2': tile(1, false, { west: 'half' }),
        '5,3': tile(1),
        '6,3': tile(1, false, { west: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 1 },
      { id: 'priya', x: 0, y: 4 },
      { id: 'hattie', x: 1, y: 5 },
      { id: 'pip', x: 7, y: 2 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 7, y: 4 },
    ],
    secrets: [{ x: 4, y: 4 }],
    hazards: [],
    turnLimit: 7,
    props: [
      { id: 'north-valve', x: 2, y: 2, cover: 'half', hp: 2 },
      { id: 'south-pump', x: 2, y: 3, cover: 'full', hp: 3 },
      { id: 'seal-console', x: 6, y: 2, cover: 'full', hp: 3 },
    ],
    activeHazards: [
      { id: 'reactor-coolant', kind: 'water', x: 5, y: 4 },
      { id: 'leaking-fuel', kind: 'fire', x: 4, y: 1 },
      { id: 'bridge-collapse', kind: 'collapse', x: 3, y: 3, round: 4 },
    ],
    waves: [
      {
        round: 3,
        crew: 'wombat-ronin',
        spawns: [{ x: 8, y: 0 }],
      },
      {
        round: 5,
        crew: 'licensed-legends',
        spawns: [{ x: 8, y: 5 }],
      },
    ],
    victory: { kind: 'defeat-boss', unit: 'pip' },
    script: UNDER_COMET_BREACH_SCRIPT,
  },
  {
    version: 1,
    id: 'prom-night-finale',
    title: "Prom Night: Everybody's Villain",
    venue: 'Comet City Academy grand ballroom',
    objective:
      'Survive all six rounds of a three-faction siege. Clear the opening rivals, block the burrowers, then outlast the trademark-wielding final wave until the emergency gates open.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [4, 5]),
        '3,1': tile(1, false, { south: 'half' }),
        '4,1': tile(1),
        '5,1': tile(1),
        '3,2': tile(0, false, { east: 'half' }),
        '5,2': tile(0, false, { west: 'half' }),
        '6,4': tile(0, false, { west: 'half' }),
      },
    },
    spawns: [
      { id: 'backdraft', x: 0, y: 4 },
      { id: 'priya', x: 1, y: 5 },
      { id: 'hattie', x: 0, y: 2 },
      { id: 'pip', x: 7, y: 1 },
      { id: 'vee', x: 8, y: 3 },
      { id: 'remy', x: 7, y: 4 },
    ],
    secrets: [{ x: 3, y: 5 }],
    hazards: [],
    turnLimit: null,
    props: [
      { id: 'bandstand', x: 4, y: 1, cover: 'full', hp: 3 },
      { id: 'buffet', x: 2, y: 2, cover: 'half', hp: 2 },
      { id: 'piano', x: 3, y: 4, cover: 'full', hp: 3 },
      { id: 'banquette', x: 6, y: 3, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'sparking-curtain', kind: 'fire', x: 5, y: 1 },
      { id: 'live-punch-bowl', kind: 'water', x: 4, y: 4 },
      { id: 'dance-floor-fracture', kind: 'collapse', x: 4, y: 3, round: 4 },
    ],
    waves: [
      {
        round: 3,
        crew: 'warren-wreckers',
        spawns: [{ x: 8, y: 0 }],
      },
      {
        round: 5,
        crew: 'licensed-legends',
        spawns: [
          { x: 8, y: 5 },
          { x: 6, y: 0 },
        ],
      },
    ],
    victory: { kind: 'survive', rounds: 6 },
    script: PROM_NIGHT_FINALE_SCRIPT,
  },
  {
    version: 1,
    id: 'quarry-lieutenant',
    title: 'The Deed Below · Mags Hardpan',
    encounter: 'quarry-lieutenant',
    venue: 'Old Quarry sub-basement and tunnel court',
    objective:
      'Stop the illegal title auction; break Mags Hardpan’s seismic rhythm while the Warren Wreckers defend the tunnels.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [4, 5]),
        '3,1': tile(0, false, { east: 'half' }),
        '5,1': tile(0, false, { west: 'half' }),
        '3,4': tile(0, false, { east: 'half' }),
        '5,4': tile(0, false, { west: 'half' }),
        '4,2': tile(1),
        '4,3': tile(1),
        '6,2': tile(1, false, { west: 'half' }),
        '2,3': tile(1, false, { east: 'half' }),
      },
    },
    spawns: DEFAULT_SPAWNS.map((spawn) =>
      spawn.id === 'pip' ? { ...spawn, x: 5, y: 2 } : spawn,
    ),
    secrets: [{ x: 4, y: 1 }],
    hazards: [],
    turnLimit: 10,
  },
  {
    version: 1,
    id: 'picnic-plaza',
    title: 'Picnic Panic',
    encounter: 'warren-wreckers',
    venue: 'Comet City plaza',
    objective:
      'Walk the families clear and stop every Warren Wrecker shift, including the two that tunnel in on rounds 3 and 5.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        '4,2': tile(0, false, { north: 'half', east: 'half' }),
        '4,3': tile(0, false, { south: 'half', west: 'half' }),
        '3,4': tile(0, false, { north: 'half' }),
        '6,1': tile(0, false, { south: 'half' }),
        '2,1': tile(0, false, { east: 'half' }),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 4, y: 0 }],
    hazards: [],
    turnLimit: 7,
    scenes: 'picnic-panic',
    civilians: [
      {
        id: 'lemonade',
        name: 'Gran Odile and the lemonade cooler',
        x: 3,
        y: 1,
      },
      { id: 'band', name: 'The brass band’s tuba player', x: 5, y: 5 },
      { id: 'twins', name: 'The Abara twins and their kite', x: 5, y: 3 },
    ],
    // Encounter timing: the second shift and the overtime shift. Each
    // molehill is whistled up a full round early and caves in under a boot.
    waves: [
      {
        round: 3,
        crew: 'warren-wreckers',
        spawns: [
          { x: 6, y: 0 },
          { x: 8, y: 5 },
        ],
      },
      {
        round: 5,
        crew: 'warren-wreckers',
        spawns: [
          { x: 2, y: 0 },
          { x: 8, y: 1 },
        ],
      },
    ],
  },
  {
    version: 1,
    id: 'quad-portal-watch',
    title: 'Portal Watch at the Fountain',
    encounter: 'wombat-ronin',
    venue: 'College quad, central fountain',
    objective:
      'Hold the quad while Lieutenant Teakettle’s Clockwork Wombat Ronin phase behind your cover.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 2], [4, 3], [5, 2], [5, 3]),
        '3,2': tile(0, false, { east: 'half' }),
        '6,3': tile(0, false, { west: 'half' }),
        '2,4': tile(1),
        '6,1': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 3, y: 1 }],
    hazards: [],
    turnLimit: 9,
  },
  {
    version: 1,
    id: 'lab-mascot-recall',
    title: 'Knockoff Mascot Recall',
    encounter: 'licensed-legends',
    venue: 'Science wing prop storage',
    objective:
      'Clear the aisles before Sir Cap-Permission’s wind-up mascots trademark every power in the lab.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([3, 0], [3, 1], [3, 3], [3, 4], [5, 1], [5, 2], [5, 4]),
        '2,2': tile(0, false, { east: 'half', north: 'half' }),
        '4,2': tile(0, false, { west: 'full' }),
        '6,3': tile(0, false, { west: 'half' }),
        '6,4': tile(0, false, { south: 'half' }),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [{ x: 4, y: 4 }],
    hazards: [],
    turnLimit: 9,
  },
  {
    version: 1,
    id: 'boiler-room',
    title: 'Boiler Room Breach',
    venue: 'Academy sub-basement boiler room',
    objective:
      'Survive six rounds while the boiler room burns, the floor gives and the Warren Wreckers dig in.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 0], [4, 5]),
        '6,1': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [],
    hazards: [],
    turnLimit: null,
    props: [
      { id: 'crate-1', x: 2, y: 2, cover: 'half', hp: 2 },
      { id: 'boiler', x: 3, y: 4, cover: 'full', hp: 3 },
      { id: 'crate-2', x: 6, y: 2, cover: 'half', hp: 2 },
      { id: 'toolbox', x: 5, y: 4, cover: 'half', hp: 1 },
    ],
    activeHazards: [
      { id: 'fire-1', kind: 'fire', x: 4, y: 2 },
      { id: 'water-1', kind: 'water', x: 2, y: 0 },
      { id: 'water-2', kind: 'water', x: 3, y: 0 },
      { id: 'water-3', kind: 'water', x: 6, y: 5 },
      { id: 'floor-1', kind: 'collapse', x: 4, y: 3, round: 3 },
      { id: 'floor-2', kind: 'collapse', x: 1, y: 3, round: 4 },
    ],
    waves: [
      {
        round: 3,
        crew: 'warren-wreckers',
        spawns: [
          { x: 8, y: 0 },
          { x: 8, y: 5 },
        ],
      },
    ],
    victory: { kind: 'survive', rounds: 6 },
    script: {
      version: 1,
      scenes: [
        {
          id: 'boiler-opening',
          title: 'Pressure Rising',
          trigger: { kind: 'opening' },
          start: 'l1',
          nodes: [
            {
              id: 'l1',
              speaker: 'narrator',
              emotion: 'neutral',
              camera: 'wide',
              text: 'Steam rolls along the ceiling pipes. One gauge is already in the red, and somebody has wedged the service door shut from this side.',
              next: 'l2',
            },
            {
              id: 'l2',
              speaker: 'pip',
              role: 'villain',
              emotion: 'sly',
              camera: 'low-angle',
              text: 'You came down here to play hero? Then hold this room for six rounds. We will see whose story it is when the pipes give.',
              next: null,
              branch: {
                when: { kind: 'perspective', perspective: 'villain' },
                then: 'l2v',
                else: 'l3',
              },
            },
            {
              id: 'l2v',
              speaker: 'pip',
              role: 'villain',
              emotion: 'determined',
              camera: 'over-shoulder',
              text: 'Quietly, to my own crew: keep them busy down here. If that boiler goes while they are upstairs, it takes the whole east wing with it.',
              next: 'l3',
            },
            {
              id: 'l3',
              speaker: 'backdraft',
              role: 'hero',
              emotion: 'determined',
              camera: 'close',
              text: 'Stay off the cracked tiles and keep a crate between you and their sightlines. Nobody goes swimming in that puddle on an even round.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-hatches',
          title: 'Something Under the Floor',
          trigger: { kind: 'turn', round: 2 },
          start: 'h1',
          nodes: [
            {
              id: 'h1',
              speaker: 'hattie',
              emotion: 'afraid',
              camera: 'over-shoulder',
              text: 'I can feel digging under the far wall. Two hatches are going to pop next round.',
              next: 'h2',
            },
            {
              id: 'h2',
              speaker: 'backdraft',
              emotion: 'determined',
              camera: 'close',
              text: 'Then we choose: sit on those hatches, or let them come and keep our medic patched.',
              next: null,
              choices: [
                {
                  label: 'Plug the hatches',
                  next: 'h3',
                  effects: [{ kind: 'flag', flag: 'plug-hatches' }],
                },
                {
                  label: 'Patch up and dig in',
                  next: null,
                  effects: [{ kind: 'heal' }],
                },
              ],
            },
            {
              id: 'h3',
              speaker: 'priya',
              emotion: 'joyful',
              camera: 'wide',
              text: 'On it. Nobody climbs out of a hole I am standing on.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-plugged',
          title: 'Hatch Duty',
          trigger: { kind: 'flag', flag: 'plug-hatches' },
          start: 'p1',
          nodes: [
            {
              id: 'p1',
              speaker: 'remy',
              emotion: 'angry',
              camera: 'low-angle',
              text: 'They are sitting on the tunnels! Somebody tell the bunnies to find another door.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-first-down',
          title: 'First Down',
          trigger: { kind: 'kill', team: 'rival', count: 1 },
          start: 'k1',
          nodes: [
            {
              id: 'k1',
              speaker: 'vee',
              emotion: 'afraid',
              camera: 'close',
              text: 'That was not supposed to happen. Nobody said the floor would fight back too.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-outnumbered',
          title: 'Two to One',
          trigger: { kind: 'faction', team: 'rival', lead: 2 },
          start: 'o1',
          nodes: [
            {
              id: 'o1',
              speaker: 'hattie',
              role: 'hero',
              emotion: 'afraid',
              camera: 'over-shoulder',
              text: 'They have us outnumbered two to one. Pull back behind the boiler and make them come to us.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-win',
          title: 'Pressure Released',
          trigger: { kind: 'closing', outcome: 'victory' },
          start: 'w1',
          nodes: [
            {
              id: 'w1',
              speaker: 'narrator',
              emotion: 'neutral',
              camera: 'wide',
              text: 'The relief valve finally sings. The rivals retreat up the ladder, and the boiler room goes quiet except for the dripping.',
              next: null,
              branch: {
                when: { kind: 'flag', flag: 'plug-hatches' },
                then: 'w3',
                else: 'w2',
              },
            },
            {
              id: 'w3',
              speaker: 'priya',
              role: 'sidekick',
              emotion: 'joyful',
              camera: 'close',
              text: 'Not one bunny got through those hatches. I am putting that on my résumé.',
              next: 'w2',
            },
            {
              id: 'w2',
              speaker: 'backdraft',
              emotion: 'joyful',
              camera: 'close',
              text: 'Six rounds. Remind me to ask the janitor for a raise on their behalf.',
              next: null,
            },
          ],
        },
        {
          id: 'boiler-loss',
          title: 'Steam and Silence',
          trigger: { kind: 'closing', outcome: 'defeat' },
          start: 'd1',
          nodes: [
            {
              id: 'd1',
              speaker: 'pip',
              emotion: 'sly',
              camera: 'low-angle',
              text: 'Told you. Down here, the building picks the winner.',
              next: null,
            },
          ],
        },
      ],
    },
  },
  {
    version: 1,
    id: 'fountain-hold',
    title: 'Hold the Fountain Steps',
    encounter: 'wombat-ronin',
    venue: 'College quad, central fountain',
    objective:
      'Hold the west fountain steps for three rounds. The spray is live on even rounds and the mascots are coming.',
    map: {
      width: 9,
      height: 6,
      tiles: {
        ...walls([4, 2], [4, 3], [5, 2], [5, 3]),
        '3,2': tile(0, false, { east: 'half' }),
        '6,3': tile(0, false, { west: 'half' }),
        '2,4': tile(1),
        '6,1': tile(1),
      },
    },
    spawns: DEFAULT_SPAWNS,
    secrets: [],
    hazards: [],
    turnLimit: 9,
    props: [
      { id: 'bench-1', x: 2, y: 1, cover: 'half', hp: 2 },
      { id: 'bench-2', x: 6, y: 4, cover: 'half', hp: 2 },
    ],
    activeHazards: [
      { id: 'spray-1', kind: 'water', x: 4, y: 4 },
      { id: 'spray-2', kind: 'water', x: 5, y: 4 },
    ],
    waves: [
      {
        round: 4,
        crew: 'licensed-legends',
        spawns: [
          { x: 8, y: 0 },
          { x: 8, y: 5 },
        ],
      },
    ],
    victory: {
      kind: 'hold-zone',
      rounds: 3,
      cells: [
        { x: 3, y: 2 },
        { x: 3, y: 3 },
      ],
    },
  },
]

function defaultCrew(stage: StageDraft): WaveCrew {
  return stage.encounter === 'wombat-ronin'
    ? 'wombat-ronin'
    : stage.encounter === 'licensed-legends'
      ? 'licensed-legends'
      : 'warren-wreckers'
}

/** Studio controls for the victory condition and the first wave. */
export function setVictory(
  stage: StageDraft,
  kind: StageVictory['kind'],
  amount?: number,
): StageDraft {
  const next = deepClone(stage)
  const n = Number.isInteger(amount) ? amount! : undefined
  const old = next.victory
  if (kind === 'defeat-all') delete next.victory
  else if (kind === 'survive')
    next.victory = {
      kind,
      rounds: n ?? (old?.kind === 'survive' ? old.rounds : 6),
    }
  else if (kind === 'rescue')
    next.victory = {
      kind,
      count:
        n ??
        (old?.kind === 'rescue' ? old.count : (next.civilians?.length ?? 1)),
    }
  else if (kind === 'defeat-boss')
    next.victory = {
      kind,
      unit: old?.kind === 'defeat-boss' ? old.unit : 'pip',
    }
  else
    next.victory = {
      kind,
      rounds: n ?? (old?.kind === 'hold-zone' ? old.rounds : 3),
      cells: old?.kind === 'hold-zone' ? old.cells : [],
    }
  return next
}
export function setBoss(stage: StageDraft, unit: string): StageDraft {
  const next = deepClone(stage)
  if (next.victory?.kind === 'defeat-boss') next.victory.unit = unit
  return next
}
export function setWave(
  stage: StageDraft,
  patch: { round?: number; crew?: WaveCrew },
): StageDraft {
  if (!stage.waves?.length) return stage
  const next = deepClone(stage)
  next.waves![0] = { ...next.waves![0]!, ...patch }
  return next
}

export const clonePreset = (id: string): StageDraft =>
  deepClone(STAGE_PRESETS.find((stage) => stage.id === id) ?? STAGE_PRESETS[0]!)

export function stageProblems(stage: StageDraft): string[] {
  const issues: string[] = []
  const { map } = stage
  if (
    stage.encounter !== undefined &&
    !STAGE_ENCOUNTERS.some((entry) => entry.id === stage.encounter)
  )
    issues.push('Unknown rival encounter.')
  if (map.width !== 9 || map.height !== 6)
    issues.push('This Vignette supports a 9 × 6 battlefield.')
  if (!stage.title.trim() || !stage.objective.trim())
    issues.push('A mission needs a title and objective.')
  const spawnKeys = new Set<string>()
  for (const spawn of stage.spawns) {
    if (!inside(map, spawn) || tileAt(map, spawn).wall)
      issues.push(spawn.id + ' must start on traversable ground.')
    if (spawnKeys.has(at(spawn.x, spawn.y)))
      issues.push('Two units cannot share a spawn.')
    spawnKeys.add(at(spawn.x, spawn.y))
  }
  if (
    stage.spawns.length !== 6 ||
    new Set(stage.spawns.map((s) => s.id)).size !== 6
  )
    issues.push('Place all three squad and three rival members.')
  if (
    stage.turnLimit !== null &&
    (!Number.isInteger(stage.turnLimit) ||
      stage.turnLimit < 2 ||
      stage.turnLimit > 40)
  )
    issues.push('Turn limits must be from 2 to 40 rounds.')
  const civilianIds = new Set<string>()
  for (const civilian of stage.civilians ?? []) {
    if (!inside(map, civilian) || tileAt(map, civilian).wall)
      issues.push('Civilians must wait on walkable ground.')
    if (spawnKeys.has(at(civilian.x, civilian.y)))
      issues.push('A civilian cannot share a spawn tile.')
    if (!civilian.id || civilianIds.has(civilian.id))
      issues.push('Each civilian needs a unique id.')
    civilianIds.add(civilian.id)
  }
  if ((stage.civilians?.length ?? 0) > 6)
    issues.push('A one-shot can hold at most six civilians.')
  if (stage.scenes !== undefined && stage.scenes !== 'picnic-panic')
    issues.push('Unknown scene set.')
  issues.push(...ruleProblems(stage))
  if (stage.script) {
    if (stage.scenes)
      issues.push('A stage uses either Picnic Panic scenes or its own script.')
    issues.push(...scriptProblems(stage.script, stage))
  }
  for (const marker of [...stage.secrets, ...stage.hazards]) {
    if (!inside(map, marker) || tileAt(map, marker).wall)
      issues.push('Secrets and hazards must occupy walkable cells.')
  }
  const heroes = stage.spawns.slice(0, 3)
  const rivals = stage.spawns.slice(3)
  if (
    heroes.length &&
    rivals.length &&
    !heroes.some((hero) =>
      rivals.some(
        (rival) =>
          Number.isFinite(pathDistance(map, [], hero, rival)) ||
          lineOfSight(map, hero, rival),
      ),
    )
  )
    issues.push('No squad member can reach or see a rival.')
  return [...new Set(issues)]
}

export function paintStage(
  stage: StageDraft,
  p: Point,
  brush: StudioBrush,
): StageDraft {
  if (!inside(stage.map, p)) return stage
  const next = deepClone(stage)
  const key = at(p.x, p.y)
  const occupied = next.spawns.some(
    (spawn) => spawn.x === p.x && spawn.y === p.y,
  )
  if (brush === 'squad-spawn' || brush === 'rival-spawn') {
    const id = brush === 'squad-spawn' ? 'backdraft' : 'pip'
    if (
      tileAt(next.map, p).wall ||
      next.spawns.some((u) => u.id !== id && u.x === p.x && u.y === p.y)
    )
      return stage
    const spawn = next.spawns.find((u) => u.id === id)
    if (spawn) {
      spawn.x = p.x
      spawn.y = p.y
    }
    return next
  }
  if (brush === 'civilian') {
    if (occupied || tileAt(next.map, p).wall) return stage
    const civilians = next.civilians ?? []
    const exists = civilians.findIndex((c) => c.x === p.x && c.y === p.y)
    if (exists >= 0) civilians.splice(exists, 1)
    else {
      if (civilians.length >= 6) return stage
      let n = 1
      while (civilians.some((c) => c.id === 'bystander-' + n)) n++
      civilians.push({
        id: 'bystander-' + n,
        name: BYSTANDER_NAMES[(n - 1) % BYSTANDER_NAMES.length]!,
        x: p.x,
        y: p.y,
      })
    }
    if (civilians.length) next.civilians = civilians
    else delete next.civilians
    return next
  }
  if (brush === 'prop') {
    if (tileAt(next.map, p).wall) return stage
    const props = next.props ?? []
    const at = props.findIndex((q) => q.x === p.x && q.y === p.y)
    if (at >= 0 && props[at]!.cover === 'half') {
      props[at] = { ...props[at]!, cover: 'full', hp: 3 }
    } else if (at >= 0) props.splice(at, 1)
    else {
      if (
        props.length >= 8 ||
        next.activeHazards?.some(
          (h) => h.kind === 'collapse' && h.x === p.x && h.y === p.y,
        )
      )
        return stage
      let n = 1
      while (props.some((q) => q.id === 'prop-' + n)) n++
      props.push({ id: 'prop-' + n, x: p.x, y: p.y, cover: 'half', hp: 2 })
    }
    if (props.length) next.props = props
    else delete next.props
    return next
  }
  if (brush === 'fire' || brush === 'water' || brush === 'collapse') {
    const kind: HazardKind = brush
    if (tileAt(next.map, p).wall) return stage
    const hazards = next.activeHazards ?? []
    const at = hazards.findIndex((h) => h.x === p.x && h.y === p.y)
    const sameKind = at >= 0 && hazards[at]!.kind === kind
    if (at >= 0) hazards.splice(at, 1)
    if (!sameKind) {
      if (
        kind !== 'water' &&
        (occupied ||
          next.civilians?.some((c) => c.x === p.x && c.y === p.y) ||
          (kind === 'collapse' &&
            next.props?.some((q) => q.x === p.x && q.y === p.y)))
      )
        return stage
      if (hazards.length >= 10) return stage
      let n = 1
      while (hazards.some((h) => h.id === kind + '-' + n)) n++
      hazards.push({
        id: kind + '-' + n,
        kind,
        x: p.x,
        y: p.y,
        ...(kind === 'collapse' ? { round: 3 } : {}),
      })
    }
    if (hazards.length) next.activeHazards = hazards
    else delete next.activeHazards
    return next
  }
  if (brush === 'reinforce') {
    if (tileAt(next.map, p).wall) return stage
    const wave: StageWave = next.waves?.[0] ?? {
      round: 3,
      crew: defaultCrew(next),
      spawns: [],
    }
    const at = wave.spawns.findIndex((q) => q.x === p.x && q.y === p.y)
    if (at >= 0) wave.spawns.splice(at, 1)
    else if (wave.spawns.length >= 3) return stage
    else wave.spawns.push({ ...p })
    const rest = (next.waves ?? []).slice(1)
    next.waves = wave.spawns.length ? [wave, ...rest] : rest
    if (!next.waves.length) delete next.waves
    return next
  }
  if (brush === 'zone') {
    if (tileAt(next.map, p).wall) return stage
    const cells =
      next.victory?.kind === 'hold-zone' ? next.victory.cells : ([] as Point[])
    const at = cells.findIndex((q) => q.x === p.x && q.y === p.y)
    if (at >= 0) cells.splice(at, 1)
    else if (cells.length >= 6) return stage
    else cells.push({ ...p })
    next.victory = cells.length
      ? {
          kind: 'hold-zone',
          rounds: next.victory?.kind === 'hold-zone' ? next.victory.rounds : 3,
          cells,
        }
      : { kind: 'defeat-all' }
    return next
  }
  if (brush === 'secret' || brush === 'hazard') {
    if (occupied || tileAt(next.map, p).wall) return stage
    const points = brush === 'secret' ? next.secrets : next.hazards
    const exists = points.findIndex((q) => q.x === p.x && q.y === p.y)
    if (exists >= 0) points.splice(exists, 1)
    else points.push({ ...p })
    return next
  }
  if (occupied && brush === 'wall') return stage
  const tiles = Object.fromEntries(
    Object.entries(next.map.tiles).filter(
      ([tileKey]) => brush !== 'erase' || tileKey !== key,
    ),
  )
  if (brush === 'wall') tiles[key] = tile(0, true)
  if (brush === 'half-cover')
    tiles[key] = tile(tileAt(next.map, p).elevation, false, {
      north: 'half',
      east: 'half',
    })
  if (brush === 'full-cover')
    tiles[key] = tile(tileAt(next.map, p).elevation, false, {
      north: 'full',
      east: 'full',
    })
  if (brush === 'rise')
    tiles[key] = tile((tileAt(next.map, p).elevation + 1) % 3)
  next.map = { ...next.map, tiles }
  next.secrets = next.secrets.filter((q) => !tileAt(next.map, q).wall)
  next.hazards = next.hazards.filter((q) => !tileAt(next.map, q).wall)
  return pruneWalledRules(next)
}

/** Painting a wall removes any live rule standing on that tile. */
function pruneWalledRules(next: StageDraft): StageDraft {
  const open = (q: Point) => !tileAt(next.map, q).wall
  if (next.props) {
    next.props = next.props.filter(open)
    if (!next.props.length) delete next.props
  }
  if (next.activeHazards) {
    next.activeHazards = next.activeHazards.filter(open)
    if (!next.activeHazards.length) delete next.activeHazards
  }
  if (next.waves) {
    next.waves = next.waves
      .map((wave) => ({ ...wave, spawns: wave.spawns.filter(open) }))
      .filter((wave) => wave.spawns.length)
    if (!next.waves.length) delete next.waves
  }
  if (next.victory?.kind === 'hold-zone') {
    const cells = next.victory.cells.filter(open)
    next.victory = cells.length
      ? { ...next.victory, cells }
      : { kind: 'defeat-all' }
  }
  if (next.civilians) {
    next.civilians = next.civilians.filter((c) => !tileAt(next.map, c).wall)
    if (!next.civilians.length) delete next.civilians
  }
  return next
}
