// /utils/arcade/prizeShow/bosses.ts
//
// Prize Show Panic's bosses (conductor kr-arcade t-029, depth-pass/ASSESSMENT.md section 2, "The
// bosses"). Every boss is its own fight with phases and tells rather than a bag of hit points:
//
//   The Parade Float   (episode 1 mid-boss)  rolls and fires streamers; past half health its cake's
//                                            candles light and fire spark fans.
//   The Big Wobble     (episode 1 boss)      a giant inflatable. Each arm and leg is its own target:
//                                            an arm gone is a slam gone, a leg gone and it hops.
//   The Pie Cart       (episode 2 mid-boss)  a runaway trolley circling the room, lobbing pies and
//                                            leaving cream slicks; past half it speeds up, reverses
//                                            and lobs three at a time.
//   The Souffle Supreme (episode 2 boss)     rises (untouchable, raining steam) and falls (open).
//                                            Past half it splits into cupcakes that re-form if left.
//   The Mosh Mascot    (episode 3 mid-boss)  calls in a crowd and surfs on it; clear the crowd and
//                                            it falls, dizzy and open.
//   The Jumbotron      (episode 3 boss)      a wall of screens with a face that hops between them on
//                                            the beat; screens flip open into turrets. Crack the
//                                            screens to corner it.
//   The Mothership     (episode 4 mid-boss)  beams prizes up off the floor; break its tractor beam's
//                                            emitter to stun it (and drop the prize), then hit the
//                                            hull. Everything it took rains back down when it falls.
//   The Conga Dragon   (episode 4 boss)      a long parade dragon weaving in low gravity; each
//                                            segment confettied dances off, the head speeds up as it
//                                            shortens and is armoured until the tail is short.
//   The Prize Machine  (the Live Finale)     the host on a giant prize wheel: each spin lands on an
//                                            act (pies, sparks, bass, saucers, the crowd, the lights)
//                                            and the wheel shows the next one; the hub is open while
//                                            an act plays. At a third left the wheel breaks and the
//                                            host jumps down for a one-on-one dance-off.
//
// Like the roster, a boss only asks the room for what it needs (BossWorld), and draws nothing: the
// art is in bossArt.ts. Gameplay rolls come from the world's rng (the game's seeded dice).

import { RAMPS } from '../snes'
import type { ArcadeSoundName } from '../sound'
import type { Crasher, CrasherKind, ShotStyle } from './roster'
import type { BossKind, BossScript } from './season'
import { BOTTOM, CX, CY, DOORS, LEFT, RIGHT, TOP, clampX } from './stage'
import type { Point } from './stage'

export type PartRole =
  'arm' | 'leg' | 'screen' | 'cupcake' | 'emitter' | 'segment'

/** A prize on the floor, as a boss sees it (the Mothership lifts them). */
export type BossPrize = Point & { lift: number }

/** A piece of a boss with its own health: a limb, a screen, a cupcake. */
export type BossPart = {
  role: PartRole
  /** Where it is now (limbs follow the body from their offset). */
  x: number
  y: number
  /** A limb's offset from the body's centre. */
  ox: number
  oy: number
  hw: number
  hh: number
  hp: number
  maxHp: number
  gone: boolean
  vx: number
  vy: number
  /** A screen's turret: 0 shut, 1 flipping open (the tell), 2 open and firing. */
  mode: number
  clock: number
}

export type Boss = {
  kind: BossKind
  x: number
  y: number
  /** Height off the floor: a hop, a rise, a crowd-surf. */
  z: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  t: number
  flash: number
  /** 2 past `phase2At` of its health: the boss changes its act. */
  phase: 1 | 2
  phase2At: number
  /** Ticks left of a phase change (it shrugs off confetti meanwhile). */
  shift: number
  finale: boolean
  /** Its current move (per kind), and ticks left in it. */
  mode: number
  clock: number
  parts: BossPart[]
  /** The Jumbotron's face screen, and the screen it hops to next (-1 none yet). */
  face: number
  next: number
  /** Where the attack being told will land (the Wobble's slam, the hop's landing). */
  aimX: number
  aimY: number
  /** Where a hop took off from. */
  fromX: number
  fromY: number
  /** Ticks until the next attack, and ticks left of the one being told (0 none). */
  atk: number
  tell: number
  /** The Wobble's slamming arm (a part index), and ticks its stretched arm stays down. */
  arm: number
  slam: number
  /** The Pie Cart's angle round its loop, and which way it goes. */
  angle: number
  dir: 1 | -1
  /** The Souffle's falling steam: a shadow, then a ring where it lands. */
  drops: Array<{ x: number; y: number; t: number }>
  /** Health each cupcake carries while the Souffle is split. */
  share: number
  /** The Mosh Mascot's crowd, and how many times it has rallied one. */
  crew: Crasher[]
  rallies: number
  /** The Jumbotron has said it is cornered. */
  cornered: boolean
  /** The Mothership's tractor beam: the prize in it, and how many it has taken aboard. */
  prize: BossPrize | null
  hold: number
  /** The Conga Dragon's path: where its head has been, newest first. */
  trail: Point[]
  /** The Prize Machine's dance move in the duel (an index into DANCE_MOVES). */
  move: number
}

/** What a boss may ask of the room (the game supplies it). */
export interface BossWorld {
  rng(): number
  player(): Point
  /** Ticks per beat in this room (the Jumbotron hops on it). */
  beat(): number
  /** The loop's crowd factor (more hands in the Mosh Mascot's crowd later on). */
  crowdScale(): number
  fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    style: ShotStyle,
  ): void
  lobPie(x: number, y: number, tx: number, ty: number, ticks: number): void
  slick(x: number, y: number): void
  /** A shockwave ring spreading from (x, y) to `max`, with a gap at `gap` radians (null: none). */
  ring(
    x: number,
    y: number,
    max: number,
    speed: number,
    gap: number | null,
  ): void
  spawn(kind: CrasherKind, x: number, y: number): Crasher
  crowd(): readonly Crasher[]
  /** Hurt Sparkle if she is within `r` (a box) of (x, y). */
  hurt(x: number, y: number, r: number, why: string): void
  announce(text: string, sub: string): void
  puff(x: number, y: number, colour: string, count: number): void
  play(sound: ArcadeSoundName): void
  /** Prizes on the floor (the Mothership beams them up). */
  prizes(): readonly BossPrize[]
  /** A prize beamed all the way up: gone from the floor. */
  takePrize(p: BossPrize): void
  /** A prize dropped onto the floor at (x, y). */
  dropPrize(x: number, y: number): void
  /** A popped dragon segment dances off the set. */
  dance(x: number, y: number): void
}

/** What a shot can strike: a part (by index) or the body (-1). Shut targets soak shots up. */
export type BossTarget = {
  x: number
  y: number
  hw: number
  hh: number
  part: number
  open: boolean
}

