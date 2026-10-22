/**
 * Save the Plumber's world maps (conductor save-the-plumber t-011; projects/
 * kr-arcade/GEN2-STANDARD.md section 1). Each world is a walkable map in the
 * Super Mario Bros. 3 / Super Mario World manner: nodes for stages joined by
 * paths, a path opening when the stage behind it is cleared by the exit it
 * names, cleared stages left open for revisits, and the castle's path leading
 * on to the next world.
 *
 * Pure data and rules; the cabinet (savePlumberPreview.ts) walks and draws it.
 * Coordinates are in the cabinet's 480 x 270 screen. The graphs mirror the
 * Gen-1 campaign (four stages a world) until conductor t-002's GEN2-WORLDS.md
 * adds fortresses, Hush Houses, Valve Chapels and secret exits; `exit:
 * 'secret'` paths are already supported for them.
 */
import { CAMPAIGN, stageWorld } from './savePlumberLevels'

export type MapDirection = 'up' | 'down' | 'left' | 'right'
export type NodeKind = 'start' | 'level' | 'castle'
export type StageExit = 'normal' | 'secret'

export type MapNode = {
  id: string
  kind: NodeKind
  world: number
  x: number
  y: number
  /** The stage this node enters (none for a start node). */
  stage?: string
}

export type MapPath = {
  from: string
  to: string
  /** What opens it: clearing `stage` by `exit`. Null paths are always open. */
  unlock: { stage: string; exit: StageExit } | null
  /** Leaves this world's map for `to` on the next one, heading `dir`. */
  warp?: MapDirection
}

export type WorldMap = { world: number; nodes: MapNode[]; paths: MapPath[] }

export type MapProgress = {
  done: readonly string[]
  secrets?: readonly string[]
  gears?: readonly string[]
}

export const WORLD_COUNT = Math.max(...CAMPAIGN.map((s) => stageWorld(s.code)))

/** Hand-placed World 1; later worlds wind across the map in their own rhythm. */
const LAYOUTS: Record<number, [number, number][]> = {
  1: [
    [52, 206],
    [126, 172],
    [204, 206],
    [278, 140],
    [392, 112],
  ],
}

function layout(world: number): [number, number][] {
  const fixed = LAYOUTS[world]
  if (fixed) return fixed
  const rise = (world % 3) * 14
  return [0, 1, 2, 3, 4].map((i) => [
    50 + i * 95,
    200 - rise - (i % 2 ? 46 : 0) - (i === 4 ? 30 : 0),
  ])
}

export const startId = (world: number) => `w${world}-start`

function buildWorld(world: number): WorldMap {
  const stages = CAMPAIGN.filter((s) => stageWorld(s.code) === world)
  const spots = layout(world)
  const nodes: MapNode[] = [
    {
      id: startId(world),
      kind: 'start',
      world,
      x: spots[0]![0],
      y: spots[0]![1],
    },
    ...stages.map((s, i) => ({
      id: s.code,
      kind: (i === stages.length - 1 ? 'castle' : 'level') as NodeKind,
      world,
      x: spots[i + 1]![0],
      y: spots[i + 1]![1],
      stage: s.code,
    })),
  ]
  const paths: MapPath[] = []
  for (let i = 1; i < nodes.length; i++) {
    const behind = nodes[i - 1]!
    paths.push({
      from: behind.id,
      to: nodes[i]!.id,
      unlock: behind.stage ? { stage: behind.stage, exit: 'normal' } : null,
    })
  }
  const castle = nodes[nodes.length - 1]!
  if (world < WORLD_COUNT && castle.stage)
    paths.push({
      from: castle.id,
      to: startId(world + 1),
      unlock: { stage: castle.stage, exit: 'normal' },
      warp: 'right',
    })
  return { world, nodes, paths }
}

export const OVERWORLD: WorldMap[] = Array.from(
  { length: WORLD_COUNT },
  (_, i) => buildWorld(i + 1),
)

const NODES = new Map(
  OVERWORLD.flatMap((w) => w.nodes).map((n) => [n.id, n] as const),
)

export function mapNode(id: string | undefined): MapNode | undefined {
  return id ? NODES.get(id) : undefined
}

export function worldMap(world: number): WorldMap {
  return OVERWORLD[Math.min(Math.max(world, 1), WORLD_COUNT) - 1]!
}

/** The node a stage is entered from. */
export function stageNode(code: string): MapNode | undefined {
  return NODES.get(code)
}

export function pathOpen(path: MapPath, progress: MapProgress): boolean {
  if (!path.unlock) return true
  const list =
    path.unlock.exit === 'secret' ? (progress.secrets ?? []) : progress.done
  return list.includes(path.unlock.stage)
}

/** Every path she can walk, across all worlds. */
export function openPaths(progress: MapProgress): MapPath[] {
  return OVERWORLD.flatMap((w) => w.paths).filter((p) => pathOpen(p, progress))
}

/** Paths that `after` opens and `before` did not: the ones to draw being revealed. */
export function newlyOpened(
  before: MapProgress,
  after: MapProgress,
): MapPath[] {
  return openPaths(after).filter((p) => !pathOpen(p, before))
}

const VECTORS: Record<MapDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/** A node is reachable when it is a world start or an open path touches it. */
export function nodeReachable(id: string, progress: MapProgress): boolean {
  const node = NODES.get(id)
  if (!node) return false
  if (node.id === startId(1)) return true
  return openPaths(progress).some((p) => p.to === id || p.from === id)
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
    let dx: number
    let dy: number
    if (path.warp) {
      // A warp leaves by the map's edge, and comes back in by the opposite one.
      ;[dx, dy] = VECTORS[path.warp]
      if (!forward) [dx, dy] = [-dx, -dy]
    } else {
      dx = other.x - here.x
      dy = other.y - here.y
    }
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

export function worldCompletion(
  world: number,
  progress: MapProgress,
): WorldCompletion {
  const map = worldMap(world)
  const stages = map.nodes.filter((n) => n.stage).map((n) => n.stage!)
  const secretStages = [
    ...new Set(
      map.paths
        .filter((p) => p.unlock?.exit === 'secret')
        .map((p) => p.unlock!.stage),
    ),
  ]
  const done = new Set([...progress.done, ...(progress.secrets ?? [])])
  return {
    world,
    stages: stages.length,
    stagesDone: stages.filter((s) => done.has(s)).length,
    gears: stages.length,
    gearsFound: stages.filter((s) => progress.gears?.includes(s)).length,
    secrets: secretStages.length,
    secretsFound: secretStages.filter((s) => progress.secrets?.includes(s))
      .length,
  }
}

/** Whole-campaign completion, 0-100: stages cleared, Golden Gears and secret exits found. */
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
