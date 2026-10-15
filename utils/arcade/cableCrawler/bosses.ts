// /utils/arcade/cableCrawler/bosses.ts
//
// Cable Crawler's bosses (conductor kr-arcade/t-064 on, spec: CABINETS.md section 8, "The
// bosses"). A boss takes surges, not bites: lay the cable where it will touch the boss, then
// plug in.
//
// 1. The Surge Protector (the Power Strip): a great fuse beetle walking the fuse box's ring
//    corridor. Your cable's body stops it; your plug meeting it head-on unplugs you.
//    - Phase 1: lay your cable across its path, then surge through it. Three surges.
//    - Phase 2: it pulls the sockets round the board (they flicker first). Two surges.
//    - Phase 3: it charges down the ring at whatever plug it sees ahead (it glows first).
//      Pause in a side corridor and let it pass; a charge that slams into your cable stuns it.
// 2. The Memory Leak (RAM Rows): a blob in the Heap's chamber that drips leak drips down the
//    rows. Each surge through it shrinks it, and its blob bonks a plug that crawls into it. In its
//    last phase it splits into three drips crawling the rows, turning back off your cable; they
//    must all be swept in one surge (any swept alone runs back and re-forms).
// 3. The Big Whirr (the Cooling Fan): the room is a giant fan whose four blades are walls,
//    turning round the hub. A blade that would cut through your cable jams until it is clear.
//    - Phase 1: slip between the blades to the hub's sockets and surge. Two surges.
//    - Phase 2: the fan reverses, quicker. Two surges.
//    - Phase 3: it spins up and the wind hurries your cable; wrap the cable round two sides of
//      the hub before you surge. Two surges.
// 4. The Subwoofer (the Sound Card): a speaker in the middle of the room that pulses the board
//    on the beat. Each pulse flips every beat gate and sets every cone off; it shrugs off a surge
//    that lands mid-pulse, so surge it in the gap between beats. It takes surges on its 3 x 3
//    cabinet from the cable laid beside it.
//    - Phase 1: a pulse every three seconds, flipping the gates and firing the cones. Two surges.
//    - Phase 2: each pulse also sends a shockwave that shoves a plug within three cells away.
//      Two surges.
//    - Phase 3: the tempo doubles. Two surges.
// 5. The Glitch (the Graphics Card): a rival cable of corrupted pixels, four cells long, walking
//    the room's ring corridor. Touching its head unplugs you; its body is a wall.
//    - Phase 1: a race for the ring, a surge through its body hits it. Two surges.
//    - Phase 2: it sees the plug and cuts you off: a glowing tell, then a fast charge. Trap it
//      against your own length and it is stunned. Two surges.
//    - Phase 3: it splits in two, one worm each way round the ring, and a surge must catch both.
//      Two surges.

import type { BossKind } from './components'
import { COLS, ROWS, cellKey, cellX, cellY } from './mazes'

type Split = { k: number; home: number; dx: number; down: number }

export type Boss = {
  kind: BossKind
  hp: number
  maxHp: number
  /** Ticks it shrugs off surges after a hit. */
  invuln: number
  /** Ticks it is dazed (a hit, or a charge into the cable). */
  stun: number
  timer: number
  // The Surge Protector: the ring it walks, and where on it the boss is.
  ring: readonly number[]
  at: number
  dir: 1 | -1
  /** Ticks it has been pushing against the cable. */
  blocked: number
  /** Ticks of glowing before a charge, and whether it is charging. */
  tell: number
  charging: number
  /** Ticks to the next socket shuffle (phase 2 on). */
  shuffle: number
  // The Memory Leak and the Big Whirr: the middle of the room.
  center: number
  /** The Memory Leak's last phase: the three drips it splits into. */
  splits: Split[]
  /** The Big Whirr: its blades' angle in eighths of a turn, and the walls without blades. */
  angle: number
  base: readonly boolean[]
  /** Ticks a blade has been jammed against the cable. */
  jam: number
  /** The Glitch's second worm (phase 3): its place on the ring (-1 until it splits) and way. */
  twin: number
  twinDir: 1 | -1
}