/** Tells and timings, shared with the art and the tests. */
export const BOSS = {
  float: {
    volley: [70, 110],
    candleEvery: 90,
    candleCharge: 34,
    phaseShift: 50,
    drop: [240, 300],
  },
  wobble: {
    y: TOP + 58,
    /** A slam: the arm rises over its spot for `tell` ticks, then comes down. */
    slamEvery: [150, 110],
    slamTell: 50,
    slamReach: 16,
    slamShow: 14,
    hopEvery: [110, 85],
    hopTicks: 40,
    volleyEvery: [120, 90],
    /** Share of the boss's health in each limb. */
    limbShare: 0.1,
  },
  piecart: {
    rx: 112,
    ry: 64,
    speed: [0.011, 0.016],
    pieEvery: [90, 64],
    pieFlight: 46,
    slickEvery: 26,
    reverseEvery: 420,
  },
  souffle: {
    peak: 46,
    rise: 50,
    aloft: 210,
    fall: 16,
    open: 160,
    rainEvery: [42, 28],
    rainTell: 40,
    cupcakes: 8,
    cupcakeHp: 3,
    scatter: 540,
    reform: 60,
  },
  mosh: {
    rally: 80,
    crew: 5,
    crewMax: 10,
    surfZ: 14,
    fall: 18,
    down: 220,
    throwEvery: [130, 95],
  },
  jumbotron: {
    cols: 3,
    rows: 2,
    w: 52,
    h: 28,
    gapX: 8,
    gapY: 6,
    screenHp: 8,
    /** The face hops every so many beats; the screen it is going to flickers first. */
    hopBeats: [2, 1],
    hopTell: 16,
    turretBeats: 4,
    flip: 20,
    fireBeats: 2,
  },
  mothership: {
    y: TOP + 32,
    drift: 70,
    /** Its beam warms over a prize, then lifts it this far a tick (faster past half). */
    beamTell: 30,
    lift: [1 / 220, 1 / 150],
    stun: 200,
    emitterHp: 6,
    volley: [150, 100],
    /** Ticks between the saucer cams it launches. */
    launch: 420,
    /** With nothing on the floor to take, the sponsor restocks after this long. */
    restock: 150,
  },
  dragon: {
    segments: 10,
    segmentHp: 3,
    /** Steps of the head's trail between segments. */
    spacing: 11,
    speed: 0.85,
    /** Faster for each segment it has lost. */
    speedUp: 0.07,
    accel: 0.035,
    breath: [150, 100],
    /** The head is armoured while it has more segments than this. */
    armour: 3,
  },
  machine: {
    y: TOP + 52,
    r: 34,
    spin: 100,
    act: 330,
    /** The beams act: they warm this long before they burn. */
    beamWarm: 40,
    beamHalf: 5,
    /** The wheel cracks and the host jumps down. */
    breakTicks: 70,
    moveTell: 40,
    dashSpeed: 3.6,
    hopTicks: 30,
  },
} as const

/** The Prize Machine's wheel: the act each segment lands on. */
export const MACHINE_ACTS = [
  'pies',
  'sparks',
  'bass',
  'saucers',
  'crowd',
  'lights',
] as const
export type MachineAct = (typeof MACHINE_ACTS)[number]

/** What the host announces as each act lands. */
export const ACT_TITLES: Record<MachineAct, string> = {
  pies: 'PIE TIME!',
  sparks: 'SPARKLERS!',
  bass: 'DROP THE BASS!',
  saucers: 'VISITORS!',
  crowd: 'CROWD SURGE!',
  lights: 'LIGHTS, PLEASE!',
}

/** The host's moves in the dance-off. */
export const DANCE_MOVES = ['spin', 'slide', 'stomp'] as const

/**
 * How fast a boss's shockwave spreads: always slower than Sparkle walks (prizeShow/stage.ts SPEED),
 * so moving away from a slam or a landing as it is told always gets her clear.
 */
export const SHOCK_SPEED = 1.15

/** What the host's banner says when each boss goes down. */
export const BOSS_OUTRO: Record<BossKind, string> = {
  float: 'BEST FLOAT EVER!',
  wobble: 'ALL DEFLATED!',
  piecart: 'ORDER UP!',
  souffle: 'IT FELL FLAT!',
  mosh: 'THE CROWD GOES WILD!',
  jumbotron: 'SCREEN TIME OVER!',
  mothership: 'PRIZES RETURNED!',
  dragon: 'THE PARADE IS OVER!',
  machine: 'WHAT A SHOW!',
}

const phaseOf = <T>(b: Boss, pair: readonly [T, T]): T =>
  b.phase === 1 ? pair[0] : pair[1]

function part(
  role: PartRole,
  x: number,
  y: number,
  hw: number,
  hh: number,
  hp: number,
): BossPart {
  return {
    role,
    x,
    y,
    ox: x,
    oy: y,
    hw,
    hh,
    hp,
    maxHp: hp,
    gone: false,
    vx: 0,
    vy: 0,
    mode: 0,
    clock: 0,
  }
}

/** Where each Jumbotron screen hangs on the top wall, by index (row by row). */
export function screenSpot(i: number): Point {
  const j = BOSS.jumbotron
  const col = i % j.cols
  const row = Math.floor(i / j.cols)
  return {
    x: CX + (col - (j.cols - 1) / 2) * (j.w + j.gapX),
    y: TOP + 6 + j.h / 2 + row * (j.h + j.gapY),
  }
}

/** A boss as its script brings it on, its health scaled for the loop. */
export function newBoss(
  script: BossScript,
  scale: number,
  finale: boolean,
): Boss {
  const hp = Math.round(script.hp * scale)
  const b: Boss = {
    kind: script.kind,
    x: CX,
    y: TOP + 40,
    z: 0,
    vx: 0.8,
    vy: 0,
    hp,
    maxHp: hp,
    t: 0,
    flash: 0,
    phase: 1,
    phase2At: script.phase2At,
    shift: 0,
    finale,
    mode: 0,
    clock: 0,
    parts: [],
    face: 1,
    next: -1,
    aimX: CX,
    aimY: CY,
    fromX: CX,
    fromY: CY,
    atk: 90,
    tell: 0,
    arm: 0,
    slam: 0,
    angle: -Math.PI / 2,
    dir: 1,
    drops: [],
    share: 0,
    crew: [],
    rallies: 0,
    cornered: false,
    prize: null,
    hold: 0,
    trail: [],
    move: 0,
  }
  switch (script.kind) {
    case 'wobble': {
      b.y = BOSS.wobble.y
      b.vx = 0.5
      const limb = Math.max(2, Math.round(hp * BOSS.wobble.limbShare))
      b.parts = [
        part('arm', -31, -6, 9, 13, limb),
        part('arm', 31, -6, 9, 13, limb),
        part('leg', -13, 31, 8, 10, limb),
        part('leg', 13, 31, 8, 10, limb),
      ]
      placeLimbs(b)
      break
    }
    case 'piecart':
      b.x = CX + Math.cos(b.angle) * BOSS.piecart.rx
      b.y = CY + Math.sin(b.angle) * BOSS.piecart.ry
      break
    case 'souffle':
      b.y = CY - 20
      b.mode = 3
      b.clock = 90
      break
    case 'mosh':
      b.y = TOP + 50
      b.mode = 0
      b.clock = BOSS.mosh.rally
      break
    case 'mothership': {
      const m = BOSS.mothership
      b.y = m.y
      const hp = Math.max(2, Math.round(m.emitterHp * Math.sqrt(scale)))
      b.parts = [part('emitter', b.x, b.y + 17, 8, 6, hp)]
      b.clock = 60
      break
    }
    case 'dragon': {
      const d = BOSS.dragon
      const segHp = Math.max(2, Math.round(d.segmentHp * Math.sqrt(scale)))
      b.x = CX
      b.y = TOP + 40
      b.vx = 0.6
      b.vy = 0.3
      for (let i = 0; i < d.segments; i++) {
        const seg = part('segment', b.x, b.y - (i + 1) * 6, 7, 6, segHp)
        b.parts.push(seg)
      }
      // The body's hits are in the segments; the head keeps the rest (and never less than 20).
      b.maxHp = b.hp = Math.max(hp, d.segments * segHp + 20)
      b.clock = 60
      break
    }
    case 'machine': {
      b.y = BOSS.machine.y
      b.mode = 0
      b.clock = BOSS.machine.spin
      b.face = -1
      b.next = 0
      break
    }
    case 'jumbotron': {
      const j = BOSS.jumbotron
      const screenHp = Math.max(2, Math.round(j.screenHp * Math.sqrt(scale)))
      for (let i = 0; i < j.cols * j.rows; i++) {
        const at = screenSpot(i)
        b.parts.push(part('screen', at.x, at.y, j.w / 2, j.h / 2, screenHp))
      }
      b.face = 1
      const at = screenSpot(b.face)
      b.x = at.x
      b.y = at.y
      break
    }
  }
  return b
}

