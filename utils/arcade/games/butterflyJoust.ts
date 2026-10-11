// /utils/arcade/games/butterflyJoust.ts
//
// Butterfly Joust -- the Kind Robots Arcade's riff on the 1982 flapping joust (conductor
// kr-arcade/t-009 game factory; the Four Gardens Tourney depth pass, m8). The teal cat-eared robot
// rides a rainbow butterfly: tap A to flap, steer left and right, and the edges wrap around. Touch
// a grumpy moth rider while you are higher and you bonk them: they curl into a cocoon you can
// scoop up for points before it hatches into a tougher rider. Lower loses; level bounces both
// apart, unless one of you is lunging: hold B to brace and let go for a Charge Joust that wins a
// level clash. Bonk after bonk without landing builds an Air Combo, banked when you land.
//
// The Tourney runs garden by garden (utils/arcade/butterflyJoust/arenas.ts): each arena has its
// own ledges (crumbling, folding, drifting, rising), thermals and wind, its pond, six announced
// waves (Survival, Gladiator, Cocoon, Storm and Team, each with its bonus rule) and a champion
// bout (champions.ts). Between arenas the Wing Garden trades pollen for spare butterflies,
// upgrades and wings, and the run saves at each arena's start. The Pond Frog lurks in open water:
// bubbles, then eyes, then its tongue snatches a low flier, and only hard flapping breaks free.
// Carriers whistle in to fetch cocoons. Dawdle and the Thundercap comes hunting: its eye opens
// between lightning flashes, and only a level, lance-first bonk to the open eye pops it. The
// Classic Pond keeps the original endless waves.
//
// The Jousting Party seats two to four riders on the cabinet's `players` frames: the tourney or
// the pond in co-op (a team bonus for every wave nobody bonks a friend, and a scoop wakes a
// knocked teammate), or Last Butterfly Flapping, a three-minute free-for-all where the most bonks
// wins.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import type { MusicLoop } from '../sound'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  drawSprite,
  dropShadow,
  glow,
  hudPanel,
  rgba,
  shadedOrb,
  vignette as snesVignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  CARRIER_FRAMES,
  COCOON_SPRITES,
  COCOON_WARN_SPRITES,
  LIFE_SPRITE,
  RIDER_FRAMES,
  SEAT_LOOKS,
  cocoonSprites,
  drawFrog,
  drawFrogBubbles,
  drawPollen,
  drawSneeze,
  drawThundercap,
  drawTongue,
  seatFrames,
  type Frames,
  type WingSet,
} from '../butterflyJoust/art'
import {
  ARENAS,
  CHAMPIONS,
  CLASSIC_ARENA,
  PUFF_START,
  PUFF_STAND,
  WAVES_PER_ARENA,
  arenaAt,
  arenaHeat,
  crumbleAt,
  flowerState,
  thermalOn,
  type Arena,
  type LedgeLook,
  type LedgeSpec,
} from '../butterflyJoust/arenas'
import {
  COMBO_BOOST,
  FLAP_BOOST,
  FROG_BOOST,
  POLLEN_FOR,
  SHOP,
  WING_ITEMS,
  readJoustSave,
  shopPrice,
  type JoustSave,
  type ShopItem,
  type Upgrades,
} from '../butterflyJoust/campaign'
import {
  createChampion,
  type BoutCtx,
  type Champion,
} from '../butterflyJoust/champions'
import {
  CEILING,
  H,
  POND_Y,
  THICK,
  W,
  onLedge,
  wrapDx,
  wrapX,
  type Ledge,
} from '../butterflyJoust/field'
import {
  CHAMPION_MUSIC,
  GARDEN_MUSIC,
  MEADOW_MUSIC,
  SUNSET_MUSIC,
} from '../butterflyJoust/music'
import {
  CLASSIC_TIERS,
  GLIDE,
  POLLEN,
  ROSTER,
  type RiderKind,
} from '../butterflyJoust/roster'
import {
  CARRIER,
  CHARGE_COOLDOWN,
  CHARGE_FULL,
  COMBO_WINDOW,
  FROG,
  KNOCK_TICKS,
  LUNGE_TICKS,
  TEAM_BONUS,
  THUNDERCAP,
  VERSUS_HATCH,
  VERSUS_MOTHS,
  VERSUS_TICKS,
  WAVE_TYPES,
  classicWaveKind,
  comboExtra,
  comboMultiplier,
  lungeSpeed,
  partyLives,
  thundercapPhase,
  type WaveKind,
} from '../butterflyJoust/rules'
import {
  paintFlower,
  paintLeaf,
  paintLedges,
  paintLilyPond,
  paintMeadowSky,
  paintPond,
  paintPuff,
  paintSunsetSky,
  paintThermal,
  paintWind,
} from '../butterflyJoust/scenery'
import {
  drawArenaCard,
  drawChampionBar,
  drawGarden,
  drawMenu,
  drawResult,
  type GardenRow,
  type MenuRow,
} from '../butterflyJoust/screens'

export { wrapDx } from '../butterflyJoust/field'

const GRAVITY = 0.1
const FLAP = 1.9
const MAX_RISE = -3.2
const MAX_FALL = 3
const AIR_ACCEL = 0.06
const AIR_MAX = 2.2
const WALK_MAX = 1.4
const HALF_W = 9
const HALF_H = 8
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 20_000
const AUTO_FLAP_TICKS = 10
/** Riders within this many pixels of the same height bounce instead of bonking. */
const LEVEL_BAND = 6
/** Fresh into the arena (a new wave, a respawn, a hatch), a rider can't be hurt. */
const INVULN_TICKS = 120
/** How long an arena's title card shows. */
const CARD_TICKS = 150
/** The thermal lift stops speeding a flier up past this. */
const THERMAL_MAX_RISE = -1.8

/** The Classic Pond's ledge tops (y) and spans; the bottom ledge crumbles in later waves. */
export const JOUST_LEDGES: Ledge[] = CLASSIC_ARENA.ledges.map((l) => ({
  x0: l.x0,
  x1: l.x1,
  y: l.y,
}))

export const JOUST_CURVES = {
  rivals: { start: 2, step: 1, limit: 8 },
  hunterShare: { start: 0, step: 0.15, limit: 0.6 },
  shadowShare: { start: -0.16, step: 0.08, limit: 0.35 },
  riderSpeed: { start: 1.2, step: 0.08, limit: 2 },
  hatchTicks: { start: 600, step: -40, limit: 300 },
  stormAfter: { start: 60 * 45, step: -60 * 3, limit: 60 * 25 },
  stormSpeed: { start: 0.9, step: 0.06, limit: 1.5 },
  crumble: { start: -16, step: 8, limit: 56 },
} as const

/** A ledge in play: its spec, where it rests, and what it is doing now. */
type ArenaLedge = Ledge & {
  spec: LedgeSpec | null
  look: LedgeLook
  bx0: number
  bx1: number
  by: number
  /** Something can stand on it (a shut flower or a burst puff can't hold anyone). */
  solid: boolean
  /** How far it moved this tick (riders standing on it go with it). */
  dx: number
  dy: number
  /** A flower about to fold: 0..1. */
  closing: number
  /** A dandelion puff (it rises, and bursts after it is stood on). */
  puff: boolean
  stood: number
}

type Body = {
  x: number
  y: number
  vx: number
  vy: number
  ground: ArenaLedge | null
  flap: number
}

/** One seat's robot on its butterfly. */
export type Rider = Body & {
  seat: number
  facing: number
  /** In the arena (flying, or curled up knocked). */
  alive: boolean
  /** Ticks until a lost rider is back (it waits while no spare butterfly is left). */
  respawn: number
  invuln: number
  autoFlap: number
  /** Curled into a cocoon by a friend's bonk (co-op) or a rival's (versus): ticks left. */
  knocked: number
  /** The Air Combo: bonks since the last landing, the extra waiting to bank, ticks since a bonk. */
  combo: { bonks: number; pot: number; idle: number }
  /** The Charge Joust: brace ticks held, lunge ticks left, its speed, and the cooldown. */
  brace: number
  lunge: number
  lungeV: number
  chargeCool: number
  /** In the frog's grip. */
  held: boolean
  /** Sneezing from a pollen puff: ticks of lost control. */
  sneeze: number
  /** This seat's own points and bonks (the party's tallies). */
  points: number
  bonks: number
  /** The best combo multiplier this wave (the Air Ace medal). */
  bestCombo: number
  /** Recent positions for the combo streamer (cosmetic). */
  trail: { x: number; y: number }[]
  /** The attract pilot's brace timer. */
  pilotBrace: number
}

type Rival = Body & {
  kind: RiderKind
  dir: number
  targetY: number
  retarget: number
  cooldown: number
  /** Ticks left shimmering into the world; can't be bonked meanwhile. */
  spawn: number
  held: boolean
  /** A pollen bomber's wait before its next drop. */
  drop: number
}
type Cocoon = {
  x: number
  y: number
  vy: number
  ground: ArenaLedge | null
  hatch: number
  kind: RiderKind
  /** A carrier is on its way for it. */
  called: boolean
}
type Carrier = Body & {
  target: Cocoon | null
  /** Carrying a cocoon off to hatch it: ticks left. */
  carrying: number
  kind: RiderKind
  /** Fluttering off (bonked, or its cocoon was scooped): ticks left. */
  leaving: number
}
/** A pollen puff a bomber dropped: falling, then a lingering sneezy cloud. */
type Dust = { x: number; y: number; cloud: boolean; t: number }
type Storm = { x: number; y: number; t: number; popped: boolean }
type Prey = { kind: 'rider'; rider: Rider } | { kind: 'rival'; rival: Rival }
type Frog = {
  state: 'rest' | 'bubbles' | 'eyes' | 'snap' | 'hold' | 'sink'
  t: number
  x: number
  prey: Prey | null
  grip: number
}
type Wind = { state: 'calm' | 'tell' | 'blow'; t: number; dir: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color?: string
}
type Banner = { text: string; sub?: string; lines?: string[]; ticks: number }

/** What a game is: the tourney, the Classic Pond, or the party's versus. */
export type GameMode = 'tourney' | 'classic' | 'versus'
type MenuId = 'continue' | GameMode

function newRider(seat: number): Rider {
  return {
    seat,
    x: W / 2,
    y: 304 - HALF_H,
    vx: 0,
    vy: 0,
    ground: null,
    flap: 0,
    facing: 1,
    alive: true,
    respawn: 0,
    invuln: 0,
    autoFlap: 0,
    knocked: 0,
    combo: { bonks: 0, pot: 0, idle: 0 },
    brace: 0,
    lunge: 0,
    lungeV: 0,
    chargeCool: 0,
    held: false,
    sneeze: 0,
    points: 0,
    bonks: 0,
    bestCombo: 0,
    trail: [],
    pilotBrace: 0,
  }
}

