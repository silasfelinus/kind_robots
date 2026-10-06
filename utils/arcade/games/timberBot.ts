// /utils/arcade/games/timberBot.ts
//
// Timber Bot -- the Kind Robots Arcade's riff on the 1984 logging game
// (conductor kr-arcade/t-009 game factory). A storm has left a grove full of
// dead trees. The teal cat-eared robot chops each trunk down one log at a
// time against the clock, ducks the grumpy bees that fly in at head height,
// and steps clear of branches that creak loose from the treetops. Every stump
// can take a sapling for a bonus. Every fourth grove is a sapling run: no
// hazards, just stumps to plant before the clock runs out.

import { everyNthLevel, levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 420
const H = 360
const GROUND = 318
const SEG_H = 24
const TRUNK_W = 22
const REACH = 28
const WALK = 1.7
const SWING_TICKS = 12
const ROBOT_H = 26
const DUCK_H = 13
const BEE_Y = GROUND - 22
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 20_000
const PLANT_WINDOW = 60 * 5
const BONUS_STUMPS = 7

/** Where trees can stand, left to right. */
export const TREE_SLOTS = [48, 128, 210, 292, 372]

export const TIMBER_CURVES = {
  trees: { start: 2, step: 0.5, limit: 5 },
  segments: { start: 4, step: 1, limit: 10 },
  clockSeconds: { start: 40, step: -1.5, limit: 26 },
  branchEvery: { start: 220, step: -18, limit: 70 },
  beeEvery: { start: 420, step: -35, limit: 110 },
  beeSpeed: { start: 1.1, step: 0.1, limit: 2.2 },
  hiveChance: { start: 0, step: 0.05, limit: 0.3 },
} as const

type Tree = {
  x: number
  /** Logs still standing, bottom first; true marks a log with a beehive. */
  logs: boolean[]
  /** Pixels the trunk is still settling after a chop. */
  drop: number
  creak: number
  planted: boolean
}
type Branch = {
  x: number
  y: number
  vy: number
  side: number
  landed: number
}
type Bee = {
  x: number
  y: number
  dir: number
  speed: number
  /** Ticks a bee hovers by its hive before it charges. */
  hover: number
  phase: number
}
type Chip = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  spin?: number
}
type Floater = { x: number; y: number; text: string; life: number }

/** Is a robot standing at x within chopping reach of a trunk at treeX? */
export function inReach(x: number, treeX: number): boolean {
  return Math.abs(treeX - x) <= REACH
}

