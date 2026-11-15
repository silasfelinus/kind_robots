// /utils/arcade/games/cocoaCounter.ts
//
// Cocoa Counter -- the Kind Robots Arcade's Tapper riff (conductor
// kr-arcade/t-009 game factory, batch 4). Thirsty robots shuffle up four long
// counters toward the cocoa urns. Pour a mug at an urn and it slides down that
// counter; the first shuffling robot it reaches catches it and is nudged back
// toward the door (out of the door, it leaves happy). A robot that is still
// thirsty drinks up, slides the empty mug back, and shuffles on.
//
// Three things cost a mug-bot (a life): a robot reaching the urns, a full mug
// sliding off the far end with nobody to catch it, and an empty mug sliding off
// the urn end because nobody was there to catch it. Some robots leave a tip on
// the counter; walk down the counter to pick it up. Serve every robot in the
// round to clear it; COCOA_CURVES ramp the crowd, its pace and its thirst.
//
// Up/down hop between counters (always to the urn end), left/right walk along
// one, A pours.
//
// Depth pass slice 1 (conductor kr-arcade/t-122), Orders and the Cozy core:
// every robot shows an order bubble. Tap A for plain cocoa, hold A for
// marshmallows, hold A and press B for a peppermint swirl; a wrong drink is
// politely handed back full and has to be caught. Right drinks, caught empties
// and tips fill the Cozy meter, and B on a full meter starts the Sing-along
// (everyone stops to sway for 5 s). Tips also pay into the Cafe Fund and can
// be snatched by a patron that steals them. Clean serves build the Rush combo
// (x1 to x5), an empty caught as a pour goes out is a Juggle, and 30k, 80k and
// 150k each bring an extra mug-bot. Venues, counter features, patrons and the
// Endless Shift ladder (something new every round, then rush steps that keep
// climbing past the old round-12 plateau) are data in ../cocoaCounter/.

import {
  RUSH_AFTER,
  TOPPING_TICKS,
  comboMultiplier,
  extraMugBotsBetween,
  isJuggle,
  newPour,
  pickOrder,
  pickPatron,
  pourStep,
  shiftRules,
} from '../cocoaCounter/rules'
import type { Pour, ShiftRules } from '../cocoaCounter/rules'
import {
  COUNTER_FEATURES,
  COZY,
  ENDLESS_LADDER,
  EXTRA_MUG_BOTS,
  HANDBACK_CATCH_POINTS,
  JUGGLE_POINTS,
  PATRONS,
  RUSH_COMBO,
  TOPPINGS,
  TOPPING_ORDER,
} from '../cocoaCounter/tables'
import type { PatronId, Topping } from '../cocoaCounter/tables'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeGuidePage,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const HUD_H = 26
const ROWS = 4
const ROW_GAP = 52
const FIRST_COUNTER = HUD_H + 40
const DOOR_X = 18
const TAP_X = 284
const WALK_SPEED = 1.6
const MUG_SPEED = 2.4
const PUSH_SPEED = 2.2
const LEAVE_SPEED = 1.1
const CATCH_RANGE = 7
const REACH_X = TAP_X - 14
const TIP_LIFE = 360
const START_LIVES = 3
/** Spills the mop-bot cleans up for free, per life. */
const MOPS = 2
const LOSE_TICKS = 110
const CLEAR_TICKS = 130
/** How long a robot handed the wrong drink stands shaking its head. */
const REFUSE_TICKS = 40
/** A handed-back mug comes home a little quicker than an empty. */
const HANDBACK_SPEED = 1.15

const DOOR_POINTS = 100
const EMPTY_POINTS = 100
const ROUND_BONUS = 500

export { COCOA_CURVES } from '../cocoaCounter/rules'

type RobotState = 'walk' | 'pushed' | 'drink' | 'leave' | 'refuse'
type Robot = {
  row: number
  x: number
  state: RobotState
  timer: number
  phase: number
  color: string
  thirsty: boolean
  patron: PatronId
  /** What its bubble asks for. */
  order: Topping
  stealsTips: boolean
}
/** A sliding mug: full ones slide to the door, empties and handed-back ones to the urn. */
type Mug = {
  row: number
  x: number
  full: boolean
  topping: Topping
  /** A full mug handed back because it was the wrong drink. */
  back: boolean
}
type Tip = {
  row: number
  x: number
  life: number
  points: number
  coins: number
}
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const ROBOT_COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#facc15', '#c084fc']

const rowY = (row: number) => FIRST_COUNTER + row * ROW_GAP

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const blendRamp = (a: Ramp, b: Ramp, t: number): Ramp => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
  mix(a[3], b[3], t),
  mix(a[4], b[4], t),
]

/** Warm honey wood for the counter tops and window frames. */
const WOOD = blendRamp(RAMPS.earth, RAMPS.rust, 0.3)
/** Darker stained wood for the counter fronts, wainscot and ceiling beam. */
const WOOD_DARK = blendRamp(RAMPS.earth, RAMPS.night, 0.35)
/** Plum-and-burgundy wallpaper. */
const WALL = ['#20081a', '#3a0f26', '#561a32', '#7a2a3e', '#a8475a'] as const
const SNOW = mix(RAMPS.steel[3], RAMPS.purple[3], 0.35)

/** Where the back wall opens onto the snowy night: three windows a counter, plus the door. */
const WIN_W = 28
const WIN_H = 17
const WIN_TOP = -35
const WINDOWS_X = [34, 122, 210] as const
const DOOR_W = 12
const DOOR_TOP = -30
const OPENINGS = [
  { x: 0, w: DOOR_W },
  ...WINDOWS_X.map((x) => ({ x, w: WIN_W })),
]
/** Lamps and shelves fill the wall between the windows. */
const GAPS = [93, 181, 269] as const
const URN_X = TAP_X + 22

const inOpening = (x: number) => OPENINGS.some((o) => x >= o.x && x < o.x + o.w)

const ROW_STARS = Array.from({ length: ROWS }, (_, r) =>
  starField(80 + r, 70, W, 14)
    .filter((s) => inOpening(s.x))
    .map((s) => ({ ...s, y: s.y + rowY(r) + WIN_TOP })),
)

const FLAKES = (() => {
  const rand = backdropRng(57)
  return Array.from({ length: 30 }, () => {
    const o = OPENINGS[Math.floor(rand() * OPENINGS.length)]!
    return {
      x: o.x + 1 + rand() * (o.w - 2),
      y: rand() * 48,
      speed: 0.12 + rand() * 0.2,
      sway: rand() * Math.PI * 2,
      near: rand() < 0.35,
    }
  })
})()

const robotHead = (happy: boolean) => [
  '.......a......',
  '.......a......',
  '...hLLLLLLB...',
  '..hLBBBBBBBBs.',
  '..LkkkkkkkkBs.',
  '..LkkkEkkEkBs.',
  happy ? '..LkkEkEEkEBs.' : '..LkkkEkkEkBs.',
  '..LkkkkkkkkBs.',
  '..BBBBBBBBBss.',
  '...sssssssss..',
]
const TORSO_DOWN = [
  '......TT......',
  '...hBBBBBBBs..',
  '..thLccccBBst.',
  '..thLcGGcBBst.',
  '..thLccccBBst.',
  '..TsBBBBBBBsT.',
  '...ddddddddd..',
]
const TORSO_HOLD = [
  '......TT......',
  '...hBBBBBBBs..',
  '..thLccccBBst.',
  '..thLcGGcBBsTT',
  '..thLccccBBs..',
  '..TsBBBBBBBs..',
  '...ddddddddd..',
]
const TORSO_UP = [
  '......TT...tT.',
  '...hBBBBBBBst.',
  '..thLccccBBs..',
  '..thLcGGcBBs..',
  '..thLccccBBs..',
  '..TsBBBBBBBs..',
  '...ddddddddd..',
]
const LEGS_STAND = ['....tt...tt...', '....tt...tt...', '...uuu...uuu..']
const LEGS_STRIDE = ['....tt...tt...', '...tt.....tt..', '..uuu.....uuu.']

type RobotLook = {
  walk: readonly [PixelSprite, PixelSprite]
  happy: readonly [PixelSprite, PixelSprite]
  hold: PixelSprite
  drink: PixelSprite
}

