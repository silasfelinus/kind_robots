// /utils/arcade/bumperBubbles/tower.ts
//
// Fizzwick Tower's floors as data (conductor kr-arcade/t-059, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 7). A floor is ASCII on the
// classic's grid: 32 x 27 tiles of 8 px under a 24 px status band, so the cabinet
// stays 256 x 240. The parser turns a floor into tiles, an air-current map, a
// grump script and the robots' starts; the physics below reads only the parse.
//
// Legend:
//   '#' a block (land on its top, hop up through it from beneath)
//   'G' a springy gumdrop block (a robot that lands on it bounces high)
//   '.' open air (bubbles rise through it)
//   '^' 'v' '<' '>' open air with an air current blowing that way
//   'T' the floor's Fizz Tap, standing on the block beneath it
//   '1'..'4' where each robot starts (else the defaults along the floor)
//   a lowercase letter: a grump starts here (GRUMP_LETTERS in grumps.ts)
//
// Columns 0-1 and 30-31 are the tower's walls, row 0 is the ceiling and row 26 the
// floor. A gap in the floor drops a body out of the bottom and back in at the top
// (screen wrap), so a floor-row gap must sit under a ceiling-row gap, and row 1
// stays clear of blocks for a body falling back in.

export const TILE = 8
export const COLS = 32
export const ROWS = 27
/** The top of row 0 (the status band sits above it). */
export const TOP = 24
export const W = 256
export const H = 240
/** Inner faces of the side walls. */
export const WALL_L = 2 * TILE
export const WALL_R = W - 2 * TILE
/** The top of the floor row. */
export const FLOOR_Y = TOP + (ROWS - 1) * TILE

export type Flavour = 'classic' | 'gum' | 'float' | 'fizz' | 'frost'

export type FloorDef = {
  /** The floor's name, shown as it scrolls in. */
  name: string
  rows: readonly string[]
  /** The flavour its Fizz Tap pours (needs a 'T'). */
  tap?: Flavour
  /** Where bubbles pinned under a ceiling drift to (default the middle). */
  gather?: number
}

export const Cell = { Air: 0, Block: 1, Spring: 2 } as const
export type Cell = (typeof Cell)[keyof typeof Cell]

/** Air-current directions, as stored in a parsed floor. */
export const CURRENTS = {
  '^': { x: 0, y: -1 },
  v: { x: 0, y: 1 },
  '<': { x: -1, y: 0 },
  '>': { x: 1, y: 0 },
} as const
export type CurrentChar = keyof typeof CURRENTS
const CURRENT_CODES: readonly CurrentChar[] = ['^', 'v', '<', '>']

export type Spot = { x: number; y: number }
export type Spawn = Spot & { letter: string }

export type Floor = {
  name: string
  cells: Uint8Array
  /** 0 for still air, else 1 + the index in CURRENT_CODES. */
  currents: Uint8Array
  spawns: readonly Spawn[]
  /** Robot starts (feet), player 1 first. */
  starts: readonly Spot[]
  /** The tap's feet, or null. */
  tap: Spot | null
  flavour: Flavour | null
  gather: number
  /** Columns open in the floor row (bodies drop through and wrap). */
  wrapCols: readonly number[]
}

/** Feet position for a marker in column c, row r: the bottom of its tile. */
export function feetOf(c: number, r: number): Spot {
  return { x: c * TILE + TILE / 2, y: TOP + (r + 1) * TILE }
}

const DEFAULT_STARTS = [3, 28, 9, 22]

