// /utils/arcade/games/stationSweep.ts
//
// Station Sweep -- the Kind Robots Arcade's Xenophobe riff (conductor
// kr-arcade/t-009 game factory: decks, lifts, critter growth, the station
// timer, and split-screen co-op). Mop, the station's cleaning robot, sweeps a
// station overrun by glitch critters, deck by deck. Egg sacs on the floor
// hatch critters, sacs on the ceiling drop crawlers, and a deck is clean once
// every sac is popped (or spent) and every critter swept up. Two lifts on
// every deck ride up and down (Up or Down while standing in one); clean every
// deck and the station is done.
//
// The Orbit Line depth pass, slice 1 (kr-arcade/t-141): critters that grow up,
// and tools to match. Five families (rollers, crawlers, biters, puffers and
// gloops; utils/arcade/stationSweep/critters.ts) each grow through three
// stages, the adults with behaviours of their own: boulderbellies roll in
// bouncing pairs, web weavers hang webs that drop babies, snappers spit three
// ways, spore clouds shed sticky spores and big gloops split when swept. Every
// one has a tell. Critters are never hurt: they are swept into Mop's bin, and
// a bin emptied at a lift pays credits that buy upgrades at the Supply Locker
// between stations. Popped sacs drop the seven pickup tools (Mop carries one
// on B; utils/arcade/stationSweep/tools.ts) alongside the Sweeper Beam on A.
//
// As in the classic, height matters: rollers bowl along the floor under a
// standing shot, so crouch (Down) to sweep low. Crawlers drop and cling,
// draining charge until Mop jumps (Up, or B with no tool) to shake them.
// And the station is on a clock: run it out and the station is lost, costing
// a spare Mop; time left over pays a bonus.
//
// Up to three can play on one device, as in the classic's split screen: one
// strip per Mop, player 1's (blue) on top, then player 2's (pink) and player
// 3's (green), each free to ride to a deck of their own. Every deck with a Mop
// on it is live. The score, the clock, the credits and the spare Mops are
// shared; a Mop that goes down reboots on a spare, and with no spares left it
// sits out until one is earned (back at the next station). The run ends when
// no Mop is left sweeping.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  starField,
  vignette,
  type PixelSprite,
  type Ramp,
} from '../snes'
import type { MusicLoop } from '../sound'
import {
  BIN_ICON,
  CANISTER,
  CREDIT_ICON,
  CRITTER_SPRITES,
  TOOL_ICONS,
  flash,
} from '../stationSweep/art'
import {
  BITER,
  CRAWLER,
  DECK_CRITTER_CAP,
  FAMILIES,
  FAMILY_NAMES,
  GLOOP,
  PUFFER,
  ROLLER,
  growTicks,
  pickFloorFamily,
  stageDef,
  type Family,
  type Stage,
  type StageDef,
} from '../stationSweep/critters'
import {
  CREDITS,
  LOCKER,
  LOCKER_ITEMS,
  beamTuning,
  binRoom,
  cannotBuy,
  emptyKit,
  priceOf,
  toolOfTheDay,
  type Kit,
  type LockerItem,
  type Visit,
} from '../stationSweep/locker'
import { ALARM_MUSIC, LOCKER_MUSIC, STATION_MUSIC } from '../stationSweep/music'
import {
  BUBBLE,
  DROPS,
  FOAM_TICKS,
  PICKUP_TOOLS,
  STEAM,
  TOOLS,
  TOOL_LIFE,
  VAC,
  WIDE_HEIGHTS,
  ZAP_DAMAGE,
  pickTool,
  toolCharge,
  type PickupTool,
} from '../stationSweep/tools'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeGuidePage,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const CEILING = 70
const FLOOR = 206
const DECK_W = 1600
const WALK = 1.4
const GRAVITY = 0.25
const JUMP_VY = -4.2
const SHOT_SPEED = 5
const MAX_HEALTH = 100
const CLEAR_TICKS = 150
const DEATH_TICKS = 110
const START_LIVES = 3
const EXTRA_EVERY = 25_000
/** Lift doors on every deck, at the same spots. */
const LIFTS = [180, DECK_W - 180]
const RIDE_TICKS = 50
/** Station clock: a base allowance plus time per deck. */
const STATION_BASE_SECS = 45
const SECS_PER_DECK = 24
const GLOW_TICKS = 150
/** The alarm layer joins the music with this many seconds left. */
const ALARM_SECS = 20
/** A full bin slows Mop this much. */
const FULL_BIN_PACE = 0.8
/** A raised Squeegee Shield slows Mop this much. */
const SHIELD_PACE = 0.6

/** Mops that can share a station, as in the classic. */
const MAX_PLAYERS = 3
/** Split screen: a short shared HUD, then one strip per Mop. */
const SPLIT_HUD = 22
/** Each strip shows the deck from the ceiling plating to just under the floor. */
const VIEW_TOP = CEILING - 14
const VIEW_SPAN = FLOOR + 10 - VIEW_TOP
const SEAT_COLORS = ['#67e8f9', '#f9a8d4', '#bef264']

export const SWEEP_CURVES = {
  decks: { start: 2, step: 0.5, limit: 4 },
  floorSacs: { start: 3, step: 1, limit: 9 },
  ceilingSacs: { start: 1, step: 0.6, limit: 5 },
  hatchEvery: { start: 420, step: -35, limit: 110 },
  critterSpeed: { start: 1, step: 0.12, limit: 2.1 },
  /** Ticks a critter's full growth takes (the young stage grows after part of it). */
  growAfter: { start: 60 * 26, step: -60 * 2, limit: 60 * 10 },
} as const

