// /utils/zuzuShowdown/effects.ts
//
// Zuzu Showdown hit effects (conductor zuzu-showdown t-010): a hand-pixel spark where a blow lands,
// coloured by what happened (a hit, a counter hit, a block, a parry, a clash) and doubled in size
// for a heavy blow. Sparks are placed where the attacker's hitbox meets the defender's hurtbox, so
// they sit on the blade tip or the boot, not on the fighter's middle. A KO also slows the match to
// a third of its speed for a moment, with a white flash on the finishing blow (t-019). This module
// is pure: sim events in, sparks and the slow-down out. render.ts draws the sparks; the stage
// component ages them each frame and paces the sim by the slow-down.

import { hurtbox, moveOf, toWorld } from './sim'
import {
  SUB,
  type FighterData,
  type MatchState,
  type SimEvent,
  type WorldBox,
} from './types'

export type SparkKind = 'hit' | 'counter' | 'block' | 'parry' | 'clash'

export type Spark = {
  kind: SparkKind
  /** World position of the spark's centre, sub-pixels, y up from the floor like the sim. */
  x: number
  y: number
  /** Pixel scale: 2 for a heavy blow. */
  scale: 1 | 2
  /** Frames since the spark appeared. */
  age: number
}

/** Sim frames each spark frame shows for. */
export const SPARK_TICKS = 2

/** A blow at least this strong throws the big spark. */
export const HEAVY_DAMAGE = 70

// Hand-pixel spark frames (13 x 13): an impact star, the burst, the ring breaking up, the embers.
// W core, w ray tips, y the hot ring, o the cooler sparks, r the last embers; '.' is empty.
const SPARK_FRAMES = [
  [
    '.............',
    '.............',
    '......w......',
    '......w......',
    '.....wyw.....',
    '....wyyyw....',
    '..wwyyWyyww..',
    '....wyyyw....',
    '.....wyw.....',
    '......w......',
    '......w......',
    '.............',
    '.............',
  ],
  [
    'o.....w.....o',
    '.o....w....o.',
    '..o..ywy..o..',
    '...oyyyyyo...',
    '...yyWWWyy...',
    '..yyWWWWWyy..',
    'wwyyWWWWWyyww',
    '..yyWWWWWyy..',
    '...yyWWWyy...',
    '...oyyyyyo...',
    '..o..ywy..o..',
    '.o....w....o.',
    'o.....w.....o',
  ],
  [
    'o.....y.....o',
    '.............',
    '..o.......o..',
    '.....yyy.....',
    '....y...y....',
    '...y.....y...',
    'y..y.....y..y',
    '...y.....y...',
    '....y...y....',
    '.....yyy.....',
    '..o.......o..',
    '.............',
    'o.....y.....o',
  ],
  [
    'r...........r',
    '.............',
    '.............',
    '.....o.o.....',
    '.............',
    '...o.....o...',
    'o...........o',
    '...o.....o...',
    '.............',
    '.....o.o.....',
    '.............',
    '.............',
    'r...........r',
  ],
] as const

export const SPARK_SIZE = SPARK_FRAMES[0][0].length

/** How long a spark lives, in sim frames. */
export const SPARK_LIFE = SPARK_FRAMES.length * SPARK_TICKS

type Palette = Record<'W' | 'w' | 'y' | 'o' | 'r', string>

export const SPARK_PALETTES: Record<SparkKind, Palette> = {
  hit: { W: '#ffffff', w: '#fffbeb', y: '#fde047', o: '#fb923c', r: '#ef4444' },
  counter: {
    W: '#fff1f2',
    w: '#ffffff',
    y: '#f9a8d4',
    o: '#f43f5e',
    r: '#9f1239',
  },
  block: {
    W: '#e0f2fe',
    w: '#ffffff',
    y: '#7dd3fc',
    o: '#3b82f6',
    r: '#1e3a8a',
  },
  parry: {
    W: '#ffffff',
    w: '#f0fdf4',
    y: '#bbf7d0',
    o: '#4ade80',
    r: '#166534',
  },
  clash: {
    W: '#ffffff',
    w: '#ffffff',
    y: '#e5e7eb',
    o: '#fde047',
    r: '#a8a29e',
  },
}

/** One spark frame as pixels: offsets from the spark's centre and palette keys. */
export type SparkPixel = { dx: number; dy: number; key: keyof Palette }

export const SPARK_PIXELS: SparkPixel[][] = SPARK_FRAMES.map((rows) => {
  const half = Math.floor(rows.length / 2)
  const pixels: SparkPixel[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const key = row[x]
      if (key && key !== '.')
        pixels.push({ dx: x - half, dy: y - half, key: key as keyof Palette })
    }
  })
  return pixels
})

/** The frame of its animation a spark shows, or null once it has burnt out. */
export function sparkFrame(spark: Spark): number | null {
  const frame = Math.floor(spark.age / SPARK_TICKS)
  return frame < SPARK_PIXELS.length ? frame : null
}

function centre(box: WorldBox): { x: number; y: number } {
  return { x: (box.left + box.right) / 2, y: (box.bottom + box.top) / 2 }
}