export const SURGE_PROTECTOR_HP = 7
export const MEMORY_LEAK_HP = 4
export const BIG_WHIRR_HP = 6
export const SUBWOOFER_HP = 6
export const THE_GLITCH_HP = 6
/** How many ring cells long each of The Glitch's worms is. */
export const WORM_LENGTH = 4
/** Hits left at which each later phase begins. */
const PHASE_AT: Record<BossKind, readonly [number, number]> = {
  'surge-protector': [4, 2],
  'memory-leak': [3, 1],
  'big-whirr': [4, 2],
  subwoofer: [4, 2],
  'the-glitch': [4, 2],
}
const WALK = [12, 10, 9] as const
/** The Glitch's ticks per cell by phase. */
const GLITCH_WALK = [11, 10, 9] as const
const CHARGE_STEP = 3
const CHARGE_SIGHT = 8
const CHARGE_TELL = 36
const CHARGE_RUN = 14
const BLOCKED_TURN = 150
/** Ticks between socket shuffles, and how long the sockets flicker before one. */
export const SHUFFLE_EVERY = 300
export const SHUFFLE_TELL = 60
const HIT_INVULN = 90
const HIT_STUN = 60
const BONK_STUN = 80
/** The Memory Leak: ticks between drips by phase, and how its split drips crawl. */
const DRIP_EVERY = [340, 260, 0] as const
const SPLIT_STEP = 14
const SPLIT_REFORM = 120
/** The Big Whirr: ticks per eighth of a turn by phase, and which way it turns. */
const WHIRR_TURN = [100, 80, 50] as const
const WHIRR_DIR = [1, -1, 1] as const
const JAM_RETRY = 20
/** The Subwoofer: ticks between beats by phase, how long it glows before one, how long one lasts. */
export const BEAT_EVERY = [180, 180, 90] as const
export const BEAT_TELL = 30
export const BEAT_PULSE = 24
/** How far its phase 2 shockwave reaches, in cells. */
export const SHOCK_REACH = 3
/** Ticks before a turn that the blades glow. */
export const WHIRR_TELL = 24

export const BOSS_HIT_POINTS = 2000
export const BOSS_DEFEAT_POINTS = 10_000

const BOSS_HP: Record<BossKind, number> = {
  'surge-protector': SURGE_PROTECTOR_HP,
  'memory-leak': MEMORY_LEAK_HP,
  'big-whirr': BIG_WHIRR_HP,
  subwoofer: SUBWOOFER_HP,
  'the-glitch': THE_GLITCH_HP,
}

export function newBoss(
  kind: BossKind,
  ring: readonly number[],
  start: number,
  walls: readonly boolean[] = [],
): Boss {
  return {
    kind,
    hp: BOSS_HP[kind],
    maxHp: BOSS_HP[kind],
    invuln: 0,
    stun: 0,
    timer: 90,
    ring,
    at: Math.max(0, ring.indexOf(start)),
    dir: 1,
    blocked: 0,
    tell: 0,
    charging: 0,
    shuffle: SHUFFLE_EVERY,
    center: start,
    splits: [],
    angle: 0,
    base: walls,
    jam: 0,
    twin: -1,
    twinDir: -1,
  }
}

/** The boss's phase, 1 to 3. */
export function bossPhase(b: Boss): number {
  const [two, three] = PHASE_AT[b.kind]
  return b.hp > two ? 1 : b.hp > three ? 2 : 3
}

/** Where the boss is drawn from: the beetle's cell, or the middle of the room. */
export function bossCell(b: Boss): number {
  return b.kind === 'surge-protector' || b.kind === 'the-glitch'
    ? b.ring[b.at]!
    : b.center
}

/** The Memory Leak's blob: every cell within its radius of the middle. */
export function blobRadius(b: Boss): number {
  return b.hp >= 3 ? 2 : b.hp === 2 ? 1 : 0
}

function near(center: number, r: number, round: boolean): number[] {
  const out: number[] = []
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (!round || Math.abs(dx) + Math.abs(dy) <= r)
        out.push(cellKey(cellX(center) + dx, cellY(center) + dy))
  return out
}

/** The ring cells of a worm whose head is at ring index `at` and which moves the way `dir`. */
export function wormCells(
  ring: readonly number[],
  at: number,
  dir: 1 | -1,
): number[] {
  const n = ring.length
  const out: number[] = []
  for (let i = 0; i < WORM_LENGTH; i++)
    out.push(ring[(((at - dir * i) % n) + n) % n]!)
  return out
}

