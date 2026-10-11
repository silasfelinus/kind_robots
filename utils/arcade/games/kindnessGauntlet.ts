// /utils/arcade/games/kindnessGauntlet.ts
//
// Kindness Gauntlet -- the Kind Robots Arcade's Gauntlet II riff (conductor
// kr-arcade/t-009 game factory: procedurally built floors, all four classes,
// keys with locked doors, and same-device co-op; depth pass t-051..t-054,
// depth-pass/CABINETS.md section 5, "The Deep Archive"). A repair bot explores
// a glitchy old server dungeon floor by floor: wrench sparks fix the glitches
// that swarm out of broken generators, shut the generators down, free the bots
// trapped in cages, and find the stairs down.
//
// Up to four can play on one device, each picking a different bot. They share
// one screen (nobody can wander off it), one key ring and one team score (each
// seat keeps its own tally too); each has a battery of their own. A bot whose
// battery runs flat stops where it stands until its partner rolls up and
// shares a charge, or sparks it full of charge; a flat bot comes back with a
// little charge on the next floor. The run ends when every bot is flat.
//
// Four bots to choose from, after the classic's four heroes: Hugs (power: big
// sparks that hit twice and pass through a glitch), Fix (armor: clinging
// glitches drain the least), Sage (magic: three pulses, and each one jolts the
// generators on screen too) and Zip (speed: the fastest wheels and quickest
// sparks).
//
// The menagerie (kindnessGauntlet/roster.ts): nine glitch kinds, each released
// by a generator of its own in three tiers, each with a tell and an answer.
// Kindness is a mechanic: a spark that hits a partner shares charge instead of
// hurting, and the Hug Token draws every glitch on the floor to whoever holds
// it (double points; pass it by touch, or carry it into a generator to
// overload it). The Old Mainframe comments on everything from the corner
// (kindnessGauntlet/voice.ts), and she minds her snacks: sparks break them.
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
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  type PixelSprite,
  type Ramp,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  IMP_TELL,
  MIMIC_BLINK,
  POPUP_TELL,
  ROSTER,
  type Glitch,
  type GlitchKind,
  type GlitchWorld,
  type Prey,
  type Tier,
  debutOn,
  kindsUpTo,
  newGlitch,
  steerGlitch,
} from '../kindnessGauntlet/roster'
import {
  GENERATOR_SPRITES,
  GLITCH_FLASH,
  GLITCH_FRAMES,
  GLITCH_GHOSTS,
  GLITCH_PALETTE,
  IMP_INHALE,
  LOOT_SACK,
  SNACK_SPRITE,
  TIER_COLOURS,
  raster,
} from '../kindnessGauntlet/rosterArt'
import {
  CUE_PRIORITY,
  MAINFRAME_FACE,
  type VoiceCue,
  mainframeBleeps,
  voiceLine,
} from '../kindnessGauntlet/voice'

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
const DRAIN_TICKS = 40
const SNACK_CHARGE = 40
const GLITCH_RANGE = T * 14
const EXIT_TICKS = 120

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
/** Charge a spark moves from its thrower to the partner it hits. */
export const SPARK_SHARE = 5
/** A battery under this warns the Mainframe; above REARM she will warn again. */
const LOW_BATTERY = 75
const LOW_REARM = 120
/** How long the Hug Token waits before it can change hands again. */
const TOKEN_PASS_TICKS = 90
/** A pop-up's packet: ticks in the air and the splash it lands with. */
const PACKET_TICKS = 54
const PACKET_SPLASH = 13
const BOLT_SPEED = 1.7
/** How long a pulse leaves a coffee spill dry. */
export const DRY_TICKS = 5 * 60
const VOICE_TICKS = 150
const INTRO_TICKS = 240

export const GAUNTLET_CURVES = {
  generators: { start: 3, step: 0.6, limit: 7 },
  /** A generator's hits per tier: every hit (or two, deeper down) drops it a tier. */
  generatorHp: { start: 3, step: 0.34, limit: 6 },
  spawnEvery: { start: 132, step: -10, limit: 50 },
  glitchSpeed: { start: 0.62, step: 0.07, limit: 1.35 },
  /** Battery a clinging glitch drains each bite. */
  clingCost: { start: 4, step: 0.5, limit: 10 },
  glitchCap: { start: 12, step: 2, limit: 28 },
  snacks: { start: 4, step: -0.34, limit: 1 },
  cages: { start: 1, step: 0.5, limit: 3 },
  /** The chance a generator is tier 2 or better, and tier 3. */
  tier2: { start: 0.7, step: 0.03, limit: 0.9 },
  tier3: { start: 0.25, step: 0.04, limit: 0.6 },
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
  id: number
  /** The glitch kind it releases. */
  kind: GlitchKind
  /** Its tier now (each tier's worth of hits drops it one), and the tier it started at. */
  tier: Tier
  topTier: Tier
  /** Hits per tier. */
  per: number
  hp: number
  maxHp: number
  timer: number
  flash: number
}
/** A pop-up's packet arcing over the racks, or a firewall imp's slow straight spark. */
type Shot =
  | {
      kind: 'packet'
      x0: number
      y0: number
      x: number
      y: number
      t: number
      tier: Tier
    }
  | { kind: 'bolt'; x: number; y: number; vx: number; vy: number; life: number }
/** The Hug Token: a bouncing heart that draws every glitch to whoever holds it. */
type Token = {
  x: number
  y: number
  vx: number
  vy: number
  /** The seat holding it, or -1 while it bounces loose. */
  holder: number
  wait: number
}
type Spark = Thing & {
  vx: number
  vy: number
  life: number
  /** Glitches this spark can still pass through. */
  pierce: number
  /** The hero who threw it. */
  owner: Hero
  /** Glitches it has already hit (a piercing spark hits each once). */
  hit: number[]
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
  /** This seat's own tally (the team score is everyone's together). */
  points: number
  /** The Mainframe has said this bot is low (rearmed once it charges back up). */
  warned: boolean
}
type Item = Thing & {
  kind: 'snack' | 'pulse' | 'cage' | 'key'
  /** A snack a mimic just turned into: sparks pass over it for this many ticks. */
  safe?: number
}
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

/** `text` broken into lines of at most `width` characters, at the spaces. */
function wrapWords(text: string, width: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) out.push(line)
  return out
}

/** How close a spark must pass to hit a glitch of this kind. */
function hitRadius(kind: GlitchKind): number {
  return kind === 'brute' ? 9 : kind === 'bug' ? 5 : 7
}

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
    points: 0,
    warned: false,
  }
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** walls[] value for a solid server rack (the floor is built all rack, then carved). */
const RACK = 1

type View = 'down' | 'up' | 'side'

/** Each bot's body and head ramps, around its class colours. */
const BOT_LOOKS: Record<BotClass, { body: Ramp; head: Ramp }> = {
  hugs: {
    body: ['#4a1606', '#8a2e0a', '#ea580c', '#fb923c', '#fed7aa'],
    head: ['#7a2c10', '#c2541b', '#fdba74', '#fed7aa', '#fff4e6'],
  },
  fix: {
    body: ['#0b3a4a', '#0f6b73', '#0d9488', '#2dd4bf', '#a7f3e4'],
    head: ['#0f6b73', '#14a3a0', '#5eead4', '#a7f3e4', '#e6fffa'],
  },
  sage: {
    body: ['#24124f', '#4c2a99', '#7c3aed', '#a78bfa', '#e9e1ff'],
    head: ['#4c2a99', '#7c5cf0', '#c4b5fd', '#e4dcff', '#ffffff'],
  },
  zip: {
    body: ['#123d2a', '#1d6b3a', '#16a34a', '#4ade80', '#d9ffe0'],
    head: ['#1d6b3a', '#3fa34d', '#86efac', '#c6f7d6', '#f0fff4'],
  },
}

function botPalette(cls: BotClass): Record<string, string> {
  const { body, head } = BOT_LOOKS[cls]
  return {
    D: head[0],
    S: head[1],
    B: head[2],
    L: head[3],
    H: head[4],
    d: body[0],
    s: body[1],
    b: body[2],
    l: body[3],
    h: body[4],
    k: INK,
    e: RAMPS.gold[3],
    w: '#ffffff',
    M: RAMPS.steel[3],
    m: RAMPS.steel[2],
    n: RAMPS.steel[1],
    p: RAMPS.pink[3],
    g: RAMPS.teal[3],
    q: RAMPS.pink[3],
    Q: RAMPS.gold[4],
  }
}

/** Stamp `art` into `grid` at (x, y); '.' in the art is see-through. */
function stamp(grid: string[][], x: number, y: number, art: readonly string[]) {
  art.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const ch = line[dx]!
      const row = grid[y + dy]
      if (ch !== '.' && row && x + dx >= 0 && x + dx < row.length)
        row[x + dx] = ch
    }
  })
}

const BOT_HEAD: Record<View, readonly string[]> = {
  down: ['.HHHHHHHH.', 'HLLLLLLLLS', 'LkkkkkkkkS', 'LkeekkeekS', '.LBBBBBBS.'],
  up: ['.HHHHHHHH.', 'HLLLLLLLLS', 'LLBBBBBBBS', 'LBmMmMmMBS', '.BSSSSSSS.'],
  side: ['.HHHHHHH..', 'HLLLLLLLBS', 'LMLLLkkkkS', 'LmLLLkkeeS', '.LBBBBBBS.'],
}
const BOT_TORSO: Record<View, readonly string[]> = {
  down: ['lhhhhhhhbs', 'hlkkkkllbs', 'llkpgklbbs', 'lbbbbbbbsd', '.ssssssss.'],
  up: ['lhhhhhhhbs', 'hllllllbbs', 'llmMmMmbbs', 'lbbbbbbbsd', '.ssssssss.'],
  side: ['lhhhhhbs', 'hlllllks', 'lllbbkgs', 'lbbbbbsd', '.sssssd.'],
}
const BOT_LEGS: Record<View, readonly (readonly string[])[]> = {
  down: [
    ['..Mn..Mn..', '.Mnn...nn.'],
    ['..Mn..Mn..', '..nn..Mnn.'],
  ],
  up: [
    ['..Mn..Mn..', '.Mnn...nn.'],
    ['..Mn..Mn..', '..nn..Mnn.'],
  ],
  side: [
    ['.Mn..Mn.', 'Mnn..Mnn'],
    ['..MnMn..', '..nnnn..'],
  ],
}

/**
 * A bot as rows of palette letters: 16 wide, feet on the bottom row. All four share Fix's
 * head and frame, each with its own silhouette: Hugs's big hugging arms, Fix's shoulder pads
 * and treads, Sage's antenna and robe, Zip's slim body, fin and wheel. `frame` is the walk step.
 */
function botRows(cls: BotClass, view: View, frame: 0 | 1): string[] {
  const grid = Array.from({ length: 16 }, () => new Array<string>(16).fill('.'))
  const side = view === 'side'
  const tx = side ? 4 : 3
  if (cls === 'hugs' && side) stamp(grid, 2, 10 + frame, ['SS.', 'DS.'])
  if (cls === 'zip' && side)
    stamp(grid, 0, 5, ['..H', '.HL', 'HLB', 'LBS', '.S.'])
  if (cls === 'zip' && !side) stamp(grid, 7, 2, ['HL', 'LB'])
  if (cls === 'sage') stamp(grid, 6, 1, ['.Q.', 'QqQ', '.M.'])
  stamp(grid, 3, 4, BOT_HEAD[view])
  if (cls === 'zip' && !side) {
    stamp(
      grid,
      4,
      9,
      view === 'down'
        ? ['lhhhhhbs', 'hlkkkkbs', 'llkpgkbs', 'lbbbbbsd', '.ssssss.']
        : ['lhhhhhbs', 'hllllbbs', 'lmMmMmbs', 'lbbbbbsd', '.ssssss.'],
    )
  } else {
    stamp(grid, tx, 9, BOT_TORSO[view])
  }
  if (cls === 'sage') {
    const hem = frame ? '.dsdsdsdsds.' : '.sdsdsdsdsd.'
    if (side) stamp(grid, 3, 12, ['lbbbbbbbsd', hem.slice(1, 11)])
    else stamp(grid, 2, 12, ['lbbbbbbbbbsd', hem])
  }
  if (cls === 'fix') {
    if (side) stamp(grid, 5, 9, ['MMm', 'mmn'])
    else {
      stamp(grid, 1, 9, ['MMM', 'mmn'])
      stamp(grid, 12, 9, ['MMm', 'mnn'])
    }
    const tread = frame ? 'mMmMmMmMmM' : 'MmMmMmMmMm'
    stamp(grid, 3, 14, [side ? `.${tread.slice(1, 9)}.` : tread, 'nnnnnnnnnn'])
  } else if (cls === 'zip') {
    if (side)
      stamp(
        grid,
        5,
        13,
        frame ? ['.nmMn.', 'nMkwMn', '.nMmn.'] : ['.nMMn.', 'nMwkMn', '.nmmn.'],
      )
    else
      stamp(
        grid,
        6,
        13,
        frame ? ['nmmn', 'nMMn', '.nn.'] : ['nMMn', 'nmmn', '.nn.'],
      )
  } else {
    stamp(grid, tx, 14, BOT_LEGS[view][frame]!)
  }
  if (cls === 'hugs') {
    const lift = frame
    if (side) stamp(grid, 10, 10 + lift, ['.LLB', 'LBBS', '.SSD'])
    else {
      stamp(grid, 0, 9 + lift, ['.HS', 'HLS', 'HLS', 'LBS', '.SD'])
      stamp(grid, 13, 10 - lift, ['LB.', 'LBS', 'LBS', 'BSD', '.D.'])
    }
  }
  return grid.map((row) => row.join(''))
}

