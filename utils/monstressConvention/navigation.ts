/**
 * MONSTRIQUE stage navigation: where Iris can stand in each room, how she
 * walks around furniture and bodies, and how the map plans multi-room
 * shortcuts through the same access rules as a single door.
 *
 * Coordinates are stage percentages (x across, y down) matching hotspot
 * coordinates. Pathfinding is a deterministic grid A* followed by
 * line-of-sight smoothing, so the same click always walks the same route.
 */
import {
  HOTEL_ROOMS,
  travel,
  type CaseResult,
  type CaseState,
  type HotelHotspot,
  type RoomId,
} from './prologue'

export interface StagePoint {
  x: number
  y: number
}
export interface StageRect {
  x: number
  y: number
  w: number
  h: number
}
export interface WalkArea {
  floor: StageRect[]
  blocked: StageRect[]
  entry: StagePoint
  /** Where Iris appears when she arrives from a given room's door. */
  entries?: Partial<Record<RoomId, StagePoint>>
  /** Height (stage %) of a full-height character at the far and near floor. */
  depth?: { farY: number; far: number; nearY: number; near: number }
}

/**
 * Floors and furniture fitted to each painted background (utils/monstrique/
 * stageArt.ts). Rooms without a painting keep their vector-set floors.
 */
export const WALK_AREAS: Record<RoomId, WalkArea> = {
  'motel-exterior': {
    floor: [{ x: 2, y: 67, w: 96, h: 31 }],
    blocked: [
      { x: 71, y: 64, w: 27, h: 13 },
      { x: 57, y: 79, w: 6, h: 4 },
    ],
    entry: { x: 30, y: 88 },
    entries: {
      'front-office': { x: 27, y: 70 },
      'ice-alcove': { x: 44, y: 70 },
      'city-map': { x: 50, y: 95 },
    },
    depth: { farY: 67, far: 22, nearY: 98, near: 40 },
  },
  'front-office': {
    floor: [
      { x: 1, y: 62, w: 14, h: 36 },
      { x: 1, y: 93, w: 97, h: 5 },
      { x: 70, y: 84, w: 12, h: 14 },
    ],
    blocked: [],
    entry: { x: 8, y: 90 },
    entries: { balcony: { x: 76, y: 92 } },
    depth: { farY: 62, far: 42, nearY: 98, near: 64 },
  },
  'ice-alcove': {
    floor: [
      { x: 28, y: 79, w: 53, h: 19 },
      { x: 21, y: 88, w: 8, h: 10 },
    ],
    blocked: [],
    entry: { x: 26, y: 94 },
    entries: { balcony: { x: 74, y: 82 } },
    depth: { farY: 79, far: 52, nearY: 98, near: 72 },
  },
  balcony: {
    floor: [
      { x: 18, y: 84, w: 42, h: 14 },
      { x: 19, y: 72, w: 31, h: 12 },
      { x: 20, y: 62, w: 23, h: 10 },
      { x: 21, y: 54, w: 16, h: 8 },
    ],
    blocked: [],
    entry: { x: 26, y: 94 },
    entries: {
      'investigators-room': { x: 34, y: 62 },
      'neighbor-room': { x: 56, y: 95 },
      'odette-room': { x: 50, y: 87 },
    },
    depth: { farY: 54, far: 22, nearY: 98, near: 78 },
  },
  'investigators-room': {
    floor: [
      { x: 42, y: 80, w: 14, h: 18 },
      { x: 42, y: 93, w: 48, h: 5 },
      { x: 80, y: 70, w: 10, h: 28 },
    ],
    blocked: [{ x: 46, y: 84, w: 5, h: 3 }],
    entry: { x: 85, y: 94 },
    depth: { farY: 70, far: 50, nearY: 98, near: 74 },
  },
  'neighbor-room': {
    floor: [
      { x: 10, y: 92, w: 45, h: 6 },
      { x: 44, y: 80, w: 11, h: 18 },
    ],
    blocked: [],
    entry: { x: 30, y: 95 },
    depth: { farY: 80, far: 70, nearY: 98, near: 86 },
  },
  'odette-room': {
    floor: [
      { x: 1, y: 80, w: 18, h: 18 },
      { x: 1, y: 93, w: 97, h: 5 },
    ],
    blocked: [],
    entry: { x: 10, y: 94 },
    depth: { farY: 80, far: 66, nearY: 98, near: 82 },
  },
  'city-map': {
    floor: [{ x: 2, y: 60, w: 96, h: 38 }],
    blocked: [],
    entry: { x: 50, y: 92 },
  },
  'convention-center': {
    floor: [{ x: 2, y: 66, w: 96, h: 32 }],
    blocked: [{ x: 64, y: 66, w: 22, h: 8 }],
    entry: { x: 12, y: 90 },
  },
}

/** Where Iris stands on arrival: at the door she came through, if known. */
export function entryPoint(room: RoomId, from?: RoomId | null): StagePoint {
  const area = WALK_AREAS[room]
  return { ...((from && area.entries?.[from]) || area.entry) }
}