/** Parse a floor, or throw naming what is wrong (the tests parse every floor). */
export function parseFloor(def: FloorDef): Floor {
  const { rows } = def
  if (rows.length !== ROWS)
    throw new Error(`${def.name}: ${rows.length} rows, want ${ROWS}`)
  const cells = new Uint8Array(COLS * ROWS)
  const currents = new Uint8Array(COLS * ROWS)
  const spawns: Spawn[] = []
  const marked: Spot[] = []
  let tap: Spot | null = null
  rows.forEach((row, r) => {
    if (row.length !== COLS)
      throw new Error(`${def.name}: row ${r} is ${row.length} wide`)
    for (let c = 0; c < COLS; c++) {
      const ch = row[c]!
      const i = r * COLS + c
      if (ch === '#') cells[i] = Cell.Block
      else if (ch === 'G') cells[i] = Cell.Spring
      else if (ch in CURRENTS)
        currents[i] = 1 + CURRENT_CODES.indexOf(ch as CurrentChar)
      else if (ch === 'T') tap = feetOf(c, r)
      else if (ch >= '1' && ch <= '4') marked[Number(ch) - 1] = feetOf(c, r)
      else if (ch >= 'a' && ch <= 'z' && ch !== 'v')
        spawns.push({ ...feetOf(c, r), letter: ch })
      else if (ch !== '.')
        throw new Error(`${def.name}: unknown "${ch}" at ${c},${r}`)
    }
  })
  const starts = DEFAULT_STARTS.map((c, i) => marked[i] ?? feetOf(c, ROWS - 2))
  const wrapCols: number[] = []
  for (let c = 2; c < COLS - 2; c++)
    if (cells[(ROWS - 1) * COLS + c] === Cell.Air) wrapCols.push(c)
  return {
    name: def.name,
    cells,
    currents,
    spawns,
    starts,
    tap,
    flavour: def.tap ?? null,
    gather: def.gather ?? W / 2,
    wrapCols,
  }
}

// --- reading a floor ----------------------------------------------------------------------------

export function cellAt(f: Floor, c: number, r: number): Cell {
  if (c < 2 || c >= COLS - 2) return Cell.Block
  if (r < 0) return Cell.Block
  if (r >= ROWS) return Cell.Air
  return f.cells[r * COLS + c] as Cell
}

export function solid(f: Floor, c: number, r: number): boolean {
  return cellAt(f, c, r) !== Cell.Air
}

/** Is the pixel (px, py) inside a block (the walls and the band above the ceiling count)? */
export function solidAt(f: Floor, px: number, py: number): boolean {
  return solid(f, Math.floor(px / TILE), Math.floor((py - TOP) / TILE))
}

/** A block whose top is open air: something can stand on it. Row 0 is ceiling only. */
export function surface(f: Floor, c: number, r: number): boolean {
  return r >= 1 && r < ROWS && solid(f, c, r) && !solid(f, c, r - 1)
}

/** The current blowing at a pixel, or null in still air. */
export function currentAt(
  f: Floor,
  px: number,
  py: number,
): { x: number; y: number } | null {
  const c = Math.floor(px / TILE)
  const r = Math.floor((py - TOP) / TILE)
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null
  const code = f.currents[r * COLS + c]!
  return code ? CURRENTS[CURRENT_CODES[code - 1]!] : null
}

/** The nearest standing surface at or below (x, y) under a body `half` px wide each way, or the floor line. */
export function groundBelow(f: Floor, x: number, y: number, half = 0): number {
  const c0 = Math.floor((x - half) / TILE)
  const c1 = Math.floor((x + half) / TILE)
  for (let r = Math.max(1, Math.ceil((y - TOP) / TILE)); r < ROWS; r++)
    for (let c = c0; c <= c1; c++) if (surface(f, c, r)) return TOP + r * TILE
  return FLOOR_Y
}

// --- bodies -------------------------------------------------------------------------------------

export const GRAVITY = 0.2
export const MAX_FALL = 4
/** A hop clears five tiles (a platform row above), never two. */
export const JUMP_V = -4.4
export const SPRING_V = -6.6
export const BODY_H = 14

export type Body = {
  x: number
  /** Feet (bottom centre). */
  y: number
  vx: number
  vy: number
  onGround: boolean
}

/** Something a body can stand on besides blocks: a gum ledge, a bubble being ridden. */
export type Ledge = { x: number; top: number; half: number }

export type StepResult = {
  /** Walked into a wall or a block at waist height. */
  bumped: boolean
  /** Landed on a gumdrop this tick. */
  sprang: boolean
  /** Fell out of the bottom and came back in at the top. */
  wrapped: boolean
  /** The ledge landed on, if one. */
  ledge: Ledge | null
}