type BotSprites = Record<View, readonly [PixelSprite, PixelSprite]>

const BOT_SPRITES = Object.fromEntries(
  CLASS_ORDER.map((cls) => {
    const palette = botPalette(cls)
    const views = (['down', 'up', 'side'] as const).map(
      (view) =>
        [
          view,
          [
            pixelSprite(botRows(cls, view, 0), palette),
            pixelSprite(botRows(cls, view, 1), palette),
          ] as const,
        ] as const,
    )
    return [cls, Object.fromEntries(views) as BotSprites]
  }),
) as Record<BotClass, BotSprites>

/** The aiming wrench nut, shown the exact way (of eight) the bot faces. */
const WRENCH_SPRITE = pixelSprite(['MM.', 'MwM', '.Mm'], {
  M: RAMPS.steel[3],
  m: RAMPS.steel[2],
  w: '#ffffff',
})

/** An empty battery blinking over a flat bot. */
const FLAT_SPRITE = pixelSprite(
  ['MMMMMMM.', 'Mr....MM', 'Mr....MM', 'MMMMMMM.'],
  {
    M: RAMPS.steel[3],
    r: RAMPS.ember[2],
  },
)

const PINK_PALETTE = {
  h: RAMPS.pink[4],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
}
const GOLD_PALETTE = {
  y: '#ffffff',
  G: RAMPS.gold[4],
  g: RAMPS.gold[3],
  o: RAMPS.gold[2],
  O: RAMPS.gold[1],
}

const KEY_SPRITE = pixelSprite(
  ['.yGg.......', 'yG.gGGGGGGg', 'Gg.oooooooo', '.go....oo.o', '.......O..O'],
  GOLD_PALETTE,
)

/** A kindness pulse: a pink heart. */
const HEART_SPRITE = pixelSprite(
  [
    '.PP...PP.',
    'PhhP.PPPp',
    'PhPPPPPPp',
    'PPPPPPPPp',
    '.PPPPPPp.',
    '..pPPPq..',
    '...ppq...',
    '....q....',
  ],
  PINK_PALETTE,
)

/** A little gold bot trapped in a cage, waving for help (two frames). */
const CAGED_PALETTE = {
  H: RAMPS.gold[4],
  L: RAMPS.gold[3],
  B: RAMPS.gold[2],
  S: RAMPS.gold[1],
  k: INK,
  e: '#ffffff',
  p: RAMPS.pink[3],
}
const CAGED_BODY = ['.LkekekS.', '.LBBpBBS.', '..SSSSS..']
const CAGED_SPRITES = [
  pixelSprite(
    [
      '..HHHHH..',
      '.HLLLLLS.',
      ...CAGED_BODY,
      'LLBBBBBSS',
      'L.BBBBBS.',
      '..S...S..',
    ],
    CAGED_PALETTE,
  ),
  pixelSprite(
    [
      'L.HHHHH.S',
      'LHLLLLLSS',
      ...CAGED_BODY,
      '.LBBBBBS.',
      '.LBBBBBS.',
      '..S...S..',
    ],
    CAGED_PALETTE,
  ),
]
const CAGE_BARS = pixelSprite(
  raster(13, 15, (x, y) => {
    if (y === 0) return 'W'
    if (y === 1) return 'M'
    if (y === 2 || y === 12) return 'k'
    if (y === 13) return 'm'
    if (y === 14) return 'n'
    return x % 3 === 0 ? 'M' : '.'
  }),
  {
    W: RAMPS.steel[4],
    M: RAMPS.steel[3],
    m: RAMPS.steel[2],
    n: RAMPS.steel[1],
    k: INK,
  },
  { outline: null },
)

/** A locked door tile: shaded gold bars and a crossbar over the dark, with a keyhole plate. */
const DOOR_SPRITE = pixelSprite(
  raster(16, 16, (x, y) => {
    if (y === 0) return 'W'
    if (y === 1) return 'M'
    if (y === 14) return 'm'
    if (y === 15) return 'k'
    if (x >= 5 && x <= 9 && y >= 9 && y <= 13) {
      if (x === 7 && y >= 10 && y <= 12) return 'k'
      return x === 5 || y === 9 ? 'G' : x === 9 || y === 13 ? 'o' : 'g'
    }
    if (y === 6) return 'G'
    if (y === 7) return 'g'
    if (y === 8) return 'O'
    const bar = x % 5
    if (x === 0 || x === 15 || bar === 0 || bar === 4) return 'v'
    return bar === 1 ? 'G' : bar === 2 ? 'g' : 'O'
  }),
  {
    ...GOLD_PALETTE,
    W: RAMPS.steel[4],
    M: RAMPS.steel[3],
    m: RAMPS.steel[1],
    k: INK,
    v: '#1c1520',
  },
  { outline: null },
)

const SPARK_PALETTE = { h: RAMPS.gold[3], Y: RAMPS.gold[4], w: '#ffffff' }
const SPARK_SPRITES = [
  pixelSprite(['..h..', '.hYh.', 'hYwYh', '.hYh.', '..h..'], SPARK_PALETTE, {
    outline: RAMPS.rust[1],
  }),
  pixelSprite(['h...h', '.hYh.', '.YwY.', '.hYh.', 'h...h'], SPARK_PALETTE, {
    outline: RAMPS.rust[1],
  }),
]
/** Hugs's big sparks. */
const BIG_SPARK_SPRITES = [
  pixelSprite(
    [
      '...h...',
      '..hYh..',
      '.hYwYh.',
      'hYwwwYh',
      '.hYwYh.',
      '..hYh..',
      '...h...',
    ],
    SPARK_PALETTE,
    { outline: RAMPS.rust[1] },
  ),
  pixelSprite(
    [
      'h..h..h',
      '.hYYYh.',
      '.YwwwY.',
      'hYwwwYh',
      '.YwwwY.',
      '.hYYYh.',
      'h..h..h',
    ],
    SPARK_PALETTE,
    { outline: RAMPS.rust[1] },
  ),
]

/** HUD icons: a pulse heart, a rescued bot and a key. */
const HUD_HEART = pixelSprite(
  ['hP.PP', 'PPPPq', '.PPq.', '..q..'],
  PINK_PALETTE,
)
const HUD_BOT = pixelSprite(['HLLLS', 'LkLkS', 'LBBBS', '.S.S.'], CAGED_PALETTE)
const HUD_KEY = pixelSprite(['.Gg...', 'G.Gggg', '.go.oO'], GOLD_PALETTE)

/** The raised floor of the server room: cool steel panels. */
const FLOOR_RAMP: Ramp = ['#0a0a1e', '#131735', '#1c2248', '#2a3363', '#414d8a']
/** The rack walls' colours change every floor, so a long run doesn't look like one dungeon. */
const WALL_THEMES: readonly Ramp[] = [
  RAMPS.purple,
  RAMPS.sky,
  RAMPS.pink,
  RAMPS.steel,
]
const CABLE_RAMPS: readonly Ramp[] = [RAMPS.pink, RAMPS.teal, RAMPS.gold]
const LED_COLOURS = [
  RAMPS.leaf[3],
  RAMPS.teal[3],
  RAMPS.leaf[3],
  RAMPS.gold[3],
  RAMPS.ember[3],
]
const FOG = RAMPS.night[0]
const FOG_BANDS = [rgba(FOG, 0.75), rgba(FOG, 0.48), rgba(FOG, 0.22)]
const AO_BANDS = [rgba(INK, 0.6), rgba(INK, 0.38), rgba(INK, 0.18)]

/** A steady per-tile dice roll for floor and rack details (never the game's rng). */
function tileHash(tx: number, ty: number, level: number): number {
  let h =
    Math.imul(tx + 1, 374761393) +
    Math.imul(ty + 1, 668265263) +
    Math.imul(level, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function rackAt(walls: Uint8Array, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true
  return walls[ty * MW + tx] === RACK
}

function wallTheme(level: number): Ramp {
  return WALL_THEMES[(level - 1) % WALL_THEMES.length]!
}

/**
 * The static floor plan, tiles (x0..x1, y0..y1): banded raised-floor panels (some perforated,
 * some vented) with cable runs along the foot of the walls and the walls' shadows, then the
 * walls as server racks seen from above: bevelled tops with vents, lit where they meet the
 * floor, and a rack front of drive bays, grilles or fans wherever floor lies below. Doors are
 * painted as floor; they're drawn live over it while locked.
 */
function paintFloor(
  k: CanvasRenderingContext2D,
  walls: Uint8Array,
  level: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const theme = wallTheme(level)
  const rack = (tx: number, ty: number) => rackAt(walls, tx, ty)
  for (let ty = y0; ty <= y1; ty++) {
    // Each row of wall-foot cable is one run, so it reads as laid, not scattered.
    const cabled = tileHash(0, ty, level + 7) < 0.6
    const cable = CABLE_RAMPS[Math.floor(tileHash(1, ty, level) * 3)]!
    for (let tx = x0; tx <= x1; tx++) {
      if (rack(tx, ty)) continue
      const x = tx * T
      const y = ty * T
      bandedGradient(k, x, y, T, T, [FLOOR_RAMP[2], FLOOR_RAMP[1]], 2)
      k.fillStyle = FLOOR_RAMP[3]
      k.fillRect(x, y, T - 1, 1)
      k.fillRect(x, y, 1, T - 1)
      k.fillStyle = FLOOR_RAMP[0]
      k.fillRect(x, y + T - 1, T, 1)
      k.fillRect(x + T - 1, y, 1, T)
      const h = tileHash(tx, ty, level)
      if (h < 0.12) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            k.fillStyle = FLOOR_RAMP[0]
            k.fillRect(x + 3 + i * 4, y + 3 + j * 4, 2, 2)
            k.fillStyle = FLOOR_RAMP[3]
            k.fillRect(x + 3 + i * 4, y + 5 + j * 4, 2, 1)
          }
        }
      } else if (h > 0.95) {
        for (let i = 0; i < 4; i++) {
          k.fillStyle = INK
          k.fillRect(x + 3, y + 4 + i * 2, 10, 1)
          k.fillStyle = FLOOR_RAMP[3]
          k.fillRect(x + 3, y + 5 + i * 2, 10, 1)
        }
      }
      const wallAbove = rack(tx, ty - 1)
      if (wallAbove && cabled) {
        k.fillStyle = cable[3]
        k.fillRect(x, y + 4, T, 1)
        k.fillStyle = cable[1]
        k.fillRect(x, y + 5, T, 1)
        k.fillStyle = RAMPS.teal[1]
        k.fillRect(x, y + 7, T, 1)
        k.fillStyle = RAMPS.night[0]
        k.fillRect(x, y + 8, T, 1)
        if (h > 0.5) {
          k.fillStyle = RAMPS.steel[3]
          k.fillRect(x + Math.floor(h * 12) + 2, y + 3, 1, 4)
        }
      }
      if (wallAbove) {
        AO_BANDS.forEach((band, i) => {
          k.fillStyle = band
          k.fillRect(x, y + i, T, 1)
        })
      }
      if (rack(tx - 1, ty)) {
        k.fillStyle = AO_BANDS[0]!
        k.fillRect(x, y, 1, T)
        k.fillStyle = AO_BANDS[2]!
        k.fillRect(x + 1, y, 1, T)
      }
    }
  }
  const face = mix(theme[0], RAMPS.steel[0], 0.5)
  const faceLit = mix(theme[1], RAMPS.steel[1], 0.5)
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!rack(tx, ty)) continue
      const x = tx * T
      const y = ty * T
      const up = !rack(tx, ty - 1)
      const down = !rack(tx, ty + 1)
      const left = !rack(tx - 1, ty)
      const right = !rack(tx + 1, ty)
      const h = tileHash(tx, ty, level)
      const topH = down ? 8 : T
      // The rack's lid: a panel with vent slots, seamed from its neighbours. Lids
      // along the floor catch the light; deep in a block of racks they sink into shade.
      let deep = true
      for (let dy = -1; dy <= 1 && deep; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (!rack(tx + dx, ty + dy)) deep = false
      const lid = deep ? mix(theme[0], theme[1], 0.5) : theme[1]
      const seam = deep ? theme[1] : theme[2]
      k.fillStyle = theme[0]
      k.fillRect(x, y, T, topH)
      k.fillStyle = lid
      k.fillRect(x + 1, y + 1, T - 2, topH - 2)
      k.fillStyle = seam
      k.fillRect(x + 1, y + 1, T - 2, 1)
      k.fillRect(x + 1, y + 1, 1, topH - 2)
      if (!down) {
        if (h < 0.4) {
          for (let i = 0; i < 3; i++) {
            k.fillStyle = theme[0]
            k.fillRect(x + 4, y + 4 + i * 3, 8, 1)
            k.fillStyle = seam
            k.fillRect(x + 4, y + 5 + i * 3, 8, 1)
          }
        } else if (h < 0.7) {
          k.fillStyle = theme[0]
          k.fillRect(x + 7, y + 7, 2, 2)
          k.fillStyle = seam
          k.fillRect(x + 7, y + 7, 1, 1)
        }
      } else {
        // The rack front, facing the floor below: a lit lip, then the bays.
        k.fillStyle = theme[4]
        k.fillRect(x, y + 7, T, 1)
        k.fillStyle = face
        k.fillRect(x, y + 8, T, 8)
        k.fillStyle = faceLit
        k.fillRect(x, y + 8, T, 1)
        const variant = Math.floor(h * 3)
        if (variant === 0) {
          for (const b of [9, 12]) {
            k.fillStyle = faceLit
            k.fillRect(x + 2, y + b, 9, 1)
            k.fillStyle = INK
            k.fillRect(x + 2, y + b + 1, 9, 1)
            k.fillStyle = RAMPS.steel[3]
            k.fillRect(x + 5, y + b + 1, 3, 1)
          }
        } else if (variant === 1) {
          for (let i = 0; i < 5; i++) {
            k.fillStyle = INK
            k.fillRect(x + 2 + i * 2, y + 9, 1, 5)
            k.fillStyle = faceLit
            k.fillRect(x + 3 + i * 2, y + 9, 1, 5)
          }
        } else {
          k.fillStyle = INK
          k.fillRect(x + 3, y + 9, 6, 5)
          k.fillStyle = faceLit
          k.fillRect(x + 4, y + 10, 4, 3)
          k.fillStyle = RAMPS.steel[2]
          k.fillRect(x + 5, y + 10, 2, 3)
          k.fillRect(x + 4, y + 11, 4, 1)
          k.fillStyle = INK
          k.fillRect(x + 5, y + 11, 2, 1)
        }
        k.fillStyle = INK
        k.fillRect(x + 11, y + 9, 3, 5)
        k.fillRect(x, y + 15, T, 1)
      }
      k.fillStyle = INK
      if (up) {
        k.fillRect(x, y, T, 1)
        k.fillStyle = theme[4]
        k.fillRect(x + (left ? 1 : 0), y + 1, T - (left ? 1 : 0), 1)
        k.fillStyle = INK
      }
      if (left) {
        k.fillRect(x, y, 1, T)
        k.fillStyle = theme[3]
        k.fillRect(x + 1, y + 1, 1, topH - 1)
        k.fillStyle = INK
      }
      if (right) {
        k.fillRect(x + T - 1, y, 1, T)
        k.fillStyle = theme[0]
        k.fillRect(x + T - 2, y + 1, 1, topH - 1)
      }
    }
  }
}