/** Whether a boss walks the ring corridor (as a beetle, or as worms). */
export function ringBoss(b: Boss): boolean {
  return b.kind === 'surge-protector' || b.kind === 'the-glitch'
}

/** The cells the boss fills: the plug can't crawl into them, and meeting one is a bonk. */
export function bossCells(b: Boss): number[] {
  if (b.hp <= 0) return []
  if (b.kind === 'surge-protector') return [b.ring[b.at]!]
  if (b.kind === 'the-glitch')
    return [
      ...wormCells(b.ring, b.at, b.dir),
      ...(b.twin >= 0 ? wormCells(b.ring, b.twin, b.twinDir) : []),
    ]
  if (b.kind === 'big-whirr' || b.kind === 'subwoofer')
    return near(b.center, 1, false)
  if (b.hp > 1) return near(b.center, blobRadius(b), true)
  return b.splits.filter((s) => s.down === 0).map((s) => s.k)
}

const EIGHTHS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
] as const

/** The Big Whirr's blade cells at an angle: four blades, a quarter turn apart. */
export function bladeCells(center: number, angle: number): number[] {
  const out: number[] = []
  for (let blade = 0; blade < 4; blade++) {
    const [dx, dy] = EIGHTHS[(((angle + blade * 2) % 8) + 8) % 8]!
    const length = dx && dy ? 6 : 7
    for (let i = 3; i <= length; i++) {
      const x = cellX(center) + dx * i
      const y = cellY(center) + dy * i
      if (x >= 1 && y >= 1 && x < COLS - 1 && y < ROWS - 1)
        out.push(cellKey(x, y))
    }
  }
  return out
}

/** The walls of the Big Whirr's room with its blades at an angle. */
export function whirrWalls(b: Boss, angle = b.angle): boolean[] {
  const walls = [...b.base]
  for (const k of bladeCells(b.center, angle)) walls[k] = true
  return walls
}

/** What the boss's world tells it, and what it can do to the world. */
export type BossWorld = {
  /** What lies on a cell: the plug, the cable's body, or nothing. */
  cable(k: number): 'head' | 'body' | null
  /** The plug met the boss head-on. */
  bite(): void
  /** Move the sockets onto other slots. */
  shuffleSockets(): void
  /** Whether a cell is wall. */
  wall(k: number): boolean
  /** Whether something that a blade can't cut through sits on a cell. */
  busy(k: number): boolean
  /** Put up new walls (the Big Whirr's blades turned). */
  setWalls(walls: boolean[]): void
  /** Let a leak drip loose on a cell. */
  drip(k: number): void
  /** The Subwoofer's beat: flip the gates, fire the cones, and in phase 2 on send a shockwave. */
  beat?(shockwave: boolean): void
  rng(): number
}

/** One tick of the boss. */
export function updateBoss(b: Boss, world: BossWorld) {
  if (b.hp <= 0) return
  if (b.invuln > 0) b.invuln--
  if (b.kind === 'memory-leak') return updateLeak(b, world)
  if (b.kind === 'big-whirr') return updateWhirr(b, world)
  if (b.kind === 'subwoofer') return updateSubwoofer(b, world)
  if (b.kind === 'the-glitch') return updateGlitch(b, world)
  const phase = bossPhase(b)
  if (phase >= 2 && --b.shuffle <= 0) {
    b.shuffle = SHUFFLE_EVERY
    world.shuffleSockets()
  }
  if (b.stun > 0) {
    b.stun--
    return
  }
  const n = b.ring.length
  const ahead = (i: number) => b.ring[(((b.at + b.dir * i) % n) + n) % n]!
  if (phase === 3 && !b.charging) {
    if (b.tell > 0) {
      if (--b.tell === 0) b.charging = CHARGE_RUN
      return
    }
    for (let i = 1; i <= CHARGE_SIGHT; i++) {
      const sees = world.cable(ahead(i))
      if (sees === 'head') b.tell = CHARGE_TELL
      if (sees) break
    }
    if (b.tell > 0) return
  }
  if (--b.timer > 0) return
  b.timer = b.charging ? CHARGE_STEP : WALK[phase - 1]!
  const next = ahead(1)
  const there = world.cable(next)
  if (there === 'head') {
    world.bite()
    return
  }
  if (there === 'body') {
    if (b.charging) {
      // A charge into the cable bonks the beetle silly: a chance to surge.
      b.charging = 0
      b.stun = BONK_STUN
      return
    }
    if (++b.blocked * WALK[phase - 1]! >= BLOCKED_TURN) {
      b.blocked = 0
      b.dir = b.dir === 1 ? -1 : 1
    }
    return
  }
  b.blocked = 0
  b.at = (((b.at + b.dir) % n) + n) % n
  if (b.charging && --b.charging === 0) b.timer = WALK[2]
}

