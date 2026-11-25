import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeAudioSettings,
  ArcadeStagePointer,
  InputFrame,
} from '../types'
import {
  COLS,
  ROWS,
  emptyBoard,
  COLORS,
  CHAPTER_RULES,
  activeHues,
  chapterIndex,
  pressureAfterShot,
  pressureLimit,
  specialForStage,
  attachAndPop,
  fireSpecial,
  center,
  chooseHue,
  makeBoard,
  nearestSnap,
  pushCeiling,
} from '../superkateSpectrum/board'
import type { Board, Hue, SpectrumPower } from '../superkateSpectrum/board'
import {
  SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
  SPECTRUM_THEMES,
} from '../superkateSpectrum/music'
import type { MusicLoop } from '../sound'
import { spectrumRankedBoard } from '../leaderboard'
import { loadedImage } from '../ghostTrail/bake'
import {
  rankForXp,
  recordClassicEnd,
  recordClear,
  recordPop,
  readSpectrumSave,
  unlockedStyles,
} from '../superkateSpectrum/progress'
import {
  CHAPTER_VOICES,
  STORY_DECISIONS,
  STORY_ENDINGS,
  endingForStory,
  freshStoryChoices,
  pendingStoryDecision,
} from '../superkateSpectrum/story'
import type { StoryChoices, StoryEnding } from '../superkateSpectrum/story'
import type {
  BubbleStyle,
  SpectrumCareer,
  SpectrumMode,
  SpectrumSave,
  SpectrumSettings,
} from '../superkateSpectrum/progress'

const W = 320
const H = 480
const SHOT_Y = 438
const SHOT_SPEED = 7

export function storyMapPosition(stage: number) {
  const chapter = Math.floor((stage - 1) / 5)
  const index = (stage - 1) % 5
  return {
    x: 48 + 56 * (chapter % 2 ? 4 - index : index),
    y: 82 + chapter * 48,
  }
}
const PALETTE: Record<Hue, string> = {
  pink: '#ff62ad',
  teal: '#23e5cf',
  gold: '#ffd15b',
  violet: '#ad7dff',
  blue: '#64b9ff',
  lime: '#a6ed63',
}
const CHAPTERS = [
  {
    name: 'THE RAINBOW SALON',
    problem: 'THE COLOR ENGINE HAS LOST ITS SPARK.',
    kate: 'NO ONE LEAVES HERE FEELING GREY.',
    finale: 'THE SALON IS SINGING AGAIN.',
  },
  {
    name: 'THE BOTANIC DOME',
    problem: 'THE GARDEN BOTS HAVE FORGOTTEN SPRING.',
    kate: 'LET THE ROOTS CHOOSE THEIR OWN COLORS.',
    finale: 'THE GARDEN GROWS A NEW PALETTE.',
  },
  {
    name: 'THE NIGHT MARKET',
    problem: 'THE GLITCH HAS STOLEN THE FESTIVAL LIGHTS.',
    kate: 'THERE IS ROOM FOR EVERY SHADE.',
    finale: 'THE MARKET LIGHTS UP TOGETHER.',
  },
  {
    name: 'THE CLOUD LIBRARY',
    problem: 'THE MEMORY ARCHIVE IS FADING.',
    kate: 'WE ARE MORE THAN ONE PERFECT VERSION.',
    finale: 'THE STORIES FIND THEIR COLORS.',
  },
  {
    name: 'THE PRISM WORKSHOP',
    problem: 'THE SORTER IS ERASING IMPERFECTIONS.',
    kate: 'A LITTLE CHAOS MAKES GREAT ART.',
    finale: 'THE SORTER LEARNS TO EXPERIMENT.',
  },
  {
    name: 'THE HEART OF THE HUE',
    problem: 'THE PALETTE KEEPER WANTS ONE COLOR.',
    kate: 'KINDNESS IS NOT ONE-SIZE-FITS-ALL.',
    finale: 'THE CITY CHOOSES EVERY COLOR.',
  },
] as const

export const ATELIER_PUZZLES: readonly {
  title: string
  pairs: readonly { col: number; hue: Hue }[]
  shots: readonly Hue[]
}[] = [
  {
    title: 'FIRST BLUSH',
    pairs: [{ col: 4, hue: 'pink' }],
    shots: ['pink'],
  },
  {
    title: 'GOLDEN DUET',
    pairs: [
      { col: 1, hue: 'teal' },
      { col: 7, hue: 'gold' },
    ],
    shots: ['teal', 'gold'],
  },
  {
    title: 'MIDNIGHT TRIO',
    pairs: [
      { col: 0, hue: 'blue' },
      { col: 4, hue: 'violet' },
      { col: 8, hue: 'pink' },
    ],
    shots: ['violet', 'blue', 'pink'],
  },
  {
    title: 'SPRING MIRROR',
    pairs: [
      { col: 0, hue: 'lime' },
      { col: 3, hue: 'gold' },
      { col: 6, hue: 'lime' },
    ],
    shots: ['lime', 'gold', 'lime'],
  },
  {
    title: 'PRISM QUARTET',
    pairs: [
      { col: 0, hue: 'violet' },
      { col: 2, hue: 'teal' },
      { col: 5, hue: 'gold' },
      { col: 8, hue: 'blue' },
    ],
    shots: ['gold', 'violet', 'blue', 'teal'],
  },
  {
    title: 'RAINBOW REPRISE',
    pairs: [
      { col: 0, hue: 'pink' },
      { col: 2, hue: 'lime' },
      { col: 4, hue: 'blue' },
      { col: 6, hue: 'gold' },
      { col: 8, hue: 'violet' },
    ],
    shots: ['blue', 'violet', 'pink', 'gold', 'lime'],
  },
]

export function atelierBoard(index: number): Board {
  const puzzle = ATELIER_PUZZLES[index]!
  const board = emptyBoard()
  for (const { col, hue } of puzzle.pairs) {
    board[0]![col] = hue
    board[0]![col + 1] = hue
  }
  return board
}

type HomeTab = 'play' | 'scrapbook' | 'achievements' | 'settings'
const HOME_TABS: HomeTab[] = ['play', 'scrapbook', 'achievements', 'settings']
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  hue: Hue
  power: SpectrumPower | null
  banked?: boolean
}
export const SPECTRUM_BOSS_ART = [
  'boss-greyscale-dryer',
  'boss-pruner',
  'boss-neon-inspector',
  'boss-archivist',
  'boss-sorting-machine',
  'boss-palette-keeper',
].map((name) => `/images/arcade/superkate-spectrum/${name}.webp`)

function drawBossArt(
  g: CanvasRenderingContext2D,
  chapter: number,
  highContrast: boolean,
) {
  const src = SPECTRUM_BOSS_ART[chapter]
  const image = src ? loadedImage(src) : null
  if (!image) return
  const width = W - 16
  const height = 264
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  )
  const sw = width / scale
  const sh = height / scale
  g.save()
  g.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    8,
    76,
    width,
    height,
  )
  g.fillStyle = highContrast ? '#100d27df' : '#100d2799'
  g.fillRect(8, 76, width, height)
  g.strokeStyle = '#ffe29380'
  g.lineWidth = 1
  g.strokeRect(8, 76, width, height)
  g.restore()
}