/** The LED pair on a rack front (paintFloor leaves a dark socket at x+11..13). */
function rackFaces(walls: Uint8Array, tx: number, ty: number): boolean {
  return rackAt(walls, tx, ty) && !rackAt(walls, tx, ty + 1)
}

const floorLayers: Array<{ key: string; canvas: HTMLCanvasElement }> = []

/**
 * The floor plan, painted once per floor layout to an offscreen canvas the size of the whole
 * floor and copied each frame under the camera. Like snes.ts cachedLayer, but it keeps only
 * the two latest layouts (every floor is a new one, so a long run would otherwise pile up
 * canvases). Headless it paints just the tiles on screen.
 */
function floorLayer(
  g: CanvasRenderingContext2D,
  key: string,
  paintAll: (k: CanvasRenderingContext2D) => void,
  paintVisible: () => void,
) {
  if (typeof document === 'undefined') {
    paintVisible()
    return
  }
  let layer = floorLayers.find((l) => l.key === key)
  if (!layer) {
    const canvas =
      floorLayers.length >= 2
        ? floorLayers.shift()!.canvas
        : document.createElement('canvas')
    canvas.width = MW * T
    canvas.height = MH * T
    const k = canvas.getContext('2d')
    if (!k) {
      paintVisible()
      return
    }
    paintAll(k)
    layer = { key, canvas }
    floorLayers.push(layer)
  }
  g.save()
  g.imageSmoothingEnabled = false
  g.drawImage(layer.canvas, 0, 0)
  g.restore()
}