function updateGlitch(b: Boss, world: BossWorld) {
  const phase = bossPhase(b)
  const n = b.ring.length
  const wrap = (i: number) => ((i % n) + n) % n
  if (phase === 3 && b.twin < 0) b.twin = wrap(b.at + (n >> 1))
  if (b.stun > 0) {
    b.stun--
    return
  }
  const ahead = (from: number, dir: number, i: number) =>
    b.ring[wrap(from + dir * i)]!
  if (phase >= 2 && !b.charging) {
    if (b.tell > 0) {
      if (--b.tell === 0) b.charging = CHARGE_RUN
      return
    }
    for (let i = 1; i <= CHARGE_SIGHT; i++) {
      const sees = world.cable(ahead(b.at, b.dir, i))
      if (sees === 'head') b.tell = CHARGE_TELL
      if (sees) break
    }
    if (b.tell > 0) return
  }
  if (--b.timer > 0) return
  b.timer = b.charging ? CHARGE_STEP : GLITCH_WALK[phase - 1]!
  const next = ahead(b.at, b.dir, 1)
  const there = world.cable(next)
  if (there === 'head') {
    world.bite()
    return
  }
  if (there === 'body') {
    if (b.charging) {
      // A charge into the cable stuns the worm: a chance to surge.
      b.charging = 0
      b.stun = BONK_STUN
      return
    }
    if (++b.blocked * GLITCH_WALK[phase - 1]! >= BLOCKED_TURN) {
      b.blocked = 0
      b.dir = b.dir === 1 ? -1 : 1
    }
  } else {
    b.blocked = 0
    b.at = wrap(b.at + b.dir)
    if (b.charging && --b.charging === 0) b.timer = GLITCH_WALK[2]
  }
  if (b.twin < 0) return
  const tnext = ahead(b.twin, b.twinDir, 1)
  const tthere = world.cable(tnext)
  if (tthere === 'head') {
    world.bite()
    return
  }
  const mine = wormCells(b.ring, b.at, b.dir)
  if (tthere === 'body' || mine.includes(tnext)) {
    if (++b.jam * GLITCH_WALK[phase - 1]! >= BLOCKED_TURN) {
      b.jam = 0
      b.twinDir = b.twinDir === 1 ? -1 : 1
    }
    return
  }
  b.jam = 0
  b.twin = wrap(b.twin + b.twinDir)
}

function updateLeak(b: Boss, world: BossWorld) {
  if (b.stun > 0) b.stun--
  const phase = bossPhase(b)
  if (phase < 3) {
    if (--b.timer > 0) return
    b.timer = DRIP_EVERY[phase - 1]!
    // A drip squeezes out of the blob's side, onto the row through the chamber.
    const r = blobRadius(b) + 1
    const side = world.rng() < 0.5 ? -1 : 1
    const k = cellKey(cellX(b.center) + side * r, cellY(b.center))
    if (!world.wall(k) && !world.cable(k)) world.drip(k)
    return
  }
  for (const s of b.splits) {
    if (s.down > 0) {
      if (--s.down === 0) s.k = s.home
      continue
    }
    if (b.stun > 0 || (b.timer + s.k) % SPLIT_STEP) continue
    const next = s.k + s.dx
    if (
      world.wall(next) ||
      world.cable(next) ||
      b.splits.some((o) => o !== s && o.k === next && o.down === 0)
    )
      s.dx = -s.dx
    else s.k = next
  }
  b.timer++
}

