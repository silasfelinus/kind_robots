// /utils/arcade/games/kindnessGauntlet.ts
//
// Kindness Gauntlet -- the Kind Robots Arcade's Gauntlet II riff (conductor
// kr-arcade/t-009 game factory: procedurally built floors, all four classes,
// keys with locked doors, and same-device co-op). A repair bot explores a
// glitchy old server dungeon floor by floor: wrench sparks fix the glitches
// that swarm out of broken generators, shut the generators down, free the bots
// trapped in cages, and find the stairs down.
//
// Up to four can play on one device, each picking a different bot. They share
// one screen (nobody can wander off it), one key ring and one score; each has
// a battery of their own. A bot whose battery runs flat stops where it stands
// until its partner rolls up and shares a charge, and a flat bot comes back
// with a little charge on the next floor. The run ends when every bot is flat.
// Bots chase the nearest partner's glitches together; generators wake for any.
//
// Four bots to choose from, after the classic's four heroes: Hugs (power: big
// sparks that hit generators twice and pass through a glitch), Fix (armor:
// clinging glitches drain the least), Sage (magic: three pulses, and each one
// jolts the generators on screen too) and Zip (speed: the fastest wheels and
// quickest sparks).
//
// From floor 2 a locked door cuts the way to the stairs. A key waits on the
// near side; keys carry over between floors, and walking into a door with one
// opens it.
//
// The battery drains all the time and faster when glitches cling on; snacks
// top it up and kindness pulses (B) fix every glitch on screen. The arrows
// move (eight ways), A throws sparks the way the bot is facing; while A is
// held the bot stands still and the arrows only turn, as in the classic.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const T = 16
const MW = 40
const MH = 30
const W = 320
const H = 240
const VIEW_Y = 16
const VIEW_H = H - VIEW_Y

const HALF = 5
const SPARK_SPEED = 4
const SPARK_LIFE = 45
const SELECT_TICKS = 60 * 15
const MAX_BATTERY = 300
const DRAIN_TICKS = 45
const CLING_TICKS = 20
const SNACK_CHARGE = 40
const GLITCH_RANGE = T * 14
const EXIT_TICKS = 120

const GLITCH_POINTS = 10
const GENERATOR_POINTS = 100
const RESCUE_POINTS = 250
const DOOR_POINTS = 100
/** walls[] values: open floor, wall, and a locked door (solid until opened). */
const OPEN = 0
const DOOR = 2
const FLOOR_POINTS = 500
/** Bots that can share a floor: one of each class. */
const MAX_PLAYERS = 4
/** Charge a partner hands over to bring a flat bot back. */
const SHARE_CHARGE = 50
/** How far apart any two bots may get: all stay on the one screen. */
const LEASH_X = W - 40
const LEASH_Y = VIEW_H - 40
const SEAT_COLORS = ['#fde047', '#f9a8d4', '#67e8f9', '#bef264']
/** Where each player's select cursor starts: Fix, Zip, Hugs, Sage. */
const START_CHOICE = [1, 3, 0, 2]

export const GAUNTLET_CURVES = {
  generators: { start: 3, step: 0.6, limit: 7 },
  generatorHp: { start: 3, step: 0.34, limit: 6 },
  spawnEvery: { start: 150, step: -12, limit: 50 },
  glitchSpeed: { start: 0.6, step: 0.07, limit: 1.35 },
  /** Battery a clinging glitch drains each bite. */
  clingCost: { start: 3, step: 0.5, limit: 9 },
  glitchCap: { start: 10, step: 2, limit: 26 },
  snacks: { start: 4, step: -0.34, limit: 1 },
  cages: { start: 1, step: 0.5, limit: 3 },
} as const

type BotClass = 'hugs' | 'fix' | 'sage' | 'zip'
type ClassSpec = {
  name: string
  role: string
  about: [string, string]
  speed: number
  cooldown: number
  maxSparks: number
  /** Generator damage per spark; above 1 a spark also passes through one glitch. */
  power: number
  /** Multiplies the battery a clinging glitch drains. */
  armor: number
  pulses: number
  /** Generator damage each pulse deals to every generator on screen. */
  magic: number
  body: string
  head: string
}
export const BOT_CLASSES: Record<BotClass, ClassSpec> = {
  hugs: {
    name: 'HUGS',
    role: 'POWER',
    about: ['BIG SPARKS HIT GENERATORS TWICE', 'AND PASS THROUGH A GLITCH'],
    speed: 1.2,
    cooldown: 14,
    maxSparks: 3,
    power: 2,
    armor: 1.1,
    pulses: 1,
    magic: 0,
    body: '#ea580c',
    head: '#fdba74',
  },
  fix: {
    name: 'FIX',
    role: 'ARMOR',
    about: ['A STURDY SHELL', 'CLINGING GLITCHES DRAIN THE LEAST'],
    speed: 1.5,
    cooldown: 10,
    maxSparks: 4,
    power: 1,
    armor: 0.6,
    pulses: 1,
    magic: 0,
    body: '#0d9488',
    head: '#5eead4',
  },
  sage: {
    name: 'SAGE',
    role: 'MAGIC',
    about: ['STARTS WITH THREE PULSES', 'EACH ONE JOLTS GENERATORS TOO'],
    speed: 1.4,
    cooldown: 11,
    maxSparks: 4,
    power: 1,
    armor: 1.3,
    pulses: 3,
    magic: 2,
    body: '#7c3aed',
    head: '#c4b5fd',
  },
  zip: {
    name: 'ZIP',
    role: 'SPEED',
    about: ['THE FASTEST WHEELS', 'AND THE QUICKEST SPARKS'],
    speed: 1.7,
    cooldown: 8,
    maxSparks: 4,
    power: 1,
    armor: 1.7,
    pulses: 1,
    magic: 0,
    body: '#16a34a',
    head: '#86efac',
  },
}
const CLASS_ORDER: BotClass[] = ['hugs', 'fix', 'sage', 'zip']

type Room = { x: number; y: number; w: number; h: number }
type Thing = { x: number; y: number }
type Generator = Thing & {
  hp: number
  maxHp: number
  timer: number
  flash: number
}
type Glitch = Thing & { cling: number; wobble: number }
type Spark = Thing & {
  vx: number
  vy: number
  life: number
  /** Glitches this spark can still pass through. */
  pierce: number
  /** The hero who threw it. */
  owner: Hero
}
/** One player's bot. */
type Hero = {
  seat: number
  cls: BotClass
  /** Select-screen cursor (an index into CLASS_ORDER), and whether it's locked in. */
  choice: number
  picked: boolean
  x: number
  y: number
  facing: number
  fireCooldown: number
  battery: number
  pulses: number
  /** Battery ran out: stopped until a partner shares a charge. */
  flat: boolean
}
type Item = Thing & { kind: 'snack' | 'pulse' | 'cage' | 'key' }
type Door = { tiles: number[]; open: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Eight facings, clockwise from up. */
const FACE_X = [0, 1, 1, 1, 0, -1, -1, -1]
const FACE_Y = [-1, -1, 0, 1, 1, 1, 0, -1]

function idleFrame(): InputFrame {
  const held = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  }
  return { held, pressed: { ...held } }
}

