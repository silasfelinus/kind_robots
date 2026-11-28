// /utils/scripts/rainbowPersonas.ts
//
// Conductor rainbow t-013 (#4146 section 9): scripted fail-and-retry players. The attract autopilot is untouchable,
// so it proves the campaign's continuity but never how the game treats a player who gets hit. These personas fly
// the real engine with damage ON, through the same input path a cabinet seat uses, and every frame decides only
// from what the player can see (the snapshot's ships, craft and pellets):
//
//   idle       never moves, holds fire (the "hide and spam" floor)
//   novice     dodges late (re-decides every 18 frames, sees 8 frames ahead), never uses B, X or Y
//   typical    dodges every frame (sees 20 frames ahead), holds fire, fires the super when it is charged
//   no-super   the typical player who never presses B
//   expert     typical, plus focus in dense fire and an evade when a pellet cannot be dodged
//   camper     typical until a boss is on screen, then parks in its lane and only holds fire (a stalled boss
//              fight shows up as a long fight with no hits either way)
//
// Each persona can take every continue offered or none. A run records hits and lives lost by Act, continues,
// where it ended (THE END, the failure ending, or the frame cap) and how long it took, so pacing and difficulty
// are measured from real input rather than assumed.
import {
  createRainbowPrincessPreview,
  RAINBOW_SHIP_SPEED,
} from '../arcade/games/rainbowPrincessPreview'
import { SPIRE } from '../arcade/games/rainbowPinkwake'
import { emptyInput, type InputFrame } from '../arcade/types'

export const RAINBOW_PERSONAS = [
  'idle',
  'novice',
  'typical',
  'no-super',
  'expert',
  'camper',
] as const
export type RainbowPersona = (typeof RAINBOW_PERSONAS)[number]

export type PersonaRun = {
  persona: RainbowPersona
  crew: number
  seed: number
  takeContinues: boolean
  outcome: 'end' | 'failed' | 'cap'
  frames: number
  minutes: number
  /** The furthest Act (or detour) the crew reached. */
  furthest: string
  acts: string[]
  continues: number
  /** Lives lost and hits taken (shield or life), by Act. */
  livesLost: Record<string, number>
  hits: Record<string, number>
  supers: number
  finalChoice: string | null
  /** Each continue resumed at the Act of the checkpoint it was offered from. */
  resumes: { from: string; to: string }[]
  /** Each boss fight: the Act, how long a boss body stayed on screen, and the hits the crew took meanwhile. */
  bossFights: { act: string; frames: number; hits: number }[]
}

type Snap = ReturnType<typeof createRainbowPrincessPreview>['snapshot']

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const W = 480
const H = 270
const MOVES: [number, number][] = [
  [0, 0],
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

type Body = { x: number; y: number; vx: number; vy: number }
const NOT_BODIES = new Set(['checkpoint', 'escort', 'navigator'])

/** Every boss and guardian body on screen (the snapshot keeps each in its own field), with its last motion. */
function bodies(snap: Snap, last: Map<string, Body>): Body[] {
  const found: Body[] = []
  const seen = new Map<string, Body>()
  const add = (key: string, value: unknown) => {
    if (!value || typeof value !== 'object') return
    const v = value as { x?: unknown; y?: unknown }
    if (typeof v.x !== 'number' || typeof v.y !== 'number') return
    const before = last.get(key)
    const body = {
      x: v.x,
      y: v.y,
      vx: before ? v.x - before.x : 0,
      vy: before ? v.y - before.y : 0,
    }
    seen.set(key, body)
    if (body.x > -40 && body.x < W + 40) found.push(body)
  }
  for (const [key, value] of Object.entries(snap)) {
    if (NOT_BODIES.has(key) || key === 'ships' || key === 'shots') continue
    if (Array.isArray(value)) {
      if (key === 'enemies' || key === 'enemyShots' || key === 'caches')
        continue
      value.forEach((each, i) => add(`${key}.${i}`, each))
    } else add(key, value)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const twins = (value as { twins?: unknown }).twins
      if (Array.isArray(twins))
        twins.forEach((each, i) => add(`${key}.twins.${i}`, each))
    }
  }
  // Craft carry no velocity: match each to the nearest craft of its kind a frame ago.
  const before = [...last.entries()].filter(([key]) => key.startsWith('craft:'))
  snap.enemies.forEach((reef, i) => {
    let best: Body | undefined
    let near = 14
    for (const [key, prior] of before) {
      if (!key.startsWith(`craft:${reef.kind}:`)) continue
      const d = Math.hypot(prior.x - reef.x, prior.y - reef.y)
      if (d < near) {
        near = d
        best = prior
      }
    }
    const moving = reef as { vx?: number; vy?: number }
    moving.vx = best ? reef.x - best.x : 0
    moving.vy = best ? reef.y - best.y : 0
    seen.set(`craft:${reef.kind}:${i}`, { x: reef.x, y: reef.y, vx: 0, vy: 0 })
  })
  last.clear()
  for (const [key, body] of seen) last.set(key, body)
  return found
}

