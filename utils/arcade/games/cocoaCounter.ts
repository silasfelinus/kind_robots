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
const POUR_TICKS = 10
const DRINK_TICKS = 70
const CATCH_RANGE = 7
const REACH_X = TAP_X - 14
const TIP_CHANCE = 0.22
const TIP_LIFE = 360
const START_LIVES = 3
/** Spills the mop-bot cleans up for free, per life. */
const MOPS = 2
const LOSE_TICKS = 110
const CLEAR_TICKS = 130

const SERVE_POINTS = 50
const DOOR_POINTS = 100
const EMPTY_POINTS = 100
const TIP_POINTS = 250
const ROUND_BONUS = 500

export const COCOA_CURVES = {
  /** Robots to serve in the round. */
  robots: { start: 6, step: 2, limit: 26 },
  /** How fast a robot shuffles while it is stepping. */
  walk: { start: 0.42, step: 0.05, limit: 0.95 },
  /** Ticks between robots walking in. */
  gap: { start: 150, step: -12, limit: 48 },
  /** How far a caught mug nudges a robot back. */
  push: { start: 84, step: -5, limit: 44 },
  /** Empty-mug slide speed. */
  empty: { start: 0.8, step: 0.08, limit: 1.5 },
  /** Chance a robot is still thirsty after a mug (it comes back for more). */
  thirst: { start: 0.25, step: 0.08, limit: 0.7 },
} as const