function newHero(seat: number): Hero {
  const choice = START_CHOICE[seat] ?? 0
  return {
    seat,
    cls: CLASS_ORDER[choice]!,
    choice,
    picked: false,
    x: 0,
    y: 0,
    facing: 4,
    fireCooldown: 0,
    battery: MAX_BATTERY,
    pulses: 1,
    flat: false,
  }
}

class KindnessGauntlet implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private heroes: Hero[]
  /** Ticks left on the choose-your-bot screen (0 once every bot is chosen). */
  private selecting = SELECT_TICKS
  private walls = new Uint8Array(MW * MH)
  private seen = new Uint8Array(MW * MH)
  /** The team's key ring. */
  private keys = 0
  private doors: Door[] = []
  private pulseFlash = 0
  private generators: Generator[] = []
  private glitches: Glitch[] = []
  private sparks: Spark[] = []
  private items: Item[] = []
  private exit: Thing = { x: 0, y: 0 }
  private leaving = 0
  private rescued = 0
  private camX = 0
  private camY = 0
  private path: Array<{ x: number; y: number }> = []
  private pathTimer = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    this.heroes = Array.from({ length: seats }, (_, seat) => newHero(seat))
    this.buildFloor(1)
    // The attract pilot picks a bot at random and skips the selection screen.
    if (this.demo) {
      const lead = this.heroes[0]!
      lead.choice = Math.floor(this.rng() * 4)
      this.choose(lead)
    }
  }

  /** Player 1's bot: the attract pilot flies it, and a solo HUD shows it. */
  private get lead(): Hero {
    return this.heroes[0]!
  }

  private specOf(hero: Hero): ClassSpec {
    return BOT_CLASSES[hero.cls]
  }

  /** Bots still rolling (not flat). */
  private get standing(): Hero[] {
    return this.heroes.filter((h) => !h.flat)
  }

  /** Is this bot (by CLASS_ORDER index) already locked in by someone else? */
  private takenBy(index: number, hero: Hero): boolean {
    return this.heroes.some((o) => o !== hero && o.picked && o.choice === index)
  }

  /** The next bot along (step 1 right, 3 left) that nobody else has locked in. */
  private nextFree(hero: Hero, step: number): number {
    let index = hero.choice
    for (let i = 0; i < 4; i++) {
      index = (index + step) % 4
      if (!this.takenBy(index, hero)) return index
    }
    return hero.choice
  }

  private choose(hero: Hero) {
    if (this.takenBy(hero.choice, hero)) hero.choice = this.nextFree(hero, 1)
    hero.cls = CLASS_ORDER[hero.choice]!
    hero.picked = true
    hero.pulses = this.specOf(hero).pulses
    for (const other of this.heroes)
      if (!other.picked && other.choice === hero.choice)
        other.choice = this.nextFree(other, 1)
    if (this.heroes.some((h) => !h.picked)) return
    this.selecting = 0
    const names = this.heroes.map((h) => this.specOf(h).name)
    this.banner = {
      text:
        names.length > 2
          ? `${names.length === 3 ? 'THREE' : 'ALL FOUR'} BOTS ENTER`
          : names.length > 1
            ? `${names.join(' AND ')} ENTER`
            : `${names[0]} ENTERS`,
      sub: 'FIX THE GLITCHES',
      ticks: 90,
    }
  }

  private updateSelect(frames: InputFrame[]) {
    const timeUp = --this.selecting <= 0
    for (const hero of this.heroes) {
      if (hero.picked) continue
      const input = frames[hero.seat] ?? idleFrame()
      const step = input.pressed.left ? 3 : input.pressed.right ? 1 : 0
      if (step) {
        hero.choice = this.nextFree(hero, step)
        this.sound.play('blip')
      }
      if (input.pressed.a || input.pressed.start || timeUp) {
        this.choose(hero)
        this.sound.play('pickup')
      }
    }
  }

  // --- the floor ---------------------------------------------------------------------

  private idx(tx: number, ty: number): number {
    return ty * MW + tx
  }

  private wallAt(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true
    return this.walls[this.idx(tx, ty)] !== OPEN
  }

  private solid(x: number, y: number): boolean {
    return this.wallAt(Math.floor(x / T), Math.floor(y / T))
  }

  private centre(r: Room): Thing {
    return {
      x: (r.x + Math.floor(r.w / 2)) * T + T / 2,
      y: (r.y + Math.floor(r.h / 2)) * T + T / 2,
    }
  }

  private carve(x0: number, y0: number, x1: number, y1: number) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
        if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1)
          this.walls[this.idx(x, y)] = OPEN
      }
    }
  }

  private buildFloor(floor: number) {
    this.level = floor
    this.walls.fill(1)
    this.seen.fill(0)
    const rooms: Room[] = []
    for (let tries = 0; tries < 300 && rooms.length < 9; tries++) {
      const w = 5 + Math.floor(this.rng() * 5)
      const h = 4 + Math.floor(this.rng() * 4)
      const x = 1 + Math.floor(this.rng() * (MW - w - 2))
      const y = 1 + Math.floor(this.rng() * (MH - h - 2))
      const clash = rooms.some(
        (r) =>
          x < r.x + r.w + 2 &&
          x + w + 2 > r.x &&
          y < r.y + r.h + 2 &&
          y + h + 2 > r.y,
      )
      if (clash) continue
      rooms.push({ x, y, w, h })
    }
    rooms.sort((a, b) => a.x + a.y * 0.5 - (b.x + b.y * 0.5))
    for (const r of rooms) this.carve(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1)
    // Two-wide corridors joining each room to the one before it.
    for (let i = 1; i < rooms.length; i++) {
      const a = this.centre(rooms[i - 1]!)
      const b = this.centre(rooms[i]!)
      const ax = Math.floor(a.x / T)
      const ay = Math.floor(a.y / T)
      const bx = Math.floor(b.x / T)
      const by = Math.floor(b.y / T)
      this.carve(ax, ay, bx, ay + 1)
      this.carve(bx, ay, bx + 1, by)
    }
    const start = this.centre(rooms[0]!)
    this.heroes.forEach((hero, i) => {
      // Huddled at the start, two by two (a flat bot is back with a little charge).
      const x = start.x + (i % 2 ? T : 0)
      const y = start.y + (i >= 2 ? T : 0)
      hero.x = this.solid(x, start.y) ? start.x : x
      hero.y = this.solid(hero.x, y) ? start.y : y
      if (hero.flat) {
        hero.flat = false
        hero.battery = Math.max(hero.battery, MAX_BATTERY / 4)
      }
    })
    // The stairs go in the room farthest from the start, by walking distance.
    const dist = this.distances(
      Math.floor(start.x / T),
      Math.floor(start.y / T),
    )
    const far = rooms
      .slice(1)
      .map((r) => {
        const c = this.centre(r)
        return {
          r,
          d: dist[this.idx(Math.floor(c.x / T), Math.floor(c.y / T))] ?? -1,
        }
      })
      .sort((a, b) => b.d - a.d)[0]
    this.exit = this.centre(far?.r ?? rooms[rooms.length - 1]!)
    this.doors = []
    const keyRooms = floor >= 2 ? this.lockTheWay(rooms, start) : []

    const spots = (count: number) => {
      const out: Thing[] = []
      for (let tries = 0; tries < 400 && out.length < count; tries++) {
        const r = rooms[1 + Math.floor(this.rng() * (rooms.length - 1))]!
        const tx = r.x + Math.floor(this.rng() * r.w)
        const ty = r.y + Math.floor(this.rng() * r.h)
        const x = tx * T + T / 2
        const y = ty * T + T / 2
        const taken = [
          ...this.generators,
          ...this.items,
          this.exit,
          ...out,
        ].some((o) => Math.abs(o.x - x) < T * 2 && Math.abs(o.y - y) < T * 2)
        if (!taken) out.push({ x, y })
      }
      return out
    }
    this.generators = []
    this.items = []
    const hp = Math.round(levelCurve(floor, GAUNTLET_CURVES.generatorHp))
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.generators)),
    )) {
      this.generators.push({
        ...s,
        hp,
        maxHp: hp,
        timer: 60 + Math.floor(this.rng() * 90),
        flash: 0,
      })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.snacks)),
    )) {
      this.items.push({ ...s, kind: 'snack' })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.cages)),
    )) {
      this.items.push({ ...s, kind: 'cage' })
    }
    for (const s of spots(1)) this.items.push({ ...s, kind: 'pulse' })
    // The key goes in a room on the near side of the door.
    for (let tries = 0; tries < 200 && keyRooms.length; tries++) {
      const r = keyRooms[Math.floor(this.rng() * keyRooms.length)]!
      const x = (r.x + Math.floor(this.rng() * r.w)) * T + T / 2
      const y = (r.y + Math.floor(this.rng() * r.h)) * T + T / 2
      const taken = [...this.generators, ...this.items].some(
        (o) => Math.abs(o.x - x) < T * 2 && Math.abs(o.y - y) < T * 2,
      )
      if (
        taken ||
        (Math.abs(x - start.x) < T * 2 && Math.abs(y - start.y) < T * 2)
      )
        continue
      this.items.push({ x, y, kind: 'key' })
      break
    }
    this.glitches = []
    this.sparks = []
    this.leaving = 0
    this.path = []
    this.reveal()
    this.lives = this.standing.length
    this.banner = { text: `FLOOR ${floor}`, sub: 'FIX THE GLITCHES', ticks: 90 }
  }

  /**
   * Lock a door across a corridor on the way to the stairs, where it truly cuts
   * the floor in two. Returns the rooms still reachable from the start (where
   * the key can go), or none when no clean cut exists on this floor.
   */
  private lockTheWay(rooms: Room[], start: Thing): Room[] {
    const sx = Math.floor(start.x / T)
    const sy = Math.floor(start.y / T)
    const dist = this.distances(sx, sy)
    // The walking route from the stairs back to the start.
    let x = Math.floor(this.exit.x / T)
    let y = Math.floor(this.exit.y / T)
    const route: Array<[number, number]> = []
    for (let guard = 0; guard < 600; guard++) {
      route.push([x, y])
      const d = dist[this.idx(x, y)]!
      if (d <= 0) break
      const step = (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const
      ).find(([dx, dy]) => dist[this.idx(x + dx, y + dy)] === d - 1)
      if (!step) break
      x += step[0]
      y += step[1]
    }
    const inRoom = (tx: number, ty: number) =>
      rooms.some(
        (r) =>
          tx >= r.x - 1 && tx <= r.x + r.w && ty >= r.y - 1 && ty <= r.y + r.h,
      )
    const n = route.length
    for (let i = Math.floor(n * 0.25); i < Math.floor(n * 0.65); i++) {
      const [cx, cy] = route[i]!
      if (inRoom(cx, cy)) continue
      const [nx] = route[i + 1] ?? route[i - 1]!
      // Span the corridor's width, across the direction of travel.
      const across: Array<[number, number]> =
        nx !== cx
          ? [
              [cx, cy - 1],
              [cx, cy + 1],
            ]
          : [
              [cx - 1, cy],
              [cx + 1, cy],
            ]
      const tiles = [this.idx(cx, cy)]
      for (const [ax, ay] of across)
        if (!this.wallAt(ax, ay) && !inRoom(ax, ay))
          tiles.push(this.idx(ax, ay))
      for (const t of tiles) this.walls[t] = DOOR
      const cut = this.distances(sx, sy)
      const exitTile = this.idx(
        Math.floor(this.exit.x / T),
        Math.floor(this.exit.y / T),
      )
      if (cut[exitTile] === -1) {
        this.doors.push({ tiles, open: false })
        return rooms.slice(1).filter((r) => {
          const c = this.centre(r)
          return cut[this.idx(Math.floor(c.x / T), Math.floor(c.y / T))]! > 0
        })
      }
      for (const t of tiles) this.walls[t] = OPEN
    }
    return []
  }

  /** Walking into a locked door with a key opens it. */
  private tryDoors(hero: Hero) {
    if (this.keys <= 0) return
    const reach = T / 2 + HALF + 3
    for (const door of this.doors) {
      if (door.open) continue
      const near = door.tiles.some((t) => {
        const cx = (t % MW) * T + T / 2
        const cy = Math.floor(t / MW) * T + T / 2
        return Math.abs(cx - hero.x) < reach && Math.abs(cy - hero.y) < reach
      })
      if (!near) continue
      this.keys--
      door.open = true
      for (const t of door.tiles) this.walls[t] = OPEN
      const t0 = door.tiles[0]!
      const dx = (t0 % MW) * T + T / 2
      const dy = Math.floor(t0 / MW) * T + T / 2
      this.addScore(DOOR_POINTS, dx, dy - 12)
      this.burst(dx, dy, 12, '#fbbf24')
      this.sound.play('pickup')
    }
  }

  /** Walking distance in tiles from (sx, sy) to every open tile. */
  private distances(sx: number, sy: number, throughDoors = false): Int16Array {
    const dist = new Int16Array(MW * MH).fill(-1)
    const queue = [sx, sy]
    dist[this.idx(sx, sy)] = 0
    for (let head = 0; head < queue.length; head += 2) {
      const x = queue[head]!
      const y = queue[head + 1]!
      const d = dist[this.idx(x, y)]!
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx
        const ny = y + dy
        const blocked =
          this.wallAt(nx, ny) &&
          !(throughDoors && this.walls[this.idx(nx, ny)] === DOOR)
        if (blocked || dist[this.idx(nx, ny)] !== -1) continue
        dist[this.idx(nx, ny)] = d + 1
        queue.push(nx, ny)
      }
    }
    return dist
  }

  /** Light up the tiles around each bot (the map is dark until explored). */
  private reveal() {
    for (const hero of this.heroes) {
      const tx = Math.floor(hero.x / T)
      const ty = Math.floor(hero.y / T)
      for (let y = ty - 6; y <= ty + 6; y++) {
        for (let x = tx - 8; x <= tx + 8; x++) {
          if (x >= 0 && y >= 0 && x < MW && y < MH)
            this.seen[this.idx(x, y)] = 1
        }
      }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])
    if (this.selecting > 0) {
      this.updateSelect(frames)
      return
    }

    if (this.leaving > 0) {
      if (--this.leaving === 0) this.buildFloor(this.level + 1)
      return
    }
    if (this.pulseFlash > 0) this.pulseFlash--

    for (const hero of this.standing) {
      if (this.tick % DRAIN_TICKS === 0) hero.battery--
      if (hero.fireCooldown > 0) hero.fireCooldown--
      const controls = frames[hero.seat] ?? idleFrame()
      this.move(hero, controls)
      this.tryDoors(hero)
      if (controls.pressed.a || (controls.held.a && hero.fireCooldown === 0))
        this.fire(hero)
      if (controls.pressed.b) this.pulse(hero)
    }
    this.shareCharge()
    this.updateSparks()
    this.updateGenerators()
    this.updateGlitches()
    this.pickUp()
    this.reveal()

    const atExit = this.standing.find(
      (h) => Math.hypot(this.exit.x - h.x, this.exit.y - h.y) < 10,
    )
    if (atExit) {
      const bonus = FLOOR_POINTS + 100 * this.level
      this.addScore(bonus, atExit.x, atExit.y - 16)
      this.leaving = EXIT_TICKS
      this.banner = {
        text: 'DOWN THE STAIRS!',
        sub: `FLOOR BONUS ${bonus}`,
        ticks: EXIT_TICKS,
      }
      this.sound.play('level')
    }
    for (const hero of this.standing) {
      if (hero.battery > 0) continue
      hero.battery = 0
      hero.flat = true
      this.burst(hero.x, hero.y, 10, '#94a3b8')
      this.sound.play('die')
      if (this.standing.length)
        this.banner = {
          text: `${this.specOf(hero).name} IS FLAT`,
          sub: 'ROLL OVER AND SHARE A CHARGE',
          ticks: 120,
        }
    }
    this.lives = this.standing.length
    if (!this.standing.length) {
      this.over = true
      this.banner = { text: 'BATTERY FLAT', sub: 'GAME OVER', ticks: 9999 }
      return
    }
    this.followCamera()
  }

  /** Centre the one shared screen on the bots still rolling. */
  private followCamera() {
    const group = this.standing.length ? this.standing : this.heroes
    const xs = group.map((h) => h.x)
    const ys = group.map((h) => h.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    this.camX = Math.max(0, Math.min(MW * T - W, cx - W / 2))
    this.camY = Math.max(0, Math.min(MH * T - VIEW_H, cy - VIEW_H / 2))
  }

  /** Would a bot at (x, y) still share the screen with its rolling partners? */
  private onLeash(hero: Hero, x: number, y: number): boolean {
    return this.standing.every((o) => {
      if (o === hero) return true
      const dx = Math.abs(o.x - x)
      const dy = Math.abs(o.y - y)
      if (dx <= LEASH_X && dy <= LEASH_Y) return true
      // Already too far apart (a partner was revived out past the leash):
      // any step that doesn't widen the gap is fine, so they can close it.
      return dx <= Math.abs(o.x - hero.x) && dy <= Math.abs(o.y - hero.y)
    })
  }

  /** A rolling bot next to a flat partner hands over some of its charge. */
  private shareCharge() {
    for (const flat of this.heroes) {
      if (!flat.flat) continue
      const helper = this.standing.find(
        (h) =>
          h.battery > SHARE_CHARGE + 10 &&
          Math.hypot(h.x - flat.x, h.y - flat.y) < 14,
      )
      if (!helper) continue
      helper.battery -= SHARE_CHARGE
      flat.battery = SHARE_CHARGE
      flat.flat = false
      this.floaters.push({
        x: flat.x,
        y: flat.y - 12,
        text: 'SHARED!',
        life: 50,
      })
      this.burst(flat.x, flat.y, 12, '#bbf7d0')
      this.sound.play('extra')
    }
  }

  private move(hero: Hero, input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx === 0 && dy === 0) return
    for (let f = 0; f < 8; f++) {
      if (FACE_X[f] === dx && FACE_Y[f] === dy) hero.facing = f
    }
    // As in the classic, holding fire plants the bot in place: the arrows only turn.
    if (input.held.a) return
    const len = Math.hypot(dx, dy)
    const speed = this.specOf(hero).speed
    const to = this.slide(
      hero.x,
      hero.y,
      (dx / len) * speed,
      (dy / len) * speed,
      HALF,
    )
    // Partners share one screen: neither can roll off it.
    if (this.onLeash(hero, to.x, hero.y)) hero.x = to.x
    if (this.onLeash(hero, hero.x, to.y)) hero.y = to.y
  }

  /** Where a body at (x, y) ends up moving by (vx, vy), one axis at a time. */
  private slide(x: number, y: number, vx: number, vy: number, half: number) {
    const nx = this.boxHits(x + vx, y, half) ? x : x + vx
    const ny = this.boxHits(nx, y + vy, half) ? y : y + vy
    return { x: nx, y: ny }
  }

  private boxHits(x: number, y: number, half: number): boolean {
    return (
      this.solid(x - half, y - half) ||
      this.solid(x + half, y - half) ||
      this.solid(x - half, y + half) ||
      this.solid(x + half, y + half)
    )
  }

  private fire(hero: Hero) {
    const spec = this.specOf(hero)
    const mine = this.sparks.filter((s) => s.owner === hero).length
    if (mine >= spec.maxSparks) return
    hero.fireCooldown = spec.cooldown
    const fx = FACE_X[hero.facing]!
    const fy = FACE_Y[hero.facing]!
    const len = Math.hypot(fx, fy)
    this.sparks.push({
      x: hero.x + fx * 6,
      y: hero.y + fy * 6,
      vx: (fx / len) * SPARK_SPEED,
      vy: (fy / len) * SPARK_SPEED,
      life: SPARK_LIFE,
      pierce: spec.power - 1,
      owner: hero,
    })
    this.sound.play('shoot')
  }

  /** A kindness pulse fixes every glitch on screen. */
  private pulse(hero: Hero) {
    if (hero.pulses <= 0) return
    hero.pulses--
    this.pulseFlash = 20
    const onScreen = this.glitches.filter((g) => this.visible(g))
    for (const g of onScreen) this.fixGlitch(g)
    const magic = this.specOf(hero).magic
    if (magic > 0)
      for (const gen of this.generators.filter((g) => this.visible(g)))
        this.damageGenerator(gen, magic)
    this.sound.play('extra')
  }

  private visible(t: Thing): boolean {
    return (
      t.x > this.camX - 8 &&
      t.x < this.camX + W + 8 &&
      t.y > this.camY - 8 &&
      t.y < this.camY + VIEW_H + 8
    )
  }

  private updateSparks() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (this.solid(s.x, s.y)) s.life = 0
      if (s.life <= 0) continue
      const glitch = this.glitches.find(
        (g) => Math.hypot(g.x - s.x, g.y - s.y) < 7,
      )
      if (glitch) {
        this.fixGlitch(glitch)
        if (s.pierce-- <= 0) s.life = 0
        continue
      }
      const gen = this.generators.find(
        (g) => Math.abs(g.x - s.x) < 8 && Math.abs(g.y - s.y) < 8,
      )
      if (gen) {
        s.life = 0
        this.damageGenerator(gen, this.specOf(s.owner).power)
      }
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  private damageGenerator(gen: Generator, damage: number) {
    gen.hp -= damage
    gen.flash = 6
    this.sound.play('blip')
    if (gen.hp > 0) return
    this.generators = this.generators.filter((g) => g !== gen)
    this.addScore(GENERATOR_POINTS * this.level, gen.x, gen.y - 12)
    this.burst(gen.x, gen.y, 14, '#a5f3fc')
    this.sound.play('boom')
  }

  private fixGlitch(g: Glitch) {
    this.glitches = this.glitches.filter((other) => other !== g)
    this.addScore(GLITCH_POINTS, g.x, g.y - 8)
    this.burst(g.x, g.y, 5, '#f0abfc')
    this.sound.play('pop')
  }

  private updateGenerators() {
    const every = Math.round(levelCurve(this.level, GAUNTLET_CURVES.spawnEvery))
    const cap = Math.round(levelCurve(this.level, GAUNTLET_CURVES.glitchCap))
    for (const gen of this.generators) {
      if (gen.flash > 0) gen.flash--
      const near = this.standing.some(
        (h) => Math.hypot(gen.x - h.x, gen.y - h.y) <= GLITCH_RANGE,
      )
      if (!near) continue
      if (--gen.timer > 0) continue
      gen.timer = every
      if (this.glitches.length >= cap) continue
      // Glitches leak out of a free side of the generator.
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ] as const) {
        const x = gen.x + dx * T
        const y = gen.y + dy * T
        if (!this.boxHits(x, y, HALF)) {
          this.glitches.push({ x, y, cling: 0, wobble: this.rng() * 6 })
          break
        }
      }
    }
  }

  private updateGlitches() {
    const speed = levelCurve(this.level, GAUNTLET_CURVES.glitchSpeed)
    for (const g of this.glitches) {
      // Each glitch goes for the nearest bot still rolling.
      const prey = this.nearestStanding(g)
      if (!prey) continue
      const dx = prey.x - g.x
      const dy = prey.y - g.y
      const d = Math.hypot(dx, dy)
      if (d > GLITCH_RANGE) continue
      if (d < 9) {
        // Clinging on: drains that bot's battery.
        if (--g.cling <= 0) {
          g.cling = CLING_TICKS
          prey.battery -= Math.round(
            levelCurve(this.level, GAUNTLET_CURVES.clingCost) *
              this.specOf(prey).armor,
          )
          this.sound.play('warn')
        }
        continue
      }
      const jitter = Math.sin(this.tick / 9 + g.wobble) * 0.3
      const to = this.slide(
        g.x,
        g.y,
        (dx / d) * speed + jitter,
        (dy / d) * speed - jitter,
        4,
      )
      g.x = to.x
      g.y = to.y
    }
  }

  private nearestStanding(t: Thing): Hero | undefined {
    let best: Hero | undefined
    let bestD = Infinity
    for (const h of this.standing) {
      const d = Math.hypot(h.x - t.x, h.y - t.y)
      if (d < bestD) {
        bestD = d
        best = h
      }
    }
    return best
  }

  private pickUp() {
    for (const item of [...this.items]) {
      const hero = this.standing.find(
        (h) => Math.hypot(item.x - h.x, item.y - h.y) <= 10,
      )
      if (!hero) continue
      this.items = this.items.filter((other) => other !== item)
      if (item.kind === 'snack') {
        hero.battery = Math.min(MAX_BATTERY, hero.battery + SNACK_CHARGE)
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'SNACK!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'key') {
        this.keys++
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'KEY!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'pulse') {
        hero.pulses++
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'PULSE!',
          life: 40,
        })
        this.sound.play('pickup')
      } else {
        this.rescued++
        this.addScore(RESCUE_POINTS * this.level, item.x, item.y - 10)
        this.burst(item.x, item.y, 12, '#fde68a')
        this.banner = { text: 'BOT RESCUED!', ticks: 60 }
        this.sound.play('extra')
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 16 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    if (this.selecting > 0) {
      frame.pressed.a = true
      return frame
    }
    const me = this.lead
    // Swamped: use a pulse (Sage, with pulses to spare, uses them sooner).
    const close = this.glitches.filter(
      (g) => Math.hypot(g.x - me.x, g.y - me.y) < 40,
    )
    if (close.length >= (me.pulses > 1 ? 3 : 5) && me.pulses > 0) {
      frame.pressed.b = true
      return frame
    }
    // Something to fix nearby: face it and spark it.
    const targets: Thing[] = [...this.glitches, ...this.generators]
    const aim = targets
      .filter(
        (t) => Math.hypot(t.x - me.x, t.y - me.y) < 90 && this.clearShot(t),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - me.x, a.y - me.y) -
          Math.hypot(b.x - me.x, b.y - me.y),
      )[0]
    if (aim) {
      const ang = Math.atan2(aim.y - me.y, aim.x - me.x)
      const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
      if (FACE_X[f]! < 0) held.left = true
      if (FACE_X[f]! > 0) held.right = true
      if (FACE_Y[f]! < 0) held.up = true
      if (FACE_Y[f]! > 0) held.down = true
      held.a = true
      return frame
    }
    // Otherwise walk the path to the next goal: snacks when low, cages, generators, then the stairs.
    if (--this.pathTimer <= 0 || this.path.length === 0) {
      this.pathTimer = 30
      this.path = this.planPath()
    }
    const next = this.path[0]
    if (!next) return frame
    const nx = next.x * T + T / 2
    const ny = next.y * T + T / 2
    if (Math.abs(nx - me.x) < 3 && Math.abs(ny - me.y) < 3) {
      this.path.shift()
      return frame
    }
    if (nx < me.x - 1) held.left = true
    if (nx > me.x + 1) held.right = true
    if (ny < me.y - 1) held.up = true
    if (ny > me.y + 1) held.down = true
    return frame
  }

  /** A straight, unblocked spark line to the target along one of the eight facings. */
  private clearShot(t: Thing): boolean {
    // Replay the spark's exact flight along the nearest of the eight facings:
    // sampling the line instead can step over a wall corner the spark clips.
    const me = this.lead
    const ang = Math.atan2(t.y - me.y, t.x - me.x)
    const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
    const fx = FACE_X[f]!
    const fy = FACE_Y[f]!
    const len = Math.hypot(fx, fy)
    let x = me.x + fx * 6
    let y = me.y + fy * 6
    for (let i = 0; i < SPARK_LIFE; i++) {
      x += (fx / len) * SPARK_SPEED
      y += (fy / len) * SPARK_SPEED
      if (this.solid(x, y)) return false
      if (Math.abs(t.x - x) < 6 && Math.abs(t.y - y) < 6) return true
    }
    return false
  }

  private planPath(): Array<{ x: number; y: number }> {
    const sx = Math.floor(this.lead.x / T)
    const sy = Math.floor(this.lead.y / T)
    const dist = this.distances(sx, sy, this.keys > 0)
    const goals: Thing[] =
      this.lead.battery < 120
        ? this.items.filter((i) => i.kind === 'snack')
        : [...this.items.filter((i) => i.kind !== 'snack'), ...this.generators]
    const pool = goals.length ? goals : [this.exit]
    let best: Thing | null = null
    let bestD = Infinity
    for (const g of pool) {
      const d = dist[this.idx(Math.floor(g.x / T), Math.floor(g.y / T))]!
      if (d >= 0 && d < bestD) {
        bestD = d
        best = g
      }
    }
    if (!best) best = this.exit
    // Walk back from the goal along decreasing distance.
    let x = Math.floor(best.x / T)
    let y = Math.floor(best.y / T)
    const path: Array<{ x: number; y: number }> = []
    for (let guard = 0; guard < 400; guard++) {
      path.unshift({ x, y })
      const d = dist[this.idx(x, y)]!
      if (d <= 0) break
      let moved = false
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        if (dist[this.idx(x + dx, y + dy)] === d - 1) {
          x += dx
          y += dy
          moved = true
          break
        }
      }
      if (!moved) break
    }
    return path.slice(1)
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.selecting > 0) {
      this.renderSelect(g)
      return
    }
    g.fillStyle = '#05030d'
    g.fillRect(0, 0, W, H)
    g.save()
    g.beginPath()
    g.rect(0, VIEW_Y, W, VIEW_H)
    g.clip()
    g.translate(-Math.round(this.camX), VIEW_Y - Math.round(this.camY))
    this.renderMap(g)
    this.renderExit(g)
    for (const item of this.items) this.renderItem(g, item)
    for (const gen of this.generators) this.renderGenerator(g, gen)
    for (const gl of this.glitches) this.renderGlitch(g, gl)
    for (const s of this.sparks) {
      g.fillStyle = this.tick % 4 < 2 ? '#fde047' : '#ffffff'
      g.fillRect(s.x - 2, s.y - 2, 4, 4)
    }
    this.renderHeroes(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    g.restore()
    if (this.pulseFlash > 0) {
      g.globalAlpha = this.pulseFlash / 30
      g.fillStyle = '#fbcfe8'
      g.fillRect(0, VIEW_Y, W, VIEW_H)
      g.globalAlpha = 1
    }
    this.renderHud(g)
  }

  private renderMap(g: CanvasRenderingContext2D) {
    const x0 = Math.max(0, Math.floor(this.camX / T))
    const y0 = Math.max(0, Math.floor(this.camY / T))
    const x1 = Math.min(MW - 1, x0 + Math.ceil(W / T) + 1)
    const y1 = Math.min(MH - 1, y0 + Math.ceil(VIEW_H / T) + 1)
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.seen[this.idx(tx, ty)]) continue
        const x = tx * T
        const y = ty * T
        if (this.walls[this.idx(tx, ty)] === DOOR) {
          // A locked door: gold bars over the dark.
          g.fillStyle = '#1c1917'
          g.fillRect(x, y, T, T)
          g.fillStyle = '#f59e0b'
          for (let i = 1; i < T; i += 5) g.fillRect(x + i, y, 2, T)
          g.fillRect(x, y + 6, T, 2)
          g.fillStyle = '#fde68a'
          g.fillRect(x + 6, y + 9, 4, 3)
        } else if (this.wallAt(tx, ty)) {
          g.fillStyle = '#4c1d95'
          g.fillRect(x, y, T, T)
          g.fillStyle = '#6d28d9'
          g.fillRect(x, y, T, 2)
          g.fillRect(x + ((ty % 2) * T) / 2, y + 8, 1, 8)
          g.fillStyle = '#2e1065'
          g.fillRect(x, y + 7, T, 1)
        } else {
          g.fillStyle = (tx + ty) % 2 ? '#111827' : '#0f172a'
          g.fillRect(x, y, T, T)
        }
      }
    }
  }

  private renderExit(g: CanvasRenderingContext2D) {
    const e = this.exit
    if (!this.seen[this.idx(Math.floor(e.x / T), Math.floor(e.y / T))]) return
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#22d3ee' : '#0e7490'
      g.fillRect(e.x - 8 + i, e.y - 8 + i * 4, 16 - i * 2, 4)
    }
    if (Math.floor(this.tick / 15) % 2 === 0) {
      drawText(g, 'EXIT', e.x, e.y - 18, { align: 'center', color: '#a5f3fc' })
    }
  }

  private renderItem(g: CanvasRenderingContext2D, item: Item) {
    const { x, y } = item
    if (item.kind === 'snack') {
      // A frosted donut.
      g.fillStyle = '#f59e0b'
      g.beginPath()
      g.arc(x, y, 5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#f472b6'
      g.beginPath()
      g.arc(x, y - 1, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#111827'
      g.fillRect(x - 1, y - 2, 2, 2)
    } else if (item.kind === 'key') {
      // A chunky gold key, glinting.
      g.fillStyle = Math.floor(this.tick / 10) % 2 ? '#fbbf24' : '#fde047'
      g.beginPath()
      g.arc(x - 3, y, 3, 0, Math.PI * 2)
      g.fill()
      g.fillRect(x - 1, y - 1, 8, 2)
      g.fillRect(x + 4, y + 1, 2, 3)
      g.fillRect(x + 1, y + 1, 1, 2)
      g.fillStyle = '#1c1917'
      g.fillRect(x - 4, y - 1, 2, 2)
    } else if (item.kind === 'pulse') {
      g.fillStyle = Math.floor(this.tick / 8) % 2 ? '#f9a8d4' : '#fbcfe8'
      g.beginPath()
      g.moveTo(x, y + 5)
      g.lineTo(x - 5, y - 1)
      g.lineTo(x - 2, y - 4)
      g.lineTo(x, y - 2)
      g.lineTo(x + 2, y - 4)
      g.lineTo(x + 5, y - 1)
      g.fill()
    } else {
      // A trapped bot behind bars.
      g.fillStyle = '#facc15'
      g.fillRect(x - 4, y - 4, 8, 8)
      g.fillStyle = '#0f172a'
      g.fillRect(x - 2, y - 2, 1, 1)
      g.fillRect(x + 1, y - 2, 1, 1)
      g.fillStyle = '#94a3b8'
      for (let i = -6; i <= 6; i += 3) g.fillRect(x + i, y - 7, 1, 14)
      g.fillRect(x - 7, y - 7, 15, 1)
      g.fillRect(x - 7, y + 6, 15, 1)
    }
  }

  private renderGenerator(g: CanvasRenderingContext2D, gen: Generator) {
    const { x, y } = gen
    g.fillStyle = gen.flash > 0 ? '#ffffff' : '#334155'
    g.fillRect(x - 7, y - 7, 14, 14)
    // Static on its little screen.
    for (let i = 0; i < 6; i++) {
      g.fillStyle = (this.tick + i * 3) % 5 < 2 ? '#f0abfc' : '#22d3ee'
      g.fillRect(
        x - 5 + ((i * 7 + this.tick) % 10),
        y - 5 + ((i * 5) % 8),
        2,
        2,
      )
    }
    g.fillStyle = '#1f2937'
    g.fillRect(x - 7, y + 8, 14, 2)
    g.fillStyle = '#4ade80'
    g.fillRect(x - 7, y + 8, (14 * gen.hp) / gen.maxHp, 2)
  }

  private renderGlitch(g: CanvasRenderingContext2D, gl: Glitch) {
    const shift = (Math.floor(this.tick / 3 + gl.wobble) % 3) - 1
    g.fillStyle = '#22d3ee'
    g.fillRect(gl.x - 4 + shift, gl.y - 4, 7, 7)
    g.fillStyle = '#e879f9'
    g.fillRect(gl.x - 3 - shift, gl.y - 3, 7, 7)
    g.fillStyle = '#ffffff'
    g.fillRect(gl.x - 2, gl.y - 1, 2, 2)
    g.fillRect(gl.x + 1, gl.y - 1, 2, 2)
  }

  private renderHeroes(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    for (const hero of this.heroes) {
      if (hero.flat) {
        // Flat: dimmed, with a blinking empty battery overhead.
        g.globalAlpha = 0.45
        this.renderBot(g, hero.cls, hero.x, hero.y, 4)
        g.globalAlpha = 1
        if (Math.floor(this.tick / 15) % 2 === 0) {
          g.fillStyle = '#ef4444'
          g.fillRect(hero.x - 4, hero.y - 16, 8, 4)
          g.fillRect(hero.x + 4, hero.y - 15, 1, 2)
        }
        continue
      }
      this.renderBot(g, hero.cls, hero.x, hero.y, hero.facing)
      // 1P/2P tags above their bots, 3P/4P below (they start a row lower).
      if (duo)
        drawText(
          g,
          `${hero.seat + 1}P`,
          hero.x,
          hero.y + (hero.seat >= 2 ? 10 : -18),
          {
            align: 'center',
            color: SEAT_COLORS[hero.seat],
          },
        )
    }
  }

  /** Each bot keeps Fix's shape with its own silhouette touch. */
  private renderBot(
    g: CanvasRenderingContext2D,
    cls: BotClass,
    x: number,
    y: number,
    facing: number,
  ) {
    const spec = BOT_CLASSES[cls]
    const fx = FACE_X[facing]!
    const fy = FACE_Y[facing]!
    if (cls === 'zip') {
      // A wheel underneath and a swept-back fin.
      g.fillStyle = '#1f2937'
      g.fillRect(x - 3, y + 4, 6, 3)
      g.fillStyle = '#9ca3af'
      g.fillRect(x - 1, y + 5, 2, 1)
      g.fillStyle = spec.head
      g.fillRect(x - fx * 6 - 1, y - 6, 2, 6)
    }
    g.fillStyle = spec.body
    if (cls === 'hugs') {
      // Broad shoulders and two big hugging arms.
      g.fillRect(x - 7, y - 4, 14, 10)
      g.fillStyle = spec.head
      g.fillRect(x - 10, y - 2, 3, 6)
      g.fillRect(x + 7, y - 2, 3, 6)
    } else if (cls === 'zip') {
      g.fillRect(x - 4, y - 4, 8, 8)
    } else {
      g.fillRect(x - 5, y - 4, 10, 9)
    }
    g.fillStyle = spec.head
    g.fillRect(x - 4, y - 7, 8, 5)
    if (cls === 'sage') {
      // A tall antenna with a glowing tip.
      g.fillStyle = '#e9d5ff'
      g.fillRect(x, y - 12, 1, 5)
      g.fillStyle = Math.floor(this.tick / 10) % 2 ? '#f0abfc' : '#fde047'
      g.fillRect(x - 1, y - 14, 3, 3)
    }
    g.fillStyle = '#0f172a'
    g.fillRect(x - 3, y - 6, 6, 2)
    g.fillStyle = '#fde047'
    g.fillRect(x - 2 + fx, y - 6, 1, 1)
    g.fillRect(x + 1 + fx, y - 6, 1, 1)
    // The wrench points the way the bot is facing.
    g.fillStyle = '#e5e7eb'
    const reach = cls === 'hugs' ? 9 : 7
    g.fillRect(x + fx * reach - 1, y + fy * reach - 1, 3, 3)
  }

  private renderSelect(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    g.fillStyle = '#05030d'
    g.fillRect(0, 0, W, H)
    drawText(g, duo ? 'CHOOSE YOUR BOTS' : 'CHOOSE YOUR BOT', W / 2, 14, {
      scale: 2,
      align: 'center',
      color: '#fde047',
      shadow: '#7c3aed',
    })
    CLASS_ORDER.forEach((cls, i) => {
      const spec = BOT_CLASSES[cls]
      const cx = 44 + i * 77
      const here = this.heroes.filter((h) => h.choice === i)
      const lit = here.length > 0
      g.fillStyle = lit ? '#312e81' : '#111827'
      g.fillRect(cx - 34, 44, 68, 112)
      g.strokeStyle = !lit
        ? '#374151'
        : duo
          ? SEAT_COLORS[here[0]!.seat]!
          : spec.head
      g.lineWidth = lit ? 2 : 1
      g.strokeRect(cx - 34, 44, 68, 112)
      g.save()
      g.translate(cx, 86)
      g.scale(3, 3)
      this.renderBot(
        g,
        cls,
        0,
        0,
        lit ? 3 + (Math.floor(this.tick / 20) % 3) : 4,
      )
      g.restore()
      drawText(g, spec.name, cx, 128, {
        scale: 2,
        align: 'center',
        color: lit ? '#ffffff' : '#9ca3af',
      })
      drawText(g, spec.role, cx, 146, {
        align: 'center',
        color: lit ? spec.head : '#6b7280',
      })
      // Whose cursor is on this card (1P/2P above it, 3P/4P below), and who
      // has locked it in.
      if (duo)
        for (const h of here) {
          const left = h.seat % 2 === 0
          drawText(
            g,
            h.picked ? `${h.seat + 1}P READY` : `${h.seat + 1}P`,
            left ? cx - 33 : cx + 33,
            h.seat < 2 ? 35 : 158,
            { align: left ? 'left' : 'right', color: SEAT_COLORS[h.seat] },
          )
        }
    })
    if (duo) {
      for (const h of this.heroes) {
        const spec = BOT_CLASSES[CLASS_ORDER[h.choice]!]
        drawText(
          g,
          `${h.seat + 1}P ${spec.name}: ${spec.about[0]}`,
          W / 2,
          168 + h.seat * (this.heroes.length > 2 ? 9 : 10),
          {
            align: 'center',
            color: SEAT_COLORS[h.seat],
          },
        )
      }
    } else {
      const spec = BOT_CLASSES[CLASS_ORDER[this.lead.choice]!]
      drawText(g, spec.about[0], W / 2, 172, {
        align: 'center',
        color: '#e5e7eb',
      })
      drawText(g, spec.about[1], W / 2, 182, {
        align: 'center',
        color: '#e5e7eb',
      })
    }
    if (Math.floor(this.tick / 20) % 2 === 0)
      drawText(
        g,
        duo
          ? 'EACH PICK A DIFFERENT BOT   A TO GO'
          : 'LEFT/RIGHT TO PICK   A TO GO',
        W / 2,
        206,
        { align: 'center', color: '#a5f3fc' },
      )
    drawText(g, `${Math.ceil(this.selecting / 60)}`, W / 2, 222, {
      align: 'center',
      color: '#6b7280',
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 4, 2, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#f9a8d4',
    })
    if (this.heroes.length > 1) this.renderDuoHud(g)
    else this.renderSoloHud(g)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 110, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }

  private batteryBar(
    g: CanvasRenderingContext2D,
    hero: Hero,
    x: number,
    y: number,
    w: number,
  ) {
    g.fillStyle = '#1f2937'
    g.fillRect(x, y, w, 5)
    const frac = Math.max(0, hero.battery) / MAX_BATTERY
    g.fillStyle = frac > 0.4 ? '#4ade80' : frac > 0.2 ? '#facc15' : '#ef4444'
    g.fillRect(x, y, w * frac, 5)
  }

  private renderSoloHud(g: CanvasRenderingContext2D) {
    const me = this.lead
    drawText(g, `${this.specOf(me).name}  FLOOR ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#a5f3fc',
    })
    drawText(g, 'BATTERY', 84, 1, { color: '#bbf7d0' })
    this.batteryBar(g, me, 84, 9, 70)
    drawText(g, `PULSE ${me.pulses}`, 162, 1, { color: '#fbcfe8' })
    drawText(g, `SAVED ${this.rescued}`, 162, 9, { color: '#fde68a' })
    if (this.keys > 0 || this.doors.some((d) => !d.open))
      drawText(g, `KEY ${this.keys}`, 214, 1, { color: '#fbbf24' })
  }

  /**
   * A row per bot: whose it is, its battery, its pulses. Two bots stack in one
   * column; three or four fill two narrower ones.
   */
  private renderDuoHud(g: CanvasRenderingContext2D) {
    drawText(g, `FLOOR ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#a5f3fc',
    })
    const crowd = this.heroes.length > 2
    const colW = crowd ? 54 : 78
    const bar = crowd ? 26 : 44
    for (const hero of this.heroes) {
      const x = 84 + Math.floor(hero.seat / 2) * colW
      const y = 1 + (hero.seat % 2) * 8
      drawText(g, `${hero.seat + 1}P`, x, y, { color: SEAT_COLORS[hero.seat] })
      if (hero.flat) {
        if (Math.floor(this.tick / 15) % 2 === 0)
          drawText(g, 'FLAT', x + 14, y, { color: '#ef4444' })
      } else {
        this.batteryBar(g, hero, x + 14, y + 1, bar)
      }
      drawText(g, String(hero.pulses), x + 16 + bar, y, { color: '#fbcfe8' })
    }
    const infoX = crowd ? 196 : 162
    drawText(g, `SAVED ${this.rescued}`, infoX, 1, { color: '#fde68a' })
    if (this.keys > 0 || this.doors.some((d) => !d.open))
      drawText(g, `KEY ${this.keys}`, infoX, 9, { color: '#fbbf24' })
  }
}

const kindnessGauntlet: ArcadeGameModule = {
  create: (options) => new KindnessGauntlet(options),
}

export const create = kindnessGauntlet.create
export default kindnessGauntlet