/** One player's cleaning robot. */
type Mop = {
  seat: number
  x: number
  y: number
  vy: number
  onGround: boolean
  crouch: boolean
  facing: 1 | -1
  health: number
  fireCooldown: number
  hurt: number
  walkPhase: number
  camX: number
  /** Index into decks; deck 0 is the top of the station. */
  deck: number
  ride: { to: number; t: number } | null
  /** Ticks until a downed Mop reboots (0 while it's up). */
  dead: number
  /** No spare left to reboot on: sitting out until one comes free. */
  out: boolean
  /** The tool Mop carries on B, and what's left in it. */
  tool: PickupTool | null
  toolCharge: number
  toolCool: number
  /** B held on a held tool (vac, steam, shield) this tick. */
  using: boolean
  /** Room taken in the bin, and the credits it will pay at a lift. */
  bin: number
  binCredits: number
  /** Ticks of spores still stuck to Mop's treads. */
  sticky: number
}
type Critter = {
  kind: Family
  stage: Stage
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  /** Ticks at this stage (growth runs on it). */
  t: number
  /** Crawlers ride the ceiling until a Mop walks under, then drop and cling. */
  onCeiling: boolean
  /** The Mop a crawler is clinging to, if any. */
  clinging: Mop | null
  /** Only a dropping or leaping crawler can latch on; shaken off, it stays down. */
  canCling: boolean
  /** Ticks of a tell still to run: a growl, a leap crouch, a swell, a wobble. */
  tell: number
  /** Ticks to the next charge, leap, spit, drop, shed or lunge. */
  cool: number
  /** Ticks left glued in foam, stunned by steam, or floating in a bubble. */
  foam: number
  stun: number
  bubble: number
  /** A snapper's facing, and how long a Mop has been behind it. */
  face: 1 | -1
  turn: number
  /** A boulderbelly's partner. */
  pair: Critter | null
  /** Hit flash. */
  flash: number
}
type Sac = {
  x: number
  ceiling: boolean
  hp: number
  timer: number
  hatches: number
  pulse: number
}
type ShotKind = 'beam' | 'foam' | 'zap'
type Shot = {
  x: number
  y: number
  vx: number
  life: number
  kind: ShotKind
  /** The seat whose bin a swept critter goes into. */
  owner: number
  /** What a piercing bolt has already swept through. */
  hit: Array<Critter | Sac>
}
type Spit = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  /** A lobbed spit arcs down and splats where it lands. */
  lob: boolean
}
type RepairKit = { x: number; life: number }
type ToolDrop = { x: number; tool: PickupTool; life: number }
type Bomb = { x: number; y: number; vx: number; vy: number; owner: number }
type Spore = { x: number; r: number; life: number }
type Deck = {
  sacs: Sac[]
  critters: Critter[]
  kits: RepairKit[]
  drops: ToolDrop[]
  shots: Shot[]
  spits: Spit[]
  bombs: Bomb[]
  spores: Spore[]
  clean: boolean
}
type Particle = {
  deck: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = {
  deck: number
  x: number
  y: number
  text: string
  life: number
  color?: string
}
type Locker = {
  cursor: number
  ticks: number
  visit: Visit
  note: string
}

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

function newMop(seat: number): Mop {
  return {
    seat,
    x: 60 + seat * 40,
    y: FLOOR,
    vy: 0,
    onGround: true,
    crouch: false,
    facing: 1,
    health: MAX_HEALTH,
    fireCooldown: 0,
    hurt: 0,
    walkPhase: 0,
    camX: 0,
    deck: 0,
    ride: null,
    dead: 0,
    out: false,
    tool: null,
    toolCharge: 0,
    toolCool: 0,
    using: false,
    bin: 0,
    binCredits: 0,
    sticky: 0,
  }
}

/** A fresh critter of `kind` at `stage`, feet at (x, y). */
function newCritter(kind: Family, stage: Stage, x: number, y: number): Critter {
  return {
    kind,
    stage,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: stageDef(kind, stage).hp,
    t: 0,
    onCeiling: false,
    clinging: null,
    canCling: false,
    tell: 0,
    cool: 60,
    foam: 0,
    stun: 0,
    bubble: 0,
    face: 1,
    turn: 0,
    pair: null,
    flash: 0,
  }
}

/** Where a critter rests: the floor, or for a web weaver and a spore cloud, above it. */
function restY(c: Critter): number {
  if (c.kind === 'crawler' && c.stage === 2) return FLOOR - CRAWLER.hang
  if (c.kind === 'puffer' && c.stage === 2) return FLOOR - 8
  return FLOOR
}

/** A bubble's radius round a trapped critter. */
function bubbleR(def: StageDef): number {
  return Math.max(def.hitH, def.halfW * 2) / 2 + 5
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A ramp pulled toward `to` by t: the deck walls are the kit's ramps in shadow. */
function shade(ramp: Ramp, to: string, t: number): Ramp {
  return ramp.map((c) => mix(c, to, t)) as unknown as Ramp
}

/** Every pixel but the ink outline turned `colour`: the hit flash. */
function silhouette(sprite: PixelSprite, colour = '#ffffff'): PixelSprite {
  return {
    width: sprite.width,
    height: sprite.height,
    pixels: sprite.pixels.map((p) => (p && p !== INK ? colour : p)),
  }
}

const LIME: Ramp = ['#1f3d0a', '#3f6212', '#65a30d', '#a3e635', '#ecfccb']
const SEAT_RAMPS: readonly Ramp[] = [RAMPS.sky, RAMPS.pink, RAMPS.leaf]

function mopPalette(ramp: Ramp): Record<string, string> {
  return {
    a: ramp[0],
    b: ramp[1],
    c: ramp[2],
    d: ramp[3],
    e: ramp[4],
    f: mix(ramp[3], '#ffffff', 0.35),
    g: '#ffffff',
    q: RAMPS.steel[0],
    s: RAMPS.steel[1],
    S: RAMPS.steel[2],
    t: RAMPS.steel[3],
    T: RAMPS.steel[4],
    k: INK,
    y: RAMPS.gold[3],
    Y: '#ffffff',
    L: RAMPS.gold[3],
    l: RAMPS.gold[2],
    n: RAMPS.teal[3],
    w: RAMPS.cream[4],
    M: RAMPS.cream[3],
    m: RAMPS.cream[2],
    o: RAMPS.cream[1],
    H: RAMPS.earth[3],
    h: RAMPS.earth[2],
  }
}

// Mop faces right; the mop it carries rides on its back, its head a plume
// above the dome. 22 columns: plume (0-4), body (5-16, x-6..x+6), nozzle
// (17-20, x+6..x+10, at the beam's height). Standing it is 26 rows tall,
// crouched 16, as before.
const MOP_DOMES = [
  [
    '.wM.....dfggfd........',
    'wMMm..dfggffffd.......',
    'MmMmodfgfffffkkkb.....',
    '.mmoHdfgffffkyYkb.....',
    '..oH.cffffffkkkcb.....',
    '..Hh.bccccccccccb.....',
  ],
  [
    '........dfggfd........',
    '.wM...dfggffffd.......',
    'wMMmodfgfffffkkkb.....',
    'MmmoHdfgffffkyYkb.....',
    '.ooH.cffffffkkkcb.....',
    '..Hh.bccccccccccb.....',
  ],
]
const MOP_COLLAR = '...HhqsSTTTTTtSsq.....'
const MOP_BODY = '.....cdeddccccbba.....'
const MOP_BODY_H = '....hcdeddccccbba.....'
const MOP_NOZZLE = [
  '....hcdeddccccbbatTTt.',
  '....hcdeddccccbbaSStn.',
  '.....cdeddccccbbasssq.',
]
const MOP_CHEST = [
  '.....cdTTTTTtcbba.....',
  '.....cdtSLlSqcbba.....',
  '.....cdtSllSqcbba.....',
  '.....cdqqqqqqcbba.....',
]
const MOP_HEM = ['.....bcdccccbbbaa.....', '.....abbbbbbbbaaa.....']
const STAND_BODY = [
  MOP_BODY_H,
  MOP_BODY_H,
  MOP_BODY_H,
  ...MOP_NOZZLE,
  ...MOP_CHEST,
  MOP_BODY,
  MOP_BODY,
  MOP_BODY,
  ...MOP_HEM,
]
const CROUCH_BODY = [
  MOP_BODY_H,
  MOP_BODY_H,
  MOP_BODY,
  '.....cdeddccccbbatTTn.',
  '.....bcdccccbbbasssq..',
]
const MOP_TREADS = [
  [
    '....qTTTTTTTTTTTTq....',
    '....StkSStkSStkSSt....',
    '....SkTkSkTkSkTkSq....',
    '....qssssssssssssq....',
  ],
  [
    '....qTTTTTTTTTTTTq....',
    '....SStkSStkSStkSt....',
    '....SSkTkSkTkSkTkq....',
    '....qssssssssssssq....',
  ],
]

function mopRows(f: number, body: string[]) {
  return [...MOP_DOMES[f]!, MOP_COLLAR, ...body, ...MOP_TREADS[f]!]
}

const MOP_SPRITES = SEAT_RAMPS.map((ramp) => {
  const palette = mopPalette(ramp)
  return {
    stand: [0, 1].map((f) => pixelSprite(mopRows(f, STAND_BODY), palette)),
    crouch: [0, 1].map((f) => pixelSprite(mopRows(f, CROUCH_BODY), palette)),
  }
})
const MOP_FLASH = {
  stand: MOP_SPRITES[0]!.stand.map((s) => silhouette(s)),
  crouch: MOP_SPRITES[0]!.crouch.map((s) => silhouette(s)),
}
const SPARE_SPRITE = pixelSprite(
  ['.dffd.', 'dfgkyk', 'cdccbb', 'cdecba', 'qTTTTq', 'sksksk'],
  mopPalette(RAMPS.sky),
)

const SAC_PALETTE = {
  W: '#ffffff',
  H: LIME[4],
  L: LIME[3],
  l: LIME[2],
  d: LIME[1],
  D: LIME[0],
  v: RAMPS.leaf[1],
  e: RAMPS.purple[1],
  E: RAMPS.purple[2],
}
const SAC_TOP = [
  '....ddddd....',
  '..ddLLLLldd..',
  '.dLHHLLLllld.',
  '.dLHWHLlllld.',
]
const SAC_BOTTOM = [
  'dllvlllllvllD',
  '.dlllllllvlD.',
  '.Ddlllllllld.',
  '..DddllllddD.',
  '...DDdddddD..',
  '....DDDDD....',
]
const SAC_SPRITES = [
  pixelSprite(
    [
      ...SAC_TOP,
      'dLLHHLlleelld',
      'dLLLLlleEEeld',
      'dLLLlleEEEeld',
      'dLLllleeEeeld',
      'dLlllvleeelvd',
      'dLllvllleellD',
      ...SAC_BOTTOM,
    ],
    SAC_PALETTE,
  ),
  pixelSprite(
    [
      ...SAC_TOP,
      'dLLHHLllleeld',
      'dLLLLlleeEEld',
      'dLLLllleEEEed',
      'dLLlllleEeeld',
      'dLlllvleeelvd',
      'dLllvlleellID'.replace('I', 'l'),
      ...SAC_BOTTOM,
    ],
    SAC_PALETTE,
  ),
] as const
const SAC_FLASH = silhouette(SAC_SPRITES[0])
const HUSK_SPRITE = pixelSprite(
  ['..d.Ld..d...', '.dLdlLd.dLd.', 'dllDdlldDlld'],
  SAC_PALETTE,
)

const KIT_SPRITE = pixelSprite(
  [
    '...ssss...',
    '..s....s..',
    'WWWWWWWWWw',
    'WWWWggWWWc',
    'WWWWggWWWc',
    'WWggggggWc',
    'WWggggggWc',
    'WWWWggWWWc',
    'cccccccccC',
  ],
  {
    s: RAMPS.steel[3],
    W: RAMPS.cream[4],
    w: RAMPS.cream[3],
    c: RAMPS.cream[2],
    C: RAMPS.cream[1],
    g: RAMPS.leaf[2],
  },
)

const SPIT_SPRITES = [
  pixelSprite(['.ppP.', 'pPWPp', 'dppPp', '.ddd.'], {
    W: '#ffffff',
    P: RAMPS.pink[3],
    p: '#d946ef',
    d: RAMPS.purple[1],
  }),
  pixelSprite(['..pP..', 'ppPWPp', '.dpPpd', '..dd..'], {
    W: '#ffffff',
    P: RAMPS.pink[3],
    p: '#d946ef',
    d: RAMPS.purple[1],
  }),
] as const

// --- the station ------------------------------------------------------------

/** How a deck looks: its bulkheads, its trim lights, its floor, and the view outside. */
type DeckLook = {
  wall: Ramp
  trim: Ramp
  floor: Ramp
  space: readonly string[]
  planet: Ramp
  rings: boolean
}
const DECK_LOOKS: readonly DeckLook[] = [
  {
    wall: shade(RAMPS.steel, RAMPS.night[0], 0.45),
    trim: RAMPS.teal,
    floor: shade(RAMPS.steel, RAMPS.night[0], 0.15),
    space: [RAMPS.night[0], RAMPS.night[1], RAMPS.night[2], RAMPS.purple[1]],
    planet: RAMPS.rust,
    rings: true,
  },
  {
    wall: shade(RAMPS.purple, RAMPS.night[0], 0.55),
    trim: RAMPS.pink,
    floor: shade(RAMPS.purple, RAMPS.steel[1], 0.55),
    space: [RAMPS.night[0], RAMPS.night[1], RAMPS.pink[0], RAMPS.night[2]],
    planet: RAMPS.teal,
    rings: false,
  },
  {
    wall: shade(RAMPS.water, RAMPS.night[0], 0.55),
    trim: RAMPS.gold,
    floor: shade(RAMPS.water, RAMPS.steel[1], 0.55),
    space: [RAMPS.night[0], RAMPS.sky[0], RAMPS.night[1], RAMPS.water[0]],
    planet: RAMPS.gold,
    rings: false,
  },
  {
    wall: shade(RAMPS.earth, RAMPS.night[0], 0.4),
    trim: RAMPS.leaf,
    floor: shade(RAMPS.earth, RAMPS.steel[1], 0.5),
    space: [RAMPS.night[0], RAMPS.night[1], RAMPS.purple[0], RAMPS.night[2]],
    planet: RAMPS.purple,
    rings: true,
  },
]

/** Lift doors: brushed steel, a shade darker than the frames. */
const DOOR_RAMP = shade(RAMPS.steel, RAMPS.night[0], 0.2)

/** Sparkle colours: a critter swept, a sac popped, a repair kit taken. */
const GOOD_SPARKS = [RAMPS.gold[4], RAMPS.teal[3], RAMPS.pink[3]]
const SAC_SPARKS = [LIME[4], LIME[3], RAMPS.gold[4]]
const KIT_SPARKS = [RAMPS.leaf[3], '#ffffff', RAMPS.teal[4]]

/** The bulkheads repeat every two panels; space outside repeats every SPACE_W. */
const TILE_W = 160
const SPACE_W = 256
const WINDOW = { x: 12, y: 90, w: 56, h: 42 }
const PORTHOLE = { x: 120, y: 112, r: 14 }
const SPACE_STARS = starField(17, 90, SPACE_W, FLOOR - CEILING)

/** A rivet: lit on its upper left, shadowed on its lower right. */
function rivet(k: CanvasRenderingContext2D, x: number, y: number, ramp: Ramp) {
  k.fillStyle = ramp[0]
  k.fillRect(x, y, 2, 2)
  k.fillStyle = ramp[4]
  k.fillRect(x, y, 1, 1)
}

/** A recessed panel: shadow along the top and left, a lit lip along the bottom and right. */
function inset(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
) {
  k.fillStyle = ramp[3]
  k.fillRect(x, y, w, h)
  k.fillStyle = ramp[0]
  k.fillRect(x, y, w - 1, h - 1)
  k.fillStyle = ramp[1]
  k.fillRect(x + 1, y + 1, w - 2, h - 2)
}

/** Space as one window tile: banded dark, a nebula, stars, and a planet. */
function paintSpace(
  k: CanvasRenderingContext2D,
  look: DeckLook,
  theme: number,
) {
  bandedGradient(k, 0, CEILING, SPACE_W, FLOOR - CEILING, look.space, 4)
  glow(k, 70, 104, 46, look.trim[1], 0.35)
  glow(k, 40, 124, 28, RAMPS.purple[2], 0.25)
  k.save()
  k.translate(0, CEILING)
  drawStars(k, SPACE_STARS, theme * 40, RAMPS.purple)
  k.restore()
  const { planet } = look
  const x = 186
  const y = 108 + theme * 3
  const r = 15
  glow(k, x, y, r + 12, planet[3], 0.35)
  const ring = (from: number, to: number) => {
    k.lineWidth = 2
    k.strokeStyle = INK
    k.beginPath()
    k.ellipse(x, y, r + 11, 4, -0.25, from, to)
    k.stroke()
    k.lineWidth = 1
    k.strokeStyle = look.trim[3]
    k.beginPath()
    k.ellipse(x, y, r + 11, 4, -0.25, from, to)
    k.stroke()
  }
  if (look.rings) ring(Math.PI, Math.PI * 2)
  k.fillStyle = INK
  k.beginPath()
  k.arc(x, y, r + 1, 0, Math.PI * 2)
  k.fill()
  k.save()
  k.beginPath()
  k.arc(x, y, r, 0, Math.PI * 2)
  k.clip()
  bandedGradient(
    k,
    x - r,
    y - r,
    r * 2,
    r * 2,
    [planet[4], planet[3], planet[2], planet[3], planet[2], planet[1]],
    3,
  )
  // The night side, in two steps.
  k.fillStyle = rgba(INK, 0.3)
  k.beginPath()
  k.arc(x + r * 0.3, y + r * 0.25, r, 0, Math.PI * 2)
  k.fill()
  k.fillStyle = rgba(INK, 0.35)
  k.beginPath()
  k.arc(x + r * 0.6, y + r * 0.5, r, 0, Math.PI * 2)
  k.fill()
  k.fillStyle = rgba('#ffffff', 0.7)
  k.fillRect(x - 9, y - 9, 3, 2)
  k.restore()
  if (look.rings) ring(0, Math.PI)
}

/**
 * Two bulkhead panels of a deck, baked once per look: a ceiling with lamps
 * pouring light down the struts, a panel with a big window and one with a
 * porthole over a console, a pipe run, vented kick plates, and the grated
 * floor. The windows are left clear so space shows through.
 */
function paintWall(k: CanvasRenderingContext2D, look: DeckLook) {
  const { wall, trim, floor } = look
  const top = CEILING - 14
  // Ceiling plating, with seams.
  bandedGradient(k, 0, top, TILE_W, 12, [wall[1], wall[0]], 3)
  for (let x = 0; x < TILE_W; x += 40) {
    k.fillStyle = INK
    k.fillRect(x, top, 1, 12)
    k.fillStyle = wall[2]
    k.fillRect(x + 1, top, 1, 12)
    rivet(k, x + 5, top + 4, wall)
    rivet(k, x + 33, top + 4, wall)
  }
  k.fillStyle = INK
  k.fillRect(0, CEILING - 3, TILE_W, 1)
  k.fillStyle = trim[2]
  k.fillRect(0, CEILING - 2, TILE_W, 1)
  k.fillStyle = trim[1]
  k.fillRect(0, CEILING - 1, TILE_W, 1)
  k.fillStyle = wall[0]
  k.fillRect(0, CEILING, TILE_W, FLOOR - CEILING)
  for (const px of [0, 80]) {
    // The upper panel.
    bevel(k, px + 6, CEILING + 3, 68, 84, wall)
    for (const [rx, ry] of [
      [px + 9, CEILING + 6],
      [px + 69, CEILING + 6],
      [px + 9, CEILING + 82],
      [px + 69, CEILING + 82],
    ] as const)
      rivet(k, rx, ry, wall)
    // The pipe run, lit from above, with clamps.
    bandedGradient(
      k,
      px,
      CEILING + 90,
      80,
      6,
      [RAMPS.steel[3], RAMPS.steel[2], RAMPS.steel[1], RAMPS.steel[0]],
      1,
    )
    k.fillStyle = RAMPS.steel[4]
    k.fillRect(px, CEILING + 90, 80, 1)
    k.fillStyle = INK
    k.fillRect(px, CEILING + 89, 80, 1)
    k.fillRect(px, CEILING + 96, 80, 1)
    bevel(k, px + 20, CEILING + 88, 5, 10, wall, { depth: 1 })
    bevel(k, px + 60, CEILING + 88, 5, 10, wall, { depth: 1 })
    k.fillStyle = trim[1]
    k.fillRect(px, CEILING + 98, 80, 1)
    // Kick plates with vents.
    for (const vx of [px + 6, px + 42]) {
      bevel(k, vx, CEILING + 102, 32, 30, wall, { depth: 1 })
      for (let i = 0; i < 4; i++) {
        k.fillStyle = wall[0]
        k.fillRect(vx + 5, CEILING + 107 + i * 6, 22, 2)
        k.fillStyle = wall[2]
        k.fillRect(vx + 5, CEILING + 109 + i * 6, 22, 1)
      }
    }
  }
  // The window panel: a framed pane with a mullion.
  const { x: wx, y: wy, w: ww, h: wh } = WINDOW
  bevel(k, wx - 4, wy - 4, ww + 8, wh + 8, wall, { depth: 2 })
  inset(k, wx - 1, wy - 1, ww + 2, wh + 2, wall)
  k.clearRect(wx, wy, ww, wh)
  k.fillStyle = wall[0]
  for (const [cx, cy] of [
    [wx, wy],
    [wx + ww - 1, wy],
    [wx, wy + wh - 1],
    [wx + ww - 1, wy + wh - 1],
  ] as const)
    k.fillRect(cx, cy, 1, 1)
  k.fillStyle = rgba(INK, 0.45)
  k.fillRect(wx, wy, ww, 2)
  k.fillStyle = INK
  k.fillRect(wx + ww / 2 - 2, wy, 4, wh)
  k.fillStyle = wall[3]
  k.fillRect(wx + ww / 2 - 1, wy, 1, wh)
  k.fillStyle = wall[1]
  k.fillRect(wx + ww / 2, wy, 1, wh)
  // Glare on the glass.
  k.fillStyle = rgba('#ffffff', 0.14)
  for (const gx of [wx + 4, wx + ww / 2 + 4])
    for (let i = 0; i < 12; i++) {
      k.fillRect(gx + i, wy + 16 - i, 2, 1)
      if (i < 6) k.fillRect(gx + i + 6, wy + 16 - i, 1, 1)
    }
  // A nameplate under the window.
  bevel(k, wx + 14, wy + wh + 8, ww - 28, 6, trim, { depth: 1 })
  k.fillStyle = trim[0]
  for (let i = 0; i < 5; i++) k.fillRect(wx + 18 + i * 4, wy + wh + 10, 2, 2)
  // The porthole panel: a riveted ring round a round pane.
  const { x: hx, y: hy, r } = PORTHOLE
  const disc = (x: number, y: number, rr: number, colour: string) => {
    k.fillStyle = colour
    k.beginPath()
    k.arc(x, y, rr, 0, Math.PI * 2)
    k.fill()
  }
  disc(hx, hy, r + 6, INK)
  disc(hx, hy, r + 5, wall[1])
  disc(hx - 1, hy - 1, r + 4, wall[3])
  disc(hx, hy, r + 3, wall[2])
  disc(hx, hy, r + 1, INK)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    rivet(
      k,
      Math.round(hx + Math.cos(a) * (r + 3) - 1),
      Math.round(hy + Math.sin(a) * (r + 3) - 1),
      wall,
    )
  }
  k.save()
  k.globalCompositeOperation = 'destination-out'
  disc(hx, hy, r, '#000000')
  k.restore()
  k.fillStyle = rgba('#ffffff', 0.2)
  for (let i = 0; i < 6; i++) k.fillRect(hx - 9 + i, hy - 3 - i, 2, 1)
  // The console under the porthole: a screen of readouts and three lamps.
  bevel(k, hx - 22, CEILING + 64, 44, 20, wall)
  k.fillStyle = INK
  k.fillRect(hx - 19, CEILING + 67, 30, 14)
  bandedGradient(k, hx - 18, CEILING + 68, 28, 12, [trim[1], trim[0]], 2)
  k.fillStyle = trim[3]
  ;[14, 20, 9].forEach((w, row) =>
    k.fillRect(hx - 16, CEILING + 70 + row * 3, w, 1),
  )
  k.fillStyle = rgba(trim[4], 0.25)
  k.fillRect(hx - 18, CEILING + 68, 28, 1)
  k.fillStyle = INK
  for (let i = 0; i < 3; i++) k.fillRect(hx + 13, CEILING + 69 + i * 5, 4, 4)
  // Struts between panels, wrapping across the tile edge.
  for (const sx of [0, 80, TILE_W]) {
    k.fillStyle = INK
    k.fillRect(sx - 4, CEILING, 8, FLOOR - CEILING)
    k.fillStyle = wall[2]
    k.fillRect(sx - 3, CEILING, 6, FLOOR - CEILING)
    k.fillStyle = wall[3]
    k.fillRect(sx - 3, CEILING, 1, FLOOR - CEILING)
    k.fillStyle = wall[1]
    k.fillRect(sx + 2, CEILING, 1, FLOOR - CEILING)
    for (let y = CEILING + 10; y < FLOOR; y += 24) rivet(k, sx - 1, y, wall)
  }
  // Baseboard.
  k.fillStyle = wall[1]
  k.fillRect(0, FLOOR - 3, TILE_W, 2)
  k.fillStyle = INK
  k.fillRect(0, FLOOR - 1, TILE_W, 1)
  // The floor: a lit lip, grating, and the dark under-deck below.
  k.fillStyle = floor[4]
  k.fillRect(0, FLOOR, TILE_W, 1)
  bandedGradient(k, 0, FLOOR + 1, TILE_W, 9, [floor[3], floor[2], floor[1]], 3)
  for (let x = 0; x < TILE_W; x += 10) {
    k.fillStyle = INK
    k.fillRect(x + 2, FLOOR + 5, 6, 2)
    k.fillStyle = floor[3]
    k.fillRect(x + 2, FLOOR + 7, 6, 1)
  }
  for (let x = 0; x < TILE_W; x += 40) {
    k.fillStyle = INK
    k.fillRect(x, FLOOR + 1, 1, 9)
    rivet(k, x + 3, FLOOR + 2, floor)
  }
  k.fillStyle = INK
  k.fillRect(0, FLOOR + 10, TILE_W, 1)
  bandedGradient(
    k,
    0,
    FLOOR + 11,
    TILE_W,
    H - FLOOR - 11,
    [floor[1], floor[0], INK],
    3,
  )
  for (let x = 20; x < TILE_W; x += 40) {
    k.fillStyle = floor[1]
    k.fillRect(x - 2, FLOOR + 11, 5, H - FLOOR - 11)
    k.fillStyle = floor[2]
    k.fillRect(x - 2, FLOOR + 11, 1, H - FLOOR - 11)
  }
  for (let x = 0; x < TILE_W; x += 20) {
    k.fillStyle = trim[3]
    k.fillRect(x + 9, FLOOR + 20, 2, 1)
    glow(k, x + 10, FLOOR + 20, 5, trim[2], 0.4)
  }
  // Ceiling lamps over the struts, washing light down the wall.
  for (const lx of [0, 80, TILE_W]) {
    k.save()
    k.globalCompositeOperation = 'lighter'
    const cone = k.createLinearGradient(0, CEILING, 0, CEILING + 110)
    cone.addColorStop(0, rgba(trim[3], 0.2))
    cone.addColorStop(1, rgba(trim[3], 0))
    k.fillStyle = cone
    k.beginPath()
    k.moveTo(lx - 6, CEILING)
    k.lineTo(lx + 6, CEILING)
    k.lineTo(lx + 30, CEILING + 110)
    k.lineTo(lx - 30, CEILING + 110)
    k.closePath()
    k.fill()
    k.restore()
    bevel(k, lx - 8, CEILING - 6, 16, 5, RAMPS.steel, { depth: 1 })
    k.fillStyle = trim[4]
    k.fillRect(lx - 6, CEILING - 1, 12, 1)
    glow(k, lx, CEILING, 10, trim[3], 0.6)
  }
}

/** Each sprite's hit flash, made once. */
const FLASHES = new Map<PixelSprite, PixelSprite>()
function flashOf(sprite: PixelSprite): PixelSprite {
  let lit = FLASHES.get(sprite)
  if (!lit) FLASHES.set(sprite, (lit = flash(sprite)))
  return lit
}

/** The lob of a snapper's third spit. */
const LOB_GRAVITY = 0.06
/** A deck keeps at most this many spore patches. */
const MAX_SPORES = 8

class StationSweep implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private mops: Mop[]
  /** Spare Mops, shared by the team. */
  private spares = START_LIVES - 1
  private decks: Deck[] = []
  /** The deck being simulated or drawn right now (see the deck getters below). */
  private cur!: Deck
  private curIndex = 0
  /** Ticks left on the station clock. */
  private timer = 0
  private clear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles, a set per deck, roll their own dice: the seeded rng is untouched.
  private fx = Array.from(
    { length: SWEEP_CURVES.decks.limit },
    () => new Sparkles(),
  )
  private fxRng = backdropRng(61)

  /** The team's credits, earned emptying bins and cleaning decks, spent at the Supply Locker. */
  private credits = 0
  /** What the crew has fitted from the locker, kept all run. */
  private kit: Kit = emptyKit()
  /** Seconds bought for the next station's clock. */
  private extraClock = 0
  /** The tool every Mop starts the next station with, if the crew bought one. */
  private startTool: PickupTool | null = null
  /** Docked at the Supply Locker between stations. */
  private locker: Locker | null = null
  /** The critter count: every critter swept this run, by family, and this station's. */
  private swept: Record<Family, number> = {
    roller: 0,
    crawler: 0,
    biter: 0,
    puffer: 0,
    gloop: 0,
  }
  private stationSwept = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    this.mops = Array.from({ length: seats }, (_, seat) => newMop(seat))
    this.startStation(1)
  }

  /** Mops still in play plus the spares behind them. */
  get lives(): number {
    return this.spares + this.mops.filter((m) => !m.out).length
  }

  /** The sweep shift's tune, its alarm in the last seconds, and the locker's. */
  get music(): MusicLoop | null {
    if (this.over || this.demo) return null
    if (this.locker) return LOCKER_MUSIC
    return this.clear === 0 && this.timer <= 60 * ALARM_SECS
      ? ALARM_MUSIC
      : STATION_MUSIC
  }

  private get duo(): boolean {
    return this.mops.length > 1
  }

  /** Split screen geometry: each strip's height, scale and world width. */
  private get stripH(): number {
    return (H - SPLIT_HUD) / this.mops.length
  }
  private get stripScale(): number {
    return this.stripH / VIEW_SPAN
  }
  private get viewW(): number {
    return this.duo ? W / this.stripScale : W
  }

  // The current deck's things, read and written through to the deck itself.
  private get sacs(): Sac[] {
    return this.cur.sacs
  }
  private set sacs(v: Sac[]) {
    this.cur.sacs = v
  }
  private get critters(): Critter[] {
    return this.cur.critters
  }
  private set critters(v: Critter[]) {
    this.cur.critters = v
  }
  private get kits(): RepairKit[] {
    return this.cur.kits
  }
  private set kits(v: RepairKit[]) {
    this.cur.kits = v
  }
  private get drops(): ToolDrop[] {
    return this.cur.drops
  }
  private set drops(v: ToolDrop[]) {
    this.cur.drops = v
  }
  private get shots(): Shot[] {
    return this.cur.shots
  }
  private set shots(v: Shot[]) {
    this.cur.shots = v
  }
  private get spits(): Spit[] {
    return this.cur.spits
  }
  private set spits(v: Spit[]) {
    this.cur.spits = v
  }
  private get bombs(): Bomb[] {
    return this.cur.bombs
  }
  private set bombs(v: Bomb[]) {
    this.cur.bombs = v
  }
  private get spores(): Spore[] {
    return this.cur.spores
  }
  private set spores(v: Spore[]) {
    this.cur.spores = v
  }

  private use(index: number) {
    this.curIndex = index
    this.cur = this.decks[index]!
    for (const c of this.cur.critters) this.settle(c)
  }

  /**
   * A critter from an older shape (a launch-era save of the world, or a test that builds one by
   * hand with `big`) gets the fields the grown-up roster needs.
   */
  private settle(c: Critter) {
    const loose = c as Partial<Critter> & { big?: boolean }
    if (loose.stage !== undefined) return
    const stage: Stage = loose.big ? 1 : 0
    Object.assign(c, { ...newCritter(c.kind, stage, c.x, c.y), ...c, stage })
  }

  /** Mops up and sweeping on the current deck (not riding, rebooting or out). */
  private here(): Mop[] {
    return this.mops.filter(
      (m) => m.deck === this.curIndex && !m.out && m.dead === 0 && !m.ride,
    )
  }

  /** The nearest sweeping Mop on the current deck. */
  private nearest(x: number): Mop | undefined {
    let best: Mop | undefined
    for (const m of this.here())
      if (!best || Math.abs(m.x - x) < Math.abs(best.x - x)) best = m
    return best
  }

  // --- deck ----------------------------------------------------------------------

  private startStation(station: number) {
    this.level = station
    const count = Math.round(levelCurve(station, SWEEP_CURVES.decks))
    this.decks = []
    for (let d = 0; d < count; d++)
      this.decks.push({
        sacs: this.placeSacs(station),
        critters: [],
        kits: [],
        drops: [],
        shots: [],
        spits: [],
        bombs: [],
        spores: [],
        clean: false,
      })
    this.use(0)
    for (const m of this.mops) {
      // A Mop rebooting or sitting out comes back on a spare, if there is one.
      if (m.dead > 0 || m.out) {
        if (this.spares > 0) {
          this.spares--
          m.out = false
          m.health = MAX_HEALTH
        } else {
          m.out = true
        }
        m.dead = 0
      }
      m.deck = 0
      m.ride = null
      m.x = 60 + m.seat * 40
      m.y = FLOOR
      m.vy = 0
      m.onGround = true
      m.camX = 0
      m.sticky = 0
      m.bin = 0
      m.binCredits = 0
      // A short top-up between stations, not a full repair.
      m.health = Math.min(MAX_HEALTH, m.health + 25)
      if (this.startTool && !m.out) {
        m.tool = this.startTool
        m.toolCharge = toolCharge(this.startTool, this.kit.tanks)
      }
    }
    this.startTool = null
    this.stationSwept = 0
    this.timer =
      60 * (STATION_BASE_SECS + SECS_PER_DECK * count + this.extraClock)
    this.extraClock = 0
    this.banner = {
      text: `STATION ${station}`,
      sub: `${count} DECKS TO SWEEP`,
      ticks: 110,
    }
  }

  private placeSacs(station: number): Sac[] {
    const sacs: Sac[] = []
    const place = (count: number, ceiling: boolean) => {
      for (let i = 0; i < count; i++) {
        let x = 220 + ((DECK_W - 300) * (i + 0.3 + this.rng() * 0.4)) / count
        // Keep the lift doors clear.
        for (const lift of LIFTS) if (Math.abs(x - lift) < 24) x = lift + 30
        sacs.push({
          x,
          ceiling,
          hp: ceiling ? 999 : 3,
          timer: 120 + Math.floor(this.rng() * 240),
          hatches: ceiling ? 2 : 4,
          pulse: 0,
        })
      }
    }
    place(Math.round(levelCurve(station, SWEEP_CURVES.floorSacs)), false)
    place(Math.round(levelCurve(station, SWEEP_CURVES.ceilingSacs)), true)
    return sacs
  }

  /** Critters toughen per station, about as fast as they did per deck before lifts. */
  private get heat(): number {
    return 1 + (this.level - 1) * 3
  }

  private atLift(m: Mop): number | undefined {
    return LIFTS.find((l) => Math.abs(m.x - l) < 10)
  }

  private updateRide(m: Mop) {
    const ride = m.ride!
    ride.t--
    if (ride.t === Math.floor(RIDE_TICKS / 2)) {
      // Anything clinging to this Mop rides along.
      const from = this.decks[m.deck]!
      const riders = from.critters.filter((c) => c.clinging === m)
      from.critters = from.critters.filter((c) => c.clinging !== m)
      m.deck = ride.to
      this.decks[ride.to]!.critters.push(...riders)
    }
    if (ride.t > 0) return
    m.ride = null
    const d = this.decks[m.deck]!
    this.banner = {
      text: this.duo
        ? `${m.seat + 1}P DECK ${m.deck + 1}`
        : `DECK ${m.deck + 1}`,
      sub: d.clean ? 'ALREADY CLEAN' : 'SWEEP IT CLEAN',
      ticks: 70,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.demo) this.use(this.mops[0]!.deck)
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])

    if (this.locker) {
      this.updateLocker(frames)
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.leaveStation()
      return
    }
    // The clock runs while any Mop is out sweeping (not riding or rebooting).
    const sweeping = this.mops.some((m) => !m.out && m.dead === 0 && !m.ride)
    if (sweeping && --this.timer <= 0) {
      this.stationLost()
      return
    }

    for (const m of this.mops) this.updateMop(m, frames[m.seat] ?? idleFrame())
    for (let d = 0; d < this.decks.length; d++) {
      this.use(d)
      if (!this.here().length) continue
      this.updateShots()
      this.updateBombs()
      this.updateSacs()
      this.updateCritters()
      this.grow()
      this.updateSpits()
      this.updateSpores()
      this.updateKits()
      this.updateDrops()
      for (const m of this.here()) if (m.health <= 0) this.down(m)
      this.checkClean()
      if (this.clear > 0) break
    }
    const viewW = this.viewW
    for (const m of this.mops)
      m.camX = Math.max(0, Math.min(DECK_W - viewW, m.x - viewW / 2))
    if (this.mops.every((m) => m.out)) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
    }
  }

  private updateMop(m: Mop, controls: InputFrame) {
    if (m.out) return
    if (m.ride) {
      this.updateRide(m)
      return
    }
    if (m.dead > 0) {
      if (--m.dead === 0) this.reboot(m)
      return
    }
    if (m.hurt > 0) m.hurt--
    if (m.fireCooldown > 0) m.fireCooldown--
    if (m.toolCool > 0) m.toolCool--
    if (m.sticky > 0) m.sticky--
    this.use(m.deck)
    m.using = false
    this.move(m, controls)
    this.tryEmptyBin(m)
    if (m.ride) return
    if (controls.pressed.a || (controls.held.a && m.fireCooldown === 0))
      this.fire(m)
    if (m.tool) this.useTool(m, controls)
  }

  /** Back up after a fall, on a spare if there is one; otherwise sit out. */
  private reboot(m: Mop) {
    if (this.spares <= 0) {
      m.out = true
      if (this.mops.some((o) => !o.out))
        this.banner = {
          text: `${m.seat + 1}P IS OUT`,
          sub: 'SWEEP ON',
          ticks: 90,
        }
      return
    }
    this.spares--
    m.health = MAX_HEALTH
    const d = this.decks[m.deck]!
    d.critters = d.critters.filter((c) => Math.abs(c.x - m.x) > 120)
    d.spits = []
  }

  /** How fast Mop walks: slower with a full bin, spores on its treads, or the shield up. */
  private pace(m: Mop, shielding: boolean): number {
    let pace = 1
    if (m.bin >= binRoom(this.kit.bin)) pace *= FULL_BIN_PACE
    if (m.sticky > 0) pace *= PUFFER.slow
    if (shielding) pace *= SHIELD_PACE
    return pace
  }

  private move(m: Mop, input: InputFrame) {
    m.crouch = m.onGround && input.held.down
    const shielding = m.tool === 'shield' && input.held.b
    const walk = WALK * this.pace(m, shielding)
    let vx = 0
    if (!m.crouch) {
      if (input.held.left) vx = -walk
      if (input.held.right) vx = walk
    }
    if (input.held.left) m.facing = -1
    if (input.held.right) m.facing = 1
    if (vx !== 0) m.walkPhase += 0.2
    m.x = Math.max(12, Math.min(DECK_W - 12, m.x + vx))
    // Standing in a lift, Up or a fresh press of Down rides a deck that way.
    const lift = m.onGround ? this.atLift(m) : undefined
    const to = input.pressed.up
      ? m.deck - 1
      : input.pressed.down
        ? m.deck + 1
        : -1
    if (lift !== undefined && to >= 0 && to < this.decks.length) {
      m.x = lift
      m.crouch = false
      m.ride = { to, t: RIDE_TICKS }
      // Leaving the deck to itself: its shots and spit settle.
      if (!this.here().length) {
        this.shots = []
        this.spits = []
        this.bombs = []
      }
      this.sound.play('pickup')
      return
    }
    // Up jumps; so does B, while Mop carries no tool to use on it.
    if (m.onGround && (input.pressed.up || (input.pressed.b && !m.tool))) {
      m.vy = JUMP_VY
      m.onGround = false
      // A jump shakes off any crawler clinging to this Mop.
      for (const c of this.critters) {
        if (c.clinging === m) {
          c.clinging = null
          c.canCling = false
          c.vy = -2
          c.vx = -m.facing * 2
        }
      }
      this.sound.play('blip')
    }
    m.vy += GRAVITY
    m.y += m.vy
    if (m.y >= FLOOR) {
      m.y = FLOOR
      m.vy = 0
      m.onGround = true
    }
  }

  /** The beam's height: low while crouched, level standing. */
  private beamY(m: Mop): number {
    return m.crouch ? m.y - 5 : m.y - 15
  }

  /** Does a beam at (x, y) reach the critter? A bubble is a bigger, rounder target. */
  private reaches(c: Critter, x: number, y: number, pad = 1): boolean {
    const def = stageDef(c.kind, c.stage)
    if (c.bubble > 0) {
      const r = bubbleR(def)
      return Math.abs(x - c.x) < r && Math.abs(y - (c.y - def.hitH / 2)) < r
    }
    return (
      Math.abs(c.x - x) < def.halfW + pad &&
      y >= c.y - def.hitH - 1 &&
      y <= c.y + 1
    )
  }

  private fire(m: Mop) {
    const tune = beamTuning(this.kit.beam)
    m.fireCooldown = tune.cooldown
    const y = this.beamY(m)
    this.sound.play('shoot')
    // Point-blank: anything right at the nozzle is swept at once.
    const close = this.critters.find((c) => {
      if (c.onCeiling || c.clinging) return false
      const def = stageDef(c.kind, c.stage)
      const ahead = (c.x - m.x) * m.facing
      return (
        ahead + def.halfW > -6 &&
        ahead - def.halfW < 10 &&
        this.reaches(c, c.x, y)
      )
    })
    if (close) {
      this.burst(close.x, y, 3, '#a5f3fc')
      this.hitCritter(close, 1, m.seat)
      return
    }
    this.shots.push(this.shot(m, y, 'beam', SHOT_SPEED, tune.life))
  }

  private shot(
    m: Mop,
    y: number,
    kind: ShotKind,
    speed: number,
    life: number,
  ): Shot {
    return {
      x: m.x + m.facing * 9,
      y,
      vx: m.facing * speed,
      life,
      kind,
      owner: m.seat,
      hit: [],
    }
  }

  /** B with a tool: a shot tool fires on its own cooldown; a held tool runs while B is held. */
  private useTool(m: Mop, input: InputFrame) {
    const tool = m.tool!
    const def = TOOLS[tool]
    if (def.use === 'shot') {
      if (!input.held.b || m.toolCool > 0) return
      m.toolCool = def.cooldown
      m.toolCharge--
      this.fireTool(m, tool)
    } else if (input.held.b) {
      m.using = true
      if (tool === 'vac') {
        this.vacuum(m)
        m.toolCharge--
      } else if (tool === 'steam') {
        this.steam(m)
        m.toolCharge--
      }
    }
    this.checkToolEmpty(m)
  }

  private checkToolEmpty(m: Mop) {
    if (!m.tool || m.toolCharge > 0) return
    this.floaters.push({
      deck: this.curIndex,
      x: m.x,
      y: m.y - 34,
      text: `${TOOLS[m.tool].short} EMPTY`,
      life: 50,
      color: RAMPS.steel[3],
    })
    m.tool = null
    m.using = false
  }

  private fireTool(m: Mop, tool: PickupTool) {
    const life = beamTuning(this.kit.beam).life
    switch (tool) {
      case 'wide':
        for (const h of WIDE_HEIGHTS)
          this.shots.push(this.shot(m, m.y - h, 'beam', SHOT_SPEED, life))
        this.sound.play('shoot')
        return
      case 'foam':
        this.shots.push(this.shot(m, this.beamY(m), 'foam', 4, 44))
        this.sound.play('pop')
        return
      case 'zap':
        this.shots.push(this.shot(m, this.beamY(m), 'zap', 7, 40))
        this.sound.play('shoot')
        return
      case 'bubble':
        this.bombs.push({
          x: m.x + m.facing * 8,
          y: m.y - 20,
          vx: m.facing * BUBBLE.vx,
          vy: BUBBLE.vy,
          owner: m.seat,
        })
        this.sound.play('blip')
        return
      default:
    }
  }

  /** The Vac Pack: critters in front are pulled in, and swallowed whole into the bin. */
  private vacuum(m: Mop) {
    for (const c of [...this.critters]) {
      if (c.clinging === m) continue
      const def = stageDef(c.kind, c.stage)
      const ahead = (c.x - m.x) * m.facing
      if (ahead < -4 || ahead - def.halfW > VAC.reach) continue
      if (c.onCeiling) {
        // Pulled down off the ceiling, too startled to cling.
        c.onCeiling = false
        c.canCling = false
        c.vy = 0
        continue
      }
      if (c.clinging) {
        c.clinging = null
        c.canCling = false
      }
      c.tell = 0
      c.x -= m.facing * VAC.pull * (c.stage === 2 ? 0.5 : 1)
      if (ahead - def.halfW < VAC.swallow) this.sweep(c, m.seat, true)
    }
  }

  /** The Steam Wand: critters in its cloud are stunned, swells fizzle, and spores wash away. */
  private steam(m: Mop) {
    for (const c of [...this.critters]) {
      if (c.onCeiling) continue
      const def = stageDef(c.kind, c.stage)
      const ahead = (c.x - m.x) * m.facing
      if (ahead < -4 || ahead - def.halfW > STEAM.reach) continue
      c.stun = Math.max(
        c.stun,
        c.kind === 'biter' ? STEAM.biterStun : STEAM.stun,
      )
      if (c.clinging && c.clinging !== m) c.clinging = null
      if (c.kind === 'puffer') {
        c.tell = 0
        c.cool = 60
        if (this.tick % STEAM.deflateEvery === 0) this.hitCritter(c, 1, m.seat)
      }
    }
    for (const s of this.spores) {
      const ahead = (s.x - m.x) * m.facing
      if (ahead > -s.r && ahead - s.r < STEAM.reach) s.life -= 12
    }
  }

  /** Is this Mop's Squeegee Shield up and facing something coming from `fromX`? */
  private shields(m: Mop, fromX: number): boolean {
    return m.tool === 'shield' && m.using && Math.sign(fromX - m.x) === m.facing
  }

  /** The shield takes a blow: one charge spent, with a squeak. */
  private block(m: Mop, x: number, y: number) {
    m.toolCharge--
    this.sparkle(x, y, 6, [RAMPS.pink[3], '#ffffff', RAMPS.teal[3]])
    this.sound.play('blip')
    this.checkToolEmpty(m)
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.life--
      if (s.x < 0 || s.x > DECK_W) s.life = 0
      if (s.life <= 0) continue
      const critter = this.critters.find(
        (c) => !c.onCeiling && !s.hit.includes(c) && this.reaches(c, s.x, s.y),
      )
      if (critter) {
        if (s.kind === 'zap') {
          s.hit.push(critter)
          this.burst(s.x, s.y, 4, RAMPS.gold[4])
          this.hitCritter(critter, ZAP_DAMAGE, s.owner)
          continue
        }
        s.life = 0
        this.burst(s.x, s.y, 3, s.kind === 'foam' ? '#ffffff' : '#a5f3fc')
        if (s.kind === 'foam') this.foamCritter(critter, s.owner)
        else this.hitCritter(critter, 1, s.owner)
        continue
      }
      const sac = this.sacs.find(
        (k) =>
          !k.ceiling &&
          k.hp > 0 &&
          !s.hit.includes(k) &&
          Math.abs(k.x - s.x) < 8 &&
          s.y > FLOOR - 18,
      )
      if (!sac) continue
      if (s.kind === 'zap') s.hit.push(sac)
      else s.life = 0
      if (s.kind === 'foam') {
        this.burst(s.x, s.y, 4, '#ffffff')
        continue
      }
      sac.hp -= s.kind === 'zap' ? ZAP_DAMAGE : 1
      sac.pulse = 6
      this.sound.play('blip')
      if (sac.hp <= 0) this.popSac(sac)
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  /** Bubble Grenades: lobbed, they pop on a critter or the floor and bubble everything near. */
  private updateBombs() {
    for (const b of this.bombs) {
      b.x += b.vx
      b.y += b.vy
      b.vy += BUBBLE.gravity
      const struck = this.critters.some(
        (c) => !c.onCeiling && c.bubble === 0 && this.reaches(c, b.x, b.y, 2),
      )
      if (struck || b.y >= FLOOR - 3 || b.x < 0 || b.x > DECK_W) {
        this.popBubble(b)
        b.vy = Infinity
      }
    }
    this.bombs = this.bombs.filter((b) => b.vy !== Infinity)
  }

  private popBubble(b: Bomb) {
    for (const c of this.critters) {
      if (c.onCeiling || c.bubble > 0) continue
      const def = stageDef(c.kind, c.stage)
      const dx = c.x - b.x
      const dy = c.y - def.hitH / 2 - b.y
      if (Math.hypot(dx, dy) > BUBBLE.radius + def.halfW) continue
      c.bubble = BUBBLE.hold
      c.clinging = null
      c.canCling = false
      c.vx = 0
      c.vy = 0
      c.tell = 0
    }
    this.sparkle(b.x, b.y, 12, [RAMPS.water[3], RAMPS.water[4], '#ffffff'])
    this.sound.play('pop')
  }

  /** A beam, bolt or steam scald lands: enough of them and the critter is swept. */
  private hitCritter(c: Critter, damage: number, owner: number) {
    if (c.bubble > 0) {
      // A bubbled critter is swept whole, bubble and all.
      this.sweep(c, owner, true)
      return
    }
    c.hp -= damage
    c.flash = 4
    if (c.hp <= 0) this.sweep(c, owner, c.foam > 0)
  }

  /** Foam glues a critter in place; foam on a foamed critter sweeps it. */
  private foamCritter(c: Critter, owner: number) {
    if (c.bubble > 0 || c.foam > 0) {
      this.hitCritter(c, 1, owner)
      return
    }
    c.foam = FOAM_TICKS
    c.clinging = null
    c.canCling = false
    c.onCeiling = false
    c.tell = 0
    c.vx = 0
    this.sound.play('pop')
  }

  /**
   * Swept: into the sweeping Mop's bin, never hurt. A gloop that wasn't foamed (or vacuumed, or
   * bubbled) splits in two instead, and a puffer caught mid-swell still pops its spores.
   */
  private sweep(c: Critter, owner: number, whole: boolean) {
    const def = stageDef(c.kind, c.stage)
    this.critters = this.critters.filter((o) => o !== c)
    for (const o of this.critters) if (o.pair === c) o.pair = null
    this.addScore(def.points * this.level, c.x, c.y - def.hitH - 6)
    this.burst(c.x, c.y - def.hitH / 2, 10, FAMILIES[c.kind].spark)
    this.sparkle(c.x, c.y - def.hitH / 2, 8)
    this.sound.play('pop')
    if (c.kind === 'puffer' && c.tell > 0)
      this.addSpore(c.x, PUFFER.sporeR[c.stage])
    if (
      c.kind === 'gloop' &&
      c.stage > 0 &&
      !whole &&
      this.critters.length + 2 <= DECK_CRITTER_CAP
    ) {
      this.split(c)
      return
    }
    this.swept[c.kind]++
    this.stationSwept++
    const m = this.mops[owner]
    if (m) this.binIt(m, def, c.x, c.y - def.hitH - 14)
  }

  /** A gloop swept without foam: two of the stage below hop apart. */
  private split(c: Critter) {
    const def = stageDef(c.kind, c.stage)
    for (const dir of [-1, 1]) {
      const half = newCritter(
        'gloop',
        (c.stage - 1) as Stage,
        Math.max(8, Math.min(DECK_W - 8, c.x + (dir * def.halfW) / 2)),
        c.y,
      )
      half.vx = dir * 1.4
      half.vy = -2
      half.cool = 50
      this.critters.push(half)
    }
    this.floaters.push({
      deck: this.curIndex,
      x: c.x,
      y: c.y - def.hitH - 16,
      text: 'SPLIT!',
      life: 40,
      color: RAMPS.teal[3],
    })
    this.sound.play('warn')
  }

  /** Into the bin, if there's room; a full bin can't take it (but it's swept all the same). */
  private binIt(m: Mop, def: StageDef, x: number, y: number) {
    if (m.bin + def.bin > binRoom(this.kit.bin)) {
      if (!this.demo)
        this.floaters.push({
          deck: this.curIndex,
          x,
          y,
          text: 'BIN FULL!',
          life: 40,
          color: RAMPS.ember[3],
        })
      return
    }
    m.bin += def.bin
    m.binCredits += def.credits
  }

  /** Standing on a lift pad empties Mop's bin down the chute, for credits. */
  private tryEmptyBin(m: Mop) {
    if (m.bin <= 0 || !m.onGround || this.atLift(m) === undefined) return
    const credits = m.binCredits
    m.bin = 0
    m.binCredits = 0
    this.addCredits(credits)
    if (!this.demo)
      this.floaters.push({
        deck: this.curIndex,
        x: m.x,
        y: m.y - 36,
        text: `BIN EMPTIED +${credits} CR`,
        life: 60,
        color: RAMPS.gold[3],
      })
    this.sparkle(m.x, m.y - 14, 10, [RAMPS.gold[3], RAMPS.gold[4], LIME[3]])
    this.sound.play('pickup')
  }

  /** At the end of a station the shuttle empties every bin. */
  private emptyAllBins() {
    for (const m of this.mops) {
      this.addCredits(m.binCredits)
      m.bin = 0
      m.binCredits = 0
    }
  }

  private addCredits(n: number) {
    if (this.demo || n <= 0) return
    this.credits += n
  }

  private popSac(sac: Sac) {
    sac.hatches = 0
    this.addScore(200 * this.level, sac.x, FLOOR - 26)
    this.burst(sac.x, FLOOR - 8, 14, '#a3e635')
    this.sparkle(sac.x, FLOOR - 10, 12, SAC_SPARKS)
    this.sound.play('boom')
    const roll = this.rng()
    if (roll < DROPS.kit) this.kits.push({ x: sac.x, life: 60 * 10 })
    else if (roll < DROPS.kit + DROPS.tool)
      this.drops.push({
        x: sac.x,
        tool: pickTool(this.level, this.rng()),
        life: TOOL_LIFE,
      })
  }

  private updateSacs() {
    const every = levelCurve(this.heat, SWEEP_CURVES.hatchEvery)
    const mops = this.here()
    for (const sac of this.sacs) {
      if (sac.pulse > 0) sac.pulse--
      if (sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)) continue
      // Only sacs near a Mop hatch, so the far end doesn't fill up unseen.
      if (!mops.some((m) => Math.abs(sac.x - m.x) <= W)) continue
      if (--sac.timer > 0) continue
      sac.timer = Math.round(every * (0.7 + this.rng() * 0.6))
      // A crowded deck: the sac waits its turn.
      if (this.critters.length >= DECK_CRITTER_CAP) continue
      sac.hatches--
      this.hatch(sac)
    }
  }

  /** A sac hatches the young stage: a ceiling bub from the ceiling, any floor family below. */
  private hatch(sac: Sac) {
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    if (sac.ceiling) {
      const c = newCritter('crawler', 0, sac.x, CEILING + 8)
      c.vx = 0.4 * speed
      c.onCeiling = true
      c.canCling = true
      this.critters.push(c)
    } else {
      const kind = pickFloorFamily(this.level, this.rng())
      const prey = this.nearest(sac.x)
      const dir = prey && prey.x < sac.x ? -1 : 1
      const c = newCritter(kind, 0, sac.x + dir * 8, FLOOR)
      if (kind === 'roller') c.vx = dir * speed
      c.face = dir
      this.critters.push(c)
    }
    this.burst(sac.x, sac.ceiling ? CEILING + 6 : FLOOR - 10, 5, '#d9f99d')
    this.sound.play('warn')
  }

  // --- critters ------------------------------------------------------------------

  private updateCritters() {
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    const mops = this.here()
    for (const c of [...this.critters]) {
      if (!this.critters.includes(c)) continue
      if (c.flash > 0) c.flash--
      if (c.bubble > 0) {
        this.floatBubble(c)
        continue
      }
      if (c.foam > 0 || c.stun > 0) {
        if (c.foam > 0) c.foam--
        else c.stun--
        if (!c.onCeiling && !c.clinging && c.y < restY(c)) this.fall(c)
        continue
      }
      c.t++
      if (c.cool > 0) c.cool--
      // Each critter goes after the nearest Mop on its deck.
      const prey = c.clinging ?? this.nearest(c.x)
      if (!prey) continue
      const airborne =
        !c.onCeiling && !c.clinging && (c.y < restY(c) - 0.01 || c.vy < 0)
      const ownsAir =
        (c.kind === 'crawler' && c.stage < 2) ||
        c.kind === 'gloop' ||
        (c.kind === 'roller' && c.stage === 2)
      if (airborne && !ownsAir) {
        this.fall(c)
        continue
      }
      switch (c.kind) {
        case 'roller':
          this.updateRoller(c, prey, mops, speed)
          break
        case 'crawler':
          this.updateCrawler(c, prey, mops, speed)
          break
        case 'biter':
          this.updateBiter(c, prey, mops, speed)
          break
        case 'puffer':
          this.updatePuffer(c, prey, mops, speed)
          break
        case 'gloop':
          this.updateGloop(c, prey, mops, speed)
          break
      }
    }
  }

  /** Down under gravity to where it rests; true on landing. */
  private fall(c: Critter): boolean {
    const rest = restY(c)
    c.vy += GRAVITY
    c.x = Math.max(8, Math.min(DECK_W - 8, c.x + c.vx))
    c.y += c.vy
    if (c.y < rest) return false
    c.y = rest
    c.vy = 0
    return true
  }

  /** Trapped in a bubble: it floats up to beam height and bobs, harmless, until it pops. */
  private floatBubble(c: Critter) {
    const def = stageDef(c.kind, c.stage)
    const target = FLOOR - BUBBLE.floatTo + def.hitH / 2
    c.y += Math.sign(target - c.y) * Math.min(0.7, Math.abs(target - c.y))
    c.x += Math.sin(c.bubble / 20) * 0.2
    if (--c.bubble === 0) {
      c.vx = 0
      c.vy = 0
    }
  }

  /** Every 30 ticks a critter touching a Mop bumps it. */
  private contact(c: Critter, mops: Mop[]) {
    if (c.t % 30 !== 0) return
    const def = stageDef(c.kind, c.stage)
    for (const m of mops) if (this.touching(c, m)) this.damage(m, def.damage)
  }

  private touching(c: Critter, m: Mop): boolean {
    const def = stageDef(c.kind, c.stage)
    if (Math.abs(c.x - m.x) > def.halfW + 3) return false
    const myTop = m.y - (m.crouch ? 10 : 22)
    return c.y > myTop && c.y - def.hitH < m.y
  }

  /** A roller hits a Mop: it bounces off (a raised shield takes the blow instead). */
  private bump(c: Critter, m: Mop) {
    const away = Math.sign(c.x - m.x) || -m.facing
    c.vx = away * Math.min(3, Math.abs(c.vx) * 1.5 + 0.3)
    c.x += c.vx * 6
    if (this.shields(m, c.x)) {
      this.block(m, c.x, c.y - 8)
      return
    }
    this.damage(m, stageDef(c.kind, c.stage).damage)
  }

  private updateRoller(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    if (c.stage < 2) {
      c.x += c.vx
      if (c.x < 8 || c.x > DECK_W - 8) c.vx = -c.vx
      // Rollers turn back toward a Mop once they've rolled past.
      if (
        Math.abs(c.x - prey.x) > 140 &&
        Math.sign(prey.x - c.x) !== Math.sign(c.vx)
      )
        c.vx = -c.vx
      const hit = mops.find((m) => this.touching(c, m))
      if (hit) this.bump(c, hit)
      return
    }
    // A boulderbelly bounces as it rolls; every so often it growls, then charges.
    if (c.tell > 0) {
      if (--c.tell === 0) {
        c.vx = (Math.sign(prey.x - c.x) || 1) * 2.6 * speed
        c.cool = ROLLER.chargeEvery
        this.sound.play('warn')
      }
    } else if (c.cool === 0) {
      c.tell = ROLLER.growl
      c.vx = 0
    } else {
      // Between charges it rolls at a steady pace, turning back once it's well past Mop.
      if (c.cool <= ROLLER.chargeEvery - ROLLER.charge) {
        const toward = Math.sign(prey.x - c.x) || 1
        const heading =
          Math.abs(c.x - prey.x) > 160 ? toward : Math.sign(c.vx) || toward
        c.vx = heading * 1.2 * speed
      }
      c.x += c.vx
      if (c.x < 16 || c.x > DECK_W - 16) {
        c.vx = -c.vx
        c.x = Math.max(16, Math.min(DECK_W - 16, c.x))
      }
      if (c.y >= FLOOR) c.vy = ROLLER.bounceVy
    }
    c.vy += GRAVITY
    c.y += c.vy
    if (c.y >= FLOOR) {
      c.y = FLOOR
      c.vy = 0
    }
    const hit = mops.find((m) => this.touching(c, m) && m.hurt === 0)
    if (hit) {
      // A bump ends a charge.
      this.bump(c, hit)
      c.cool = Math.min(c.cool, ROLLER.chargeEvery - ROLLER.charge)
    }
  }

  private updateCrawler(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    if (c.clinging) {
      // Riding the lift with its Mop: the deck it left is still live
      // (a partner is there), but the Mop isn't, so no nibbling in transit.
      if (prey.ride) return
      c.x = prey.x
      c.y = prey.y - 18
      if (c.t % 10 === 0) this.damage(prey, c.stage === 0 ? 1 : 2)
      return
    }
    if (c.stage === 2) {
      this.updateWeaver(c, prey, mops, speed)
      return
    }
    if (c.onCeiling) {
      c.x += Math.sign(prey.x - c.x) * Math.abs(c.vx)
      // Drop when right above a Mop (its shadow on the floor gives it away).
      if (Math.abs(c.x - prey.x) < 10) {
        c.onCeiling = false
        c.vy = 0
      }
      return
    }
    const airborne = c.y < FLOOR || c.vy < 0
    if (airborne) {
      c.vy += GRAVITY
      c.x = Math.max(8, Math.min(DECK_W - 8, c.x + c.vx))
      c.y += c.vy
      const landing = c.canCling
        ? mops.find(
            (m) =>
              c.y >= m.y - 18 && Math.abs(c.x - m.x) < 10 && m.y - 18 > CEILING,
          )
        : undefined
      if (landing) {
        c.clinging = landing
        c.canCling = false
        c.vy = 0
        this.sound.play('warn')
        return
      }
      if (c.y >= FLOOR) {
        c.y = FLOOR
        c.vy = 0
        c.vx = c.stage === 0 ? Math.sign(prey.x - c.x) * 0.7 * speed : 0
        c.canCling = false
        if (c.stage === 1) c.cool = 90
      }
      return
    }
    if (c.stage === 0) {
      // On the floor a bub creeps after Mop and nibbles at its treads.
      c.vx = Math.sign(prey.x - c.x) * 0.7 * speed
      c.x += c.vx
      this.contact(c, mops)
      return
    }
    // A clinger crouches, then leaps on a Mop in reach.
    if (c.tell > 0) {
      if (--c.tell === 0) {
        c.vx = (Math.sign(prey.x - c.x) || 1) * 1.6
        c.vy = -3.4
        c.canCling = true
        this.sound.play('blip')
      }
      return
    }
    const dist = prey.x - c.x
    if (Math.abs(dist) < CRAWLER.leapReach && c.cool === 0) {
      c.tell = CRAWLER.leapTell
      return
    }
    if (Math.abs(dist) > 4) c.x += Math.sign(dist) * 0.7 * speed
    this.contact(c, mops)
  }

  /** A web weaver climbs its thread, follows Mop slowly, and drops babies from its web. */
  private updateWeaver(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    const rest = restY(c)
    if (c.y > rest) c.y = Math.max(rest, c.y - 0.4)
    if (Math.abs(prey.x - c.x) > 4) c.x += Math.sign(prey.x - c.x) * 0.2 * speed
    if (c.cool === 0) {
      c.cool = CRAWLER.dropEvery
      if (this.critters.length < DECK_CRITTER_CAP) {
        const side = Math.floor(c.t / CRAWLER.dropEvery) % 2 ? 14 : -14
        const baby = newCritter('crawler', 0, c.x + side, CEILING + 8)
        baby.onCeiling = true
        baby.canCling = true
        baby.vx = 0.4 * speed
        this.critters.push(baby)
        this.burst(c.x + side, CEILING + 8, 5, RAMPS.purple[3])
        this.sound.play('warn')
      }
    }
    this.contact(c, mops)
  }

  private updateBiter(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    const dist = prey.x - c.x
    const dir = Math.sign(dist) || 1
    if (c.stage === 0) {
      // A nipper scurries right up and nips.
      c.face = dir as 1 | -1
      if (Math.abs(dist) > 6) c.x += dir * 0.8 * speed
      this.contact(c, mops)
      return
    }
    if (c.stage === 1) {
      c.face = dir as 1 | -1
      if (Math.abs(dist) > 50) c.x += dir * 0.5 * speed
    } else {
      // A snapper turns slowly: get round behind it and it takes a while to face you.
      if (dir !== c.face) {
        if (++c.turn >= BITER.turn) {
          c.face = dir as 1 | -1
          c.turn = 0
        }
      } else c.turn = 0
      if (dir === c.face && Math.abs(dist) > 60) c.x += dir * 0.35 * speed
    }
    if (c.cool === 0) {
      if (this.wouldSpit(c, prey)) this.spit(c)
      c.cool = BITER.spitEvery[c.stage]
    }
    this.contact(c, mops)
  }

  /** In range, and (for a snapper) in front. */
  private wouldSpit(c: Critter, prey: Mop): boolean {
    const dist = prey.x - c.x
    if (c.stage === 0) return false
    if (c.stage === 2 && (Math.sign(dist) || 1) !== c.face) return false
    return Math.abs(dist) < (c.stage === 2 ? 170 : 150)
  }

  private spit(c: Critter) {
    const f = c.face
    const at = (y: number, vx: number, vy = 0, lob = false): Spit => ({
      x: c.x + f * 8,
      y,
      vx: f * vx,
      vy,
      life: lob ? 120 : 90,
      lob,
    })
    if (c.stage === 1) this.spits.push(at(FLOOR - 14, 2.2))
    else
      this.spits.push(
        at(FLOOR - 14, 2.2),
        at(FLOOR - 23, 2),
        at(FLOOR - 30, 1.5, -1.6, true),
      )
    this.sound.play('blip')
  }

  private updatePuffer(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    const dist = prey.x - c.x
    if (c.stage === 2) {
      const rest = restY(c)
      if (c.y > rest) c.y = Math.max(rest, c.y - 0.4)
    }
    if (c.tell > 0) {
      if (--c.tell === 0) this.popPuffer(c, mops)
      return
    }
    const reach = PUFFER.swellAt - (c.stage === 2 ? 6 : 0)
    if (Math.abs(dist) < reach && c.cool === 0) {
      c.tell = PUFFER.swell
      this.sound.play('warn')
      return
    }
    if (Math.abs(dist) > 4)
      c.x += Math.sign(dist) * (c.stage === 2 ? 0.35 : 0.45) * speed
    if (c.stage === 2 && c.t % PUFFER.shedEvery === 0) this.addSpore(c.x, 16)
    this.contact(c, mops)
  }

  /** Swelled up and popped: a patch of sticky spores, and a sting for any Mop inside it. */
  private popPuffer(c: Critter, mops: Mop[]) {
    const def = stageDef(c.kind, c.stage)
    const r = PUFFER.sporeR[c.stage]
    this.critters = this.critters.filter((o) => o !== c)
    this.addSpore(c.x, r)
    for (const m of mops)
      if (Math.abs(m.x - c.x) < r) this.damage(m, def.damage)
    this.burst(c.x, c.y - def.hitH / 2, 16, RAMPS.gold[3])
    this.floaters.push({
      deck: this.curIndex,
      x: c.x,
      y: c.y - def.hitH - 10,
      text: 'POP!',
      life: 35,
      color: RAMPS.gold[3],
    })
    this.sound.play('boom')
  }

  private addSpore(x: number, r: number) {
    this.spores.push({ x, r, life: PUFFER.sporeLife })
    if (this.spores.length > MAX_SPORES) this.spores.shift()
  }

  private updateGloop(c: Critter, prey: Mop, mops: Mop[], speed: number) {
    const dist = prey.x - c.x
    const dir = Math.sign(dist) || 1
    if (c.y < FLOOR || c.vy < 0) {
      if (this.fall(c)) c.vx = 0
      // A lunge that lands on a Mop splats it once.
      const hit = mops.find((m) => this.touching(c, m) && m.hurt === 0)
      if (hit) {
        this.damage(hit, stageDef(c.kind, c.stage).damage)
        c.vx = -c.vx * 0.5
      }
      return
    }
    if (c.tell > 0) {
      if (--c.tell === 0) {
        c.vx = dir * GLOOP.lungeVx
        c.vy = GLOOP.lungeVy * (c.stage === 2 ? 0.8 : 1)
        c.cool = 100
      }
      return
    }
    if (Math.abs(dist) < GLOOP.lungeAt && c.cool === 0) {
      c.tell = GLOOP.wobble
      return
    }
    if (Math.abs(dist) > 4) c.x += dir * (c.stage === 2 ? 0.25 : 0.35) * speed
    this.contact(c, mops)
  }

  /** Critters left alone grow up: young to middle, middle to adult. */
  private grow() {
    const after = levelCurve(this.heat, SWEEP_CURVES.growAfter)
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    for (const c of [...this.critters]) {
      if (c.stage >= 2 || c.foam > 0 || c.stun > 0 || c.bubble > 0) continue
      // Crawlers only grow once they're down on the floor.
      if (c.kind === 'crawler' && (c.onCeiling || c.clinging)) continue
      if (c.y < restY(c) - 0.5 || c.vy < 0 || c.tell > 0) continue
      if (c.t < growTicks(c.stage, after)) continue
      this.growUp(c, speed)
    }
  }

  private growUp(c: Critter, speed: number) {
    const before = stageDef(c.kind, c.stage)
    c.stage = (c.stage + 1) as Stage
    const now = stageDef(c.kind, c.stage)
    c.hp = Math.max(1, now.hp - (before.hp - c.hp))
    c.t = 0
    c.tell = 0
    c.cool = 60
    const prey = this.nearest(c.x)
    const dir = Math.sign((prey?.x ?? c.x) - c.x) || 1
    if (c.kind === 'roller') {
      const heading = Math.sign(c.vx) || dir
      c.vx = heading * (c.stage === 2 ? 1.2 : 1.3) * speed
      if (c.stage === 2) {
        c.cool = Math.round(ROLLER.chargeEvery / 2)
        // Boulderbellies roll in pairs: a partner bounds in behind.
        if (this.critters.length < DECK_CRITTER_CAP) {
          const partner = newCritter(
            'roller',
            2,
            Math.max(16, Math.min(DECK_W - 16, c.x - heading * ROLLER.pairGap)),
            FLOOR,
          )
          partner.vx = c.vx
          partner.vy = ROLLER.bounceVy / 2
          partner.cool = c.cool
          partner.pair = c
          c.pair = partner
          this.critters.push(partner)
        }
      }
    } else if (c.kind === 'crawler') {
      c.vx = 0
      if (c.stage === 2) c.cool = Math.round(CRAWLER.dropEvery / 2)
    } else if (c.kind === 'biter') {
      c.face = dir as 1 | -1
    }
    this.burst(c.x, c.y - now.hitH / 2, 12, '#f0abfc')
    this.floaters.push({
      deck: this.curIndex,
      x: c.x,
      y: c.y - now.hitH - 12,
      text: `${now.name}!`,
      life: 50,
      color: FAMILIES[c.kind].spark,
    })
    this.sound.play('warn')
  }

  private updateSpits() {
    const mops = this.here()
    for (const s of this.spits) {
      s.x += s.vx
      if (s.lob) {
        s.vy += LOB_GRAVITY
        s.y += s.vy
      }
      s.life--
      if (s.life <= 0) continue
      const blocker = mops.find(
        (m) =>
          this.shields(m, s.x) &&
          Math.abs(s.x - m.x) < 14 &&
          s.y > m.y - 30 &&
          s.y < m.y,
      )
      if (blocker) {
        s.life = 0
        this.block(blocker, s.x, s.y)
        continue
      }
      if (s.lob && s.y >= FLOOR - 2) {
        // A lob splats where it lands: step out from under it.
        s.life = 0
        this.burst(s.x, FLOOR - 2, 6, RAMPS.pink[3])
        for (const m of mops)
          if (Math.abs(m.x - s.x) < 10 && m.y > FLOOR - 8) this.damage(m, 8)
        continue
      }
      // A spit flies at waist height (or head height): crouch under it.
      const hit = mops.find(
        (m) =>
          Math.abs(s.x - m.x) < 6 &&
          s.y < m.y &&
          s.y > m.y - (m.crouch ? 12 : 24),
      )
      if (hit) {
        s.life = 0
        this.damage(hit, s.lob ? 8 : 6)
      }
    }
    this.spits = this.spits.filter((s) => s.life > 0)
  }

  /** Spore patches stick to Mop's treads (slowing it) and nibble its charge. */
  private updateSpores() {
    if (!this.spores.length) return
    for (const s of this.spores) s.life--
    for (const m of this.here()) {
      if (m.y < FLOOR - 20) continue
      if (!this.spores.some((s) => Math.abs(m.x - s.x) < s.r)) continue
      m.sticky = 6
      if (this.tick % PUFFER.drainEvery === 0) this.damage(m, 1)
    }
    this.spores = this.spores.filter((s) => s.life > 0)
  }

  private updateKits() {
    const mops = this.here()
    for (const k of this.kits) {
      k.life--
      const m = mops.find((o) => Math.abs(k.x - o.x) < 10 && o.y > FLOOR - 6)
      if (!m) continue
      k.life = 0
      m.health = Math.min(MAX_HEALTH, m.health + 30)
      this.sparkle(k.x, FLOOR - 8, 10, KIT_SPARKS)
      this.floaters.push({
        deck: this.curIndex,
        x: k.x,
        y: FLOOR - 30,
        text: 'REPAIRED!',
        life: 45,
      })
      this.sound.play('pickup')
    }
    this.kits = this.kits.filter((k) => k.life > 0)
  }

  /** A tool canister: walk over it to carry the tool on B (it swaps for any tool carried). */
  private updateDrops() {
    const mops = this.here()
    for (const d of this.drops) {
      d.life--
      const m = mops.find((o) => Math.abs(d.x - o.x) < 10 && o.y > FLOOR - 6)
      if (!m) continue
      d.life = 0
      m.tool = d.tool
      m.toolCharge = toolCharge(d.tool, this.kit.tanks)
      m.toolCool = 0
      this.sparkle(d.x, FLOOR - 10, 12, [
        TOOLS[d.tool].ramp[3],
        TOOLS[d.tool].ramp[4],
        '#ffffff',
      ])
      this.floaters.push({
        deck: this.curIndex,
        x: d.x,
        y: FLOOR - 36,
        text: TOOLS[d.tool].name,
        life: 60,
        color: TOOLS[d.tool].ramp[3],
      })
      this.sound.play('pickup')
    }
    this.drops = this.drops.filter((d) => d.life > 0)
  }

  private damage(m: Mop, amount: number) {
    if (m.dead > 0) return
    m.health -= amount
    m.hurt = 10
    if (amount > 2) this.sound.play('warn')
  }

  /** The clock ran out: the station is lost, and a spare Mop with it. */
  private stationLost() {
    const lead = this.mops.find((m) => !m.out)
    if (lead) this.burstOn(lead.deck, lead.x, lead.y - 10, 18, '#f87171')
    this.sound.play('die')
    this.emptyAllBins()
    if (this.spares > 0) {
      this.spares--
    } else {
      // No spare to lose: the last Mop still in play sits out instead.
      const last = [...this.mops].reverse().find((m) => !m.out)
      if (last) last.out = true
    }
    if (this.mops.every((m) => m.out)) {
      this.over = true
      this.banner = { text: 'STATION LOST', sub: 'GAME OVER', ticks: 9999 }
      return
    }
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STATION LOST',
      sub: 'ON TO THE SUPPLY LOCKER',
      ticks: CLEAR_TICKS,
    }
  }

  private down(m: Mop) {
    if (m.dead > 0) return
    m.dead = DEATH_TICKS
    for (const c of this.critters) if (c.clinging === m) c.clinging = null
    // Loose crawlers scatter; any clinging to a partner stay on (to be swept).
    this.critters = this.critters.filter(
      (c) =>
        c.kind !== 'crawler' ||
        c.onCeiling ||
        c.clinging !== null ||
        c.stage === 2,
    )
    this.burst(m.x, m.y - 10, 18, '#fde68a')
    this.sound.play('die')
    if (this.spares > 0)
      this.banner = {
        text: this.duo ? `${m.seat + 1}P NEEDS A REBOOT` : 'MOP NEEDS A REBOOT',
        ticks: 90,
      }
  }

  private checkClean() {
    const d = this.cur
    const sacsLeft = this.sacs.some(
      (s) => s.hatches > 0 && (s.ceiling || s.hp > 0),
    )
    const m = this.here()[0]
    const at = m ?? { x: DECK_W / 2, y: FLOOR }
    if (!d.clean && !sacsLeft && !this.critters.length) {
      d.clean = true
      const bonus = 1000 * this.level
      this.addScore(bonus, at.x, at.y - 40)
      this.addCredits(CREDITS.deck)
      for (const dx of [-40, 0, 40]) this.sparkle(at.x + dx, at.y - 30, 12)
      if (this.decks.some((k) => !k.clean)) {
        this.banner = {
          text: 'DECK CLEAN!',
          sub: `BONUS ${bonus}  TO THE LIFT`,
          ticks: 110,
        }
        this.sound.play('extra')
      }
    }
    if (this.critters.length || this.decks.some((k) => !k.clean)) return
    const inPlay = this.mops.filter((o) => !o.out)
    const health =
      inPlay.reduce((sum, o) => sum + Math.max(0, o.health), 0) /
      Math.max(1, inPlay.length)
    const bonus =
      3000 * this.level +
      Math.round(health) * 10 +
      Math.floor(this.timer / 60) * 10 * this.level
    this.addScore(bonus, at.x, at.y - 50)
    this.addCredits(CREDITS.station)
    this.emptyAllBins()
    for (const dx of [-80, -40, 0, 40, 80])
      this.sparkle(at.x + dx, at.y - 40, 14)
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STATION CLEAN!',
      sub: `BONUS ${bonus}  ${this.stationSwept} SWEPT`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- the Supply Locker -------------------------------------------------------

  /** Off the station: the attract demo flies straight on; a crew docks at the locker. */
  private leaveStation() {
    if (this.demo) {
      this.startStation(this.level + 1)
      return
    }
    this.locker = {
      cursor: 0,
      ticks: 0,
      visit: { tool: toolOfTheDay(this.rng()), bought: {} },
      note: 'WELCOME ABOARD, CREW!',
    }
    this.banner = null
    this.sound.play('start')
  }

  private updateLocker(frames: InputFrame[]) {
    const l = this.locker!
    if (++l.ticks >= LOCKER.wait) {
      this.launch()
      return
    }
    if (l.ticks < LOCKER.doors) return
    const pressed = (b: 'up' | 'down' | 'a' | 'b' | 'start') =>
      frames.some((f) => f.pressed[b])
    const n = LOCKER_ITEMS.length
    if (pressed('up')) {
      l.cursor = (l.cursor + n - 1) % n
      this.sound.play('blip')
    }
    if (pressed('down')) {
      l.cursor = (l.cursor + 1) % n
      this.sound.play('blip')
    }
    if (pressed('b') || pressed('start')) {
      this.launch()
      return
    }
    if (pressed('a')) this.buy(LOCKER_ITEMS[l.cursor]!)
  }

  private buy(item: LockerItem) {
    const l = this.locker!
    if (item.id === 'launch') {
      this.launch()
      return
    }
    const why = cannotBuy(item, this.kit, l.visit, this.credits)
    if (why) {
      l.note = why
      this.sound.play('warn')
      return
    }
    this.credits -= priceOf(item, this.kit)
    l.visit.bought[item.id] = (l.visit.bought[item.id] ?? 0) + 1
    l.note = 'THANKS! KEEP IT TIDY'
    switch (item.id) {
      case 'spare':
        this.spares++
        break
      case 'clock':
        this.extraClock += LOCKER.clockSecs
        break
      case 'bin':
        this.kit.bin++
        break
      case 'tanks':
        this.kit.tanks++
        break
      case 'beam':
        this.kit.beam++
        break
      case 'radar':
        this.kit.radar = 1
        break
      case 'tool':
        this.startTool = l.visit.tool
        l.note = `${TOOLS[l.visit.tool].name} PACKED`
        break
    }
    this.sound.play('extra')
  }

  private launch() {
    this.locker = null
    this.startStation(this.level + 1)
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({
      deck: this.curIndex,
      x,
      y,
      text: String(points),
      life: 40,
    })
    if (this.score >= this.nextExtra) {
      this.spares++
      // Each spare takes longer to earn: 25k, 75k, 175k, 375k...
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
      this.banner = { text: 'SPARE MOP!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    this.burstOn(this.curIndex, x, y, count, color)
  }

  private burstOn(
    deck: number,
    x: number,
    y: number,
    count: number,
    color: string,
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        deck,
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  /** Cosmetic sparkles on the deck being simulated. */
  private sparkle(
    x: number,
    y: number,
    count: number,
    colours: readonly string[] = GOOD_SPARKS,
  ) {
    this.fx[this.curIndex]?.burst(x, y, this.fxRng, { count, colours })
  }

  private updateEffects() {
    for (const fx of this.fx) fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
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

  /** Flies player 1's Mop alone (the attract demo seats one). */
  private demoInput(): InputFrame {
    const frame = idleFrame()
    const held = frame.held
    const me = this.mops[0]!
    // A clinging crawler: jump to shake it.
    if (this.critters.some((c) => c.clinging === me) && me.onGround) {
      frame.pressed.up = true
      return frame
    }
    // A spit coming in: raise the shield to it, or crouch under it.
    const spit = this.spits.find(
      (s) =>
        !s.lob &&
        Math.abs(s.x - me.x) < 40 &&
        Math.sign(me.x - s.x) === Math.sign(s.vx),
    )
    if (spit) {
      if (me.tool === 'shield') {
        held.b = true
        if (Math.sign(spit.x - me.x) !== me.facing) {
          if (spit.x > me.x) held.right = true
          else held.left = true
        }
      } else held.down = true
      return frame
    }
    // A puffer swelling up close: back off and let it pop out of reach.
    const swelling = this.critters.find(
      (c) => c.kind === 'puffer' && c.tell > 0 && Math.abs(c.x - me.x) < 60,
    )
    if (swelling) {
      if (swelling.x > me.x) held.left = true
      else held.right = true
      return frame
    }
    // A full bin: off to the nearest lift to empty it.
    const room = binRoom(this.kit.bin)
    const near = this.critters.some(
      (c) => !c.onCeiling && Math.abs(c.x - me.x) < 60,
    )
    if (me.bin >= room && !near) return this.pilotToLift(me, frame, true)
    // Pick the nearest target: a critter first, then a live sac, a canister or a kit.
    type Target = { x: number; low: boolean; critter?: Critter }
    const targets: Target[] = [
      ...this.critters
        .filter((c) => !c.onCeiling && !c.clinging)
        .map((c) => ({
          x: c.x,
          low:
            c.bubble === 0 &&
            c.y - stageDef(c.kind, c.stage).hitH > FLOOR - 14 &&
            c.y >= FLOOR - 1,
          critter: c,
        })),
      ...this.sacs
        .filter((s) => !s.ceiling && s.hp > 0 && s.hatches > 0)
        .map((s) => ({ x: s.x, low: false })),
    ]
    if (!me.tool)
      for (const d of this.drops) targets.push({ x: d.x, low: false })
    if (me.health < 50 && this.kits.length)
      targets.unshift({ x: this.kits[0]!.x, low: false })
    // With nothing on the floor, walk under a ceiling sac to bring its crawlers down.
    if (!targets.length) {
      const sac = this.sacs.find((s) => s.ceiling && s.hatches > 0)
      if (sac) targets.push({ x: sac.x, low: false })
      // Same for a crawler still riding the ceiling: it keeps the deck dirty.
      for (const c of this.critters)
        if (c.onCeiling) targets.push({ x: c.x, low: false })
    }
    const target = targets.sort(
      (a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x),
    )[0]
    if (!target) return this.pilotToLift(me, frame, false)
    const dist = target.x - me.x
    const dir = dist > 0 ? 1 : -1
    // Too close to aim at: back off a step first.
    if (Math.abs(dist) < 6) {
      if (me.facing > 0) held.left = true
      else held.right = true
      return frame
    }
    if (Math.abs(dist) > 110 || dir !== me.facing) {
      if (dir > 0) held.right = true
      else held.left = true
      return frame
    }
    if (target.low) held.down = true
    held.a = true
    // A tool in hand: use it on a critter in its reach.
    if (me.tool && me.tool !== 'shield' && target.critter) {
      const reach =
        me.tool === 'vac' ? VAC.reach : me.tool === 'steam' ? STEAM.reach : 110
      if (Math.abs(dist) < reach) held.b = true
    }
    if (Math.abs(dist) > 50) {
      if (dir > 0) held.right = true
      else held.left = true
    }
    return frame
  }

  /** Walk to the nearest lift: to empty the bin there, or to ride toward a deck still dirty. */
  private pilotToLift(me: Mop, frame: InputFrame, emptyOnly: boolean) {
    const dirty = this.decks
      .map((d, i) => (d.clean ? -1 : i))
      .filter((i) => i >= 0 && i !== me.deck)
      .sort((a, b) => Math.abs(a - me.deck) - Math.abs(b - me.deck))[0]
    if (dirty === undefined && !emptyOnly) return frame
    const lift = LIFTS.reduce((a, b) =>
      Math.abs(a - me.x) < Math.abs(b - me.x) ? a : b,
    )
    if (Math.abs(lift - me.x) > 4) {
      if (lift > me.x) frame.held.right = true
      else frame.held.left = true
      return frame
    }
    if (emptyOnly || dirty === undefined) return frame
    if (dirty < me.deck) frame.pressed.up = true
    else frame.pressed.down = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = INK
    g.fillRect(0, 0, W, H)
    if (this.locker) {
      this.renderLocker(g, this.locker)
      return
    }
    if (this.duo) {
      this.renderSplit(g)
      return
    }
    const me = this.mops[0]!
    g.save()
    g.translate(-Math.round(me.camX), 0)
    this.renderWorld(g, me.deck, me.camX, W)
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** Everything on one deck, in world coordinates; `camX`/`viewW` say what's in view. */
  private renderWorld(
    g: CanvasRenderingContext2D,
    deck: number,
    camX: number,
    viewW: number,
  ) {
    this.use(deck)
    const look = DECK_LOOKS[deck % DECK_LOOKS.length]!
    const left = camX - 40
    const right = camX + viewW + 40
    const inView = (x: number) => x > left && x < right
    this.renderDeck(g, deck, look, camX, viewW)
    for (const lift of LIFTS)
      if (inView(lift)) this.renderLift(g, lift, deck, look)
    for (const s of this.spores) if (inView(s.x)) this.renderSpore(g, s)
    for (const sac of this.sacs) if (inView(sac.x)) this.renderSac(g, sac)
    for (const k of this.kits) if (inView(k.x)) this.renderKit(g, k)
    for (const d of this.drops) if (inView(d.x)) this.renderDrop(g, d)
    for (const c of this.critters) if (inView(c.x)) this.renderCritter(g, c)
    for (const s of this.spits) {
      if (!inView(s.x)) continue
      glow(g, s.x, s.y, 9, RAMPS.pink[2], 0.5)
      drawSprite(g, SPIT_SPRITES[Math.floor(this.tick / 4) % 2]!, s.x, s.y, {
        flipX: s.vx < 0,
      })
    }
    for (const b of this.bombs) {
      if (!inView(b.x)) continue
      glow(g, b.x, b.y, 8, RAMPS.water[3], 0.5)
      shadedOrb(g, b.x, b.y, 3, RAMPS.water)
    }
    for (const s of this.shots) if (inView(s.x)) this.renderShot(g, s)
    for (const m of this.mops) {
      if (m.deck !== deck || m.dead > 0 || m.out || this.over) continue
      // A Mop shows in the doorway while the lift doors are open.
      const inLift =
        m.ride && Math.abs(m.ride.t - RIDE_TICKS / 2) < RIDE_TICKS / 2 - 8
      if (!inLift) this.renderMop(g, m)
    }
    for (const p of this.particles) {
      if (p.deck !== deck || !inView(p.x)) continue
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx[deck]?.render(g)
    for (const f of this.floaters)
      if (f.deck === deck)
        drawText(g, f.text, f.x, f.y, {
          align: 'center',
          color: f.color ?? RAMPS.gold[3],
          outline: INK,
        })
  }

  private renderShot(g: CanvasRenderingContext2D, s: Shot) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    const back = s.vx > 0 ? -1 : 1
    if (s.kind === 'foam') {
      glow(g, x, y, 8, RAMPS.cream[4], 0.4)
      shadedOrb(g, x, y, 3, RAMPS.cream, { glint: false })
      shadedOrb(g, x + back * 4, y + 1, 2, RAMPS.cream, { glint: false })
      return
    }
    if (s.kind === 'zap') {
      glow(g, x, y, 12, RAMPS.gold[3], 0.6)
      g.fillStyle = RAMPS.gold[2]
      for (let i = 0; i < 4; i++)
        g.fillRect(x + back * i * 4, y - 1 + ((i + this.tick) % 2) * 2, 4, 2)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 2, y - 1, 4, 2)
      return
    }
    glow(g, x, y, 10, RAMPS.teal[3], 0.55)
    g.fillStyle = rgba(RAMPS.teal[3], 0.5)
    g.fillRect(x + back * 9 - 1, y - 1, 2, 1)
    g.fillRect(x + back * 13, y, 1, 1)
    g.fillStyle = RAMPS.teal[2]
    g.fillRect(x - 5, y - 2, 10, 4)
    g.fillStyle = RAMPS.teal[3]
    g.fillRect(x - 4, y - 1, 8, 2)
    g.fillStyle = RAMPS.teal[4]
    g.fillRect(x - back * 2 - 1, y - 1, 3, 2)
  }

  /** A sticky patch of spores on the floor, with motes drifting up from it. */
  private renderSpore(g: CanvasRenderingContext2D, s: Spore) {
    const fade = Math.min(1, s.life / 60)
    g.save()
    g.globalAlpha *= 0.55 * fade
    g.fillStyle = RAMPS.gold[1]
    g.beginPath()
    g.ellipse(s.x, FLOOR, s.r, 3, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.gold[3]
    for (let i = -s.r + 4; i < s.r - 3; i += 7)
      g.fillRect(Math.round(s.x + i), FLOOR - 1, 3, 2)
    g.restore()
    for (let i = 0; i < 4; i++) {
      const rise = (this.tick * 0.5 + i * 9) % 26
      const mx = s.x + Math.sin(i * 1.7 + this.tick / 20) * s.r * 0.7
      g.fillStyle = rgba(RAMPS.gold[4], 0.7 * fade * (1 - rise / 26))
      g.fillRect(Math.round(mx), Math.round(FLOOR - 3 - rise), 2, 2)
    }
  }

  private renderDrop(g: CanvasRenderingContext2D, d: ToolDrop) {
    if (d.life < 90 && Math.floor(this.tick / 5) % 2) return
    const bob = Math.round(Math.sin(this.tick / 9) * 1.5)
    const ramp = TOOLS[d.tool].ramp
    glow(g, d.x, FLOOR - 8, 16, ramp[3], 0.45)
    dropShadow(g, d.x, FLOOR, 6, 1.5, 0.4)
    drawSprite(g, CANISTER, d.x, FLOOR - 1 + bob, { anchor: 'feet' })
    drawSprite(g, TOOL_ICONS[d.tool], d.x, FLOOR - 6 + bob, {
      anchor: 'center',
    })
  }

  /** Split screen: a slim shared HUD, then a strip per Mop, player 1's on top. */
  private renderSplit(g: CanvasRenderingContext2D) {
    const stripH = this.stripH
    const viewW = this.viewW
    this.mops.forEach((m, i) => {
      const top = SPLIT_HUD + i * stripH
      g.save()
      g.beginPath()
      g.rect(0, top, W, stripH)
      g.clip()
      if (m.out) {
        bandedGradient(
          g,
          0,
          top,
          W,
          stripH,
          [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
          4,
        )
        // A dead monitor: faint scanlines across the strip.
        g.fillStyle = rgba(RAMPS.night[4], 0.18)
        for (let y = Math.ceil(top); y < top + stripH; y += 3)
          g.fillRect(0, y, W, 1)
        drawText(g, `${m.seat + 1}P IS OUT`, W / 2, top + stripH / 2 - 8, {
          scale: 2,
          align: 'center',
          color: SEAT_COLORS[m.seat],
          outline: INK,
        })
        drawText(
          g,
          'A SPARE MOP BRINGS YOU BACK',
          W / 2,
          top + stripH / 2 + 12,
          { align: 'center', color: RAMPS.steel[3], outline: INK },
        )
      } else {
        g.translate(0, top)
        g.scale(this.stripScale, this.stripScale)
        g.translate(-Math.round(m.camX), -VIEW_TOP)
        this.renderWorld(g, m.deck, m.camX, viewW)
      }
      g.restore()
      if (!m.out) this.renderViewHud(g, m, top)
    })
    // Bevelled steel dividers between the strips.
    for (let i = 1; i < this.mops.length; i++) {
      const y = Math.round(SPLIT_HUD + i * stripH)
      g.fillStyle = INK
      g.fillRect(0, y - 2, W, 4)
      g.fillStyle = RAMPS.steel[3]
      g.fillRect(0, y - 1, W, 1)
      g.fillStyle = RAMPS.steel[1]
      g.fillRect(0, y, W, 1)
    }
    this.renderSplitHud(g)
  }

  /** Over each view: whose Mop, its charge, its deck, its tool and bin, and a map of that deck. */
  private renderViewHud(g: CanvasRenderingContext2D, m: Mop, top: number) {
    const y = Math.round(top) + 2
    hudPanel(g, 2, y, 78, 10, RAMPS.night)
    drawText(g, `${m.seat + 1}P`, 5, y + 2, {
      color: SEAT_COLORS[m.seat],
      outline: INK,
    })
    const frac = Math.max(0, m.health) / MAX_HEALTH
    gauge(g, 20, y + 3, 56, 4, frac, chargeRamp(frac))
    hudPanel(g, 83, y, 42, 10, RAMPS.night)
    drawText(g, `DECK ${m.deck + 1}`, 86, y + 2, {
      color: LIME[3],
      outline: INK,
    })
    hudPanel(g, 128, y, 30, 10, RAMPS.night)
    this.renderToolBadge(g, m, 131, y + 1, 24)
    hudPanel(g, 161, y, 30, 10, RAMPS.night)
    drawSprite(g, BIN_ICON, 164, y + 1, { anchor: 'topleft' })
    drawText(g, String(m.bin), 175, y + 2, {
      color: this.binColour(m),
      outline: INK,
    })
    hudPanel(g, 194, y, W - 196, 10, RAMPS.night)
    if (m.dead > 0) {
      drawText(g, 'REBOOTING', W - 6, y + 2, {
        align: 'right',
        color: Math.floor(this.tick / 12) % 2 ? RAMPS.gold[3] : RAMPS.gold[4],
        outline: INK,
      })
      return
    }
    this.renderRadar(g, 198, y + 3, W - 204, 4, m.deck, m)
  }

  /** A tool's badge and what's left in it; just the beam's badge while Mop carries none. */
  private renderToolBadge(
    g: CanvasRenderingContext2D,
    m: Mop,
    x: number,
    y: number,
    w: number,
  ) {
    drawSprite(g, TOOL_ICONS[m.tool ?? 'beam'], x, y, { anchor: 'topleft' })
    if (!m.tool) return
    const frac = m.toolCharge / toolCharge(m.tool, this.kit.tanks)
    gauge(g, x + 11, y + 3, w - 12, 3, frac, TOOLS[m.tool].ramp)
  }

  private binColour(m: Mop): string {
    const full = m.bin >= binRoom(this.kit.bin)
    if (!full) return RAMPS.leaf[3]
    return Math.floor(this.tick / 10) % 2 ? RAMPS.ember[3] : RAMPS.gold[3]
  }

  /** A deck's radar: lift doors, sacs, critters, canisters, and every Mop on it. */
  private renderRadar(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    deck: number,
    me: Mop,
  ) {
    const d = this.decks[deck]!
    const at = (wx: number) => Math.round(x + (wx / DECK_W) * w)
    g.fillStyle = INK
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
    bandedGradient(g, x, y, w, h, [RAMPS.night[0], RAMPS.night[1]], 1)
    // What this view can see, as a faint bracket.
    const span = Math.max(4, Math.round((this.viewW / DECK_W) * w))
    g.fillStyle = rgba(RAMPS.teal[3], 0.18)
    g.fillRect(at(me.camX), y, span, h)
    g.fillStyle = RAMPS.steel[2]
    for (const lift of LIFTS) g.fillRect(at(lift) - 1, y, 3, 1)
    // The Sac Radar adds the ceiling sacs, and blinks any about to hatch.
    const radar = this.kit.radar > 0
    for (const s of d.sacs) {
      if (s.hatches <= 0 || (!s.ceiling && s.hp <= 0)) continue
      if (s.ceiling && !radar) continue
      const soon = radar && s.timer < 60
      g.fillStyle = soon && this.tick % 10 < 5 ? '#ffffff' : LIME[3]
      g.fillRect(at(s.x) - 1, s.ceiling ? y : y + h - 2, 2, 2)
    }
    g.fillStyle = RAMPS.gold[3]
    for (const t of d.drops) g.fillRect(at(t.x), y + h - 1, 1, 1)
    g.fillStyle = RAMPS.pink[3]
    for (const c of d.critters) g.fillRect(at(c.x), y + 1, 1, h - 2)
    for (const o of this.mops) {
      if (o.deck !== deck || o.out) continue
      g.fillStyle = INK
      g.fillRect(at(o.x) - 2, y - 2, 5, h + 4)
      g.fillStyle = SEAT_COLORS[o.seat]!
      g.fillRect(at(o.x) - 1, y - 1, 3, h + 2)
    }
  }

  private renderSplitHud(g: CanvasRenderingContext2D) {
    bandedGradient(
      g,
      0,
      0,
      W,
      SPLIT_HUD,
      [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
      2,
    )
    g.fillStyle = INK
    g.fillRect(0, SPLIT_HUD - 1, W, 1)
    hudPanel(g, 2, 2, 88, 18)
    drawText(g, String(this.score).padStart(7, '0'), 5, 4, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    hudPanel(g, 93, 2, 66, 18)
    this.renderClock(g, 102, 11, 6)
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    drawText(g, `TIME ${secs}`, 111, 3, {
      color: this.clockColour(secs),
      outline: INK,
    })
    for (let i = 0; i < Math.min(this.spares, 5); i++)
      drawSprite(g, SPARE_SPRITE, 110 + i * 8, 12, { anchor: 'topleft' })
    // The station, top deck first: clean green, dirty red, and who's on each.
    const n = this.decks.length
    hudPanel(g, 162, 2, n * 12 + 6, 18)
    this.decks.forEach((d, i) => {
      const bx = 166 + i * 12
      this.renderDeckBox(g, bx, 5, d.clean, false)
      for (const m of this.mops) {
        if (m.out || m.deck !== i) continue
        g.fillStyle = INK
        g.fillRect(bx + m.seat * 3, 13, 4, 4)
        g.fillStyle = SEAT_COLORS[m.seat]!
        g.fillRect(bx + m.seat * 3, 13, 3, 3)
      }
    })
    hudPanel(g, 236, 2, 82, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `ST ${this.level}  CR ${this.credits}`, W - 6, 12, {
      align: 'right',
      color: LIME[3],
      outline: INK,
    })
    this.renderBanner(g, H / 2 - 10)
  }

  /** One deck on the station map: a lit green block once clean, red until then. */
  private renderDeckBox(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    clean: boolean,
    current: boolean,
  ) {
    if (current) {
      glow(g, x + 5, y + 3, 10, RAMPS.teal[3], 0.5)
      g.fillStyle = RAMPS.teal[3]
      g.fillRect(x - 2, y - 2, 14, 11)
    }
    bevel(g, x, y, 10, 7, clean ? RAMPS.leaf : RAMPS.ember, { depth: 1 })
  }

  /** The station clock: a steel dial whose hand sweeps once a minute. */
  private renderClock(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    const secs = Math.max(0, this.timer / 60)
    const urgent = secs <= ALARM_SECS
    if (urgent) glow(g, x, y, r + 8, RAMPS.ember[2], 0.5)
    shadedOrb(g, x, y, r, urgent ? RAMPS.ember : RAMPS.steel, { glint: false })
    g.fillStyle = RAMPS.cream[4]
    g.beginPath()
    g.arc(x, y, r - 2, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[2]
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2
      g.fillRect(
        Math.round(x + Math.cos(a) * (r - 3)),
        Math.round(y + Math.sin(a) * (r - 3)),
        1,
        1,
      )
    }
    const a = -Math.PI / 2 - (secs / 60) * Math.PI * 2
    g.fillStyle = INK
    for (let s = 0; s <= r - 2; s++)
      g.fillRect(
        Math.round(x + Math.cos(a) * s),
        Math.round(y + Math.sin(a) * s),
        1,
        1,
      )
    g.fillStyle = RAMPS.ember[2]
    g.fillRect(Math.round(x), Math.round(y), 1, 1)
  }

  private clockColour(secs: number): string {
    return secs <= ALARM_SECS && Math.floor(this.tick / 10) % 2
      ? RAMPS.ember[2]
      : RAMPS.gold[3]
  }

  private renderBanner(g: CanvasRenderingContext2D, y: number) {
    if (!this.banner) return
    drawText(g, this.banner.text, W / 2, y, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.purple[2],
    })
    if (this.banner.sub)
      drawText(g, this.banner.sub, W / 2, y + 20, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
  }

  /**
   * The deck: space through the windows (scrolling slower than the deck, and
   * drifting as the station turns), then the bulkheads, both baked once per
   * deck look and tiled across the view, then the console lights and the
   * deck's number by each lift.
   */
  private renderDeck(
    g: CanvasRenderingContext2D,
    deck: number,
    look: DeckLook,
    camX: number,
    viewW: number,
  ) {
    const theme = deck % DECK_LOOKS.length
    const drift = camX * 0.3 + this.tick * 0.05
    const shift = ((drift % SPACE_W) + SPACE_W) % SPACE_W
    for (let x = camX - shift; x < camX + viewW; x += SPACE_W) {
      g.save()
      g.translate(Math.round(x), 0)
      cachedLayer(g, `station-sweep-space-${theme}`, SPACE_W, H, (k) =>
        paintSpace(k, look, theme),
      )
      g.restore()
    }
    const first = Math.floor(camX / TILE_W) * TILE_W
    for (let x = first; x < camX + viewW; x += TILE_W) {
      g.save()
      g.translate(x, 0)
      cachedLayer(g, `station-sweep-wall-${theme}`, TILE_W, H, (k) =>
        paintWall(k, look),
      )
      g.restore()
      // The console under each porthole: one light awake at a time.
      const lit = (x / TILE_W + Math.floor(this.tick / 30)) % 3
      for (let i = 0; i < 3; i++) {
        const lx = x + 80 + 54
        const ly = 140 + i * 5
        g.fillStyle = i === lit ? look.trim[4] : look.trim[0]
        g.fillRect(lx, ly, 2, 2)
        if (i === lit) glow(g, lx + 1, ly + 1, 6, look.trim[3], 0.6)
      }
      // A cursor blinking on the console screen.
      if (Math.floor(this.tick / 20) % 2) {
        g.fillStyle = look.trim[3]
        g.fillRect(x + 80 + 37, 148, 3, 1)
      }
    }
    // The deck's number by each lift (the split screen's strips say it already).
    if (!this.duo)
      for (const lift of LIFTS) {
        if (lift < camX - 40 || lift > camX + viewW + 40) continue
        hudPanel(g, lift - 22, 71, 44, 11, look.wall)
        drawText(g, `DECK ${deck + 1}`, lift, 73, {
          align: 'center',
          color: look.trim[3],
          outline: INK,
        })
      }
  }

  private renderLift(
    g: CanvasRenderingContext2D,
    x: number,
    deck: number,
    look: DeckLook,
  ) {
    const top = CEILING + 34
    // The doors slide open while a Mop steps in or out.
    const rider = this.mops.find(
      (m) => m.ride && m.deck === deck && Math.abs(m.x - x) < 2,
    )
    const t = rider?.ride ? rider.ride.t : 0
    const open = rider
      ? Math.max(0, Math.min(1, Math.abs(t - RIDE_TICKS / 2) / 10 - 1))
      : 0
    const gap = Math.round(open * 12)
    // The shaft's housing: a dark recess under a hazard-striped lintel.
    g.fillStyle = INK
    g.fillRect(x - 21, top - 21, 42, FLOOR - top + 21)
    g.fillStyle = look.wall[0]
    g.fillRect(x - 20, top - 20, 40, FLOOR - top + 20)
    g.fillStyle = INK
    g.fillRect(x - 20, top - 20, 40, 3)
    g.fillStyle = RAMPS.gold[2]
    for (let row = 0; row < 3; row++)
      for (let i = -row; i < 40; i += 6) {
        const from = Math.max(0, i)
        const to = Math.min(40, i + 3)
        if (to > from) g.fillRect(x - 20 + from, top - 20 + row, to - from, 1)
      }
    // Frame posts and the header that carries the arrows.
    bevel(g, x - 17, top - 2, 4, FLOOR - top + 2, RAMPS.steel, { depth: 1 })
    bevel(g, x + 13, top - 2, 4, FLOOR - top + 2, RAMPS.steel, { depth: 1 })
    bevel(g, x - 13, top - 17, 26, 15, RAMPS.steel)
    // The car: lit from its ceiling, with a handrail.
    bandedGradient(
      g,
      x - 13,
      top,
      26,
      FLOOR - top,
      [look.trim[2], look.wall[2], look.wall[1], look.wall[0]],
      6,
    )
    g.fillStyle = look.trim[4]
    g.fillRect(x - 8, top, 16, 1)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(x - 13, top + 52, 26, 1)
    g.fillStyle = RAMPS.steel[1]
    g.fillRect(x - 13, top + 53, 26, 1)
    if (gap > 0) glow(g, x, top + 10, 18, look.trim[3], 0.35 * open)
    // Doors: bevelled steel with a porthole each and a lit stripe.
    const door = (dx: number, w: number, side: -1 | 1) => {
      if (w <= 0) return
      bevel(g, dx, top, w, FLOOR - top, DOOR_RAMP, {
        depth: 1,
        outline: null,
      })
      g.fillStyle = INK
      g.fillRect(side < 0 ? dx + w - 1 : dx, top, 1, FLOOR - top)
      g.fillStyle = look.trim[2]
      g.fillRect(dx, top + 44, w, 2)
      g.fillStyle = look.trim[4]
      g.fillRect(dx, top + 44, w, 1)
      const wx = side < 0 ? dx + w - 8 : dx + 3
      if (wx >= dx && wx + 5 <= dx + w) {
        g.fillStyle = INK
        g.fillRect(wx, top + 10, 5, 14)
        g.fillStyle = look.wall[0]
        g.fillRect(wx + 1, top + 11, 3, 12)
        g.fillStyle = rgba('#ffffff', 0.35)
        g.fillRect(wx + 1, top + 11, 1, 4)
      }
    }
    door(x - 13, 13 - gap, -1)
    door(x + gap, 13 - gap, 1)
    g.fillStyle = INK
    g.fillRect(x - 13, top - 1, 26, 1)
    if (rider && open < 1) {
      // Riding: a light runs down the door seam.
      const ly = top + 6 + ((this.tick * 2) % 40)
      glow(g, x, ly + 3, 9, RAMPS.sky[3], 0.7)
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(x - 1, ly, 2, 6)
    }
    // Arrows: lime toward a deck still dirty, grey toward a clean one.
    const arrow = (to: number, up: boolean) => {
      const ay = up ? top - 14 : top - 7
      const d = this.decks[to]
      const colour = !d ? RAMPS.steel[0] : d.clean ? RAMPS.steel[2] : LIME[3]
      if (d && !d.clean)
        glow(g, x, ay + 2, 9, LIME[3], 0.4 + 0.2 * Math.sin(this.tick / 8))
      for (let i = 0; i < 4; i++) {
        const row = up ? i : 3 - i
        g.fillStyle = INK
        g.fillRect(x - row - 1, ay + i, row * 2 + 3, 1)
        g.fillStyle = i === (up ? 1 : 2) && d && !d.clean ? LIME[4] : colour
        g.fillRect(x - row, ay + i, row * 2 + 1, 1)
      }
    }
    arrow(deck - 1, true)
    arrow(deck + 1, false)
    // The pad Mop stands on to ride (and to empty its bin): it lights when someone is on it.
    const onPad = this.mops.some(
      (m) =>
        m.deck === deck &&
        !m.out &&
        m.dead === 0 &&
        Math.abs(m.x - x) < 10 &&
        m.y >= FLOOR,
    )
    bevel(g, x - 15, FLOOR, 30, 4, RAMPS.gold, { depth: 1 })
    for (let i = 0; i < 5; i++) {
      g.fillStyle = INK
      g.fillRect(x - 13 + i * 6, FLOOR + 1, 3, 2)
    }
    if (onPad) {
      glow(g, x, FLOOR, 24, look.trim[3], 0.35 + 0.15 * Math.sin(this.tick / 5))
      g.fillStyle = look.trim[4]
      g.fillRect(x - 15, FLOOR, 30, 1)
    }
    // The bin chute beside the doors: a little hatch with a lit arrow.
    bevel(g, x + 24, FLOOR - 14, 8, 10, RAMPS.leaf, { depth: 1 })
    g.fillStyle = INK
    g.fillRect(x + 26, FLOOR - 11, 4, 5)
    g.fillStyle = LIME[3]
    g.fillRect(x + 27, FLOOR - 10, 2, 1)
    g.fillRect(x + 26, FLOOR - 9, 4, 1)
  }

  private renderSac(g: CanvasRenderingContext2D, sac: Sac) {
    const spent = sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)
    if (spent) {
      drawSprite(g, HUSK_SPRITE, sac.x, sac.ceiling ? CEILING + 2 : FLOOR - 2, {
        flipY: sac.ceiling,
      })
      return
    }
    const wobble = Math.sin(this.tick / 12 + sac.x)
    const y = sac.ceiling ? CEILING + 6 : FLOOR - 8
    glow(g, sac.x, y, 16, LIME[3], 0.2 + 0.1 * wobble)
    const sprite = sac.pulse > 0 ? SAC_FLASH : SAC_SPRITES[wobble > 0 ? 1 : 0]
    if (!sac.ceiling) dropShadow(g, sac.x, FLOOR, 8, 2, 0.4)
    drawSprite(g, sprite, sac.x, y, { flipY: sac.ceiling })
  }

  private renderKit(g: CanvasRenderingContext2D, k: RepairKit) {
    if (k.life < 90 && Math.floor(this.tick / 5) % 2) return
    const bob = Math.round(Math.sin(this.tick / 10) * 1)
    glow(g, k.x, FLOOR - 6, 14, RAMPS.leaf[3], 0.45)
    dropShadow(g, k.x, FLOOR, 6, 1.5, 0.4)
    drawSprite(g, KIT_SPRITE, k.x, FLOOR - 1 + bob, { anchor: 'feet' })
  }

  /** Is the critter showing its tell right now? */
  private showsTell(c: Critter): boolean {
    if (c.foam > 0 || c.stun > 0 || c.bubble > 0) return false
    switch (c.kind) {
      case 'biter': {
        const prey = this.nearest(c.x)
        return (
          !!prey &&
          c.cool > 0 &&
          c.cool <= BITER.cheeks &&
          this.wouldSpit(c, prey)
        )
      }
      case 'puffer':
        return (
          c.tell > 0 ||
          (c.stage === 2 && c.t % PUFFER.shedEvery > PUFFER.shedEvery - 20)
        )
      default:
        return c.tell > 0
    }
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    const def = stageDef(c.kind, c.stage)
    const after = levelCurve(this.heat, SWEEP_CURVES.growAfter)
    const need = growTicks(c.stage, after)
    const growing =
      c.stage < 2 &&
      c.foam === 0 &&
      c.stun === 0 &&
      c.bubble === 0 &&
      (c.kind !== 'crawler' || (!c.onCeiling && !c.clinging)) &&
      c.t > need - GLOW_TICKS
    const midY = c.y - def.hitH / 2
    if (growing) {
      // About to grow: a pulsing halo, and in the last moments it flickers into its next stage.
      const beat = Math.floor(this.tick / 6) % 2
      glow(g, c.x, midY, def.halfW + 10, RAMPS.pink[3], beat ? 0.7 : 0.35)
    }
    const next =
      growing && c.t > need - 30 && this.tick % 8 < 4
        ? ((c.stage + 1) as Stage)
        : c.stage
    const set = CRITTER_SPRITES[c.kind][next]
    const tell = this.showsTell(c)
    const fast = c.kind === 'gloop' || c.kind === 'puffer' ? 3 : 1
    let sprite =
      tell && (fast === 1 || Math.floor(this.tick / fast) % 2)
        ? set.tell
        : set.walk[Math.floor(this.tick / 8) % 2]!
    if (c.flash > 0) sprite = flashOf(sprite)
    const toward = Math.sign((this.nearest(c.x)?.x ?? c.x + 1) - c.x) || 1
    const facing =
      c.kind === 'roller'
        ? c.vx || toward
        : c.kind === 'biter'
          ? c.face
          : c.kind === 'crawler'
            ? c.clinging
              ? c.clinging.facing
              : c.vx || toward
            : toward
    const shake = tell && c.kind === 'roller' ? (this.tick % 4 < 2 ? 1 : -1) : 0
    const x = Math.round(c.x) + shake
    if (c.onCeiling) {
      // A ceiling bub hangs upside down; right over a Mop, its shadow falls on the floor.
      const prey = this.nearest(c.x)
      if (prey && Math.abs(prey.x - c.x) < CRAWLER.shadowAt)
        dropShadow(g, c.x, FLOOR, def.halfW, 2, 0.55)
      g.fillStyle = rgba(RAMPS.purple[4], 0.5)
      g.fillRect(x, CEILING, 1, 3)
      drawSprite(g, sprite, x - sprite.width / 2, CEILING + 1, {
        anchor: 'topleft',
        flipY: true,
        flipX: facing < 0,
      })
      return
    }
    if (c.kind === 'crawler' && c.stage === 2 && c.bubble === 0)
      this.renderWeb(g, c, def)
    if (c.y >= FLOOR - 1 && c.bubble === 0)
      dropShadow(g, c.x, FLOOR, def.halfW * 0.8, 2, 0.4)
    else if (c.bubble === 0)
      dropShadow(g, c.x, FLOOR, def.halfW * 0.5, 1.5, 0.25)
    drawSprite(g, sprite, x, Math.round(c.y) + 1, {
      anchor: 'feet',
      flipX: facing < 0,
    })
    if (c.foam > 0 && (c.foam > 60 || this.tick % 8 < 5)) {
      for (let i = 0; i < 4; i++)
        shadedOrb(
          g,
          c.x - def.halfW + 2 + (i * (def.halfW * 2 - 4)) / 3,
          c.y - 2 - (i % 2) * 3,
          3 + (i % 2),
          RAMPS.cream,
          { glint: false },
        )
    }
    if (c.stun > 0)
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 6 + i * 2.1
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(c.x + Math.cos(a) * (def.halfW * 0.6 + 3)),
          Math.round(c.y - def.hitH - 4 + Math.sin(a) * 2),
          2,
          2,
        )
      }
    if (c.bubble > 0 && (c.bubble > 60 || this.tick % 8 < 5)) {
      const r = bubbleR(def)
      glow(g, c.x, midY, r + 4, RAMPS.water[3], 0.35)
      g.strokeStyle = rgba(RAMPS.water[4], 0.85)
      g.lineWidth = 1
      g.beginPath()
      g.arc(c.x, midY, r, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(c.x - r * 0.5), Math.round(midY - r * 0.6), 2, 2)
    }
  }

  /** A web weaver's thread to the ceiling, and its web spread across the plating. */
  private renderWeb(g: CanvasRenderingContext2D, c: Critter, def: StageDef) {
    const top = c.y - def.hitH + 4
    g.fillStyle = rgba(RAMPS.purple[4], 0.6)
    g.fillRect(
      Math.round(c.x),
      CEILING,
      1,
      Math.max(0, Math.round(top - CEILING)),
    )
    g.strokeStyle = rgba(RAMPS.purple[4], 0.4)
    g.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      g.beginPath()
      g.moveTo(c.x, CEILING + 10)
      g.lineTo(c.x + i * 12, CEILING)
      g.stroke()
    }
    for (const r of [5, 9]) {
      g.beginPath()
      g.ellipse(c.x, CEILING, r * 2.4, r, 0, 0, Math.PI)
      g.stroke()
    }
  }

  private renderMop(g: CanvasRenderingContext2D, m: Mop) {
    const x = Math.round(m.x)
    const y = Math.round(m.y)
    const blink = m.hurt > 0 && Math.floor(this.tick / 2) % 2
    const lift = Math.max(0, FLOOR - y)
    dropShadow(g, x, FLOOR, Math.max(4, 9 - lift / 6), 2, 0.45)
    const frame = Math.floor(m.walkPhase) % 2
    const set = blink ? MOP_FLASH : (MOP_SPRITES[m.seat] ?? MOP_SPRITES[0]!)
    const sprite = (m.crouch ? set.crouch : set.stand)[frame]!
    drawSprite(g, sprite, x, y + 1, { anchor: 'feet', flipX: m.facing < 0 })
    const gunY = m.crouch ? y - 5 : y - 15
    const nx = x + m.facing * 10
    // The sweeper nozzle flares as it fires.
    if (m.fireCooldown > beamTuning(this.kit.beam).cooldown - 3) {
      glow(g, nx, gunY, 9, RAMPS.teal[3], 0.8)
      g.fillStyle = RAMPS.teal[4]
      g.fillRect(nx - 1, gunY - 1, 2, 2)
    }
    if (m.bin > 0) {
      // The bin on Mop's back, filling up.
      const room = binRoom(this.kit.bin)
      const bx = x - m.facing * 9 - 3
      const by = y - (m.crouch ? 12 : 20)
      bevel(g, bx, by, 6, 8, RAMPS.steel, { depth: 1 })
      const fill = Math.round((Math.min(m.bin, room) / room) * 6)
      g.fillStyle = m.bin >= room ? RAMPS.ember[3] : LIME[3]
      g.fillRect(bx + 1, by + 7 - fill, 4, fill)
    }
    if (!m.using || !m.tool) return
    if (m.tool === 'shield') {
      // The squeegee raised: a rubber blade on a handle, out front.
      const sx = x + m.facing * 13
      bevel(g, sx - 1, gunY - 12, 3, 20, RAMPS.pink, { depth: 1 })
      g.fillStyle = RAMPS.steel[3]
      g.fillRect(Math.min(sx, x + m.facing * 8), gunY, 5, 1)
      glow(g, sx, gunY - 2, 12, RAMPS.pink[3], 0.3)
    } else if (m.tool === 'vac') {
      // Air rushing into the nozzle.
      g.fillStyle = rgba(RAMPS.purple[4], 0.8)
      for (let i = 0; i < 5; i++) {
        const d = VAC.reach - ((this.tick * 3 + i * 13) % VAC.reach)
        const spread = (d / VAC.reach) * (i % 2 ? 6 : -6)
        g.fillRect(
          Math.round(nx + m.facing * d),
          Math.round(gunY + spread),
          3,
          1,
        )
      }
    } else if (m.tool === 'steam') {
      // A billow of steam, puffing out and fading.
      for (let i = 0; i < 5; i++) {
        const d = (this.tick * 2 + i * 9) % STEAM.reach
        const r = 2 + d / 9
        g.fillStyle = rgba('#ffffff', 0.55 * (1 - d / STEAM.reach))
        g.beginPath()
        g.arc(nx + m.facing * d, gunY - d / 6 + (i % 2) * 3, r, 0, Math.PI * 2)
        g.fill()
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const me = this.mops[0]!
    // The console the HUD sits in, with a lit lip along the deck.
    bandedGradient(
      g,
      0,
      0,
      W,
      55,
      [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
      3,
    )
    g.fillStyle = RAMPS.steel[2]
    g.fillRect(0, 53, W, 1)
    g.fillStyle = INK
    g.fillRect(0, 54, W, 2)
    hudPanel(g, 4, 3, 92, 20)
    drawText(g, String(this.score).padStart(7, '0'), 9, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    hudPanel(g, 100, 3, 74, 20)
    this.renderClock(g, 112, 13, 7)
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    drawText(g, `TIME ${secs}`, 124, 5, {
      color: this.clockColour(secs),
      outline: INK,
    })
    drawSprite(g, CREDIT_ICON, 124, 14, { anchor: 'topleft' })
    drawText(g, `${this.credits} CR`, 133, 14, {
      color: RAMPS.gold[3],
      outline: INK,
    })
    hudPanel(g, 178, 3, 138, 20)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 9, 5, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `STATION ${this.level}  DECK ${me.deck + 1}`, W - 9, 14, {
      align: 'right',
      color: LIME[3],
      outline: INK,
    })
    hudPanel(g, 4, 26, 94, 13)
    drawText(g, 'CHARGE', 8, 29, { color: RAMPS.leaf[4], outline: INK })
    const frac = Math.max(0, me.health) / MAX_HEALTH
    gauge(g, 47, 30, 47, 5, frac, chargeRamp(frac))
    // What Mop carries on B, and its bin.
    hudPanel(g, 102, 26, 64, 13)
    drawSprite(g, TOOL_ICONS[me.tool ?? 'beam'], 105, 28, { anchor: 'topleft' })
    if (me.tool) {
      drawText(g, TOOLS[me.tool].short, 117, 28, {
        color: TOOLS[me.tool].ramp[3],
        outline: INK,
      })
      const left = me.toolCharge / toolCharge(me.tool, this.kit.tanks)
      gauge(g, 117, 36, 45, 1, left, TOOLS[me.tool].ramp)
    } else drawText(g, 'BEAM', 117, 29, { color: RAMPS.teal[3], outline: INK })
    hudPanel(g, 170, 26, 52, 13)
    drawSprite(g, BIN_ICON, 173, 28, { anchor: 'topleft' })
    drawText(g, `${me.bin}/${binRoom(this.kit.bin)}`, 184, 29, {
      color: this.binColour(me),
      outline: INK,
    })
    if (this.spares > 0) {
      hudPanel(g, 226, 26, 26, 13)
      drawSprite(g, SPARE_SPRITE, 229, 29, { anchor: 'topleft' })
      drawText(g, `X${this.spares}`, 237, 29, {
        color: RAMPS.sky[3],
        outline: INK,
      })
    }
    // The station, top deck first: clean decks green, dirty ones red, Mop's lit.
    const n = this.decks.length
    hudPanel(g, W - 10 - n * 13, 26, n * 13 + 6, 13)
    this.decks.forEach((d, i) => {
      const bx = W - 6 - (n - i) * 13
      this.renderDeckBox(g, bx, 29, d.clean, i === me.deck)
    })
    // Deck map: sacs left (green), critters (pink), Mop (cyan).
    this.use(me.deck)
    hudPanel(g, 4, 42, W - 8, 10)
    this.renderRadar(g, 8, 45, W - 16, 4, me.deck, me)
    this.renderBanner(g, 110)
  }

  /** The Supply Locker: a shelf of upgrades, the crew's credits, and the critter count. */
  private renderLocker(g: CanvasRenderingContext2D, l: Locker) {
    bandedGradient(
      g,
      0,
      0,
      W,
      H,
      [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0], RAMPS.night[1]],
      6,
    )
    hudPanel(g, 4, 4, 160, 20, RAMPS.purple)
    // The locker's two doors, swinging open as the shuttle docks.
    const doors = Math.min(1, l.ticks / LOCKER.doors)
    const steel = shade(RAMPS.steel, RAMPS.night[0], 0.3)
    bevel(g, 170, 4, 60, 20, RAMPS.night, { depth: 1 })
    for (let s = 0; s < 3; s++) {
      g.fillStyle = [LIME[3], RAMPS.gold[3], RAMPS.pink[3]][s]!
      g.fillRect(176 + s * 18, 18, 10, 3)
    }
    const door = Math.max(1, Math.round(30 * (1 - doors)))
    bevel(g, 170, 4, door, 20, steel, { depth: 1 })
    bevel(g, 230 - door, 4, door, 20, steel, { depth: 1 })
    drawText(g, 'SUPPLY LOCKER', 8, 8, {
      scale: 2,
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.purple[2],
    })
    hudPanel(g, 236, 6, 80, 14, RAMPS.gold)
    drawSprite(g, CREDIT_ICON, 241, 10, { anchor: 'topleft' })
    drawText(g, `${this.credits} CREDITS`, 249, 10, {
      color: '#ffffff',
      outline: INK,
    })
    // The shelf.
    LOCKER_ITEMS.forEach((item, i) => {
      const y = 28 + i * 21
      const on = i === l.cursor
      const why = cannotBuy(item, this.kit, l.visit, this.credits)
      if (on) glow(g, 100, y + 9, 70, RAMPS.teal[3], 0.25)
      hudPanel(g, 6, y, 196, 18, on ? RAMPS.teal : RAMPS.night)
      this.renderLockerIcon(g, item, l, 11, y + 4)
      const name = item.id === 'tool' ? TOOLS[l.visit.tool].name : item.name
      drawText(g, name, 26, y + 6, {
        color: why && item.id !== 'launch' ? RAMPS.steel[2] : '#ffffff',
        outline: INK,
      })
      if (item.id === 'launch') return
      const owned = item.id in this.kit ? this.kit[item.id as keyof Kit] : 0
      for (let p = 0; p < (Number.isFinite(item.max) ? item.max : 0); p++) {
        g.fillStyle = INK
        g.fillRect(151 + p * 5, y + 7, 4, 4)
        g.fillStyle = p < owned ? LIME[3] : RAMPS.night[2]
        g.fillRect(151 + p * 5, y + 7, 3, 3)
      }
      drawText(
        g,
        why === 'SOLD OUT' ? 'OUT' : String(priceOf(item, this.kit)),
        196,
        y + 6,
        {
          align: 'right',
          color: why === 'NEED CREDITS' ? RAMPS.ember[3] : RAMPS.gold[3],
          outline: INK,
        },
      )
    })
    // The critter count: every family swept this run.
    hudPanel(g, 208, 28, 108, 104, RAMPS.night)
    drawText(g, 'CRITTERS SWEPT', 262, 32, {
      align: 'center',
      color: LIME[3],
      outline: INK,
    })
    FAMILY_NAMES.forEach((f, i) => {
      const y = 44 + i * 17
      const sprite = CRITTER_SPRITES[f][0].walk[Math.floor(this.tick / 12) % 2]!
      drawSprite(g, sprite, 226, y + 13, { anchor: 'feet' })
      drawText(g, FAMILIES[f].name, 242, y + 3, {
        color: FAMILIES[f].spark,
        outline: INK,
      })
      drawText(g, String(this.swept[f]), 312, y + 3, {
        align: 'right',
        color: '#ffffff',
        outline: INK,
      })
    })
    // Mop, waving from the hatch.
    const wave = Math.floor(this.tick / 16) % 2
    drawSprite(g, MOP_SPRITES[0]!.stand[wave]!, 262, 168, { anchor: 'feet' })
    drawText(g, 'MOP', 262, 172, {
      align: 'center',
      color: RAMPS.sky[3],
      outline: INK,
    })
    // What the chosen item does, the locker's word, and the shuttle's countdown.
    const item = LOCKER_ITEMS[l.cursor]!
    hudPanel(g, 6, 198, W - 12, 38, RAMPS.purple)
    drawText(g, item.blurb, 12, 203, { color: '#ffffff', outline: INK })
    drawText(g, l.note, 12, 214, { color: RAMPS.gold[3], outline: INK })
    const left = Math.ceil((LOCKER.wait - l.ticks) / 60)
    drawText(g, 'UP/DOWN PICK  A BUY  B LAUNCH', 12, 225, {
      color: RAMPS.steel[3],
      outline: INK,
    })
    drawText(g, `SHUTTLE ${left}`, W - 12, 225, {
      align: 'right',
      color: left <= 10 ? RAMPS.ember[3] : RAMPS.teal[3],
      outline: INK,
    })
  }

  private renderLockerIcon(
    g: CanvasRenderingContext2D,
    item: LockerItem,
    l: Locker,
    x: number,
    y: number,
  ) {
    switch (item.id) {
      case 'spare':
        drawSprite(g, SPARE_SPRITE, x + 1, y + 1, { anchor: 'topleft' })
        return
      case 'clock':
        shadedOrb(g, x + 4, y + 4, 4, RAMPS.gold, { glint: false })
        g.fillStyle = RAMPS.cream[4]
        g.fillRect(x + 2, y + 2, 5, 5)
        g.fillStyle = INK
        g.fillRect(x + 4, y + 2, 1, 3)
        g.fillRect(x + 4, y + 4, 2, 1)
        return
      case 'bin':
        drawSprite(g, BIN_ICON, x, y, { anchor: 'topleft' })
        return
      case 'tanks':
        drawSprite(g, TOOL_ICONS.vac, x, y, { anchor: 'topleft' })
        return
      case 'beam':
        drawSprite(g, TOOL_ICONS.beam, x, y, { anchor: 'topleft' })
        return
      case 'radar':
        bevel(g, x, y + 1, 10, 7, RAMPS.night, { depth: 1 })
        g.fillStyle = LIME[3]
        g.fillRect(x + 2 + (Math.floor(this.tick / 8) % 6), y + 4, 2, 2)
        return
      case 'tool':
        drawSprite(g, TOOL_ICONS[l.visit.tool], x, y, { anchor: 'topleft' })
        return
      case 'launch':
        drawText(g, '>>', x, y + 2, { color: LIME[3], outline: INK })
    }
  }
}

/** The charge gauge's colour: green while healthy, gold when low, red near empty. */
function chargeRamp(frac: number): Ramp {
  return frac > 0.5 ? RAMPS.leaf : frac > 0.25 ? RAMPS.gold : RAMPS.ember
}

/** The table guide: the families and their stages, the tools, the bin and the locker. */
function stationGuide(): ArcadeGuidePage[] {
  return [
    {
      title: 'CRITTERS THAT GROW UP',
      scale: 1,
      lines: FAMILY_NAMES.flatMap((f) => [
        FAMILIES[f].stages.map((s) => s.name).join(' > '),
        `  TELL: ${FAMILIES[f].tell}`,
        `  ${FAMILIES[f].answer}`,
      ]),
    },
    {
      title: 'TOOLS',
      scale: 1,
      lines: [
        'A: SWEEPER BEAM. B: THE TOOL MOP CARRIES',
        'POPPED SACS DROP TOOLS. B JUMPS WITHOUT ONE',
        ...PICKUP_TOOLS.map((t) => `${TOOLS[t].short}: ${TOOLS[t].does}`),
      ],
    },
    {
      title: 'THE BIN AND THE LOCKER',
      scale: 1,
      lines: [
        'SWEPT CRITTERS GO IN YOUR BIN, NEVER HURT.',
        'A FULL BIN SLOWS MOP. STAND ON A LIFT PAD',
        'TO EMPTY IT: EACH CRITTER PAYS CREDITS.',
        'CLEAN DECKS AND STATIONS PAY CREDITS TOO.',
        'BETWEEN STATIONS THE SUPPLY LOCKER SELLS',
        'SPARE MOPS, CLOCK, BIGGER BINS, TOOL TANKS,',
        'BEAM BOOSTS, THE SAC RADAR AND A TOOL OF',
        'THE DAY. THE SHUTTLE WAITS 40 SECONDS.',
      ],
    },
  ]
}

const stationSweep: ArcadeGameModule = {
  create: (options) => new StationSweep(options),
  guide: () => stationGuide(),
}

export const create = stationSweep.create
export default stationSweep