export const BOSS_PATTERNS = [
  {
    name: 'GREYSCALE DRYER',
    rule: 'SHOOT AROUND THE DRYER SHIELD',
    targets: [160, 160, 160],
    y: [112, 112, 112],
    radius: 23,
    limit: 4,
  },
  {
    name: 'THE PRUNER',
    rule: 'DODGE THE ALTERNATING PRUNER',
    targets: [76, 244, 76, 244],
    y: [150, 150, 150, 150],
    radius: 21,
    limit: 4,
  },
  {
    name: 'NEON INSPECTOR',
    rule: 'BANK OFF A WALL',
    targets: [96, 224, 160],
    y: [88, 88, 88],
    radius: 24,
    limit: 5,
  },
  {
    name: 'THE ARCHIVIST',
    rule: 'WEAVE PAST THE MEMORY SHELVES',
    targets: [160, 104, 216, 160],
    y: [230, 180, 130, 80],
    radius: 20,
    limit: 4,
  },
  {
    name: 'SORTING MACHINE',
    rule: 'DODGE THE SORTING PADDLES',
    targets: [72, 160, 248, 160, 72],
    y: [120, 180, 120, 180, 120],
    radius: 19,
    limit: 4,
  },
  {
    name: 'PALETTE KEEPER',
    rule: 'BYPASS THE PRISM BARRIERS',
    targets: [160, 80, 240, 112, 208, 160],
    y: [85, 140, 140, 205, 205, 100],
    radius: 19,
    limit: 3,
  },
] as const

type BossGuard = { x: number; y: number; radius: number }

function bossGuards(chapter: number, hit: number): BossGuard[] {
  const odd = hit % 2 !== 0
  switch (chapter) {
    case 0:
      return [{ x: 160, y: 260, radius: 27 }]
    case 1:
      return [{ x: odd ? 224 : 96, y: 263, radius: 25 }]
    case 3:
      return [
        { x: 160, y: 306, radius: 20 },
        { x: odd ? 245 : 75, y: 260, radius: 14 },
      ]
    case 4:
      return [
        { x: odd ? 225 : 95, y: 282, radius: 23 },
        { x: odd ? 95 : 225, y: 230, radius: 16 },
      ]
    case 5:
      return [
        { x: 160, y: 315, radius: 23 },
        { x: odd ? 84 : 236, y: 260, radius: 20 },
      ]
    default:
      return []
  }
}

export function bossTarget(chapter: number, hit: number) {
  const pattern = BOSS_PATTERNS[chapter]!
  const index = hit % pattern.targets.length
  return {
    x: pattern.targets[index]!,
    y: pattern.y[index]!,
    hue: COLORS[(chapter + hit) % COLORS.length]!,
    radius: pattern.radius,
    bank: chapter === 2,
    guards: bossGuards(chapter, index),
  }
}

export function bossContact(
  target: ReturnType<typeof bossTarget>,
  shot: Pick<Shot, 'x' | 'y' | 'hue' | 'banked'>,
) {
  if (
    target.guards.some(
      (guard) =>
        (guard.x - shot.x) ** 2 + (guard.y - shot.y) ** 2 <=
        (guard.radius + 13) ** 2,
    )
  )
    return 'blocked'
  if (
    (target.x - shot.x) ** 2 + (target.y - shot.y) ** 2 >
    (target.radius + 13) ** 2
  )
    return 'none'
  return shot.hue === target.hue && (!target.bank || shot.banked)
    ? 'hit'
    : 'blocked'
}

type BossState = { hits: number; misses: number }

type PointerAction =
  | { kind: 'aim' }
  | { kind: 'swap' }
  | { kind: 'stage'; stage: number }
  | { kind: 'style'; style: BubbleStyle }
  | { kind: 'choice'; cursor: 0 | 1; scene: number }
  | { kind: 'classic' }
  | { kind: 'atelierOpen' }
  | { kind: 'atelierChoose'; by: number }
  | { kind: 'atelierStart' }
  | { kind: 'atelierBack' }
  | { kind: 'tab'; tab: HomeTab }
  | { kind: 'mode' }
  | { kind: 'album'; by: number }
  | { kind: 'option'; row: number; by: number }

function stepShot(shot: Shot) {
  shot.x += shot.vx
  shot.y += shot.vy
  if (shot.x < 14 || shot.x > W - 14) {
    shot.x = Math.max(14, Math.min(W - 14, shot.x))
    shot.vx *= -1
    shot.banked = true
  }
}

type Spark = {
  x: number
  y: number
  dx: number
  dy: number
  life: number
  color: string
}
function label(
  g: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 12,
  color = '#fff',
) {
  g.font = `bold ${size}px system-ui, sans-serif`
  g.textAlign = 'center'
  g.fillStyle = '#110e25'
  g.fillText(value, x + 1, y + 2)
  g.fillStyle = color
  g.fillText(value, x, y)
}
function bubble(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  hue: Hue,
  size = 13,
  style: BubbleStyle = 'glass',
  tick = 0,
  highContrast = false,
) {
  g.save()
  g.shadowColor = PALETTE[hue]
  g.shadowBlur = highContrast ? 0 : style === 'starlight' ? 16 : 10
  const gradient = g.createRadialGradient(x - 4, y - 5, 1, x, y, size)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(style === 'candy' ? 0.5 : 0.3, PALETTE[hue])
  gradient.addColorStop(1, style === 'candy' ? '#63305b' : '#28203e')
  g.fillStyle = highContrast ? PALETTE[hue] : gradient
  g.beginPath()
  g.arc(x, y, size, 0, Math.PI * 2)
  g.fill()
  g.shadowBlur = 0
  g.strokeStyle = highContrast
    ? '#ffffff'
    : style === 'prismatic'
      ? '#fbe98a'
      : '#f9f0ff'
  g.lineWidth = highContrast ? 3 : style === 'prismatic' ? 2.5 : 1.5
  g.stroke()
  if (style === 'starlight' || style === 'prismatic') {
    g.fillStyle = '#ffffffa8'
    const sparkle = 2 + Math.sin(tick / 9 + x * 0.1) * 1.5
    g.fillRect(x - 5, y - 8, sparkle, sparkle)
  }
  // Each color has a distinct geometric emblem for color-blind play.
  const index = COLORS.indexOf(hue)
  g.strokeStyle = '#21132e'
  g.lineWidth = 2
  g.beginPath()
  if (index === 0) {
    g.moveTo(x - 5, y)
    g.lineTo(x + 5, y)
  } else if (index === 1) {
    g.moveTo(x, y - 5)
    g.lineTo(x + 5, y + 4)
    g.lineTo(x - 5, y + 4)
    g.closePath()
  } else if (index === 2) {
    g.rect(x - 4, y - 4, 8, 8)
  } else if (index === 3) {
    g.moveTo(x, y - 6)
    g.lineTo(x + 5, y)
    g.lineTo(x, y + 6)
    g.lineTo(x - 5, y)
    g.closePath()
  } else if (index === 4) {
    g.arc(x, y, 4, 0, Math.PI * 2)
  } else {
    g.moveTo(x - 5, y - 4)
    g.lineTo(x + 5, y + 4)
    g.moveTo(x + 5, y - 4)
    g.lineTo(x - 5, y + 4)
  }
  g.stroke()
  g.restore()
}