function placeLimbs(b: Boss) {
  const sway = Math.sin(b.t / 14) * 2
  for (const p of b.parts) {
    p.x = b.x + p.ox + (p.role === 'arm' ? sway * Math.sign(p.ox) : 0)
    p.y = b.y - b.z + p.oy
  }
}

/** The parts still on the boss. */
export function liveParts(b: Boss, role?: PartRole): BossPart[] {
  return b.parts.filter((p) => !p.gone && (!role || p.role === role))
}

/** Everything a shot could strike right now, parts first. */
export function bossTargets(b: Boss): BossTarget[] {
  const out: BossTarget[] = []
  const open = b.shift === 0
  b.parts.forEach((p, i) => {
    if (p.gone) return
    if (b.kind === 'jumbotron' && i === b.face) return
    out.push({ x: p.x, y: p.y, hw: p.hw, hh: p.hh, part: i, open })
  })
  switch (b.kind) {
    case 'float':
      out.push({ x: b.x, y: b.y, hw: 40, hh: 18, part: -1, open })
      break
    case 'wobble':
      out.push({ x: b.x, y: b.y - b.z, hw: 18, hh: 23, part: -1, open })
      break
    case 'piecart':
      out.push({ x: b.x, y: b.y, hw: 20, hh: 12, part: -1, open })
      break
    case 'souffle':
      // Up in the air or on its way down, the crust is too hot to dent: open only once it lands.
      if (b.mode <= 3)
        out.push({
          x: b.x,
          y: b.y - b.z,
          hw: 23,
          hh: 20,
          part: -1,
          open: b.mode === 3,
        })
      break
    case 'mosh':
      // Surfing (or falling) it is over everyone's heads: confetti goes into the crowd under it.
      if (b.mode === 0 || b.mode === 3)
        out.push({ x: b.x, y: b.y, hw: 16, hh: 20, part: -1, open: true })
      break
    case 'mothership':
      // The hull only opens up while the beam is broken and the ship is stunned.
      out.push({ x: b.x, y: b.y, hw: 44, hh: 12, part: -1, open: b.mode === 2 })
      break
    case 'dragon':
      out.push({
        x: b.x,
        y: b.y,
        hw: 11,
        hh: 9,
        part: -1,
        open: liveParts(b, 'segment').length <= BOSS.dragon.armour,
      })
      break
    case 'machine':
      if (b.mode <= 2)
        out.push({
          x: b.x,
          y: b.y,
          hw: 18,
          hh: 18,
          part: -1,
          open: b.mode === 1,
        })
      else
        out.push({
          x: b.x,
          y: b.y - b.z - 4,
          hw: 9,
          hh: 12,
          part: -1,
          open: b.z < 4,
        })
      break
    case 'jumbotron': {
      const at = screenSpot(b.face)
      out.push({
        x: at.x,
        y: at.y,
        hw: BOSS.jumbotron.w / 2,
        hh: BOSS.jumbotron.h / 2,
        part: -1,
        open: true,
      })
      break
    }
  }
  return out
}

/** The first target at (x, y), widened by `pad`. */
export function bossTargetAt(
  b: Boss,
  x: number,
  y: number,
  pad = 0,
): BossTarget | null {
  for (const t of bossTargets(b))
    if (Math.abs(t.x - x) < t.hw + pad && Math.abs(t.y - y) < t.hh + pad)
      return t
  return null
}

/**
 * Confetti lands on a target. Returns what happened worth a callout ('ARM POPPED!' and the like),
 * or null. The body takes the damage off the boss's health; a limb takes it off both; a screen
 * only off itself; a cupcake takes its share of the split Souffle with it.
 */
export function damageBoss(
  b: Boss,
  target: BossTarget,
  damage: number,
  w: BossWorld,
): string | null {
  if (!target.open || b.shift > 0) return null
  b.flash = 4
  let callout: string | null = null
  if (target.part >= 0) {
    const p = b.parts[target.part]!
    p.hp -= damage
    if (p.role === 'arm' || p.role === 'leg' || p.role === 'segment')
      b.hp -= damage
    if (p.hp <= 0) {
      p.gone = true
      w.puff(p.x, p.y, RAMPS.pink[3], 10)
      w.play('pop')
      if (p.role === 'arm') {
        callout = 'ARM POPPED!'
        if (b.arm === target.part) b.tell = 0
        w.announce(
          'ARM POPPED!',
          liveParts(b, 'arm').length ? 'ONE SLAM LEFT' : 'NO MORE SLAMS',
        )
      } else if (p.role === 'leg') {
        callout = 'LEG POPPED!'
        w.announce('LEG POPPED!', 'NOW IT HOPS')
        if (b.mode !== 1) b.clock = Math.min(b.clock, 30)
      } else if (p.role === 'screen') {
        callout = 'SCREEN CRACKED!'
      } else if (p.role === 'emitter') {
        callout = 'BEAM BROKEN!'
        stunShip(b, w)
      } else if (p.role === 'segment') {
        callout = 'DANCE BREAK!'
        w.dance(p.x, p.y)
      } else {
        callout = 'CUPCAKE!'
        b.hp = liveParts(b, 'cupcake').length * b.share
      }
    }
  } else {
    const cornered = b.kind === 'jumbotron' && b.cornered
    b.hp -= cornered ? damage * 2 : damage
  }
  if (b.phase === 1 && b.hp > 0 && b.hp <= Math.ceil(b.maxHp * b.phase2At))
    enterPhase2(b, w)
  return callout
}

