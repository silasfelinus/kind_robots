import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  COLS,
  ROWS,
  COLORS,
  activeHues,
  attachAndPop,
  center,
  chooseHue,
  makeBoard,
  nearestSnap,
  neighbors,
  pushCeiling,
} from '../superkateSpectrum/board'
import type { Board, Hue } from '../superkateSpectrum/board'

const W = 320
const H = 480
const SHOT_Y = 438
const SHOT_SPEED = 7
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

type Shot = { x: number; y: number; vx: number; vy: number; hue: Hue }
type Save = { version: 1; stage: number; score: number; lives: number }
function readSave(value: unknown): Save | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Partial<Save>
  if (
    data.version !== 1 ||
    !Number.isInteger(data.stage) ||
    !Number.isInteger(data.score) ||
    !Number.isInteger(data.lives) ||
    (data.stage ?? 0) < 1 ||
    (data.stage ?? 0) > 30 ||
    (data.score ?? -1) < 0 ||
    (data.lives ?? 0) < 1 ||
    (data.lives ?? 0) > 9
  )
    return null
  return data as Save
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
) {
  g.save()
  g.shadowColor = PALETTE[hue]
  g.shadowBlur = 10
  const gradient = g.createRadialGradient(
    x - 4,
    y - 5,
    1,
    x,
    y,
    size,
  )
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.3, PALETTE[hue])
  gradient.addColorStop(1, '#28203e')
  g.fillStyle = gradient
  g.beginPath()
  g.arc(x, y, size, 0, Math.PI * 2)
  g.fill()
  g.shadowBlur = 0
  g.strokeStyle = '#f9f0ff'
  g.lineWidth = 1.5
  g.stroke()
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
  private feats: string[] = []
  private earned = new Set<string>()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    const save = readSave(options.resume)
    if (save) {
      this.level = save.stage
      this.score = save.score
      this.lives = save.lives
    }
    this.board = makeBoard(this.level, this.rng)
    this.loaded = chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.message = CHAPTERS[Math.floor((this.level - 1) / 5)]!.kate
  }
  get save(): Save | null {
    return this.over
      ? null
      : { version: 1, stage: this.level, score: this.score, lives: this.lives }
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
    this.board = makeBoard(this.level, this.rng)
    this.loaded = chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.shot = null
    this.shots = 0
    this.banner = 160
    this.message = CHAPTERS[Math.floor((this.level - 1) / 5)]!.kate
  }
  private lose() {
    this.lives--
    if (this.lives <= 0) {
      this.over = true
      this.message = 'SUPERKATE: COLOR IS WORTH FIGHTING FOR.'
    } else {
      this.message = 'SUPERKATE: LET US TRY A NEW MIX.'
      this.resetBoard()
    }
  }
  private settle() {
    if (!this.shot) return
    const landing = nearestSnap(this.board, this.shot)
    const hue = this.shot.hue
    this.shot = null
    if (!landing) {
      this.lose()
      return
    }
    const result = attachAndPop(this.board, landing, hue)
    if (result.matched) {
      this.score +=
        result.matched * 100 +
        result.dropped * 175 +
        Math.max(0, result.matched - 3) * 75
      this.message = result.dropped
        ? `SUPERKATE: ${result.dropped} FREE TO SHINE!`
        : 'SUPERKATE: BEAUTIFUL COMBINATION!'
      if (result.dropped >= 5) this.earn('rainbow-rescue')
      if (result.matched >= 6) this.earn('color-alchemist')
    }
    if (result.cleared) {
      this.score += 1500 + this.level * 150
      if (this.level % 5 === 0) {
        this.score += 2500
        this.lives = Math.min(9, this.lives + 1)
        this.earn(`chapter-${Math.ceil(this.level / 5)}`)
        this.message =
          CHAPTERS[Math.floor((this.level - 1) / 5)]!.finale
      }
      if (this.level === 30) {
        this.over = true
        this.won = true
        this.earn('true-spectrum')
        return
      }
      this.level++
      this.resetBoard()
      return
    }
    this.loaded = this.next
    this.next = chooseHue(this.board, this.rng)
    this.shots++
    if (this.shots >= Math.max(4, 9 - Math.floor(this.level / 5))) {
      this.shots = 0
      if (pushCeiling(this.board)) this.lose()
    }
    if (this.board[ROWS - 1]!.some(Boolean)) this.lose()
  }
  update(input: InputFrame) {
    if (this.over) return
    this.tick++
    if (this.banner > 0) this.banner--
    if (input.held.left) this.angle -= 0.035
    if (input.held.right) this.angle += 0.035
    this.angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, this.angle))
    if (input.pressed.b && !this.shot)
      [this.loaded, this.next] = [this.next, this.loaded]
    if (input.pressed.a && !this.shot) {
      this.shot = {
        x: W / 2,
        y: SHOT_Y,
        vx: Math.cos(this.angle) * SHOT_SPEED,
        vy: Math.sin(this.angle) * SHOT_SPEED,
        hue: this.loaded,
      }
    }
    if (!this.shot) return
    this.shot.x += this.shot.vx
    this.shot.y += this.shot.vy
    if (this.shot.x < 14 || this.shot.x > W - 14) {
      this.shot.x = Math.max(14, Math.min(W - 14, this.shot.x))
      this.shot.vx *= -1
    }
    if (
      this.shot.y <= 40 ||
      this.board.some((row, r) =>
        row.some((cell, c) => {
          if (!cell) return false
          const p = center({ row: r, col: c })
          return (
            (p.x - this.shot!.x) ** 2 +
              (p.y - this.shot!.y) ** 2 <
            26 ** 2
          )
        }),
      )
    )
      this.settle()
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
    label(g, 'SUPERKATE\'S SPECTRUM', W / 2, 18, 15, '#fff0ad')
    const chapter = CHAPTERS[Math.floor((this.level - 1) / 5)]!
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const hue = this.board[r]![c]
        if (hue) {
          const p = center({ row: r, col: c })
          bubble(g, p.x, p.y, hue)
        }
      }
    }
    g.strokeStyle = '#ffffff80'
    g.lineWidth = 2
    g.setLineDash([4, 8])
    g.beginPath()
    g.moveTo(W / 2, SHOT_Y)
    let ax = W / 2
    let ay = SHOT_Y
    let dx = Math.cos(this.angle) * 8
    const dy = Math.sin(this.angle) * 8
    for (let i = 0; i < 44; i++) {
      ax += dx
      ay += dy
      if (ax < 14 || ax > W - 14) dx *= -1
      if (ay < 42) break
      if (i % 2 === 0) g.lineTo(ax, ay)
    }
    g.stroke()
    g.setLineDash([])
    if (this.shot) bubble(g, this.shot.x, this.shot.y, this.shot.hue)
    g.fillStyle = '#a84b99'
    g.beginPath()
    g.arc(W / 2, SHOT_Y + 13, 20, Math.PI, 0)
    g.fill()
    bubble(g, W / 2, SHOT_Y, this.loaded, 12)
    bubble(g, 44, SHOT_Y + 3, this.next, 10)
    label(g, 'NEXT', 44, SHOT_Y - 15, 10, '#d6faff')
    label(g, `STAGE ${this.level}/30`, 55, 401, 11, '#fff')
    label(g, `SCORE ${this.score}`, 240, 401, 11, '#fff')
    label(g, `HEARTS ${this.lives}`, 55, 417, 11, '#ffa0c4')
    label(g, chapter.name, W / 2, 469, 11, '#ffe4a0')
    if (this.banner > 0 || this.over) {
      g.fillStyle = '#0c0b25e6'
      g.fillRect(10, 154, W - 20, 132)
      g.strokeStyle = '#ff77bd'
      g.strokeRect(10, 154, W - 20, 132)
      label(g, this.over ? 'THE SPECTRUM SHINES' : chapter.name, 160, 186, 16)
      label(
        g,
        this.over ? 'THANK YOU, SUPERKATE!' : chapter.problem,
        160,
        212,
        10,
        '#8ff4ed',
      )
      label(g, this.message, 160, 240, 10, '#ffb9d8')
      label(
        g,
        this.won ? 'EVERY SHADE BELONGS' : 'A FIRE  B SWAP  LEFT/RIGHT AIM',
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
        'A SHOOTS YOUR COLOR ORB',
        'LEFT/RIGHT AIM; BANK OFF THE WALLS',
        'B SWAPS WITH THE NEXT ORB',
        'MATCH THREE OR MORE TO FREE THEM',
        'FLOATING ORBS DROP FOR EXTRA POINTS',
        'EVERY FEW SHOTS THE CEILING ADVANCES',
        'CLEAR 30 BOARDS TO RESTORE THE CITY',
        'COLOR SYMBOLS HELP DISTINGUISH HUES',
      ],
    },
    {
      title: 'SUPERKATE\'S STORY',
      lines: [
        'SIX NEIGHBORHOODS, FIVE BOARDS EACH',
        'THE PRISM SORTER IS ERASING DIFFERENCE',
        'SUPERKATE HELPS EVERYONE SHINE',
        'COMPLETE EACH CHAPTER FOR A HEART',
        'NO PERFECT SHADE. EVERY SHADE BELONGS.',
      ],
    },
  ],
}
export const create = game.create
export default game