function waistBlocked(f: Floor, x: number, y: number) {
  return solidAt(f, x, y - 4) || solidAt(f, x, y - 10)
}

/**
 * Move a body one tick: gravity, walls, blocks at waist height while walking, one-way block
 * tops, gumdrop bounces, extra ledges, and the wrap from the bottom back to the top.
 */
export function stepBody(
  f: Floor,
  b: Body,
  half: number,
  options: {
    gravity?: number
    maxFall?: number
    ledges?: readonly Ledge[]
  } = {},
): StepResult {
  const out: StepResult = {
    bumped: false,
    sprang: false,
    wrapped: false,
    ledge: null,
  }
  // Across.
  if (b.vx !== 0) {
    let nx = b.x + b.vx
    if (nx < WALL_L + half) {
      nx = WALL_L + half
      out.bumped = true
    } else if (nx > WALL_R - half) {
      nx = WALL_R - half
      out.bumped = true
    }
    if (b.onGround) {
      const side = Math.sign(b.vx)
      const lead = nx + side * half
      if (
        waistBlocked(f, lead, b.y) &&
        !waistBlocked(f, b.x + side * half, b.y)
      ) {
        nx = b.x
        out.bumped = true
      }
    }
    b.x = nx
  }
  // Down (or up).
  b.vy = Math.min(
    options.maxFall ?? MAX_FALL,
    b.vy + (options.gravity ?? GRAVITY),
  )
  const prevY = b.y
  let ny = b.y + b.vy
  b.onGround = false
  if (b.vy < 0) {
    // The ceiling row stops a head.
    if (ny - BODY_H < TOP + TILE) {
      ny = TOP + TILE + BODY_H
      b.vy = 0
    }
    b.y = ny
    return out
  }
  const r0 = Math.max(1, Math.ceil((prevY - TOP - 0.01) / TILE))
  const r1 = Math.min(ROWS - 1, Math.floor((ny - TOP) / TILE))
  const c0 = Math.floor((b.x - half + 1) / TILE)
  const c1 = Math.floor((b.x + half - 1) / TILE)
  let land: number | null = null
  let spring = false
  for (let r = r0; r <= r1 && land === null; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!surface(f, c, r)) continue
      land = TOP + r * TILE
      if (cellAt(f, c, r) === Cell.Spring) spring = true
    }
  }
  for (const l of options.ledges ?? []) {
    if (
      prevY <= l.top + 0.5 &&
      ny >= l.top &&
      Math.abs(l.x - b.x) < l.half + half - 1 &&
      (land === null || l.top < land)
    ) {
      land = l.top
      spring = false
      out.ledge = l
    }
  }
  if (land !== null) {
    b.y = land
    b.vy = 0
    b.onGround = true
    if (spring) {
      b.vy = SPRING_V
      b.onGround = false
      out.sprang = true
    }
    return out
  }
  if (ny > H + 6) {
    // Out through a floor gap, back in through the ceiling.
    ny = TOP + 4
    out.wrapped = true
  }
  b.y = ny
  return out
}

/** Does a box of half-size `r` at (x, y) overlap a block? */
export function boxSolid(f: Floor, x: number, y: number, r: number): boolean {
  return (
    solidAt(f, x - r, y - r) ||
    solidAt(f, x + r, y - r) ||
    solidAt(f, x - r, y + r) ||
    solidAt(f, x + r, y + r) ||
    solidAt(f, x, y - r) ||
    solidAt(f, x, y + r) ||
    solidAt(f, x - r, y) ||
    solidAt(f, x + r, y)
  )
}

/**
 * Slide a round thing (a bubble, a flyer) by (dx, dy), an axis at a time, stopping at blocks.
 * Something already inside a block moves freely until it is out. Says which axes were blocked.
 */