function enterPhase2(b: Boss, w: BossWorld) {
  b.phase = 2
  switch (b.kind) {
    case 'float':
      // The cake's candles light, and the float speeds up.
      b.shift = BOSS.float.phaseShift
      b.t = 0
      b.vx = Math.sign(b.vx || 1) * 1.15
      w.announce('CANDLES LIT!', 'DODGE THE SPARKS')
      w.play('warn')
      break
    case 'wobble':
      b.shift = 40
      b.vx = Math.sign(b.vx || 1) * 0.8
      w.announce("IT'S LOSING AIR!", "POP WHAT'S LEFT")
      w.play('warn')
      break
    case 'piecart':
      b.shift = 40
      w.announce('THE WHEELS CAME LOOSE!', 'THREE PIES AT A TIME')
      w.play('warn')
      break
    case 'souffle':
      // It splits the moment it is open past half (or at the end of its next landing).
      if (b.mode === 3) split(b, w)
      break
    case 'mosh':
      w.announce('IT WANTS A BIGGER CROWD!', 'CLEAR THEM FASTER')
      break
    case 'jumbotron':
      w.announce('DOUBLE TIME!', 'IT HOPS ON EVERY BEAT')
      w.play('warn')
      break
    case 'mothership':
      w.announce('FULL POWER BEAM!', 'IT LIFTS FASTER NOW')
      w.play('warn')
      break
    case 'dragon':
      w.announce('IT WANTS TO DANCE FASTER!', 'KEEP THE CONFETTI COMING')
      break
    case 'machine':
      // The wheel cracks: the host jumps down for the dance-off.
      b.mode = 2
      b.clock = BOSS.machine.breakTicks
      b.fromX = b.x
      b.fromY = b.y
      w.announce('THE WHEEL BROKE!', 'THE HOST WANTS A DANCE-OFF')
      w.play('warn')
      break
  }
}

// --- behaviours --------------------------------------------------------------------------------

/** Ticks until the float's candles fire (they flare for candleCharge ticks first). */
export function candleClock(b: Boss): number {
  const every = BOSS.float.candleEvery
  return (every - (b.t % every)) % every
}

function aimAt(b: Point, p: Point): number {
  return Math.atan2(p.y - b.y, p.x - b.x)
}

function updateFloat(b: Boss, w: BossWorld) {
  if (b.shift > 0) {
    // The candles catching: the float rocks in place and shrugs off confetti.
    b.shift--
    if (b.shift % 6 === 0)
      w.puff(b.x + (w.rng() - 0.5) * 40, b.y - 26, RAMPS.gold[3], 3)
    w.hurt(b.x, b.y, 30, 'RUN OVER BY A FLOAT!')
    return
  }
  b.x += b.vx
  if (b.x < LEFT + 50 || b.x > RIGHT - 50) b.vx = -b.vx
  const p = w.player()
  if (b.t % phaseOf(b, BOSS.float.volley) === 0) {
    const a = aimAt({ x: b.x, y: b.y + 14 }, p)
    for (const off of [-0.35, 0, 0.35])
      w.fire(b.x, b.y + 14, a + off, 2, 'streamer')
    w.play('blip')
  }
  if (b.phase === 2 && candleClock(b) === 0) {
    // Each candle fires a spark in a fan aimed at Sparkle.
    for (let i = 0; i < 4; i++) {
      const cx = b.x - 14 + i * 10
      const cy = b.y - 30
      w.fire(
        cx,
        cy,
        aimAt({ x: cx, y: cy }, p) + (i - 1.5) * 0.24,
        1.9,
        'spark',
      )
    }
    w.play('shoot')
  }
  if (b.t % phaseOf(b, BOSS.float.drop) === 0 && w.crowd().length < 8) {
    w.spawn('grabber', b.x - 20, b.y + 20)
    w.spawn('grabber', b.x + 20, b.y + 20)
  }
  w.hurt(b.x, b.y, 30, 'RUN OVER BY A FLOAT!')
}

function updateWobble(b: Boss, w: BossWorld) {
  const cfg = BOSS.wobble
  const p = w.player()
  const legs = liveParts(b, 'leg').length
  const arms = liveParts(b, 'arm')
  if (b.slam > 0) b.slam--
  if (b.shift > 0) {
    // Hissing air: it shudders in place.
    b.shift--
    if (b.shift % 5 === 0)
      w.puff(b.x + (w.rng() - 0.5) * 30, b.y - 20, RAMPS.cream[4], 2)
    placeLimbs(b)
    return
  }
  if (legs === 2) {
    // Both feet down: it waddles from side to side.
    b.x += b.vx
    if (b.x < LEFT + 60 || b.x > RIGHT - 60) b.vx = -b.vx
  } else if (b.mode === 1) {
    // In the air: an arc to where Sparkle was, and a shockwave where it lands.
    const k = 1 - b.clock / cfg.hopTicks
    b.x = b.fromX + (b.aimX - b.fromX) * k
    b.y = b.fromY + (b.aimY - b.fromY) * k
    b.z = Math.sin(k * Math.PI) * 30
    if (--b.clock <= 0) {
      b.z = 0
      b.mode = 0
      b.clock = cfg.hopEvery[legs === 0 ? 1 : 0]
      w.ring(b.x, b.y + 38, 36, SHOCK_SPEED, null)
      w.hurt(b.x, b.y + 30, 26, 'SQUASHED BY THE WOBBLE!')
      w.play('boom')
    }
  } else if (--b.clock <= 0) {
    // A leg gone: it hops instead of walking (the shadow shows where).
    b.mode = 1
    b.clock = cfg.hopTicks
    b.fromX = b.x
    b.fromY = b.y
    b.aimX = clampX(p.x, 60)
    b.aimY = Math.max(TOP + 50, Math.min(CY + 10, p.y - 40))
  }
  // Slams: an arm rises over Sparkle's spot, then comes down there.
  if (b.tell > 0) {
    if (--b.tell === 0) {
      b.slam = cfg.slamShow
      w.ring(b.aimX, b.aimY, 48, SHOCK_SPEED, null)
      w.hurt(b.aimX, b.aimY, cfg.slamReach, 'SLAMMED BY THE WOBBLE!')
      w.puff(b.aimX, b.aimY, RAMPS.cream[4], 6)
      w.play('boom')
    }
  } else if (arms.length && b.mode === 0 && --b.atk <= 0) {
    const order = b.parts
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.role === 'arm' && !q.gone)
    const next = order.find(({ i }) => i !== b.arm) ?? order[0]!
    b.arm = next.i
    b.tell = cfg.slamTell
    b.aimX = p.x
    b.aimY = p.y
    b.atk = phaseOf(b, cfg.slamEvery)
  }
  // Its mouth puffs bubbles; with no arms left it has nothing else to do.
  if (b.t % phaseOf(b, cfg.volleyEvery) === 0) {
    const fan = arms.length ? [-0.3, 0, 0.3] : [-0.6, -0.3, 0, 0.3, 0.6]
    const a = aimAt({ x: b.x, y: b.y - b.z - 10 }, p)
    for (const off of fan) w.fire(b.x, b.y - b.z - 10, a + off, 1.5, 'bubble')
    w.play('blip')
  }
  placeLimbs(b)
  if (b.z < 6) {
    w.hurt(b.x, b.y, 22, 'BOUNCED BY THE WOBBLE!')
    for (const leg of liveParts(b, 'leg'))
      w.hurt(leg.x, leg.y, 10, 'STEPPED ON!')
  }
}

