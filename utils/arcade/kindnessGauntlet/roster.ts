// /utils/arcade/kindnessGauntlet/roster.ts
//
// Kindness Gauntlet's glitches (conductor kr-arcade t-051, depth-pass/CABINETS.md section 5, "The
// roster: 1 -> 14 glitches"). ROSTER is the data the floors, the generators, the tests and the
// pilot read: each kind's hits, points, speed, its tell and its answer, the floor it debuts on and
// the generator that releases it. steerGlitch moves each kind through the small GlitchWorld the
// game hands it, so every kind's rules read on their own.
//
// Every glitch shows what it is about to do before it does it (the tell) and has an answer. Cartoon
// rules: a fixed glitch reboots into a happy little puff of sparkles; nobody is hurt, bots only lose
// charge.

import type { ArcadeSoundName } from '../sound'

export type GlitchKind =
  | 'glitch'
  | 'brute'
  | 'popup'
  | 'imp'
  | 'pickpocket'
  | 'leech'
  | 'spill'
  | 'bug'
  | 'mimic'
  | 'worm'
  | 'bluescreen'
  | 'blinker'
  | 'wizard'
  | 'cursor'

/** What a generator looks like: each glitch kind comes out of its own machine. */
export type GeneratorLook =
  | 'cabinet'
  | 'feeder'
  | 'router'
  | 'reel'
  | 'urn'
  | 'nest'
  | 'vending'
  | 'arcade'
  | 'antenna'
  | 'hourglass'

export type RosterEntry = {
  name: string
  /** Spark hits to fix one released by a tier-1 generator. */
  hp: number
  /** Extra hits from a tier-3 generator. */
  tierHp: number
  points: number
  /** A multiple of the floor's glitch speed. */
  speed: number
  /** The procedural floor it first appears on (authored wings place their own). */
  debut: number
  /** What it does before it acts. */
  tell: string
  /** How to beat it. */
  answer: string
  /** The machine that releases it, and how much slower than a glitch cabinet it releases. */
  look: GeneratorLook
  every: number
  /** How many of its kind one generator keeps out at once. */
  most: number
  /** Sparks pass over it without fixing it (it only dries out under a pulse). */
  unfixable?: boolean
}