export function slide(
  f: Floor,
  p: { x: number; y: number },
  dx: number,
  dy: number,
  r: number,
): { x: boolean; y: boolean } {
  const blocked = { x: false, y: false }
  const free = boxSolid(f, p.x, p.y, r)
  if (dx !== 0) {
    if (free || !boxSolid(f, p.x + dx, p.y, r)) p.x += dx
    else blocked.x = true
  }
  if (dy !== 0) {
    if (free || !boxSolid(f, p.x, p.y + dy, r)) p.y += dy
    else blocked.y = true
  }
  p.x = Math.max(WALL_L + r, Math.min(WALL_R - r, p.x))
  if (p.y < TOP + TILE + r) {
    p.y = TOP + TILE + r
    if (dy < 0) blocked.y = true
  }
  if (p.y > H - r) p.y = H - r
  return blocked
}

// --- reachability (the tests walk every floor) ---------------------------------------------------

export type Segment = { r: number; c0: number; c1: number; spring: boolean }

/** Every run of standing surface on a floor, row by row. */
export function segments(f: Floor): Segment[] {
  const out: Segment[] = []
  for (let r = 1; r < ROWS; r++) {
    let c = 2
    while (c < COLS - 2) {
      if (!surface(f, c, r)) {
        c++
        continue
      }
      const c0 = c
      let spring = false
      while (c < COLS - 2 && surface(f, c, r)) {
        if (cellAt(f, c, r) === Cell.Spring) spring = true
        c++
      }
      out.push({ r, c0, c1: c - 1, spring })
    }
  }
  return out
}

function gapBetween(a: Segment, b: Segment) {
  return Math.max(0, b.c0 - a.c1 - 1, a.c0 - b.c1 - 1)
}

/** A way from one run of surface to another: where to set off from, and where to steer. */
export type Hop = {
  to: number
  kind: 'up' | 'down' | 'spring' | 'wrap'
  /** Stand here (px) and hop, or walk past here to drop. */
  launch: number
  /** Steer toward this x (px) while in the air. */
  aim: number
}

/** Every surface run on a floor and the ways between them (the pilot's map, and the tests'). */
export type Nav = { segs: Segment[]; hops: Hop[][] }

const navs = new WeakMap<Floor, Nav>()

const px = (c: number) => c * TILE + TILE / 2

export function navOf(f: Floor): Nav {
  const known = navs.get(f)
  if (known) return known
  const segs = segments(f)
  const at = (c: number, r: number) =>
    segs.findIndex((s) => s.r === r && c >= s.c0 && c <= s.c1)
  /** The first surface at or below row r in column c. */
  const landing = (c: number, r: number) => {
    for (let rr = Math.max(1, r); rr < ROWS; rr++) {
      const i = at(c, rr)
      if (i >= 0) return i
    }
    return -1
  }
  const hops = segs.map((a, ai) => {
    const out: Hop[] = []
    const add = (hop: Hop) => {
      if (hop.to >= 0 && hop.to !== ai && !out.some((h) => h.to === hop.to))
        out.push(hop)
    }
    segs.forEach((b, bi) => {
      const rise = a.r - b.r
      const gap = gapBetween(a, b)
      if (rise >= 1 && rise <= 5 && gap <= 4) {
        const lo = Math.max(a.c0, b.c0)
        const hi = Math.min(a.c1, b.c1)
        // Under the overlap, or from the end nearest the ledge, steering onto it.
        const launch =
          lo <= hi
            ? px(Math.floor((lo + hi) / 2))
            : b.c0 > a.c1
              ? px(a.c1)
              : px(a.c0)
        const aim =
          lo <= hi
            ? launch
            : b.c0 > a.c1
              ? px(Math.min(b.c1, b.c0 + 1))
              : px(Math.max(b.c0, b.c1 - 1))
        // Far enough from the ends that a wall beside the run doesn't stop the walk there.
        const inside = Math.max(
          a.c0 * TILE + 6,
          Math.min((a.c1 + 1) * TILE - 6, launch),
        )
        add({ to: bi, kind: 'up', launch: inside, aim })
      }
    })
    if (a.spring) {
      const spring = (() => {
        for (let c = a.c0; c <= a.c1; c++)
          if (cellAt(f, c, a.r) === Cell.Spring) return c
        return a.c0
      })()
      segs.forEach((b, bi) => {
        const rise = a.r - b.r
        if (rise >= 1 && rise <= 13 && gapBetween(a, b) <= 6)
          add({
            to: bi,
            kind: 'spring',
            launch: px(spring),
            aim: px(Math.max(b.c0, Math.min(b.c1, spring))),
          })
      })
    }
    // Walking off either end, and drifting a little as it falls.
    for (const [c, edge] of [
      [a.c0 - 1, a.c0],
      [a.c1 + 1, a.c1],
      [a.c0 - 3, a.c0],
      [a.c1 + 3, a.c1],
    ] as const) {
      if (c < 2 || c >= COLS - 2) continue
      const side = Math.sign(c - edge)
      add({
        to: landing(c, a.r + 1),
        kind: 'down',
        launch: px(edge) + side * (TILE + 2),
        aim: px(c),
      })
    }
    // Into a wrap gap beside this run of floor, and back in at the top.
    if (a.r === ROWS - 1)
      for (const gc of f.wrapCols) {
        if (gc !== a.c0 - 1 && gc !== a.c1 + 1) continue
        // The middle of this gap, where a body is clear of both edges.
        const side = gc === a.c1 + 1 ? 1 : -1
        let far = gc
        while (f.wrapCols.includes(far + side)) far += side
        const launch = (px(gc) + px(far)) / 2
        for (const c of f.wrapCols)
          add({ to: landing(c, 2), kind: 'wrap', launch, aim: px(c) })
      }
    return out
  })
  const nav = { segs, hops }
  navs.set(f, nav)
  return nav
}