/** The thirsty robots, one shaded look per colour, drawn facing the urns. */
function robotLook(ramp: Ramp): RobotLook {
  const palette = {
    a: RAMPS.steel[3],
    h: ramp[4],
    L: ramp[3],
    B: ramp[2],
    s: ramp[1],
    d: ramp[0],
    k: RAMPS.night[1],
    E: RAMPS.teal[3],
    c: RAMPS.cream[3],
    G: RAMPS.gold[3],
    t: RAMPS.steel[2],
    T: RAMPS.steel[3],
    u: RAMPS.steel[1],
  }
  const make = (happy: boolean, torso: string[], legs: string[]) =>
    pixelSprite([...robotHead(happy), ...torso, ...legs], palette)
  return {
    walk: [
      make(false, TORSO_DOWN, LEGS_STAND),
      make(false, TORSO_DOWN, LEGS_STRIDE),
    ],
    happy: [
      make(true, TORSO_DOWN, LEGS_STAND),
      make(true, TORSO_DOWN, LEGS_STRIDE),
    ],
    hold: make(false, TORSO_HOLD, LEGS_STAND),
    drink: make(true, TORSO_UP, LEGS_STAND),
  }
}

const ROBOT_RAMPS: readonly Ramp[] = [
  RAMPS.sky,
  RAMPS.pink,
  RAMPS.leaf,
  RAMPS.gold,
  RAMPS.purple,
]
const ROBOT_LOOKS = new Map(
  ROBOT_COLORS.map((colour, i) => [colour, robotLook(ROBOT_RAMPS[i]!)]),
)

const SERVER_TOP = [
  '....hTTTt....',
  '...hTTTTTtS..',
  '...TkkkkkkS..',
  '...TkkEkkES..',
  '...TkkkkkkS..',
  '...tTTTTTSS..',
  '....tRrRt....',
  '...hTTTTTTt..',
]
const SERVER_ARMS_DOWN = [
  '..ThAAAAAAtT.',
  '..TAAaaAAAtT.',
  '..tAAAAAAAst.',
  '..HAAAAAAAsH.',
]
const SERVER_ARMS_POUR = [
  '..ThAAAAAAtT.',
  '..TAAaaAAAtTH',
  '..tAAAAAAAs..',
  '..HAAAAAAAs..',
]
const SERVER_HEM = ['...aaaaaaas..']
const SERVER_LEGS_STAND = ['....uu..uu...', '....uu..uu...', '...TTu..TTu..']
const SERVER_LEGS_STEP = ['....uu..uu...', '...uu....uu..', '..TTu....TTu.']
const SERVER_PALETTE = {
  h: RAMPS.steel[4],
  T: RAMPS.steel[3],
  t: RAMPS.steel[2],
  S: RAMPS.steel[1],
  k: RAMPS.night[2],
  E: RAMPS.teal[3],
  R: RAMPS.ember[2],
  r: RAMPS.ember[1],
  A: RAMPS.rust[3],
  a: RAMPS.rust[2],
  s: RAMPS.rust[1],
  H: RAMPS.cream[3],
  u: RAMPS.steel[1],
}
const server = (arms: string[], legs: string[]) =>
  pixelSprite([...SERVER_TOP, ...arms, ...SERVER_HEM, ...legs], SERVER_PALETTE)
/** The mug-bot behind the counters, facing right (flipped to face the door). */
const SERVER_SPRITES = {
  stand: server(SERVER_ARMS_DOWN, SERVER_LEGS_STAND),
  step: server(SERVER_ARMS_DOWN, SERVER_LEGS_STEP),
  pour: server(SERVER_ARMS_POUR, SERVER_LEGS_STAND),
}

const MUG_PALETTE = {
  c: RAMPS.earth[1],
  C: RAMPS.earth[2],
  F: '#ffffff',
  e: RAMPS.cream[0],
  h: '#ffffff',
  W: RAMPS.cream[3],
  w: RAMPS.cream[2],
  s: RAMPS.cream[1],
  R: RAMPS.ember[2],
  r: RAMPS.ember[1],
  H: RAMPS.cream[2],
  M: RAMPS.teal[3],
  m: RAMPS.teal[2],
  P: RAMPS.pink[4],
  p: RAMPS.pink[3],
}
const MUG_BODY = ['hWWWws..', 'hRRRrsHH', 'hWWWws.H', 'hWWWwsHH', '.ssss...']
const FULL_MUG = pixelSprite(['cCFFCc..', ...MUG_BODY], MUG_PALETTE)
const EMPTY_MUG = pixelSprite(['seeees..', ...MUG_BODY], MUG_PALETTE)
/** Marshmallows heaped over the rim. */
const MARSH_MUG = pixelSprite(
  ['.hP.hp..', 'hPPhPPp.', 'cPpCPpc.', ...MUG_BODY],
  MUG_PALETTE,
)
/** A peppermint swirl: mint and white twisted up out of the cocoa. */
const SWIRL_MUG = pixelSprite(
  ['..hM....', '.MhmM...', 'cMhMmhc.', ...MUG_BODY],
  MUG_PALETTE,
)
const TOPPED_MUGS: Record<Topping, PixelSprite> = {
  plain: FULL_MUG,
  marshmallow: MARSH_MUG,
  swirl: SWIRL_MUG,
}

/** A music note for the Sing-along. */
const NOTE_SPRITE = pixelSprite(
  ['...hH', '...hH', '...h.', '...h.', '.hhh.', 'hHHh.', '.hh..'],
  { h: RAMPS.gold[3], H: RAMPS.gold[4] },
  { outline: RAMPS.night[0] },
)

const URN_SPRITE = pixelSprite(
  [
    '.......TT.....',
    '......HTTt....',
    '....HTTTTTTt..',
    '...SSSSSSSSSS.',
    '...THTTttSSu..',
    '...CyCcccddD..',
    '...CyCgGgddD..',
    '...CyCgggddD..',
    '...CyCgggddD..',
    '...CyCgggddD..',
    '...THTTttSSu..',
    'TTTCyCcccddD..',
    'u..CyCcccddD..',
    '...CyCcccddD..',
    '...CyCcccddD..',
    '...CyCcccddD..',
    '...THTTttSSu..',
    '..SSSSSSSSSSS.',
    '...u.......u..',
    '...u.......u..',
  ],
  {
    T: RAMPS.steel[3],
    H: RAMPS.steel[4],
    t: RAMPS.steel[2],
    S: RAMPS.steel[1],
    u: RAMPS.steel[0],
    C: RAMPS.rust[3],
    y: RAMPS.rust[4],
    c: RAMPS.rust[2],
    d: RAMPS.rust[1],
    D: RAMPS.rust[0],
    g: RAMPS.earth[1],
    G: RAMPS.cream[3],
  },
)

const LAMP_SPRITE = pixelSprite(
  ['...hGg...', '..hGGGgd.', '.hGGGGGgd', 'dddyYyddd'],
  {
    h: RAMPS.gold[4],
    G: RAMPS.gold[3],
    g: RAMPS.gold[2],
    d: RAMPS.gold[1],
    y: RAMPS.gold[4],
    Y: '#ffffff',
  },
)

const JAR_SPRITE = pixelSprite(
  ['..tTt..', '.tTTTt.', 'hWWWWWs', 'hWoOoWs', 'hWOoOWs', 'hWWWWWs', '.sssss.'],
  {
    t: RAMPS.pink[2],
    T: RAMPS.pink[3],
    h: '#ffffff',
    W: mix(RAMPS.sky[4], RAMPS.sky[3], 0.4),
    s: RAMPS.sky[2],
    o: RAMPS.gold[2],
    O: RAMPS.gold[3],
  },
)

const CUPS_SPRITE = pixelSprite(
  ['.TTTT.', 'hTTTtd', '.tttt.', '.PPPP.', 'hPPPpq', 'hPPPpq', '.qqqq.'],
  {
    T: RAMPS.teal[3],
    t: RAMPS.teal[2],
    d: RAMPS.teal[1],
    h: '#ffffff',
    P: RAMPS.pink[3],
    p: RAMPS.pink[2],
    q: RAMPS.pink[1],
  },
)

const PLANT_SPRITE = pixelSprite(
  ['.L.L.L.', 'LlLlLlL', '.lldll.', '..ddd..', '.RRRRr.', '.rrrrq.', '..rrq..'],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    R: RAMPS.rust[3],
    r: RAMPS.rust[2],
    q: RAMPS.rust[1],
  },
)
const SHELF_ITEMS = [JAR_SPRITE, CUPS_SPRITE, PLANT_SPRITE] as const