function updateSubwoofer(b: Boss, world: BossWorld) {
  if (b.stun > 0) b.stun--
  if (b.charging > 0) {
    b.charging--
    return
  }
  const phase = bossPhase(b)
  if (--b.timer > 0) {
    b.tell = b.timer <= BEAT_TELL ? b.timer : 0
    return
  }
  b.tell = 0
  b.timer = BEAT_EVERY[phase - 1]!
  b.charging = BEAT_PULSE
  world.beat?.(phase >= 2)
}

function updateWhirr(b: Boss, world: BossWorld) {
  if (b.stun > 0) {
    b.stun--
    return
  }
  if (--b.timer > 0) return
  const phase = bossPhase(b)
  const next = b.angle + WHIRR_DIR[phase - 1]!
  const blades = bladeCells(b.center, next)
  if (blades.some((k) => world.busy(k))) {
    // A blade up against the cable jams until it is clear.
    b.jam++
    b.timer = JAM_RETRY
    return
  }
  b.jam = 0
  b.angle = ((next % 8) + 8) % 8
  b.timer = WHIRR_TURN[phase - 1]!
  world.setWalls(whirrWalls(b))
}

/** The hub's four sides the cable lies against (the Big Whirr's last phase wants two). */
export function wrapSides(b: Boss, cable: readonly number[]): number {
  const cx = cellX(b.center)
  const cy = cellY(b.center)
  const sides = new Set<number>()
  for (const k of cable) {
    const dx = cellX(k) - cx
    const dy = cellY(k) - cy
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== 2) continue
    if (dy === -2 && Math.abs(dx) <= 1) sides.add(0)
    if (dx === 2 && Math.abs(dy) <= 1) sides.add(1)
    if (dy === 2 && Math.abs(dx) <= 1) sides.add(2)
    if (dx === -2 && Math.abs(dy) <= 1) sides.add(3)
  }
  return sides.size
}

/**
 * A surge swept these cells: one hit if the boss is among them, unless it is still shrugging
 * off the last. The Memory Leak's split drips must all be in one sweep; the Big Whirr's last
 * phase wants the cable wrapped round two sides of the hub.
 */
export function hitBoss(
  b: Boss,
  swept: ReadonlySet<number>,
  cable: readonly number[] = [],
): boolean {
  if (b.invuln > 0 || b.hp <= 0) return false
  // The Subwoofer shrugs off a surge that lands in the middle of a beat.
  if (b.kind === 'subwoofer' && b.charging > 0) return false
  if (b.kind === 'memory-leak' && b.hp === 1) {
    const live = b.splits.filter((s) => s.down === 0)
    const caught = live.filter((s) => swept.has(s.k))
    if (!caught.length) return false
    if (caught.length < b.splits.length) {
      for (const s of caught) s.down = SPLIT_REFORM
      return false
    }
  } else if (b.kind === 'the-glitch' && bossPhase(b) === 3 && b.twin >= 0) {
    // Both worms must be caught by the same surge.
    const one = wormCells(b.ring, b.at, b.dir)
    const two = wormCells(b.ring, b.twin, b.twinDir)
    if (!one.some((k) => swept.has(k)) || !two.some((k) => swept.has(k)))
      return false
  } else {
    if (!bossCells(b).some((k) => swept.has(k))) return false
    if (b.kind === 'big-whirr' && bossPhase(b) === 3 && wrapSides(b, cable) < 2)
      return false
  }
  b.hp--
  b.invuln = HIT_INVULN
  b.stun = HIT_STUN
  b.charging = 0
  b.tell = 0
  b.blocked = 0
  b.shuffle = Math.max(b.shuffle, SHUFFLE_TELL + 30)
  if (b.kind === 'the-glitch' && bossPhase(b) === 3 && b.twin < 0)
    b.twin = (b.at + (b.ring.length >> 1)) % b.ring.length
  if (b.kind === 'memory-leak' && b.hp === 1)
    // The blob splits into three drips that crawl off along the rows.
    b.splits = [-2, 0, 2].map((dy, i) => {
      const k = cellKey(cellX(b.center), cellY(b.center) + dy)
      return { k, home: k, dx: i === 1 ? 1 : -1, down: 0 }
    })
  return true
}
