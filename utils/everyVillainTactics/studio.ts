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
  'warren-wreckers' | 'quarry-lieutenant' | 'wombat-ronin' | 'licensed-legends'
export const STAGE_ENCOUNTERS: ReadonlyArray<{
  id: StageEncounter | null
  label: string
}> = [
  { id: null, label: 'Rival heroes' },
  { id: 'warren-wreckers', label: 'Warren Wreckers · burrowing' },
  { id: 'wombat-ronin', label: 'Clockwork Wombat Ronin · teleporting' },
  { id: 'licensed-legends', label: 'Licensed Legends · wind-up toys' },
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
    objective: 'Protect the picnic when burrowing bunny men surface.',
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
