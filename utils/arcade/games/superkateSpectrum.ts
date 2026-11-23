import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeAudioSettings,
  InputFrame,
} from '../types'
import {
  COLS,
  ROWS,
  COLORS,
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
import {
  rankForXp,
  recordClassicEnd,
  recordClear,
  recordPop,
  readSpectrumSave,
  unlockedStyles,
} from '../superkateSpectrum/progress'
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

type HomeTab = 'play' | 'scrapbook' | 'achievements' | 'settings'
const HOME_TABS: HomeTab[] = ['play', 'scrapbook', 'achievements', 'settings']
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  hue: Hue
  power: SpectrumPower | null
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
  menuTab: HomeTab = 'play'
  albumChapter = 0
  optionRow = 0
  settings: SpectrumSettings
  power: SpectrumPower | null = null
  sparks: Spark[] = []
  private specialMeter = 0
  private specialCount = 0
  private shotsThisBoard = 0
  private poppedThisBoard = 0
  private stored: SpectrumSave
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
    this.settings = { ...this.stored.settings }
    this.earned = new Set(options.mastery ?? [])
    this.career = this.stored.career
    this.mode = this.stored.mode
    this.selectedStyle = this.stored.style
    this.menuStage = this.career.highestStage
    this.level = this.mode === 'classic' ? 1 : this.menuStage
    this.board = makeBoard(this.level, this.rng)
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
  get music(): MusicLoop | null {
    if (this.over) return null
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
  private remember() {
    this.stored = {
      version: 2,
      career: this.career,
      mode: this.mode,
      stage: this.mode === 'story' ? this.level : 1,
      style: this.selectedStyle,
      settings: { ...this.settings },
    }
  }
  private beginRun() {
    this.choosingMode = false
    this.over = false
    this.won = false
    this.score = 0
    this.lives = 3
    this.level = this.mode === 'classic' ? 1 : this.menuStage
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
    this.board = makeBoard(this.level, this.rng)
    this.loaded = chooseHue(this.board, this.rng)
    this.next = chooseHue(this.board, this.rng)
    this.shot = null
    this.shots = 0
    this.shotsThisBoard = 0
    this.poppedThisBoard = 0
    this.power = null
    this.specialMeter = 0
    this.banner = 160
    this.message =
      this.mode === 'classic'
        ? 'SUPERKATE: NO LIMITS. JUST COLOR!'
        : CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!.kate
  }
  private lose() {
    this.lives--
    this.sound.play('die')
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
    this.shot = null
    this.shotsThisBoard++
    if (!landing) {
      this.lose()
      return
    }
    const result = power
      ? fireSpecial(this.board, landing, hue, power)
      : attachAndPop(this.board, landing, hue)
    if (result.matched) {
      this.sound.play(power ? 'boom' : 'pop')
      this.career = recordPop(this.career, result.matched, result.dropped)
      this.poppedThisBoard += result.matched + result.dropped
      const pos = center(landing)
      this.burstSparks(pos.x, pos.y, hue, result.matched + result.dropped)
      if (this.mode === 'story' && !this.power) {
        this.specialMeter += result.matched + result.dropped
        if (this.specialMeter >= 22) {
          this.specialMeter = 0
          const rank = rankForXp(this.career.xp)
          this.power = rank >= 15 ? 'ribbon' : rank >= 9 ? 'burst' : 'prism'
        }
      }
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
      this.sound.play('level')
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
        this.message = CHAPTERS[Math.min(5, Math.floor((this.level - 1) / 5))]!.finale
      }
      if (this.mode === 'story' && this.level === 30) {
        this.over = true
        this.won = true
        this.earn('true-spectrum')
        this.remember()
        return
      }
      this.level++
      this.resetBoard()
      this.remember()
      return
    }
    this.loaded = this.next
    this.next = chooseHue(this.board, this.rng)
    this.remember()
    this.shots++
    if (this.shots >= Math.max(4, 9 - Math.floor(this.level / 5))) {
      this.shots = 0
      if (pushCeiling(this.board, this.rng)) this.lose()
    }
    if (this.board[ROWS - 1]!.some(Boolean)) this.lose()
  }
  update(input: InputFrame) {
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
        this.sound.play('blip')
      }
      if (this.menuTab === 'play') {
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
        if (input.pressed.up) this.optionRow = (this.optionRow + 4) % 5
        if (input.pressed.down) this.optionRow = (this.optionRow + 1) % 5
        if (
          this.optionRow === 4 &&
          (input.pressed.left || input.pressed.right)
        ) {
          const by = input.pressed.right ? 0.1 : -0.1
          this.changeAudio({
            ...this.audio,
            volume: Math.round(
              Math.max(0, Math.min(1, this.audio.volume + by)) * 10,
            ) / 10,
          })
        }
        if (input.pressed.a || input.pressed.b) {
          if (this.optionRow <= 2) {
            const key: keyof SpectrumSettings =
              this.optionRow === 0
                ? 'aimGuide'
                : this.optionRow === 1
                  ? 'particles'
                  : 'highContrast'
            this.settings[key] = !this.settings[key]
            this.remember()
          } else if (this.optionRow === 3) {
            this.changeAudio({ ...this.audio, muted: !this.audio.muted })
          } else {
            this.changeAudio({
              ...this.audio,
              volume: Math.round(
                Math.max(
                  0,
                  Math.min(1, this.audio.volume + (input.pressed.a ? 0.1 : -0.1)),
                ) * 10,
              ) / 10,
            })
          }
          this.sound.play('blip')
        }
      }
      return
    }
    if (this.banner > 0) this.banner--
    if (input.held.left) this.angle -= 0.035
    if (input.held.right) this.angle += 0.035
    this.angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, this.angle))
    if (input.pressed.b && !this.shot)
      [this.loaded, this.next] = [this.next, this.loaded]
    if (input.pressed.a && !this.shot) {
      this.sound.play('shoot')
      this.shot = {
        x: W / 2,
        y: SHOT_Y,
        vx: Math.cos(this.angle) * SHOT_SPEED,
        vy: Math.sin(this.angle) * SHOT_SPEED,
        hue: this.loaded,
        power: this.mode === 'story' ? this.power : null,
      }
      this.power = null
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
          return (p.x - this.shot!.x) ** 2 + (p.y - this.shot!.y) ** 2 < 26 ** 2
        }),
      )
    )
      this.settle()
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
      label(g, 'LEFT/RIGHT: CHAPTERS', W / 2, 343, 10)
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
        ['SOUNDTRACK + SFX', this.audio.muted ? 'OFF' : 'ON'],
        ['ARCADE VOLUME', `${Math.round(this.audio.volume * 100)}%`],
      ] as const
      for (const [index, setting] of choices.entries()) {
        const y = 179 + index * 37
        g.fillStyle = index === this.optionRow ? '#6d3172e0' : '#27334ed4'
        g.fillRect(28, y - 20, W - 56, 32)
        label(g, setting[0], 109, y, 10)
        label(g, setting[1], 252, y, 11, '#9ff2e5')
      }
      label(g, 'UP/DOWN PICK · A/B CHANGE', W / 2, 353, 11)
      label(g, 'VOLUME: LEFT/RIGHT OR A/B', W / 2, 373, 10, '#edc6f5')
    }
    label(g, 'X: NEXT TAB  Y: PREVIOUS', W / 2, 401, 11, '#f3d78d')
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
    g.strokeStyle = '#ffffff80'
    g.lineWidth = 2
    g.setLineDash([4, 8])

    if (this.settings.aimGuide) {
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
      this.mode === 'classic'
        ? `CLASSIC ${this.level}`
        : `STAGE ${this.level}/30`,
      61,
      401,
      11,
      '#fff',
    )
    label(g, `SCORE ${this.score}`, 240, 401, 11, '#fff')
    label(g, `HEARTS ${this.lives}`, 55, 417, 11, '#ffa0c4')
    const rank = rankForXp(this.career.xp)
    label(g, `COLOR RANK ${rank}`, 236, 417, 11, '#9df8f0')
    label(
      g,
      this.mode === 'classic'
        ? `CLASSIC BEST ${this.career.classicBest}`
        : chapter.name,
      W / 2,
      469,
      11,
      '#ffe4a0',
    )
    if (this.choosingMode && this.menuTab !== 'play') {
      this.renderHomePage(g, rank)
      return
    }
    if (this.choosingMode) {
      g.fillStyle = '#0c0b25ee'
      g.fillRect(14, 143, W - 28, 210)
      g.strokeStyle = '#fe8fc9'
      g.strokeRect(14, 143, W - 28, 210)
      label(g, "SUPERKATE'S COLOR CLUB", W / 2, 168, 16)
      label(
        g,
        this.mode === 'story' ? 'STORY ADVENTURE' : 'CLASSIC BUBBLE MODE',
        W / 2,
        198,
        15,
        '#80f4e2',
      )
      label(g, 'UP/DOWN: CHANGE MODE', W / 2, 220, 12)
      if (this.mode === 'story')
        label(g, `LEFT/RIGHT: START AT ${this.menuStage}`, W / 2, 241, 12)
      else label(g, 'ENDLESS WAVES · NO POWER-UPS', W / 2, 241, 12)
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
        this.mode === 'story'
          ? `STAGE ${this.menuStage}: ${'★'.repeat(this.career.stars[this.menuStage - 1] ?? 0)}`
          : `BEST ${this.career.classicBest} · ${this.career.classicRuns} RUNS`,
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
            ? 'EVERY SHADE BELONGS'
            : 'TRY AGAIN'
          : chapter.name,
        160,
        186,
        16,
      )
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
        'MODE MENU: UP/DOWN STORY OR CLASSIC',
        'B ON MODE MENU CHANGES BUBBLE LOOK',
        'A SHOOTS YOUR COLOR ORB',
        'LEFT/RIGHT AIM; BANK OFF THE WALLS',
        'B SWAPS WITH THE NEXT ORB',
        'MATCH THREE OR MORE TO FREE THEM',
        'FLOATING ORBS DROP FOR EXTRA POINTS',
        'EVERY FEW SHOTS THE CEILING ADVANCES',
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
        'THE PRISM SORTER IS ERASING DIFFERENCE',
        'SUPERKATE HELPS EVERYONE SHINE',
        'COMPLETE EACH CHAPTER FOR A HEART',
        'NO PERFECT SHADE. EVERY SHADE BELONGS.',
      ],
    },
  ],
}
export const create = (options: ArcadeGameOptions) =>
  new SuperkateSpectrum(options)
export default game