export const ROSTER: Record<GlitchKind, RosterEntry> = {
  glitch: {
    name: 'GLITCH',
    hp: 1,
    tierHp: 1,
    points: 10,
    speed: 1,
    debut: 1,
    tell: 'homes in and clings',
    answer: 'spark it',
    look: 'cabinet',
    every: 1,
    most: 99,
  },
  brute: {
    name: 'STATIC BRUTE',
    hp: 3,
    tierHp: 2,
    points: 50,
    speed: 0.6,
    debut: 1,
    tell: 'stomps before it shoves',
    answer: 'keep your distance. hugs sparks pierce',
    look: 'feeder',
    every: 2.2,
    most: 3,
  },
  pickpocket: {
    name: 'PICKPOCKET',
    hp: 1,
    tierHp: 1,
    points: 60,
    speed: 1.45,
    debut: 2,
    tell: 'a sly grin',
    answer: 'spark it before it leaves and it drops the loot',
    look: 'reel',
    every: 3,
    most: 1,
  },
  popup: {
    name: 'POP-UP',
    hp: 2,
    tierHp: 1,
    points: 40,
    speed: 0.45,
    debut: 3,
    tell: 'a ! before it lobs a packet over the racks',
    answer: 'get into its room. it cannot lob up close',
    look: 'router',
    every: 2.5,
    most: 2,
  },
  mimic: {
    name: 'MIMIC SNACK',
    hp: 1,
    tierHp: 0,
    points: 30,
    speed: 0.9,
    debut: 4,
    tell: 'a snack that blinks',
    answer: 'spark it and it turns into a real snack',
    look: 'vending',
    every: 3,
    most: 2,
  },
  imp: {
    name: 'FIREWALL IMP',
    hp: 2,
    tierHp: 1,
    points: 40,
    speed: 0.75,
    debut: 5,
    tell: 'an inhale glow',
    answer: 'its sparks fly straight. move diagonally',
    look: 'router',
    every: 2.2,
    most: 3,
  },
  spill: {
    name: 'COFFEE SPILL',
    hp: 1,
    tierHp: 0,
    points: 25,
    speed: 0.55,
    debut: 6,
    tell: 'ripples',
    answer: 'avoid it. a pulse dries it for 5 seconds',
    look: 'urn',
    every: 4,
    most: 2,
    unfixable: true,
  },
  leech: {
    name: 'LEECH',
    hp: 1,
    tierHp: 1,
    points: 60,
    speed: 1.1,
    debut: 7,
    tell: 'a battery on its back',
    answer: 'spark it to get the charge back',
    look: 'reel',
    every: 2.6,
    most: 2,
  },
  bug: {
    name: 'BUG SWARM',
    hp: 1,
    tierHp: 0,
    points: 5,
    speed: 1.75,
    debut: 8,
    tell: 'buzzing',
    answer: 'a pulse, hugs piercing sparks or zips fast ones',
    look: 'nest',
    every: 4,
    most: 12,
  },
  worm: {
    name: 'WORM',
    hp: 3,
    tierHp: 2,
    points: 80,
    speed: 0.85,
    debut: 9,
    tell: 'a segmented trail',
    answer: 'spark the head. a hit mid-body splits it into glitches',
    look: 'reel',
    every: 3,
    most: 2,
  },
  blinker: {
    name: 'BLINKER',
    hp: 1,
    tierHp: 1,
    points: 40,
    speed: 1.1,
    debut: 10,
    tell: 'a flicker on the beat',
    answer: 'a pulse shows it, and a sage pulse stuns it',
    look: 'arcade',
    every: 2.4,
    most: 3,
  },
  wizard: {
    name: 'POP-UP WIZARD',
    hp: 2,
    tierHp: 2,
    points: 80,
    speed: 0,
    debut: 11,
    tell: 'sparkles where it will appear',
    answer: 'spark the sparkle',
    look: 'antenna',
    every: 2.5,
    most: 2,
  },
  cursor: {
    name: 'SLEEPY CURSOR',
    hp: 1,
    tierHp: 0,
    points: 300,
    speed: 0.5,
    debut: 12,
    tell: 'a spinning hourglass',
    answer: 'sparks pass through. only a pulse puts it to sleep',
    look: 'hourglass',
    every: 5,
    most: 1,
    unfixable: true,
  },
  bluescreen: {
    name: 'BIG BLUESCREEN',
    hp: 30,
    tierHp: 10,
    points: 2500,
    speed: 0.32,
    debut: 99,
    tell: 'fills with blue before it breathes static',
    answer: 'circle round it. best with every bot sparking',
    look: 'cabinet',
    every: 99,
    most: 1,
  },
}

/** How often a blinker shows itself (one blink a beat), and how long a pulse's light shows it. */
export const BLINK_BEAT = 30
export const BLINK_SHOWN = 3
export const PULSE_SHOWS = 5 * 60
/** A pop-up wizard's teleport: the sparkles where it will appear, and its volleys before it goes. */
export const WIZARD_TELL = 50
export const WIZARD_VOLLEYS = 2

/** Segments a worm trails (by its generator's tier), and the gap between them. */
export const WORM_SEGMENTS = [5, 6, 8] as const
export const WORM_GAP = 6
/** The Big Bluescreen's breath: its wind-up, how long it breathes, its reach and its spread. */
export const BLUE_TELL = 50
export const BLUE_BREATH = 45
export const BLUE_REACH = 92
export const BLUE_SPREAD = 0.62

export const GLITCH_KINDS = Object.keys(ROSTER) as GlitchKind[]

/** The kinds a procedural floor can field, newest last. */
export function kindsUpTo(floor: number): GlitchKind[] {
  return GLITCH_KINDS.filter((k) => ROSTER[k].debut <= floor).sort(
    (a, b) => ROSTER[a].debut - ROSTER[b].debut,
  )
}

/** The kind (if any) that debuts on this procedural floor, besides the plain glitch. */
export function debutOn(floor: number): GlitchKind | null {
  return (
    GLITCH_KINDS.find((k) => k !== 'glitch' && ROSTER[k].debut === floor) ??
    null
  )
}

export type Tier = 1 | 2 | 3

/** A glitch released by a generator of this tier: tier 3 releases the toughest. */
export function glitchHp(kind: GlitchKind, tier: Tier): number {
  const e = ROSTER[kind]
  return (
    e.hp + (tier === 3 ? e.tierHp : tier === 2 ? Math.floor(e.tierHp / 2) : 0)
  )
}