type RobotState = 'walk' | 'pushed' | 'drink' | 'leave'
type Robot = {
  row: number
  x: number
  state: RobotState
  timer: number
  phase: number
  color: string
  thirsty: boolean
}
type Mug = { row: number; x: number; full: boolean }
type Tip = { row: number; x: number; life: number }
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
}
const MUG_BODY = ['hWWWws..', 'hRRRrsHH', 'hWWWws.H', 'hWWWwsHH', '.ssss...']
const FULL_MUG = pixelSprite(['cCFFCc..', ...MUG_BODY], MUG_PALETTE)
const EMPTY_MUG = pixelSprite(['seeees..', ...MUG_BODY], MUG_PALETTE)

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
  private pour = 0
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
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
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
    this.toSpawn = Math.round(levelCurve(round, COCOA_CURVES.robots))
    this.spawnTimer = 30
    this.greet = true
    this.robots = []
    this.mugs = []
    this.tips = []
    this.row = 0
    this.x = TAP_X
    this.banner = {
      text: `ROUND ${round}`,
      sub: `${this.toSpawn} THIRSTY ROBOTS`,
      ticks: 100,
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
    if (this.pour > 0) {
      if (--this.pour === 0) {
        this.mugs.push({ row: this.row, x: TAP_X - 8, full: true })
        this.sound.play('shoot')
      }
      return
    }
    if (up || down) {
      this.row = (this.row + (up ? ROWS - 1 : 1)) % ROWS
      this.x = TAP_X
      this.sound.play('blip')
      return
    }
    if (input.held.left) this.x = Math.max(DOOR_X + 14, this.x - WALK_SPEED)
    if (input.held.right) this.x = Math.min(TAP_X, this.x + WALK_SPEED)
    if (input.pressed.a) {
      if (this.x >= TAP_X - 1) this.pour = POUR_TICKS
      else {
        // Away from the urn, A runs straight back to it.
        this.x = TAP_X
      }
    }
  }

  private spawn() {
    if (this.toSpawn <= 0 || --this.spawnTimer > 0) return
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
    this.robots.push({
      row,
      x: DOOR_X - 2,
      state: 'walk',
      timer: 0,
      phase: Math.floor(this.rng() * 60),
      color: ROBOT_COLORS[Math.floor(this.rng() * ROBOT_COLORS.length)]!,
      thirsty: false,
    })
    this.toSpawn--
    const gap = levelCurve(this.level, COCOA_CURVES.gap)
    this.spawnTimer = Math.round(gap * (0.7 + this.rng() * 0.6))
  }

  private updateRobots() {
    const walk = levelCurve(this.level, COCOA_CURVES.walk)
    for (const robot of this.robots) {
      if (robot.state === 'walk') {
        // Shuffle: step for two thirds of every second, pause for the rest.
        if ((this.tick + robot.phase) % 60 < 40) robot.x += walk
        if (robot.x >= REACH_X) {
          this.loseMug('A ROBOT REACHED THE URN', robot.x, rowY(robot.row))
          return
        }
      } else if (robot.state === 'pushed') {
        robot.x -= PUSH_SPEED
        robot.timer -= PUSH_SPEED
        if (robot.x < DOOR_X) {
          robot.timer = -1
          this.addScore(DOOR_POINTS, DOOR_X + 12, rowY(robot.row) - 26)
          this.burst(DOOR_X + 4, rowY(robot.row) - 10, 8, robot.color)
          this.fx.burst(DOOR_X + 4, rowY(robot.row) - 14, this.fxRng, {
            count: 10,
          })
          this.sound.play('pickup')
        } else if (robot.timer <= 0) {
          robot.state = 'drink'
          robot.timer = DRINK_TICKS
        }
      } else if (robot.state === 'leave') {
        robot.x -= LEAVE_SPEED
      } else if (--robot.timer <= 0) {
        // Done drinking: the empty slides back. A robot that is still thirsty
        // shuffles on; a cosy one strolls home.
        this.mugs.push({ row: robot.row, x: robot.x + 6, full: false })
        robot.state = robot.thirsty ? 'walk' : 'leave'
        if (!robot.thirsty)
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
    const empty = levelCurve(this.level, COCOA_CURVES.empty)
    const thirst = levelCurve(this.level, COCOA_CURVES.thirst)
    for (const mug of this.mugs) {
      if (mug.full) {
        mug.x -= MUG_SPEED
        const robot = this.robots.find(
          (r) =>
            r.row === mug.row &&
            r.state === 'walk' &&
            Math.abs(r.x - mug.x) <= CATCH_RANGE,
        )
        if (robot) {
          mug.x = -999
          robot.state = 'pushed'
          robot.timer = levelCurve(this.level, COCOA_CURVES.push)
          robot.thirsty = this.rng() < thirst
          this.addScore(SERVE_POINTS, robot.x, rowY(robot.row) - 28)
          this.fx.burst(robot.x + 6, rowY(robot.row) - 10, this.fxRng, {
            count: 4,
            speed: 1,
          })
          this.sound.play('pop')
          if (this.rng() < TIP_CHANCE)
            this.tips.push({ row: robot.row, x: robot.x, life: TIP_LIFE })
        } else if (mug.x < DOOR_X - 4) {
          if (this.mops > 0) {
            this.mopUp(mug)
            continue
          }
          this.loseMug('A MUG SLID OFF THE END', DOOR_X, rowY(mug.row))
          return
        }
      } else {
        mug.x += empty
        if (mug.row === this.row && Math.abs(mug.x - this.x) <= CATCH_RANGE) {
          mug.x = -999
          this.addScore(EMPTY_POINTS, this.x, rowY(this.row) + 4)
          this.fx.burst(this.x, rowY(this.row) - 6, this.fxRng, {
            count: 4,
            speed: 0.9,
            colours: [RAMPS.teal[3], RAMPS.cream[4]],
          })
          this.sound.play('blip')
        } else if (mug.x >= TAP_X + 10) {
          this.loseMug('AN EMPTY MUG FELL', TAP_X + 10, rowY(mug.row))
          return
        }
      }
    }
    this.mugs = this.mugs.filter((m) => m.x > -999)
  }

  private updateTips() {
    for (const tip of this.tips) {
      tip.life--
      if (tip.row === this.row && Math.abs(tip.x - this.x) <= CATCH_RANGE) {
        tip.life = 0
        this.addScore(TIP_POINTS, tip.x, rowY(tip.row) - 14)
        this.burst(tip.x, rowY(tip.row) - 2, 8, '#fde047')
        this.fx.burst(tip.x, rowY(tip.row) - 4, this.fxRng, {
          count: 12,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
        this.sound.play('extra')
      }
    }
    this.tips = this.tips.filter((t) => t.life > 0)
  }

  /** A free spill: the mop-bot by the door cleans it up. */
  private mopUp(mug: Mug) {
    this.mops--
    mug.x = -999
    this.burst(DOOR_X, rowY(mug.row) - 4, 10, '#7c2d12')
    this.sound.play('warn')
    this.banner = {
      text: 'SPLASH!',
      sub: this.mops > 0 ? 'THE MOP-BOT CAN MOP 1 MORE' : 'NO MORE MOPS!',
      ticks: 60,
    }
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
    this.sound.play('level')
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `EVERYONE IS COSY  +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  private loseMug(why: string, x: number, y: number) {
    if (this.lose > 0) return
    this.lives--
    this.lose = LOSE_TICKS
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
    this.pour = 0
    this.mops = MOPS
    this.greet = true
    this.spawnTimer = 30
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50 })
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
    if (this.pour > 0) return frame
    const empty = levelCurve(this.level, COCOA_CURVES.empty)
    let target = -1
    let soonest = Infinity
    for (const mug of this.mugs) {
      if (mug.full) continue
      const eta = (TAP_X - mug.x) / empty
      const hop = this.hopsTo(mug.row) * 2 + 8
      if (eta < hop + 12 && eta < soonest) {
        soonest = eta
        target = mug.row
      }
    }
    if (target < 0) {
      let urgent = -Infinity
      for (let r = 0; r < ROWS; r++) {
        const walking = this.robots.filter(
          (b) => b.row === r && b.state === 'walk',
        )
        const coming = this.mugs.filter((m) => m.row === r && m.full).length
        if (walking.length <= coming) continue
        const lead = Math.max(...walking.map((b) => b.x))
        if (lead > urgent) {
          urgent = lead
          target = r
        }
      }
    }
    if (target < 0) {
      // Nothing to do: pick up a tip on this counter if one is handy.
      const tip = this.tips.find((t) => t.row === this.row)
      if (tip && !this.mugs.some((m) => !m.full)) {
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
      (m) => !m.full && m.row === this.row && TAP_X - m.x < 40,
    )
    if (!waitingEmpty) {
      const walking = this.robots.filter(
        (b) => b.row === this.row && b.state === 'walk',
      ).length
      const coming = this.mugs.filter(
        (m) => m.row === this.row && m.full,
      ).length
      if (walking > coming) {
        held.a = true
        frame.pressed.a = true
      }
    }
    return frame
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
    for (const tip of this.tips) {
      if (tip.life < 90 && Math.floor(tip.life / 6) % 2) continue
      this.renderTip(g, tip)
    }
    for (const robot of this.robots) this.renderRobot(g, robot)
    for (const mug of this.mugs) this.renderSlidingMug(g, mug)
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

  private renderRobot(g: CanvasRenderingContext2D, robot: Robot) {
    const y = rowY(robot.row)
    const look =
      ROBOT_LOOKS.get(robot.color) ?? ROBOT_LOOKS.get(ROBOT_COLORS[0]!)!
    const stepping =
      (robot.state === 'walk' && (this.tick + robot.phase) % 60 < 40) ||
      robot.state === 'leave'
    const frame = stepping ? Math.floor((this.tick + robot.phase) / 8) % 2 : 0
    const x = Math.round(robot.x)
    dropShadow(g, x, y + 1, 7, 1.5, 0.4)
    const sprite =
      robot.state === 'drink'
        ? look.drink
        : robot.state === 'pushed'
          ? look.hold
          : robot.state === 'leave'
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
    if (robot.state === 'drink') {
      // Mug up to the visor and down again, sipping until it is empty.
      const sip = Math.floor(robot.timer / 14) % 2
      const full = robot.timer > DRINK_TICKS / 3
      drawSprite(g, full ? FULL_MUG : EMPTY_MUG, x + 10, y - 9 - sip * 3, {
        anchor: 'feet',
        flipX: true,
      })
      if (full) this.steam(g, x + 10, y - 16 - sip * 3, robot.phase)
    } else if (robot.state === 'pushed') {
      drawSprite(g, FULL_MUG, x + 11, y - 5, { anchor: 'feet', flipX: true })
      this.steam(g, x + 11, y - 12, robot.phase)
    } else if (robot.state === 'leave') {
      const t = (this.tick + robot.phase) % 36
      if (t < 28)
        drawSprite(g, HEART_SPRITE, x + 4, y - 26 - Math.floor(t / 3), {
          anchor: 'feet',
          alpha: 1 - t / 28,
        })
    } else if (robot.x > REACH_X - 60 && Math.floor(this.tick / 10) % 2) {
      // A little thirsty grumble mark.
      drawText(g, '!', x + 8, y - 28, { color: RAMPS.ember[3], outline: INK })
    }
  }

  private renderSlidingMug(g: CanvasRenderingContext2D, mug: Mug) {
    const y = rowY(mug.row)
    const x = Math.round(mug.x)
    // Speed streaks trail behind a sliding mug.
    g.fillStyle = rgba(RAMPS.cream[4], 0.45)
    const behind = mug.full ? x + 6 : x - 10
    g.fillRect(behind, y - 5, 5, 1)
    g.fillRect(behind + (mug.full ? 2 : -1), y - 3, 4, 1)
    drawSprite(g, mug.full ? FULL_MUG : EMPTY_MUG, x + 1, y, { anchor: 'feet' })
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
    const pouring = this.pour > 0
    // Faces the door while it waits, its heading while it walks, the urn while it pours.
    const facingRight = pouring || moved > 0
    const sprite = pouring
      ? SERVER_SPRITES.pour
      : moved !== 0 && Math.floor(this.tick / 6) % 2
        ? SERVER_SPRITES.step
        : SERVER_SPRITES.stand
    dropShadow(g, x, y + 1, 7, 1.5, 0.4)
    drawSprite(g, sprite, x, y, { anchor: 'feet', flipX: !facingRight })
    if (pouring) {
      // Cocoa runs from the urn's spout into the mug beneath it.
      g.fillStyle = RAMPS.earth[2]
      g.fillRect(URN_X - 7, y - 8, 1, 2)
      const full = this.pour < POUR_TICKS / 2
      drawSprite(g, full ? FULL_MUG : EMPTY_MUG, URN_X - 5, y, {
        anchor: 'feet',
      })
      glow(g, URN_X - 7, y - 6, 6, RAMPS.gold[3], 0.35)
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
    hudPanel(g, 92, 3, 74, 20, RAMPS.earth)
    drawText(g, `THIRSTY ${waiting}`, 97, 5, {
      color: RAMPS.cream[3],
      outline: INK,
    })
    drawText(g, `MOPS ${this.mops}`, 97, 14, {
      color: this.mops > 0 ? RAMPS.teal[3] : RAMPS.ember[3],
      outline: INK,
    })
    // Spare mug-bots.
    const spares = Math.min(this.lives - 1, 4)
    if (spares > 0) {
      hudPanel(g, 171, 3, spares * 11 + 6, 20, RAMPS.earth)
      for (let i = 0; i < spares; i++)
        drawSprite(g, FULL_MUG, 178 + i * 11, 19, { anchor: 'feet' })
    }
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
    }
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

const cocoaCounter: ArcadeGameModule = {
  create: (options) => new CocoaCounter(options),
}

export const create = cocoaCounter.create
export default cocoaCounter