class TimberBot implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private robot = { x: W / 2, facing: 1, ducking: false, step: 0 }
  private swing = 0
  private alive = true
  private respawn = 0
  private invuln = 0
  private trees: Tree[] = []
  private branches: Branch[] = []
  private bees: Bee[] = []
  private chips: Chip[] = []
  private floaters: Floater[] = []
  private clock = 0
  private clockMax = 1
  private branchTimer = 0
  private beeTimer = 0
  private bonusStage = false
  private planting = 0
  private clearing = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private pilotSpot: number | null = null
  private pilotTarget: Tree | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ------------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.trees = []
    this.branches = []
    this.bees = []
    this.planting = 0
    this.clearing = 0
    this.swing = 0
    this.robot.x = W / 2
    this.robot.facing = 1
    this.bonusStage = everyNthLevel(level, 4)
    if (this.bonusStage) {
      // Sapling run: a row of bare stumps and a short clock.
      for (let i = 0; i < BONUS_STUMPS; i++) {
        const x = 30 + i * ((W - 60) / (BONUS_STUMPS - 1))
        this.trees.push({ x, logs: [], drop: 0, creak: 0, planted: false })
      }
      this.clockMax = 60 * 12
      this.banner = {
        text: 'SAPLING RUN!',
        sub: 'PLANT EVERY STUMP',
        ticks: 120,
      }
    } else {
      const count = Math.floor(levelCurve(level, TIMBER_CURVES.trees))
      const slots = this.pickSlots(count)
      const height = Math.floor(levelCurve(level, TIMBER_CURVES.segments))
      const hive = levelCurve(level, TIMBER_CURVES.hiveChance)
      for (const x of slots) {
        const logs: boolean[] = []
        const tall = height + Math.floor(this.rng() * 3) - 1
        for (let i = 0; i < Math.max(3, tall); i++) {
          logs.push(i > 0 && this.rng() < hive)
        }
        this.trees.push({ x, logs, drop: 0, creak: 0, planted: false })
      }
      this.clockMax =
        60 * Math.round(levelCurve(level, TIMBER_CURVES.clockSeconds))
      this.banner = { text: `GROVE ${level}`, ticks: 90 }
    }
    this.clock = this.clockMax
    this.branchTimer = Math.round(levelCurve(level, TIMBER_CURVES.branchEvery))
    this.beeTimer = Math.round(levelCurve(level, TIMBER_CURVES.beeEvery))
    this.invuln = 60
  }

  /** Choose `count` tree slots, always including one next to the start spot. */
  private pickSlots(count: number): number[] {
    const pool = [...TREE_SLOTS]
    const chosen = [pool.splice(3, 1)[0]!]
    while (chosen.length < count && pool.length) {
      const i = Math.floor(this.rng() * pool.length)
      chosen.push(pool.splice(i, 1)[0]!)
    }
    return chosen.sort((a, b) => a - b)
  }

  private get standing(): Tree[] {
    return this.trees.filter((t) => t.logs.length > 0)
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.clearing > 0) {
      if (--this.clearing <= 0) this.startLevel(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.moveRobot(controls)
    for (const t of this.trees) t.drop = Math.max(0, t.drop - 3)
    if (!this.bonusStage && this.planting === 0) {
      this.spawnHazards()
    }
    this.moveBranches()
    this.moveBees()
    this.runClock()
    this.collide()
    this.checkCleared()
  }

  private moveRobot(input: InputFrame) {
    const r = this.robot
    if (this.invuln > 0) this.invuln--
    // Ducking always wins, even mid-swing: a bee should never be unavoidable.
    r.ducking = input.held.down
    if (r.ducking) this.swing = 0
    if (this.swing > 0) this.swing--
    if (!r.ducking && this.swing === 0) {
      let dx = 0
      if (input.held.left) dx -= 1
      if (input.held.right) dx += 1
      if (dx) {
        r.facing = dx
        r.x = Math.max(10, Math.min(W - 10, r.x + dx * WALK))
        r.step++
      }
      if (input.pressed.a) this.act()
    }
  }

  /** A: chop the trunk in front of you, or plant a sapling in a stump. */
  private act() {
    const r = this.robot
    const facingTree = this.standing
      .filter((t) => inReach(r.x, t.x) && Math.sign(t.x - r.x) !== -r.facing)
      .sort((a, b) => Math.abs(a.x - r.x) - Math.abs(b.x - r.x))[0]
    this.swing = SWING_TICKS
    if (facingTree) {
      this.chop(facingTree)
      return
    }
    const stump = this.trees
      .filter((t) => !t.logs.length && !t.planted && inReach(r.x, t.x))
      .sort((a, b) => Math.abs(a.x - r.x) - Math.abs(b.x - r.x))[0]
    if (stump) {
      stump.planted = true
      this.addScore(this.bonusStage ? 500 : 300, stump.x, GROUND - 30)
      this.sparkle(stump.x, GROUND - 10)
      this.sound.play('pickup')
      return
    }
    this.sound.play('blip')
  }

  private chop(tree: Tree) {
    const hive = tree.logs.shift()
    tree.drop = SEG_H
    const away = Math.sign(tree.x - this.robot.x) || this.robot.facing
    // The chopped log spins off the far side of the trunk.
    this.chips.push({
      x: tree.x,
      y: GROUND - SEG_H / 2,
      vx: away * 3.2,
      vy: -2.5,
      life: 45,
      color: '#a16207',
      spin: 0,
    })
    for (let i = 0; i < 6; i++) {
      this.chips.push({
        x: tree.x - away * 8,
        y: GROUND - 10 - this.rng() * 10,
        vx: -away * (0.5 + this.rng() * 1.5),
        vy: -1 - this.rng() * 2,
        life: 25,
        color: '#fde68a',
      })
    }
    this.sound.play('shoot')
    if (tree.logs.length === 0) {
      this.addScore(200, tree.x, GROUND - 40)
      this.banner = { text: 'TIMBER!', ticks: 40 }
      this.sound.play('boom')
      this.branches = this.branches.filter(
        (b) => b.landed > 0 || Math.abs(b.x - tree.x) > 30,
      )
    } else {
      this.addScore(50, tree.x, GROUND - SEG_H * 2)
    }
    if (hive) {
      // A beehive tumbles out: its bee hovers, then charges past the trunk.
      this.bees.push({
        x: tree.x,
        y: BEE_Y,
        dir: -away,
        speed: levelCurve(this.level, TIMBER_CURVES.beeSpeed) + 0.3,
        hover: 40,
        phase: 0,
      })
      this.sound.play('warn')
    }
  }

  private spawnHazards() {
    const trees = this.standing.filter((t) => t.logs.length >= 3)
    if (--this.branchTimer <= 0) {
      const tree = trees[Math.floor(this.rng() * trees.length)]
      if (tree && tree.creak === 0) tree.creak = 45
      this.branchTimer = Math.round(
        levelCurve(this.level, TIMBER_CURVES.branchEvery) *
          (0.75 + this.rng() * 0.5),
      )
    }
    for (const tree of this.trees) {
      if (tree.creak > 0 && --tree.creak === 0 && tree.logs.length) {
        const side = this.rng() < 0.5 ? -1 : 1
        this.branches.push({
          x: tree.x + side * 14,
          y: GROUND - tree.logs.length * SEG_H,
          vy: 0,
          side,
          landed: 0,
        })
      } else if (tree.creak === 30) {
        this.sound.play('warn')
      }
    }
    if (this.level >= 2 && --this.beeTimer <= 0) {
      const dir = this.rng() < 0.5 ? 1 : -1
      this.bees.push({
        x: dir > 0 ? -10 : W + 10,
        y: BEE_Y,
        dir,
        speed: levelCurve(this.level, TIMBER_CURVES.beeSpeed),
        hover: 0,
        phase: this.rng() * 6,
      })
      this.beeTimer = Math.round(
        levelCurve(this.level, TIMBER_CURVES.beeEvery) *
          (0.7 + this.rng() * 0.6),
      )
    }
  }

  private moveBranches() {
    for (const b of this.branches) {
      if (b.landed > 0) {
        b.landed++
        continue
      }
      b.vy = Math.min(5, b.vy + 0.15)
      b.y += b.vy
      if (b.y >= GROUND - 4) {
        b.y = GROUND - 4
        b.landed = 1
        this.sound.play('pop')
      }
    }
    this.branches = this.branches.filter((b) => b.landed < 70)
  }

  private moveBees() {
    for (const bee of this.bees) {
      bee.phase += 0.25
      if (bee.hover > 0) {
        bee.hover--
        continue
      }
      bee.x += bee.dir * bee.speed
    }
    this.bees = this.bees.filter((b) => b.x > -20 && b.x < W + 20)
  }

  private runClock() {
    if (this.planting > 0) {
      if (--this.planting <= 0) this.finishGrove()
      return
    }
    if (--this.clock > 0) return
    if (this.bonusStage) {
      this.finishGrove()
      return
    }
    this.banner = { text: 'OUT OF TIME', ticks: 80 }
    this.loseLife()
  }

  private collide() {
    if (this.invuln > 0) return
    const r = this.robot
    const top = GROUND - (r.ducking ? DUCK_H : ROBOT_H)
    for (const b of this.branches) {
      if (b.landed) continue
      if (Math.abs(b.x - r.x) < 17 && b.y + 4 > top && b.y - 4 < GROUND) {
        this.loseLife()
        return
      }
    }
    for (const bee of this.bees) {
      if (Math.abs(bee.x - r.x) < 10 && bee.y + 4 > top) {
        this.loseLife()
        return
      }
    }
  }

  private checkCleared() {
    if (this.planting > 0 || this.standing.length) return
    const bare = this.trees.some((t) => !t.planted)
    if (this.bonusStage) {
      if (!bare) this.finishGrove()
      return
    }
    if (bare) {
      // Every trunk is down: a short calm to plant the stumps.
      this.planting = PLANT_WINDOW
      this.bees = []
      this.branches = this.branches.filter((b) => b.landed > 0)
      this.banner = { text: 'ALL CLEAR!', sub: 'PLANT THE STUMPS', ticks: 90 }
      this.sound.play('level')
    } else {
      this.finishGrove()
    }
  }

  private finishGrove() {
    const planted = this.trees.filter((t) => t.planted).length
    const allPlanted = planted === this.trees.length
    if (!this.bonusStage) {
      const seconds = Math.ceil(this.clock / 60)
      this.addScore(seconds * 10 * this.level, W / 2, 120)
    }
    if (allPlanted) {
      this.addScore(this.bonusStage ? 3000 : 1000, W / 2, 140)
      this.banner = {
        text: 'GREEN GROVE!',
        sub: 'EVERY STUMP PLANTED',
        ticks: 90,
      }
    } else {
      this.banner = { text: 'GROVE CLEARED', ticks: 90 }
    }
    this.sound.play('level')
    this.planting = 0
    this.clearing = 90
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = 90
    this.swing = 0
    this.burst(this.robot.x, GROUND - 14, 24, '#5eead4')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    this.alive = true
    this.invuln = 120
    this.branches = []
    this.bees = []
    for (const t of this.trees) t.creak = 0
    this.clock = Math.max(this.clock, Math.round(this.clockMax / 2))
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA ROBOT!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.chips.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1,
        life: 25 + Math.floor(this.rng() * 20),
        color,
      })
    }
  }

  private sparkle(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.chips.push({
        x: x + (this.rng() - 0.5) * 16,
        y,
        vx: (this.rng() - 0.5) * 1.2,
        vy: -0.8 - this.rng() * 1.5,
        life: 35,
        color: i % 2 ? '#86efac' : '#fde68a',
      })
    }
  }

  private updateEffects() {
    for (const c of this.chips) {
      c.x += c.vx
      c.y += c.vy
      c.vy += 0.12
      if (c.spin !== undefined) c.spin += 0.3
      c.life--
    }
    this.chips = this.chips.filter((c) => c.life > 0 && c.y < H + 10)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const r = this.robot
    // Duck any bee about to arrive.
    const bee = this.bees.find(
      (b) =>
        b.hover === 0 &&
        Math.abs(b.x - r.x) < 46 &&
        Math.sign(r.x - b.x) === b.dir,
    )
    if (bee || this.bees.some((b) => Math.abs(b.x - r.x) < 12)) {
      this.pilotSpot = null
      held.down = true
      return frame
    }
    // Step out from under a creaking tree or a falling branch.
    const danger = [
      ...this.branches.filter((b) => !b.landed).map((b) => b.x),
      ...this.trees.filter((t) => t.creak > 0).map((t) => t.x),
    ].find((x) => Math.abs(x - r.x) < 34)
    if (danger !== undefined) {
      this.pilotSpot = null
      const away = r.x < danger ? -1 : 1
      const blocked = (away < 0 && r.x < 30) || (away > 0 && r.x > W - 30)
      if (away < 0 !== blocked) held.left = true
      else held.right = true
      return frame
    }
    const target =
      this.standing.sort(
        (a, b) => Math.abs(a.x - r.x) - Math.abs(b.x - r.x),
      )[0] ??
      this.trees
        .filter((t) => !t.planted)
        .sort((a, b) => Math.abs(a.x - r.x) - Math.abs(b.x - r.x))[0]
    if (!target) return frame
    if (target !== this.pilotTarget) {
      this.pilotTarget = target
      this.pilotSpot = null
    }
    // Stand anywhere in reach but not right on the trunk, then face it. Once
    // the pilot decides to reposition it commits to a spot, so turning toward
    // the trunk (a short step) never sends it back and forth.
    const gap = Math.abs(target.x - r.x)
    if (
      this.pilotSpot === null &&
      (!inReach(r.x, target.x) || (target.logs.length > 0 && gap < 8))
    ) {
      this.pilotSpot = target.x + (r.x <= target.x ? -1 : 1) * 18
    }
    if (this.pilotSpot !== null) {
      if (Math.abs(this.pilotSpot - r.x) < 2) {
        this.pilotSpot = null
      } else {
        if (this.pilotSpot < r.x) held.left = true
        else held.right = true
        return frame
      }
    }
    if (target.logs.length && Math.sign(target.x - r.x) !== r.facing) {
      if (target.x < r.x) held.left = true
      else held.right = true
      return frame
    }
    if (this.swing === 0 && this.tick % 4 === 0) frame.pressed.a = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGrove(g)
    for (const t of this.trees) this.renderTree(g, t)
    for (const b of this.branches) this.renderBranch(g, b)
    for (const c of this.chips) {
      g.globalAlpha = Math.max(0, Math.min(1, c.life / 25))
      g.fillStyle = c.color
      if (c.spin !== undefined) {
        g.save()
        g.translate(c.x, c.y)
        g.rotate(c.spin)
        g.fillRect(-9, -6, 18, 12)
        g.fillStyle = '#fde68a'
        g.fillRect(6, -5, 3, 10)
        g.restore()
      } else {
        g.fillRect(c.x - 1, c.y - 1, 2, 2)
      }
    }
    g.globalAlpha = 1
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderRobot(g)
    }
    for (const bee of this.bees) this.renderBee(g, bee)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderGrove(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND)
    sky.addColorStop(0, '#1e1b4b')
    sky.addColorStop(0.6, '#6d28d9')
    sky.addColorStop(1, '#f472b6')
    g.fillStyle = sky
    g.fillRect(0, 0, W, GROUND)
    // Stars and a rainbow arc behind the hills.
    g.fillStyle = '#fef9c3'
    for (let i = 0; i < 28; i++) {
      const x = (i * 97) % W
      const y = 30 + ((i * 53) % 110)
      if ((i + Math.floor(this.tick / 20)) % 7) g.fillRect(x, y, 1, 1)
    }
    const bands = [
      '#f87171',
      '#fb923c',
      '#facc15',
      '#4ade80',
      '#38bdf8',
      '#a78bfa',
    ]
    g.lineWidth = 4
    bands.forEach((color, i) => {
      g.strokeStyle = color
      g.globalAlpha = 0.35
      g.beginPath()
      g.arc(W / 2, GROUND + 40, 210 - i * 4, Math.PI, 0)
      g.stroke()
    })
    g.globalAlpha = 1
    // A big moon and, on the far hills, the living forest this grove will become.
    g.fillStyle = '#fef3c7'
    g.beginPath()
    g.arc(W - 70, 72, 18, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#7c3aed'
    g.beginPath()
    g.arc(W - 62, 66, 15, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#3b0764'
    for (let x = -10; x < W + 20; x += 23) {
      const base = GROUND - 30 - Math.sin(x / 47) * 14
      const tall = 26 + ((x * 7) % 17)
      g.beginPath()
      g.moveTo(x - 10, base)
      g.lineTo(x, base - tall)
      g.lineTo(x + 10, base)
      g.fill()
    }
    g.fillStyle = '#4c1d95'
    g.beginPath()
    g.moveTo(0, GROUND)
    for (let x = 0; x <= W; x += 20) {
      g.lineTo(x, GROUND - 26 - Math.sin(x / 47) * 14)
    }
    g.lineTo(W, GROUND)
    g.fill()
    g.fillStyle = '#166534'
    g.fillRect(0, GROUND, W, H - GROUND)
    g.fillStyle = '#22c55e'
    g.fillRect(0, GROUND, W, 3)
    g.fillStyle = '#15803d'
    for (let x = 4; x < W; x += 11)
      g.fillRect(x, GROUND + 6 + (x % 3) * 4, 3, 2)
  }

  private renderTree(g: CanvasRenderingContext2D, t: Tree) {
    const shake =
      t.creak > 0 ? Math.sin(this.tick * 1.3) * (t.creak > 20 ? 1 : 2) : 0
    // Stump (always there once the trunk is gone).
    g.fillStyle = '#78350f'
    g.fillRect(t.x - TRUNK_W / 2 - 2, GROUND - 8, TRUNK_W + 4, 8)
    g.fillStyle = '#d97706'
    g.fillRect(t.x - TRUNK_W / 2, GROUND - 9, TRUNK_W, 3)
    if (!t.logs.length) {
      g.strokeStyle = '#92400e'
      g.lineWidth = 1
      g.strokeRect(t.x - 4, GROUND - 9, 8, 2)
      if (t.planted) this.renderSapling(g, t.x)
      return
    }
    for (let i = 0; i < t.logs.length; i++) {
      const y = GROUND - (i + 1) * SEG_H - t.drop
      const x = t.x - TRUNK_W / 2 + shake * (i / t.logs.length)
      g.fillStyle = i % 2 ? '#78716c' : '#6b6259'
      g.fillRect(x, y, TRUNK_W, SEG_H)
      g.fillStyle = '#57534e'
      g.fillRect(x + 4, y + 3, 2, SEG_H - 6)
      g.fillRect(x + 14, y + 6, 2, SEG_H - 9)
      g.fillStyle = '#a8a29e'
      g.fillRect(x, y, TRUNK_W, 1)
      if (t.logs[i]) {
        // A beehive clinging to this log.
        g.fillStyle = '#facc15'
        g.beginPath()
        g.ellipse(x + TRUNK_W + 3, y + 10, 6, 8, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#a16207'
        g.fillRect(x + TRUNK_W - 2, y + 6, 10, 2)
        g.fillRect(x + TRUNK_W - 2, y + 11, 10, 2)
        g.fillStyle = '#1c1917'
        g.fillRect(x + TRUNK_W + 2, y + 15, 3, 2)
      }
    }
    // Broken, jagged crown with two bare twigs.
    const topY = GROUND - t.logs.length * SEG_H - t.drop
    const x0 = t.x - TRUNK_W / 2 + shake
    g.fillStyle = '#6b6259'
    g.beginPath()
    g.moveTo(x0, topY)
    g.lineTo(x0 + 5, topY - 8)
    g.lineTo(x0 + 10, topY - 2)
    g.lineTo(x0 + 15, topY - 10)
    g.lineTo(x0 + TRUNK_W, topY)
    g.fill()
    g.strokeStyle = '#57534e'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(x0 + 2, topY + 6)
    g.lineTo(x0 - 10, topY - 6)
    g.moveTo(x0 + TRUNK_W - 2, topY + 10)
    g.lineTo(x0 + TRUNK_W + 12, topY)
    g.stroke()
  }

  private renderSapling(g: CanvasRenderingContext2D, x: number) {
    const sway = Math.sin(this.tick / 15 + x) * 1.5
    g.strokeStyle = '#15803d'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(x, GROUND - 9)
    g.lineTo(x + sway, GROUND - 24)
    g.stroke()
    g.fillStyle = '#4ade80'
    g.beginPath()
    g.ellipse(x + sway - 5, GROUND - 22, 5, 3, -0.5, 0, Math.PI * 2)
    g.ellipse(x + sway + 5, GROUND - 25, 5, 3, 0.5, 0, Math.PI * 2)
    g.fill()
  }

  private renderBranch(g: CanvasRenderingContext2D, b: Branch) {
    g.globalAlpha = b.landed ? Math.max(0, 1 - b.landed / 70) : 1
    g.strokeStyle = '#57534e'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(b.x - 13, b.y)
    g.lineTo(b.x + 13, b.y - 2 * b.side)
    g.moveTo(b.x - 2, b.y)
    g.lineTo(b.x + 4, b.y - 7)
    g.stroke()
    g.globalAlpha = 1
  }

  private renderRobot(g: CanvasRenderingContext2D) {
    const r = this.robot
    const h = r.ducking ? DUCK_H : ROBOT_H
    const top = GROUND - h
    const f = r.facing
    const bob = r.ducking ? 0 : Math.floor(r.step / 6) % 2
    g.save()
    g.translate(r.x, 0)
    // Legs.
    g.fillStyle = '#0f766e'
    if (!r.ducking) {
      g.fillRect(-5, GROUND - 7, 4, 7 - bob)
      g.fillRect(1, GROUND - 7, 4, 6 + bob)
    }
    // Body and head.
    g.fillStyle = '#14b8a6'
    g.fillRect(-7, top + 9, 14, h - 15)
    g.fillStyle = '#5eead4'
    g.fillRect(-7, top, 14, 10)
    // Cat ears and gold headphones.
    g.beginPath()
    g.moveTo(-7, top)
    g.lineTo(-5, top - 6)
    g.lineTo(-2, top)
    g.moveTo(2, top)
    g.lineTo(5, top - 6)
    g.lineTo(7, top)
    g.fill()
    g.fillStyle = '#facc15'
    g.fillRect(-9, top + 3, 3, 5)
    g.fillRect(6, top + 3, 3, 5)
    // Face.
    g.fillStyle = '#1e1b4b'
    g.fillRect(f > 0 ? 1 : -4, top + 3, 2, 2)
    g.fillRect(f > 0 ? 4 : -1, top + 3, 2, 2)
    g.fillStyle = '#f9a8d4'
    g.fillRect(f > 0 ? 2 : -3, top + 7, 3, 1)
    // Axe: raised during the swing, resting otherwise.
    const raised = this.swing > SWING_TICKS / 2
    g.fillStyle = '#a16207'
    if (raised) {
      g.fillRect(f * 4 - 1, top - 6, 3, 14)
      g.fillStyle = '#e2e8f0'
      g.fillRect(f > 0 ? f * 4 : f * 4 - 6, top - 8, 7, 6)
    } else {
      g.fillRect(f > 0 ? 6 : -16, top + 13, 10, 3)
      g.fillStyle = '#e2e8f0'
      g.fillRect(f > 0 ? 14 : -19, top + 9, 5, 9)
    }
    g.restore()
  }

  private renderBee(g: CanvasRenderingContext2D, bee: Bee) {
    const y = bee.y + Math.sin(bee.phase) * 3
    const flap = Math.floor(bee.phase * 2) % 2
    g.fillStyle = 'rgba(224, 242, 254, 0.8)'
    g.fillRect(bee.x - 4, y - 7 - flap, 4, 4)
    g.fillRect(bee.x + 1, y - 7 - flap, 4, 4)
    g.fillStyle = '#facc15'
    g.beginPath()
    g.ellipse(bee.x, y, 6, 4, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1c1917'
    g.fillRect(bee.x - 2, y - 4, 2, 8)
    g.fillRect(bee.x + 2, y - 4, 1, 8)
    // Grumpy brow, facing the way it flies.
    g.fillRect(bee.x + bee.dir * 4 - 1, y - 2, 3, 1)
    if (bee.hover > 0 && Math.floor(this.tick / 6) % 2) {
      drawText(g, '!', bee.x, y - 18, { align: 'center', color: '#fde68a' })
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 8, 6, {
      scale: 2,
      color: '#86efac',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W / 2, 6, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawText(g, '*', W - 14 - i * 14, 6, {
        scale: 2,
        color: '#f9a8d4',
        shadow,
      })
    }
    drawText(
      g,
      this.bonusStage ? 'SAPLING RUN' : `GROVE ${this.level}`,
      8,
      H - 14,
      {
        color: '#bbf7d0',
      },
    )
    // Clock bar: it turns red in the last few seconds.
    const left =
      this.planting > 0
        ? this.planting / PLANT_WINDOW
        : this.clock / this.clockMax
    const low = this.planting === 0 && this.clock < 60 * 6
    g.fillStyle = '#052e16'
    g.fillRect(W - 130, H - 16, 120, 8)
    g.fillStyle = low && Math.floor(this.tick / 8) % 2 ? '#f87171' : '#facc15'
    g.fillRect(W - 130, H - 16, 120 * Math.max(0, left), 8)
    drawText(g, this.planting > 0 ? 'PLANT' : 'TIME', W - 136, H - 15, {
      align: 'right',
      color: '#fde68a',
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 70, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#166534',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 38, {
          scale: 2,
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const timberBot: ArcadeGameModule = {
  create: (options) => new TimberBot(options),
}

export const create = timberBot.create
export default timberBot