class SuperkateSpectrum implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 3
  over = false
  board: Board
  angle = -Math.PI / 2
  shot: Shot | null = null
  loaded: Hue
  next: Hue
  shots = 0
  tick = 0
  banner = 170
  message = ''
  won = false
  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  audio: ArcadeAudioSettings
  private onAudioChange?: ArcadeGameOptions['onAudioChange']
  private feats: string[] = []
  private earned = new Set<string>()
  career: SpectrumCareer
  mode: SpectrumMode
  selectedStyle: BubbleStyle
  choosingMode = true
  menuStage = 1
  atelierMenu = false
  atelierActive = false
  atelierIndex = 0
  atelierUsed = 0
  atelierResult: 'cleared' | 'retry' | null = null
  menuTab: HomeTab = 'play'
  albumChapter = 0
  optionRow = 0
  settings: SpectrumSettings
  power: SpectrumPower | null = null
  sparks: Spark[] = []
  boss: BossState | null = null
  private pointerAction: PointerAction | null = null
  private runStartStage = 1
  private specialMeter = 0
  private specialCount = 0
  private shotsThisBoard = 0
  private poppedThisBoard = 0
  private stored: SpectrumSave
  storyChoices: StoryChoices
  storyEndings: StoryEnding[]
  pendingChoice: number | null = null
  choiceCursor: 0 | 1 = 0
  ending: StoryEnding | null = null
  private choiceResponseVisible = false
  private readonly demo: boolean

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.audio = {
      muted: options.audio?.muted === true,
      volume: Math.max(0, Math.min(1, options.audio?.volume ?? 1)),
    }
    this.onAudioChange = options.onAudioChange
    this.demo = options.demo
    this.stored = readSpectrumSave(options.resume)
    this.storyChoices = [
      ...(this.stored.storyChoices ?? freshStoryChoices()),
    ] as StoryChoices
    this.storyEndings = [...(this.stored.endings ?? [])]
    this.settings = { ...this.stored.settings }
    this.earned = new Set(options.mastery ?? [])
    this.career = this.stored.career
    this.mode = this.stored.mode
    this.selectedStyle = this.stored.style
    this.menuStage = this.career.highestStage
    this.level = this.mode === 'classic' ? 1 : this.menuStage
    this.board = makeBoard(this.level, this.rng, this.mode)
    this.loaded = chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.message = CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!.kate
    this.choosingMode = !this.demo
  }
  /** Both the host switches and the game Settings page control this mixer. */
  setAudio(settings: ArcadeAudioSettings) {
    this.audio = {
      muted: settings.muted,
      volume: Math.max(0, Math.min(1, settings.volume)),
    }
  }
  private changeAudio(next: ArcadeAudioSettings) {
    this.setAudio(next)
    this.onAudioChange?.(this.audio)
  }
  private playEffect(name: Parameters<ArcadeGameOptions['sound']['play']>[0]) {
    if (this.settings.effects) this.sound.play(name)
  }
  get music(): MusicLoop | null {
    if (this.over || !this.settings.music) return null
    if (this.choosingMode) return SPECTRUM_MENU_MUSIC
    if (this.mode === 'classic') return SPECTRUM_CLASSIC_MUSIC
    const chapter = Math.min(5, Math.floor((this.level - 1) / 5))
    return this.level % 5 === 0
      ? SPECTRUM_BOSS_MUSIC[chapter]!
      : SPECTRUM_THEMES[chapter]!
  }
  get save(): SpectrumSave {
    return this.stored
  }
  get menuOpen(): boolean {
    return this.choosingMode
  }
  get scoreBoard(): string | null {
    return this.choosingMode || this.demo || this.atelierActive
      ? null
      : spectrumRankedBoard(this.mode, this.runStartStage)
  }
  private remember() {
    this.stored = {
      version: 2,
      career: this.career,
      mode: this.mode,
      stage: this.mode === 'story' ? this.level : 1,
      style: this.selectedStyle,
      settings: { ...this.settings },
      storyChoices: [...this.storyChoices] as StoryChoices,
      endings: [...this.storyEndings],
    }
  }
  private startAtelier() {
    const puzzle = ATELIER_PUZZLES[this.atelierIndex]!
    this.choosingMode = false
    this.atelierActive = true
    this.atelierResult = null
    this.atelierUsed = 0
    this.board = atelierBoard(this.atelierIndex)
    this.loaded = puzzle.shots[0]!
    this.next = puzzle.shots[1] ?? this.loaded
    this.shot = null
    this.boss = null
    this.pendingChoice = null
    this.power = null
    this.banner = 0
    this.score = 0
    this.over = false
    this.won = false
    this.angle = -Math.PI / 2
    this.pointerAction = null
  }
  private backFromAtelier() {
    this.atelierActive = false
    this.atelierResult = null
    this.atelierMenu = false
    this.choosingMode = true
    this.shot = null
    this.pointerAction = null
    this.level = 1
    this.resetBoard()
  }
  private chooseAtelier(by: number) {
    this.atelierIndex =
      (this.atelierIndex + by + ATELIER_PUZZLES.length) % ATELIER_PUZZLES.length
  }
  private beginRun() {
    this.choosingMode = false
    this.over = false
    this.won = false
    this.score = 0
    this.lives = 3
    this.level = this.mode === 'classic' ? 1 : this.menuStage
    this.runStartStage = this.level
    this.pendingChoice =
      this.mode === 'story'
        ? pendingStoryDecision(this.level, this.storyChoices)
        : null
    this.choiceCursor = 0
    this.ending = null
    this.resetBoard()
    this.remember()
  }
  private burstSparks(x: number, y: number, hue: Hue, count: number) {
    if (!this.settings.particles) return
    for (let i = 0; i < Math.min(count, 32); i++) {
      const angle = (i * Math.PI * 2) / count
      const speed = 1.2 + (i % 4) * 0.6
      this.sparks.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 32,
        color: PALETTE[hue],
      })
    }
    if (this.sparks.length > 110)
      this.sparks.splice(0, this.sparks.length - 110)
  }
  get mastered(): readonly string[] {
    return [...this.earned]
  }
  drainFeats() {
    return this.feats.splice(0)
  }
  private earn(id: string) {
    if (this.earned.has(id)) return
    this.earned.add(id)
    this.feats.push(id)
  }
  private resetBoard() {
    this.pointerAction = null
    this.choiceResponseVisible = false
    this.boss = null
    this.board = makeBoard(this.level, this.rng, this.mode)
    this.loaded = chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.shot = null
    this.shots = 0
    this.shotsThisBoard = 0
    this.poppedThisBoard = 0
    this.power = null
    this.specialMeter = 0
    this.specialCount = 0
    this.banner = 160
    this.message =
      this.mode === 'classic'
        ? 'SUPERKATE: NO LIMITS. JUST COLOR!'
        : CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!.kate
  }
  private lose() {
    this.lives--
    this.playEffect('die')
    if (this.lives <= 0) {
      this.over = true
      if (this.mode === 'classic')
        this.career = recordClassicEnd(this.career, this.score)
      this.message = 'SUPERKATE: COLOR IS WORTH FIGHTING FOR.'
      this.remember()
    } else {
      this.message = 'SUPERKATE: LET US TRY A NEW MIX.'
      this.resetBoard()
    }
  }
  private settle() {
    if (!this.shot) return
    const landing = nearestSnap(this.board, this.shot)
    const hue = this.shot.hue
    const power = this.shot.power
    const banked = this.shot.banked === true
    this.shot = null
    this.shotsThisBoard++
    if (!landing) {
      if (this.atelierActive) {
        this.atelierResult = 'retry'
        return
      }
      this.lose()
      return
    }
    const result = power
      ? fireSpecial(this.board, landing, hue, power)
      : attachAndPop(this.board, landing, hue)
    if (this.atelierActive) {
      const puzzle = ATELIER_PUZZLES[this.atelierIndex]!
      this.atelierUsed++
      if (result.matched) this.playEffect('pop')
      if (result.cleared) {
        this.atelierResult = 'cleared'
        this.playEffect('level')
      } else if (this.atelierUsed >= puzzle.shots.length) {
        this.atelierResult = 'retry'
        this.playEffect('die')
      } else {
        this.loaded = puzzle.shots[this.atelierUsed]!
        this.next = puzzle.shots[this.atelierUsed + 1] ?? this.loaded
      }
      return
    }
    if (result.matched) {
      this.playEffect(power ? 'boom' : 'pop')
      this.career = recordPop(this.career, result.matched, result.dropped)
      this.poppedThisBoard += result.matched + result.dropped
      const pos = center(landing)
      this.burstSparks(pos.x, pos.y, hue, result.matched + result.dropped)
      if (this.mode === 'story' && !this.power) {
        this.specialMeter += result.matched + result.dropped
        const charge = CHAPTER_RULES[chapterIndex(this.level)]!.charge
        if (this.specialMeter >= charge) {
          this.specialMeter = 0
          const rank = rankForXp(this.career.xp)
          this.power = specialForStage(this.level, rank, this.specialCount++)
        }
      }
      this.score +=
        result.matched * 100 +
        result.dropped * 175 +
        Math.max(0, result.matched - 3) * 75
      this.message = result.dropped
        ? `SUPERKATE: ${result.dropped} FREE TO SHINE!`
        : 'SUPERKATE: BEAUTIFUL COMBINATION!'
      if (this.mode === 'story' && chapterIndex(this.level) === 2 && banked) {
        this.score += 400
        this.message = 'SUPERKATE: BANK SHOT BONUS +400!'
      }
      if (result.dropped >= 5) this.earn('rainbow-rescue')
      if (result.matched >= 6) this.earn('color-alchemist')
    }
    if (result.cleared) {
      if (this.mode === 'story' && this.level % 5 === 0) {
        this.boss = { hits: 0, misses: 0 }
        this.banner = 0
        this.power = null
        this.prepareBossShot()
        this.playEffect('level')
        this.remember()
      } else {
        this.completeBoard()
      }
      return
    }
    const hues = activeHues(this.board)
    this.loaded = hues.includes(this.next)
      ? this.next
      : chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.remember()
    this.shots = pressureAfterShot(
      this.shots,
      this.level,
      this.mode,
      result,
      banked,
    )
    if (this.shots >= pressureLimit(this.level, this.mode)) {
      this.shots = 0
      if (pushCeiling(this.board, this.rng)) this.lose()
    }
    if (this.board[ROWS - 1]!.some(Boolean)) this.lose()
  }
  private completeBoard() {
    const replayChoiceIndex = STORY_DECISIONS.findIndex(
      (scene) =>
        this.mode === 'story' &&
        scene.stage === this.level &&
        (this.career.stars[this.level - 1] ?? 0) > 0,
    )
    this.score += 1500 + this.level * 150
    this.playEffect('level')
    if (this.mode === 'story')
      this.career = recordClear(
        this.career,
        this.level,
        this.shotsThisBoard,
        this.poppedThisBoard,
      )
    if (this.mode === 'story' && this.level % 5 === 0) {
      this.score += 2500
      this.lives = Math.min(9, this.lives + 1)
      this.earn(`chapter-${Math.ceil(this.level / 5)}`)
      this.message =
        CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!.finale
    }
    if (this.mode === 'story' && this.level === 30) {
      this.over = true
      this.won = true
      this.ending = endingForStory(this.storyChoices)
      if (!this.storyEndings.includes(this.ending))
        this.storyEndings.push(this.ending)
      this.earn('true-spectrum')
      this.remember()
      return
    }
    this.level++
    this.resetBoard()
    this.pendingChoice =
      replayChoiceIndex >= 0
        ? replayChoiceIndex
        : this.mode === 'story'
          ? pendingStoryDecision(this.level, this.storyChoices)
          : null
    this.choiceCursor =
      this.pendingChoice === null
        ? 0
        : (this.storyChoices[this.pendingChoice] ?? 0)
    this.remember()
  }

  private prepareBossShot() {
    if (!this.boss) return
    const chapter = chapterIndex(this.level)
    this.loaded = bossTarget(chapter, this.boss.hits).hue
    this.next = bossTarget(chapter, this.boss.hits + 1).hue
  }

  private resolveBossShot(hit: boolean) {
    if (!this.boss || !this.shot) return
    const chapter = chapterIndex(this.level)
    const target = bossTarget(chapter, this.boss.hits)
    const pattern = BOSS_PATTERNS[chapter]!
    this.shot = null
    if (hit) {
      this.boss.hits++
      this.score += 500
      this.burstSparks(target.x, target.y, target.hue, 12)
      this.playEffect('pop')
      if (this.boss.hits === pattern.targets.length) {
        this.boss = null
        this.completeBoard()
        return
      }
    } else {
      this.boss.misses++
      this.playEffect('blip')
      if (this.boss.misses >= pattern.limit) {
        this.boss = null
        this.lose()
        return
      }
    }
    this.prepareBossShot()
  }

  private confirmChoice() {
    if (this.pendingChoice === null) return
    this.pointerAction = null
    const index = this.pendingChoice
    this.storyChoices[index] = this.choiceCursor
    if (this.choiceCursor === 0) this.lives = Math.min(9, this.lives + 1)
    else this.power = STORY_DECISIONS[index]!.power
    this.message = STORY_DECISIONS[index]!.options[this.choiceCursor].response
    this.choiceResponseVisible = true
    this.pendingChoice = null
    this.banner = 110
    this.remember()
    this.playEffect('level')
  }

  private makeShot(): Shot {
    return {
      x: W / 2,
      y: SHOT_Y,
      vx: Math.cos(this.angle) * SHOT_SPEED,
      vy: Math.sin(this.angle) * SHOT_SPEED,
      hue: this.loaded,
      power: this.mode === 'story' ? this.power : null,
    }
  }

  private fire() {
    if (
      this.shot ||
      this.atelierResult ||
      this.over ||
      this.choosingMode ||
      this.pendingChoice !== null
    )
      return
    this.pointerAction = null
    this.playEffect('shoot')
    this.shot = this.makeShot()
    this.power = null
  }

  private boardContact(shot: Shot) {
    return this.board.some((row, r) =>
      row.some((cell, c) => {
        if (!cell) return false
        const p = center({ row: r, col: c })
        return (p.x - shot.x) ** 2 + (p.y - shot.y) ** 2 < 26 ** 2
      }),
    )
  }

  private actionAt(x: number, y: number): PointerAction | null {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > W)
      return null
    if (this.over) return null
    if (this.atelierResult) {
      if (y >= 250 && y <= 290) return { kind: 'atelierStart' }
      if (y >= 300 && y <= 340) return { kind: 'atelierBack' }
      return null
    }
    if (this.pendingChoice !== null) {
      if (x < 25 || x > W - 25) return null
      for (const cursor of [0, 1] as const) {
        const top = 210 + cursor * 65
        if (y >= top && y <= top + 56)
          return { kind: 'choice', cursor, scene: this.pendingChoice }
      }
      return null
    }
    if (this.choosingMode) {
      if (y >= 459 && y <= H) {
        const tab = HOME_TABS[Math.min(3, Math.floor(x / 80))]!
        return { kind: 'tab', tab }
      }
      if (this.menuTab === 'scrapbook') {
        if (y >= 326 && y <= 358)
          return { kind: 'album', by: x < W / 2 ? -1 : 1 }
        return null
      }
      if (this.menuTab === 'settings') {
        if (x < 28 || x > W - 28) return null
        for (let row = 0; row < 7; row++) {
          const top = 150 + row * 29
          if (y >= top && y <= top + 26)
            return { kind: 'option', row, by: x < W / 2 ? -1 : 1 }
        }
        return null
      }
      if (this.menuTab !== 'play') return null
      if (this.atelierMenu) {
        if (y >= 210 && y <= 255)
          return { kind: 'atelierChoose', by: x < W / 2 ? -1 : 1 }
        if (y >= 270 && y <= 310) return { kind: 'atelierStart' }
        if (y >= 330 && y <= 370) return { kind: 'atelierBack' }
        return null
      }
      if (this.mode === 'classic') {
        if (y >= 380 && y <= 420) return { kind: 'atelierOpen' }
        if (y >= 207 && y <= 234) return { kind: 'mode' }
        return y >= 310 && y <= 350 ? { kind: 'classic' } : null
      }
      if (y >= 441 && y < 459) return { kind: 'mode' }
      for (let stage = 1; stage <= this.career.highestStage; stage++) {
        const p = storyMapPosition(stage)
        if (Math.abs(p.x - x) <= 25 && Math.abs(p.y - y) <= 22)
          return { kind: 'stage', stage }
      }
      const styles = ['glass', 'candy', 'starlight', 'prismatic'] as const
      if (y >= 382 && y <= 438) {
        const index = Math.round((x - 52) / 72)
        const style = styles[index]
        if (
          style &&
          Math.abs(x - (52 + index * 72)) <= 30 &&
          unlockedStyles(rankForXp(this.career.xp)).includes(style)
        )
          return { kind: 'style', style }
      }
      return null
    }
    if (this.shot) return null
    if (
      !this.atelierActive &&
      !this.boss &&
      x >= 20 &&
      x <= 70 &&
      y >= 420 &&
      y <= 459
    )
      return { kind: 'swap' }
    return y >= 28 && y <= 390 ? { kind: 'aim' } : null
  }

  stagePointer(event: ArcadeStagePointer) {
    const { phase, x, y } = event
    if (phase === 'cancel') {
      this.pointerAction = null
      return
    }
    if (phase === 'down') this.pointerAction = this.actionAt(x, y)
    const action = this.pointerAction
    if (!action) return
    if (action.kind === 'aim' && this.actionAt(x, y)?.kind === 'aim') {
      this.angle = Math.max(
        -Math.PI + 0.18,
        Math.min(-0.18, Math.atan2(y - SHOT_Y, x - W / 2)),
      )
    }
    if (phase !== 'up') return
    this.pointerAction = null
    const release = this.actionAt(x, y)
    if (!release || JSON.stringify(action) !== JSON.stringify(release)) return
    if (action.kind === 'aim') this.fire()
    else if (action.kind === 'swap')
      [this.loaded, this.next] = [this.next, this.loaded]
    else if (action.kind === 'stage') {
      this.menuStage = action.stage
      this.beginRun()
    } else if (action.kind === 'classic') this.beginRun()
    else if (action.kind === 'atelierOpen') this.atelierMenu = true
    else if (action.kind === 'atelierChoose') this.chooseAtelier(action.by)
    else if (action.kind === 'atelierStart') this.startAtelier()
    else if (action.kind === 'atelierBack') this.backFromAtelier()
    else if (action.kind === 'style') {
      this.selectedStyle = action.style
      this.remember()
    } else if (action.kind === 'choice') {
      this.choiceCursor = action.cursor
      this.confirmChoice()
    } else if (action.kind === 'tab') {
      this.menuTab = action.tab
      this.atelierMenu = false
      this.playEffect('blip')
    } else if (action.kind === 'mode') {
      this.mode = this.mode === 'classic' ? 'story' : 'classic'
      this.playEffect('blip')
    } else if (action.kind === 'album') {
      this.albumChapter = (this.albumChapter + action.by + 6) % 6
    } else if (action.kind === 'option') {
      this.optionRow = action.row
      this.changeOption(action.by)
    }
  }

  private changeOption(by: number) {
    if (this.optionRow <= 4) {
      const keys: (keyof SpectrumSettings)[] = [
        'aimGuide',
        'particles',
        'highContrast',
        'music',
        'effects',
      ]
      const key = keys[this.optionRow]!
      this.settings[key] = !this.settings[key]
      this.remember()
    } else if (this.optionRow === 5) {
      this.changeAudio({ ...this.audio, muted: !this.audio.muted })
    } else {
      this.changeAudio({
        ...this.audio,
        volume:
          Math.round(
            Math.max(0, Math.min(1, this.audio.volume + by * 0.1)) * 10,
          ) / 10,
      })
    }
    this.playEffect('blip')
  }

  update(input: InputFrame) {
    if (this.atelierResult) {
      if (input.pressed.a) this.startAtelier()
      else if (input.pressed.b) this.backFromAtelier()
      return
    }
    if (this.choosingMode && this.atelierMenu) {
      if (input.pressed.left) this.chooseAtelier(-1)
      if (input.pressed.right) this.chooseAtelier(1)
      if (input.pressed.a) this.startAtelier()
      else if (input.pressed.b) this.backFromAtelier()
      return
    }
    if (this.pendingChoice !== null) {
      if (input.pressed.left || input.pressed.up) this.choiceCursor = 0
      if (input.pressed.right || input.pressed.down) this.choiceCursor = 1
      if (input.pressed.a) this.confirmChoice()
      return
    }
    if (this.over) return
    this.tick++
    for (const spark of this.sparks) {
      spark.x += spark.dx
      spark.y += spark.dy
      spark.life--
    }
    this.sparks = this.sparks.filter((spark) => spark.life > 0)
    if (this.choosingMode) {
      if (input.pressed.x || input.pressed.y) {
        const by = input.pressed.x ? 1 : -1
        const at = HOME_TABS.indexOf(this.menuTab)
        this.menuTab =
          HOME_TABS[(at + by + HOME_TABS.length) % HOME_TABS.length]!
        this.playEffect('blip')
      }
      if (this.menuTab === 'play') {
        if (this.mode === 'classic' && input.pressed.right) {
          this.atelierMenu = true
          return
        }
        if (input.pressed.up || input.pressed.down)
          this.mode = this.mode === 'classic' ? 'story' : 'classic'
        if (this.mode === 'story') {
          if (input.pressed.left)
            this.menuStage = Math.max(1, this.menuStage - 1)
          if (input.pressed.right)
            this.menuStage = Math.min(
              this.career.highestStage,
              this.menuStage + 1,
            )
        }
        if (input.pressed.b) {
          const unlocks = unlockedStyles(rankForXp(this.career.xp))
          const at = unlocks.indexOf(this.selectedStyle)
          this.selectedStyle = unlocks[(at + 1) % unlocks.length]!
          this.remember()
        }
        if (input.pressed.a) this.beginRun()
      } else if (this.menuTab === 'scrapbook') {
        if (input.pressed.left) this.albumChapter = (this.albumChapter + 5) % 6
        if (input.pressed.right) this.albumChapter = (this.albumChapter + 1) % 6
      } else if (this.menuTab === 'settings') {
        if (input.pressed.up) this.optionRow = (this.optionRow + 6) % 7
        if (input.pressed.down) this.optionRow = (this.optionRow + 1) % 7
        if (
          this.optionRow === 6 &&
          (input.pressed.left || input.pressed.right)
        ) {
          const by = input.pressed.right ? 0.1 : -0.1
          this.changeAudio({
            ...this.audio,
            volume:
              Math.round(
                Math.max(0, Math.min(1, this.audio.volume + by)) * 10,
              ) / 10,
          })
        }
        if (input.pressed.a || input.pressed.b)
          this.changeOption(input.pressed.a ? 1 : -1)
      }
      return
    }
    if (this.banner > 0) this.banner--
    if (input.held.left) this.angle -= 0.035
    if (input.held.right) this.angle += 0.035
    this.angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, this.angle))
    if (input.pressed.b && !this.shot && !this.boss && !this.atelierActive)
      [this.loaded, this.next] = [this.next, this.loaded]
    if (input.pressed.a && !this.shot) this.fire()
    if (!this.shot) return
    stepShot(this.shot)
    if (this.boss) {
      const target = bossTarget(chapterIndex(this.level), this.boss.hits)
      const contact = bossContact(target, this.shot)
      if (contact !== 'none' || this.shot.y <= 40)
        this.resolveBossShot(contact === 'hit')
      return
    }
    if (this.shot.y <= 40 || this.boardContact(this.shot)) this.settle()
  }
  private renderStoryChoice(g: CanvasRenderingContext2D) {
    const scene = STORY_DECISIONS[this.pendingChoice!]!
    g.fillStyle = '#0e1131f5'
    g.fillRect(13, 111, W - 26, 281)
    g.strokeStyle = '#ffb1de'
    g.lineWidth = 2
    g.strokeRect(13, 111, W - 26, 281)
    label(g, scene.title, W / 2, 142, 15, '#ffe29b')
    label(g, scene.speaker, W / 2, 174, 10, '#b5f3e7')
    label(g, scene.question, W / 2, 195, 11, '#fff4f6')
    for (const [index, option] of scene.options.entries()) {
      const y = 233 + index * 65
      g.fillStyle = this.choiceCursor === index ? '#9b3c8e' : '#303451'
      g.fillRect(25, y - 23, W - 50, 56)
      g.strokeStyle = this.choiceCursor === index ? '#ffe493' : '#8e92b9'
      g.strokeRect(25, y - 23, W - 50, 56)
      label(g, option.label, W / 2, y, 11, '#ffffff')
      label(g, option.reward, W / 2, y + 21, 10, '#a7f8df')
    }
    label(g, 'LEFT/RIGHT CHOOSE · A CONFIRM', W / 2, 378, 10)
  }
  private renderStoryMap(g: CanvasRenderingContext2D, rank: number) {
    g.fillStyle = '#100d27'
    g.fillRect(8, 32, W - 16, 435)
    g.strokeStyle = '#fe8fc9'
    g.strokeRect(8, 32, W - 16, 435)
    label(g, 'RAINBOW CITY · STAR MAP', W / 2, 49, 14, '#fff0ad')
    const names = [
      'RAINBOW SALON',
      'BOTANIC DOME',
      'NIGHT MARKET',
      'CLOUD LIBRARY',
      'PRISM WORKSHOP',
      'HEART OF THE HUE',
    ]
    const colors: Hue[] = ['pink', 'lime', 'blue', 'teal', 'violet', 'gold']
    for (let chapter = 0; chapter < 6; chapter++) {
      const y = 82 + chapter * 48
      g.fillStyle = '#ffffff0c'
      g.fillRect(17, y - 18, W - 34, 43)
      label(g, names[chapter]!, W / 2, y - 20, 9, PALETTE[colors[chapter]!])
    }
    g.lineWidth = 3
    for (let stage = 1; stage < 30; stage++) {
      const from = storyMapPosition(stage)
      const to = storyMapPosition(stage + 1)
      g.strokeStyle = stage < this.career.highestStage ? '#85eacb' : '#49435f'
      g.beginPath()
      g.moveTo(from.x, from.y)
      g.lineTo(to.x, to.y)
      g.stroke()
    }
    for (let stage = 1; stage <= 30; stage++) {
      const { x, y } = storyMapPosition(stage)
      const unlocked = stage <= this.career.highestStage
      const selected = stage === this.menuStage
      const stars = this.career.stars[stage - 1] ?? 0
      g.fillStyle = unlocked
        ? PALETTE[colors[Math.floor((stage - 1) / 5)]!]
        : '#35344d'
      g.beginPath()
      g.arc(x, y, stage % 5 === 0 ? 16 : 13, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = selected ? '#fff0ad' : '#1e1b37'
      g.lineWidth = selected ? 4 : 2
      g.stroke()
      label(g, String(stage), x, y + 4, 12)
      label(
        g,
        unlocked ? '★'.repeat(stars) || '◇' : 'LOCK',
        x,
        y + 23,
        9,
        unlocked ? '#ffe6a0' : '#a7a6b9',
      )
    }
    const stars = this.career.stars.reduce((sum, count) => sum + count, 0)
    const selectedStars = this.career.stars[this.menuStage - 1] ?? 0
    label(
      g,
      `STAGE ${this.menuStage} · ${selectedStars ? 'REPLAY' : 'NEW'} · ${stars}/90 STARS`,
      W / 2,
      354,
      11,
      '#fff0ad',
    )
    label(
      g,
      this.menuStage === 1 ? 'STAGE 1 · RANKED RUN' : 'PRACTICE · NOT RANKED',
      W / 2,
      371,
      10,
    )
    const styles = ['glass', 'candy', 'starlight', 'prismatic'] as const
    const unlocks = unlockedStyles(rank)
    styles.forEach((style, index) => {
      const x = 52 + index * 72
      const unlocked = unlocks.includes(style)
      g.globalAlpha = unlocked ? 1 : 0.4
      bubble(
        g,
        x,
        400,
        colors[index]!,
        13,
        style,
        this.settings.particles ? this.tick : 0,
        this.settings.highContrast,
      )
      g.globalAlpha = 1
      if (this.selectedStyle === style) {
        g.strokeStyle = '#fff0ad'
        g.lineWidth = 2
        g.strokeRect(x - 18, 382, 36, 36)
      }
      label(g, style.toUpperCase(), x, 425, 8)
      label(g, unlocked ? 'OWNED' : `RANK ${[1, 4, 9, 15][index]}`, x, 436, 8)
    })
    label(g, `RANK ${rank} · TAP FOR CLASSIC · UP/DOWN`, W / 2, 450, 9)
    this.renderMenuTabs(g)
  }

  private renderMenuTabs(g: CanvasRenderingContext2D) {
    for (const [index, tab] of HOME_TABS.entries()) {
      const x = index * 80
      g.fillStyle = tab === this.menuTab ? '#713a7c' : '#22233f'
      g.fillRect(x, 459, 80, 21)
      g.strokeStyle = '#cda9ed'
      g.strokeRect(x, 459, 80, 21)
      label(g, tab.toUpperCase(), x + 40, 472, 9, '#fff4e6')
    }
  }

  private renderHomePage(g: CanvasRenderingContext2D, rank: number) {
    const panel = g.createLinearGradient(0, 120, W, 380)
    panel.addColorStop(0, '#40225fe8')
    panel.addColorStop(1, '#132644f0')
    g.fillStyle = panel
    g.fillRect(14, 122, W - 28, 263)
    g.strokeStyle = '#ff9edb'
    g.lineWidth = 2
    g.strokeRect(14, 122, W - 28, 263)
    label(g, this.menuTab.toUpperCase(), W / 2, 149, 17, '#ffe69d')
    if (this.menuTab === 'scrapbook') {
      const chapter = CHAPTERS[this.albumChapter]!
      const first = this.albumChapter * 5
      const unlocked = this.career.highestStage > first
      label(
        g,
        unlocked ? chapter.name : 'A CHAPTER YET TO BE REVEALED',
        W / 2,
        181,
        12,
        '#99f5ee',
      )
      for (let i = 0; i < 5; i++) {
        const at = first + i
        const earned = this.career.stars[at] ?? 0
        const x = 42 + i * 59
        g.fillStyle = at < this.career.highestStage ? '#de62a6' : '#3b395b'
        g.fillRect(x - 19, 204, 38, 52)
        g.strokeStyle = '#ffffff77'
        g.strokeRect(x - 19, 204, 38, 52)
        label(g, String(at + 1), x, 221, 11)
        label(g, earned ? '★'.repeat(earned) : '· · ·', x, 242, 10)
      }
      label(
        g,
        unlocked ? chapter.kate : 'PLAY MORE TO RESTORE THESE COLORS',
        W / 2,
        289,
        10,
        '#ffe5e9',
      )
      label(
        g,
        `★ ${this.career.stars.reduce((n, value) => n + value, 0)}/90 TOTAL`,
        W / 2,
        317,
        13,
        '#ffe18e',
      )
      label(g, '‹ PREV', 60, 343, 11)
      label(g, 'CHAPTERS', W / 2, 343, 10)
      label(g, 'NEXT ›', W - 60, 343, 11)
      label(
        g,
        `ENDING MEMORIES ${this.storyEndings.length}/3`,
        W / 2,
        367,
        10,
        '#ffe39e',
      )
    } else if (this.menuTab === 'achievements') {
      const milestones = [
        {
          id: 'rainbow-rescue',
          name: 'RAINBOW RESCUE',
          hint: 'DROP FIVE FLOATING BUBBLES',
        },
        {
          id: 'color-alchemist',
          name: 'COLOR ALCHEMIST',
          hint: 'POP SIX MATCHING BUBBLES',
        },
        {
          id: 'true-spectrum',
          name: 'EVERY SHADE BELONGS',
          hint: 'RESTORE ALL 30 LEVELS',
        },
      ]
      for (const [index, medal] of milestones.entries()) {
        const y = 185 + index * 58
        const earned = this.earned.has(medal.id)
        g.fillStyle = earned ? '#146a68' : '#292d52'
        g.fillRect(31, y - 17, W - 62, 49)
        label(
          g,
          earned ? `★ ${medal.name}` : `◇ ${medal.name}`,
          W / 2,
          y,
          12,
          earned ? '#fff1a0' : '#c3c8d8',
        )
        label(g, medal.hint, W / 2, y + 19, 9, '#b6ebe6')
      }
      label(g, `COLOR RANK ${rank}`, W / 2, 361, 11, '#ffdf92')
    } else {
      const choices = [
        ['AIM GUIDE', this.settings.aimGuide ? 'ON' : 'OFF'],
        ['POP ANIMATION', this.settings.particles ? 'ON' : 'OFF'],
        ['HIGH CONTRAST', this.settings.highContrast ? 'ON' : 'OFF'],
        ['MUSIC', this.settings.music ? 'ON' : 'OFF'],
        ['SOUND EFFECTS', this.settings.effects ? 'ON' : 'OFF'],
        ['MASTER MUTE', this.audio.muted ? 'ON' : 'OFF'],
        ['MASTER VOLUME', `${Math.round(this.audio.volume * 100)}%`],
      ] as const
      for (const [index, setting] of choices.entries()) {
        const y = 169 + index * 29
        g.fillStyle = index === this.optionRow ? '#6d3172e0' : '#27334ed4'
        g.fillRect(28, y - 19, W - 56, 26)
        label(g, setting[0], 110, y, 10)
        label(g, setting[1], 253, y, 11, '#9ff2e5')
      }
      label(g, 'TAP ROW · VOLUME: LEFT − / RIGHT +', W / 2, 371, 10)
    }
    label(g, 'X: NEXT TAB  Y: PREVIOUS', W / 2, 401, 11, '#f3d78d')
    this.renderMenuTabs(g)
  }

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#100d27'
    g.fillRect(0, 0, W, H)
    const background = g.createLinearGradient(0, 0, W, H)
    background.addColorStop(0, '#302059')
    background.addColorStop(0.5, '#142f4a')
    background.addColorStop(1, '#541d4b')
    g.fillStyle = background
    g.fillRect(0, 26, W, H - 26)
    g.fillStyle = '#fa70bb'
    g.fillRect(0, 25, W, 3)
    g.fillStyle = '#22e5d4'
    g.fillRect(0, H - 60, W, 3)
    for (let i = 0; i < 25; i++) {
      const x = (i * 71 + 19) % W
      const y = (i * 113 + 73) % 380
      g.fillStyle = i % 2 ? '#ffffff20' : '#ffd46a22'
      g.fillRect(x, y, 3, 3)
    }
    label(g, "SUPERKATE'S SPECTRUM", W / 2, 18, 15, '#fff0ad')
    const chapter = CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const hue = this.board[r]![c]
        if (hue) {
          const p = center({ row: r, col: c })
          bubble(
            g,
            p.x,
            p.y,
            hue,
            13,
            this.selectedStyle,
            this.settings.particles ? this.tick : 0,
            this.settings.highContrast,
          )
        }
      }
    }
    if (this.boss) {
      const chapter = chapterIndex(this.level)
      const pattern = BOSS_PATTERNS[chapter]!
      const target = bossTarget(chapter, this.boss.hits)
      drawBossArt(g, chapter, this.settings.highContrast)
      label(g, pattern.name, W / 2, 50, 15, '#fff0ad')
      label(g, pattern.rule, W / 2, 67, 10)
      for (const guard of target.guards) {
        g.fillStyle = '#28243f'
        g.strokeStyle = '#ffe293'
        g.lineWidth = 2
        g.beginPath()
        g.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        label(g, 'SHIELD', guard.x, guard.y + 3, 8, '#ffe293')
      }
      bubble(
        g,
        target.x,
        target.y,
        target.hue,
        target.radius,
        this.selectedStyle,
        0,
        this.settings.highContrast,
      )
      label(
        g,
        `CORES ${this.boss.hits}/${pattern.targets.length}`,
        W / 2,
        350,
        13,
      )
      label(
        g,
        `WARNING: ${pattern.limit - this.boss.misses} MISSES LEFT`,
        W / 2,
        372,
        11,
        '#fff0ad',
      )
    }
    g.strokeStyle = '#ffffff80'
    g.lineWidth = 2
    g.setLineDash([4, 8])

    if (
      this.settings.aimGuide &&
      !this.shot &&
      !this.choosingMode &&
      this.pendingChoice === null &&
      !this.over
    ) {
      g.beginPath()
      g.moveTo(W / 2, SHOT_Y)
      const preview = this.makeShot()
      const target = this.boss
        ? bossTarget(chapterIndex(this.level), this.boss.hits)
        : null
      for (let i = 0; i < 400; i++) {
        stepShot(preview)
        const stop =
          preview.y <= 40 ||
          (target
            ? bossContact(target, preview) !== 'none'
            : this.boardContact(preview))
        if (i % 2 === 0 || stop) g.lineTo(preview.x, preview.y)
        if (stop) break
      }
      g.stroke()
    }
    g.setLineDash([])
    const style = this.selectedStyle
    if (this.shot) {
      bubble(
        g,
        this.shot.x,
        this.shot.y,
        this.shot.hue,
        13,
        style,
        this.settings.particles ? this.tick : 0,
        this.settings.highContrast,
      )
      if (this.shot.power) {
        g.strokeStyle =
          this.shot.power === 'burst'
            ? '#ff9cae'
            : this.shot.power === 'ribbon'
              ? '#ffe382'
              : '#9df7ff'
        g.lineWidth = 2
        g.beginPath()
        g.arc(
          this.shot.x,
          this.shot.y,
          17 + Math.sin(this.tick / 5) * 2,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
    }
    for (const spark of this.sparks) {
      g.globalAlpha = spark.life / 32
      g.fillStyle = spark.color
      g.fillRect(spark.x - 2, spark.y - 2, 4, 4)
    }
    g.globalAlpha = 1
    g.fillStyle = '#a84b99'
    g.beginPath()
    g.arc(W / 2, SHOT_Y + 13, 20, Math.PI, 0)
    g.fill()
    bubble(
      g,
      W / 2,
      SHOT_Y,
      this.loaded,
      12,
      style,
      this.settings.particles ? this.tick : 0,
      this.settings.highContrast,
    )
    bubble(
      g,
      44,
      SHOT_Y + 3,
      this.next,
      10,
      style,
      this.settings.particles ? this.tick : 0,
      this.settings.highContrast,
    )
    if (this.power)
      label(g, this.power.toUpperCase(), W / 2, SHOT_Y - 21, 11, '#fff89d')
    label(g, 'NEXT', 44, SHOT_Y - 15, 10, '#d6faff')
    label(
      g,
      this.atelierActive
        ? 'ATELIER'
        : this.mode === 'classic'
          ? `CLASSIC ${this.level}`
          : `STAGE ${this.level}/30`,
      61,
      401,
      11,
      '#fff',
    )
    label(g, `SCORE ${this.score}`, 240, 401, 11, '#fff')
    label(
      g,
      this.atelierActive ? 'UNRANKED' : `HEARTS ${this.lives}`,
      55,
      417,
      11,
      '#ffa0c4',
    )
    label(
      g,
      this.atelierActive
        ? `SHOTS ${ATELIER_PUZZLES[this.atelierIndex]!.shots.length - this.atelierUsed}`
        : `DROP ${this.shots}/${pressureLimit(this.level, this.mode)}`,
      150,
      417,
      10,
      '#fff0ad',
    )
    const rank = rankForXp(this.career.xp)
    label(g, `COLOR RANK ${rank}`, 236, 417, 11, '#9df8f0')
    label(
      g,
      this.atelierActive
        ? ATELIER_PUZZLES[this.atelierIndex]!.title
        : this.mode === 'classic'
          ? `CLASSIC BEST ${this.career.classicBest}`
          : chapter.name,
      W / 2,
      469,
      11,
      '#ffe4a0',
    )
    if (this.pendingChoice !== null) {
      this.renderStoryChoice(g)
      return
    }
    if (this.atelierResult || (this.choosingMode && this.atelierMenu)) {
      g.fillStyle = '#0c0b25f5'
      g.fillRect(14, 145, W - 28, 235)
      g.strokeStyle = '#fe8fc9'
      g.strokeRect(14, 145, W - 28, 235)
      label(g, 'PUZZLE ATELIER', W / 2, 172, 18, '#fff0ad')
      label(g, ATELIER_PUZZLES[this.atelierIndex]!.title, W / 2, 198, 14)
      if (this.atelierResult) {
        label(
          g,
          this.atelierResult === 'cleared'
            ? 'BEAUTIFULLY SOLVED!'
            : 'OUT OF SHOTS',
          W / 2,
          230,
          13,
        )
        label(g, 'A / TAP: RETRY', W / 2, 275, 13)
        label(g, 'B / TAP: BACK', W / 2, 325, 13)
      } else {
        label(
          g,
          `<  ${this.atelierIndex + 1} / ${ATELIER_PUZZLES.length}  >`,
          W / 2,
          230,
          16,
        )
        label(g, 'FIXED SHOTS · NO CEILING DROP', W / 2, 253, 10)
        label(g, 'A / TAP: START PUZZLE', W / 2, 290, 13)
        label(g, 'B / TAP: BACK · UNRANKED', W / 2, 350, 12)
      }
      if (this.choosingMode) this.renderMenuTabs(g)
      return
    }
    if (this.choosingMode && this.menuTab !== 'play') {
      this.renderHomePage(g, rank)
      return
    }
    if (this.choosingMode && this.mode === 'story') {
      this.renderStoryMap(g, rank)
      return
    }
    if (this.choosingMode) {
      g.fillStyle = '#0c0b25ee'
      g.fillRect(14, 143, W - 28, 210)
      g.strokeStyle = '#fe8fc9'
      g.strokeRect(14, 143, W - 28, 210)
      label(g, "SUPERKATE'S COLOR CLUB", W / 2, 168, 16)
      label(g, 'CLASSIC BUBBLE MODE', W / 2, 198, 15, '#80f4e2')
      label(g, 'TAP HERE / UP-DOWN: STORY', W / 2, 220, 12)
      label(g, 'ENDLESS WAVES · NO POWER-UPS', W / 2, 241, 12)
      label(
        g,
        `RANK ${rank} · ${this.career.lifetimePops} BUBBLES FREED`,
        W / 2,
        267,
        12,
        '#ffd88d',
      )
      label(
        g,
        `BEST ${this.career.classicBest} · ${this.career.classicRuns} RUNS`,
        W / 2,
        286,
        12,
        '#ffdf85',
      )
      label(g, `B: SELECT ${style.toUpperCase()}`, W / 2, 303, 10, '#9cf3e7')
      label(g, 'PRESS A TO PLAY', W / 2, 329, 14, '#ff9ecf')
      const nextRank = 120 * rank * rank
      const currentRank = 120 * (rank - 1) ** 2
      const progress = Math.min(
        1,
        (this.career.xp - currentRank) / (nextRank - currentRank),
      )
      g.fillStyle = '#392e5b'
      g.fillRect(60, 340, 200, 6)
      g.fillStyle = '#e77fcc'
      g.fillRect(60, 340, 200 * progress, 6)
      label(g, 'X: SCRAPBOOK · Y: SETTINGS', W / 2, 368, 11, '#9cf4e8')
      g.fillStyle = '#713a7c'
      g.fillRect(26, 380, W - 52, 40)
      label(g, 'RIGHT / TAP: PUZZLE ATELIER', W / 2, 405, 12)
      this.renderMenuTabs(g)
      return
    }
    if (this.banner > 0 || this.over) {
      g.fillStyle = '#0c0b25e6'
      g.fillRect(10, 154, W - 20, 132)
      g.strokeStyle = '#ff77bd'
      g.strokeRect(10, 154, W - 20, 132)
      label(
        g,
        this.over
          ? this.won
            ? STORY_ENDINGS[this.ending ?? endingForStory(this.storyChoices)]
                .title
            : 'TRY AGAIN'
          : chapter.name,
        160,
        186,
        16,
      )
      label(
        g,
        this.won
          ? STORY_ENDINGS[this.ending ?? endingForStory(this.storyChoices)]
              .lines[0]
          : this.over
            ? 'THANK YOU, SUPERKATE!'
            : chapter.problem,
        160,
        212,
        10,
        '#8ff4ed',
      )
      label(
        g,
        this.won
          ? STORY_ENDINGS[this.ending ?? endingForStory(this.storyChoices)]
              .lines[1]
          : this.banner > 0 &&
              !this.choiceResponseVisible &&
              this.mode === 'story' &&
              this.level % 5 === 1
            ? CHAPTER_VOICES[Math.min(5, Math.floor((this.level - 1) / 5))]!
            : this.message,
        160,
        240,
        10,
        '#ffb9d8',
      )
      label(
        g,
        this.won
          ? 'THREE PATHS · ONE RAINBOW CITY'
          : this.mode === 'story' && !this.over
            ? CHAPTER_RULES[chapterIndex(this.level)]!.label
            : 'A FIRE  B SWAP  LEFT/RIGHT AIM',
        160,
        266,
        10,
        '#ffdf85',
      )
    }
  }
}
const game: ArcadeGameModule = {
  create: (options) => new SuperkateSpectrum(options),
  guide: () => [
    {
      title: 'THE COLOR RESCUE',
      lines: [
        'MODE MENU: UP/DOWN STORY OR CLASSIC',
        'B ON MODE MENU CHANGES BUBBLE LOOK',
        'CLASSIC MENU: RIGHT OR TAP FOR ATELIER',
        'ATELIER: FIXED SHOTS, NO RANKED SCORE',
        'A SHOOTS YOUR COLOR ORB',
        'LEFT/RIGHT AIM; BANK OFF THE WALLS',
        'TOUCH: DRAG TO AIM, RELEASE TO SHOOT',
        'TAP THE NEXT BUBBLE TO SWAP',
        'B SWAPS WITH THE NEXT ORB',
        'MATCH THREE OR MORE TO FREE THEM',
        'FLOATING ORBS DROP FOR EXTRA POINTS',
        'WATCH DROP COUNT: CEILING ADVANCES AT THE LIMIT',
        'EACH STORY DISTRICT HAS ITS OWN PRESSURE RULE',
        'CLEAR 30 BOARDS TO RESTORE THE CITY',
        'RANK UP TO UNLOCK NEW BUBBLE LOOKS',
        'PRISM MATCHES NEIGHBOR COLORS',
        'BURST POPS A LOCAL RING',
        'RIBBON SWEEPS AN ENTIRE ROW',
        'COLOR SYMBOLS HELP DISTINGUISH HUES',
      ],
    },
    {
      title: "SUPERKATE'S STORY",
      lines: [
        'SIX NEIGHBORHOODS, FIVE BOARDS EACH',
        'THREE CHOICES CHANGE YOUR BONUSES',
        'SAVE YOUR DECISIONS ACROSS DEVICES',
        'THREE DIFFERENT CITY ENDINGS',
        'THE PRISM SORTER IS ERASING DIFFERENCE',
        'SUPERKATE HELPS EVERYONE SHINE',
        'DEFEAT EACH CHAPTER BOSS FOR A HEART',
        'MATCH BOSS CORES; BANK SHOTS AT THE MARKET',
        'MISS LIMIT IS SHOWN BEFORE EVERY SHOT',
        'NO PERFECT SHADE. EVERY SHADE BELONGS.',
      ],
    },
  ],
}
export const create = (options: ArcadeGameOptions) =>
  new SuperkateSpectrum(options)
export default game