export type Loot =
  { kind: 'key' } | { kind: 'pulse' } | { kind: 'charge'; amount: number }

export type Glitch = {
  id: number
  kind: GlitchKind
  x: number
  y: number
  /** A heading: a spill's slide, an imp's next shot, a shove's direction. */
  vx: number
  vy: number
  hp: number
  maxHp: number
  tier: Tier
  /** The bite timer while clinging. */
  cling: number
  wobble: number
  /** The kind's own clock: wind-ups, lobs, inhales, blinks, digestion. */
  t: number
  state:
    'walk' | 'windup' | 'rest' | 'inhale' | 'flee' | 'dry' | 'still' | 'awake'
  /** What a pickpocket or a leech is carrying off, and from which seat. */
  loot: Loot | null
  from: number
  /** The generator that released it (-1 when the floor placed it). */
  gen: number
  /** A hit flash. */
  flash: number
  /** A mimic that has been seen blinking: the pilot (and a sharp eye) knows it now. */
  seen: boolean
  /** A worm's segments, head first after the head itself. */
  body?: Array<{ x: number; y: number }>
  /** Ticks a pulse's light keeps a blinker in view, and ticks it is stunned for. */
  shown?: number
  stun?: number
  /** A ghost the Attract Mode projected: half as tough, and it never turns helper. */
  ghost?: boolean
}

/** A bot as the glitches see it. */
export type Prey = { x: number; y: number; seat: number }

/** What a glitch can sense and do on the floor: the game implements it. */
export interface GlitchWorld {
  readonly tick: number
  /** The floor's glitch speed and the bite a clinging glitch takes. */
  readonly speed: number
  readonly bite: number
  rng(): number
  /** The bot with the fullest battery, however far (what a Sleepy Cursor drifts toward). */
  fullest(g: Glitch): Prey | null
  /** Whom it hunts: the Hug Token's holder anywhere on the floor, else the nearest bot in range. */
  prey(g: Glitch): Prey | null
  /** The nearest rolling bot, however far. */
  nearest(g: Glitch): Prey | null
  /** Move by (vx, vy) against the racks; false when a wall stopped it. */
  move(g: Glitch, vx: number, vy: number): boolean
  /** Is there floor at this point? */
  open(x: number, y: number): boolean
  /** No rack between the two points. */
  clear(ax: number, ay: number, bx: number, by: number): boolean
  /** One step along the walking route to the stairs (a unit vector), or null at or cut off from them. */
  toStairs(g: Glitch): { x: number; y: number } | null
  atStairs(g: Glitch): boolean
  /** Take charge from a bot (armour and charms apply). */
  drain(prey: Prey, amount: number): void
  /** Push a bot a tile away along (dx, dy). */
  shove(prey: Prey, dx: number, dy: number): void
  /** A pickpocket or leech takes something from this bot. */
  steal(g: Glitch, prey: Prey): void
  /** A pop-up's packet, landing at (tx, ty). */
  lob(g: Glitch, tx: number, ty: number): void
  /** A firewall imp's slow spark along (dx, dy). */
  bolt(g: Glitch, dx: number, dy: number): void
  /** A pickpocket gets away down the stairs with its loot. */
  escape(g: Glitch): void
  /** A leech digests what it stole. */
  digest(g: Glitch): void
  /** The glitch tells the room what it is about to do. */
  tell(g: Glitch): void
  /** The Big Bluescreen's static breath along (dx, dy) this tick. */
  breathe(g: Glitch, dx: number, dy: number): void
  play(name: ArcadeSoundName): void
}

const CLING_TICKS = 20
const BUG_CLING_TICKS = 14
/** The range inside which a pop-up cannot lob, and the range of its lob. */
export const POPUP_NEAR = 46
export const POPUP_FAR = 16 * 11
export const POPUP_TELL = 40
export const IMP_TELL = 30
export const BRUTE_TELL = 26
export const MIMIC_BLINK = 8

function towards(g: Glitch, p: Prey) {
  const dx = p.x - g.x
  const dy = p.y - g.y
  const d = Math.hypot(dx, dy) || 1
  return { dx, dy, d, ux: dx / d, uy: dy / d }
}

function tierSpeed(g: Glitch): number {
  return 1 + 0.08 * (g.tier - 1)
}