const CELL = 2
const COLUMNS = 100 / CELL
const ROWS = 100 / CELL

function inside(rect: StageRect, point: StagePoint): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  )
}

export function isWalkable(room: RoomId, point: StagePoint): boolean {
  const area = WALK_AREAS[room]
  return (
    area.floor.some((rect) => inside(rect, point)) &&
    !area.blocked.some((rect) => inside(rect, point))
  )
}

function cellCenter(column: number, row: number): StagePoint {
  return { x: column * CELL + CELL / 2, y: row * CELL + CELL / 2 }
}
function cellOf(point: StagePoint): [number, number] {
  const column = Math.min(COLUMNS - 1, Math.max(0, Math.floor(point.x / CELL)))
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor(point.y / CELL)))
  return [column, row]
}
function walkableCell(room: RoomId, column: number, row: number): boolean {
  if (column < 0 || row < 0 || column >= COLUMNS || row >= ROWS) return false
  return isWalkable(room, cellCenter(column, row))
}

/** The walkable spot nearest to any requested point (ties: lower, then left). */
export function nearestWalkable(room: RoomId, point: StagePoint): StagePoint {
  if (isWalkable(room, point)) return { x: point.x, y: point.y }
  let best: StagePoint | null = null
  let bestDistance = Infinity
  for (let row = ROWS - 1; row >= 0; row--)
    for (let column = 0; column < COLUMNS; column++) {
      if (!walkableCell(room, column, row)) continue
      const center = cellCenter(column, row)
      const distance = Math.hypot(center.x - point.x, center.y - point.y)
      if (distance < bestDistance - 1e-9) {
        best = center
        bestDistance = distance
      }
    }
  return best ?? { ...WALK_AREAS[room].entry }
}

/** Where Iris stands to work a hotspot: beside it, on the floor. */
export function approachPoint(
  room: RoomId,
  hotspot: Pick<HotelHotspot, 'x' | 'y'>,
): StagePoint {
  const side = hotspot.x > 50 ? -9 : 9
  const floorTop = Math.min(...WALK_AREAS[room].floor.map((rect) => rect.y))
  return nearestWalkable(room, {
    x: Math.min(96, Math.max(4, hotspot.x + side)),
    y: Math.max(hotspot.y + 6, floorTop + 4),
  })
}

function clearLine(room: RoomId, from: StagePoint, to: StagePoint): boolean {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.5)
  for (let step = 0; step <= steps; step++) {
    const t = steps === 0 ? 0 : step / steps
    if (
      !isWalkable(room, {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      })
    )
      return false
  }
  return true
}

const NEIGHBOURS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

/**
 * Walk route from `from` to `to`, both snapped to the floor. Returns the
 * waypoints after `from`, ending at the snapped destination; an empty list
 * means Iris is already there. Never cuts a blocked corner.
 */
export function findPath(
  room: RoomId,
  fromPoint: StagePoint,
  toPoint: StagePoint,
): StagePoint[] {
  const from = nearestWalkable(room, fromPoint)
  const to = nearestWalkable(room, toPoint)
  if (Math.hypot(to.x - from.x, to.y - from.y) < 0.01) return []
  if (clearLine(room, from, to)) return [to]
  const [startColumn, startRow] = cellOf(from)
  const [goalColumn, goalRow] = cellOf(to)
  const key = (column: number, row: number) => row * COLUMNS + column
  const cost = new Map<number, number>([[key(startColumn, startRow), 0]])
  const parent = new Map<number, number>()
  const open: Array<{ column: number; row: number; f: number; order: number }> =
    []
  let order = 0
  const heuristic = (column: number, row: number) => {
    const dx = Math.abs(column - goalColumn)
    const dy = Math.abs(row - goalRow)
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
  open.push({
    column: startColumn,
    row: startRow,
    f: heuristic(startColumn, startRow),
    order: order++,
  })
  const closed = new Set<number>()
  let reached = false
  while (open.length) {
    open.sort((a, b) => a.f - b.f || a.order - b.order)
    const current = open.shift()!
    const currentKey = key(current.column, current.row)
    if (closed.has(currentKey)) continue
    closed.add(currentKey)
    if (current.column === goalColumn && current.row === goalRow) {
      reached = true
      break
    }
    for (const [dx, dy] of NEIGHBOURS) {
      const column = current.column + dx
      const row = current.row + dy
      if (!walkableCell(room, column, row)) continue
      if (
        dx !== 0 &&
        dy !== 0 &&
        (!walkableCell(room, current.column + dx, current.row) ||
          !walkableCell(room, current.column, current.row + dy))
      )
        continue
      const nextKey = key(column, row)
      if (closed.has(nextKey)) continue
      const nextCost =
        (cost.get(currentKey) ?? 0) + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1)
      if (nextCost >= (cost.get(nextKey) ?? Infinity)) continue
      cost.set(nextKey, nextCost)
      parent.set(nextKey, currentKey)
      open.push({
        column,
        row,
        f: nextCost + heuristic(column, row),
        order: order++,
      })
    }
  }
  if (!reached) return []
  const cells: StagePoint[] = []
  let cursor: number | undefined = key(goalColumn, goalRow)
  while (cursor !== undefined && cursor !== key(startColumn, startRow)) {
    cells.unshift(cellCenter(cursor % COLUMNS, Math.floor(cursor / COLUMNS)))
    cursor = parent.get(cursor)
  }
  cells[cells.length - 1] = to
  const smoothed: StagePoint[] = []
  let anchor = from
  let index = 0
  while (index < cells.length) {
    let furthest = index
    for (let probe = cells.length - 1; probe > index; probe--)
      if (clearLine(room, anchor, cells[probe]!)) {
        furthest = probe
        break
      }
    smoothed.push(cells[furthest]!)
    anchor = cells[furthest]!
    index = furthest + 1
  }
  return smoothed
}

