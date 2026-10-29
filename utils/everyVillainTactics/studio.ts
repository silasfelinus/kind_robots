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
  encounter?: 'warren-wreckers'
}

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
  },
]

export const clonePreset = (id: string): StageDraft =>
  deepClone(STAGE_PRESETS.find((stage) => stage.id === id) ?? STAGE_PRESETS[0]!)

export function stageProblems(stage: StageDraft): string[] {
  const issues: string[] = []
  const { map } = stage
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
  return next
}