/** One tick of a glitch's own rules. */
export function steerGlitch(w: GlitchWorld, g: Glitch) {
  if (g.flash > 0) g.flash--
  if (g.shown) g.shown--
  if (g.stun) {
    g.stun--
    return
  }
  const speed = w.speed * ROSTER[g.kind].speed * tierSpeed(g)
  switch (g.kind) {
    case 'glitch':
    case 'bug':
      return homeAndCling(w, g, speed)
    case 'brute':
      return brute(w, g, speed)
    case 'popup':
      return popup(w, g, speed)
    case 'imp':
      return imp(w, g, speed)
    case 'pickpocket':
      return pickpocket(w, g, speed)
    case 'leech':
      return leech(w, g, speed)
    case 'spill':
      return spill(w, g)
    case 'mimic':
      return mimic(w, g, speed)
    case 'worm':
      return worm(w, g, speed)
    case 'bluescreen':
      return bluescreen(w, g, speed)
    case 'blinker':
      return homeAndCling(w, g, speed)
    case 'wizard':
      return wizard(w, g)
    case 'cursor':
      return cursor(w, g, speed)
  }
}

/** The plain glitch and the swarm's bugs: home in, cling on and drain. */
function homeAndCling(w: GlitchWorld, g: Glitch, speed: number) {
  const p = w.prey(g)
  if (!p) return
  const { dx, dy, d } = towards(g, p)
  const bug = g.kind === 'bug'
  if (d < (bug ? 7 : 9)) {
    if (--g.cling <= 0) {
      g.cling = bug ? BUG_CLING_TICKS : CLING_TICKS
      w.drain(p, bug ? Math.max(1, Math.round(w.bite / 3)) : w.bite)
      w.play('warn')
    }
    return
  }
  const jitter = Math.sin(w.tick / (bug ? 4 : 9) + g.wobble) * (bug ? 0.9 : 0.3)
  w.move(g, (dx / d) * speed + jitter, (dy / d) * speed - jitter)
}

/** The static brute plods up, stomps (its tell), and shoves a bot back a tile. */
function brute(w: GlitchWorld, g: Glitch, speed: number) {
  const p = w.prey(g)
  if (g.state === 'windup') {
    if (--g.t > 0) return
    g.state = 'rest'
    g.t = 50
    if (!p) return
    const { d, ux, uy } = towards(g, p)
    if (d < 22) {
      w.shove(p, ux, uy)
      w.drain(p, 6 + w.bite)
      w.play('boom')
    }
    return
  }
  if (g.state === 'rest') {
    if (--g.t <= 0) g.state = 'walk'
    return
  }
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < 16) {
    g.state = 'windup'
    g.t = g.tier === 3 ? BRUTE_TELL - 6 : BRUTE_TELL
    w.tell(g)
    return
  }
  w.move(g, ux * speed, uy * speed)
}

/** The pop-up stays back and lobs packets over the racks; up close it can only shuffle away. */
function popup(w: GlitchWorld, g: Glitch, speed: number) {
  const p = w.nearest(g)
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < POPUP_NEAR) {
    // Too close to lob: it backs off, and its wind-up starts over.
    g.t = Math.max(g.t, POPUP_TELL + 20)
    w.move(g, -ux * speed, -uy * speed)
    return
  }
  if (d > POPUP_FAR) {
    w.move(g, ux * speed, uy * speed)
    return
  }
  g.t--
  if (g.t === POPUP_TELL) w.tell(g)
  if (g.t > 0) return
  g.t = 150 - 20 * (g.tier - 1)
  w.lob(g, p.x, p.y)
}

/** The firewall imp lines up on a row or a column, breathes in, and fires straight along it. */
function imp(w: GlitchWorld, g: Glitch, speed: number) {
  if (g.state === 'inhale') {
    if (--g.t > 0) return
    g.state = 'walk'
    g.t = 80 - 10 * (g.tier - 1)
    w.bolt(g, g.vx, g.vy)
    return
  }
  if (g.t > 0) g.t--
  const p = w.prey(g)
  if (!p) return
  const { dx, dy, d } = towards(g, p)
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const lined = ax < 6 || ay < 6
  if (lined && d < 16 * 9 && g.t <= 0 && w.clear(g.x, g.y, p.x, p.y)) {
    g.state = 'inhale'
    g.t = IMP_TELL
    g.vx = ax < 6 ? 0 : Math.sign(dx)
    g.vy = ax < 6 ? Math.sign(dy) : 0
    w.tell(g)
    return
  }
  // Close the smaller gap to line up, backing off along the larger when too near.
  const back = d < 40 ? -1 : 0
  if (ax < ay) w.move(g, Math.sign(dx) * speed, back * Math.sign(dy) * speed)
  else w.move(g, back * Math.sign(dx) * speed, Math.sign(dy) * speed)
}

