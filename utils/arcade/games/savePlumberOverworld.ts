/**
 * Save the Plumber's world maps (conductor save-the-plumber t-002, t-011,
 * t-024; projects/kr-arcade/GEN2-STANDARD.md section 1). Each world is a
 * walkable map in the Super Mario World manner: nodes for courses, fortresses,
 * Hush Houses, cottages, shops and Valve Chapels, joined by paths that open
 * when the node behind them is cleared by the exit they name; cleared nodes
 * stay open for revisits, castles lead on to the next world, and secret exits
 * open side paths and the Upstream Sky.
 *
 * The graph is conductor projects/save-the-plumber/gen2Worlds.json (the
 * GEN2-WORLDS.md design), copied here as savePlumberGen2Worlds.json. A node
 * with a `stage` plays that Gen-1 stage today; a node without one is not built
 * yet: it shows on the map as coming soon and never blocks the road (a normal
 * path out of it opens as soon as she can walk to it), so the campaign stays
 * finishable while t-020/t-021 build the new courses.
 *
 * Pure data and rules; the cabinet (savePlumberPreview.ts) walks and draws it.
 * Coordinates are in the cabinet's 480 x 270 screen, placed on the clearings
 * of each world's painted map plate (conductor art/GEN2-ROUND-1.yaml, Krea 2).
 */
import GEN2 from './savePlumberGen2Worlds.json'

export type MapDirection = 'up' | 'down' | 'left' | 'right'
export type NodeKind =
  | 'start'
  | 'level'
  | 'fortress'
  | 'house'
  | 'bonus'
  | 'shop'
  | 'chapel'
  | 'castle'
  | 'special'
export type StageExit = 'normal' | 'secret'

export type MapNode = {
  id: string
  kind: NodeKind
  world: number
  name: string
  x: number
  y: number
  /** The Gen-1 stage this node plays today (none: not built yet). */
  stage?: string
  /** The design gives this node a secret exit. */
  secretExit?: boolean
}

export type MapPath = {
  from: string
  to: string
  /** What opens it: clearing `node` by `exit`. Null paths are always open. */
  unlock: { node: string; exit: StageExit } | null
  /** Leaves this world's map for `to` on another one, heading `dir`. */
  warp?: MapDirection
}

export type WorldMap = {
  world: number
  name: string
  /** The Upstream Sky: reached only through secret exits. */
  special: boolean
  /** The painted map plate, or none (drawn in code). */
  plate: string | null
  nodes: MapNode[]
  paths: MapPath[]
}

export type MapProgress = {
  /** Node ids cleared by their normal exit. */
  done: readonly string[]
  /** Node ids cleared by a secret exit. */
  secrets?: readonly string[]
  /** Gen-1 stage codes whose Golden Gear has been found. */
  gears?: readonly string[]
}

type RawWorld = {
  world: number
  name: string
  special?: boolean
  nodes: {
    id: string
    kind: string
    name: string
    stage: string | null
    secretExit?: boolean
  }[]
  paths: {
    from: string
    to: string
    unlock: { node: string; exit: string } | null
    warp?: string
  }[]
}

/** Each node on its world's painted clearing (480 x 270). */
const LAYOUT: Record<string, [number, number]> = {
  // World 1: Bluebell Pipeworks
  'w1-start': [60, 215],
  '1-1': [125, 130],
  '1-2': [185, 165],
  '1-h': [240, 130],
  '1-b': [345, 172],
  '1-3': [215, 88],
  '1-c': [105, 55],
  '1-f': [300, 100],
  '1-4': [400, 140],
  '1-castle': [345, 70],
  // World 2: Tideglass Marina
  'w2-start': [130, 215],
  '2-1': [205, 185],
  '2-2': [245, 150],
  '2-s': [250, 98],
  '2-3': [190, 115],
  '2-h': [290, 112],
  '2-4': [330, 190],
  '2-f': [355, 118],
  '2-castle': [385, 62],
  // World 3: Lantern Orchard
  'w3-start': [80, 222],
  '3-1': [110, 160],
  '3-b': [185, 135],
  '3-2': [180, 205],
  '3-c': [440, 140],
  '3-h': [230, 165],
  '3-3': [280, 130],
  '3-f': [240, 85],
  '3-4': [320, 85],
  '3-castle': [345, 50],
  // World 4: Clockwork Fair
  'w4-start': [60, 215],
  '4-1': [110, 200],
  '4-2': [190, 160],
  '4-s': [290, 185],
  '4-3': [250, 215],
  '4-h': [270, 125],
  '4-c': [420, 195],
  '4-f': [330, 165],
  '4-4': [360, 100],
  '4-castle': [365, 48],
  // World 5: Cloudrail Commons
  'w5-start': [60, 215],
  '5-1': [110, 195],
  '5-2': [220, 205],
  '5-b': [150, 165],
  '5-h': [250, 160],
  '5-3': [195, 128],
  '5-f': [270, 105],
  '5-4': [330, 160],
  '5-castle': [370, 70],
  // World 6: Crystal Underworks
  'w6-start': [90, 210],
  '6-1': [100, 145],
  '6-b': [270, 140],
  '6-2': [190, 185],
  '6-c': [420, 140],
  '6-h': [215, 140],
  '6-3': [180, 100],
  '6-f': [250, 92],
  '6-4': [310, 78],
  '6-castle': [335, 45],
  // World 7: Night Market Rooftops
  'w7-start': [90, 222],
  '7-1': [100, 150],
  '7-2': [180, 190],
  '7-s': [165, 140],
  '7-3': [250, 155],
  '7-h': [170, 108],
  '7-f': [320, 195],
  '7-4': [300, 130],
  '7-castle': [355, 65],
  // World 8: Stardrain Citadel
  'w8-start': [80, 215],
  '8-1': [110, 135],
  '8-2': [165, 190],
  '8-h': [230, 128],
  '8-f': [180, 98],
  '8-3': [280, 175],
  '8-s': [320, 130],
  '8-castle': [300, 72],
  // Upstream Sky (no plate yet)
  'sky-1': [70, 200],
  'sky-2': [140, 140],
  'sky-3': [210, 190],
  'sky-4': [280, 130],
  'sky-5': [350, 180],
  'sky-6': [410, 100],
}