function updatePieCart(b: Boss, w: BossWorld) {
  const cfg = BOSS.piecart
  if (b.shift > 0) {
    // A wheel pops off: it spins in place.
    b.shift--
    if (b.shift % 4 === 0) w.puff(b.x, b.y + 6, RAMPS.cream[4], 2)
    w.hurt(b.x, b.y, 18, 'RUN OVER BY THE PIE CART!')
    return
  }
  if (b.phase === 2 && b.t % cfg.reverseEvery === 0)
    b.dir = b.dir === 1 ? -1 : 1
  b.angle += phaseOf(b, cfg.speed) * b.dir
  const nx = CX + Math.cos(b.angle) * cfg.rx
  const ny = CY + Math.sin(b.angle) * cfg.ry
  b.vx = nx - b.x
  b.vy = ny - b.y
  b.x = nx
  b.y = ny
  if (b.t % cfg.slickEvery === 0) w.slick(b.x - b.vx * 10, b.y - b.vy * 10 + 6)
  if (b.t % phaseOf(b, cfg.pieEvery) === 0) {
    const p = w.player()
    const spread = b.phase === 1 ? [0] : [-28, 0, 28]
    const a = aimAt(b, p) + Math.PI / 2
    for (const off of spread)
      w.lobPie(
        b.x,
        b.y - 10,
        p.x + Math.cos(a) * off,
        p.y + Math.sin(a) * off,
        cfg.pieFlight,
      )
    w.play('shoot')
  }
  w.hurt(b.x, b.y, 18, 'RUN OVER BY THE PIE CART!')
}

function split(b: Boss, w: BossWorld) {
  const cfg = BOSS.souffle
  b.mode = 4
  b.clock = cfg.scatter
  b.share = Math.max(1, Math.ceil(b.hp / cfg.cupcakes))
  b.hp = b.share * cfg.cupcakes
  b.parts = []
  for (let i = 0; i < cfg.cupcakes; i++) {
    const a = (i / cfg.cupcakes) * Math.PI * 2
    const c = part('cupcake', b.x, b.y, 6, 6, cfg.cupcakeHp)
    c.vx = Math.cos(a) * 2
    c.vy = Math.sin(a) * 1.5
    b.parts.push(c)
  }
  w.announce('IT SPLIT!', 'POP EVERY CUPCAKE')
  w.puff(b.x, b.y, RAMPS.gold[4], 12)
  w.play('pop')
}

function updateSouffle(b: Boss, w: BossWorld) {
  const cfg = BOSS.souffle
  const p = w.player()
  for (const d of b.drops) {
    if (--d.t > 0) continue
    w.ring(d.x, d.y, 26, SHOCK_SPEED, null)
    w.hurt(d.x, d.y, 12, 'STEAMED!')
    w.play('pop')
  }
  b.drops = b.drops.filter((d) => d.t > 0)
  switch (b.mode) {
    case 0:
      // Rising: the crust puffs up and it lifts off the floor.
      b.z = Math.min(cfg.peak, b.z + cfg.peak / cfg.rise)
      if (--b.clock <= 0) {
        b.mode = 1
        b.clock = cfg.aloft
      }
      break
    case 1: {
      // Aloft: it drifts over Sparkle and rains steam (a shadow, then a ring).
      b.x += Math.max(-0.6, Math.min(0.6, (p.x - b.x) * 0.01))
      b.y += Math.max(-0.4, Math.min(0.4, (p.y - 30 - b.y) * 0.01))
      b.y = Math.max(TOP + 40, Math.min(CY + 10, b.y))
      b.x = clampX(b.x, 40)
      if (b.clock % phaseOf(b, cfg.rainEvery) === 0)
        b.drops.push({
          x: clampX(p.x + (w.rng() - 0.5) * 50, 14),
          y: Math.max(
            TOP + 14,
            Math.min(BOTTOM - 14, p.y + (w.rng() - 0.5) * 40),
          ),
          t: cfg.rainTell,
        })
      if (--b.clock <= 0) {
        b.mode = 2
        b.clock = cfg.fall
      }
      break
    }
    case 2:
      // Falling: a big ring where it lands.
      b.z = Math.max(0, b.z - cfg.peak / cfg.fall)
      if (--b.clock <= 0) {
        b.z = 0
        b.mode = 3
        b.clock = cfg.open
        w.ring(b.x, b.y + 16, 70, SHOCK_SPEED, null)
        w.hurt(b.x, b.y + 8, 28, 'FLATTENED BY A SOUFFLE!')
        w.play('boom')
      }
      break
    case 3:
      // Down and sagging: now it can be hit. Past half health, it splits when it is done.
      if (--b.clock <= 0) {
        if (b.phase === 2) split(b, w)
        else {
          b.mode = 0
          b.clock = cfg.rise
        }
      }
      break
    case 4: {
      // Cupcakes scatter, then hop after Sparkle.
      for (const c of liveParts(b, 'cupcake')) {
        const d = Math.hypot(p.x - c.x, p.y - c.y) || 1
        if ((b.t + c.ox) % 24 === 0) {
          c.vx += ((p.x - c.x) / d) * 1.1
          c.vy += ((p.y - c.y) / d) * 1.1
        }
        c.vx *= 0.93
        c.vy *= 0.93
        c.x = clampX(c.x + c.vx, 8)
        c.y = Math.max(TOP + 8, Math.min(BOTTOM - 8, c.y + c.vy))
        w.hurt(c.x, c.y, 7, 'FROSTED!')
      }
      if (--b.clock <= 0) {
        b.mode = 5
        b.clock = cfg.reform
        w.announce('THEY ARE GATHERING!', 'POP THEM BEFORE THEY RE-FORM')
        w.play('warn')
      }
      break
    }
    case 5: {
      // The cupcakes left drift home, and it rises again with their health.
      for (const c of liveParts(b, 'cupcake')) {
        c.x += (b.x - c.x) * 0.08
        c.y += (b.y - c.y) * 0.08
      }
      if (--b.clock <= 0) {
        b.hp = liveParts(b, 'cupcake').length * b.share
        b.parts = []
        b.mode = 0
        b.clock = cfg.rise
        w.announce('IT RE-FORMED!', 'POP THE CUPCAKES NEXT TIME')
        w.puff(b.x, b.y, RAMPS.gold[4], 10)
      }
      break
    }
  }
  if (b.mode <= 3 && b.z < 8) w.hurt(b.x, b.y, 20, 'FLATTENED BY A SOUFFLE!')
}

/** The Mosh Mascot's crowd still standing. */
export function moshCrew(
  b: Boss,
  w: { crowd(): readonly Crasher[] },
): Crasher[] {
  const crowd = w.crowd()
  return b.crew.filter((c) => crowd.includes(c))
}