/** The pickpocket grabs a key or a pulse and runs for the stairs with it. */
function pickpocket(w: GlitchWorld, g: Glitch, speed: number) {
  if (g.loot) {
    if (w.atStairs(g)) {
      w.escape(g)
      return
    }
    const step = w.toStairs(g)
    if (step) {
      w.move(g, step.x * speed * 1.1, step.y * speed * 1.1)
      return
    }
    flee(w, g, speed)
    return
  }
  const p = w.prey(g)
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < 9) {
    w.steal(g, p)
    return
  }
  w.move(g, ux * speed, uy * speed)
}

/** Away from the nearest bot. */
function flee(w: GlitchWorld, g: Glitch, speed: number) {
  const p = w.nearest(g)
  if (!p) return
  const { ux, uy } = towards(g, p)
  if (!w.move(g, -ux * speed, -uy * speed)) {
    // Cornered: slip sideways along the wall.
    w.move(g, -uy * speed, ux * speed)
  }
}

/** The leech takes charge and runs; it digests the charge if nobody sparks it in time. */
function leech(w: GlitchWorld, g: Glitch, speed: number) {
  if (g.loot) {
    flee(w, g, speed * 1.2)
    if (--g.t <= 0) w.digest(g)
    return
  }
  if (g.cling > 0) g.cling--
  const p = w.prey(g)
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < 9 && g.cling <= 0) {
    w.steal(g, p)
    g.t = 8 * 60
    return
  }
  w.move(g, ux * speed, uy * speed)
}

const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const

/** A coffee spill slides along the corridors and soaks any bot in it; a pulse dries it out. */
function spill(w: GlitchWorld, g: Glitch) {
  if (g.state === 'dry') {
    if (--g.t <= 0) g.state = 'walk'
    return
  }
  if (g.vx === 0 && g.vy === 0) g.vx = 1
  const s = w.speed * ROSTER.spill.speed
  if (!w.move(g, g.vx * s, g.vy * s)) {
    const open = DIRS.filter(
      ([dx, dy]) =>
        !(dx === -g.vx && dy === -g.vy) &&
        !(dx === g.vx && dy === g.vy) &&
        w.open(g.x + dx * 10, g.y + dy * 10),
    )
    const pick = open.length
      ? open[Math.floor(w.rng() * open.length)]!
      : ([-g.vx, -g.vy] as const)
    g.vx = pick[0]
    g.vy = pick[1]
  }
  if (w.tick % 8 !== 0) return
  const p = w.nearest(g)
  if (p && Math.hypot(p.x - g.x, p.y - g.y) < 11) w.drain(p, 2)
}

/** A mimic sits among the snacks, blinking now and then; it bites whoever reaches for it. */
function mimic(w: GlitchWorld, g: Glitch, speed: number) {
  if (g.cling > 0) g.cling--
  const p = w.nearest(g)
  if (g.state === 'still') {
    if (--g.t <= 0) g.t = 110 + Math.floor(w.rng() * 120)
    if (p && Math.hypot(p.x - g.x, p.y - g.y) < 12) {
      g.state = 'awake'
      g.t = 180
      g.seen = true
      g.cling = 30
      w.drain(p, 28)
      w.tell(g)
      w.play('warn')
      const { ux, uy } = towards(g, p)
      w.move(g, -ux * 8, -uy * 8)
    }
    return
  }
  if (--g.t <= 0) {
    g.state = 'still'
    g.t = 90
    return
  }
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < 9 && g.cling <= 0) {
    g.cling = 40
    w.drain(p, 12)
    w.play('warn')
    return
  }
  w.move(g, ux * speed, uy * speed)
}

