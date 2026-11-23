// /utils/arcade/hedgehogCrossing/lanes.ts
//
// Hedgehog Crossing depth pass, slice 1 (conductor kr-arcade/t-102): lanes and boards as data.
// Every lane kind is a row in LANE_KINDS (which half of the board it lives on, whether it is
// ridden or dodged, how it introduces itself); PARK_LANE is today's board; REMIXES is the
// per-level table that swaps lanes in as the levels climb, with parity remixes that keep turning
// the board past the old level-11 plateau. The game gives each kind its own spawn, step, touch and
// draw (LANE_BEHAVIOURS in games/hedgehogCrossing.ts); the rules that are plain arithmetic -- the
// snapping log's yawn and the delivery bot's blinker -- live here so a test can drive them.

import type { RampName } from '../snes'
import { OLD_PLATEAU, TILE, W } from './rules'

/** Lanes wrap round this far past the board's edges. */
export const SPAN = W + 140

export type LaneKind =
  | 'car'
  | 'tractor'
  | 'racer'
  | 'bus'
  | 'log'
  | 'turtles'
  | 'snapper'
  | 'bot'
  | 'shopper'
  | 'barrel'
  | 'crate'

/** What a body standing in a lane meets: traffic hits, platforms are ridden, jaws bite. */
export type Touch = 'hit' | 'ride' | 'bite'

export type LaneKindInfo = {
  half: 'road' | 'creek'
  /** What its things do to a body on them, before any special rule (a yawn, a dive). */
  touch: 'hit' | 'ride'
  name: string
  /** What a bonk by it says. */
  bonk: string
  /** The banner on the level it first appears. */
  intro?: { text: string; sub: string }
}

export const LANE_KINDS: Record<LaneKind, LaneKindInfo> = {
  car: {
    half: 'road',
    touch: 'hit',
    name: 'ROBOT CAR',
    bonk: 'BEEP BEEP! TRY AGAIN',
  },
  tractor: {
    half: 'road',
    touch: 'hit',
    name: 'TRACTOR',
    bonk: 'BEEP BEEP! TRY AGAIN',
  },
  racer: {
    half: 'road',
    touch: 'hit',
    name: 'RACER',
    bonk: 'ZOOM! TRY AGAIN',
  },
  bus: {
    half: 'road',
    touch: 'hit',
    name: 'ROBOT BUS',
    bonk: 'BEEP BEEP! TRY AGAIN',
  },
  log: { half: 'creek', touch: 'ride', name: 'LOG', bonk: 'SPLASH!' },
  turtles: {
    half: 'creek',
    touch: 'ride',
    name: 'TURTLES',
    bonk: 'SPLASH!',
  },
  snapper: {
    half: 'creek',
    touch: 'ride',
    name: 'SNAPPING LOG',
    bonk: 'SNAP! RIDE THE TAIL',
    intro: {
      text: 'SNAPPING LOG',
      sub: 'EYES OPEN, THEN A YAWN: RIDE THE TAIL',
    },
  },
  bot: {
    half: 'road',
    touch: 'hit',
    name: 'DELIVERY BOT',
    bonk: 'PARCEL BUMP! TRY AGAIN',
    intro: { text: 'DELIVERY BOT', sub: 'IT BLINKS BEFORE IT CHANGES LANE' },
  },
  shopper: {
    half: 'road',
    touch: 'hit',
    name: 'ROBOT SHOPPER',
    bonk: 'MARKET CROWD! TRY AGAIN',
    intro: { text: 'MARKET CROWD', sub: 'FOLLOW THE GAPS BETWEEN SHOPPERS' },
  },
  barrel: {
    half: 'road',
    touch: 'hit',
    name: 'ROLLING BARREL',
    bonk: 'BARREL BONK! TRY AGAIN',
    intro: {
      text: 'ROLLING BARRELS',
      sub: 'THEY TUMBLE QUICKLY DOWN THE RAMP',
    },
  },
  crate: {
    half: 'creek',
    touch: 'ride',
    name: 'CANAL CRATE',
    bonk: 'SPLASH! WAIT FOR THE CRATE',
    intro: { text: 'CANAL CRATES', sub: 'HOP ABOARD THE FLOATING BOXES' },
  },
}