function updateMosh(b: Boss, w: BossWorld) {
  const cfg = BOSS.mosh
  const p = w.player()
  switch (b.mode) {
    case 0: {
      // Rallying: it calls in a crowd through the doors, then climbs on.
      if (b.clock === cfg.rally) {
        const extra = b.phase === 2 ? 2 : 0
        const n = Math.min(
          cfg.crewMax,
          Math.round(
            (cfg.crew + b.rallies + extra) * Math.min(1.6, w.crowdScale()),
          ),
        )
        b.crew = []
        for (let i = 0; i < n; i++) {
          const door = DOORS[i % 4]!
          b.crew.push(
            w.spawn(
              'grabber',
              door.x + (w.rng() - 0.5) * 14,
              door.y + (w.rng() - 0.5) * 14,
            ),
          )
        }
        b.rallies++
        w.play('warn')
      }
      b.x += (CX - b.x) * 0.05
      b.y += (TOP + 50 - b.y) * 0.05
      b.z = 0
      if (--b.clock <= 0) b.mode = 1
      w.hurt(b.x, b.y, 16, 'BUMPED BY THE MASCOT!')
      break
    }
    case 1: {
      // Surfing: carried along over its crowd's heads, flinging streamers.
      const crew = moshCrew(b, w)
      if (crew.length <= 1) {
        b.mode = 2
        b.clock = cfg.fall
        w.announce('IT FELL!', "GET IT WHILE IT'S DOWN")
        break
      }
      const cx = crew.reduce((sum, c) => sum + c.x, 0) / crew.length
      const cy = crew.reduce((sum, c) => sum + c.y, 0) / crew.length
      b.x += (cx - b.x) * 0.06
      b.y += (cy - b.y) * 0.06
      b.z = cfg.surfZ + Math.sin(b.t / 6) * 2
      if (b.t % phaseOf(b, cfg.throwEvery) === 0) {
        const a = aimAt({ x: b.x, y: b.y - b.z }, p)
        for (const off of [-0.3, 0, 0.3])
          w.fire(b.x, b.y - b.z, a + off, 1.8, 'streamer')
        w.play('blip')
      }
      w.hurt(b.x, b.y - b.z / 2, 16, 'SQUASHED BY A CROWD-SURFER!')
      break
    }
    case 2:
      b.z = Math.max(0, b.z - cfg.surfZ / cfg.fall)
      if (--b.clock <= 0) {
        b.z = 0
        b.mode = 3
        b.clock = cfg.down
        w.ring(b.x, b.y + 8, 48, SHOCK_SPEED, null)
        w.hurt(b.x, b.y, 18, 'SQUASHED BY A CROWD-SURFER!')
        w.play('boom')
      }
      break
    case 3:
      // Dizzy on the floor: fair game. Then it gets up and calls for another crowd.
      if (--b.clock <= 0) {
        b.mode = 0
        b.clock = cfg.rally
        w.announce('IT WANTS ANOTHER CROWD!', 'GET READY')
      }
      break
  }
}

function updateJumbotron(b: Boss, w: BossWorld) {
  const cfg = BOSS.jumbotron
  const beat = Math.max(1, w.beat())
  const p = w.player()
  const live = b.parts.flatMap((q, i) => (q.gone ? [] : [i]))
  const others = live.filter((i) => i !== b.face)
  if (!others.length && !b.cornered) {
    b.cornered = true
    w.announce('CORNERED!', 'IT HAS NOWHERE LEFT TO HOP')
    w.play('warn')
  }
  // The face hops screen to screen on the beat; the screen it's going to flickers first.
  const hopEvery = phaseOf(b, cfg.hopBeats) * beat
  const until = hopEvery - (b.t % hopEvery)
  if (others.length) {
    if (until === cfg.hopTell || (b.next >= 0 && !others.includes(b.next)))
      b.next = others[Math.floor(w.rng() * others.length)]!
    if (b.t % hopEvery === 0 && b.next >= 0) {
      b.face = b.next
      b.next = -1
      w.play('blip')
    }
  } else {
    b.next = -1
  }
  const at = screenSpot(b.face)
  b.x = at.x
  b.y = at.y
  // Turrets: every few beats, screens flip open and fire on the beat.
  if (b.t % (cfg.turretBeats * beat) === 0) {
    const shut = others.filter((i) => b.parts[i]!.mode === 0)
    for (let n = b.phase === 1 ? 1 : 2; n > 0 && shut.length; n--) {
      const pick = shut.splice(Math.floor(w.rng() * shut.length), 1)[0]!
      b.parts[pick]!.mode = 1
      b.parts[pick]!.clock = cfg.flip
    }
  }
  for (const [i, s] of b.parts.entries()) {
    if (s.gone || s.mode === 0) continue
    if (i === b.face) {
      s.mode = 0
      continue
    }
    if (s.mode === 1) {
      if (--s.clock <= 0) {
        s.mode = 2
        s.clock = cfg.fireBeats * beat
      }
      continue
    }
    if (b.t % beat === 0) {
      const a = aimAt({ x: s.x, y: s.y + s.hh }, p)
      for (const off of [-0.25, 0, 0.25])
        w.fire(s.x, s.y + s.hh, a + off, 1.7, 'spark')
      w.play('shoot')
    }
    if (--s.clock <= 0) s.mode = 0
  }
  // Cornered, the face fires its own fan on every other beat.
  if (b.cornered && b.t % (beat * 2) === 0) {
    const a = aimAt({ x: b.x, y: b.y + 14 }, p)
    for (const off of [-0.5, -0.25, 0, 0.25, 0.5])
      w.fire(b.x, b.y + 14, a + off, 1.6, 'flash')
    w.play('shoot')
  }
}

// --- the Mothership ------------------------------------------------------------------------------

/** The emitter is broken: the beam drops its prize and the hull opens for a while. */
function stunShip(b: Boss, w: BossWorld) {
  if (b.prize) b.prize.lift = 0
  b.prize = null
  b.mode = 2
  b.clock = BOSS.mothership.stun
  w.announce('BEAM BROKEN!', 'NOW HIT THE HULL')
  w.play('pop')
}

function updateMothership(b: Boss, w: BossWorld) {
  const cfg = BOSS.mothership
  const p = w.player()
  const emitter = b.parts[0]!
  if (b.mode === 2) {
    // Stunned: it sags and sputters, the hull open, until its emitter is back up.
    b.y = cfg.y + 6 + Math.sin(b.t / 6)
    if (b.t % 8 === 0)
      w.puff(b.x + (w.rng() - 0.5) * 60, b.y, RAMPS.steel[3], 2)
    if (--b.clock <= 0) {
      emitter.gone = false
      emitter.hp = emitter.maxHp
      b.mode = 0
      b.clock = 60
      w.announce('BEAM BACK ONLINE!', 'BREAK IT AGAIN')
    }
  } else {
    b.y = cfg.y + Math.sin(b.t / 30) * 2
    const prizes = w.prizes()
    if (b.prize && !prizes.includes(b.prize)) {
      // Grabbed back off the floor before it went up: well caught.
      b.prize = null
      b.mode = 0
      b.clock = 40
    }
    if (b.mode === 0) {
      // Hunting: it drifts, and picks the prize nearest under it.
      b.x += (CX + Math.sin(b.t / 160) * cfg.drift - b.x) * 0.02
      if (--b.clock <= 0) {
        if (prizes.length) {
          b.prize = prizes.reduce((best, q) =>
            Math.abs(q.x - b.x) < Math.abs(best.x - b.x) ? q : best,
          )
          b.mode = 1
          b.clock = cfg.beamTell
        } else {
          // Nothing left to take: the sponsor restocks the floor.
          for (let i = 0; i < 2; i++)
            w.dropPrize(
              clampX(CX + (w.rng() - 0.5) * 200, 20),
              CY + 20 + w.rng() * 60,
            )
          b.clock = cfg.restock
        }
      }
    } else if (b.prize) {
      // The beam: it slides over the prize, warms, then lifts it.
      b.x += Math.max(-0.6, Math.min(0.6, (b.prize.x - b.x) * 0.03))
      if (b.clock > 0) b.clock--
      else b.prize.lift += phaseOf(b, cfg.lift)
      if (b.prize.lift >= 1) {
        w.takePrize(b.prize)
        w.puff(b.x, b.y + 16, RAMPS.teal[4], 8)
        w.play('pickup')
        b.hold++
        b.prize = null
        b.mode = 0
        b.clock = 60
      }
    }
  }
  emitter.x = b.x
  emitter.y = b.y + 17
  if (b.mode !== 2 && b.t % phaseOf(b, cfg.volley) === 0) {
    const a = aimAt({ x: b.x, y: b.y + 12 }, p)
    for (const off of [-0.5, -0.25, 0, 0.25, 0.5])
      w.fire(b.x, b.y + 12, a + off, 1.5, 'flash')
    w.play('shoot')
  }
  if (b.t % cfg.launch === 0 && w.crowd().length < 6) {
    w.spawn('saucer', b.x - 30, b.y + 10)
    if (b.phase === 2) w.spawn('drone', b.x + 30, b.y + 10)
  }
}