/**
 * The run of surface a body stands on (its feet may hang over the end by `half` px), or -1 in
 * the air or on a ledge.
 */
export function segmentUnder(f: Floor, x: number, y: number, half = 4): number {
  const r = Math.round((y - TOP) / TILE)
  if (Math.abs(TOP + r * TILE - y) > 0.5) return -1
  const { segs } = navOf(f)
  const c = Math.floor(x / TILE)
  const exact = segs.findIndex((s) => s.r === r && c >= s.c0 && c <= s.c1)
  if (exact >= 0) return exact
  const c0 = Math.floor((x - half) / TILE)
  const c1 = Math.floor((x + half) / TILE)
  return segs.findIndex((s) => s.r === r && c1 >= s.c0 && c0 <= s.c1)
}

/** The first hop on the shortest way from one surface run to another, or null. */
export function route(f: Floor, from: number, to: number): Hop | null {
  if (from < 0 || to < 0 || from === to) return null
  const { hops } = navOf(f)
  const first = new Map<number, Hop>()
  const queue = [from]
  const seen = new Set([from])
  while (queue.length) {
    const a = queue.shift()!
    for (const h of hops[a]!) {
      if (seen.has(h.to)) continue
      seen.add(h.to)
      first.set(h.to, a === from ? h : first.get(a)!)
      if (h.to === to) return first.get(h.to)!
      queue.push(h.to)
    }
  }
  return null
}

/**
 * The surfaces a robot can reach from its starts by hopping (five rows up, four tiles across),
 * walking off edges, bouncing on gumdrops and dropping through the floor's wrap gaps.
 */
export function reachableSegments(f: Floor): Set<string> {
  const { segs, hops } = navOf(f)
  const seen = new Set<number>()
  const queue: number[] = []
  for (const s of f.starts) {
    const i = segmentUnder(f, s.x, s.y)
    if (i >= 0 && !seen.has(i)) {
      seen.add(i)
      queue.push(i)
    }
  }
  while (queue.length) {
    for (const h of hops[queue.shift()!]!) {
      if (seen.has(h.to)) continue
      seen.add(h.to)
      queue.push(h.to)
    }
  }
  return new Set([...seen].map((i) => segmentKey(segs[i]!)))
}

/** A segment's name in reachableSegments' answer. */
export function segmentKey(s: Segment): string {
  return `${s.r}:${s.c0}-${s.c1}`
}