function blankFrame(): InputFrame {
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

function clock(ticks: number): string {
  const s = Math.max(0, Math.ceil(ticks / 60))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function arenaLedge(
  spec: LedgeSpec | null,
  look: LedgeLook,
  at: Ledge,
): ArenaLedge {
  return {
    x0: at.x0,
    x1: at.x1,
    y: at.y,
    spec,
    look,
    bx0: at.x0,
    bx1: at.x1,
    by: at.y,
    solid: true,
    dx: 0,
    dy: 0,
    closing: 0,
    puff: false,
    stood: 0,
  }
}

class ButterflyJoust implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private seats = 1
  private mode: GameMode = 'tourney'
  /** Two or more riders sharing the tourney or the pond. */
  private coop = false
  /** The mode card, before a real game starts. */
  private menu: { pick: number } | null = null
  /** A saved tourney this game could pick up. */
  private offer: JoustSave | null = null
  private saveData: JoustSave | null | undefined = undefined

  // The tourney.
  private arenaIndex = 0
  private arena: Arena = CLASSIC_ARENA
  private lap = 0
  /** The wave within the arena: 1..6, then 7 for the champion bout. */
  private wave = 0
  private card = 0
  private garden: { pick: number; t: number } | null = null
  private champion: Champion | null = null
  private championBeaten = false
  private pollen = 0
  private up: Upgrades = { flap: 0, combo: 0, frog: 0 }
  private spares = 0
  private wings: WingSet[] = []
  private wear: WingSet = 'rainbow'
  private reached = 1

  private riders: Rider[] = []
  private rivals: Rival[] = []
  private cocoons: Cocoon[] = []
  private carriers: Carrier[] = []
  private dust: Dust[] = []
  private storm: Storm | null = null
  /** The Thundercap was popped this wave: it doesn't come back until the next. */
  private stormPopped = false
  private frog: Frog = { state: 'rest', t: 240, x: W / 2, prey: null, grip: 0 }
  private wind: Wind = { state: 'calm', t: 0, dir: 1 }
  private puffWait = 0
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private ledges: ArenaLedge[] = []
  /** Ticks of play in this arena: flowers, thermals and swaying ledges keep its time. */
  private arenaTicks = 0
  private waveKind: WaveKind = 'joust'
  private waveTicks = 0
  private collected = 0
  private hatched = 0
  private diedThisWave = false
  private friendlyBonk = false
  private firstBonk = false
  private clearing = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: Banner | null = null
  /** Last Butterfly Flapping: the clock, and the result card once it runs out. */
  private versusTicks = 0
  private result: { t: number; lines: string[] } | null = null
  private ctx: BoutCtx
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(53)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.seats = this.demo
      ? 1
      : Math.max(1, Math.min(4, Math.floor(options.players ?? 1)))
    this.riders = Array.from({ length: this.seats }, (_, i) => newRider(i))
    this.lives = partyLives(this.seats, START_LIVES)
    this.coop = this.seats > 1
    this.ctx = this.makeCtx()
    const stored = this.demo ? null : readJoustSave(options.resume)
    if (stored) {
      this.wings = [...stored.wings]
      this.wear = stored.wear
      this.reached = stored.reached
      this.saveData = stored
      if (stored.seats === this.seats && (stored.arena > 0 || stored.score > 0))
        this.offer = stored
    }
    if (!this.demo) this.menu = { pick: 0 }
    this.startArena(0)
  }

  /** Player 1's rider (the solo game's only one). */
  private get player(): Rider {
    return this.riders[0]!
  }

  get save(): unknown {
    return this.saveData
  }

  get music(): MusicLoop | null {
    if (this.demo || this.over || this.menu) return null
    if (this.garden) return GARDEN_MUSIC
    if (this.champion && !this.championBeaten) return CHAMPION_MUSIC
    return this.arena.style === 'meadow' ? MEADOW_MUSIC : SUNSET_MUSIC
  }

  // --- the mode card ---------------------------------------------------------------------

  private menuRows(): Array<MenuRow & { id: MenuId }> {
    const rows: Array<MenuRow & { id: MenuId }> = []
    if (this.offer) {
      const { arena } = arenaAt(this.offer.arena)
      rows.push({
        id: 'continue',
        name: 'CONTINUE',
        about: `${arena.name}${this.offer.continued ? ', FRESH BUTTERFLIES' : ''}`,
      })
    }
    rows.push({
      id: 'tourney',
      name: 'TOURNEY',
      about: this.seats > 1 ? 'THE FOUR GARDENS, TOGETHER' : 'THE FOUR GARDENS',
    })
    rows.push({
      id: 'classic',
      name: 'CLASSIC POND',
      about: 'ENDLESS WAVES AT SUNSET',
    })
    if (this.seats > 1)
      rows.push({
        id: 'versus',
        name: 'VERSUS',
        about: 'MOST BONKS IN 3 MINUTES',
      })
    return rows
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    const rows = this.menuRows()
    const step =
      input.pressed.up || input.pressed.left
        ? -1
        : input.pressed.down || input.pressed.right
          ? 1
          : 0
    if (step) {
      m.pick = (m.pick + step + rows.length) % rows.length
      this.sound.play('blip')
    }
    if (input.pressed.a || input.pressed.start) {
      const id = rows[m.pick]!.id
      this.menu = null
      this.sound.play('start')
      if (id === 'continue') this.resumeFrom(this.offer!)
      else this.startMode(id)
    }
  }

  private startMode(mode: GameMode) {
    this.mode = mode
    this.level = 0
    if (mode === 'versus') {
      this.coop = false
      this.card = 0
      this.lives = this.seats
      this.versusTicks = VERSUS_TICKS
      this.arena = CLASSIC_ARENA
      this.buildLedges(CLASSIC_ARENA)
      this.nextWave()
      this.banner = {
        text: 'LAST BUTTERFLY',
        sub: 'MOST BONKS IN 3 MINUTES',
        ticks: 150,
      }
      return
    }
    if (mode === 'classic') {
      this.arena = CLASSIC_ARENA
      this.buildLedges(CLASSIC_ARENA)
      this.card = 0
      this.nextWave()
      return
    }
    this.startArena(0)
  }

  // --- the tourney ------------------------------------------------------------------------

  /** Open an arena: its ledges, its title card, and its first wave. */
  private startArena(index: number) {
    const { arena, lap } = arenaAt(index)
    this.arenaIndex = index
    this.arena = arena
    this.lap = lap
    this.wave = 0
    this.arenaTicks = 0
    this.puffWait = 60
    this.wind = { state: 'calm', t: arena.wind?.every ?? 0, dir: 1 }
    this.buildLedges(arena)
    if (!this.demo && this.mode === 'tourney')
      this.reached = Math.max(this.reached, Math.min(ARENAS.length, index + 1))
    this.card = this.demo ? 60 : CARD_TICKS
    this.nextWave()
    this.keep()
  }

  /** Pick a saved tourney back up at its arena's start. */
  private resumeFrom(s: JoustSave) {
    this.mode = 'tourney'
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? partyLives(this.seats, START_LIVES) : s.lives
    this.nextExtra =
      (Math.floor(this.score / EXTRA_LIFE_EVERY) + 1) * EXTRA_LIFE_EVERY
    this.pollen = s.pollen
    this.up = { ...s.up }
    this.spares = s.spares
    this.wings = [...s.wings]
    this.wear = s.wear
    this.reached = s.reached
    this.level = s.arena * (WAVES_PER_ARENA + 1)
    this.startArena(s.arena)
  }

  /** Remember the run at this arena's start (a real tourney only). */
  private keep() {
    if (this.demo || this.menu || this.mode !== 'tourney') return
    this.saveData = {
      v: 1,
      arena: this.arenaIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      pollen: this.pollen,
      up: { ...this.up },
      spares: this.spares,
      wings: [...this.wings],
      wear: this.wear,
      seats: this.seats,
      continued: false,
      reached: this.reached,
    }
  }

  private buildLedges(arena: Arena) {
    const base: LedgeLook = arena.style === 'meadow' ? 'turf' : 'candy'
    this.ledges = arena.ledges.map((spec) =>
      arenaLedge(spec, spec.look ?? base, spec),
    )
    this.updateLedges()
  }

  /** The arena's difficulty step now (the curves read it). */
  private heat(): number {
    if (this.mode === 'tourney')
      return arenaHeat(this.arenaIndex, Math.min(this.wave, WAVES_PER_ARENA))
    if (this.mode === 'versus')
      return 2 + Math.floor(((VERSUS_TICKS - this.versusTicks) / 3600) * 3)
    return this.level
  }

  private nextWave() {
    this.level++
    if (this.mode === 'tourney') this.wave++
    this.startWave()
  }

  private startWave() {
    this.rivals = []
    this.cocoons = []
    this.carriers = []
    this.dust = []
    this.storm = null
    this.stormPopped = false
    this.champion = null
    this.championBeaten = false
    this.waveTicks = 0
    this.collected = 0
    this.hatched = 0
    this.diedThisWave = false
    this.friendlyBonk = false
    this.firstBonk = false
    this.clearing = 0
    this.frog = { state: 'rest', t: 60 * 6, x: W / 2, prey: null, grip: 0 }
    for (const r of this.riders) r.bestCombo = 0
    this.ledges = this.ledges.filter((l) => !l.puff)
    this.applyCrumble()
    if (this.mode === 'versus') {
      this.waveKind = 'joust'
      this.placeRiders()
      return
    }
    const bout = this.mode === 'tourney' && this.wave > WAVES_PER_ARENA
    if (bout) {
      this.waveKind = 'joust'
      this.champion = createChampion(this.arena.champion)
      const info = CHAMPIONS[this.arena.champion]
      this.banner = { text: info.name, sub: info.rule, ticks: 150 }
      this.placeRiders()
      return
    }
    let riders: RiderKind[]
    if (this.mode === 'tourney') {
      const spec = this.arena.waves[this.wave - 1]!
      this.waveKind = spec.kind
      riders = [...spec.riders]
      // A party faces one more rider for each extra seat.
      if (riders.length)
        for (let i = 1; i < this.seats; i++) riders.push('hunter')
    } else {
      this.waveKind = classicWaveKind(this.level, this.seats)
      const count =
        this.waveKind === 'cocoon'
          ? 0
          : Math.floor(levelCurve(this.level, JOUST_CURVES.rivals))
      riders = Array.from({ length: count }, () => this.rollKind(this.level))
    }
    if (this.waveKind === 'cocoon') this.layCocoons()
    riders.forEach((kind, i) => this.addRival(kind, i * 40))
    const type = WAVE_TYPES[this.waveKind]
    const title =
      this.mode === 'tourney'
        ? `WAVE ${this.arena.number}-${this.wave}`
        : `WAVE ${this.level}`
    this.banner = {
      text: this.waveKind === 'joust' ? title : type.title,
      sub:
        this.waveKind === 'joust'
          ? this.coop
            ? `TEAM BONUS ${TEAM_BONUS * this.seats}`
            : undefined
          : type.rule,
      ticks: 120,
    }
    this.placeRiders()
  }

  /** The crumbling ledge's span this wave. */
  private applyCrumble() {
    const c =
      this.mode === 'tourney'
        ? crumbleAt(this.arena, this.wave)
        : this.mode === 'classic'
          ? Math.max(0, levelCurve(this.level, JOUST_CURVES.crumble))
          : 0
    for (const l of this.ledges) {
      if (!l.spec?.crumbles) continue
      l.bx0 = l.spec.x0 + c
      l.bx1 = l.spec.x1 - c
      l.x0 = l.bx0
      l.x1 = l.bx1
    }
  }

  /** A cocoon wave: eight cocoons laid round the ledges, to scoop before they hatch. */
  private layCocoons() {
    const hatch =
      Math.round(levelCurve(this.heat(), JOUST_CURVES.hatchTicks)) + 480
    const perches = this.ledges.filter((l) => !l.spec?.fold && !l.spec?.move)
    for (let i = 0; i < 8; i++) {
      const ledge = perches[1 + (i % (perches.length - 1))] ?? perches[0]!
      const span = ledge.x1 - ledge.x0
      const x = wrapX(ledge.x0 + span * (0.25 + (0.5 * ((i * 37) % 7)) / 7))
      this.cocoons.push({
        x,
        y: ledge.y - 5,
        vy: 0,
        ground: ledge,
        hatch: hatch + i * 30,
        kind: 'drifter',
        called: false,
      })
    }
  }

  private rollKind(level: number): RiderKind {
    const hunters = levelCurve(level, JOUST_CURVES.hunterShare)
    const shadows = Math.max(0, levelCurve(level, JOUST_CURVES.shadowShare))
    const roll = this.rng()
    return CLASSIC_TIERS[roll < shadows ? 2 : roll < shadows + hunters ? 1 : 0]!
  }

  private addRival(kind: RiderKind, delay = 0, at?: { x: number; y: number }) {
    const spots = this.arena.spawns
    const spot = at ?? spots[Math.floor(this.rng() * spots.length)]!
    this.rivals.push({
      x: spot.x,
      y: spot.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: null,
      flap: 0,
      kind,
      dir: this.rng() < 0.5 ? -1 : 1,
      targetY: 120,
      retarget: 0,
      cooldown: 20,
      spawn: 50 + delay,
      held: false,
      drop: POLLEN.every,
    })
  }

  private homeLedge(): ArenaLedge {
    return this.ledges[this.arena.home] ?? this.ledges[0]!
  }

  /** Where a seat starts on the home ledge: spread out, P1 in the middle when solo. */
  private home(seat: number): number {
    const home = this.homeLedge()
    const mid = (home.x0 + home.x1) / 2
    return mid + (seat - (this.seats - 1) / 2) * 34
  }

  private placeRider(r: Rider) {
    const home = this.homeLedge()
    Object.assign(r, {
      x: this.home(r.seat),
      y: home.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: home,
      flap: 0,
      facing: r.seat % 2 === 0 ? 1 : -1,
      knocked: 0,
      brace: 0,
      lunge: 0,
      held: false,
      sneeze: 0,
      trail: [],
    })
    r.invuln = INVULN_TICKS
  }

  private placeRiders() {
    for (const r of this.riders) if (r.alive) this.placeRider(r)
  }

  // --- update ------------------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.over) return
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    if (this.result) {
      if (++this.result.t > 60 * 5) this.over = true
      return
    }
    if (this.garden) {
      this.updateGarden(input)
      return
    }
    if (this.card > 0) {
      this.card--
      return
    }
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.mode !== 'versus' && this.lives <= 0) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.clearing > 0) {
      if (--this.clearing <= 0) this.afterClear()
      return
    }

    this.waveTicks++
    this.arenaTicks++
    this.updateLedges()
    this.updatePuffs()
    this.updateWind()
    if (this.mode === 'versus') {
      this.updateVersus()
      if (this.result) return
    }
    for (const r of this.riders) {
      const frame = this.demo
        ? this.demoInput(r.seat)
        : r.seat === 0
          ? (players?.[0] ?? input)
          : (players?.[r.seat] ?? blankFrame())
      this.moveRider(r, frame)
    }
    this.moveRivals()
    this.moveCocoons()
    this.moveCarriers()
    this.moveDust()
    this.moveStorm()
    this.moveFrog()
    this.updateChampion()
    this.collide()
    if (this.mode !== 'versus') this.checkWave()
  }

  /** A wave's bell has rung: the next wave, or after a champion, the Wing Garden. */
  private afterClear() {
    if (this.mode === 'tourney' && this.wave > WAVES_PER_ARENA) {
      if (this.demo) this.startArena(this.arenaIndex + 1)
      else {
        this.garden = { pick: 0, t: 0 }
        this.sound.play('level')
      }
      return
    }
    this.nextWave()
  }

  private updateVersus() {
    if (--this.versusTicks <= 0) {
      this.finishVersus()
      return
    }
    // Keep the arena busy: moths drift back in as they are bonked, tougher as the clock runs.
    const busy =
      this.rivals.length +
      this.cocoons.length +
      this.carriers.filter((c) => !c.leaving).length
    if (busy < VERSUS_MOTHS && this.waveTicks % 90 === 0) {
      this.addRival(this.rollKind(this.heat()))
    }
  }

  private finishVersus() {
    const best = Math.max(...this.riders.map((r) => r.bonks))
    const winners = this.riders.filter((r) => r.bonks === best)
    const lines = [
      winners.length > 1
        ? 'A DEAD HEAT!'
        : `${SEAT_LOOKS[winners[0]!.seat]!.name} WINS!`,
      this.riders
        .map((r) => `${SEAT_LOOKS[r.seat]!.name} ${r.bonks}`)
        .join('   '),
    ]
    this.result = { t: 0, lines }
    this.sound.play('level')
    this.banner = null
  }

  // --- the arena engine --------------------------------------------------------------------

  /** Swaying ledges move, flowers open and fold, puffs rise and burst. */
  private updateLedges() {
    const t = this.arenaTicks
    for (const l of this.ledges) {
      const spec = l.spec
      l.dx = 0
      l.dy = 0
      if (spec?.move) {
        const m = spec.move
        const a = ((t + (m.phase ?? 0)) / m.period) * Math.PI * 2
        const nx = l.bx0 + Math.sin(a) * m.ax
        const ny = l.by + Math.sin(a * 2) * m.ay
        l.dx = nx - l.x0
        l.dy = ny - l.y
        l.x0 = nx
        l.x1 = nx + (l.bx1 - l.bx0)
        l.y = ny
      }
      if (spec?.fold) {
        const state = flowerState(spec.fold, t)
        if (l.solid && !state.open) this.sound.play('warn')
        l.solid = state.open
        l.closing = state.closing
      }
      if (l.puff) {
        const rise = this.arena.puffs?.rise ?? 0.4
        l.y -= rise
        l.dy = -rise
        if (l.stood > 0) l.stood++
        if (l.stood > PUFF_STAND || l.y < CEILING + 30) {
          l.solid = false
          this.burst((l.x0 + l.x1) / 2, l.y, 10, '#ffffff')
        }
      }
    }
    this.ledges = this.ledges.filter((l) => !l.puff || l.solid)
  }

  /** Dandelion puffs float up from the meadow now and then. */
  private updatePuffs() {
    const spec = this.arena.puffs
    if (!spec || this.mode !== 'tourney') return
    if (--this.puffWait > 0) return
    this.puffWait = spec.every
    const x = 30 + Math.floor(this.rng() * (W - 60))
    const l = arenaLedge(null, 'puff', {
      x0: x - spec.width / 2,
      x1: x + spec.width / 2,
      y: PUFF_START,
    })
    l.puff = true
    this.ledges.push(l)
  }

  /** Gusts: a tell, then the wind blows one way for a while. */
  private updateWind() {
    const spec = this.arena.wind
    if (!spec) return
    const w = this.wind
    if (--w.t > 0) return
    if (w.state === 'calm') {
      w.state = 'tell'
      w.t = spec.tell
      w.dir = this.rng() < 0.5 ? -1 : 1
      this.sound.play('warn')
    } else if (w.state === 'tell') {
      w.state = 'blow'
      w.t = spec.length
    } else {
      w.state = 'calm'
      w.t = spec.every
    }
  }

  private flapBody(b: Body, strength = FLAP) {
    b.vy = Math.max(MAX_RISE, b.vy - strength)
    b.ground = null
    b.flap = 8
  }

  private riderFlap(): number {
    return this.mode === 'tourney'
      ? FLAP * (1 + FLAP_BOOST * this.up.flap)
      : FLAP
  }

  /**
   * Gravity, ledges (solid ones, carrying whoever stands on a moving one), thermals, wind, the
   * ceiling and the wrap for any flier. A glider falls slower. Returns true if it fell in the pond.
   */
  private physics(b: Body, maxSpeed: number, glide = false): boolean {
    if (b.flap > 0) b.flap--
    if (b.ground && (!b.ground.solid || !this.ledges.includes(b.ground)))
      b.ground = null
    if (b.ground) {
      const l = b.ground
      b.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, b.vx))
      b.x = wrapX(b.x + b.vx + l.dx)
      if (!onLedge(l, b.x)) b.ground = null
      else {
        b.y = l.y - HALF_H
        b.vy = 0
        return false
      }
    }
    b.vx = Math.max(-maxSpeed, Math.min(maxSpeed, b.vx * 0.995))
    b.vy = Math.min(
      glide ? GLIDE.maxFall : MAX_FALL,
      b.vy + (glide ? GLIDE.gravity : GRAVITY),
    )
    this.lift(b)
    if (this.wind.state === 'blow' && this.arena.wind)
      b.vx += this.wind.dir * this.arena.wind.push * 0.03
    const prevTop = b.y - HALF_H
    const prevBottom = b.y + HALF_H
    b.x = wrapX(b.x + b.vx)
    b.y += b.vy
    for (const l of this.ledges) {
      if (!l.solid || !onLedge(l, b.x)) continue
      if (
        b.vy >= 0 &&
        prevBottom <= l.y + Math.max(0, -l.dy) &&
        b.y + HALF_H >= l.y
      ) {
        b.y = l.y - HALF_H
        b.vy = 0
        b.ground = l
        if (l.puff && l.stood === 0) l.stood = 1
      } else if (
        b.vy < 0 &&
        prevTop >= l.y + THICK &&
        b.y - HALF_H <= l.y + THICK
      ) {
        b.y = l.y + THICK + HALF_H
        b.vy = 0.6
      }
    }
    if (b.y - HALF_H < CEILING) {
      b.y = CEILING + HALF_H
      b.vy = Math.abs(b.vy) * 0.4
    }
    return b.y > POND_Y
  }

  /** A lit thermal lifts any flier inside it. */
  private lift(b: Body) {
    for (const th of this.arena.thermals) {
      if (this.mode !== 'tourney' || !thermalOn(th, this.arenaTicks)) continue
      if (Math.abs(wrapDx(th.x, b.x)) > th.w / 2 || b.y < th.top) continue
      b.vy = Math.max(THERMAL_MAX_RISE, b.vy - th.lift)
    }
  }

  /** Riders in the arena and able to joust. */
  private active(): Rider[] {
    return this.riders.filter((r) => r.alive && r.knocked === 0)
  }

  private moveRider(r: Rider, input: InputFrame) {
    if (!r.alive) {
      this.waitRespawn(r)
      return
    }
    if (r.invuln > 0) r.invuln--
    if (r.knocked > 0) {
      this.moveKnocked(r)
      return
    }
    if (r.sneeze > 0) {
      // ACHOO: half a second with no say in it.
      r.sneeze--
      input = blankFrame()
    }
    // The flap: tap A; holding A keeps flapping at a steady beat for touch players.
    if (r.autoFlap > 0) r.autoFlap--
    const tapped = input.pressed.a
    const auto = !tapped && input.held.a && r.autoFlap === 0
    if (r.held) {
      // In the frog's grip: only flapping hard breaks free.
      if (tapped || auto) {
        r.autoFlap = AUTO_FLAP_TICKS
        r.flap = 8
        this.frog.grip -= tapped ? 1 : 0.5
        r.y -= FROG.tug
        this.sound.play('blip')
      }
      this.updateTrail(r)
      return
    }
    let dx = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (dx && r.lunge === 0) r.facing = dx
    if (r.ground) {
      r.vx = dx ? r.vx + dx * 0.15 : r.vx * 0.8
    } else if (dx) {
      r.vx += dx * AIR_ACCEL
    }
    if (tapped || auto) {
      this.flapBody(r, this.riderFlap())
      r.autoFlap = AUTO_FLAP_TICKS
      if (this.tick % 2 === 0) this.sound.play('blip')
    }
    this.charge(r, input)
    const wasAir = !r.ground
    const max = r.lunge > 0 ? r.lungeV : AIR_MAX
    if (r.lunge > 0) r.vx = r.facing * r.lungeV
    if (this.physics(r, max)) {
      this.splash(r)
      return
    }
    // Landing banks the Air Combo.
    if (wasAir && r.ground) this.bankCombo(r)
    if (r.combo.bonks > 0 && ++r.combo.idle > this.comboWindow())
      this.bankCombo(r)
    this.updateTrail(r)
  }

  private comboWindow(): number {
    return this.mode === 'tourney'
      ? COMBO_WINDOW + COMBO_BOOST * this.up.combo
      : COMBO_WINDOW
  }

  /** The Charge Joust: hold B to brace (wings back), let go to lunge. */
  private charge(r: Rider, input: InputFrame) {
    if (r.chargeCool > 0) r.chargeCool--
    if (r.lunge > 0) {
      r.lunge--
      return
    }
    if (input.held.b && r.chargeCool === 0) {
      r.brace = Math.min(CHARGE_FULL, r.brace + 1)
      // Wings back: a brace bleeds speed.
      r.vx *= 0.94
      return
    }
    if (r.brace > 0) {
      const v = lungeSpeed(r.brace)
      r.brace = 0
      if (v > 0) {
        r.lunge = LUNGE_TICKS
        r.lungeV = v
        r.chargeCool = CHARGE_COOLDOWN
        r.ground = null
        r.vy = Math.min(r.vy, -0.4)
        this.sound.play('shoot')
        this.fx.burst(r.x - r.facing * 12, r.y, this.fxRng, {
          count: 6,
          speed: 1.2,
          colours: [RAMPS.gold[4], '#ffffff'],
        })
      }
    }
  }

  private updateTrail(r: Rider) {
    if (r.combo.bonks >= 2 || r.lunge > 0) {
      r.trail.unshift({ x: r.x, y: r.y })
      if (r.trail.length > 14) r.trail.length = 14
    } else if (r.trail.length) {
      r.trail.pop()
    }
  }

  /** A knocked rider is a cocoon: it falls to a ledge (or bobs on the pond) until it hatches. */
  private moveKnocked(r: Rider) {
    if (r.ground && (!r.ground.solid || !onLedge(r.ground, r.x)))
      r.ground = null
    if (!r.ground) {
      const prev = r.y
      r.vy = Math.min(MAX_FALL, r.vy + GRAVITY)
      r.y += r.vy
      for (const l of this.ledges) {
        if (l.solid && onLedge(l, r.x) && prev + 5 <= l.y && r.y + 5 >= l.y) {
          r.y = l.y - 5
          r.vy = 0
          r.ground = l
        }
      }
      if (r.y > POND_Y - 4) {
        r.y = POND_Y - 4
        r.vy = 0
      }
    } else {
      r.x = wrapX(r.x + r.ground.dx)
      r.y = r.ground.y - 5
    }
    if (--r.knocked <= 0) this.wake(r)
  }

  private wake(r: Rider) {
    r.knocked = 0
    r.invuln = INVULN_TICKS
    r.ground = null
    r.vy = -2.5
    r.y -= 4
    this.fx.burst(r.x, r.y, this.fxRng, {
      count: 10,
      colours: [SEAT_LOOKS[r.seat]!.ramp[3], RAMPS.gold[4]],
    })
    this.sound.play('pickup')
  }

  /** A lost rider comes back while a spare butterfly is left; otherwise it waits on the bench. */
  private waitRespawn(r: Rider) {
    if (r.respawn > 0) {
      r.respawn--
      return
    }
    const inPlay = this.riders.filter((o) => o.alive).length
    if (this.mode === 'versus' || this.lives > inPlay) {
      r.alive = true
      this.placeRider(r)
    }
  }

  private moveRivals() {
    const speed = levelCurve(this.heat(), JOUST_CURVES.riderSpeed)
    const targets = this.active()
    for (const r of this.rivals) {
      if (r.spawn > 0) {
        r.spawn--
        continue
      }
      if (r.held) {
        // Struggling in the frog's grip.
        if (this.tick % 20 === 0) {
          r.flap = 8
          this.frog.grip -= 1
        }
        continue
      }
      const spec = ROSTER[r.kind]
      if (--r.retarget <= 0) {
        r.retarget = 60 + Math.floor(this.rng() * 60)
        if (spec.ai === 'drift') {
          r.targetY = 60 + this.rng() * 200
          if (this.rng() < 0.25) r.dir = -r.dir
        }
      }
      const prey = this.nearest(r, targets)
      if (r.cooldown > 0) r.cooldown--
      if (spec.ai === 'glide') {
        this.glide(r, prey)
      } else {
        if (prey && spec.ai !== 'drift') {
          // Hunters chase your height; shadows climb over you; bombers hover high above.
          const over = spec.ai === 'shadow' ? 28 : spec.ai === 'bomb' ? 72 : 6
          r.targetY = Math.max(CEILING + 20, prey.y - over)
          const toward = Math.sign(wrapDx(r.x, prey.x)) || r.dir
          if (r.retarget % 20 === 0 || spec.ai === 'bomb') r.dir = toward
        }
        if (spec.ai === 'bomb') this.bomb(r, prey)
        r.vx += r.dir * (r.ground ? 0.15 : 0.05)
        const wantsUp = r.y > r.targetY + 4 || (r.y > POND_Y - 50 && r.vy > 0)
        if (wantsUp && r.cooldown === 0) {
          this.flapBody(r)
          r.cooldown = spec.flapGap + Math.floor(this.rng() * 6)
        }
      }
      if (this.physics(r, speed * spec.speed, spec.ai === 'glide')) {
        r.spawn = -1
        this.burst(r.x, POND_Y, 10, '#7dd3fc')
        this.sound.play('pop')
      }
    }
    this.rivals = this.rivals.filter((r) => r.spawn >= 0)
  }

  /** A glider never flaps: it heads for a lit thermal, circles up it, then glides at you. */
  private glide(r: Rival, prey: Rider | null) {
    let th = null as Arena['thermals'][number] | null
    let best = Infinity
    if (this.mode === 'tourney') {
      for (const t of this.arena.thermals) {
        if (!thermalOn(t, this.arenaTicks)) continue
        const d = Math.abs(wrapDx(r.x, t.x))
        if (d < best) {
          best = d
          th = t
        }
      }
    }
    const inside = th && Math.abs(wrapDx(th.x, r.x)) < th.w / 2
    if (th && inside && r.y > th.top + 12) {
      if (Math.abs(wrapDx(th.x, r.x)) > th.w / 2 - 6)
        r.dir = Math.sign(wrapDx(r.x, th.x)) || r.dir
    } else if (th && !inside && r.y > th.top + 40) {
      r.dir = Math.sign(wrapDx(r.x, th.x)) || r.dir
    } else if (prey) {
      r.dir = Math.sign(wrapDx(r.x, prey.x)) || r.dir
    }
    r.vx += r.dir * 0.05
    // Only to keep out of the pond does it ever beat its wings.
    if (r.y > POND_Y - 34 && r.vy > 0 && r.cooldown === 0) {
      this.flapBody(r)
      r.cooldown = 50
    }
  }

  /** A pollen bomber drops a sneezy puff when it is over its prey. */
  private bomb(r: Rival, prey: Rider | null) {
    if (r.drop > 0) {
      r.drop--
      return
    }
    if (!prey || Math.abs(wrapDx(r.x, prey.x)) > 18 || prey.y - r.y < 24) return
    this.dust.push({ x: r.x, y: r.y + 10, cloud: false, t: 0 })
    r.drop = POLLEN.every + Math.floor(this.rng() * 60)
    this.sound.play('pop')
  }

  private moveDust() {
    for (const d of this.dust) {
      d.t++
      if (d.cloud) continue
      d.y += POLLEN.fall
      const hit = this.ledges.some(
        (l) => l.solid && onLedge(l, d.x) && d.y >= l.y - 4 && d.y <= l.y + 4,
      )
      if (hit || d.t > 80 || d.y > POND_Y - 6) {
        d.cloud = true
        d.t = 0
      }
    }
    this.dust = this.dust.filter((d) => !d.cloud || d.t < POLLEN.cloud)
  }

  private nearest<T extends { x: number; y: number }>(
    from: { x: number; y: number },
    list: readonly T[],
  ): T | null {
    let best: T | null = null
    let bestD = Infinity
    for (const t of list) {
      const d = Math.abs(wrapDx(from.x, t.x)) + Math.abs(t.y - from.y)
      if (d < bestD) {
        bestD = d
        best = t
      }
    }
    return best
  }

  private carriersActive(): boolean {
    if (this.mode === 'versus') return true
    if (this.mode === 'tourney') return this.arena.carriers
    return this.level >= CARRIER.from
  }

  private moveCocoons() {
    for (const c of this.cocoons) {
      if (!c.called) c.hatch--
      if (c.ground && (!c.ground.solid || !this.ledges.includes(c.ground)))
        c.ground = null
      if (c.ground) {
        if (!onLedge(c.ground, c.x)) c.ground = null
        else {
          c.x = wrapX(c.x + c.ground.dx)
          c.y = c.ground.y - 5
        }
      } else {
        const prev = c.y
        c.vy = Math.min(MAX_FALL, c.vy + GRAVITY)
        c.y += c.vy
        for (const l of this.ledges) {
          if (l.solid && onLedge(l, c.x) && prev + 5 <= l.y && c.y + 5 >= l.y) {
            c.y = l.y - 5
            c.vy = 0
            c.ground = l
          }
        }
      }
      if (c.hatch === 60 && !c.called) this.sound.play('warn')
      if (c.hatch <= 0 && !c.called) {
        this.hatched++
        if (this.carriersActive()) {
          // A carrier whistles in to fetch it; scoop it first, or bonk the carrier.
          c.called = true
          this.callCarrier(c)
        } else {
          // Out pops a tougher rider.
          this.addRival(ROSTER[c.kind].hatch, -20, { x: c.x, y: c.y + 5 })
          c.hatch = -999
        }
      }
    }
    this.cocoons = this.cocoons.filter((c) => c.hatch > -999 && c.y < POND_Y)
  }

  private callCarrier(c: Cocoon) {
    const fromLeft = c.x < W / 2
    this.carriers.push({
      x: fromLeft ? 2 : W - 2,
      y: 50 + this.rng() * 60,
      vx: 0,
      vy: 0,
      ground: null,
      flap: 0,
      target: c,
      carrying: 0,
      kind: c.kind,
      leaving: 0,
    })
    this.playWhistle()
  }

  private playWhistle() {
    if (this.sound.playNotes) {
      this.sound.playNotes([
        { freq: 1568, to: 2093, dur: 0.12, type: 'sine', vol: 0.05 },
        { freq: 2093, to: 1319, dur: 0.18, type: 'sine', vol: 0.05, at: 0.14 },
      ])
    } else this.sound.play('warn')
  }

  private moveCarriers() {
    for (const c of this.carriers) {
      if (c.flap > 0) c.flap--
      if (this.tick % 9 === 0) c.flap = 8
      if (c.leaving > 0) {
        c.leaving--
        c.y -= 0.9
        c.x = wrapX(c.x + c.vx)
        continue
      }
      if (c.carrying > 0) {
        c.y = Math.max(CEILING + 20, c.y - 0.7)
        if (--c.carrying <= 0) {
          // It hatches on the wing: a tougher rider takes the reins.
          this.addRival(ROSTER[c.kind].hatch, -50, { x: c.x, y: c.y + HALF_H })
          c.leaving = -1
          this.sound.play('warn')
        }
        continue
      }
      const target = c.target
      if (!target || !this.cocoons.includes(target)) {
        c.leaving = 40
        c.vx = c.x < W / 2 ? -1 : 1
        continue
      }
      const dx = wrapDx(c.x, target.x)
      const dy = target.y - 4 - c.y
      const len = Math.hypot(dx, dy) || 1
      c.vx = (dx / len) * CARRIER.speed
      c.vy = (dy / len) * CARRIER.speed
      c.x = wrapX(c.x + c.vx)
      c.y += c.vy
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
        this.cocoons = this.cocoons.filter((o) => o !== target)
        c.target = null
        c.carrying = CARRIER.carry
      }
    }
    this.carriers = this.carriers.filter((c) => c.leaving >= 0)
  }

  private moveStorm() {
    if (this.mode === 'versus') {
      if (!this.storm && this.versusTicks === 60 * 90) this.summonStorm()
    } else if (!this.storm && !this.champion) {
      const after =
        this.waveKind === 'storm'
          ? 120
          : this.waveKind === 'cocoon'
            ? -1
            : Math.round(levelCurve(this.heat(), JOUST_CURVES.stormAfter))
      if (this.waveTicks === after && !this.stormPopped) this.summonStorm()
    }
    const s = this.storm
    if (!s) return
    s.t++
    const speed = levelCurve(this.heat(), JOUST_CURVES.stormSpeed)
    const prey = this.nearest(s, this.active())
    if (!prey) return
    const dx = wrapDx(s.x, prey.x)
    const dy = prey.y - s.y
    const len = Math.hypot(dx, dy) || 1
    // It holds still to flash, then hunts.
    const k = thundercapPhase(s.t) === 'flash' ? 0.25 : 1
    s.x = wrapX(s.x + (dx / len) * speed * k)
    s.y += (dy / len) * speed * k + Math.sin(s.t / 12) * 0.4
    s.y = Math.max(CEILING + 16, Math.min(POND_Y - 24, s.y))
  }

  private summonStorm() {
    this.storm = {
      x: this.rng() < 0.5 ? 4 : W - 4,
      y: 50,
      t: THUNDERCAP.flash + THUNDERCAP.open,
      popped: false,
    }
    this.banner = {
      text: 'THUNDERCAP!',
      sub: 'BONK ITS OPEN EYE, LEVEL',
      ticks: 100,
    }
    this.sound.play('warn')
  }

  // --- the champion bout ------------------------------------------------------------------

  private makeCtx(): BoutCtx {
    return {
      rng: () => this.rng(),
      riders: () => this.active().filter((r) => !r.held),
      ledges: () => this.ledges.filter((l) => l.solid),
      hurt: (r) => this.loseLife(r as Rider),
      hit: (r, points, x, y) => {
        const rider = r as Rider
        this.comboBonk(rider, points, x, y)
        rider.vy = Math.min(rider.vy, -2)
        rider.ground = null
      },
      push: (r, vx, vy) => {
        const rider = r as Rider
        rider.vx = vx
        rider.vy += vy
        rider.ground = null
      },
      spawn: (kind, x, y) => this.addRival(kind, 0, { x, y }),
      burst: (x, y, count, colour) => this.burst(x, y, count, colour),
      play: (name) => this.sound.play(name),
      say: (text, sub) => {
        this.banner = { text, sub, ticks: 100 }
      },
    }
  }

  private updateChampion() {
    const c = this.champion
    if (!c) return
    c.update(this.ctx)
    if (c.done && !this.championBeaten) {
      this.championBeaten = true
      const info = CHAMPIONS[c.id]
      const share = Math.floor(info.points / this.riders.length)
      for (const r of this.riders) this.addScore(share, undefined, undefined, r)
      this.gainPollen(POLLEN_FOR.champion)
      this.banner = {
        text: 'CHAMPION BESTED!',
        sub: `${info.name} +${share * this.riders.length}`,
        ticks: 150,
      }
      this.burst(c.x, c.y, 40, RAMPS.gold[4])
      this.fx.burst(c.x, c.y, this.fxRng, { count: 30, speed: 2.6 })
      this.sound.play('extra')
    }
  }

  // --- the Pond Frog ----------------------------------------------------------------------

  private frogActive(): boolean {
    if (this.mode === 'versus') return true
    if (this.mode === 'tourney') return this.wave >= this.arena.frogFrom
    return this.level >= FROG.from
  }

  /** The nearest open water to x: the frog can't surface under a low ledge. */
  private openWater(x: number): number {
    for (const l of this.ledges) {
      if (l.puff || l.y < POND_Y - 40) continue
      const lo = l.x0 - 16
      const hi = l.x1 + 16
      if (!onLedge({ x0: lo, x1: hi, y: l.y }, x)) continue
      const dl = Math.abs(wrapDx(x, wrapX(lo)))
      const dh = Math.abs(wrapDx(x, wrapX(hi)))
      return dl < dh ? wrapX(lo) : wrapX(hi)
    }
    return x
  }

  /** Fliers low over open water, close enough to tempt the frog. */
  private preyList(): Prey[] {
    const line = POND_Y - FROG.reach
    const tempting = (b: Body) =>
      b.y + HALF_H > line && Math.abs(wrapDx(this.openWater(b.x), b.x)) < 24
    const list: Prey[] = []
    for (const r of this.active()) {
      if (r.invuln <= 0 && tempting(r)) list.push({ kind: 'rider', rider: r })
    }
    for (const r of this.rivals) {
      if (r.spawn <= 0 && tempting(r)) list.push({ kind: 'rival', rival: r })
    }
    return list
  }

  private preyBody(p: Prey): Body {
    return p.kind === 'rider' ? p.rider : p.rival
  }

  private frogGrip(): number {
    return this.mode === 'tourney'
      ? FROG.grip - FROG_BOOST * this.up.frog
      : FROG.grip
  }

  private moveFrog() {
    const f = this.frog
    if (!this.frogActive()) return
    switch (f.state) {
      case 'rest': {
        if (--f.t > 0) return
        const prey = this.preyList()
        if (!prey.length) {
          f.t = 30
          return
        }
        const body = this.preyBody(prey[Math.floor(this.rng() * prey.length)]!)
        f.x = this.openWater(wrapX(body.x + (this.rng() - 0.5) * 30))
        f.state = 'bubbles'
        f.t = FROG.bubbles
        this.croak(false)
        return
      }
      case 'bubbles':
      case 'eyes': {
        // It drifts under the lowest flier near it.
        const near = this.preyList()
          .map((p) => this.preyBody(p))
          .filter((b) => Math.abs(wrapDx(f.x, b.x)) < 90)
          .sort((a, b) => b.y - a.y)[0]
        if (near) {
          const dx = wrapDx(f.x, near.x)
          const step = f.state === 'bubbles' ? 0.6 : 0.35
          f.x = this.openWater(wrapX(f.x + Math.max(-step, Math.min(step, dx))))
        }
        if (--f.t > 0) return
        if (f.state === 'bubbles') {
          f.state = 'eyes'
          f.t = FROG.eyes
          return
        }
        const target = this.preyList()
          .filter(
            (p) => Math.abs(wrapDx(f.x, this.preyBody(p).x)) < FROG.snapWidth,
          )
          .sort((a, b) => this.preyBody(b).y - this.preyBody(a).y)[0]
        if (!target) {
          f.state = 'sink'
          f.t = 30
          return
        }
        f.prey = target
        f.state = 'snap'
        f.t = FROG.flick
        this.croak(true)
        return
      }
      case 'snap': {
        if (--f.t > 0) return
        const p = f.prey
        const body = p ? this.preyBody(p) : null
        const still =
          p &&
          body &&
          (p.kind === 'rider'
            ? p.rider.alive && p.rider.knocked === 0 && !p.rider.held
            : this.rivals.includes(p.rival)) &&
          Math.abs(wrapDx(f.x, body.x)) < FROG.snapWidth + 8 &&
          body.y + HALF_H > POND_Y - FROG.reach - 12
        if (!still || !p) {
          f.prey = null
          f.state = 'sink'
          f.t = 30
          return
        }
        f.state = 'hold'
        f.grip = p.kind === 'rider' ? this.frogGrip() : 5
        if (p.kind === 'rider') {
          p.rider.held = true
          p.rider.ground = null
          p.rider.lunge = 0
          p.rider.brace = 0
          this.banner = { text: 'FLAP! FLAP! FLAP!', ticks: 60 }
        } else {
          p.rival.held = true
          p.rival.ground = null
        }
        this.sound.play('warn')
        return
      }
      case 'hold': {
        const p = f.prey!
        const body = this.preyBody(p)
        body.vx = 0
        body.vy = 0
        body.x = wrapX(
          body.x + Math.max(-0.6, Math.min(0.6, wrapDx(body.x, f.x))),
        )
        body.y += FROG.pull
        if (f.grip <= 0) {
          this.breakFree(p)
          return
        }
        if (body.y + HALF_H >= POND_Y + 4) {
          // Pulled under: a cartoon gulp and a splash.
          this.releasePrey(p)
          if (p.kind === 'rider') this.splash(p.rider)
          else {
            this.rivals = this.rivals.filter((r) => r !== p.rival)
            this.burst(body.x, POND_Y, 12, '#7dd3fc')
            this.sound.play('pop')
          }
          f.prey = null
          f.state = 'sink'
          f.t = 40
        }
        return
      }
      case 'sink': {
        if (--f.t > 0) return
        f.state = 'rest'
        f.t = FROG.rest + Math.floor(this.rng() * FROG.restSpread)
        return
      }
    }
  }

  private releasePrey(p: Prey) {
    if (p.kind === 'rider') p.rider.held = false
    else p.rival.held = false
  }

  private breakFree(p: Prey) {
    const f = this.frog
    const body = this.preyBody(p)
    this.releasePrey(p)
    body.vy = -3.2
    body.flap = 8
    f.prey = null
    f.state = 'sink'
    f.t = 50
    this.burst(body.x, body.y + 8, 10, RAMPS.pink[3])
    if (p.kind === 'rider') {
      p.rider.invuln = Math.max(p.rider.invuln, 45)
      this.addScore(FROG.escapeBonus, body.x, body.y - 16, p.rider)
      this.banner = { text: 'BROKE FREE!', ticks: 60 }
      this.sound.play('pickup')
    }
  }

  private croak(snap: boolean) {
    if (this.sound.playNotes) {
      this.sound.playNotes(
        snap
          ? [{ freq: 520, to: 1200, dur: 0.08, type: 'square', vol: 0.05 }]
          : [
              { freq: 110, to: 80, dur: 0.12, type: 'square', vol: 0.06 },
              {
                freq: 98,
                to: 70,
                dur: 0.14,
                type: 'square',
                vol: 0.06,
                at: 0.16,
              },
            ],
      )
    } else this.sound.play(snap ? 'shoot' : 'blip')
  }

  // --- collisions -------------------------------------------------------------------------

  private collide() {
    for (const p of this.active()) {
      if (!p.alive || p.knocked > 0) continue
      if (this.collideStorm(p)) continue
      if (this.champion && !p.held && this.champion.touch(this.ctx, p)) continue
      if (!p.alive) continue
      if (this.collideRivals(p)) continue
      this.collideDust(p)
      this.collideCarriers(p)
      this.collideCocoons(p)
    }
    this.collideRiders()
  }

  /** The Thundercap: deadly, unless you meet its open eye level and lance first. */
  private collideStorm(p: Rider): boolean {
    const s = this.storm
    if (!s || p.held) return false
    const dx = wrapDx(p.x, s.x)
    const dy = s.y - p.y
    if (Math.abs(dx) >= 24 || Math.abs(dy) >= 18) return false
    const open = thundercapPhase(s.t) === 'open'
    const lanceFirst = Math.sign(dx) === p.facing || p.lunge > 0
    if (open && Math.abs(dy) < THUNDERCAP.eyeH && lanceFirst) {
      this.popStorm(p)
      return true
    }
    if (p.invuln > 0) return false
    this.loseLife(p)
    return true
  }

  private popStorm(p: Rider) {
    const s = this.storm!
    this.comboBonk(p, THUNDERCAP.points, s.x, s.y - 16)
    if (this.waveKind === 'storm') {
      this.addScore(WAVE_TYPES.storm.bonus, s.x, s.y - 30, p)
      this.banner = {
        text: 'THUNDERCAP POPPED!',
        sub: 'STORM BONUS',
        ticks: 90,
      }
    }
    this.burst(s.x, s.y, 30, '#93c5fd')
    this.fx.burst(s.x, s.y, this.fxRng, {
      count: 18,
      speed: 2.2,
      colours: [RAMPS.sky[4], RAMPS.gold[4], RAMPS.teal[3]],
    })
    this.sound.play('boom')
    this.storm = null
    this.stormPopped = true
    p.vy = -2.5
  }

  private collideRivals(p: Rider): boolean {
    for (const r of this.rivals) {
      if (r.spawn > 0 || r.held || p.held) continue
      const dx = wrapDx(p.x, r.x)
      const dy = r.y - p.y
      if (Math.abs(dx) > HALF_W * 2 - 2 || Math.abs(dy) > HALF_H * 2 - 2)
        continue
      if (Math.abs(dy) < LEVEL_BAND) {
        if (p.lunge > 0) {
          // A Charge Joust wins the level clash.
          this.bonk(p, r)
          return false
        }
        // Level joust: both bounce apart.
        const push = Math.sign(dx) || 1
        p.vx = -push * 2
        r.vx = push * 2
        r.dir = push
        this.sound.play('blip')
      } else if (dy > 0) {
        this.bonk(p, r)
        return false
      } else if (p.invuln <= 0) {
        this.loseLife(p)
        return true
      }
    }
    return false
  }

  /** Flying through a pollen puff: a sneeze. */
  private collideDust(p: Rider) {
    if (p.sneeze > 0 || p.invuln > 0 || p.held) return
    for (const d of this.dust) {
      const reach = d.cloud ? POLLEN.radius : 7
      if (Math.abs(wrapDx(p.x, d.x)) < reach && Math.abs(d.y - p.y) < reach) {
        p.sneeze = POLLEN.sneeze
        p.vx = -p.facing * 1.6
        p.lunge = 0
        p.brace = 0
        this.floaters.push({
          x: p.x,
          y: p.y - 20,
          text: 'ACHOO!',
          life: 40,
          color: RAMPS.gold[4],
        })
        this.sound.play('pop')
        return
      }
    }
  }

  private collideCarriers(p: Rider) {
    for (const c of this.carriers) {
      if (c.leaving !== 0 || p.held) continue
      const dx = wrapDx(p.x, c.x)
      const dy = c.y - p.y
      if (Math.abs(dx) > 16 || Math.abs(dy) > 14) continue
      if (dy >= LEVEL_BAND || p.lunge > 0) {
        // Bonked: it drops what it carries and flutters off, dizzy.
        this.comboBonk(p, CARRIER.points, c.x, c.y - 14)
        this.gainPollen(POLLEN_FOR.carrier)
        this.burst(c.x, c.y, 10, RAMPS.cream[3])
        this.sound.play('shoot')
        p.vy = Math.min(p.vy, -1.2)
        if (c.carrying > 0) {
          this.cocoons.push({
            x: c.x,
            y: c.y + 4,
            vy: 0,
            ground: null,
            hatch: CARRIER.regrace,
            kind: c.kind,
            called: false,
          })
        } else if (c.target) {
          c.target.called = false
          c.target.hatch = CARRIER.regrace
        }
        c.target = null
        c.carrying = 0
        c.leaving = 40
        c.vx = Math.sign(dx) || 1
      } else {
        // Carriers are harmless: a bump.
        const push = Math.sign(dx) || 1
        p.vx = -push * 1.6
      }
    }
  }

  private collideCocoons(p: Rider) {
    if (p.held) return
    for (let i = this.cocoons.length - 1; i >= 0; i--) {
      const c = this.cocoons[i]!
      if (Math.abs(wrapDx(p.x, c.x)) < 13 && Math.abs(c.y - p.y) < 14) {
        this.cocoons.splice(i, 1)
        this.collected++
        let points = Math.min(1000, 250 * this.collected)
        if (!c.ground) points += 500
        this.addScore(points, c.x, c.y - 12, p)
        this.gainPollen(POLLEN_FOR.scoop)
        this.fx.burst(c.x, c.y, this.fxRng, {
          count: 8,
          colours: [RAMPS.leaf[4], RAMPS.gold[4], RAMPS.pink[3]],
        })
        this.sound.play('pickup')
      }
    }
  }

  /** Riders meeting each other: friends bounce or knock (co-op); rivals joust (versus). */
  private collideRiders() {
    const list = this.riders.filter((r) => r.alive && !r.held)
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!
        const b = list[j]!
        const dx = wrapDx(a.x, b.x)
        const dy = b.y - a.y
        if (Math.abs(dx) > HALF_W * 2 - 2 || Math.abs(dy) > HALF_H * 2 - 2)
          continue
        if (a.knocked > 0 || b.knocked > 0) {
          // A co-op scoop wakes a knocked friend.
          if (!this.coop) continue
          const [sleeper, friend] = a.knocked > 0 ? [a, b] : [b, a]
          if (friend.knocked > 0) continue
          this.wake(sleeper)
          this.addScore(250, sleeper.x, sleeper.y - 16, friend)
          this.floaters.push({
            x: sleeper.x,
            y: sleeper.y - 28,
            text: 'RESCUE!',
            life: 50,
            color: SEAT_LOOKS[friend.seat]!.ramp[3],
          })
          continue
        }
        if (a.invuln > 0 || b.invuln > 0) continue
        const level = Math.abs(dy) < LEVEL_BAND
        let winner: Rider | null = null
        if (level) {
          if (a.lunge > 0 && b.lunge === 0) winner = a
          else if (b.lunge > 0 && a.lunge === 0) winner = b
        } else winner = dy > 0 ? a : b
        if (!winner) {
          const push = Math.sign(dx) || 1
          a.vx = -push * 2
          b.vx = push * 2
          this.sound.play('blip')
          continue
        }
        const loser = winner === a ? b : a
        this.knockRider(winner, loser)
      }
    }
  }

  private knockRider(winner: Rider, loser: Rider) {
    loser.knocked = this.mode === 'versus' ? VERSUS_HATCH : KNOCK_TICKS
    loser.ground = null
    loser.vy = -1
    loser.lunge = 0
    loser.brace = 0
    loser.combo = { bonks: 0, pot: 0, idle: 0 }
    winner.vy = Math.min(winner.vy, -1.2)
    this.burst(loser.x, loser.y, 14, SEAT_LOOKS[loser.seat]!.ramp[3])
    this.sound.play('shoot')
    if (this.mode === 'versus') {
      winner.bonks++
      this.comboBonk(winner, ROSTER.hunter.points, loser.x, loser.y - 14, false)
    } else {
      // Co-op: a friendly bonk costs the wave's team bonus.
      this.friendlyBonk = true
      this.floaters.push({
        x: loser.x,
        y: loser.y - 22,
        text: 'OOPS!',
        life: 50,
        color: RAMPS.ember[3],
      })
    }
  }

  private bonk(p: Rider, r: Rival) {
    const spec = ROSTER[r.kind]
    this.rivals = this.rivals.filter((other) => other !== r)
    if (this.mode === 'versus') p.bonks++
    this.comboBonk(p, spec.points, r.x, r.y - 14)
    if (this.waveKind === 'gladiator' && !this.firstBonk) {
      this.firstBonk = true
      this.addScore(WAVE_TYPES.gladiator.bonus, r.x, r.y - 28, p)
      this.banner = { text: 'FIRST BONK!', sub: 'GLADIATOR BONUS', ticks: 80 }
    }
    this.firstBonk = true
    this.burst(r.x, r.y, 14, spec.spark)
    this.fx.burst(r.x, r.y, this.fxRng, { count: 12 })
    this.sound.play('shoot')
    p.vy = Math.min(p.vy, -1.2)
    const hatch = Math.round(levelCurve(this.heat(), JOUST_CURVES.hatchTicks))
    // Twin riders split: a cocoon for each moth.
    for (let i = 0; i < spec.cocoons; i++) {
      this.cocoons.push({
        x: wrapX(r.x + (spec.cocoons > 1 ? (i ? 9 : -9) : 0)),
        y: r.y,
        vy: -1 - i * 0.4,
        ground: null,
        hatch: hatch + i * 40,
        kind: r.kind,
        called: false,
      })
    }
    if (spec.cocoons > 1) {
      this.floaters.push({
        x: r.x,
        y: r.y - 26,
        text: 'SPLIT!',
        life: 40,
        color: RAMPS.pink[3],
      })
    }
  }

  // --- the Air Combo ----------------------------------------------------------------------

  /** A bonk: its points now, and the multiplier's extra onto the streamer to bank on landing. */
  private comboBonk(
    p: Rider,
    base: number,
    x: number,
    y: number,
    showBase = true,
  ) {
    const c = p.combo
    // A bonk from a standstill on a ledge still starts a combo; it banks on the next landing.
    c.bonks++
    c.idle = 0
    const mult = comboMultiplier(c.bonks)
    c.pot += comboExtra(base, c.bonks)
    p.bestCombo = Math.max(p.bestCombo, mult)
    if (showBase) this.addScore(base, x, y, p)
    else this.addScore(base, undefined, undefined, p)
    this.gainPollen(POLLEN_FOR.bonk)
    if (mult >= 2) {
      this.floaters.push({
        x,
        y: y - 12,
        text: `X${mult}`,
        life: 45,
        color: RAMPS.pink[3],
      })
    }
    if (p.ground) this.bankCombo(p)
  }

  private bankCombo(p: Rider) {
    const c = p.combo
    if (c.pot > 0 && !this.demo) {
      const mult = comboMultiplier(c.bonks)
      this.addScore(c.pot, undefined, undefined, p)
      this.gainPollen(POLLEN_FOR.combo * (mult - 1))
      this.floaters.push({
        x: p.x,
        y: p.y - 26,
        text: `COMBO X${mult} +${c.pot}`,
        life: 70,
        color: RAMPS.gold[4],
      })
      this.sound.play('extra')
    }
    p.combo = { bonks: 0, pot: 0, idle: 0 }
  }

  private gainPollen(n: number) {
    if (this.demo || this.mode !== 'tourney' || n <= 0) return
    this.pollen = Math.min(99_999, this.pollen + n)
  }

  // --- lives ------------------------------------------------------------------------------

  private splash(p: Rider) {
    this.burst(p.x, POND_Y, 16, '#7dd3fc')
    this.loseLife(p, true)
  }

  private loseLife(p: Rider, splashed = false) {
    if (!p.alive) return
    if (p.held) this.frog.prey = null
    p.alive = false
    p.held = false
    p.knocked = 0
    p.lunge = 0
    p.brace = 0
    p.sneeze = 0
    p.trail = []
    if (p.combo.pot > 0) {
      this.floaters.push({
        x: p.x,
        y: p.y - 20,
        text: 'COMBO LOST',
        life: 50,
        color: RAMPS.steel[3],
      })
    }
    p.combo = { bonks: 0, pot: 0, idle: 0 }
    if (!splashed) this.burst(p.x, p.y, 24, '#5eead4')
    this.sound.play('die')
    if (this.mode === 'versus') {
      p.respawn = VERSUS_HATCH
      return
    }
    this.lives--
    this.diedThisWave = true
    p.respawn = 90
    if (this.lives <= 0) {
      this.banner = { text: 'GAME OVER', ticks: 9999 }
      // The save stays at this arena's start, to pick up with fresh butterflies.
      if (this.saveData && this.mode === 'tourney')
        this.saveData = { ...this.saveData, continued: true }
    }
  }

  private checkWave() {
    if (
      this.rivals.length ||
      this.cocoons.length ||
      this.carriers.some((c) => c.leaving === 0)
    )
      return
    if (this.champion && (!this.champion.done || this.champion.busy())) return
    const lines: string[] = []
    const lead = this.active()[0] ?? this.player
    // Wave bonuses are shared evenly round the party's tallies.
    const pay = (points: number, line: string) => {
      const share = Math.floor(points / this.riders.length)
      for (const r of this.riders) this.addScore(share, undefined, undefined, r)
      lines.push(`${line} ${share * this.riders.length}`)
    }
    if (this.waveKind === 'survival' && !this.diedThisWave)
      pay(WAVE_TYPES.survival.bonus, 'SURVIVAL')
    if (this.waveKind === 'cocoon' && this.hatched === 0)
      pay(WAVE_TYPES.cocoon.bonus, 'ALL SCOOPED')
    if (this.coop && !this.friendlyBonk) {
      pay(
        this.waveKind === 'team'
          ? WAVE_TYPES.team.bonus * this.seats
          : TEAM_BONUS * this.seats,
        'TEAM',
      )
    }
    for (const r of this.riders) this.bankCombo(r)
    this.gainPollen(POLLEN_FOR.wave)
    this.banner = this.champion
      ? (this.banner ?? { text: 'CHAMPION BESTED!', ticks: 100 })
      : { text: 'WAVE CLEAR!', lines, ticks: 100 }
    this.sound.play('level')
    this.fx.burst(lead.x, lead.y, this.fxRng, { count: 16 })
    this.storm = null
    this.stormPopped = false
    this.dust = []
    this.clearing = this.champion ? 160 : 100
    // A rider in the frog's grip at the bell goes free.
    if (this.frog.prey) this.releasePrey(this.frog.prey)
    this.frog.prey = null
  }

  private addScore(points: number, x?: number, y?: number, who?: Rider) {
    if (this.demo || points <= 0) return
    this.score += points
    if (who) who.points += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.mode !== 'versus' && this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      const p = who ?? this.player
      this.fx.burst(p.x, p.y, this.fxRng, { count: 14 })
      this.banner = { text: 'EXTRA BUTTERFLY!', ticks: 90 }
    }
  }

  /** The bonk and splash bursts (cosmetic: their own dice). */
  private burst(x: number, y: number, count: number, color: string) {
    const rand = this.fxRng
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const s = 0.5 + rand() * 2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(rand() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.05
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- the Wing Garden ---------------------------------------------------------------------

  private owned(item: ShopItem): number {
    switch (item.id) {
      case 'spare':
        return this.spares
      case 'flap':
      case 'combo':
      case 'frog':
        return this.up[item.id]
      case 'morpho':
      case 'monarch':
      case 'swallowtail':
        return this.wings.includes(item.id) ? 1 : 0
      default:
        return 0
    }
  }

  private gardenRows(): GardenRow[] {
    return SHOP.map((item) => {
      const owned = this.owned(item)
      const maxed = item.id !== 'go' && owned >= item.max
      const wing = (WING_ITEMS as readonly string[]).includes(item.id)
      const price = item.id === 'go' || maxed ? null : shopPrice(item, owned)
      return {
        name: item.name,
        about: item.about,
        price,
        action:
          item.id === 'go'
            ? 'A'
            : wing
              ? this.wear === item.id
                ? 'WORN'
                : 'WEAR'
              : 'MAX',
        affordable: price === null || this.pollen >= price,
      }
    })
  }

  private updateGarden(input: InputFrame) {
    const g = this.garden!
    g.t++
    const step = input.pressed.up ? -1 : input.pressed.down ? 1 : 0
    if (step) {
      g.pick = (g.pick + step + SHOP.length) % SHOP.length
      this.sound.play('blip')
    }
    if (input.pressed.b) {
      this.leaveGarden()
      return
    }
    if (!input.pressed.a && !input.pressed.start) return
    const item = SHOP[g.pick]!
    if (item.id === 'go') {
      this.leaveGarden()
      return
    }
    const owned = this.owned(item)
    const wing = (WING_ITEMS as readonly string[]).includes(item.id)
    if (wing && owned) {
      // Owned wings: wear them, or go back to the rainbow.
      this.wear = this.wear === item.id ? 'rainbow' : (item.id as WingSet)
      this.sound.play('pickup')
      return
    }
    const price = shopPrice(item, owned)
    if (owned >= item.max || this.pollen < price) {
      this.sound.play('warn')
      return
    }
    this.pollen -= price
    switch (item.id) {
      case 'spare':
        this.spares++
        this.lives++
        break
      case 'flap':
      case 'combo':
      case 'frog':
        this.up[item.id]++
        break
      default:
        this.wings.push(item.id as WingSet)
        this.wear = item.id as WingSet
    }
    this.sound.play('extra')
  }

  private leaveGarden() {
    this.garden = null
    this.sound.play('start')
    this.startArena(this.arenaIndex + 1)
  }

  // --- attract-mode pilot ------------------------------------------------------------------

  /** The pilot for a seat: the attract demo flies seat 1 with it. */
  demoInput(seat = 0): InputFrame {
    const frame = blankFrame()
    const held = frame.held
    if (this.menu) {
      frame.pressed.a = this.tick % 30 === 0
      return frame
    }
    if (this.garden) {
      frame.pressed.a = this.garden.t > 90 && this.garden.pick === 0
      return frame
    }
    const p = this.riders[seat]
    if (!p || !p.alive || p.knocked > 0) return frame
    if (p.held) {
      // Mash to break the frog's grip.
      frame.pressed.a = this.tick % 3 === 0
      return frame
    }
    let goalX = W / 2
    let goalY = 140
    const s = this.storm
    const cocoon = this.cocoons
      .slice()
      .sort(
        (a, b) => Math.abs(wrapDx(p.x, a.x)) - Math.abs(wrapDx(p.x, b.x)),
      )[0]
    // Prefer riders level with or below us: the ones above are the danger.
    const cost = (r: { x: number; y: number }) =>
      Math.abs(wrapDx(p.x, r.x)) + Math.max(0, p.y - r.y) * 1.5
    const rival = this.rivals
      .filter((r) => r.spawn <= 0 && !r.held)
      .sort((a, b) => cost(a) - cost(b))[0]
    const carrier = this.carriers
      .filter((c) => c.leaving === 0)
      .sort((a, b) => cost(a) - cost(b))[0]
    let busy = false
    if (s) {
      const sdx = wrapDx(p.x, s.x)
      busy = Math.abs(sdx) < 110 && Math.abs(s.y - p.y) < 90
      const phase = thundercapPhase(s.t)
      const openLeft =
        THUNDERCAP.flash +
        THUNDERCAP.open -
        (((s.t % THUNDERCAP.cycle) + THUNDERCAP.cycle) % THUNDERCAP.cycle)
      if (busy && phase === 'open' && openLeft > 24) {
        // Meet the open eye level, lance first.
        goalX = s.x
        goalY = s.y
      } else if (busy) {
        // Keep clear until the eye opens.
        goalX = wrapX(s.x + (sdx < 0 ? 140 : -140))
        goalY = s.y > 170 ? 80 : 250
      }
    }
    const champ = this.champion
    let flee = false
    if (!busy && champ && (!champ.done || champ.busy()) && !rival) {
      const goal = champ.goal(p)
      goalX = goal.x
      goalY = goal.y
      flee = goal.flee === true
      busy = true
    }
    if (!busy) {
      if (cocoon && (!rival || cocoon.hatch < 200 || cocoon.called)) {
        goalX = cocoon.x
        goalY = cocoon.y - 4
      } else if (carrier && (!rival || cost(carrier) < cost(rival))) {
        goalX = carrier.x
        goalY = carrier.y - 20
      } else if (rival) {
        goalX = rival.x
        goalY = rival.y - 22
      }
    }
    // Back away from any rider bearing down from above.
    const threat = [
      ...this.rivals.filter((r) => r.spawn <= 0),
      ...(champ ? champ.threats() : []),
    ].find(
      (r) => r.y < p.y - 3 && p.y - r.y < 70 && Math.abs(wrapDx(p.x, r.x)) < 50,
    )
    if (threat) goalX = wrapX(p.x - Math.sign(wrapDx(p.x, threat.x)) * 60)
    // Steer round pollen.
    const puff = this.dust.find(
      (d) => Math.abs(wrapDx(p.x, d.x)) < 40 && Math.abs(d.y - p.y) < 40,
    )
    if (puff) goalX = wrapX(p.x - (Math.sign(wrapDx(p.x, puff.x)) || 1) * 50)
    // Stay out of the frog's reach while it shows its tell.
    if (
      (this.frog.state === 'bubbles' || this.frog.state === 'eyes') &&
      Math.abs(wrapDx(p.x, this.frog.x)) < 60
    )
      goalY = Math.min(goalY, POND_Y - FROG.reach - 30)
    // A ledge between us and a goal above it: fly round its nearer end.
    const roof = this.ledges.find(
      (l) => l.solid && l.y < p.y - HALF_H && l.y > goalY && onLedge(l, p.x),
    )
    if (roof && Math.abs(wrapDx(p.x, goalX)) < 80) {
      const left = Math.abs(wrapDx(p.x, roof.x0))
      const right = Math.abs(wrapDx(p.x, roof.x1))
      goalX = wrapX(left < right ? roof.x0 - 18 : roof.x1 + 18)
    }
    // A champion closing in at our height: climb over it.
    const climb =
      champ !== null &&
      !champ.done &&
      !flee &&
      Math.abs(wrapDx(p.x, champ.x)) < 80 &&
      p.y > champ.y - 22
    const dx = wrapDx(p.x, goalX)
    if (dx < -6) held.left = true
    else if (dx > 6) held.right = true
    const low = p.y > goalY + 4 || (p.y > POND_Y - 60 && !p.ground)
    const sinking = p.y > POND_Y - 44 && p.vy > -0.5
    // Off a flower before it folds, off a puff before it bursts.
    const shaky =
      p.ground !== null &&
      (p.ground.closing > 0.3 || (p.ground.puff && p.ground.stood > 60))
    if (
      ((low && !threat) || sinking || shaky) &&
      p.vy > -1 &&
      this.tick % 4 === 0
    ) {
      frame.pressed.a = true
    }
    if (climb && p.vy > -2.4 && this.tick % 3 === 0) frame.pressed.a = true
    // A level rider just ahead: brace, then lunge through.
    const level = this.rivals.find(
      (r) =>
        r.spawn <= 0 &&
        Math.abs(r.y - p.y) < LEVEL_BAND &&
        Math.sign(wrapDx(p.x, r.x)) === p.facing &&
        Math.abs(wrapDx(p.x, r.x)) < 90,
    )
    if (p.pilotBrace > 0) {
      p.pilotBrace--
      held.b = p.pilotBrace > 0
    } else if (level && p.chargeCool === 0 && p.lunge === 0) {
      p.pilotBrace = 16
      held.b = true
    }
    return frame
  }

  // --- render ------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.garden) {
      this.renderGarden(g)
      return
    }
    const meadow = this.arena.style === 'meadow'
    if (meadow) paintMeadowSky(g, this.tick)
    else paintSunsetSky(g, this.tick)
    for (const th of this.arena.thermals) {
      if (this.mode !== 'tourney') break
      this.wrapDraw(th.x, (x) =>
        paintThermal(
          g,
          x,
          th.w,
          th.top,
          thermalOn(th, this.arenaTicks),
          this.tick,
        ),
      )
    }
    this.renderLedges(g)
    if (meadow) paintLilyPond(g, this.tick)
    else paintPond(g, this.tick)
    this.renderFrog(g)
    for (const c of this.cocoons)
      this.wrapDraw(c.x, (x) => this.renderCocoon(g, c, x))
    for (const c of this.carriers)
      this.wrapDraw(c.x, (x) => this.renderCarrier(g, c, x))
    for (const d of this.dust) {
      this.wrapDraw(d.x, (x) =>
        drawPollen(
          g,
          x,
          d.y,
          d.cloud,
          POLLEN.radius,
          d.cloud ? d.t / POLLEN.cloud : 0,
          this.tick,
        ),
      )
    }
    for (const r of this.rivals)
      this.wrapDraw(r.x, (x) => this.renderRival(g, r, x))
    if (this.champion) this.champion.render(g, this.tick)
    for (const r of this.riders) this.renderPlayer(g, r)
    if (this.storm) this.wrapDraw(this.storm.x, (x) => this.renderStorm(g, x))
    if (this.wind.state === 'blow') paintWind(g, this.wind.dir, 1, this.tick)
    this.renderSparks(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color ?? RAMPS.gold[3],
        outline: INK,
      })
    }
    snesVignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.card > 0 && !this.menu) {
      drawArenaCard(g, {
        number: this.arena.number,
        name: this.arena.name,
        intro: this.arena.intro,
        lap: this.lap,
        t: CARD_TICKS - this.card,
      })
    }
    if (this.menu) {
      drawMenu(g, {
        title: this.seats > 1 ? 'JOUSTING PARTY' : 'BUTTERFLY JOUST',
        subtitle:
          this.seats > 1 ? `${this.seats} RIDERS` : 'THE FOUR GARDENS TOURNEY',
        rows: this.menuRows(),
        pick: this.menu.pick,
        tick: this.tick,
      })
      // Each seat's rider, lit up over the dimmed arena, flapping its own wings.
      for (const r of this.riders) {
        drawSprite(
          g,
          seatFrames(r.seat, r.seat === 0 ? this.wear : undefined)[
            (this.tick + r.seat * 4) % 16 < 8 ? 0 : 1
          ],
          Math.round(r.x) - 16,
          Math.round(r.y) - 17,
          { anchor: 'topleft', flipX: r.facing < 0 },
        )
      }
    }
    if (this.result) drawResult(g, this.result.lines)
  }

  /** Static ledges come from a cached layer; moving, folding and puff ledges draw each frame. */
  private renderLedges(g: CanvasRenderingContext2D) {
    const fixed = this.ledges.filter(
      (l) => !l.puff && !l.spec?.move && !l.spec?.fold,
    )
    const crumble = fixed.find((l) => l.spec?.crumbles)
    paintLedges(
      g,
      fixed,
      `${this.arena.id}-${crumble ? `${crumble.x0}-${crumble.x1}` : 'whole'}`,
    )
    for (const l of this.ledges) {
      if (l.puff) {
        paintPuff(g, l, l.stood / PUFF_STAND, this.tick)
      } else if (l.spec?.fold) {
        paintFlower(g, l, l.solid, l.closing, this.tick)
      } else if (l.spec?.move) {
        this.wrapDraw((l.x0 + l.x1) / 2, (x) => {
          const half = (l.x1 - l.x0) / 2
          paintLeaf(g, { x0: x - half, x1: x + half, y: l.y })
        })
      }
    }
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    const { arena } = arenaAt(this.arenaIndex + 1)
    drawGarden(g, {
      pollen: this.pollen,
      lives: this.lives,
      rows: this.gardenRows(),
      pick: this.garden!.pick,
      wear: this.wear,
      next: arena.name,
      tick: this.tick,
    })
  }

  /** Draw something twice when it straddles the wrapping edge. */
  private wrapDraw(x: number, draw: (x: number) => void) {
    draw(x)
    if (x < 24) draw(x + W)
    if (x > W - 24) draw(x - W)
  }

  private renderFrog(g: CanvasRenderingContext2D) {
    const f = this.frog
    if (!this.frogActive() || f.state === 'rest') return
    const lookX = f.prey ? this.preyBody(f.prey).x : this.player.x
    this.wrapDraw(f.x, (x) => {
      if (f.state === 'bubbles') {
        drawFrogBubbles(g, x, POND_Y, this.tick)
        return
      }
      if (f.state === 'eyes') {
        const rise = Math.min(0.5, (FROG.eyes - f.t) / FROG.eyes)
        drawFrog(g, x, POND_Y, rise, lookX + (x - f.x))
        return
      }
      if (f.state === 'sink') {
        drawFrog(g, x, POND_Y, Math.max(0, f.t / 50) * 0.8, lookX)
        return
      }
      const mouthY = POND_Y - 2
      drawFrog(g, x, POND_Y, 1, lookX + (x - f.x), true)
      if (f.prey) {
        const body = this.preyBody(f.prey)
        const tx = x + wrapDx(f.x, body.x)
        let ty = body.y + 4
        let tipX = tx
        if (f.state === 'snap') {
          // The flick: the tip races up toward its prey.
          const k = 1 - f.t / FROG.flick
          ty = mouthY + (ty - mouthY) * k
          tipX = x + (tx - x) * k
        }
        drawTongue(g, x, mouthY, tipX, ty)
      }
    })
  }

  private renderShadow(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    ground: Ledge | null,
  ) {
    let top = ground ? ground.y : Infinity
    if (!ground) {
      for (const l of this.ledges) {
        if (l.solid && l.y >= y + HALF_H && l.y < top && onLedge(l, wrapX(x)))
          top = l.y
      }
    }
    const gap = top - (y + HALF_H)
    if (gap > 64) return
    const k = 1 - gap / 64
    dropShadow(g, x, top, 4 + 6 * k, 1 + k, 0.4 * k)
  }

  private renderRider(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    flap: number,
    ground: Ledge | null,
    frames: Frames,
    alpha?: number,
    wingsBack = false,
  ) {
    const up = wingsBack || flap > 4 || Math.floor(this.tick / 8) % 2 === 0
    if (alpha === undefined) this.renderShadow(g, x, y, ground)
    drawSprite(
      g,
      up ? frames[0] : frames[1],
      Math.round(x) - 16,
      Math.round(y) - 17,
      { anchor: 'topleft', flipX: facing < 0, alpha },
    )
  }

  private renderPlayer(g: CanvasRenderingContext2D, r: Rider) {
    if (!r.alive) return
    const look = SEAT_LOOKS[r.seat]!
    if (r.knocked > 0) {
      const sprites = cocoonSprites(look.ramp)
      const wiggle = r.knocked < 60 ? Math.sin(this.tick / 2) : 0
      this.wrapDraw(r.x, (x) => {
        glow(g, x, r.y, 14, look.ramp[3], 0.3)
        drawSprite(
          g,
          Math.abs(wiggle) > 0.4 ? sprites[1] : sprites[0],
          x,
          r.y,
          {
            flipX: wiggle < 0,
          },
        )
        if (this.seats > 1)
          drawText(g, look.name, x, r.y - 18, {
            align: 'center',
            color: look.ramp[3],
            outline: INK,
          })
      })
      return
    }
    if (r.invuln > 0 && Math.floor(r.invuln / 6) % 2 === 0 && !r.held) return
    this.renderStreamer(g, r)
    const frames = seatFrames(r.seat, r.seat === 0 ? this.wear : undefined)
    this.wrapDraw(r.x, (x) => {
      if (r.brace > 0) {
        // Bracing: the lance glints, brighter as the brace builds.
        const k = r.brace / CHARGE_FULL
        glow(
          g,
          x + r.facing * 18,
          r.y - 1,
          6 + 8 * k,
          RAMPS.gold[4],
          0.3 + 0.4 * k,
        )
      }
      this.renderRider(
        g,
        x,
        r.y,
        r.facing,
        r.flap,
        r.ground,
        frames,
        undefined,
        r.brace > 0,
      )
      if (r.sneeze > 0) drawSneeze(g, x, r.y, this.tick)
      if (this.seats > 1)
        drawText(g, look.name, x, r.y - 24, {
          align: 'center',
          color: look.ramp[3],
          outline: INK,
        })
      if (r.combo.bonks >= 2) {
        drawText(
          g,
          `X${comboMultiplier(r.combo.bonks)}`,
          x - r.facing * 20,
          r.y - 16,
          {
            align: 'center',
            color: RAMPS.gold[4],
            outline: INK,
          },
        )
      }
    })
  }

  /** The Air Combo's rainbow streamer (and a lunge's speed trail). */
  private renderStreamer(g: CanvasRenderingContext2D, r: Rider) {
    if (r.trail.length < 2) return
    const bands = [
      RAMPS.ember[2],
      RAMPS.gold[2],
      RAMPS.leaf[3],
      RAMPS.sky[3],
      RAMPS.purple[3],
    ]
    const combo = r.combo.bonks >= 2
    const width = combo ? Math.min(5, comboMultiplier(r.combo.bonks) + 1) : 2
    for (let i = 1; i < r.trail.length; i++) {
      const a = r.trail[i - 1]!
      const b = r.trail[i]!
      if (Math.abs(a.x - b.x) > W / 2) continue
      const alpha = 0.85 * (1 - i / r.trail.length)
      const x = Math.round(Math.min(a.x, b.x) - r.facing * 10)
      const w = Math.max(2, Math.round(Math.abs(a.x - b.x)) + 2)
      const wave = Math.round(Math.sin((this.tick + i * 3) / 4))
      for (let k = 0; k < width; k++) {
        g.fillStyle = rgba(combo ? bands[k]! : '#ffffff', alpha)
        g.fillRect(x, Math.round(b.y - 1 + k - width / 2 + wave), w, 1)
      }
    }
  }

  private renderRival(g: CanvasRenderingContext2D, r: Rival, x: number) {
    let alpha: number | undefined
    if (r.spawn > 0) {
      // Shimmering into the world.
      alpha = 0.3 + 0.3 * Math.sin(this.tick / 3)
      glow(g, x, r.y - 4, 22, RAMPS.purple[3], 0.35)
    }
    const glider = r.kind === 'glider'
    this.renderRider(
      g,
      x,
      r.y,
      Math.sign(r.vx) || r.dir,
      glider ? 0 : r.flap,
      r.ground,
      RIDER_FRAMES[r.kind],
      alpha,
      glider && Math.floor(this.tick / 30) % 2 === 0,
    )
  }

  private renderCarrier(g: CanvasRenderingContext2D, c: Carrier, x: number) {
    const alpha = c.leaving > 0 ? c.leaving / 40 : undefined
    const facing = Math.sign(c.vx) || 1
    this.renderRider(g, x, c.y, facing, c.flap, null, CARRIER_FRAMES, alpha)
    if (c.carrying > 0) {
      // The cocoon dangling from its feet, wiggling to hatch.
      const sprites = COCOON_WARN_SPRITES
      drawSprite(g, this.tick % 8 < 4 ? sprites[0] : sprites[1], x, c.y + 12)
    }
    if (c.leaving > 0) {
      // Dizzy stars.
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 8 + (i * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 9),
          Math.round(c.y - 16 + Math.sin(a) * 3),
          2,
          2,
        )
      }
    }
  }

  private renderCocoon(g: CanvasRenderingContext2D, c: Cocoon, x: number) {
    const urgent = c.called || c.hatch < 60
    const wiggle =
      c.hatch < 120 || c.called ? Math.sin(this.tick / (urgent ? 1.5 : 3)) : 0
    const warn = urgent && Math.floor(this.tick / 5) % 2 === 1
    const sprites = warn ? COCOON_WARN_SPRITES : COCOON_SPRITES
    if (c.ground) dropShadow(g, x, c.ground.y + 1, 5, 1.5, 0.4)
    if (c.hatch < 120 || c.called) {
      glow(g, x, c.y, 13, warn ? RAMPS.gold[3] : RAMPS.leaf[3], 0.35)
    }
    drawSprite(g, Math.abs(wiggle) > 0.35 ? sprites[1] : sprites[0], x, c.y, {
      flipX: wiggle < 0,
    })
  }

  private renderStorm(g: CanvasRenderingContext2D, x: number) {
    const s = this.storm!
    const prey = this.nearest(s, this.active())
    const phase = thundercapPhase(s.t)
    const at = ((s.t % THUNDERCAP.cycle) + THUNDERCAP.cycle) % THUNDERCAP.cycle
    const charge =
      phase === 'shut'
        ? (at - THUNDERCAP.flash - THUNDERCAP.open) /
          (THUNDERCAP.cycle - THUNDERCAP.flash - THUNDERCAP.open)
        : 0
    drawThundercap(
      g,
      x,
      s.y,
      phase,
      this.tick,
      {
        dx: prey ? wrapDx(s.x, prey.x) / 20 : 0,
        dy: prey ? (prey.y - s.y) / 20 : 0,
      },
      charge,
    )
  }

  /** The bonk and splash bursts: additive pixels with a hot white core. */
  private renderSparks(g: CanvasRenderingContext2D) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.globalAlpha = Math.max(0, Math.min(1, s.life / 30))
      g.fillStyle = s.color
      g.fillRect(x - 1, y - 1, 2, 2)
      if (s.life > 18) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 1, y - 1, 1, 1)
      }
    }
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Everything boxed into the band above the ceiling.
    hudPanel(g, 4, 3, 84, 21)
    drawText(g, String(this.score).padStart(6, '0'), 10, 7, {
      scale: 2,
      color: RAMPS.pink[3],
      shadow: INK,
    })
    if (this.mode === 'versus') {
      this.renderVersusHud(g)
    } else {
      const label =
        this.mode === 'tourney'
          ? this.champion
            ? 'BOUT'
            : `WAVE ${this.arena.number}-${Math.max(1, this.wave)}`
          : `WAVE ${this.level}`
      hudPanel(g, 92, 3, 62, 21, RAMPS.teal)
      drawText(g, label, 123, 10, {
        align: 'center',
        color: RAMPS.teal[4],
        outline: INK,
      })
      const hi = `HI ${Math.max(this.hiScore, this.score)}`
      const hiW = measureText(hi, 2)
      hudPanel(g, Math.round(W / 2 - hiW / 2 - 6) + 12, 3, hiW + 12, 21)
      drawText(g, hi, W / 2 + 12, 7, {
        scale: 2,
        align: 'center',
        color: RAMPS.gold[3],
        shadow: INK,
      })
      const lives = Math.min(this.lives, 6)
      if (lives > 0) {
        hudPanel(g, W - 8 - lives * 13, 3, lives * 13 + 4, 21)
        for (let i = 0; i < lives; i++) {
          drawSprite(g, LIFE_SPRITE, W - 12 - i * 13, 13)
        }
      }
    }
    if (this.mode === 'tourney') {
      // The pollen purse, small in the corner.
      hudPanel(g, 4, H - 19, 48, 16, RAMPS.gold)
      shadedOrb(g, 13, H - 11, 4, RAMPS.gold)
      drawText(g, String(this.pollen), 21, H - 14, {
        color: '#ffffff',
        outline: INK,
      })
    }
    const c = this.champion
    if (c && !c.done && this.card <= 0)
      drawChampionBar(g, c.name, c.hp, c.maxHp)
    // The wave's rule, small along the bottom while it is fresh.
    if (
      this.mode !== 'versus' &&
      !this.champion &&
      this.waveKind !== 'joust' &&
      this.waveTicks < 60 * 8
    ) {
      drawText(g, WAVE_TYPES[this.waveKind].rule, W / 2, H - 9, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    if (this.banner && this.card <= 0) {
      drawText(g, this.banner.text, W / 2, H / 2 - 60, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 28, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
      this.banner.lines?.forEach((line, i) => {
        drawText(g, line, W / 2, H / 2 - 28 + i * 20, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      })
    }
  }

  private renderVersusHud(g: CanvasRenderingContext2D) {
    const t = clock(this.versusTicks)
    const tw = measureText(t, 2)
    hudPanel(g, Math.round(W / 2 - tw / 2 - 6), 3, tw + 12, 21, RAMPS.teal)
    drawText(g, t, W / 2, 7, {
      scale: 2,
      align: 'center',
      color: this.versusTicks < 60 * 10 ? RAMPS.ember[3] : RAMPS.teal[4],
      shadow: INK,
    })
    const box = 38
    const x0 = W - 6 - this.riders.length * (box + 4)
    this.riders.forEach((r, i) => {
      const look = SEAT_LOOKS[r.seat]!
      const x = x0 + i * (box + 4)
      hudPanel(g, x, 3, box, 21, look.ramp)
      drawText(g, `${look.name} ${r.bonks}`, x + box / 2, 10, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
    })
  }
}

const butterflyJoust: ArcadeGameModule = {
  create: (options) => new ButterflyJoust(options),
}

export const create = butterflyJoust.create
export default butterflyJoust