/** The worm's head homes and bites; its segments follow the head's trail at a fixed gap. */
function worm(w: GlitchWorld, g: Glitch, speed: number) {
  homeAndCling(w, g, speed)
  let lead = { x: g.x, y: g.y }
  for (const seg of g.body ?? []) {
    const dx = seg.x - lead.x
    const dy = seg.y - lead.y
    const d = Math.hypot(dx, dy)
    if (d > WORM_GAP) {
      seg.x = lead.x + (dx / d) * WORM_GAP
      seg.y = lead.y + (dy / d) * WORM_GAP
    }
    lead = seg
  }
}

/**
 * The Big Bluescreen lumbers after the bots; in reach it fills with blue (its tell), breathes a cone
 * of static the way it faced, then rests.
 */
function bluescreen(w: GlitchWorld, g: Glitch, speed: number) {
  if (g.state === 'windup') {
    if (--g.t > 0) return
    g.state = 'inhale'
    g.t = BLUE_BREATH
    return
  }
  if (g.state === 'inhale') {
    w.breathe(g, g.vx, g.vy)
    if (--g.t > 0) return
    g.state = 'rest'
    g.t = 70
    return
  }
  if (g.state === 'rest') {
    if (--g.t <= 0) g.state = 'walk'
    return
  }
  const p = w.prey(g)
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < BLUE_REACH - 20 && w.clear(g.x, g.y, p.x, p.y)) {
    g.state = 'windup'
    g.t = BLUE_TELL
    g.vx = ux
    g.vy = uy
    w.tell(g)
    return
  }
  w.move(g, ux * speed, uy * speed)
}

/**
 * The pop-up wizard stands and fires three ways; after a couple of volleys it vanishes and sparkles
 * where it will appear next (its tell, and its weak spot: the sparkle can be sparked).
 */
function wizard(w: GlitchWorld, g: Glitch) {
  if (g.state === 'windup') {
    if (--g.t > 0) return
    g.state = 'walk'
    g.t = 24
    return
  }
  const p = w.prey(g)
  if (!p) return
  if (--g.t > 0) return
  const { d, ux, uy } = towards(g, p)
  if (g.cling >= WIZARD_VOLLEYS || d > 16 * 9) {
    // Off it goes: somewhere open in a ring round its prey.
    g.cling = 0
    for (let i = 0; i < 16; i++) {
      const a = w.rng() * Math.PI * 2
      const r = 48 + w.rng() * 48
      const x = p.x + Math.cos(a) * r
      const y = p.y + Math.sin(a) * r
      if (!w.open(x - 5, y - 5) || !w.open(x + 5, y + 5)) continue
      if (!w.open(x + 5, y - 5) || !w.open(x - 5, y + 5)) continue
      g.x = x
      g.y = y
      break
    }
    g.state = 'windup'
    g.t = WIZARD_TELL
    w.tell(g)
    return
  }
  g.cling++
  g.t = 100 - 15 * (g.tier - 1)
  if (!w.clear(g.x, g.y, p.x, p.y)) return
  const base = Math.atan2(uy, ux)
  for (const off of [-0.38, 0, 0.38])
    w.bolt(g, Math.cos(base + off), Math.sin(base + off))
  w.play('shoot')
}

/** The Sleepy Cursor drifts toward the fullest battery and drinks it fast on contact. */
function cursor(w: GlitchWorld, g: Glitch, speed: number) {
  const p = w.fullest(g)
  if (!p) return
  const { d, ux, uy } = towards(g, p)
  if (d < 10) {
    if (w.tick % 6 === 0) w.drain(p, 3)
    return
  }
  w.move(g, ux * speed, uy * speed)
}

/** A newly released glitch of this kind. */
export function newGlitch(
  kind: GlitchKind,
  x: number,
  y: number,
  tier: Tier,
  id: number,
  gen: number,
  wobble: number,
): Glitch {
  const hp = glitchHp(kind, tier)
  return {
    id,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    tier,
    cling: 0,
    wobble,
    t:
      kind === 'popup' || kind === 'wizard'
        ? 90
        : kind === 'mimic'
          ? 60 + Math.floor(wobble * 20)
          : 30,
    state: kind === 'mimic' ? 'still' : 'walk',
    loot: null,
    from: -1,
    gen,
    flash: 0,
    seen: false,
    body:
      kind === 'worm'
        ? Array.from({ length: WORM_SEGMENTS[tier - 1] ?? 5 }, (_, i) => ({
            x,
            y: y + (i + 1) * 0.5,
          }))
        : undefined,
  }
}