export type LaneSpec = {
  row: number
  kind: LaneKind
  /** Tiles long. */
  len: number
  count: number
  speed: number
  dir: 1 | -1
  /** The palette ramp its things are painted in (see utils/arcade/snes.ts RAMPS). */
  ramp: RampName
  /** A second row this lane's things can move into (the delivery bot's weave). */
  pair?: number
}

/** Park Lane: today's board, from the bottom of the road to the top of the creek. */
export const PARK_LANE: readonly LaneSpec[] = [
  { row: 11, kind: 'car', len: 1, count: 3, speed: 0.6, dir: -1, ramp: 'pink' },
  {
    row: 10,
    kind: 'tractor',
    len: 1,
    count: 3,
    speed: 0.45,
    dir: 1,
    ramp: 'gold',
  },
  { row: 9, kind: 'car', len: 1, count: 3, speed: 0.85, dir: -1, ramp: 'sky' },
  { row: 8, kind: 'racer', len: 1, count: 1, speed: 2, dir: 1, ramp: 'ember' },
  { row: 7, kind: 'bus', len: 2, count: 2, speed: 0.7, dir: -1, ramp: 'teal' },
  {
    row: 5,
    kind: 'turtles',
    len: 3,
    count: 4,
    speed: 0.6,
    dir: -1,
    ramp: 'leaf',
  },
  { row: 4, kind: 'log', len: 3, count: 3, speed: 0.5, dir: 1, ramp: 'earth' },
  { row: 3, kind: 'log', len: 5, count: 2, speed: 1.15, dir: 1, ramp: 'earth' },
  {
    row: 2,
    kind: 'turtles',
    len: 2,
    count: 4,
    speed: 0.7,
    dir: -1,
    ramp: 'leaf',
  },
  { row: 1, kind: 'log', len: 4, count: 3, speed: 0.8, dir: 1, ramp: 'earth' },
]

/** Leg 1 follows two five-crossing routes before the country roads open. */
export const LEG_ONE_REGIONS = [
  { name: 'PARK LANE', first: 1, last: 5 },
  { name: 'MARKET DAY', first: 6, last: 10 },
] as const

export function legOneCrossing(level: number) {
  const region = LEG_ONE_REGIONS.find(
    (entry) => level >= entry.first && level <= entry.last,
  )
  if (!region) return null
  const crossing = level - region.first + 1
  return {
    region: region.name,
    crossing,
    special: crossing === 3,
    big: crossing === 5,
  }
}

/** Market Day swaps traffic for shoppers and barrels, and the creek for a crate canal. */
export const MARKET_DAY: readonly LaneSpec[] = [
  {
    row: 11,
    kind: 'shopper',
    len: 1,
    count: 4,
    speed: 0.55,
    dir: -1,
    ramp: 'teal',
  },
  {
    row: 10,
    kind: 'bot',
    len: 1,
    count: 2,
    speed: 0.82,
    dir: 1,
    ramp: 'gold',
    pair: 9,
  },
  {
    row: 9,
    kind: 'barrel',
    len: 1,
    count: 3,
    speed: 1.15,
    dir: -1,
    ramp: 'ember',
  },
  {
    row: 8,
    kind: 'shopper',
    len: 1,
    count: 3,
    speed: 0.7,
    dir: 1,
    ramp: 'sky',
  },
  {
    row: 7,
    kind: 'bus',
    len: 2,
    count: 2,
    speed: 0.7,
    dir: -1,
    ramp: 'pink',
  },
  {
    row: 5,
    kind: 'crate',
    len: 3,
    count: 3,
    speed: 0.6,
    dir: -1,
    ramp: 'earth',
  },
  {
    row: 4,
    kind: 'crate',
    len: 2,
    count: 4,
    speed: 0.7,
    dir: 1,
    ramp: 'rust',
  },
  { row: 3, kind: 'log', len: 5, count: 2, speed: 1.05, dir: 1, ramp: 'earth' },
  {
    row: 2,
    kind: 'turtles',
    len: 2,
    count: 4,
    speed: 0.7,
    dir: -1,
    ramp: 'leaf',
  },
  {
    row: 1,
    kind: 'crate',
    len: 4,
    count: 3,
    speed: 0.8,
    dir: 1,
    ramp: 'rust',
  },
]