// --- the Conga Dragon ----------------------------------------------------------------------------

/** Where each segment still on the dragon is, following the head's trail. */
function placeSegments(b: Boss) {
  const spacing = BOSS.dragon.spacing
  let n = 0
  for (const seg of b.parts) {
    if (seg.gone) continue
    n++
    const at = b.trail[Math.min(b.trail.length - 1, n * spacing)] ?? b
    seg.x = at.x
    seg.y = at.y
  }
}

function updateDragon(b: Boss, w: BossWorld) {
  const cfg = BOSS.dragon
  const p = w.player()
  const segments = liveParts(b, 'segment').length
  const lost = cfg.segments - segments
  // It weaves round Sparkle on momentum (low gravity), faster the shorter it gets.
  const orbit = b.t / 70
  const tx = p.x + Math.cos(orbit) * 70
  const ty = p.y + Math.sin(orbit * 1.3) * 50
  const d = Math.hypot(tx - b.x, ty - b.y) || 1
  b.vx += ((tx - b.x) / d) * cfg.accel
  b.vy += ((ty - b.y) / d) * cfg.accel
  const top = cfg.speed * (1 + cfg.speedUp * lost)
  const v = Math.hypot(b.vx, b.vy)
  if (v > top) {
    b.vx *= top / v
    b.vy *= top / v
  }
  b.x += b.vx
  b.y += b.vy
  if (b.x < LEFT + 12 || b.x > RIGHT - 12) b.vx = -b.vx
  if (b.y < TOP + 12 || b.y > BOTTOM - 12) b.vy = -b.vy
  b.x = clampX(b.x, 12)
  b.y = Math.max(TOP + 12, Math.min(BOTTOM - 12, b.y))
  b.trail.unshift({ x: b.x, y: b.y })
  const keep = (cfg.segments + 2) * cfg.spacing
  if (b.trail.length > keep) b.trail.length = keep
  placeSegments(b)
  // It breathes a fan of sparks (telegraphed by `clock` counting down to it).
  if (--b.clock <= 0) {
    b.clock = phaseOf(b, cfg.breath)
    const a = aimAt(b, p)
    const fan = b.phase === 1 ? 5 : 7
    for (let i = 0; i < fan; i++)
      w.fire(b.x, b.y, a + (i - (fan - 1) / 2) * 0.2, 1.7, 'spark')
    w.play('shoot')
  }
  w.hurt(b.x, b.y, 11, 'SWEPT UP IN THE PARADE!')
  for (const seg of liveParts(b, 'segment'))
    w.hurt(seg.x, seg.y, 7, 'SWEPT UP IN THE PARADE!')
}

// --- the Prize Machine ----------------------------------------------------------------------------

/** The two spotlights of the Machine's lighting act, swinging from its hub. */
export function machineBeams(b: Boss): number[] {
  const swing = Math.sin(b.t / 45) * 0.95
  return [Math.PI / 2 - 0.5 + swing, Math.PI / 2 + 0.5 - swing]
}

/** Is the lighting act's beam burning yet (it warms first)? */
export function beamsHot(b: Boss): boolean {
  return b.mode === 1 && b.clock < BOSS.machine.act - BOSS.machine.beamWarm
}

function machineAct(b: Boss): MachineAct | null {
  return b.face >= 0 ? MACHINE_ACTS[b.face]! : null
}

function pickAct(b: Boss, w: BossWorld): number {
  const others = MACHINE_ACTS.map((_, i) => i).filter((i) => i !== b.face)
  return others[Math.floor(w.rng() * others.length)]!
}