/** The choose-your-bot stage: a banded server hall with racks along the back. */
function paintSelect(k: CanvasRenderingContext2D) {
  bandedGradient(
    k,
    0,
    0,
    W,
    H,
    [RAMPS.night[0], RAMPS.night[2], RAMPS.purple[0], RAMPS.night[1]],
    4,
  )
  const rand = backdropRng(61)
  for (let x = -6; x < W; x += 22) {
    const top = 34 + Math.floor(rand() * 10)
    bevel(k, x, top, 20, 150 - top, RAMPS.night, { depth: 1 })
    for (let y = top + 6; y < 146; y += 7) {
      k.fillStyle = RAMPS.night[0]
      k.fillRect(x + 3, y, 14, 2)
      k.fillStyle = rand() < 0.5 ? RAMPS.night[4] : RAMPS.purple[1]
      k.fillRect(x + 14, y, 2, 1)
    }
  }
  bandedGradient(
    k,
    0,
    150,
    W,
    H - 150,
    [RAMPS.purple[1], RAMPS.night[1], RAMPS.night[0]],
    3,
  )
  k.fillStyle = rgba(RAMPS.purple[3], 0.18)
  for (let x = 0; x < W; x += 20) k.fillRect(x, 150, 1, H - 150)
  for (const y of [158, 170, 186, 206, 232]) k.fillRect(0, y, W, 1)
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
  // Cosmetic only: sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(57)
  /** How far each seat's bot has rolled: its walk cycle. */
  private strides: number[] = []
  /** Where the last kindness pulse went off. */
  private pulseAt: Thing = { x: 0, y: 0 }
  /** Packets and imp sparks in flight. */
  private shots: Shot[] = []
  private token: Token | null = null
  /** Each tile's walking distance to the stairs (what a fleeing pickpocket follows). */
  private toExit: Int16Array = new Int16Array(MW * MH)
  private nextId = 1
  /** What the Mainframe is saying, the line count (lines rotate) and when each cue last spoke. */
  private voice: { text: string; cue: VoiceCue; ticks: number } | null = null
  private lines = 0
  private saidAt: Partial<Record<VoiceCue, number>> = {}
  /** A new glitch kind's introduction card. */
  private intro: { kind: GlitchKind; ticks: number } | null = null
  /** The key on this floor has been pointed out. */
  private keySpotted = false
  private world: GlitchWorld
  /** The attract pilot's last resting spot, and how long it has stood there. */
  private pilotAt: Thing = { x: 0, y: 0 }
  private pilotStill = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    this.heroes = Array.from({ length: seats }, (_, seat) => newHero(seat))
    this.world = this.makeWorld()
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
    this.glitches = []
    this.placeGenerators(
      spots(Math.round(levelCurve(floor, GAUNTLET_CURVES.generators))),
      floor,
    )
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
    // Mimic snacks hide among the real ones from the floor they debut on.
    const mimics = floor >= ROSTER.mimic.debut ? 1 + (floor >= 9 ? 1 : 0) : 0
    for (const s of spots(mimics))
      this.glitches.push(
        newGlitch('mimic', s.x, s.y, 1, this.nextId++, -1, this.rng() * 6),
      )
    // The Hug Token bounces loose on every floor from the second.
    this.token = null
    if (floor >= 2)
      for (const s of spots(1)) {
        const a = this.rng() * Math.PI * 2
        this.token = {
          x: s.x,
          y: s.y,
          vx: Math.cos(a) * 0.5,
          vy: Math.sin(a) * 0.5,
          holder: -1,
          wait: 0,
        }
      }
    this.sparks = []
    this.shots = []
    this.leaving = 0
    this.path = []
    this.keySpotted = false
    this.mapExit()
    this.reveal()
    this.lives = this.standing.length
    const debut = debutOn(floor)
    this.banner = {
      text: `FLOOR ${floor}`,
      sub: debut ? `NEW: ${ROSTER[debut].name}` : 'FIX THE GLITCHES',
      ticks: 90,
    }
    this.intro = debut ? { kind: debut, ticks: INTRO_TICKS } : null
    if (floor > 1) this.say(debut ? 'new-glitch' : 'floor')
  }

  /**
   * Generators for these spots: on a kind's debut floor the first releases it, and the rest are
   * drawn from every kind met so far (plain glitch cabinets three times as often). Each is tier 1
   * to 3, and every tier's worth of hits drops it one.
   */
  private placeGenerators(at: Thing[], floor: number) {
    const debut = debutOn(floor)
    const pool = kindsUpTo(floor)
    const weights = pool.map((k) => (k === 'glitch' ? 3 : 1))
    const total = weights.reduce((a, b) => a + b, 0)
    const per = Math.max(
      1,
      Math.round(levelCurve(floor, GAUNTLET_CURVES.generatorHp) / 3),
    )
    at.forEach((s, i) => {
      let kind: GlitchKind = pool[0]!
      if (i === 0 && debut) kind = debut
      else {
        let roll = this.rng() * total
        for (let k = 0; k < pool.length; k++) {
          roll -= weights[k]!
          if (roll < 0) {
            kind = pool[k]!
            break
          }
        }
      }
      const roll = this.rng()
      const tier: Tier =
        roll < levelCurve(floor, GAUNTLET_CURVES.tier3)
          ? 3
          : roll < levelCurve(floor, GAUNTLET_CURVES.tier2)
            ? 2
            : 1
      this.generators.push({
        ...s,
        id: this.nextId++,
        kind,
        tier,
        topTier: tier,
        per,
        hp: tier * per,
        maxHp: tier * per,
        timer: 60 + Math.floor(this.rng() * 90),
        flash: 0,
      })
    })
  }

  /** Walking distance to the stairs from every tile (doors closed count as racks). */
  private mapExit() {
    this.toExit = this.distances(
      Math.floor(this.exit.x / T),
      Math.floor(this.exit.y / T),
    )
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
      this.mapExit()
      const t0 = door.tiles[0]!
      const dx = (t0 % MW) * T + T / 2
      const dy = Math.floor(t0 / MW) * T + T / 2
      this.addScore(DOOR_POINTS, dx, dy - 12, hero)
      this.burst(dx, dy, 12, '#fbbf24')
      this.sparkle(dx, dy, 12)
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
    if (this.voice && --this.voice.ticks <= 0) this.voice = null
    if (this.intro && --this.intro.ticks <= 0) this.intro = null
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
      const fromX = hero.x
      const fromY = hero.y
      this.move(hero, controls)
      this.strides[hero.seat] =
        (this.strides[hero.seat] ?? 0) +
        Math.abs(hero.x - fromX) +
        Math.abs(hero.y - fromY)
      this.tryDoors(hero)
      if (controls.pressed.a || (controls.held.a && hero.fireCooldown === 0))
        this.fire(hero)
      if (controls.pressed.b) this.pulse(hero)
    }
    this.shareCharge()
    this.updateSparks()
    this.updateGenerators()
    this.updateGlitches()
    this.updateShots()
    this.updateToken()
    this.pickUp()
    this.reveal()
    this.watchBatteries()

    const atExit = this.standing.find(
      (h) => Math.hypot(this.exit.x - h.x, this.exit.y - h.y) < 10,
    )
    if (atExit) {
      const bonus = FLOOR_POINTS + 100 * this.level
      this.addScore(bonus, atExit.x, atExit.y - 16, atExit)
      this.leaving = EXIT_TICKS
      this.banner = {
        text: 'DOWN THE STAIRS!',
        sub: `FLOOR BONUS ${bonus}`,
        ticks: EXIT_TICKS,
      }
      this.sound.play('level')
      this.say('stairs')
    }
    for (const hero of this.standing) {
      if (hero.battery > 0) continue
      hero.battery = 0
      hero.flat = true
      this.burst(hero.x, hero.y, 10, '#94a3b8')
      this.sound.play('die')
      if (this.standing.length) {
        this.banner = {
          text: `${this.specOf(hero).name} IS FLAT`,
          sub: 'ROLL OVER AND SHARE A CHARGE',
          ticks: 120,
        }
        this.say('flat', this.specOf(hero).name)
      }
    }
    this.lives = this.standing.length
    if (!this.standing.length) {
      this.over = true
      this.banner = { text: 'BATTERY FLAT', sub: 'GAME OVER', ticks: 9999 }
      this.say('game-over')
      return
    }
    this.followCamera()
  }

  /** The Mainframe speaks: a more important line cuts in, and each cue keeps a little quiet after. */
  private say(cue: VoiceCue, bot = '') {
    const urgent = CUE_PRIORITY[cue] >= 4
    const last = this.saidAt[cue]
    if (!urgent && last !== undefined && this.tick - last < 60 * 8) return
    if (
      this.voice &&
      this.voice.ticks > 40 &&
      CUE_PRIORITY[this.voice.cue] > CUE_PRIORITY[cue]
    )
      return
    const text = voiceLine(cue, this.lines++, bot)
    this.voice = { text, cue, ticks: VOICE_TICKS }
    this.saidAt[cue] = this.tick
    if (!this.demo) this.sound.playNotes?.(mainframeBleeps(text))
  }

  /** The Mainframe warns when a bot runs low, and when a key comes into view. */
  private watchBatteries() {
    for (const hero of this.standing) {
      if (!hero.warned && hero.battery < LOW_BATTERY) {
        hero.warned = true
        this.say('low', this.specOf(hero).name)
      } else if (hero.warned && hero.battery > LOW_REARM) hero.warned = false
    }
    if (
      !this.keySpotted &&
      this.items.some((i) => i.kind === 'key' && this.visible(i))
    ) {
      this.keySpotted = true
      this.say('key-near')
    }
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
      flat.battery = Math.max(flat.battery, SHARE_CHARGE)
      flat.flat = false
      this.say('revive', this.specOf(flat).name)
      this.floaters.push({
        x: flat.x,
        y: flat.y - 12,
        text: 'SHARED!',
        life: 50,
      })
      this.burst(flat.x, flat.y, 12, '#bbf7d0')
      this.sparkle(flat.x, flat.y, 12, [
        RAMPS.leaf[3],
        RAMPS.leaf[4],
        '#ffffff',
      ])
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
      hit: [],
    })
    this.sound.play('shoot')
  }

  /**
   * A kindness pulse fixes every glitch on screen, dries the coffee spills, and fizzles the packets
   * and imp sparks in the air; Sage's also jolts the generators on screen.
   */
  private pulse(hero: Hero) {
    if (hero.pulses <= 0) return
    hero.pulses--
    this.pulseFlash = 20
    this.pulseAt = { x: hero.x, y: hero.y }
    this.sparkle(hero.x, hero.y, 16, [RAMPS.pink[3], RAMPS.pink[4], '#ffffff'])
    for (const g of this.glitches.filter((g) => this.visible(g))) {
      if (ROSTER[g.kind].unfixable) {
        if (g.state === 'dry') continue
        g.state = 'dry'
        g.t = DRY_TICKS
        this.addScore(ROSTER[g.kind].points, g.x, g.y - 8, hero)
        this.say('spill-dry')
      } else this.fixGlitch(g, hero)
    }
    this.shots = this.shots.filter((s) => !this.visible(s))
    const magic = this.specOf(hero).magic
    if (magic > 0)
      for (const gen of this.generators.filter((g) => this.visible(g)))
        this.damageGenerator(gen, magic, hero)
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

  /** No rack between two points (sampled every few pixels). */
  private lineClear(ax: number, ay: number, bx: number, by: number): boolean {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 4)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      if (this.solid(ax + (bx - ax) * t, ay + (by - ay) * t)) return false
    }
    return true
  }

  private updateSparks() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (this.solid(s.x, s.y)) s.life = 0
      if (s.life <= 0) continue
      const power = this.specOf(s.owner).power
      const glitch = this.glitches.find(
        (g) =>
          !ROSTER[g.kind].unfixable &&
          !s.hit.includes(g.id) &&
          Math.hypot(g.x - s.x, g.y - s.y) < hitRadius(g.kind),
      )
      if (glitch) {
        s.hit.push(glitch.id)
        this.hurtGlitch(glitch, power, s.owner)
        if (s.pierce-- <= 0) s.life = 0
        continue
      }
      // Kindness is a mechanic: a spark that reaches a partner shares charge with them.
      const mate = this.heroes.find(
        (h) => h !== s.owner && Math.hypot(h.x - s.x, h.y - s.y) < 7,
      )
      if (mate) {
        s.life = 0
        this.sparkShare(s.owner, mate)
        continue
      }
      const snack = this.items.find(
        (i) =>
          i.kind === 'snack' &&
          !i.safe &&
          Math.abs(i.x - s.x) < 6 &&
          Math.abs(i.y - s.y) < 6,
      )
      if (snack) {
        s.life = 0
        this.items = this.items.filter((i) => i !== snack)
        this.burst(snack.x, snack.y, 10, RAMPS.pink[3])
        this.burst(snack.x, snack.y, 6, RAMPS.gold[3])
        this.floaters.push({
          x: snack.x,
          y: snack.y - 10,
          text: 'CRUMBS!',
          life: 40,
        })
        this.sound.play('pop')
        this.say('snack-sparked')
        continue
      }
      const gen = this.generators.find(
        (g) => Math.abs(g.x - s.x) < 8 && Math.abs(g.y - s.y) < 8,
      )
      if (gen) {
        s.life = 0
        this.damageGenerator(gen, power, s.owner)
      }
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  /** A spark lands on a partner: a little of the thrower's charge, never harm. */
  private sparkShare(from: Hero, to: Hero) {
    if (from.flat || from.battery <= SPARK_SHARE + 10) return
    from.battery -= SPARK_SHARE
    to.battery = Math.min(MAX_BATTERY, to.battery + SPARK_SHARE)
    this.floaters.push({
      x: to.x,
      y: to.y - 14,
      text: `+${SPARK_SHARE}`,
      life: 30,
    })
    this.sparkle(to.x, to.y, 5, [RAMPS.leaf[3], RAMPS.leaf[4], '#ffffff'])
    if (to.flat && to.battery >= SHARE_CHARGE) {
      to.flat = false
      this.burst(to.x, to.y, 12, '#bbf7d0')
      this.sound.play('extra')
      this.say('revive', this.specOf(to).name)
    } else {
      this.sound.play('pickup')
      this.say('share')
    }
  }

  private hurtGlitch(g: Glitch, damage: number, by: Hero) {
    g.hp -= damage
    g.flash = 6
    if (g.hp <= 0) this.fixGlitch(g, by)
    else this.sound.play('blip')
  }

  private damageGenerator(gen: Generator, damage: number, by?: Hero) {
    gen.hp -= damage
    gen.flash = 6
    gen.tier = Math.max(1, Math.min(3, Math.ceil(gen.hp / gen.per))) as Tier
    this.sound.play('blip')
    if (gen.hp > 0) return
    this.generators = this.generators.filter((g) => g !== gen)
    this.addScore(this.generatorPoints(gen), gen.x, gen.y - 12, by)
    this.burst(gen.x, gen.y, 14, '#a5f3fc')
    this.sparkle(gen.x, gen.y, 14, [RAMPS.teal[3], RAMPS.teal[4], '#ffffff'])
    this.sound.play('boom')
    this.say('generator')
  }

  /** A generator's worth: the floor's base, half again for each tier it started above the first. */
  private generatorPoints(gen: Generator): number {
    return Math.round(
      GENERATOR_POINTS * this.level * (1 + 0.5 * (gen.topTier - 1)),
    )
  }

  /** Carried into a generator, the Hug Token overloads it at once, for double its worth. */
  private overload(gen: Generator, hero: Hero) {
    this.generators = this.generators.filter((g) => g !== gen)
    this.token = null
    this.addScore(this.generatorPoints(gen) * 2, gen.x, gen.y - 12, hero)
    this.burst(gen.x, gen.y, 20, RAMPS.pink[3])
    this.sparkle(gen.x, gen.y, 24, [RAMPS.pink[3], RAMPS.pink[4], '#ffffff'])
    this.pulseFlash = 12
    this.pulseAt = { x: gen.x, y: gen.y }
    this.sound.play('boom')
    this.say('overload')
  }

  /** A fixed glitch reboots: it drops what it stole, and a mimic turns into a real snack. */
  private fixGlitch(g: Glitch, by?: Hero) {
    this.glitches = this.glitches.filter((other) => other !== g)
    const doubled = by && this.tokenHolder() === by ? 2 : 1
    this.addScore(ROSTER[g.kind].points * g.tier * doubled, g.x, g.y - 8, by)
    if (g.loot) {
      if (g.loot.kind === 'charge') {
        const owner = this.heroes[g.from] ?? by
        if (owner) {
          owner.battery = Math.min(MAX_BATTERY, owner.battery + g.loot.amount)
          this.floaters.push({
            x: owner.x,
            y: owner.y - 14,
            text: `+${g.loot.amount}`,
            life: 40,
          })
        }
      } else this.items.push({ x: g.x, y: g.y, kind: g.loot.kind })
      this.say('loot-back')
    }
    if (g.kind === 'mimic')
      this.items.push({ x: g.x, y: g.y, kind: 'snack', safe: 45 })
    this.burst(g.x, g.y, g.kind === 'bug' ? 2 : 5, '#f0abfc')
    this.sparkle(g.x, g.y, g.kind === 'bug' ? 2 : 4, [
      RAMPS.pink[3],
      RAMPS.teal[3],
      '#ffffff',
    ])
    this.sound.play('pop')
  }

  private updateGenerators() {
    const every = levelCurve(this.level, GAUNTLET_CURVES.spawnEvery)
    const cap = Math.round(levelCurve(this.level, GAUNTLET_CURVES.glitchCap))
    for (const gen of this.generators) {
      if (gen.flash > 0) gen.flash--
      const near = this.standing.some(
        (h) => Math.hypot(gen.x - h.x, gen.y - h.y) <= GLITCH_RANGE,
      )
      if (!near) continue
      if (--gen.timer > 0) continue
      const entry = ROSTER[gen.kind]
      gen.timer = Math.round(every * entry.every)
      if (this.glitches.length >= cap) continue
      const mine = this.glitches.filter((g) => g.gen === gen.id).length
      if (mine >= entry.most) continue
      // A swarm comes out all at once: six bugs, eight from tier 2, ten from tier 3.
      const count =
        gen.kind === 'bug' ? Math.min(entry.most - mine, 4 + 2 * gen.tier) : 1
      // Glitches leak out of a free side of the generator.
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ] as const) {
        const x = gen.x + dx * T
        const y = gen.y + dy * T
        if (this.boxHits(x, y, HALF)) continue
        for (let i = 0; i < count; i++) {
          const spread = count > 1 ? 5 : 0
          this.glitches.push(
            newGlitch(
              gen.kind,
              x + (this.rng() - 0.5) * spread,
              y + (this.rng() - 0.5) * spread,
              gen.tier,
              this.nextId++,
              gen.id,
              this.rng() * 6,
            ),
          )
        }
        if (gen.kind === 'bug') this.say('swarm')
        break
      }
    }
  }

  private updateGlitches() {
    for (const g of [...this.glitches]) steerGlitch(this.world, g)
  }

  /** The bot holding the Hug Token (while it rolls). */
  private tokenHolder(): Hero | undefined {
    const seat = this.token?.holder ?? -1
    const hero = seat >= 0 ? this.heroes[seat] : undefined
    return hero && !hero.flat ? hero : undefined
  }

  /** Every glitch on the floor goes for the Token's holder; otherwise the nearest bot in range. */
  private preyFor(g: Glitch): Prey | null {
    const holder = this.tokenHolder()
    if (holder) return holder
    const prey = this.nearestStanding(g)
    if (!prey) return null
    return Math.hypot(prey.x - g.x, prey.y - g.y) <= GLITCH_RANGE ? prey : null
  }

  /** What a glitch can sense and do here (kindnessGauntlet/roster.ts steers them through it). */
  private makeWorld(): GlitchWorld {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const game = this
    return {
      get tick() {
        return game.tick
      },
      get speed() {
        return levelCurve(game.level, GAUNTLET_CURVES.glitchSpeed)
      },
      get bite() {
        return levelCurve(game.level, GAUNTLET_CURVES.clingCost)
      },
      rng: () => game.rng(),
      prey: (g) => game.preyFor(g),
      nearest: (g) => game.nearestStanding(g) ?? null,
      move: (g, vx, vy) => {
        const half = g.kind === 'bug' ? 2 : g.kind === 'brute' ? 5 : 4
        const to = game.slide(g.x, g.y, vx, vy, half)
        const full = to.x === g.x + vx && to.y === g.y + vy
        g.x = to.x
        g.y = to.y
        return full
      },
      open: (x, y) => !game.solid(x, y),
      clear: (ax, ay, bx, by) => game.lineClear(ax, ay, bx, by),
      toStairs: (g) => game.stepToStairs(g),
      atStairs: (g) => Math.hypot(game.exit.x - g.x, game.exit.y - g.y) < 10,
      drain: (p, amount) => game.drain(game.heroes[p.seat]!, amount),
      shove: (p, dx, dy) => game.shove(game.heroes[p.seat]!, dx, dy),
      steal: (g, p) => game.steal(g, game.heroes[p.seat]!),
      lob: (g, tx, ty) =>
        game.shots.push({
          kind: 'packet',
          x0: g.x,
          y0: g.y,
          x: tx,
          y: ty,
          t: 0,
          tier: g.tier,
        }),
      bolt: (g, dx, dy) =>
        game.shots.push({
          kind: 'bolt',
          x: g.x + dx * 6,
          y: g.y + dy * 6,
          vx: dx * BOLT_SPEED,
          vy: dy * BOLT_SPEED,
          life: 150,
        }),
      escape: (g) => game.escape(g),
      digest: (g) => {
        g.loot = null
        g.cling = 180
        game.say('digested')
      },
      tell: (g) => {
        if (g.kind === 'mimic') game.say('mimic')
        else if (g.kind !== 'brute') game.sound.play('blip')
      },
      play: (name) => game.sound.play(name),
    }
  }

  /** One step downhill toward the stairs, or null when there or cut off from them. */
  private stepToStairs(g: Glitch): { x: number; y: number } | null {
    const tx = Math.floor(g.x / T)
    const ty = Math.floor(g.y / T)
    const d = this.toExit[this.idx(tx, ty)] ?? -1
    if (d <= 0) return null
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      if (this.toExit[this.idx(tx + dx, ty + dy)] !== d - 1) continue
      const cx = (tx + dx) * T + T / 2 - g.x
      const cy = (ty + dy) * T + T / 2 - g.y
      const len = Math.hypot(cx, cy) || 1
      return { x: cx / len, y: cy / len }
    }
    return null
  }

  /** Charge a glitch takes from a bot, through the bot's armour. */
  private drain(hero: Hero, amount: number) {
    if (hero.flat) return
    hero.battery -= Math.max(1, Math.round(amount * this.specOf(hero).armor))
  }

  /** A brute's shove: a tile back along (dx, dy), stopped by the racks. */
  private shove(hero: Hero, dx: number, dy: number) {
    for (let i = 0; i < 8; i++) {
      const to = this.slide(hero.x, hero.y, dx * 2, dy * 2, HALF)
      hero.x = to.x
      hero.y = to.y
    }
    this.burst(hero.x, hero.y, 6, RAMPS.steel[3])
  }

  /** A pickpocket takes a key, else a pulse, else a little charge; a leech takes charge. */
  private steal(g: Glitch, hero: Hero) {
    g.from = hero.seat
    const name = this.specOf(hero).name
    if (g.kind === 'pickpocket' && this.keys > 0) {
      this.keys--
      g.loot = { kind: 'key' }
      this.say('key-stolen')
    } else if (g.kind === 'pickpocket' && hero.pulses > 0) {
      hero.pulses--
      g.loot = { kind: 'pulse' }
      this.say('pulse-stolen')
    } else {
      const amount = Math.max(
        0,
        Math.min(g.kind === 'leech' ? 35 : 20, hero.battery - 1),
      )
      hero.battery -= amount
      g.loot = { kind: 'charge', amount }
      this.say('charge-stolen', name)
    }
    this.floaters.push({ x: hero.x, y: hero.y - 14, text: 'STOLEN!', life: 40 })
    this.sound.play('warn')
  }

  /**
   * A pickpocket gets away down the stairs. A stolen key that was the only way on turns up again
   * (the Mainframe finds a spare) somewhere the team can reach.
   */
  private escape(g: Glitch) {
    this.glitches = this.glitches.filter((o) => o !== g)
    this.sparkle(g.x, g.y, 8, [RAMPS.purple[3], RAMPS.purple[4]])
    this.say('escaped')
    if (g.loot?.kind !== 'key' || !this.doors.some((d) => !d.open)) return
    const lead = this.standing[0] ?? this.lead
    const dist = this.distances(Math.floor(lead.x / T), Math.floor(lead.y / T))
    const far: number[] = []
    dist.forEach((d, i) => {
      if (d > 6) far.push(i)
    })
    if (!far.length) return
    const at = far[Math.floor(this.rng() * far.length)]!
    this.items.push({
      x: (at % MW) * T + T / 2,
      y: Math.floor(at / MW) * T + T / 2,
      kind: 'key',
    })
    this.keySpotted = false
  }

  /** Packets land with a splash; imp sparks fly straight until a rack or a bot stops them. */
  private updateShots() {
    for (const shot of this.shots) {
      if (shot.kind === 'packet') {
        if (++shot.t < PACKET_TICKS) continue
        for (const h of this.standing)
          if (Math.hypot(h.x - shot.x, h.y - shot.y) < PACKET_SPLASH)
            this.drain(h, 10 + 3 * shot.tier)
        this.burst(shot.x, shot.y, 8, RAMPS.leaf[3])
        this.sound.play('pop')
        continue
      }
      shot.x += shot.vx
      shot.y += shot.vy
      shot.life--
      if (this.solid(shot.x, shot.y)) {
        shot.life = 0
        continue
      }
      const hit = this.standing.find(
        (h) => Math.hypot(h.x - shot.x, h.y - shot.y) < 7,
      )
      if (hit) {
        shot.life = 0
        this.drain(hit, 12)
        this.burst(shot.x, shot.y, 6, RAMPS.ember[3])
        this.sound.play('warn')
      }
    }
    this.shots = this.shots.filter((s) =>
      s.kind === 'packet' ? s.t < PACKET_TICKS : s.life > 0,
    )
  }

  /**
   * The Hug Token bounces loose until a bot rolls into it. Whoever holds it draws every glitch on
   * the floor and earns double for each one fixed; a touch passes it to a partner, and carried into
   * a generator it overloads it. A bot going flat drops it.
   */
  private updateToken() {
    const t = this.token
    if (!t) return
    if (t.wait > 0) t.wait--
    if (t.holder >= 0) {
      const h = this.heroes[t.holder]!
      if (h.flat) {
        const a = this.rng() * Math.PI * 2
        Object.assign(t, {
          holder: -1,
          wait: 60,
          x: h.x,
          y: h.y,
          vx: Math.cos(a) * 0.5,
          vy: Math.sin(a) * 0.5,
        })
        this.say('token-dropped')
        return
      }
      t.x = h.x
      t.y = h.y
      const gen = this.generators.find(
        (g) => Math.abs(g.x - h.x) < 15 && Math.abs(g.y - h.y) < 15,
      )
      if (gen) {
        this.overload(gen, h)
        return
      }
      if (t.wait > 0) return
      const mate = this.standing.find(
        (o) => o !== h && Math.hypot(o.x - h.x, o.y - h.y) < 13,
      )
      if (!mate) return
      t.holder = mate.seat
      t.wait = TOKEN_PASS_TICKS
      this.sparkle(mate.x, mate.y, 10, [
        RAMPS.pink[3],
        RAMPS.pink[4],
        '#ffffff',
      ])
      this.sound.play('pickup')
      this.say('token-passed', this.specOf(mate).name)
      return
    }
    if (this.boxHits(t.x + t.vx, t.y, 4)) t.vx = -t.vx
    else t.x += t.vx
    if (this.boxHits(t.x, t.y + t.vy, 4)) t.vy = -t.vy
    else t.y += t.vy
    if (t.wait > 0) return
    const taker = this.standing.find(
      (h) => Math.hypot(h.x - t.x, h.y - t.y) < 11,
    )
    if (!taker) return
    t.holder = taker.seat
    t.wait = TOKEN_PASS_TICKS
    this.sparkle(t.x, t.y, 12, [RAMPS.pink[3], RAMPS.pink[4], '#ffffff'])
    this.sound.play('extra')
    this.say('token-taken', this.specOf(taker).name)
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
    for (const item of this.items) if (item.safe) item.safe--
    for (const item of [...this.items]) {
      const hero = this.standing.find(
        (h) => Math.hypot(item.x - h.x, item.y - h.y) <= 10,
      )
      if (!hero) continue
      this.items = this.items.filter((other) => other !== item)
      if (item.kind === 'snack') {
        hero.battery = Math.min(MAX_BATTERY, hero.battery + SNACK_CHARGE)
        this.sparkle(item.x, item.y, 8, [RAMPS.pink[3], RAMPS.gold[4]])
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'SNACK!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'key') {
        this.keys++
        this.sparkle(item.x, item.y, 10)
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'KEY!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'pulse') {
        hero.pulses++
        this.sparkle(item.x, item.y, 10, [RAMPS.pink[3], RAMPS.pink[4]])
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'PULSE!',
          life: 40,
        })
        this.sound.play('pickup')
      } else {
        this.rescued++
        this.addScore(RESCUE_POINTS * this.level, item.x, item.y - 10, hero)
        this.burst(item.x, item.y, 12, '#fde68a')
        this.sparkle(item.x, item.y, 16)
        this.banner = { text: 'BOT RESCUED!', ticks: 60 }
        this.sound.play('extra')
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  /** Points for the team, and for the seat that earned them. */
  private addScore(points: number, x: number, y: number, by?: Hero) {
    if (this.demo) return
    this.score += points
    if (by) by.points += points
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

  /** A cosmetic sparkle burst (its own dice, never the game's). */
  private sparkle(
    x: number,
    y: number,
    count: number,
    colours: readonly string[] = [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
  ) {
    this.fx.burst(x, y, this.fxRng, { count, colours })
  }

  private updateEffects() {
    this.fx.update()
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

  /** Hold the arrows for one of the eight facings toward (dx, dy). */
  private steerTo(held: InputFrame['held'], dx: number, dy: number) {
    const ang = Math.atan2(dy, dx)
    const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
    if (FACE_X[f]! < 0) held.left = true
    if (FACE_X[f]! > 0) held.right = true
    if (FACE_Y[f]! < 0) held.up = true
    if (FACE_Y[f]! > 0) held.down = true
  }

  /** Something about to land on the pilot, and which way is away from it. */
  private danger(me: Hero): { x: number; y: number } | null {
    for (const s of this.shots) {
      if (s.kind === 'packet') {
        if (
          s.t > PACKET_TICKS - 34 &&
          Math.hypot(s.x - me.x, s.y - me.y) < PACKET_SPLASH + 6
        )
          return { x: me.x - s.x || 1, y: me.y - s.y }
      } else if (
        Math.hypot(s.x - me.x, s.y - me.y) < 40 &&
        (me.x - s.x) * s.vx + (me.y - s.y) * s.vy > 0 &&
        (s.vx ? Math.abs(s.y - me.y) < 8 : Math.abs(s.x - me.x) < 8)
      )
        // Step off its line, not along it.
        return this.offLine(me, s.x, s.y, s.vx !== 0)
    }
    for (const g of this.glitches) {
      const dx = me.x - g.x
      const dy = me.y - g.y
      if (g.kind === 'brute' && g.state === 'windup' && Math.hypot(dx, dy) < 28)
        return { x: dx, y: dy }
      if (
        g.kind === 'imp' &&
        g.state === 'inhale' &&
        Math.hypot(dx, dy) < 16 * 8 &&
        (g.vx ? Math.abs(dy) < 8 : Math.abs(dx) < 8)
      )
        return this.offLine(me, g.x, g.y, g.vx !== 0)
      if (g.kind === 'spill' && g.state !== 'dry' && Math.hypot(dx, dy) < 18)
        return { x: dx, y: dy }
    }
    return null
  }

  /**
   * Off a straight line of fire through (x, y): to whichever side the pilot's route goes next, so
   * it crosses the line instead of dithering on its edge.
   */
  private offLine(
    me: Hero,
    x: number,
    y: number,
    across: boolean,
  ): { x: number; y: number } {
    const next = this.path[0]
    if (across) {
      const side = next ? next.y * T + T / 2 - y : me.y - y
      return { x: 0, y: side >= 0 ? 1 : -1 }
    }
    const side = next ? next.x * T + T / 2 - x : me.x - x
    return { x: side >= 0 ? 1 : -1, y: 0 }
  }

  /** What the pilot will spark: glitches it can fix (a mimic once it has given itself away). */
  private pilotTargets(holding: boolean): Thing[] {
    const glitches = this.glitches.filter(
      (g) =>
        !ROSTER[g.kind].unfixable &&
        (g.kind !== 'mimic' || g.seen || g.state === 'awake'),
    )
    return holding ? glitches : [...glitches, ...this.generators]
  }

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
    // Something about to land: step clear first.
    const away = this.danger(me)
    if (away) {
      this.steerTo(held, away.x, away.y)
      return frame
    }
    // Swamped: use a pulse (Sage, with pulses to spare, uses them sooner).
    const close = this.glitches.filter(
      (g) =>
        !ROSTER[g.kind].unfixable &&
        g.kind !== 'mimic' &&
        Math.hypot(g.x - me.x, g.y - me.y) < 40,
    )
    if (close.length >= (me.pulses > 1 ? 3 : 5) && me.pulses > 0) {
      frame.pressed.b = true
      return frame
    }
    // Something to fix nearby: face it and spark it (a thief carrying loot from further off).
    // A pilot rooted to one spot for four seconds gives up aiming and walks on for two.
    if (Math.hypot(me.x - this.pilotAt.x, me.y - this.pilotAt.y) > 6) {
      this.pilotAt = { x: me.x, y: me.y }
      this.pilotStill = 0
    } else if (++this.pilotStill > 240) {
      this.pilotStill = -120
      this.path = []
    }
    const holding = this.tokenHolder() === me
    const aim = (this.pilotStill < 0 ? [] : this.pilotTargets(holding))
      .filter((t) => {
        const loot = 'loot' in t && (t as Glitch).loot
        const reach = loot ? 150 : 90
        return Math.hypot(t.x - me.x, t.y - me.y) < reach && this.clearShot(t)
      })
      .sort(
        (a, b) =>
          Math.hypot(a.x - me.x, a.y - me.y) -
          Math.hypot(b.x - me.x, b.y - me.y),
      )[0]
    if (aim) {
      this.steerTo(held, aim.x - me.x, aim.y - me.y)
      held.a = true
      return frame
    }
    // Otherwise walk the path to the next goal: snacks when low, the loose token, cages,
    // generators (to overload them, holding the token), then the stairs.
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

  /**
   * A straight, unblocked spark line to the target along one of the eight facings, that breaks
   * no snack and sparks no partner on the way.
   */
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
      const glitch = 'kind' in t && 'hp' in t && 'wobble' in t
      if (
        glitch
          ? Math.hypot(t.x - x, t.y - y) < hitRadius((t as Glitch).kind) - 1
          : Math.abs(t.x - x) < 6 && Math.abs(t.y - y) < 6
      )
        return true
      if (
        this.items.some(
          (s) =>
            s.kind === 'snack' &&
            Math.abs(s.x - x) < 6 &&
            Math.abs(s.y - y) < 6,
        )
      )
        return false
    }
    return false
  }

  private planPath(): Array<{ x: number; y: number }> {
    const sx = Math.floor(this.lead.x / T)
    const sy = Math.floor(this.lead.y / T)
    const dist = this.distances(sx, sy, this.keys > 0)
    const holding = this.tokenHolder() === this.lead
    const loose =
      this.token && this.token.holder < 0 && this.lead.battery >= 120
        ? [this.token]
        : []
    const reach = (t: Thing) =>
      dist[this.idx(Math.floor(t.x / T), Math.floor(t.y / T))]!
    const open = (list: Thing[]) => list.filter((t) => reach(t) >= 0)
    const usual = open([
      ...loose,
      ...this.items.filter((i) => i.kind !== 'snack'),
      ...this.generators,
    ])
    const snacks = open(this.items.filter((i) => i.kind === 'snack'))
    const gens = open(this.generators)
    const pool =
      this.lead.battery < 120 && snacks.length
        ? snacks
        : holding && gens.length
          ? gens
          : usual.length
            ? usual
            : [this.exit]
    let best: Thing | null = null
    let bestD = Infinity
    for (const g of pool) {
      const d = reach(g)
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
    g.fillStyle = FOG
    g.fillRect(0, 0, W, H)
    g.save()
    g.beginPath()
    g.rect(0, VIEW_Y, W, VIEW_H)
    g.clip()
    g.translate(-Math.round(this.camX), VIEW_Y - Math.round(this.camY))
    const x0 = Math.max(0, Math.floor(this.camX / T))
    const y0 = Math.max(0, Math.floor(this.camY / T))
    const x1 = Math.min(MW - 1, x0 + Math.ceil(W / T) + 1)
    const y1 = Math.min(MH - 1, y0 + Math.ceil(VIEW_H / T) + 1)
    floorLayer(
      g,
      this.floorKey(),
      (k) => paintFloor(k, this.walls, this.level, 0, 0, MW - 1, MH - 1),
      () => paintFloor(g, this.walls, this.level, x0, y0, x1, y1),
    )
    this.renderFog(g, x0, y0, x1, y1)
    this.renderLeds(g, x0, y0, x1, y1)
    this.renderDoors(g)
    this.renderExit(g)
    for (const gl of this.glitches)
      if (gl.kind === 'spill' && this.lit(gl)) this.renderSpill(g, gl)
    for (const item of this.items) if (this.lit(item)) this.renderItem(g, item)
    for (const gen of this.generators)
      if (this.lit(gen)) this.renderGenerator(g, gen)
    for (const gl of this.glitches) if (this.lit(gl)) this.renderGlitch(g, gl)
    this.renderShots(g)
    this.renderSparks(g)
    this.renderHeroes(g)
    this.renderToken(g)
    this.renderZaps(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 16))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    if (this.pulseFlash > 0) this.renderPulse(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    this.renderIntro(g)
    this.renderTally(g)
    this.renderVoice(g)
  }

  /** The floor plan's cache key: its rack layout (doors count as floor) and its theme. */
  private floorKey(): string {
    let h = 2166136261
    for (let i = 0; i < this.walls.length; i++)
      h = Math.imul(h ^ (this.walls[i] === RACK ? 1 : 0) ^ (i & 7), 16777619)
    return `kindness-gauntlet-floor-${this.level}-${h >>> 0}`
  }

  /**
   * Unexplored tiles stay dark, with the darkness feathering a few banded steps into the
   * explored floor along its edge.
   */
  private renderFog(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    const hidden = (tx: number, ty: number) =>
      tx >= 0 && ty >= 0 && tx < MW && ty < MH && !this.seen[this.idx(tx, ty)]
    g.fillStyle = FOG
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (hidden(tx, ty)) g.fillRect(tx * T, ty * T, T, T)
      }
    }
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (hidden(tx, ty)) continue
        const x = tx * T
        const y = ty * T
        const up = hidden(tx, ty - 1)
        const down = hidden(tx, ty + 1)
        const left = hidden(tx - 1, ty)
        const right = hidden(tx + 1, ty)
        if (!up && !down && !left && !right) continue
        FOG_BANDS.forEach((band, i) => {
          g.fillStyle = band
          const d = i * 2
          if (up) g.fillRect(x, y + d, T, 2)
          if (down) g.fillRect(x, y + T - 2 - d, T, 2)
          if (left) g.fillRect(x + d, y, 2, T)
          if (right) g.fillRect(x + T - 2 - d, y, 2, T)
        })
      }
    }
  }

  /** Blinking status LEDs on every rack front in view, each with its own rhythm. */
  private renderLeds(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    g.save()
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.seen[this.idx(tx, ty)] || !rackFaces(this.walls, tx, ty))
          continue
        const h = tileHash(tx, ty, this.level + 3)
        const x = tx * T + 12
        const y = ty * T
        for (let i = 0; i < 2; i++) {
          const beat = Math.floor(this.tick / (10 + i * 7) + h * 40 + i * 3)
          if (beat % (3 + i) === 0) continue
          const colour = LED_COLOURS[Math.floor(h * 97 + i * 2) % 5]!
          const ly = y + 10 + i * 2
          g.globalCompositeOperation = 'lighter'
          g.fillStyle = rgba(colour, 0.28)
          g.fillRect(x - 1, ly - 1, 3, 3)
          g.globalCompositeOperation = 'source-over'
          g.fillStyle = colour
          g.fillRect(x, ly, 1, 1)
          g.fillStyle = '#ffffff'
          g.fillRect(x, ly, 1, 1)
          g.fillStyle = colour
          g.fillRect(x + 1, ly, 1, 1)
        }
      }
    }
    g.restore()
  }

  private renderDoors(g: CanvasRenderingContext2D) {
    const ready = this.keys > 0
    for (const door of this.doors) {
      if (door.open) continue
      for (const t of door.tiles) {
        if (!this.seen[t]) continue
        const x = (t % MW) * T
        const y = Math.floor(t / MW) * T
        drawSprite(g, DOOR_SPRITE, x, y, { anchor: 'topleft' })
        if (ready)
          glow(
            g,
            x + T / 2,
            y + 11,
            12,
            RAMPS.gold[3],
            0.25 + 0.15 * Math.sin(this.tick / 8),
          )
      }
    }
  }

  /** The stairs down: lit steps sinking into the dark, with motes of light rising. */
  private renderExit(g: CanvasRenderingContext2D) {
    const e = this.exit
    if (!this.seen[this.idx(Math.floor(e.x / T), Math.floor(e.y / T))]) return
    const x = Math.round(e.x)
    const y = Math.round(e.y)
    glow(g, x, y, 18 + Math.sin(this.tick / 10) * 3, RAMPS.teal[3], 0.4)
    bevel(g, x - 8, y - 8, 16, 16, RAMPS.steel, { depth: 1 })
    const ramp = RAMPS.teal
    for (let i = 0; i < 4; i++) {
      const left = x - 6 + i
      const w = 12 - i * 2
      const top = y - 6 + i * 3
      g.fillStyle = ramp[3 - i]!
      g.fillRect(left, top, w, 3)
      g.fillStyle = ramp[4 - i]!
      g.fillRect(left, top, w, 1)
      g.fillStyle = INK
      g.fillRect(left, top + 2, w, 1)
    }
    g.fillStyle = INK
    g.fillRect(x - 2, y + 6, 4, 1)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 3; i++) {
      const t = ((this.tick + i * 23) % 60) / 60
      g.globalAlpha = 1 - t
      g.fillStyle = RAMPS.teal[4]
      g.fillRect(x - 4 + i * 4, Math.round(y + 2 - t * 18), 1, 2)
    }
    g.restore()
    if (Math.floor(this.tick / 15) % 2 === 0) {
      drawText(g, 'EXIT', x, y - 19, {
        align: 'center',
        color: RAMPS.teal[4],
        outline: INK,
      })
    }
  }

  private renderItem(g: CanvasRenderingContext2D, item: Item) {
    const { x, y } = item
    const bob = Math.round(Math.sin(this.tick / 10 + x * 0.1) * 1.2)
    if (item.kind === 'snack') {
      dropShadow(g, x, y + 5, 5, 1.5, 0.4)
      drawSprite(g, SNACK_SPRITE, x, y - 1 + bob)
    } else if (item.kind === 'key') {
      glow(g, x, y, 10 + Math.sin(this.tick / 7) * 2, RAMPS.gold[3], 0.45)
      dropShadow(g, x, y + 5, 5, 1.5, 0.4)
      drawSprite(g, KEY_SPRITE, x, y - 1 + bob)
      const glint = this.tick % 50
      if (glint < 8) {
        const gx = Math.round(x - 4 + glint)
        const gy = y - 3 + bob
        g.fillStyle = '#ffffff'
        g.fillRect(gx - 1, gy, 3, 1)
        g.fillRect(gx, gy - 1, 1, 3)
      }
    } else if (item.kind === 'pulse') {
      glow(g, x, y, 11 + Math.sin(this.tick / 6) * 2, RAMPS.pink[3], 0.5)
      dropShadow(g, x, y + 6, 4, 1.4, 0.4)
      drawSprite(g, HEART_SPRITE, x, y - 1 + bob)
    } else {
      // A trapped bot behind bars, waving for help.
      dropShadow(g, x, y + 8, 8, 2, 0.45)
      const wave = Math.floor(this.tick / 12 + x) % 2
      drawSprite(g, CAGED_SPRITES[wave]!, x, y + 1)
      drawSprite(g, CAGE_BARS, x, y)
    }
  }

  /**
   * A generator, in its kind's own machine: glowing hotter as its next glitch is due, its warning
   * lamp blinking faster, and its tier (three lamps; tier 3 releases the toughest) underneath.
   */
  private renderGenerator(g: CanvasRenderingContext2D, gen: Generator) {
    const x = Math.round(gen.x)
    const y = Math.round(gen.y)
    const look = ROSTER[gen.kind].look
    const art = GENERATOR_SPRITES[look]
    const due = 1 - Math.min(1, gen.timer / 90)
    const throb = 0.5 + 0.5 * Math.sin(this.tick / (8 - due * 5))
    const hot = TIER_COLOURS[gen.tier - 1]!
    glow(g, x, y, 16 + throb * 4, GLITCH_PALETTE.b, 0.2 + 0.3 * due * throb)
    dropShadow(g, x, y + 8, 8, 2, 0.45)
    drawSprite(g, gen.flash > 0 ? art.flash : art.sprite, x, y)
    if (gen.flash <= 0 && look === 'cabinet') {
      for (let i = 0; i < 6; i++) {
        g.fillStyle =
          (this.tick + i * 3) % 5 < 2 ? GLITCH_PALETTE.l : GLITCH_PALETTE.c
        g.fillRect(
          x - 5 + ((i * 7 + this.tick) % 9),
          y - 5 + ((i * 5) % 5),
          2,
          1,
        )
      }
      g.fillStyle = rgba(RAMPS.teal[3], 0.35)
      g.fillRect(x - 5, y - 5 + (Math.floor(this.tick / 3) % 6), 10, 1)
    } else if (gen.flash <= 0 && look === 'reel') {
      // The reel turns.
      const a = this.tick / 12
      g.fillStyle = RAMPS.cream[4]
      g.fillRect(
        Math.round(x + Math.cos(a) * 3) - 1,
        Math.round(y - 1 + Math.sin(a) * 3),
        1,
        1,
      )
    } else if (gen.flash <= 0 && look === 'urn' && this.tick % 40 < 20) {
      g.fillStyle = RAMPS.earth[2]
      g.fillRect(x + 5, y + 4 + ((this.tick / 4) % 4), 1, 1)
    }
    // The warning lamp on top blinks faster as a glitch gets ready.
    const lit = Math.floor(this.tick / (12 - due * 8)) % 2 === 0
    g.fillStyle = INK
    g.fillRect(x - 3, y - 11, 6, 3)
    g.fillStyle = lit ? RAMPS.ember[3] : RAMPS.ember[1]
    g.fillRect(x - 2, y - 10, 4, 2)
    g.fillStyle = lit ? RAMPS.ember[4] : RAMPS.ember[2]
    g.fillRect(x - 2, y - 10, 2, 1)
    if (lit) glow(g, x, y - 9, 7, RAMPS.ember[2], 0.6)
    // Tier lamps under it: lit up to its tier.
    g.fillStyle = INK
    g.fillRect(x - 6, y + 9, 13, 4)
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < gen.tier ? hot : RAMPS.night[2]
      g.fillRect(x - 5 + i * 4, y + 10, 3, 2)
    }
  }

  /** Is this spot explored? Glitches and goodies in the dark stay hidden. */
  private lit(t: Thing): boolean {
    return !!this.seen[this.idx(Math.floor(t.x / T), Math.floor(t.y / T))]
  }

  /** A coffee spill: a brown puddle with ripples (its tell), or a dry stain under a pulse. */
  private renderSpill(g: CanvasRenderingContext2D, gl: Glitch) {
    const x = Math.round(gl.x)
    const y = Math.round(gl.y)
    const dry = gl.state === 'dry'
    const ramp = RAMPS.earth
    g.save()
    g.globalAlpha = dry ? 0.45 : 0.9
    g.fillStyle = ramp[0]
    g.beginPath()
    g.ellipse(x, y + 1, 10, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = dry ? ramp[1] : ramp[2]
    g.beginPath()
    g.ellipse(x - 1, y, 8, 4.5, 0, 0, Math.PI * 2)
    g.fill()
    if (!dry) {
      g.fillStyle = ramp[3]
      g.fillRect(x - 5, y - 2, 3, 1)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 4, y - 2, 1, 1)
      const r = 2 + ((this.tick / 6 + gl.wobble * 3) % 7)
      g.strokeStyle = rgba(ramp[4], 0.6 * (1 - r / 9))
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(x, y, r * 1.3, r * 0.7, 0, 0, Math.PI * 2)
      g.stroke()
    } else {
      // Drying: a little timer of steam.
      const left = gl.t / DRY_TICKS
      g.globalAlpha = 1
      gauge(g, x - 6, y + 7, 12, 2, left, RAMPS.sky)
    }
    g.restore()
  }

  /** Each glitch kind in its own sprite, wearing its tell when it is about to act. */
  private renderGlitch(g: CanvasRenderingContext2D, gl: Glitch) {
    if (gl.kind === 'spill') return
    const frame = Math.floor(this.tick / 8 + gl.wobble) % 2
    let x = Math.round(gl.x)
    const y = Math.round(gl.y)
    const frames = gl.flash > 0 ? GLITCH_FLASH[gl.kind] : GLITCH_FRAMES[gl.kind]
    if (gl.kind === 'bug') {
      dropShadow(g, x, y + 3, 2, 1, 0.35)
      drawSprite(
        g,
        frames[Math.floor(this.tick / 2 + gl.wobble) % 2]!,
        x,
        y - 2,
      )
      return
    }
    if (gl.tier === 3) glow(g, x, y, 11, RAMPS.ember[3], 0.28)
    dropShadow(g, x, y + 6, 5, 1.5, 0.4)
    if (gl.kind === 'glitch') {
      const shift = (Math.floor(this.tick / 3 + gl.wobble) % 3) - 1
      g.save()
      g.globalCompositeOperation = 'lighter'
      drawSprite(g, GLITCH_GHOSTS[frame]!, x - shift * 2, y, { alpha: 0.45 })
      g.restore()
      drawSprite(g, frames[frame]!, x + shift, y)
      return
    }
    if (gl.kind === 'mimic') {
      // A snack, unless it is blinking (its tell) or awake and snapping.
      const bob = Math.round(Math.sin(this.tick / 10 + x * 0.1) * 1.2)
      const pose = gl.state === 'awake' ? 2 : gl.t <= MIMIC_BLINK ? 1 : 0
      drawSprite(g, frames[pose]!, x, y - 1 + (gl.state === 'awake' ? 0 : bob))
      return
    }
    if (gl.kind === 'brute' && gl.state === 'windup') {
      // Stomping: it shakes and kicks up dust.
      x += this.tick % 4 < 2 ? -1 : 1
      g.fillStyle = rgba(RAMPS.steel[3], 0.7)
      g.fillRect(x - 8, y + 6, 3, 1)
      g.fillRect(x + 6, y + 6, 3, 1)
    }
    const pose =
      gl.kind === 'brute' ? (gl.state === 'windup' ? 1 : frame) : frame
    if (gl.kind === 'imp' && gl.state === 'inhale') {
      glow(g, x, y, 10 + (IMP_TELL - gl.t) / 3, RAMPS.ember[4], 0.55)
      drawSprite(g, gl.flash > 0 ? frames[0]! : IMP_INHALE, x, y)
    } else drawSprite(g, frames[pose]!, x, y)
    if (gl.kind === 'popup' && gl.t <= POPUP_TELL && gl.t > 0) {
      // The pop-up's "!" as it winds up a lob.
      if (Math.floor(this.tick / 5) % 2 === 0)
        drawText(g, '!', x, y - 16, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
    }
    if (gl.kind === 'leech') {
      // The battery on its back glows while it carries stolen charge.
      if (gl.loot)
        glow(
          g,
          x + 1,
          y - 1,
          7,
          RAMPS.gold[4],
          0.4 + 0.2 * Math.sin(this.tick / 4),
        )
    }
    if (gl.kind === 'pickpocket' && gl.loot)
      drawSprite(g, LOOT_SACK, x + 6, y + 2)
    if (gl.maxHp > 1 && gl.hp < gl.maxHp)
      gauge(g, x - 5, y - 11, 10, 2, gl.hp / gl.maxHp, RAMPS.pink)
  }

  /** Packets in the air over a growing landing ring (their tell), and imp sparks. */
  private renderShots(g: CanvasRenderingContext2D) {
    for (const s of this.shots) {
      if (s.kind === 'packet') {
        const f = s.t / PACKET_TICKS
        const r = PACKET_SPLASH * (0.4 + 0.6 * f)
        g.strokeStyle = rgba(RAMPS.leaf[3], 0.4 + 0.5 * f)
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(s.x, s.y + 2, r, r * 0.55, 0, 0, Math.PI * 2)
        g.stroke()
        const px = s.x0 + (s.x - s.x0) * f
        const py = s.y0 + (s.y - s.y0) * f - Math.sin(f * Math.PI) * 30
        dropShadow(
          g,
          s.x0 + (s.x - s.x0) * f,
          s.y0 + (s.y - s.y0) * f + 3,
          3,
          1,
          0.35,
        )
        g.fillStyle = INK
        g.fillRect(Math.round(px) - 3, Math.round(py) - 3, 6, 6)
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4)
        g.fillStyle = RAMPS.leaf[4]
        g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 2, 1)
        continue
      }
      glow(g, s.x, s.y, 8, RAMPS.ember[3], 0.6)
      g.fillStyle = RAMPS.ember[2]
      g.fillRect(
        Math.round(s.x - s.vx * 2) - 1,
        Math.round(s.y - s.vy * 2) - 1,
        2,
        2,
      )
      g.fillStyle = RAMPS.ember[4]
      g.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 2, 4, 4)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2)
    }
  }

  /** The Hug Token: a bouncing heart, or riding over its holder's head in a pink halo. */
  private renderToken(g: CanvasRenderingContext2D) {
    const t = this.token
    if (!t) return
    const held = t.holder >= 0
    if (!held && !this.lit(t)) return
    const bounce = Math.abs(Math.sin(this.tick / 9)) * (held ? 2 : 5)
    // Held, it rides on the holder's shoulder, clear of the seat tag over its head.
    const x = Math.round(t.x + (held ? 10 : 0))
    const y = Math.round(t.y - (held ? 10 : 2) - bounce)
    glow(g, x, y, 12 + Math.sin(this.tick / 6) * 2, RAMPS.pink[3], 0.55)
    if (held) {
      g.strokeStyle = rgba(RAMPS.pink[3], 0.6)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(t.x, t.y + 7, 10, 4, 0, 0, Math.PI * 2)
      g.stroke()
    } else dropShadow(g, x, Math.round(t.y) + 6, 4, 1.4, 0.4)
    drawSprite(g, HEART_SPRITE, x, y)
    g.fillStyle = '#ffffff'
    if (this.tick % 30 < 6) g.fillRect(x - 2, y - 2, 1, 1)
  }

  /** Wrench sparks: a hot glow, a trail in the thrower's colour, and a twinkling star. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const frame = Math.floor(this.tick / 3) % 2
    for (const s of this.sparks) {
      const big = this.specOf(s.owner).power > 1
      const trail = BOT_LOOKS[s.owner.cls].head[3]
      glow(g, s.x, s.y, big ? 10 : 7, RAMPS.gold[3], 0.55)
      g.fillStyle = rgba(trail, 0.7)
      g.fillRect(
        Math.round(s.x - s.vx * 1.5) - 1,
        Math.round(s.y - s.vy * 1.5) - 1,
        2,
        2,
      )
      g.fillStyle = rgba(trail, 0.35)
      g.fillRect(
        Math.round(s.x - s.vx * 2.6),
        Math.round(s.y - s.vy * 2.6),
        1,
        1,
      )
      drawSprite(g, (big ? BIG_SPARK_SPRITES : SPARK_SPRITES)[frame]!, s.x, s.y)
    }
  }

  private renderHeroes(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    for (const hero of [...this.heroes].sort((a, b) => a.y - b.y)) {
      const x = Math.round(hero.x)
      const y = Math.round(hero.y)
      if (duo) {
        g.strokeStyle = rgba(SEAT_COLORS[hero.seat]!, 0.8)
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(x, y + 7, 7, 2.5, 0, 0, Math.PI * 2)
        g.stroke()
      }
      if (!hero.flat) glow(g, x, y, 14, BOT_LOOKS[hero.cls].head[3], 0.2)
      dropShadow(g, x, y + 7, 6, 2, 0.45)
      if (hero.flat) {
        // Flat: dimmed, with a blinking empty battery overhead.
        this.drawBot(g, hero.cls, x, y, 4, 0, 1, 0.45)
        if (Math.floor(this.tick / 15) % 2 === 0)
          drawSprite(g, FLAT_SPRITE, x, y - 15)
        continue
      }
      const step = Math.floor((this.strides[hero.seat] ?? 0) / 6) % 2
      const fx = FACE_X[hero.facing]!
      const fy = FACE_Y[hero.facing]!
      const wrench = () =>
        drawSprite(g, WRENCH_SPRITE, x + fx * 8, y + 1 + fy * 7)
      if (fy < 0) wrench()
      this.drawBot(g, hero.cls, x, y, hero.facing, step as 0 | 1)
      if (fy >= 0) wrench()
      if (hero.cls === 'sage') {
        // Sage's antenna tip glows, pink then gold.
        const pink = Math.floor(this.tick / 10) % 2 === 1
        const colour = pink ? RAMPS.pink[3] : RAMPS.gold[4]
        glow(g, x, y - 7, 6, colour, 0.6)
        g.fillStyle = colour
        g.fillRect(x - 1, y - 8, 1, 1)
      }
      // 1P/2P tags above their bots, 3P/4P below (they start a row lower).
      if (duo)
        drawText(g, `${hero.seat + 1}P`, x, y + (hero.seat >= 2 ? 11 : -19), {
          align: 'center',
          color: SEAT_COLORS[hero.seat],
          outline: INK,
        })
    }
  }

  /** A bot sprite for a facing (of eight) and walk step, its body centred on (x, y). */
  private drawBot(
    g: CanvasRenderingContext2D,
    cls: BotClass,
    x: number,
    y: number,
    facing: number,
    step: 0 | 1,
    scale = 1,
    alpha?: number,
  ) {
    const view: View = facing === 0 ? 'up' : facing === 4 ? 'down' : 'side'
    drawSprite(g, BOT_SPRITES[cls][view][step], x, y + 8 * scale, {
      anchor: 'feet',
      flipX: FACE_X[facing]! < 0,
      scale,
      alpha,
    })
  }

  /** A clinging glitch zaps the bot it's draining: a flickering arc between them. */
  private renderZaps(g: CanvasRenderingContext2D) {
    if (this.tick % 4 >= 3) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const gl of this.glitches) {
      if (gl.kind !== 'glitch' && gl.kind !== 'bug') continue
      const prey = this.preyFor(gl)
      if (!prey || Math.hypot(prey.x - gl.x, prey.y - gl.y) >= 9) continue
      const flick = (this.tick + Math.floor(gl.wobble * 5)) % 3
      const mx = (gl.x + prey.x) / 2 + (flick - 1) * 2
      const my = (gl.y + prey.y) / 2 - 3 + flick
      g.strokeStyle = rgba(GLITCH_PALETTE.l, 0.9)
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(gl.x, gl.y)
      g.lineTo(mx, my)
      g.lineTo(prey.x, prey.y - 2)
      g.stroke()
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(mx), Math.round(my), 1, 1)
    }
    g.restore()
  }

  /** A kindness pulse: rings of pink light racing out from the bot that sent it. */
  private renderPulse(g: CanvasRenderingContext2D) {
    const t = 1 - this.pulseFlash / 20
    const { x, y } = this.pulseAt
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = rgba(RAMPS.pink[2], 0.22 * (1 - t))
    g.fillRect(this.camX - 8, this.camY - 8, W + 16, VIEW_H + 16)
    for (let i = 0; i < 3; i++) {
      const r = 8 + (t * 260 - i * 26)
      if (r <= 2) continue
      g.strokeStyle = rgba(
        [RAMPS.pink[4], RAMPS.pink[3], RAMPS.gold[3]][i]!,
        0.75 * (1 - t),
      )
      g.lineWidth = 5 - i * 1.5
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
    glow(g, x, y, 30 * (1 - t) + 6, RAMPS.pink[4], 0.6 * (1 - t))
  }

  private renderSelect(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    cachedLayer(g, 'kindness-gauntlet-select', W, H, paintSelect)
    drawText(g, duo ? 'CHOOSE YOUR BOTS' : 'CHOOSE YOUR BOT', W / 2, 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    CLASS_ORDER.forEach((cls, i) => {
      const spec = BOT_CLASSES[cls]
      const look = BOT_LOOKS[cls]
      const cx = 44 + i * 77
      const here = this.heroes.filter((h) => h.choice === i)
      const lit = here.length > 0
      const frame = lit
        ? duo
          ? SEAT_COLORS[here[0]!.seat]!
          : look.head[3]
        : RAMPS.night[3]
      g.fillStyle = frame
      g.fillRect(cx - 36, 42, 72, 112)
      hudPanel(g, cx - 34, 44, 68, 108, lit ? RAMPS.purple : RAMPS.night)
      // A pedestal, and the bot on it (turning and stepping while chosen).
      bevel(g, cx - 18, 103, 36, 6, RAMPS.steel, { depth: 1 })
      if (lit) {
        glow(g, cx, 80, 34, look.body[3], 0.35)
        glow(g, cx, 104, 18, look.head[4], 0.3)
      }
      dropShadow(g, cx, 105, 15, 3, 0.5)
      const facing = lit ? 3 + (Math.floor(this.tick / 20) % 3) : 4
      const step = lit ? Math.floor(this.tick / 10) % 2 : 0
      this.drawBot(g, cls, cx, 81, facing, step as 0 | 1, 3, lit ? 1 : 0.6)
      if (cls === 'sage') {
        const tip =
          Math.floor(this.tick / 10) % 2 ? RAMPS.pink[3] : RAMPS.gold[4]
        glow(g, cx, 60, 10, tip, lit ? 0.6 : 0.3)
      }
      drawText(g, spec.name, cx, 120, {
        scale: 2,
        align: 'center',
        color: lit ? '#ffffff' : RAMPS.steel[2],
        outline: INK,
      })
      drawText(g, spec.role, cx, 140, {
        align: 'center',
        color: lit ? look.head[3] : RAMPS.steel[1],
        outline: INK,
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
            h.seat < 2 ? 32 : 157,
            {
              align: left ? 'left' : 'right',
              color: SEAT_COLORS[h.seat],
              outline: INK,
            },
          )
        }
    })
    if (duo) {
      const step = this.heroes.length > 2 ? 9 : 10
      hudPanel(g, 8, 166, W - 16, 2 + this.heroes.length * step, RAMPS.night)
      for (const h of this.heroes) {
        const spec = BOT_CLASSES[CLASS_ORDER[h.choice]!]
        drawText(
          g,
          `${h.seat + 1}P ${spec.name}: ${spec.about[0]}`,
          W / 2,
          168 + h.seat * step,
          {
            align: 'center',
            color: SEAT_COLORS[h.seat],
            outline: INK,
          },
        )
      }
    } else {
      const spec = BOT_CLASSES[CLASS_ORDER[this.lead.choice]!]
      hudPanel(g, 40, 168, W - 80, 24, RAMPS.night)
      drawText(g, spec.about[0], W / 2, 172, {
        align: 'center',
        color: RAMPS.steel[4],
        outline: INK,
      })
      drawText(g, spec.about[1], W / 2, 182, {
        align: 'center',
        color: RAMPS.steel[4],
        outline: INK,
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
        { align: 'center', color: RAMPS.teal[3], outline: INK },
      )
    const secs = `${Math.ceil(this.selecting / 60)}`
    const sw = measureText(secs) + 10
    hudPanel(g, W / 2 - sw / 2, 219, sw, 12, RAMPS.night)
    drawText(g, secs, W / 2, 221, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
    vignette(g, W, H, 0.3)
  }

  /** A new glitch kind's card: what it looks like, its tell and its answer. */
  private renderIntro(g: CanvasRenderingContext2D) {
    if (!this.intro || this.banner) return
    const kind = this.intro.kind
    const e = ROSTER[kind]
    const lines = [
      ...wrapWords(`TELL: ${e.tell}`, 40),
      ...wrapWords(`ANSWER: ${e.answer}`, 40),
    ]
    const h = 26 + lines.length * 9
    const top = H - 24 - h
    const fade = Math.min(1, this.intro.ticks / 20)
    g.save()
    g.globalAlpha = fade
    hudPanel(g, 6, top, W - 12, h, RAMPS.night)
    const frames = GLITCH_FRAMES[kind]
    if (kind === 'spill')
      this.renderSpill(g, {
        ...this.glitches[0]!,
        kind,
        x: 28,
        y: top + h / 2,
        state: 'walk',
        wobble: 0,
      })
    else
      drawSprite(
        g,
        frames[Math.floor(this.tick / 10) % Math.min(2, frames.length)]!,
        28,
        top + h / 2,
        { scale: 2 },
      )
    drawText(g, `NEW GLITCH: ${e.name}`, 50, top + 5, {
      color: RAMPS.gold[4],
      outline: INK,
    })
    lines.forEach((line, i) => {
      drawText(g, line, 50, top + 18 + i * 9, {
        color:
          line.startsWith('ANSWER') || i >= lines.length - 1
            ? RAMPS.leaf[4]
            : RAMPS.steel[4],
        outline: INK,
      })
    })
    g.restore()
  }

  /** Each seat's own score, on the floor-clear and game-over screens (co-op only). */
  private renderTally(g: CanvasRenderingContext2D) {
    if (this.heroes.length < 2 || !(this.leaving > 0 || this.over)) return
    const rows = this.heroes
    const h = 6 + rows.length * 10
    const w = 150
    const left = W / 2 - w / 2
    hudPanel(g, left, 124, w, h, RAMPS.night)
    for (const hero of rows) {
      const y = 127 + hero.seat * 10
      drawText(g, `${hero.seat + 1}P ${this.specOf(hero).name}`, left + 6, y, {
        color: SEAT_COLORS[hero.seat],
        outline: INK,
      })
      drawText(g, String(hero.points), left + w - 6, y, {
        align: 'right',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
  }

  /** The Mainframe at the foot of the screen: her face, talking, and what she says. */
  private renderVoice(g: CanvasRenderingContext2D) {
    const v = this.voice
    if (!v) return
    const top = H - 21
    const slide = Math.min(1, (VOICE_TICKS - v.ticks) / 8, v.ticks / 8)
    g.save()
    g.globalAlpha = slide
    hudPanel(
      g,
      2,
      top,
      Math.min(W - 4, measureText(v.text) + 32),
      19,
      RAMPS.purple,
    )
    const talking =
      v.ticks > VOICE_TICKS - 50 && Math.floor(this.tick / 5) % 2 === 0
    drawSprite(g, MAINFRAME_FACE[talking ? 1 : 0]!, 13, top + 10)
    drawText(g, v.text, 26, top + 6, { color: RAMPS.cream[3], outline: INK })
    g.restore()
  }

  // --- HUD ---------------------------------------------------------------------

  private renderHud(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'kindness-gauntlet-hud', W, VIEW_Y, (k) => {
      bandedGradient(k, 0, 0, W, VIEW_Y, [RAMPS.night[2], RAMPS.night[0]], 2)
      k.fillStyle = INK
      k.fillRect(0, VIEW_Y - 1, W, 1)
    })
    hudPanel(g, 2, 1, 78, 14)
    drawText(g, String(this.score).padStart(6, '0'), 6, 1, {
      scale: 2,
      color: RAMPS.gold[4],
      shadow: INK,
    })
    // On the right: the high score over the floor number.
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const floor = `FLOOR ${this.level}`
    const rightW = Math.max(measureText(hi), measureText(floor)) + 8
    const rightX = W - 2 - rightW
    hudPanel(g, rightX, 1, rightW, 14)
    drawText(g, hi, W - 6, 1, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, floor, W - 6, 8, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    // Beside it: bots rescued, and the team's keys while a door is locked.
    const infoX = rightX - 3 - 28
    hudPanel(g, infoX, 1, 28, 14)
    drawSprite(g, HUD_BOT, infoX + 6, 4)
    drawText(g, String(this.rescued), infoX + 11, 1, {
      color: RAMPS.gold[3],
      shadow: INK,
    })
    if (this.keys > 0 || this.doors.some((d) => !d.open)) {
      drawSprite(g, HUD_KEY, infoX + 6, 11)
      drawText(g, String(this.keys), infoX + 11, 8, {
        color: RAMPS.gold[4],
        shadow: INK,
      })
    }
    this.renderSeats(g, 84, infoX - 3)
    if (this.banner) {
      // A dimmed band behind the banner keeps it legible over the busy dungeon.
      const tall = this.banner.sub ? 34 : 22
      g.fillStyle = rgba(INK, 0.55)
      g.fillRect(0, 86, W, tall)
      g.fillStyle = rgba(RAMPS.purple[3], 0.6)
      g.fillRect(0, 86, W, 1)
      g.fillRect(0, 86 + tall - 1, W, 1)
      drawText(g, this.banner.text, W / 2, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 110, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  /**
   * A boxed panel per seated bot between `left` and `right`: whose it is (and which bot, when
   * there's room), its pulses, and its battery gauge (FLAT, blinking, once it runs out).
   */
  private renderSeats(
    g: CanvasRenderingContext2D,
    left: number,
    right: number,
  ) {
    const count = this.heroes.length
    const gap = 3
    const pw = Math.floor((right - left - gap * (count - 1)) / count)
    for (const hero of this.heroes) {
      const x = left + hero.seat * (pw + gap)
      const spec = this.specOf(hero)
      hudPanel(g, x, 1, pw, 14)
      const label =
        count === 1
          ? `${spec.name} BATTERY`
          : count === 2
            ? `${hero.seat + 1}P ${spec.name}`
            : `${hero.seat + 1}P`
      drawText(g, label, x + 4, 1, {
        color: count === 1 ? RAMPS.leaf[4] : SEAT_COLORS[hero.seat],
        shadow: INK,
      })
      const pulses = String(hero.pulses)
      drawText(g, pulses, x + pw - 4, 1, {
        align: 'right',
        color: RAMPS.pink[4],
        shadow: INK,
      })
      drawSprite(g, HUD_HEART, x + pw - 8 - measureText(pulses), 4)
      if (hero.flat) {
        if (Math.floor(this.tick / 15) % 2 === 0)
          drawText(g, 'FLAT', x + 4, 8, { color: RAMPS.ember[3], shadow: INK })
      } else {
        const frac = Math.max(0, hero.battery) / MAX_BATTERY
        gauge(
          g,
          x + 4,
          10,
          pw - 8,
          3,
          frac,
          frac > 0.4 ? RAMPS.leaf : frac > 0.2 ? RAMPS.gold : RAMPS.ember,
        )
      }
    }
  }
}

const kindnessGauntlet: ArcadeGameModule = {
  create: (options) => new KindnessGauntlet(options),
}

export const create = kindnessGauntlet.create
export default kindnessGauntlet