export function pathLength(from: StagePoint, path: StagePoint[]): number {
  let total = 0
  let previous = from
  for (const point of path) {
    total += Math.hypot(point.x - previous.x, point.y - previous.y)
    previous = point
  }
  return total
}

/** Perspective: characters further up the floor are drawn smaller. */
export function depthScale(y: number): number {
  const t = Math.min(1, Math.max(0, (y - 50) / 48))
  return 0.72 + 0.28 * t
}

const DEFAULT_DEPTH = { farY: 50, far: 52 * 0.72, nearY: 98, near: 52 }

/**
 * Height, as a percentage of the stage, of a full-height character whose
 * feet are at `y` in `room`, following the painting's perspective.
 */
export function figureHeight(room: RoomId, y: number): number {
  const depth = WALK_AREAS[room].depth ?? DEFAULT_DEPTH
  const t = Math.min(
    1,
    Math.max(0, (y - depth.farY) / (depth.nearY - depth.farY)),
  )
  return depth.far + (depth.near - depth.far) * t
}

/** Norb keeps a germ-safe distance on the floor, away from Iris. */
export function followerPoint(room: RoomId, iris: StagePoint): StagePoint {
  const offset = iris.x >= 50 ? -26 : 26
  return nearestWalkable(room, {
    x: Math.min(96, Math.max(4, iris.x + offset)),
    y: iris.y - 4,
  })
}

export type RoomStep = (state: CaseState, destination: RoomId) => CaseResult

/**
 * Shortest door-by-door route to a room, honouring every access rule the
 * single-door `travel` enforces (sealed 205, city lead, edition filters).
 */
export function planRoute(
  state: CaseState,
  destination: RoomId,
  step: RoomStep = travel,
): RoomId[] | null {
  if (state.room === destination) return []
  const seen = new Set<RoomId>([state.room])
  const queue: Array<{ state: CaseState; route: RoomId[] }> = [
    { state, route: [] },
  ]
  while (queue.length) {
    const { state: here, route } = queue.shift()!
    for (const exit of HOTEL_ROOMS[here.room].exits) {
      if (seen.has(exit)) continue
      const moved = step(here, exit)
      if (!moved.changed) continue
      seen.add(exit)
      const next = [...route, exit]
      if (exit === destination) return next
      queue.push({ state: moved.state, route: next })
    }
  }
  return null
}

/** Rooms the map can jump to right now, excluding the current one. */
export function shortcutRooms(
  state: CaseState,
  step: RoomStep = travel,
): RoomId[] {
  const seen = new Set<RoomId>([state.room])
  const queue: CaseState[] = [state]
  while (queue.length) {
    const here = queue.shift()!
    for (const exit of HOTEL_ROOMS[here.room].exits) {
      if (seen.has(exit)) continue
      const moved = step(here, exit)
      if (!moved.changed) continue
      seen.add(exit)
      queue.push(moved.state)
    }
  }
  return (Object.keys(HOTEL_ROOMS) as RoomId[]).filter(
    (room) => room !== state.room && seen.has(room),
  )
}

/**
 * Take a map shortcut: walks every door on the planned route, so arrival
 * effects (discovering Room 205, for instance) happen exactly as on foot,
 * then records one transcript line for the whole trip.
 */
export function travelRoute(
  state: CaseState,
  destination: RoomId,
  step: RoomStep = travel,
): CaseResult {
  const direct = HOTEL_ROOMS[state.room].exits.includes(destination)
  if (direct || state.room === destination) return step(state, destination)
  const route = planRoute(state, destination, step)
  if (!route)
    return {
      state,
      line: 'Norb: There is no legitimate way there yet. Find one, Iris.',
      changed: false,
    }
  let current = state
  let arrival = ''
  for (const room of route) {
    const moved = step(current, room)
    if (!moved.changed) return moved
    current = moved.state
    arrival = moved.line
  }
  const via = route
    .slice(0, -1)
    .map((room) => HOTEL_ROOMS[room].label)
    .join(', ')
  const line =
    'Iris cuts through ' + via + '. Norb follows at six feet. ' + arrival
  return {
    state: {
      ...current,
      transcript: [...state.transcript, line],
    },
    line,
    changed: true,
  }
}