function updateMachine(b: Boss, w: BossWorld) {
  const cfg = BOSS.machine
  const p = w.player()
  if (b.mode === 0) {
    // Spinning: the wheel turns fast, slows, and lands on the act it has been showing as next.
    b.angle += 0.04 + (b.clock / cfg.spin) * 0.3
    if (--b.clock <= 0) {
      b.face = b.next
      b.next = pickAct(b, w)
      b.mode = 1
      b.clock = cfg.act
      b.angle = -(b.face / MACHINE_ACTS.length) * Math.PI * 2
      const act = machineAct(b)!
      w.announce(ACT_TITLES[act], 'THE HUB IS OPEN')
      w.play('level')
      if (act === 'saucers' && w.crowd().length < 8) {
        w.spawn('saucer', LEFT + 30, TOP + 20)
        w.spawn('drone', RIGHT - 30, TOP + 20)
      }
      if (act === 'crowd' && w.crowd().length < 8)
        for (const door of [DOORS[1]!, DOORS[2]!, DOORS[3]!])
          w.spawn(door === DOORS[2] ? 'popper' : 'grabber', door.x, door.y)
    }
    return
  }
  if (b.mode === 1) {
    const act = machineAct(b)!
    const t = cfg.act - b.clock
    switch (act) {
      case 'pies':
        if (t % 45 === 20)
          for (const off of [-22, 22])
            w.lobPie(b.x, b.y + 20, p.x + off, p.y, 44)
        break
      case 'sparks':
        if (t % 60 === 30) {
          const a = aimAt(b, p)
          for (let i = 0; i < 7; i++)
            w.fire(b.x, b.y + 20, a + (i - 3) * 0.18, 1.8, 'spark')
          w.play('shoot')
        }
        break
      case 'bass':
        if (t % (w.beat() * 2) === 0) {
          const a =
            aimAt(b, p) + (Math.floor(t / (w.beat() * 2)) % 2 ? 0.7 : -0.7)
          w.ring(b.x, b.y + 10, 150, 1.25, a)
          w.play('pop')
        }
        break
      case 'saucers':
      case 'crowd':
        if (t % 90 === 45) {
          const a = aimAt(b, p)
          for (const off of [-0.3, 0, 0.3])
            w.fire(b.x, b.y + 20, a + off, 1.8, 'streamer')
        }
        break
      case 'lights':
        if (beamsHot(b))
          for (const angle of machineBeams(b)) {
            const along =
              (p.x - b.x) * Math.cos(angle) + (p.y - b.y) * Math.sin(angle)
            const off = Math.abs(
              (p.y - b.y) * Math.cos(angle) - (p.x - b.x) * Math.sin(angle),
            )
            if (along > 20 && off < cfg.beamHalf)
              w.hurt(p.x, p.y, 1, 'CAUGHT IN THE LIGHTS!')
          }
        break
    }
    b.angle += 0.004
    if (--b.clock <= 0) {
      b.mode = 0
      b.clock = cfg.spin
    }
    w.hurt(b.x, b.y, 30, 'CAUGHT IN THE WHEEL!')
    return
  }
  if (b.mode === 2) {
    // The wheel cracks and the host leaps down to the floor.
    const k = 1 - b.clock / cfg.breakTicks
    b.x = b.fromX
    b.y = b.fromY + (CY - 10 - b.fromY) * k
    b.z = Math.sin(k * Math.PI) * 40
    if (--b.clock <= 0) {
      b.z = 0
      b.mode = 3
      b.clock = cfg.moveTell
      b.move = 0
      b.tell = cfg.moveTell
      w.ring(b.x, b.y, 56, SHOCK_SPEED, null)
      w.play('boom')
    }
    return
  }
  // The dance-off: a move told, then made, then a breather.
  const move = DANCE_MOVES[b.move]!
  if (b.tell > 0) {
    b.tell--
    if (b.tell === cfg.moveTell - 1) {
      // A slide dashes through where Sparkle stands and on past her; a stomp lands on her.
      const d = Math.hypot(p.x - b.x, p.y - b.y)
      const ux = d > 1 ? (p.x - b.x) / d : 1
      const uy = d > 1 ? (p.y - b.y) / d : 0
      const past = move === 'slide' ? 40 : 0
      b.aimX = clampX(p.x + ux * past, 16)
      b.aimY = Math.max(TOP + 16, Math.min(BOTTOM - 12, p.y + uy * past))
      b.fromX = b.x
      b.fromY = b.y
    }
    if (b.tell === 0) {
      if (move === 'spin') {
        for (let i = 0; i < 12; i++)
          w.fire(
            b.x,
            b.y - 6,
            (i / 12) * Math.PI * 2 + b.t * 0.01,
            1.6,
            'spark',
          )
        w.play('shoot')
        b.clock = 50
      } else if (move === 'slide') {
        const d = Math.hypot(b.aimX - b.x, b.aimY - b.y) || 1
        b.vx = ((b.aimX - b.x) / d) * cfg.dashSpeed
        b.vy = ((b.aimY - b.y) / d) * cfg.dashSpeed
        b.clock = Math.min(60, Math.ceil(d / cfg.dashSpeed) + 6)
      } else {
        b.clock = cfg.hopTicks
      }
    }
  } else if (b.clock > 0) {
    b.clock--
    if (move === 'slide') {
      b.x = clampX(b.x + b.vx, 12)
      b.y = Math.max(TOP + 16, Math.min(BOTTOM - 12, b.y + b.vy))
    } else if (move === 'stomp') {
      const k = 1 - b.clock / cfg.hopTicks
      b.x = b.fromX + (b.aimX - b.fromX) * k
      b.y = b.fromY + (b.aimY - b.fromY) * k
      b.z = Math.sin(k * Math.PI) * 26
      if (b.clock === 0) {
        b.z = 0
        w.ring(b.x, b.y + 6, 56, SHOCK_SPEED, null)
        w.hurt(b.x, b.y, 16, 'STOMPED ON THE DANCE FLOOR!')
        w.play('boom')
      }
    }
    if (b.clock === 0) {
      // A breather between moves, then the next one.
      b.move = Math.floor(w.rng() * DANCE_MOVES.length)
      b.tell = cfg.moveTell + (b.phase === 2 ? 20 : 0)
    }
  }
  if (b.z < 4) w.hurt(b.x, b.y, 10, 'OUT-DANCED!')
}

const BEHAVIOURS: Record<BossKind, (b: Boss, w: BossWorld) => void> = {
  float: updateFloat,
  wobble: updateWobble,
  piecart: updatePieCart,
  souffle: updateSouffle,
  mosh: updateMosh,
  jumbotron: updateJumbotron,
  mothership: updateMothership,
  dragon: updateDragon,
  machine: updateMachine,
}

export function updateBoss(b: Boss, w: BossWorld) {
  b.t++
  if (b.flash > 0) b.flash--
  BEHAVIOURS[b.kind](b, w)
}

/** Where the attract pilot should not stand this tick (bodies, landing spots, slams, rain). */
export function bossDangers(
  b: Boss,
): Array<{ x: number; y: number; r: number }> {
  const out: Array<{ x: number; y: number; r: number }> = []
  switch (b.kind) {
    case 'float':
      out.push({ x: b.x, y: b.y, r: 56 })
      break
    case 'wobble':
      out.push({ x: b.x, y: b.y + 8, r: 52 })
      if (b.tell > 0) out.push({ x: b.aimX, y: b.aimY, r: 64 })
      if (b.mode === 1) out.push({ x: b.aimX, y: b.aimY + 30, r: 76 })
      break
    case 'piecart':
      out.push({ x: b.x, y: b.y, r: 40 })
      out.push({ x: b.x + b.vx * 30, y: b.y + b.vy * 30, r: 32 })
      break
    case 'souffle':
      if (b.mode <= 3) out.push({ x: b.x, y: b.y, r: b.mode === 2 ? 64 : 40 })
      for (const d of b.drops) out.push({ x: d.x, y: d.y, r: 26 })
      for (const c of liveParts(b, 'cupcake'))
        out.push({ x: c.x, y: c.y, r: 24 })
      break
    case 'mosh':
      out.push({ x: b.x, y: b.y, r: b.mode === 3 ? 0 : 44 })
      break
    case 'jumbotron':
    case 'mothership':
      break
    case 'dragon':
      out.push({ x: b.x, y: b.y, r: 40 })
      for (const seg of liveParts(b, 'segment'))
        out.push({ x: seg.x, y: seg.y, r: 22 })
      break
    case 'machine':
      if (b.mode <= 2) {
        out.push({ x: b.x, y: b.y, r: 50 })
        if (machineAct(b) === 'lights' && b.mode === 1) {
          // Off the beams' lines.
          for (const angle of machineBeams(b))
            for (let d = 30; d < 220; d += 30)
              out.push({
                x: b.x + Math.cos(angle) * d,
                y: b.y + Math.sin(angle) * d,
                r: 18,
              })
        }
      } else {
        out.push({ x: b.x, y: b.y, r: 34 })
        const move = DANCE_MOVES[b.move]!
        if (b.tell > 0 && move === 'slide')
          for (let k = 0.25; k <= 1; k += 0.25)
            out.push({
              x: b.x + (b.aimX - b.x) * k,
              y: b.y + (b.aimY - b.y) * k,
              r: 26,
            })
        if (move === 'stomp' && (b.tell > 0 || b.clock > 0))
          out.push({ x: b.aimX, y: b.aimY, r: 60 })
      }
      break
  }
  return out
}

/** Where the attract pilot should aim: the nearest open target (the face once it is cornered). */
export function bossAim(b: Boss, from: Point): Point | null {
  const targets = bossTargets(b).filter((t) => t.open)
  if (!targets.length) return null
  if (b.kind === 'jumbotron') {
    const face = targets.find((t) => t.part === -1)
    if (face && (b.cornered || b.next === -1)) return face
  }
  targets.sort(
    (a, c) =>
      Math.hypot(a.x - from.x, a.y - from.y) -
      Math.hypot(c.x - from.x, c.y - from.y),
  )
  return targets[0]!
}