const KINDS: readonly NodeKind[] = [
  'start',
  'level',
  'fortress',
  'house',
  'bonus',
  'shop',
  'chapel',
  'castle',
  'special',
]
const DIRS: readonly MapDirection[] = ['up', 'down', 'left', 'right']

function buildWorld(raw: RawWorld): WorldMap {
  const special = raw.special === true
  return {
    world: raw.world,
    name: raw.name,
    special,
    plate: special ? null : `/save-the-plumber/maps/world-${raw.world}.webp`,
    nodes: raw.nodes.map((n) => {
      const [x, y] = LAYOUT[n.id] ?? [240, 135]
      return {
        id: n.id,
        kind: KINDS.includes(n.kind as NodeKind)
          ? (n.kind as NodeKind)
          : 'level',
        world: raw.world,
        name: n.name,
        x,
        y,
        ...(n.stage ? { stage: n.stage } : {}),
        ...(n.secretExit ? { secretExit: true } : {}),
      }
    }),
    paths: raw.paths.map((p) => ({
      from: p.from,
      to: p.to,
      unlock: p.unlock
        ? {
            node: p.unlock.node,
            exit: p.unlock.exit === 'secret' ? 'secret' : 'normal',
          }
        : null,
      ...(p.warp && DIRS.includes(p.warp as MapDirection)
        ? { warp: p.warp as MapDirection }
        : {}),
    })),
  }
}

export const OVERWORLD: WorldMap[] = (GEN2 as RawWorld[]).map(buildWorld)

/** The campaign's worlds (1-8); the Upstream Sky is `SKY_WORLD`. */
export const WORLD_COUNT = OVERWORLD.filter((w) => !w.special).length
export const SKY_WORLD = OVERWORLD.find((w) => w.special)?.world ?? 0

const NODES = new Map(
  OVERWORLD.flatMap((w) => w.nodes).map((n) => [n.id, n] as const),
)
const BY_STAGE = new Map(
  OVERWORLD.flatMap((w) => w.nodes)
    .filter((n) => n.stage)
    .map((n) => [n.stage!, n] as const),
)
const ALL_PATHS = OVERWORLD.flatMap((w) => w.paths)

/**
 * Nodes whose level has a playable secret exit today. The design gives many
 * nodes one (`secretExit`); each joins this list when t-020/t-021 build it,
 * so completion never counts an exit nobody can find.
 */
export const SECRET_EXITS_READY: ReadonlySet<string> = new Set<string>()

export function mapNode(id: string | undefined): MapNode | undefined {
  return id ? NODES.get(id) : undefined
}

export function worldMap(world: number): WorldMap {
  return OVERWORLD.find((w) => w.world === world) ?? OVERWORLD[0]!
}

export const startId = (world: number) => `w${world}-start`

/** The node a Gen-1 stage is played from. */
export function stageNode(code: string): MapNode | undefined {
  return BY_STAGE.get(code)
}

/** A node she can play today. */
export function nodeBuilt(node: MapNode | undefined): boolean {
  return !!node?.stage
}

function cleared(id: string, exit: StageExit, progress: MapProgress) {
  return (
    exit === 'secret' ? (progress.secrets ?? []) : progress.done
  ).includes(id)
}