/**
 * Where a blow from `attacker` landed: the middle of the overlap of its hitbox and the defender's
 * hurtbox. A projectile (no hitbox of its own) or a blow that has already pushed apart lands on the
 * defender's near edge at chest height.
 */
export function contactPoint(
  s: MatchState,
  roster: [FighterData, FighterData],
  attacker: 0 | 1,
  moveId: string,
): { x: number; y: number } {
  const defender: 0 | 1 = attacker === 0 ? 1 : 0
  const a = s.fighters[attacker]
  const d = s.fighters[defender]
  const hurt = hurtbox(d, roster[defender]) ?? {
    left: d.x,
    right: d.x,
    bottom: d.y,
    top: d.y,
  }
  let strike: WorldBox | null = null
  try {
    const move = moveOf(roster[attacker], {
      id: moveId,
      heavy: a.attack?.heavy ?? false,
    })
    if (move.hitbox.w > 0 && move.hitbox.h > 0) strike = toWorld(a, move.hitbox)
  } catch {
    strike = null
  }
  if (strike) {
    const overlap: WorldBox = {
      left: Math.max(strike.left, hurt.left),
      right: Math.min(strike.right, hurt.right),
      bottom: Math.max(strike.bottom, hurt.bottom),
      top: Math.min(strike.top, hurt.top),
    }
    if (overlap.left <= overlap.right && overlap.bottom <= overlap.top)
      return centre(overlap)
  }
  const nearEdge = a.x <= d.x ? hurt.left : hurt.right
  return { x: nearEdge, y: hurt.bottom + (hurt.top - hurt.bottom) * 0.65 }
}

/** The sparks this frame's sim events throw. */
export function sparksFor(
  events: SimEvent[],
  s: MatchState,
  roster: [FighterData, FighterData],
): Spark[] {
  const out: Spark[] = []
  for (const e of events) {
    switch (e.type) {
      case 'hit': {
        const at = contactPoint(s, roster, e.attacker, e.move)
        const big = e.counter || e.damage >= HEAVY_DAMAGE
        out.push({
          kind: e.counter ? 'counter' : 'hit',
          ...at,
          scale: big ? 2 : 1,
          age: 0,
        })
        break
      }
      case 'block':
        out.push({
          kind: 'block',
          ...contactPoint(s, roster, e.attacker, e.move),
          scale: 1,
          age: 0,
        })
        break
      case 'parry': {
        // On the parrying fighter's front edge, where the blow was caught.
        const f = s.fighters[e.side]
        const box = hurtbox(f, roster[e.side])
        const front = box ? (f.facing === 1 ? box.right : box.left) : f.x
        const y = box ? box.bottom + (box.top - box.bottom) * 0.6 : f.y
        out.push({ kind: 'parry', x: front, y, scale: 2, age: 0 })
        break
      }
      case 'clash': {
        const [p, q] = s.fighters
        const height = Math.min(roster[0].hurtStand.h, roster[1].hurtStand.h)
        out.push({
          kind: 'clash',
          x: (p.x + q.x) / 2,
          y: (p.y + q.y) / 2 + height * 0.6 * SUB,
          scale: 2,
          age: 0,
        })
        break
      }
      default:
        break
    }
  }
  return out
}

/** Age the sparks by a frame, drop the burnt-out ones, and add this frame's new ones. */
export function advanceSparks(
  list: Spark[],
  s: MatchState,
  roster: [FighterData, FighterData],
): Spark[] {
  const aged = list
    .map((spark) => ({ ...spark, age: spark.age + 1 }))
    .filter((spark) => sparkFrame(spark) !== null)
  return [...aged, ...sparksFor(s.events, s, roster)].slice(-12)
}

// ---------------------------------------------------------------- the KO slow-down

/** After a KO the match plays at a third of its speed for this many screen frames. */
export const KO_SLOW_TICKS = 72
/** One sim step every this many screen frames while slowed. */
export const KO_SLOW_RATE = 3
/** The white flash on the finishing blow, in screen frames (none under reduced motion). */
export const KO_FLASH_TICKS = 8

/** Screen frames since the finishing blow, or null when the match runs at full speed. */
export type KoSlowdown = { tick: number } | null

/**
 * A KO (a double KO too, but not time over) starts the slow-down. It only changes how often the
 * stage steps the sim, so the match itself plays out exactly as it would at full speed.
 */
export function koSlowdownFor(events: SimEvent[]): KoSlowdown {
  return events.some((e) => e.type === 'ko') ? { tick: 0 } : null
}

/** Should the stage step the sim on this screen frame? */
export function slowdownSteps(k: KoSlowdown): boolean {
  return k === null || (k.tick + 1) % KO_SLOW_RATE === 0
}

/** The slow-down a screen frame later; null once it has run its course. */
export function advanceSlowdown(k: KoSlowdown): KoSlowdown {
  if (k === null || k.tick + 1 >= KO_SLOW_TICKS) return null
  return { tick: k.tick + 1 }
}

/** How strong the KO flash is on this screen frame, from 1 (the blow) to 0. */
export function koFlash(k: KoSlowdown, reduced: boolean): number {
  if (k === null || reduced || k.tick >= KO_FLASH_TICKS) return 0
  return 1 - k.tick / KO_FLASH_TICKS
}