/**
 * How dangerous it is to steer (dx, dy) for the next `look` frames: the ship's own path against each pellet's path
 * frame by frame (a pellet hits inside 7 px), craft bodies, the walls, and drift from the pilot's home line.
 */
function danger(
  snap: Snap,
  big: readonly Body[],
  seat: number,
  dx: number,
  dy: number,
  look: number,
  speed: number,
): number {
  const ship = snap.ships[seat]!
  const length = Math.hypot(dx, dy) || 1
  const vx = (dx / length) * speed
  const vy = (dy / length) * speed
  let risk = 0
  for (let t = 1; t <= look; t++) {
    const x = Math.max(20, Math.min(W - 40, ship.x + vx * t))
    const y = Math.max(34, Math.min(H - 25, ship.y + vy * t))
    const soon = look + 1 - t
    for (const shot of snap.enemyShots) {
      if (shot.ghost) continue
      const px = shot.x + shot.vx * t
      const py = shot.y + shot.vy * t + ((shot.ay ?? 0) * t * t) / 2
      const d = Math.hypot(px - x, py - y)
      if (d < 7) risk += 400 * soon
      else if (d < 16) risk += (16 - d) * soon
    }
    for (const reef of snap.enemies) {
      if (reef.truce || reef.kind === 'captive') continue
      if (reef.kind === 'spire') {
        // Terrain: a column from the top or the bottom edge, scrolling left.
        const sx = reef.x - SPIRE.speed * t
        const inside = reef.fromTop ? reef.y + 10 - y : y - (reef.y - 10)
        if (Math.abs(x - sx) < SPIRE.halfWidth + 12 && inside > 0)
          risk += (20 + inside) * 20 * soon
        continue
      }
      const move = reef as { vx?: number; vy?: number }
      const d = Math.hypot(
        reef.x + (move.vx ?? 0) * t - x,
        reef.y + (move.vy ?? 0) * t - y,
      )
      if (d < 18) risk += (18 - d) * 20 * soon
    }
    for (const body of big) {
      const d = Math.hypot(body.x + body.vx * t - x, body.y + body.vy * t - y)
      if (d < 40) risk += (40 - d) * 30 * soon
    }
    if (t === look) {
      // With nothing to dodge, a pilot lines up on the nearest boss body ahead to hit it.
      const ahead = big.filter((body) => body.x > x + 40)
      if (ahead.length)
        risk += Math.min(...ahead.map((body) => Math.abs(body.y - y))) * 0.6
      risk += Math.max(0, 44 - y) * 4 + Math.max(0, y - (H - 40)) * 4
      risk += Math.abs(x - 90) * 0.5
    }
  }
  return risk
}

function choose(
  snap: Snap,
  big: readonly Body[],
  seat: number,
  look: number,
  speed: number,
): [number, number] {
  let best: [number, number] = [0, 0]
  let lowest = Infinity
  for (const [dx, dy] of MOVES) {
    const risk = danger(snap, big, seat, dx, dy, look, speed)
    if (risk < lowest - 0.01) {
      lowest = risk
      best = [dx, dy]
    }
  }
  return best
}

function act(snap: Snap): string {
  return snap.act as string
}

