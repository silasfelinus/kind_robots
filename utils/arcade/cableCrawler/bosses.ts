// /utils/arcade/cableCrawler/bosses.ts
//
// Cable Crawler's bosses (conductor kr-arcade/t-064, spec: CABINETS.md section 8, "The bosses").
// A boss takes surges, not bites: lay the cable where it will touch the boss, then plug in.
//
// 1. The Surge Protector (the Power Strip): a great fuse beetle walking the fuse box's ring
//    corridor. Your cable's body stops it; your plug meeting it head-on unplugs you.
//    - Phase 1: lay your cable across its path, then surge through it. Three surges.
//    - Phase 2: it pulls the sockets round the board (they flicker first). Two surges.
//    - Phase 3: it charges down the ring at whatever plug it sees ahead (it glows first).
//      Pause in a side corridor and let it pass; a charge that slams into your cable stuns it.

import type { BossKind } from './components'

export type Boss = {
  kind: BossKind
  hp: number
  maxHp: number
  /** The ring it walks, and where on it the boss is. */
  ring: readonly number[]
  at: number
  dir: 1 | -1
  timer: number
  /** Ticks it has been pushing against the cable. */
  blocked: number
  /** Ticks it shrugs off surges after a hit. */
  invuln: number
  /** Ticks it is dazed (a hit, or a charge into the cable). */
  stun: number
  /** Ticks of glowing before a charge, and whether it is charging. */
  tell: number
  charging: number
  /** Ticks to the next socket shuffle (phase 2 on). */
  shuffle: number
}

export const SURGE_PROTECTOR_HP = 7
/** Hits left at which each later phase begins. */
const PHASE_AT = [4, 2] as const
const WALK = [12, 10, 9] as const
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

export const BOSS_HIT_POINTS = 2000
export const BOSS_DEFEAT_POINTS = 10_000

export function newBoss(
  kind: BossKind,
  ring: readonly number[],
  start: number,
): Boss {
  const at = Math.max(0, ring.indexOf(start))
  return {
    kind,
    hp: SURGE_PROTECTOR_HP,
    maxHp: SURGE_PROTECTOR_HP,
    ring,
    at,
    dir: 1,
    timer: 90,
    blocked: 0,
    invuln: 0,
    stun: 0,
    tell: 0,
    charging: 0,
    shuffle: SHUFFLE_EVERY,
  }
}

/** The boss's phase, 1 to 3. */
export function bossPhase(b: Boss): number {
  return b.hp > PHASE_AT[0] ? 1 : b.hp > PHASE_AT[1] ? 2 : 3
}

export function bossCell(b: Boss): number {
  return b.ring[b.at]!
}

/** What the boss's world tells it, and what it can do to the world. */
export type BossWorld = {
  /** What lies on a cell: the plug, the cable's body, or nothing. */
  cable(k: number): 'head' | 'body' | null
  /** The plug met the boss head-on. */
  bite(): void
  /** Move the sockets onto other slots. */
  shuffleSockets(): void
}

/** One tick of the boss. */
export function updateBoss(b: Boss, world: BossWorld) {
  if (b.hp <= 0) return
  if (b.invuln > 0) b.invuln--
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

/** A surge reached the boss: one hit, unless it is still shrugging off the last. */
export function hitBoss(b: Boss): boolean {
  if (b.invuln > 0 || b.hp <= 0) return false
  b.hp--
  b.invuln = HIT_INVULN
  b.stun = HIT_STUN
  b.charging = 0
  b.tell = 0
  b.blocked = 0
  b.shuffle = Math.max(b.shuffle, SHUFFLE_TELL + 30)
  return true
}