const PINE_SPRITE = pixelSprite(
  [
    '...w...',
    '..wLd..',
    '..LLd..',
    '.wLLLd.',
    '.LLLdd.',
    'wwLLLdd',
    'LLLLddd',
    '...t...',
  ],
  { w: '#ffffff', L: RAMPS.leaf[1], d: RAMPS.leaf[0], t: RAMPS.earth[1] },
  { outline: RAMPS.night[0] },
)

const HEART_SPRITE = pixelSprite(['hP.PP', 'PPPPp', '.PPp.', '..p..'], {
  h: '#ffffff',
  P: RAMPS.pink[2],
  p: RAMPS.pink[1],
})

class CocoaCounter implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private row = 0
  private x = TAP_X
  /** The mug filling at the urn, if any. */
  private pouring: Pour | null = null
  private prevUp = false
  private prevDown = false
  private robots: Robot[] = []
  private mugs: Mug[] = []
  private tips: Tip[] = []
  private mops = MOPS
  /** The first robot after a start or a lost mug heads for your counter. */
  private greet = true
  private toSpawn = 0
  private spawnTimer = 40
  private lose = 0
  private clear = 0
  private rules: ShiftRules = shiftRules(1)
  /** The Cozy meter, 0..COZY.max. */
  private cozy = 0
  /** Ticks left in the Sing-along. */
  private singing = 0
  /** Clean serves since the last miss (the Rush combo). */
  private streak = 0
  /** Tips banked for the Cafe Fund. */
  private fund = 0
  /** No wrong drink and no spill yet this round. */
  private cleanRound = true
  private lastPourTick = -999
  private lastCatchTick = -999
  /** What the attract pilot is pouring, so it holds A (and presses B) for the right order. */
  private pilotOrder: Topping = 'plain'
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: {
    text: string
    sub?: string
    note?: string
    ticks: number
  } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(61)
  /** Where the mug-bot stood before this tick's move, so it can face and walk its heading. */
  private walkFrom = TAP_X

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound(1)
  }

  private startRound(round: number) {
    this.level = round
    this.rules = shiftRules(round)
    this.toSpawn = this.rules.robots
    this.spawnTimer = 30
    this.greet = true
    this.robots = []
    this.mugs = []
    this.tips = []
    this.row = 0
    this.x = TAP_X
    this.pouring = null
    this.singing = 0
    this.cleanRound = true
    this.banner = {
      text: `ROUND ${round}`,
      sub: `${this.toSpawn} THIRSTY ROBOTS`,
      note: this.rules.news ?? undefined,
      ticks: this.rules.news ? 150 : 100,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.walkFrom = this.x
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.lose > 0) {
      if (--this.lose === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'OUT OF MUGS', sub: 'GAME OVER', ticks: 9999 }
        } else this.resetCounters()
      }
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.startRound(this.level + 1)
      return
    }
    if (this.singing > 0) this.singing--
    this.move(controls)
    this.spawn()
    this.updateRobots()
    this.updateMugs()
    this.updateTips()
    if (
      this.lose === 0 &&
      this.toSpawn === 0 &&
      this.robots.length === 0 &&
      !this.mugs.some((m) => m.full)
    )
      this.roundClear()
  }

  private move(input: InputFrame) {
    // Hops come from fresh presses of up/down (held edges, so any pad works).
    const up = input.held.up && !this.prevUp
    const down = input.held.down && !this.prevDown
    this.prevUp = input.held.up
    this.prevDown = input.held.down
    if (this.pouring) {
      const pour = this.pouring
      const swirled = pour.swirl
      const topping = pourStep(pour, input.held.a, input.pressed.b)
      // B while A is held is the swirl; any other B is a call for the Sing-along.
      if (input.pressed.b && pour.swirl === swirled) this.startSingAlong()
      if (topping) {
        this.pouring = null
        this.sendMug(topping)
      }
      return
    }
    if (input.pressed.b) this.startSingAlong()
    if (up || down) {
      this.row = (this.row + (up ? ROWS - 1 : 1)) % ROWS
      this.x = TAP_X
      this.sound.play('blip')
      return
    }
    if (input.held.left) this.x = Math.max(DOOR_X + 14, this.x - WALK_SPEED)
    if (input.held.right) this.x = Math.min(TAP_X, this.x + WALK_SPEED)
    if (input.pressed.a) {
      if (this.x >= TAP_X - 1) this.pouring = newPour()
      else {
        // Away from the urn, A runs straight back to it.
        this.x = TAP_X
      }
    }
  }

  private sendMug(topping: Topping) {
    this.mugs.push({
      row: this.row,
      x: TAP_X - 8,
      full: true,
      topping,
      back: false,
    })
    this.sound.play('shoot')
    this.lastPourTick = this.tick
    if (isJuggle(this.lastPourTick, this.lastCatchTick)) this.juggle()
  }

  private spawn() {
    if (this.toSpawn <= 0 || this.singing > 0 || --this.spawnTimer > 0) return
    // Pick a counter whose doorway is clear.
    const open = [0, 1, 2, 3].filter(
      (r) => !this.robots.some((b) => b.row === r && b.x < DOOR_X + 26),
    )
    if (open.length === 0) {
      this.spawnTimer = 10
      return
    }
    const row =
      this.greet && open.includes(this.row)
        ? this.row
        : open[Math.floor(this.rng() * open.length)]!
    this.greet = false
    const patron = pickPatron(this.rng, this.rules)
    this.robots.push({
      row,
      x: DOOR_X - 2,
      state: 'walk',
      timer: 0,
      phase: Math.floor(this.rng() * 60),
      color: ROBOT_COLORS[Math.floor(this.rng() * ROBOT_COLORS.length)]!,
      thirsty: false,
      patron,
      order: pickOrder(this.rng, this.rules),
      stealsTips: PATRONS[patron].stealsTips,
    })
    this.toSpawn--
    this.spawnTimer = Math.round(this.rules.gap * (0.7 + this.rng() * 0.6))
  }

  private updateRobots() {
    for (const robot of this.robots) {
      const def = PATRONS[robot.patron]
      if (robot.state === 'walk') {
        // Shuffle: step for two thirds of every second, pause for the rest.
        // In the Sing-along everyone stands and sways instead.
        if (this.singing === 0 && (this.tick + robot.phase) % 60 < 40)
          robot.x += this.rules.walk * def.walk
        if (robot.x >= REACH_X) {
          this.loseMug('A ROBOT REACHED THE URN', robot.x, rowY(robot.row))
          return
        }
      } else if (robot.state === 'refuse') {
        if (--robot.timer <= 0) robot.state = 'walk'
      } else if (robot.state === 'pushed') {
        robot.x -= PUSH_SPEED
        robot.timer -= PUSH_SPEED
        if (robot.x < DOOR_X) {
          robot.timer = -1
          this.addScore(
            DOOR_POINTS * this.multiplier(),
            DOOR_X + 12,
            rowY(robot.row) - 26,
          )
          this.burst(DOOR_X + 4, rowY(robot.row) - 10, 8, robot.color)
          this.fx.burst(DOOR_X + 4, rowY(robot.row) - 14, this.fxRng, {
            count: 10,
          })
          this.sound.play('pickup')
        } else if (robot.timer <= 0) {
          robot.state = 'drink'
          robot.timer = def.drinkTicks
        }
      } else if (robot.state === 'leave') {
        robot.x -= LEAVE_SPEED
      } else if (--robot.timer <= 0) {
        // Done drinking: the empty slides back. A robot that is still thirsty
        // orders again and shuffles on; a cosy one strolls home.
        this.mugs.push({
          row: robot.row,
          x: robot.x + 6,
          full: false,
          topping: robot.order,
          back: false,
        })
        robot.state = robot.thirsty ? 'walk' : 'leave'
        if (robot.thirsty) robot.order = pickOrder(this.rng, this.rules)
        else
          this.fx.burst(robot.x, rowY(robot.row) - 24, this.fxRng, {
            count: 6,
            speed: 1,
            colours: [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
          })
      }
    }
    this.robots = this.robots.filter(
      (r) => !((r.state === 'pushed' || r.state === 'leave') && r.x < DOOR_X),
    )
  }

  private updateMugs() {
    const empty = this.rules.empty
    for (const mug of this.mugs) {
      const feature =
        COUNTER_FEATURES[this.rules.venue.counters[mug.row]!.feature]
      if (mug.full && !mug.back) {
        mug.x -= MUG_SPEED * feature.mugSpeed
        const robot = this.robots.find(
          (r) =>
            r.row === mug.row &&
            (r.state === 'walk' || r.state === 'refuse') &&
            Math.abs(r.x - mug.x) <= CATCH_RANGE,
        )
        if (robot) {
          if (robot.order === mug.topping) this.serve(robot, mug)
          else this.handBack(robot, mug)
        } else if (mug.x < DOOR_X - 4) {
          if (this.mops > 0) {
            this.mopUp(mug)
            continue
          }
          this.loseMug('A MUG SLID OFF THE END', DOOR_X, rowY(mug.row))
          return
        }
      } else {
        mug.x += empty * feature.emptySpeed * (mug.back ? HANDBACK_SPEED : 1)
        if (mug.row === this.row && Math.abs(mug.x - this.x) <= CATCH_RANGE) {
          if (mug.back) this.catchHandBack(mug)
          else this.catchEmpty(mug)
        } else if (mug.x >= TAP_X + 10) {
          this.loseMug(
            mug.back ? 'THE HANDED-BACK MUG FELL' : 'AN EMPTY MUG FELL',
            TAP_X + 10,
            rowY(mug.row),
          )
          return
        }
      }
    }
    this.mugs = this.mugs.filter((m) => m.x > -999)
  }

  /** The right drink: the robot catches it, is nudged back, and maybe leaves a tip. */
  private serve(robot: Robot, mug: Mug) {
    const def = PATRONS[robot.patron]
    const topping = TOPPINGS[mug.topping]
    mug.x = -999
    robot.state = 'pushed'
    robot.timer = this.rules.push * def.push
    robot.thirsty = this.rng() < this.rules.thirst
    const before = this.multiplier()
    this.streak++
    const after = this.multiplier()
    this.addScore(topping.points * after, robot.x, rowY(robot.row) - 28)
    this.addCozy(topping.cozy)
    if (after > before) {
      this.floaters.push({
        x: robot.x,
        y: rowY(robot.row) - 38,
        text: `RUSH X${after}`,
        life: 60,
      })
      this.sound.play('extra')
    }
    this.fx.burst(
      robot.x + 6,
      rowY(robot.row) - 10,
      this.fxRng,
      mug.topping === 'plain'
        ? { count: 4, speed: 1 }
        : { count: 8, speed: 1, colours: [topping.rim, '#ffffff'] },
    )
    this.sound.play('pop')
    if (this.rng() < def.tipChance)
      this.tips.push({
        row: robot.row,
        x: robot.x,
        life: TIP_LIFE,
        points: def.tipPoints,
        coins: def.tipCoins,
      })
  }

  /** The wrong drink: politely handed back, still full, for the mug-bot to catch. */
  private handBack(robot: Robot, mug: Mug) {
    mug.back = true
    mug.x = robot.x + 8
    robot.state = 'refuse'
    robot.timer = REFUSE_TICKS
    this.cleanRound = false
    this.breakCombo()
    this.floaters.push({
      x: robot.x,
      y: rowY(robot.row) - 38,
      text: 'NO THANKS!',
      life: 50,
    })
    this.sound.play('warn')
  }

  private catchEmpty(mug: Mug) {
    mug.x = -999
    this.addScore(EMPTY_POINTS, this.x, rowY(this.row) + 4)
    this.addCozy(COZY.empty)
    this.fx.burst(this.x, rowY(this.row) - 6, this.fxRng, {
      count: 4,
      speed: 0.9,
      colours: [RAMPS.teal[3], RAMPS.cream[4]],
    })
    this.sound.play('blip')
    this.lastCatchTick = this.tick
    if (isJuggle(this.lastPourTick, this.lastCatchTick)) this.juggle()
  }

  private catchHandBack(mug: Mug) {
    mug.x = -999
    this.addScore(HANDBACK_CATCH_POINTS, this.x, rowY(this.row) + 4)
    this.sound.play('blip')
  }

  /** An empty caught just as a pour goes out (or a pour sent just as one lands). */
  private juggle() {
    this.lastPourTick = -999
    this.lastCatchTick = -999
    this.addScore(
      JUGGLE_POINTS * this.multiplier(),
      this.x - 10,
      rowY(this.row) - 34,
    )
    this.addCozy(COZY.juggle)
    this.floaters.push({
      x: this.x - 16,
      y: rowY(this.row) - 44,
      text: 'JUGGLE!',
      life: 50,
    })
    this.fx.burst(this.x, rowY(this.row) - 16, this.fxRng, {
      count: 10,
      colours: [RAMPS.gold[4], RAMPS.teal[3], '#ffffff'],
    })
  }

  private updateTips() {
    for (const tip of this.tips) {
      tip.life--
      if (tip.row === this.row && Math.abs(tip.x - this.x) <= CATCH_RANGE) {
        tip.life = 0
        this.addScore(tip.points, tip.x, rowY(tip.row) - 14)
        this.addCozy(COZY.tip)
        if (!this.demo) this.fund += tip.coins
        this.burst(tip.x, rowY(tip.row) - 2, 8, '#fde047')
        this.fx.burst(tip.x, rowY(tip.row) - 4, this.fxRng, {
          count: 12,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
        this.sound.play('extra')
        continue
      }
      // The tip-stealing hook: a patron that steals tips pockets one it walks over.
      const thief = this.robots.find(
        (r) =>
          r.stealsTips &&
          r.row === tip.row &&
          (r.state === 'walk' || r.state === 'refuse') &&
          Math.abs(r.x - tip.x) <= CATCH_RANGE,
      )
      if (thief) {
        tip.life = 0
        this.floaters.push({
          x: tip.x,
          y: rowY(tip.row) - 30,
          text: 'SNATCHED!',
          life: 50,
        })
        this.sound.play('warn')
      }
    }
    this.tips = this.tips.filter((t) => t.life > 0)
  }

  /** A free spill: the mop-bot by the door cleans it up. */
  private mopUp(mug: Mug) {
    this.mops--
    mug.x = -999
    this.cleanRound = false
    this.breakCombo()
    this.burst(DOOR_X, rowY(mug.row) - 4, 10, '#7c2d12')
    this.sound.play('warn')
    this.banner = {
      text: 'SPLASH!',
      sub: this.mops > 0 ? 'THE MOP-BOT CAN MOP 1 MORE' : 'NO MORE MOPS!',
      ticks: 60,
    }
  }

  // --- the Cozy meter, the Sing-along and the Rush combo ----------------------

  private multiplier(): number {
    return comboMultiplier(this.streak)
  }

  private breakCombo() {
    this.streak = 0
  }

  private addCozy(amount: number) {
    if (this.cozy >= COZY.max) return
    this.cozy = Math.min(COZY.max, this.cozy + amount)
    if (this.cozy >= COZY.max) {
      this.floaters.push({
        x: W / 2,
        y: HUD_H + 10,
        text: 'COZY! PRESS B TO SING',
        life: 90,
      })
      this.sound.play('start')
    }
  }

  /** B on a full Cozy meter: everyone stops to sway for five seconds. */
  private startSingAlong() {
    if (this.cozy < COZY.max || this.singing > 0) return
    this.cozy = 0
    this.singing = COZY.singTicks
    this.banner = {
      text: 'SING-ALONG!',
      sub: 'EVERYONE STOPS TO SWAY',
      ticks: 90,
    }
    if (this.sound.playNotes)
      this.sound.playNotes(
        [523, 659, 784, 659, 698, 880, 784].map((freq, i) => ({
          freq,
          dur: 0.16,
          type: 'triangle' as const,
          vol: 0.07,
          at: i * 0.18,
        })),
      )
    else this.sound.play('level')
  }

  private roundClear() {
    const bonus = ROUND_BONUS * this.level
    this.addScore(bonus, W / 2, 110)
    for (let r = 0; r < ROWS; r++)
      this.fx.burst(W / 2 + (r - 1.5) * 60, rowY(r) - 16, this.fxRng, {
        count: 12,
        speed: 2,
      })
    this.clear = CLEAR_TICKS
    this.mugs = []
    this.pouring = null
    this.sound.play('level')
    // A clean round of right drinks fills the Cozy meter for the next one.
    const clean = this.cleanRound
    if (clean && this.cozy < COZY.max) this.addCozy(COZY.max)
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `EVERYONE IS COSY  +${bonus}`,
      note: clean ? 'A CLEAN ROUND! THE COZY METER IS FULL' : undefined,
      ticks: CLEAR_TICKS,
    }
  }

  private loseMug(why: string, x: number, y: number) {
    if (this.lose > 0) return
    this.lives--
    this.lose = LOSE_TICKS
    this.breakCombo()
    this.burst(x, y - 6, 18, '#92400e')
    this.burst(x, y - 6, 8, '#fef3c7')
    this.sound.play('die')
    this.banner = {
      text: 'OOPS!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: LOSE_TICKS,
    }
  }

  /** After a lost mug, everyone still waiting walks back in from the door. */
  private resetCounters() {
    this.toSpawn += this.robots.length
    this.robots = []
    this.mugs = []
    this.tips = []
    this.row = 0
    this.x = TAP_X
    this.pouring = null
    this.singing = 0
    this.mops = MOPS
    this.greet = true
    this.spawnTimer = 30
    this.cleanRound = false
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    const before = this.score
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50 })
    const extra = extraMugBotsBetween(before, this.score)
    if (extra > 0) {
      this.lives += extra
      this.sound.play('extra')
      this.banner = {
        text: 'EXTRA MUG-BOT!',
        sub: 'A NEW HELPER JOINS THE COUNTER',
        ticks: 90,
      }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 22 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Catches the empty mug that will land soonest, otherwise pours for the
   * counter whose robot is closest to the urn and still has no mug coming.
   */
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
    if (this.pouring) {
      // Hold A through the topping for marshmallows; hold it and tap B for a swirl.
      held.a = this.pilotOrder !== 'plain'
      if (
        this.pilotOrder === 'swirl' &&
        this.pouring.ticks >= 2 &&
        !this.pouring.swirl
      ) {
        held.b = true
        frame.pressed.b = true
      }
      return frame
    }
    if (
      this.cozy >= COZY.max &&
      this.robots.some((r) => r.state === 'walk' && r.x > REACH_X - 70)
    ) {
      // A robot is getting close: spend the Cozy meter on a Sing-along.
      held.b = true
      frame.pressed.b = true
      return frame
    }
    const empty = this.rules.empty
    let target = -1
    let soonest = Infinity
    for (const mug of this.mugs) {
      if (mug.full && !mug.back) continue
      const eta = (TAP_X - mug.x) / (empty * (mug.back ? HANDBACK_SPEED : 1))
      const hop = this.hopsTo(mug.row) * 2 + 8
      if (eta < hop + 12 && eta < soonest) {
        soonest = eta
        target = mug.row
      }
    }
    if (target < 0) {
      let urgent = -Infinity
      for (let r = 0; r < ROWS; r++) {
        const waiting = this.waitingOn(r)
        const coming = this.comingTo(r)
        if (waiting.length <= coming) continue
        const lead = waiting[0]!.x
        if (lead > urgent) {
          urgent = lead
          target = r
        }
      }
    }
    if (target < 0) {
      // Nothing to do: pick up a tip on this counter if one is handy.
      const tip = this.tips.find((t) => t.row === this.row)
      if (tip && !this.mugs.some((m) => !m.full || m.back)) {
        held.left = tip.x < this.x
        held.right = tip.x > this.x
      } else held.right = true
      return frame
    }
    if (target !== this.row) {
      // Hop on alternate ticks so each one is a fresh press.
      if (!this.prevUp && !this.prevDown) {
        const downHops = (target - this.row + ROWS) % ROWS
        if (downHops <= ROWS / 2) held.down = true
        else held.up = true
      }
      return frame
    }
    if (this.x < TAP_X - 1) {
      held.right = true
      return frame
    }
    const waitingEmpty = this.mugs.some(
      (m) => (!m.full || m.back) && m.row === this.row && TAP_X - m.x < 40,
    )
    if (!waitingEmpty) {
      // Pour what the next robot down this counter is asking for.
      const next = this.waitingOn(this.row)[this.comingTo(this.row)]
      if (next) {
        this.pilotOrder = next.order
        held.a = true
        frame.pressed.a = true
      }
    }
    return frame
  }

  /** Robots on a counter who still want a mug, nearest the urn first. */
  private waitingOn(row: number): Robot[] {
    return this.robots
      .filter(
        (b) => b.row === row && (b.state === 'walk' || b.state === 'refuse'),
      )
      .sort((a, b) => b.x - a.x)
  }

  /** Full mugs already sliding down a counter. */
  private comingTo(row: number): number {
    return this.mugs.filter((m) => m.row === row && m.full && !m.back).length
  }

  private hopsTo(row: number): number {
    const d = Math.abs(row - this.row)
    return Math.min(d, ROWS - d)
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    // The lost-mug crash: a short jolt of the whole cafe (the HUD stays put).
    const shake =
      this.lose > LOSE_TICKS - 14 ? (Math.floor(this.tick / 2) % 2 ? 2 : -2) : 0
    g.fillStyle = INK
    g.fillRect(0, 0, W, H)
    g.save()
    g.translate(shake, 0)
    this.renderCafe(g)
    if (this.singing > 0) this.renderSingAlong(g)
    for (const tip of this.tips) {
      if (tip.life < 90 && Math.floor(tip.life / 6) % 2) continue
      this.renderTip(g, tip)
    }
    for (const robot of this.robots) this.renderRobot(g, robot)
    for (const mug of this.mugs) this.renderSlidingMug(g, mug)
    for (const robot of this.robots) this.renderOrder(g, robot)
    if (this.lose === 0 || Math.floor(this.lose / 6) % 2)
      this.renderBartender(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** The cafe: a snowy night through the windows, then the wall, counters and urns over it. */
  private renderCafe(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'cocoa-counter-night', W, H, (k) => {
      for (let r = 0; r < ROWS; r++) paintNight(k, r)
    })
    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r)
      drawStars(g, ROW_STARS[r]!, this.tick + r * 17, RAMPS.sky)
      // Two depths of snow: small slow flakes far off, bigger quick ones close by.
      for (const f of FLAKES) {
        const fall = f.near ? 2.2 : 1
        const fy = ((f.y + this.tick * f.speed * fall + r * 13) % 46) - 2
        const fx =
          f.x + Math.sin(this.tick / 40 + f.sway + r) * (f.near ? 2 : 1)
        g.fillStyle = f.near ? '#ffffff' : SNOW
        g.fillRect(
          Math.round(fx),
          Math.round(y - 40 + fy),
          f.near ? 2 : 1,
          f.near ? 2 : 1,
        )
      }
    }
    cachedLayer(g, 'cocoa-counter-cafe', W, H, paintCafe)
    // Lamps and the cocoa urns glow; the urns steam.
    for (let r = 0; r < ROWS; r++) {
      const y = rowY(r)
      GAPS.forEach((x, i) => {
        const flicker = 0.04 * Math.sin(this.tick / 9 + r * 2 + i * 3)
        glow(g, x, y - 32, 16, RAMPS.gold[3], 0.42 + flicker)
      })
      glow(g, URN_X - 2, y - 14, 12, RAMPS.rust[3], 0.22)
      for (let i = 0; i < 3; i++) {
        const t = (this.tick / 2 + i * 9 + r * 5) % 27
        const sx =
          URN_X - 1 + Math.round(Math.sin((this.tick + i * 20) / 11) * 2)
        g.fillStyle = rgba('#ffffff', 0.5 * (1 - t / 27))
        g.fillRect(sx + i - 1, Math.round(y - 25 - t / 2), 2, 2)
      }
    }
  }

  private renderTip(g: CanvasRenderingContext2D, tip: Tip) {
    const y = rowY(tip.row) - 4
    glow(g, tip.x, y, 10, RAMPS.gold[3], 0.4 + 0.15 * Math.sin(this.tick / 5))
    shadedOrb(g, tip.x, y, 3, RAMPS.gold)
    g.fillStyle = RAMPS.gold[1]
    g.fillRect(Math.round(tip.x), Math.round(y) - 1, 1, 3)
    if ((this.tick + Math.round(tip.x)) % 40 < 8) {
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(tip.x) + 2, Math.round(y) - 6, 1, 3)
      g.fillRect(Math.round(tip.x) + 1, Math.round(y) - 5, 3, 1)
    }
  }

  /** How far a robot leans this tick: swaying in the Sing-along, shaking its head at a wrong drink. */
  private lean(robot: Robot): number {
    if (robot.state === 'refuse') return Math.floor(this.tick / 4) % 2 ? 1 : -1
    if (this.singing > 0 && robot.state === 'walk')
      return Math.round(Math.sin((this.tick + robot.phase) / 10) * 2)
    return 0
  }

  private renderRobot(g: CanvasRenderingContext2D, robot: Robot) {
    const y = rowY(robot.row)
    const look =
      ROBOT_LOOKS.get(robot.color) ?? ROBOT_LOOKS.get(ROBOT_COLORS[0]!)!
    const stepping =
      (robot.state === 'walk' &&
        this.singing === 0 &&
        (this.tick + robot.phase) % 60 < 40) ||
      robot.state === 'leave'
    const frame = stepping ? Math.floor((this.tick + robot.phase) / 8) % 2 : 0
    const x = Math.round(robot.x) + this.lean(robot)
    dropShadow(g, x, y + 1, 7, 1.5, 0.4)
    const sprite =
      robot.state === 'drink'
        ? look.drink
        : robot.state === 'pushed'
          ? look.hold
          : robot.state === 'leave' || this.singing > 0
            ? look.happy[frame]!
            : look.walk[frame]!
    const top = y - frame
    drawSprite(g, sprite, x, top, {
      anchor: 'feet',
      flipX: robot.state === 'leave',
    })
    // The antenna bulb: red while thirsty, gold while it is being served.
    const lit = robot.state === 'pushed' || robot.state === 'drink'
    const bulb = lit ? RAMPS.gold[3] : RAMPS.ember[2]
    const bx = robot.state === 'leave' ? x - 1 : x
    g.fillStyle = INK
    g.fillRect(bx - 2, top - 24, 5, 4)
    g.fillStyle = bulb
    g.fillRect(bx - 1, top - 23, 3, 2)
    g.fillStyle = '#ffffff'
    g.fillRect(bx - 1, top - 23, 1, 1)
    if (lit || Math.floor((this.tick + robot.phase) / 20) % 2)
      glow(g, bx, top - 22, 6, bulb, 0.5)
    const mug = TOPPED_MUGS[robot.order]
    if (robot.state === 'drink') {
      // Mug up to the visor and down again, sipping until it is empty.
      const sip = Math.floor(robot.timer / 14) % 2
      const full = robot.timer > PATRONS[robot.patron].drinkTicks / 3
      drawSprite(g, full ? mug : EMPTY_MUG, x + 10, y - 9 - sip * 3, {
        anchor: 'feet',
        flipX: true,
      })
      if (full) this.steam(g, x + 10, y - 16 - sip * 3, robot.phase)
    } else if (robot.state === 'pushed') {
      drawSprite(g, mug, x + 11, y - 5, { anchor: 'feet', flipX: true })
      this.steam(g, x + 11, y - 12, robot.phase)
    } else if (robot.state === 'leave') {
      const t = (this.tick + robot.phase) % 36
      if (t < 28)
        drawSprite(g, HEART_SPRITE, x + 4, y - 26 - Math.floor(t / 3), {
          anchor: 'feet',
          alpha: 1 - t / 28,
        })
    }
  }

  /** The order bubble over a robot that still wants a mug: big, colour-coded, the drink drawn in it. */
  private renderOrder(g: CanvasRenderingContext2D, robot: Robot) {
    if (robot.state !== 'walk' && robot.state !== 'refuse') return
    const topping = TOPPINGS[robot.order]
    const x = Math.round(robot.x) + this.lean(robot)
    const y = rowY(robot.row)
    const w = 16
    const h = 14
    const left = x - w / 2
    const top = y - 43
    // Close to the urn, the rim blinks red as a warning.
    const urgent =
      robot.state === 'walk' &&
      robot.x > REACH_X - 60 &&
      Math.floor(this.tick / 8) % 2 === 0
    g.fillStyle = INK
    g.fillRect(left - 1, top - 1, w + 2, h + 2)
    g.fillRect(x - 2, top + h, 4, 3)
    g.fillStyle = urgent ? RAMPS.ember[3] : topping.rim
    g.fillRect(left, top, w, h)
    g.fillRect(x - 1, top + h, 2, 2)
    g.fillStyle = RAMPS.cream[4]
    g.fillRect(left + 2, top + 2, w - 4, h - 4)
    drawSprite(g, TOPPED_MUGS[robot.order], x + 1, top + h - 2, {
      anchor: 'feet',
    })
    if (robot.state === 'refuse') {
      // A wrong drink: a red cross over the bubble while it shakes its head.
      g.fillStyle = RAMPS.ember[2]
      for (let i = 0; i < 6; i++) {
        g.fillRect(left + 5 + i, top + 4 + i, 1, 1)
        g.fillRect(left + 10 - i, top + 4 + i, 1, 1)
      }
    }
  }

  /** Warm stage light and floating notes while everyone sways. */
  private renderSingAlong(g: CanvasRenderingContext2D) {
    const fade = Math.min(1, this.singing / 30)
    for (let r = 0; r < ROWS; r++)
      glow(g, W / 2, rowY(r) - 20, 150, RAMPS.gold[3], 0.12 * fade)
    for (const robot of this.robots) {
      if (robot.state !== 'walk' && robot.state !== 'refuse') continue
      const t = (this.tick + robot.phase * 3) % 50
      drawSprite(
        g,
        NOTE_SPRITE,
        Math.round(robot.x) + 8 + Math.round(Math.sin(t / 6) * 2),
        rowY(robot.row) - 22 - Math.floor(t / 4),
        { anchor: 'feet', alpha: fade * (1 - t / 50) },
      )
    }
  }

  private renderSlidingMug(g: CanvasRenderingContext2D, mug: Mug) {
    const y = rowY(mug.row)
    const x = Math.round(mug.x)
    const toDoor = mug.full && !mug.back
    if (mug.back)
      // A handed-back mug glows on its way home: catch it.
      glow(
        g,
        x + 1,
        y - 4,
        9,
        RAMPS.ember[3],
        0.35 + 0.15 * Math.sin(this.tick / 3),
      )
    // Speed streaks trail behind a sliding mug.
    g.fillStyle = rgba(RAMPS.cream[4], 0.45)
    const behind = toDoor ? x + 6 : x - 10
    g.fillRect(behind, y - 5, 5, 1)
    g.fillRect(behind + (toDoor ? 2 : -1), y - 3, 4, 1)
    drawSprite(g, mug.full ? TOPPED_MUGS[mug.topping] : EMPTY_MUG, x + 1, y, {
      anchor: 'feet',
    })
    if (mug.full) this.steam(g, x, y - 7, mug.row * 31)
  }

  /** Two wisps of steam rising off a hot mug whose rim is at `top`. */
  private steam(
    g: CanvasRenderingContext2D,
    x: number,
    top: number,
    seed: number,
  ) {
    for (let i = 0; i < 2; i++) {
      const t = (this.tick + seed * 7 + i * 11) % 20
      const sx = Math.round(
        x - 1 + i * 2 + Math.sin((this.tick + i * 9 + seed) / 5),
      )
      g.fillStyle = rgba('#ffffff', 0.6 * (1 - t / 20))
      g.fillRect(sx, Math.round(top - 2 - t / 3), 1, 2)
    }
  }

  private renderBartender(g: CanvasRenderingContext2D) {
    const y = rowY(this.row)
    const x = Math.round(this.x)
    const moved = this.x - this.walkFrom
    const pour = this.pouring
    // Faces the door while it waits, its heading while it walks, the urn while it pours.
    const facingRight = !!pour || moved > 0
    const sprite = pour
      ? SERVER_SPRITES.pour
      : moved !== 0 && Math.floor(this.tick / 6) % 2
        ? SERVER_SPRITES.step
        : SERVER_SPRITES.stand
    dropShadow(g, x, y + 1, 7, 1.5, 0.4)
    drawSprite(g, sprite, x, y, { anchor: 'feet', flipX: !facingRight })
    if (!pour) return
    // Cocoa runs from the urn's spout into the mug beneath it.
    g.fillStyle = RAMPS.earth[2]
    g.fillRect(URN_X - 7, y - 8, 1, 2)
    const holding = !pour.released && pour.ticks >= pour.base
    const mug = pour.swirl
      ? SWIRL_MUG
      : pour.ticks < pour.base / 2
        ? EMPTY_MUG
        : FULL_MUG
    drawSprite(g, mug, URN_X - 5, y, { anchor: 'feet' })
    glow(g, URN_X - 7, y - 6, 6, RAMPS.gold[3], 0.35)
    if (holding && !pour.swirl) {
      // Holding A heaps marshmallows on: a gauge fills over the mug.
      const fill = Math.min(1, (pour.ticks - pour.base) / TOPPING_TICKS)
      g.fillStyle = INK
      g.fillRect(URN_X - 12, y - 20, 14, 4)
      g.fillStyle = RAMPS.cream[1]
      g.fillRect(URN_X - 11, y - 19, 12, 2)
      g.fillStyle = TOPPINGS.marshmallow.rim
      g.fillRect(URN_X - 11, y - 19, Math.round(12 * fill), 2)
      for (let i = 0; i < Math.floor(fill * 3); i++) {
        g.fillStyle = '#ffffff'
        g.fillRect(URN_X - 8 + i * 3, y - 9, 2, 2)
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 3, 3, 84, 20, RAMPS.earth)
    drawText(g, String(this.score).padStart(6, '0'), 9, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const waiting = this.toSpawn + this.robots.length
    hudPanel(g, 90, 3, 70, 20, RAMPS.earth)
    drawText(g, `THIRSTY ${waiting}`, 95, 5, {
      color: RAMPS.cream[3],
      outline: INK,
    })
    drawText(g, `MOPS ${this.mops}`, 95, 14, {
      color: this.mops > 0 ? RAMPS.teal[3] : RAMPS.ember[3],
      outline: INK,
    })
    // Spare mug-bots.
    const spares = this.lives - 1
    if (spares > 0) {
      drawSprite(g, FULL_MUG, 138, 21, { anchor: 'feet' })
      drawText(g, `X${spares}`, 145, 14, {
        color: RAMPS.cream[3],
        outline: INK,
      })
    }
    this.renderCozyPanel(g, 163, 3)
    hudPanel(g, W - 86, 3, 83, 20, RAMPS.earth)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 8, 5, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `ROUND ${this.level}`, W - 8, 14, {
      align: 'right',
      color: RAMPS.rust[4],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 96, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.ember[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 116, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      if (this.banner.note)
        drawText(g, this.banner.note, W / 2, 128, {
          align: 'center',
          color: RAMPS.cream[4],
          outline: INK,
        })
    }
  }

  /** The Cozy meter, the Rush combo and the Cafe Fund. */
  private renderCozyPanel(g: CanvasRenderingContext2D, px: number, py: number) {
    hudPanel(g, px, py, 68, 20, RAMPS.earth)
    const full = this.cozy >= COZY.max
    const blink = Math.floor(this.tick / 10) % 2 === 0
    drawText(g, 'COZY', px + 5, py + 2, {
      color: full && blink ? '#ffffff' : RAMPS.pink[3],
      outline: INK,
    })
    const barX = px + 31
    const barW = 32
    const fill =
      this.singing > 0 ? this.singing / COZY.singTicks : this.cozy / COZY.max
    g.fillStyle = INK
    g.fillRect(barX - 1, py + 2, barW + 2, 7)
    g.fillStyle = RAMPS.night[2]
    g.fillRect(barX, py + 3, barW, 5)
    g.fillStyle =
      this.singing > 0
        ? RAMPS.gold[3]
        : full && blink
          ? '#ffffff'
          : RAMPS.pink[3]
    g.fillRect(barX, py + 3, Math.round(barW * fill), 5)
    g.fillStyle = rgba('#ffffff', 0.35)
    g.fillRect(barX, py + 3, Math.round(barW * fill), 1)
    if (full && this.singing === 0) {
      if (blink)
        drawText(g, 'B: SING!', px + 34, py + 11, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      return
    }
    const mult = this.multiplier()
    drawText(g, `X${mult}`, px + 5, py + 11, {
      color: mult > 1 ? RAMPS.gold[3] : RAMPS.cream[2],
      outline: INK,
    })
    // Pips toward the next Rush step.
    const pips =
      mult >= RUSH_COMBO.max ? RUSH_COMBO.step : this.streak % RUSH_COMBO.step
    for (let i = 0; i < RUSH_COMBO.step; i++) {
      g.fillStyle = INK
      g.fillRect(px + 19 + i * 4, py + 12, 3, 5)
      g.fillStyle = i < pips ? RAMPS.gold[3] : RAMPS.night[2]
      g.fillRect(px + 19 + i * 4, py + 13, 2, 3)
    }
    shadedOrb(g, px + 41, py + 14, 3, RAMPS.gold)
    drawText(g, String(Math.min(this.fund, 999)), px + 46, py + 11, {
      color: RAMPS.gold[4],
      outline: INK,
    })
  }
}

// --- static layers -------------------------------------------------------------

/** One counter's slice of the night outside: banded sky, a moonlit ridge, snow and pines. */
function paintNight(k: CanvasRenderingContext2D, r: number) {
  const y = rowY(r)
  const top = y - 40
  bandedGradient(
    k,
    0,
    top,
    W,
    44,
    [
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.night[2],
      RAMPS.purple[1],
      RAMPS.sky[1],
    ],
    2,
  )
  if (r === 0) {
    glow(k, 140, y - 29, 12, RAMPS.cream[3], 0.35)
    shadedOrb(k, 140, y - 29, 4, RAMPS.cream, { outline: null })
  }
  drawRidge(k, ridge(90 + r, W, 6, 3), {
    base: y - 21,
    bottom: y + 4,
    width: W,
    step: 3,
    fill: mix(RAMPS.night[3], RAMPS.steel[1], 0.4),
    rim: mix(RAMPS.steel[3], RAMPS.purple[3], 0.5),
  })
  drawRidge(k, ridge(140 + r, W, 3, 4), {
    base: y - 18,
    bottom: y + 4,
    width: W,
    fill: SNOW,
    rim: '#ffffff',
  })
  // The snowfield falls away into the dark below the horizon.
  bandedGradient(
    k,
    0,
    y - 15,
    W,
    19,
    [SNOW, mix(SNOW, RAMPS.night[2], 0.5), RAMPS.night[2]],
    2,
  )
  const rand = backdropRng(170 + r)
  for (const o of OPENINGS) {
    const pines = o.w > DOOR_W ? 2 : 1
    for (let i = 0; i < pines; i++) {
      const px = o.x + 3 + Math.floor(rand() * (o.w - 6))
      drawSprite(k, PINE_SPRITE, px, y - 18 + Math.floor(rand() * 2), {
        anchor: 'feet',
      })
    }
  }
}

/** The cafe itself, painted once with the windows and doors left open onto the night. */
function paintCafe(k: CanvasRenderingContext2D) {
  // The ceiling beam behind the HUD.
  bandedGradient(
    k,
    0,
    0,
    W,
    HUD_H,
    [WOOD_DARK[2], WOOD_DARK[1], WOOD_DARK[0]],
    3,
  )
  k.fillStyle = WOOD_DARK[3]
  k.fillRect(0, 0, W, 1)
  for (let r = 0; r < ROWS; r++) paintWall(k, r)
  for (let r = 0; r < ROWS; r++) paintCounter(k, r)
  // A strip of checked floor under the last counter.
  const floor = rowY(ROWS - 1) + 13
  for (let x = 0; x < W; x += 8) {
    for (let y = floor; y < H; y += 4) {
      k.fillStyle = ((x + y) / 4) % 2 ? WOOD_DARK[1] : WOOD_DARK[2]
      k.fillRect(x, y, 8, 4)
    }
  }
  for (let r = 0; r < ROWS; r++) {
    k.fillStyle = rgba(INK, 0.55)
    k.fillRect(0, rowY(r) + 13, W, 2)
  }
}

function paintWall(k: CanvasRenderingContext2D, r: number) {
  const y = rowY(r)
  const top = y - 40
  const rand = backdropRng(200 + r)
  // Striped wallpaper in HDMA bands: shadowed under the counter above, lamplit in the middle.
  for (let x = 0; x < W; x += 8) {
    const lit = (x / 8) % 2 === 0
    bandedGradient(
      k,
      x,
      top,
      8,
      40,
      lit
        ? [WALL[0], WALL[2], WALL[3], WALL[2], WALL[1]]
        : [WALL[0], WALL[1], WALL[2], WALL[1], WALL[0]],
      2,
    )
    if (lit) {
      k.fillStyle = rgba(RAMPS.gold[3], 0.22)
      for (let dy = 6; dy < 28; dy += 9) {
        k.fillRect(x + 3, top + dy, 2, 1)
        k.fillRect(x + 2, top + dy + 1, 4, 1)
        k.fillRect(x + 3, top + dy + 2, 2, 1)
      }
    }
  }
  // Warm pools of lamplight on the wall under each lamp.
  for (const lx of GAPS) glow(k, lx, y - 26, 24, RAMPS.gold[2], 0.22)
  // Wainscot planks and a chair rail.
  bandedGradient(k, 0, y - 11, W, 11, [WOOD_DARK[1], WOOD_DARK[2]], 2)
  for (let x = 4; x < W; x += 10) {
    k.fillStyle = WOOD_DARK[0]
    k.fillRect(x, y - 11, 1, 11)
    k.fillStyle = rgba(WOOD_DARK[3], 0.5)
    k.fillRect(x + 1, y - 11, 1, 11)
  }
  k.fillStyle = INK
  k.fillRect(0, y - 14, W, 1)
  k.fillStyle = WOOD[3]
  k.fillRect(0, y - 13, W, 1)
  k.fillStyle = WOOD[1]
  k.fillRect(0, y - 12, W, 1)
  // Windows onto the snow: a bevelled frame, a cleared pane, muntins, frost and a sill.
  for (const wx of WINDOWS_X) {
    const wy = y + WIN_TOP
    glow(k, wx + WIN_W / 2, wy + WIN_H / 2, 26, RAMPS.sky[2], 0.18)
    bevel(k, wx - 3, wy - 3, WIN_W + 6, WIN_H + 6, WOOD)
    k.clearRect(wx, wy, WIN_W, WIN_H)
    k.fillStyle = WOOD[2]
    k.fillRect(wx + WIN_W / 2 - 1, wy, 2, WIN_H)
    k.fillRect(wx, wy + 8, WIN_W, 1)
    k.fillStyle = WOOD[3]
    k.fillRect(wx + WIN_W / 2 - 1, wy, 1, WIN_H)
    k.fillStyle = rgba('#ffffff', 0.55)
    for (const [fx, flip] of [
      [wx, 1],
      [wx + WIN_W - 1, -1],
    ] as const) {
      k.fillRect(fx + (flip < 0 ? -2 : 0), wy + WIN_H - 1, 3, 1)
      k.fillRect(fx + (flip < 0 ? -1 : 0), wy + WIN_H - 2, 2, 1)
      k.fillRect(fx, wy + WIN_H - 3, 1, 1)
    }
    bevel(k, wx - 5, wy + WIN_H + 2, WIN_W + 10, 3, WOOD, { depth: 1 })
  }
  // The doorway the robots walk in from, warm light catching its post.
  bevel(k, 0, y + DOOR_TOP - 3, DOOR_W + 4, 3, WOOD, { depth: 1 })
  k.clearRect(0, y + DOOR_TOP, DOOR_W, -DOOR_TOP)
  bevel(k, DOOR_W, y + DOOR_TOP, 3, -DOOR_TOP, WOOD, { depth: 1 })
  k.fillStyle = RAMPS.gold[3]
  k.fillRect(DOOR_W + 1, y + DOOR_TOP + 1, 1, -DOOR_TOP - 2)
  // Lamps over little shelves of cafe things.
  GAPS.forEach((lx, i) => {
    k.fillStyle = INK
    k.fillRect(lx, top, 1, 3)
    drawSprite(k, LAMP_SPRITE, lx - 5, top + 3, { anchor: 'topleft' })
    if (r === 1 && i === 1) {
      // A chalkboard menu.
      bevel(k, lx - 17, y - 32, 36, 13, WOOD, { depth: 1 })
      k.fillStyle = mix(RAMPS.leaf[0], RAMPS.night[1], 0.5)
      k.fillRect(lx - 15, y - 30, 32, 9)
      drawText(k, 'COCOA', lx + 1, y - 29, {
        align: 'center',
        color: RAMPS.cream[3],
      })
      return
    }
    bevel(k, lx - 15, y - 22, 32, 3, WOOD, { depth: 1 })
    const first = Math.floor(rand() * SHELF_ITEMS.length)
    for (let j = 0; j < 3; j++) {
      const item = SHELF_ITEMS[(first + j) % SHELF_ITEMS.length]!
      drawSprite(k, item, lx - 9 + j * 10, y - 22, { anchor: 'feet' })
    }
  })
}

function paintCounter(k: CanvasRenderingContext2D, r: number) {
  const y = rowY(r)
  const left = DOOR_W
  const right = TAP_X + 15
  const w = right - left
  const rand = backdropRng(260 + r)
  // The top: ink edge, a lit back lip, grained boards and a shadowed front edge.
  k.fillStyle = INK
  k.fillRect(left - 1, y - 1, w + 2, 14)
  k.fillStyle = WOOD[4]
  k.fillRect(left, y, w, 1)
  k.fillStyle = WOOD[3]
  k.fillRect(left, y + 1, w, 2)
  k.fillStyle = WOOD[2]
  k.fillRect(left, y + 3, w, 1)
  for (let i = 0; i < 30; i++) {
    k.fillStyle = rand() < 0.5 ? WOOD[2] : WOOD[4]
    k.fillRect(
      left + Math.floor(rand() * (w - 8)),
      y + 1 + Math.floor(rand() * 2),
      3 + Math.floor(rand() * 6),
      1,
    )
  }
  // The front: bevelled panels with grain, over a brass foot rail.
  k.fillStyle = WOOD_DARK[0]
  k.fillRect(left, y + 5, w, 6)
  for (let x = left; x < right - 4; x += 24) {
    const pw = Math.min(22, right - x - 2)
    bevel(k, x + 1, y + 5, pw, 6, WOOD_DARK, { depth: 1, outline: null })
    k.fillStyle = WOOD_DARK[1]
    k.fillRect(x + 4 + Math.floor(rand() * 6), y + 7, 8, 1)
  }
  k.fillStyle = RAMPS.gold[1]
  k.fillRect(left, y + 11, w, 1)
  k.fillStyle = RAMPS.gold[3]
  for (let x = left + 6; x < right; x += 24) k.fillRect(x, y + 11, 3, 1)
  // The urn's stand, and the urn.
  bevel(k, right + 2, y, W - right - 2, 12, WOOD_DARK, { depth: 1 })
  bevel(k, right + 3, y, W - right - 4, 2, RAMPS.steel, {
    depth: 1,
    outline: null,
  })
  drawSprite(k, URN_SPRITE, URN_X, y, { anchor: 'feet' })
}

/** The table guide: orders, the Cozy meter and the Endless Shift. */
export function cocoaGuide(): ArcadeGuidePage[] {
  return [
    {
      title: 'READ THE BUBBLE',
      scale: 1,
      lines: [
        'EVERY ROBOT SHOWS WHAT IT WANTS IN A BUBBLE.',
        ...TOPPING_ORDER.map((t) => `${TOPPINGS[t].name}: ${TOPPINGS[t].pour}`),
        'THE WRONG DRINK IS HANDED BACK FULL: CATCH IT!',
        'CATCH EVERY EMPTY. NO ROBOT MAY REACH THE URN.',
        'THE MOP-BOT MOPS TWO SPILLS PER MUG-BOT.',
      ],
    },
    {
      title: 'THE COZY METER',
      scale: 1,
      lines: [
        'RIGHT DRINKS, CAUGHT EMPTIES AND TIPS FILL IT.',
        'A CLEAN ROUND OF RIGHT DRINKS FILLS IT RIGHT UP.',
        'FULL? PRESS B FOR THE SING-ALONG: EVERYONE',
        'STOPS TO SWAY FOR 5 SECONDS. PICK YOUR MOMENT.',
        'TIPS ALSO PAY INTO THE CAFE FUND. GRAB THEM FAST.',
      ],
    },
    {
      title: 'RUSH AND JUGGLE',
      scale: 1,
      lines: [
        `EVERY ${RUSH_COMBO.step} CLEAN SERVES RAISE THE RUSH: X1 TO X${RUSH_COMBO.max}.`,
        'IT MULTIPLIES SERVES, DOOR BONUSES AND JUGGLES.',
        'A WRONG DRINK, A SPILL OR A LOST MUG ENDS IT.',
        'CATCH AN EMPTY AS A POUR GOES OUT: JUGGLE!',
        `EXTRA MUG-BOTS AT ${EXTRA_MUG_BOTS.map((s) => `${s / 1000}K`).join(', ')}.`,
      ],
    },
    {
      title: 'ENDLESS SHIFT',
      scale: 1,
      lines: [
        'SOMETHING NEW JOINS THE SHIFT EVERY ROUND:',
        ...ENDLESS_LADDER.map((u, i) => `ROUND ${i + 1}: ${u.banner}`),
        `FROM ROUND ${RUSH_AFTER + 1} THE RUSH NEVER STOPS CLIMBING:`,
        'MORE ROBOTS, QUICKER FEET, FANCIER ORDERS,',
        'CLOSER ARRIVALS AND FASTER EMPTIES, IN TURN.',
      ],
    },
  ]
}

const cocoaCounter: ArcadeGameModule = {
  create: (options) => new CocoaCounter(options),
  guide: () => cocoaGuide(),
}

export const create = cocoaCounter.create
export default cocoaCounter