/** Fly one persona from a fresh start to THE END, the failure ending or the frame cap. */
export function flyPersona(
  persona: RainbowPersona,
  crew: number,
  seed: number,
  takeContinues: boolean,
  cap = 360000,
  onHit?: (before: Snap, seat: number, act: string) => void,
  onFrame?: (snap: Snap, frame: number) => void,
  /** Fly this pilot in seat 1 (RAINBOW_PILOTS index) through the real cabinet select; unset, the default crew. */
  pilot?: number,
  /** A probe's last word on each seat's input (park a seat, hold a button), after the persona decides. */
  steer?: (snap: Snap, seat: number, input: InputFrame) => void,
): PersonaRun {
  const game = createRainbowPrincessPreview({
    players: crew,
    demo: false,
    rng: seeded(seed),
    sound: { play() {} },
    hiScore: 0,
    selectScreen: pilot !== undefined,
  })
  if (pilot !== undefined) {
    // Row 0 rotates the whole crew one pilot per press; A launches after the menu's beat.
    const none = () => Array.from({ length: crew }, () => emptyInput())
    for (let step = 0; step < pilot; step++) {
      const keys = none()
      keys[0]!.pressed.right = true
      game.update(keys[0]!, keys)
      game.update(emptyInput(), none())
    }
    for (let wait = 0; wait < 30; wait++) game.update(emptyInput(), none())
    const launch = none()
    launch[0]!.pressed.a = true
    game.update(launch[0]!, launch)
  }
  const acts: string[] = []
  const livesLost: Record<string, number> = {}
  const hits: Record<string, number> = {}
  const resumes: { from: string; to: string }[] = []
  const held: [number, number][] = Array.from({ length: crew }, () => [0, 0])
  const lastSuper = Array.from({ length: crew }, () => 0)
  let supers = 0
  let continues = 0
  let offeredAt: string | null = null
  let previous = game.snapshot.ships.map((s) => ({
    lives: s.lives,
    shield: s.shield,
  }))
  const motion = new Map<string, Body>()
  const bossFights: { act: string; frames: number; hits: number }[] = []
  let fight: { act: string; frames: number; hits: number } | null = null
  let frame = 0
  for (; frame < cap && !game.over; frame++) {
    const snap = game.snapshot
    onFrame?.(snap, frame)
    const where = act(snap)
    if (acts.at(-1) !== where) acts.push(where)
    const big = bodies(snap, motion)
    if (big.length && snap.continueLeft === 0) {
      if (!fight || fight.act !== where) {
        fight = { act: where, frames: 0, hits: 0 }
        bossFights.push(fight)
      }
      fight.frames++
    } else if (!big.length) fight = null
    const seats: InputFrame[] = []
    for (let seat = 0; seat < crew; seat++) {
      const input = emptyInput()
      const ship = snap.ships[seat]!
      if (snap.continueLeft > 0) {
        // The CONTINUE? countdown: take it after a beat, or let it run out.
        if (takeContinues && snap.continueLeft < 560) input.pressed.a = true
        seats.push(input)
        continue
      }
      input.held.a = true
      if (persona !== 'idle' && ship.lives > 0) {
        // A retry is never a frame-perfect replay: each continue moves when a novice looks up by a scrambled
        // amount, or a novice who died in a stretch with no rng in it could die the same way after every
        // continue, forever (a fixed shift per continue can still line up with the length of a lap).
        const glance = (Math.imul(continues + 1, 2654435761) >>> 16) % 18
        const decides =
          persona === 'novice' ? (frame + glance) % 18 === seat : true
        if (persona === 'camper' && big.length) held[seat] = [0, 0]
        else if (decides)
          held[seat] = choose(
            snap,
            big,
            seat,
            persona === 'novice' ? 8 : 20,
            RAINBOW_SHIP_SPEED,
          )
        const [dx, dy] = held[seat]!
        input.held.left = dx < 0
        input.held.right = dx > 0
        input.held.up = dy < 0
        input.held.down = dy > 0
        const pressure = danger(snap, big, seat, 0, 0, 12, 0)
        if (
          (persona === 'typical' || persona === 'expert') &&
          ship.charge >= 100 &&
          (pressure > 400 || snap.boss) &&
          frame - lastSuper[seat]! > 60
        ) {
          input.pressed.b = true
          lastSuper[seat] = frame
          supers++
        }
        if (persona === 'expert') {
          input.held.b = pressure > 60 && !input.pressed.b
          if (
            danger(
              snap,
              big,
              seat,
              held[seat]![0],
              held[seat]![1],
              10,
              RAINBOW_SHIP_SPEED,
            ) > 2000 &&
            ship.evadeCooldown === 0
          )
            input.pressed.y = true
        }
      }
      steer?.(snap, seat, input)
      seats.push(input)
    }
    if (snap.continueLeft > 0 && offeredAt === null) offeredAt = where
    game.update(seats[0]!, seats)
    const after = game.snapshot
    if (offeredAt !== null && after.continueLeft === 0) {
      if (after.continues > continues) {
        continues = after.continues
        resumes.push({ from: offeredAt, to: act(after) })
      }
      offeredAt = null
    }
    after.ships.forEach((ship, seat) => {
      const before = previous[seat]
      if (!before) return
      if (ship.lives < before.lives)
        livesLost[where] = (livesLost[where] ?? 0) + (before.lives - ship.lives)
      if (
        ship.lives < before.lives ||
        (ship.lives === before.lives && ship.shield < before.shield)
      ) {
        hits[where] = (hits[where] ?? 0) + 1
        if (fight) fight.hits++
        onHit?.(snap, seat, where)
      }
    })
    previous = after.ships.map((s) => ({ lives: s.lives, shield: s.shield }))
  }
  const s = game.snapshot
  const order = acts.filter((a) => a.startsWith('S'))
  return {
    persona,
    crew,
    seed,
    takeContinues,
    outcome:
      game.over && s.stage === 'end'
        ? 'end'
        : s.failFrame !== null || game.over
          ? 'failed'
          : 'cap',
    frames: frame,
    minutes: Math.round((frame / 3600) * 10) / 10,
    furthest: order.at(-1) ?? acts.at(-1) ?? 'S01',
    acts,
    continues,
    livesLost,
    hits,
    supers,
    finalChoice: s.finalChoice,
    resumes,
    bossFights,
  }
}