/**
 * Every path she can walk. A path opens when its node is cleared by the named
 * exit; a normal path out of a node that is not built yet opens as soon as
 * she can reach that node, so unbuilt nodes never block the road.
 */
export function openPaths(progress: MapProgress): MapPath[] {
  const open = new Set<MapPath>()
  // Anywhere she has cleared, she has stood (an old save may skip ahead).
  const reached = new Set<string>([
    startId(1),
    ...progress.done,
    ...(progress.secrets ?? []),
  ])
  const unlocked = (path: MapPath) => {
    const u = path.unlock
    if (!u || cleared(u.node, u.exit, progress)) return true
    return (
      u.exit === 'normal' &&
      !nodeBuilt(NODES.get(u.node)) &&
      reached.has(u.node)
    )
  }
  // A path opens once its condition holds and she can stand at one end of it.
  for (let grew = true; grew;) {
    grew = false
    for (const path of ALL_PATHS) {
      if (open.has(path)) continue
      if (!reached.has(path.from) && !reached.has(path.to)) continue
      if (!unlocked(path)) continue
      open.add(path)
      reached.add(path.from)
      reached.add(path.to)
      grew = true
    }
  }
  return ALL_PATHS.filter((p) => open.has(p))
}

export function pathOpen(path: MapPath, progress: MapProgress): boolean {
  return openPaths(progress).includes(path)
}

/** Paths that `after` opens and `before` did not: the ones to draw being revealed. */
export function newlyOpened(
  before: MapProgress,
  after: MapProgress,
): MapPath[] {
  const was = new Set(openPaths(before))
  return openPaths(after).filter((p) => !was.has(p))
}

/** A node is reachable when it is the first trailhead or an open path touches it. */
export function nodeReachable(id: string, progress: MapProgress): boolean {
  if (id === startId(1)) return NODES.has(id)
  return openPaths(progress).some((p) => p.to === id || p.from === id)
}

const VECTORS: Record<MapDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
const OPPOSITE: Record<MapDirection, MapDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/** The edge a warp leaves this end of the path by. */
export function warpHeading(path: MapPath, from: string): MapDirection | null {
  if (!path.warp) return null
  return path.from === from ? path.warp : OPPOSITE[path.warp]
}

/**
 * Where a press of `dir` takes her from `from`: along the open path whose
 * heading best matches the press (within 60 degrees), either way along it.
 */
export function stepFrom(
  from: string,
  dir: MapDirection,
  progress: MapProgress,
): { to: MapNode; path: MapPath } | null {
  const here = NODES.get(from)
  if (!here) return null
  const [vx, vy] = VECTORS[dir]
  let best: { to: MapNode; path: MapPath; score: number } | null = null
  for (const path of openPaths(progress)) {
    const forward = path.from === from
    if (!forward && path.to !== from) continue
    const other = NODES.get(forward ? path.to : path.from)
    if (!other) continue
    const heading = warpHeading(path, from)
    const [dx, dy] = heading
      ? VECTORS[heading]
      : [other.x - here.x, other.y - here.y]
    const length = Math.hypot(dx, dy) || 1
    const score = (dx * vx + dy * vy) / length
    if (score >= 0.5 && (!best || score > best.score))
      best = { to: other, path, score }
  }
  return best ? { to: best.to, path: best.path } : null
}

export type WorldCompletion = {
  world: number
  stages: number
  stagesDone: number
  gears: number
  gearsFound: number
  secrets: number
  secretsFound: number
}

/** A world's completion, counting only what can be played today. */
export function worldCompletion(
  world: number,
  progress: MapProgress,
): WorldCompletion {
  const built = worldMap(world).nodes.filter(nodeBuilt)
  const done = new Set([...progress.done, ...(progress.secrets ?? [])])
  const secrets = built.filter((n) => SECRET_EXITS_READY.has(n.id))
  return {
    world,
    stages: built.length,
    stagesDone: built.filter((n) => done.has(n.id)).length,
    gears: built.length,
    gearsFound: built.filter((n) => progress.gears?.includes(n.stage!)).length,
    secrets: secrets.length,
    secretsFound: secrets.filter((n) => progress.secrets?.includes(n.id))
      .length,
  }
}

/** Whole-campaign completion, 0-100: courses cleared, Golden Gears and secret exits found. */
export function completionPercent(progress: MapProgress): number {
  let have = 0
  let total = 0
  for (const map of OVERWORLD) {
    const c = worldCompletion(map.world, progress)
    have += c.stagesDone + c.gearsFound + c.secretsFound
    total += c.stages + c.gears + c.secrets
  }
  return total ? Math.floor((100 * have) / total) : 0
}