export type Remix = {
  /** The first level it applies to. */
  from: number
  /** Only on levels of this parity (level % 2), for the remixes past the old plateau. */
  parity?: 0 | 1
  row: number
  lane: Partial<LaneSpec> & { kind: LaneKind }
}

/** How the board changes as the levels climb. Later rows in the table win. */
export const REMIXES: readonly Remix[] = [
  // Level 3: the long fast logs grow eyes.
  { from: 3, row: 3, lane: { kind: 'snapper', len: 4, count: 2, speed: 0.95 } },
  // Level 4: the tractors give way to delivery bots weaving into the car lane above.
  {
    from: 4,
    row: 10,
    lane: {
      kind: 'bot',
      len: 1,
      count: 2,
      speed: 0.98,
      dir: -1,
      ramp: 'teal',
      pair: 9,
    },
  },
  // Level 8: the last logs before the hedge snap too.
  { from: 8, row: 1, lane: { kind: 'snapper', len: 4, count: 3, speed: 0.75 } },
  // Past the old plateau the board turns every level: even levels float short logs where the
  // first turtles were and send a second bus down the fast lane...
  {
    from: OLD_PLATEAU + 1,
    parity: 0,
    row: 5,
    lane: { kind: 'log', len: 2, count: 4, speed: 0.75, ramp: 'earth' },
  },
  {
    from: OLD_PLATEAU + 1,
    parity: 0,
    row: 8,
    lane: { kind: 'bus', len: 2, count: 2, speed: 1.1, ramp: 'ember' },
  },
  // ...odd levels put snapping logs among the turtles and race the bottom lane.
  {
    from: OLD_PLATEAU + 1,
    parity: 1,
    row: 2,
    lane: { kind: 'snapper', len: 3, count: 3, speed: 0.7, ramp: 'leaf' },
  },
  {
    from: OLD_PLATEAU + 1,
    parity: 1,
    row: 11,
    lane: { kind: 'racer', len: 1, count: 2, speed: 1.6 },
  },
]

/** The lanes of a level's board: Park Lane with every remix that applies by then. */
export function boardLanes(level: number): LaneSpec[] {
  const lvl = Math.max(1, Math.floor(level))
  const layout = lvl >= 6 && lvl <= 10 ? MARKET_DAY : PARK_LANE
  return layout.map((base) => {
    let spec: LaneSpec = { ...base }
    for (const remix of REMIXES) {
      if (remix.row !== base.row || lvl < remix.from) continue
      if (remix.parity !== undefined && lvl % 2 !== remix.parity) continue
      spec = { ...spec, ...remix.lane }
    }
    return spec
  })
}

/** Lane kinds on this level's board that no earlier level had. */
export function newArrivals(level: number): LaneKind[] {
  const seen = new Set<LaneKind>()
  for (let l = 1; l < Math.floor(level); l++) {
    for (const spec of boardLanes(l)) seen.add(spec.kind)
  }
  const fresh: LaneKind[] = []
  for (const spec of boardLanes(level)) {
    if (!seen.has(spec.kind) && !fresh.includes(spec.kind))
      fresh.push(spec.kind)
  }
  return fresh
}

// --- the snapping log ---------------------------------------------------------------------

/** A snapping log's day: it dozes, its eyes open (the tell), then it yawns. */
export const SNAP_PERIOD = 330
export const SNAP_EYES = 60
export const SNAP_YAWN = 70

export type SnapPhase = 'doze' | 'eyes' | 'yawn'

/** Where a snapping log is in its cycle at `tick` (`offset` < 0 never wakes). */
export function snapPhase(offset: number, tick: number): SnapPhase {
  if (offset < 0) return 'doze'
  const p = (tick + offset) % SNAP_PERIOD
  if (p < SNAP_PERIOD - SNAP_EYES - SNAP_YAWN) return 'doze'
  return p < SNAP_PERIOD - SNAP_YAWN ? 'eyes' : 'yawn'
}

/**
 * A body at x on a snapping log spanning [x0, x0 + len tiles), swimming in `dir`. The leading
 * (head) half bites while it yawns; the tail half is always a safe ride. `pad` shrinks the
 * ridable part and widens the jaws, for a cautious pilot.
 */
export function snapperTouch(
  x0: number,
  len: number,
  dir: 1 | -1,
  x: number,
  phase: SnapPhase,
  pad = 0,
): Touch | null {
  const w = len * TILE
  if (!(x > x0 + 2 + pad && x < x0 + w - 2 - pad)) return null
  const mid = x0 + w / 2
  const onHead = dir > 0 ? x > mid - pad : x < mid + pad
  return onHead && phase === 'yawn' ? 'bite' : 'ride'
}

// --- the delivery bot ------------------------------------------------------------------------

/** Ticks the blinker flashes before every lane change. */
export const BOT_BLINK = 60
/** Ticks a merge takes, straddling both rows. */
export const BOT_MERGE = 24
/** Ticks a bot cruises in its own lane before it fancies the faster one, plus up to this many. */
export const BOT_WAIT = 90
export const BOT_WAIT_SPREAD = 150

export type Bot = {
  /** The row it is in (the row it left, while it merges). */
  at: number
  /** The row it is heading for (its own row when it is not changing lanes). */
  to: number
  blink: number
  merge: number
  wait: number
}

export function newBot(row: number, wait: number): Bot {
  return { at: row, to: row, blink: 0, merge: 0, wait }
}

/** The rows a bot covers: one while it cruises or blinks, both while it merges. */
export function botRows(b: Bot): number[] {
  return b.merge > 0 && b.to !== b.at ? [b.at, b.to] : [b.at]
}

type Span = { x: number; len: number }

/** Room between a body's front and the nearest thing ahead of it in `dir`, round the wrap. */
export function gapAhead(
  body: Span,
  dir: 1 | -1,
  others: readonly Span[],
): number {
  const c = body.x + (body.len * TILE) / 2
  let best = Infinity
  for (const o of others) {
    if (o === body) continue
    const oc = o.x + (o.len * TILE) / 2
    const d = ((((oc - c) * dir) % SPAN) + SPAN) % SPAN
    best = Math.min(best, d - ((body.len + o.len) * TILE) / 2)
  }
  return best
}

/**
 * One tick of a delivery bot's road sense. It cruises in its own row, fancies the next row
 * (blinker on for BOT_BLINK ticks), merges across both rows for BOT_MERGE ticks only if there is
 * room, and blinks back to its own row before it catches the slower traffic ahead. It never
 * changes lane without the blinker first; with no room it keeps blinking.
 */
export function stepBot(
  b: Bot,
  body: Span,
  vx: number,
  pairVx: number,
  home: number,
  pair: number,
  occupants: (row: number) => readonly Span[],
  rng: () => number,
): void {
  const dir: 1 | -1 = vx >= 0 ? 1 : -1
  const closing = Math.max(0, Math.abs(vx) - Math.abs(pairVx))
  const need = closing * (BOT_BLINK + BOT_MERGE) + 10
  if (b.merge > 0) {
    if (--b.merge === 0) b.at = b.to
    return
  }
  if (b.blink > 0) {
    if (--b.blink > 0) return
    const others = occupants(b.to)
    const room =
      gapAhead(body, dir, others) > (b.to === pair ? need + 16 : 6) &&
      gapAhead(body, dir > 0 ? -1 : 1, others) > 6
    if (room) b.merge = BOT_MERGE
    else b.blink = 1
    return
  }
  if (b.at === pair) {
    if (gapAhead(body, dir, occupants(pair)) < need + 4) {
      b.to = home
      b.blink = BOT_BLINK
    }
    return
  }
  if (--b.wait <= 0) {
    b.wait = BOT_WAIT + Math.floor(rng() * BOT_WAIT_SPREAD)
    b.to = pair
    b.blink = BOT_BLINK
  }
}
