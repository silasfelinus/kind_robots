// /utils/arcade/games/zuzuGhostTrail.ts
//
// Zuzu: Ghost Trail -- the Kind Robots Arcade's Ghosts 'n Goblins riff
// (conductor kr-arcade/t-009 game factory, all four slices: the poncho rule,
// throwables and pickups, bosses, and stage progression through four trails). Zuzu, the koala ronin, walks a haunted weird-west trail
// through a ghost town at dusk, throwing kunai at restless spirits that claw
// up out of the dirt, storm crows and bone hyenas.
//
// The poncho rule, as in the classic: the first hit knocks Zuzu's poncho and
// kasa off, leaving him in his tunic; a second hit sends him back to the last
// checkpoint. Crates along the trail hide a fresh poncho. Jumps are committed
// once he leaves the ground. Left/right walk, Up or B jumps, A throws kunai.
//
// Gear, as in the classic's weapon pickups: crates and the bundles some crows
// carry hold a new throwable, and picking one up replaces the current one.
// Shuriken fly three ways, the spare kasa boomerangs back through everything
// in its path, a lantern lobs and leaves a ground fire that even catches
// spirits still in the dirt, and the iai cut is a short, strong katana slash.
//
// The trails run in turn and then loop, harder each time: the Ghost Town,
// the Bone Yard (more spirits), the Drowned Watering Hole (water in every pit,
// more crows) and the Bell Tower (bone hyenas on the prowl).
//
// Bosses from the thin places guard the mission gate: the arena locks, the
// gate stays barred, and the boss alternates by trail. The Dust Devil whirls
// back and forth flinging dust clods; the Bone Bull paws, charges (jump it;
// its charge shrugs off hits) and staggers when it slams the arena wall.
//
// Zuzu's canon (CAST-PICKS.md, VIDEO-GUARDRAILS.md): short and stocky,
// rust-brown poncho with orange zigzag trim, a wide straw kasa that shades his
// eyes, the katana across his back with the hilt over his right shoulder, and
// never a smile.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND_Y = 208
const STAGE_END = 3520
const CHECKPOINT_X = 1800
const GRAVITY = 0.3
const JUMP_VY = -5.4
const WALK = 1.3
const JUMP_VX = 2
const KUNAI_SPEED = 4.5
const INVULN_TICKS = 100
const DEATH_TICKS = 110
const CLEAR_TICKS = 160
const VICTORY_TICKS = 180
const STAGE_TICKS = 60 * 150
const START_LIVES = 3
const EXTRA_EVERY = 20_000
/** The boss arena: the last screen, with the barred mission gate in view. */
const ARENA_X = STAGE_END - W + 60
const BOSS_POINTS = 5000
const BOSS_DYING_TICKS = 70
// Advancing through a trail earns a finite encounter budget. Camping cannot
// turn endlessly respawning spirits into unlimited score or extra lives.
export const ENCOUNTER_STEP = 112
export const ENCOUNTERS_PER_STEP = 2
export const MAX_ENCOUNTER_CREDITS = 6

export function advanceEncounterBudget(
  frontier: number,
  credits: number,
  x: number,
) {
  const reached = Math.max(0, Math.floor((x - 40) / ENCOUNTER_STEP))
  if (reached <= frontier) return { frontier, credits }
  return {
    frontier: reached,
    credits: Math.min(
      MAX_ENCOUNTER_CREDITS,
      credits + (reached - frontier) * ENCOUNTERS_PER_STEP,
    ),
  }
}

type StageKey = 'town' | 'boneyard' | 'waterhole' | 'belltower'
type Stage = {
  key: StageKey
  name: string
  /** Solid ground runs, with pits between them. */
  ground: Array<[number, number]>
  /** Raised ledges you can land on from above (and jump up through). */
  boardwalks: Array<{ x: number; y: number; w: number }>
  /** Solid blocks (tombstones, rocks, adobe): jump over them. */
  tombstones: number[]
  /** Crates: any weapon breaks them open. 'gear' is a weapon other than the one in hand. */
  crates: Array<{ x: number; holds: Holding }>
  /** Spawn-interval multipliers: below 1, that foe comes more often. */
  rates: { spirit: number; crow: number; hyena: number }
  secret: { x: number; y: number }
  sky: [string, string, string]
  mesa: string
  soil: [string, string, string]
}

/** Every trail keeps the checkpoint at CHECKPOINT_X and open ground through the arena. */
const STAGES: Stage[] = [
  {
    key: 'town',
    name: 'GHOST TOWN',
    ground: [
      [0, 620],
      [664, 1160],
      [1204, 1720],
      [1764, 2420],
      [2466, 2920],
      [2964, 3700],
    ],
    boardwalks: [
      { x: 300, y: 164, w: 96 },
      { x: 900, y: 156, w: 80 },
      { x: 1380, y: 148, w: 112 },
      { x: 2000, y: 160, w: 120 },
      { x: 2590, y: 152, w: 96 },
      { x: 3120, y: 156, w: 104 },
    ],
    tombstones: [452, 1010, 1600, 2210, 2760, 3130],
    crates: [
      { x: 560, holds: 'gear' },
      { x: 820, holds: 'nugget' },
      { x: 1300, holds: 'gear' },
      { x: 1930, holds: 'poncho' },
      { x: 2340, holds: 'gear' },
      { x: 2700, holds: 'poncho' },
      { x: 3050, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    rates: { spirit: 1, crow: 1, hyena: 1 },
    secret: { x: 346, y: 150 },
    sky: ['#0f1b3d', '#3b4a7a', '#b8743a'],
    mesa: '#2a2350',
    soil: ['#7c5a32', '#a07a45', '#5c4026'],
  },
  {
    key: 'boneyard',
    name: 'THE BONE YARD',
    ground: [
      [0, 520],
      [564, 1100],
      [1144, 1540],
      [1584, 2300],
      [2344, 2860],
      [2904, 3700],
    ],
    boardwalks: [
      { x: 250, y: 160, w: 90 },
      { x: 1200, y: 150, w: 100 },
      { x: 1900, y: 156, w: 110 },
      { x: 2560, y: 150, w: 90 },
    ],
    tombstones: [380, 760, 980, 1300, 1700, 2050, 2500, 2700, 3100],
    crates: [
      { x: 440, holds: 'gear' },
      { x: 860, holds: 'nugget' },
      { x: 1380, holds: 'gear' },
      { x: 1950, holds: 'poncho' },
      { x: 2200, holds: 'gear' },
      { x: 2620, holds: 'poncho' },
      { x: 3000, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    rates: { spirit: 0.9, crow: 1.2, hyena: 1.1 },
    secret: { x: 295, y: 146 },
    sky: ['#1a0f2e', '#5b3a6e', '#c2703d'],
    mesa: '#3b2448',
    soil: ['#a8916a', '#d6c7a1', '#8a7552'],
  },
  {
    key: 'waterhole',
    name: 'DROWNED WATERING HOLE',
    ground: [
      [0, 460],
      [504, 900],
      [944, 1320],
      [1364, 1740],
      [1784, 2200],
      [2244, 2620],
      [2664, 3000],
      [3044, 3700],
    ],
    boardwalks: [
      { x: 560, y: 162, w: 100 },
      { x: 1420, y: 152, w: 96 },
      { x: 2300, y: 158, w: 110 },
      { x: 2700, y: 150, w: 90 },
    ],
    tombstones: [300, 700, 1150, 1500, 2000, 2450, 2850, 3150],
    crates: [
      { x: 620, holds: 'gear' },
      { x: 820, holds: 'nugget' },
      { x: 1240, holds: 'gear' },
      { x: 1900, holds: 'poncho' },
      { x: 2100, holds: 'gear' },
      { x: 2520, holds: 'poncho' },
      { x: 2930, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    rates: { spirit: 1.2, crow: 0.7, hyena: 1.2 },
    secret: { x: 608, y: 148 },
    sky: ['#04161f', '#16445a', '#4f8a8b'],
    mesa: '#0f2f3d',
    soil: ['#4a3b2a', '#6b5a3e', '#2f2519'],
  },
  {
    key: 'belltower',
    name: 'THE BELL TOWER',
    ground: [
      [0, 700],
      [744, 1240],
      [1284, 1700],
      [1744, 2480],
      [2524, 3000],
      [3044, 3700],
    ],
    boardwalks: [
      { x: 350, y: 158, w: 110 },
      { x: 820, y: 150, w: 110 },
      { x: 1350, y: 146, w: 120 },
      { x: 1950, y: 152, w: 120 },
      { x: 2600, y: 150, w: 110 },
    ],
    tombstones: [520, 1000, 1500, 2100, 2350, 2800, 3150],
    crates: [
      { x: 460, holds: 'gear' },
      { x: 880, holds: 'nugget' },
      { x: 1150, holds: 'gear' },
      { x: 1900, holds: 'poncho' },
      { x: 2250, holds: 'gear' },
      { x: 2700, holds: 'poncho' },
      { x: 2940, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    rates: { spirit: 1.1, crow: 1, hyena: 0.7 },
    secret: { x: 394, y: 144 },
    sky: ['#2a0f1f', '#7a2f3b', '#e08a4f'],
    mesa: '#4a1f2a',
    soil: ['#9a6a45', '#c08a5a', '#6b4a30'],
  },
]

type Weapon = 'kunai' | 'shuriken' | 'kasa' | 'lantern' | 'katana'
const WEAPONS: Record<
  Weapon,
  { label: string; cooldown: number; max: number; damage: number }
> = {
  kunai: { label: 'KUNAI', cooldown: 14, max: 3, damage: 1 },
  shuriken: { label: 'SHURIKEN', cooldown: 22, max: 3, damage: 1 },
  kasa: { label: 'KASA', cooldown: 20, max: 2, damage: 1 },
  lantern: { label: 'LANTERN', cooldown: 24, max: 2, damage: 2 },
  katana: { label: 'IAI CUT', cooldown: 30, max: 1, damage: 2 },
}
const WEAPON_LIST = Object.keys(WEAPONS) as Weapon[]
const FIRE_TICKS = 70
const MAX_FIRES = 2

export const TRAIL_CURVES = {
  spiritEvery: { start: 150, step: -15, limit: 60 },
  crowEvery: { start: 420, step: -40, limit: 160 },
  hyenaEvery: { start: 520, step: -50, limit: 200 },
  enemySpeed: { start: 1, step: 0.12, limit: 1.7 },
} as const

type Holding = 'poncho' | 'nugget' | 'gear'
type Kind = 'spirit' | 'crow' | 'hyena'
type Foe = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Spirits rise out of the dirt, walk, then sink back. */
  phase: 'rise' | 'walk' | 'sink'
  baseY: number
  /** Some crows carry a bundle of gear and drop it when struck. */
  carrying: boolean
}
type Shot = {
  weapon: Weapon
  x: number
  y: number
  vx: number
  vy: number
  life: number
  t: number
  /** Piercing weapons (kasa, iai cut) strike each foe (and the boss) once. */
  struck: Array<Foe | Boss>
}
type Fire = { x: number; life: number }
type BossKind = 'devil' | 'bull'
type Boss = {
  kind: BossKind
  x: number
  y: number
  vx: number
  hp: number
  maxHp: number
  t: number
  flash: number
  /** The Dust Devil drifts; the Bone Bull paws (its tell), charges, then staggers. */
  mode: 'drift' | 'paw' | 'charge' | 'stunned'
  timer: number
  dying: number
}
type Clod = { x: number; y: number; vx: number; vy: number }
type Crate = { x: number; holds: Holding; open: boolean }
type Pickup = {
  x: number
  y: number
  vy: number
  kind: 'poncho' | 'nugget' | 'coin' | Weapon
  life: number
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
type Flying = {
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  life: number
}

class ZuzuGhostTrail implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false
  won = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private x = 40
  private y = GROUND_Y
  private vx = 0
  private vy = 0
  private onGround = true
  private facing: 1 | -1 = 1
  private poncho = true
  private stage: Stage = STAGES[0]!
  private weapon: Weapon = 'kunai'
  private invuln = 0
  private throwCooldown = 0
  private throwPose = 0
  private walkPhase = 0
  private checkpoint = 40
  private dead = 0
  private clear = 0
  private victoryTicks = 0
  private timer = STAGE_TICKS
  private camX = 0
  private foes: Foe[] = []
  private shots: Shot[] = []
  private fires: Fire[] = []
  private boss: Boss | null = null
  private bossDone = false
  private clods: Clod[] = []
  private crates: Crate[] = []
  private pickups: Pickup[] = []
  private flying: Flying[] = []
  private spiritTimer = 120
  private crowTimer = 300
  private hyenaTimer = 400
  private encounterFrontier = 0
  private encounterCredits = 2
  private foundSecrets = new Set<StageKey>()
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startStage(1)
  }

  private groundAt(x: number): boolean {
    return this.stage.ground.some(([a, b]) => x >= a && x <= b)
  }

  // --- stage ---------------------------------------------------------------------

  private startStage(lap: number) {
    this.level = lap
    this.checkpoint = 40
    this.bossDone = false
    this.encounterFrontier = 0
    this.encounterCredits = 2
    this.stage = STAGES[(lap - 1) % STAGES.length]!
    this.crates = this.stage.crates.map((c) => ({ ...c, open: false }))
    this.respawn()
    this.banner = {
      text: this.stage.name,
      sub: lap > 1 ? `TRAIL ${lap}` : 'THE TRAIL BEGINS',
      ticks: 110,
    }
  }

  private respawn() {
    this.x = this.checkpoint
    // The camera comes back with him (it also bounds how far back he can walk).
    this.camX = Math.max(0, this.x - 120)
    this.y = GROUND_Y
    this.vx = 0
    this.vy = 0
    this.onGround = true
    this.facing = 1
    this.poncho = true
    this.invuln = INVULN_TICKS
    this.timer = STAGE_TICKS
    this.foes = []
    this.shots = []
    this.fires = []
    this.boss = null
    this.clods = []
    this.pickups = []
    this.spiritTimer = 120
    this.crowTimer = 300
    this.hyenaTimer = 400
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.victoryTicks > 0) {
      if (--this.victoryTicks === 0) this.over = true
      return
    }
    const controls = this.demo ? this.demoInput() : input

    if (this.clear > 0) {
      if (--this.clear === 0) {
        if (this.level >= STAGES.length) {
          this.won = true
          this.victoryTicks = VICTORY_TICKS
          this.banner = {
            text: 'PREVIEW CLEARED',
            sub: `${this.foundSecrets.size}/${STAGES.length} RELICS FOUND`,
            ticks: VICTORY_TICKS,
          }
        } else this.startStage(this.level + 1)
      }
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.respawn()
        }
      }
      return
    }

    if (this.invuln > 0) this.invuln--
    if (this.throwCooldown > 0) this.throwCooldown--
    if (this.throwPose > 0) this.throwPose--
    if (--this.timer <= 0) {
      this.die('THE DUSK TOOK HIM')
      return
    }

    this.move(controls)
    if (this.dead > 0) return
    this.collectSecret()
    if (controls.pressed.a || (controls.held.a && this.throwCooldown === 0))
      this.throw()
    this.spawnFoes()
    this.updateShots()
    this.updateFires()
    this.updateFoes()
    this.updatePickups()
    this.updateBoss()

    if (this.x > CHECKPOINT_X && this.checkpoint < CHECKPOINT_X) {
      this.checkpoint = CHECKPOINT_X
      this.banner = { text: 'CHECKPOINT', ticks: 70 }
      this.sound.play('pickup')
    }
    if (this.x >= STAGE_END && this.bossDone) this.stageClear()
    if (this.boss) this.camX += (ARENA_X - this.camX) * 0.15
    else this.camX = Math.max(0, Math.min(STAGE_END + 80 - W, this.x - 120))
  }

  private move(input: InputFrame) {
    if (this.onGround) {
      this.vx = 0
      if (input.held.left) {
        this.vx = -WALK
        this.facing = -1
      }
      if (input.held.right) {
        this.vx = WALK
        this.facing = 1
      }
      if (this.vx !== 0) this.walkPhase += 0.25
      if (
        input.pressed.up ||
        input.pressed.b ||
        ((input.held.up || input.held.b) && this.onGround)
      ) {
        // A committed jump, as in the classic: no steering once in the air.
        this.vy = JUMP_VY
        this.vx = this.vx === 0 ? 0 : Math.sign(this.vx) * JUMP_VX
        this.onGround = false
        this.sound.play('blip')
      }
    }
    const prevY = this.y
    this.vy += GRAVITY
    let nx = this.x + this.vx
    // Tombstones stop him at their faces.
    for (const t of this.stage.tombstones) {
      const overlapY = this.y > GROUND_Y - 16
      if (overlapY && nx + 5 > t - 6 && nx - 5 < t + 6) {
        nx = this.x < t ? t - 11 : t + 11
      }
    }
    // The gate stays barred until the boss falls.
    const gate = this.bossDone ? STAGE_END + 40 : STAGE_END - 12
    this.x = Math.max(this.camX + 6, Math.min(gate, nx))
    this.y += this.vy
    this.onGround = false
    if (this.vy >= 0) {
      // Land on a boardwalk from above, a tombstone top, or the ground.
      for (const b of this.stage.boardwalks) {
        if (
          this.x > b.x &&
          this.x < b.x + b.w &&
          prevY <= b.y &&
          this.y >= b.y
        ) {
          this.y = b.y
          this.vy = 0
          this.onGround = true
        }
      }
      for (const t of this.stage.tombstones) {
        if (
          Math.abs(this.x - t) < 8 &&
          prevY <= GROUND_Y - 16 &&
          this.y >= GROUND_Y - 16
        ) {
          this.y = GROUND_Y - 16
          this.vy = 0
          this.onGround = true
        }
      }
      if (
        !this.onGround &&
        this.y >= GROUND_Y &&
        prevY <= GROUND_Y &&
        this.groundAt(this.x)
      ) {
        this.y = GROUND_Y
        this.vy = 0
        this.onGround = true
      }
    }
    if (this.y > H + 20) this.die('INTO THE DARK')
  }

  private throw() {
    const spec = WEAPONS[this.weapon]
    const inAir = this.shots.filter((k) => k.weapon === this.weapon).length
    const count = this.weapon === 'shuriken' ? 3 : 1
    if (inAir + count > spec.max) return
    this.throwCooldown = spec.cooldown
    this.throwPose = this.weapon === 'katana' ? 12 : 8
    const f = this.facing
    const shot = (vx: number, vy: number, life: number): Shot => ({
      weapon: this.weapon,
      x: this.x + f * 8,
      y: this.y - 12,
      vx,
      vy,
      life,
      t: 0,
      struck: [],
    })
    if (this.weapon === 'kunai') this.shots.push(shot(f * KUNAI_SPEED, 0, 70))
    else if (this.weapon === 'shuriken')
      for (const vy of [-1.1, 0, 1.1]) this.shots.push(shot(f * 3.8, vy, 36))
    else if (this.weapon === 'kasa') this.shots.push(shot(f * 5, 0, 120))
    else if (this.weapon === 'lantern') this.shots.push(shot(f * 3.2, -2, 90))
    else this.shots.push(shot(0, 0, 10))
    this.sound.play(this.weapon === 'katana' ? 'blip' : 'shoot')
  }

  private spawnFoes() {
    if (this.boss || this.bossDone) return
    const budget = advanceEncounterBudget(
      this.encounterFrontier,
      this.encounterCredits,
      this.x,
    )
    this.encounterFrontier = budget.frontier
    this.encounterCredits = budget.credits
    if (this.encounterCredits <= 0) return
    const speed = levelCurve(this.level, TRAIL_CURVES.enemySpeed)
    if (--this.spiritTimer <= 0) {
      this.spiritTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.spiritEvery) *
          this.stage.rates.spirit *
          (0.7 + this.rng() * 0.6),
      )
      const side = this.rng() < 0.7 ? 1 : -1
      const sx = this.x + side * (50 + this.rng() * 90)
      // Spirits never claw up right at a pit's edge (a landing spot).
      if (
        this.groundAt(sx - 24) &&
        this.groundAt(sx + 24) &&
        sx < STAGE_END - 40 &&
        !this.stage.tombstones.some((t) => Math.abs(t - sx) < 14)
      ) {
        this.encounterCredits--
        this.foes.push({
          kind: 'spirit',
          x: sx,
          y: GROUND_Y + 14,
          vx: 0,
          vy: 0,
          hp: 1,
          t: 0,
          phase: 'rise',
          baseY: GROUND_Y,
          carrying: false,
        })
      }
    }
    if (this.encounterCredits > 0 && --this.crowTimer <= 0) {
      this.crowTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.crowEvery) *
          this.stage.rates.crow *
          (0.7 + this.rng() * 0.6),
      )
      const y = 70 + this.rng() * 60
      this.encounterCredits--
      this.foes.push({
        kind: 'crow',
        x: this.camX + W + 10,
        y,
        vx: -1.4 * speed,
        vy: 0,
        hp: 1,
        t: 0,
        phase: 'walk',
        baseY: y,
        carrying: this.rng() < 0.3,
      })
    }
    if (this.encounterCredits > 0 && --this.hyenaTimer <= 0) {
      this.hyenaTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.hyenaEvery) *
          this.stage.rates.hyena *
          (0.7 + this.rng() * 0.6),
      )
      const hx = this.camX + W + 10
      if (this.groundAt(hx)) {
        this.encounterCredits--
        this.foes.push({
          kind: 'hyena',
          x: hx,
          y: GROUND_Y,
          vx: -1.6 * speed,
          vy: 0,
          hp: 2,
          t: 0,
          phase: 'walk',
          baseY: GROUND_Y,
          carrying: false,
        })
      }
    }
  }

  private updateShots() {
    for (const k of this.shots) {
      k.t++
      k.life--
      if (k.weapon === 'katana') {
        // The iai cut stays in front of him for its few frames.
        k.x = this.x + this.facing * 13
        k.y = this.y - 11
      } else if (k.weapon === 'kasa') {
        // Out, slowing, then home on Zuzu; caught when it reaches him.
        if (k.t < 30) k.x += k.vx * (1 - k.t / 36)
        else {
          const dx = this.x - k.x
          const dy = this.y - 12 - k.y
          const d = Math.hypot(dx, dy) || 1
          k.x += (dx / d) * 5
          k.y += (dy / d) * 5
          if (d < 8) k.life = 0
        }
      } else {
        k.x += k.vx
        k.y += k.vy
        if (k.weapon === 'lantern') {
          k.vy += 0.25
          if (k.y >= GROUND_Y - 2 && this.groundAt(k.x)) {
            this.ignite(k.x)
            k.life = 0
          } else if (k.y > H + 10) k.life = 0
        }
      }
      if (
        (k.weapon === 'kunai' || k.weapon === 'shuriken') &&
        this.stage.tombstones.some(
          (t) => Math.abs(k.x - t) < 6 && k.y > GROUND_Y - 16,
        )
      )
        k.life = 0
      // The iai cut only bites on its first few frames; the rest is follow-through.
      if (k.life <= 0 || (k.weapon === 'katana' && k.t > 4)) continue
      const reach = k.weapon === 'katana' ? 12 : k.weapon === 'kasa' ? 10 : 8
      // A spirit can be hit once it is mostly out of the dirt.
      const foes = this.foes.filter(
        (f) =>
          f.hp > 0 &&
          !k.struck.includes(f) &&
          (f.phase !== 'rise' || f.y < GROUND_Y + 6) &&
          Math.abs(f.x - k.x) < reach &&
          Math.abs(f.y - 8 - k.y) < reach + 2,
      )
      const pierce = k.weapon === 'katana' || k.weapon === 'kasa'
      for (const foe of pierce ? foes : foes.slice(0, 1)) {
        k.struck.push(foe)
        this.strike(foe, WEAPONS[k.weapon].damage, k.x, k.y)
      }
      if (foes.length && !pierce) {
        if (k.weapon === 'lantern') this.ignite(k.x)
        k.life = 0
        continue
      }
      const b = this.boss
      if (
        b &&
        b.dying === 0 &&
        !k.struck.includes(b) &&
        Math.abs(b.x - k.x) < 14 &&
        k.y > b.y - this.bossHeight(b) &&
        k.y < b.y
      ) {
        k.struck.push(b)
        this.hurtBoss(WEAPONS[k.weapon].damage, k.x, k.y)
        if (!pierce) {
          if (k.weapon === 'lantern') this.ignite(k.x)
          k.life = 0
          continue
        }
      }
      const crate = this.crates.find(
        (c) =>
          !c.open && Math.abs(c.x - k.x) < reach + 1 && k.y > GROUND_Y - 18,
      )
      if (crate) {
        if (!pierce) k.life = 0
        this.openCrate(crate)
      }
    }
    this.shots = this.shots.filter(
      (k) => k.life > 0 && Math.abs(k.x - this.x) < W,
    )
  }

  private ignite(x: number) {
    if (!this.groundAt(x)) return
    this.fires.push({ x, life: FIRE_TICKS })
    if (this.fires.length > MAX_FIRES) this.fires.shift()
    this.burst(x, GROUND_Y - 4, 8, '#f97316')
    this.sound.play('pop')
  }

  /** Ground fire burns anything standing in it, even spirits still in the dirt. */
  private updateFires() {
    for (const fire of this.fires) {
      fire.life--
      if (fire.life % 8 !== 0) continue
      for (const f of this.foes)
        if (f.hp > 0 && Math.abs(f.x - fire.x) < 14 && f.y > GROUND_Y - 24)
          this.strike(f, 1, f.x, GROUND_Y - 10)
      if (this.boss && Math.abs(this.boss.x - fire.x) < 16)
        this.hurtBoss(1, this.boss.x, GROUND_Y - 10)
    }
    this.fires = this.fires.filter((f) => f.life > 0)
  }

  // --- bosses -------------------------------------------------------------------

  private bossHeight(b: Boss): number {
    return b.kind === 'devil' ? 38 : 26
  }

  private spawnBoss() {
    const kind: BossKind = this.level % 2 === 1 ? 'devil' : 'bull'
    const hp = Math.round(
      (kind === 'devil' ? 18 : 14) * (1 + (this.level - 1) * 0.25),
    )
    this.boss = {
      kind,
      x: STAGE_END - 50,
      y: GROUND_Y,
      vx: -1,
      hp,
      maxHp: hp,
      t: 0,
      flash: 0,
      mode: kind === 'devil' ? 'drift' : 'paw',
      timer: 90,
      dying: 0,
    }
    // The arena is the boss's alone.
    this.foes = this.foes.filter((f) => f.x < ARENA_X)
    this.banner = {
      text: kind === 'devil' ? 'THE DUST DEVIL' : 'THE BONE BULL',
      sub: 'FROM THE THIN PLACES',
      ticks: 100,
    }
    this.sound.play('warn')
  }

  private updateBoss() {
    this.updateClods()
    const b = this.boss
    if (!b) {
      if (!this.bossDone && this.x > ARENA_X + 60) this.spawnBoss()
      return
    }
    b.t++
    if (b.flash > 0) b.flash--
    if (b.dying > 0) {
      if (b.dying % 6 === 0)
        this.burst(
          b.x + (this.rng() - 0.5) * 24,
          b.y - this.rng() * this.bossHeight(b),
          8,
          b.kind === 'devil' ? '#d6b25e' : '#f5f5f4',
        )
      if (--b.dying === 0) {
        this.boss = null
        this.bossDone = true
        this.banner = { text: 'THE WAY IS OPEN', ticks: 90 }
        this.sound.play('level')
      }
      return
    }
    const speed = levelCurve(this.level, TRAIL_CURVES.enemySpeed)
    if (b.kind === 'devil') {
      b.x += b.vx * 0.8 * speed
      if (b.x < ARENA_X + 16 || b.x > STAGE_END - 20) {
        b.x = Math.max(ARENA_X + 16, Math.min(STAGE_END - 20, b.x))
        b.vx = -b.vx
      }
      // Up close it just whirls; the clods are for keeping him at bay.
      if (--b.timer <= 0 && Math.abs(this.x - b.x) > 75) {
        // A spray of three dust clods lobbed Zuzu's way.
        b.timer = Math.max(55, 100 - this.level * 8)
        const dir = Math.sign(this.x - b.x) || 1
        for (let i = 0; i < 3; i++)
          this.clods.push({
            x: b.x,
            y: b.y - 34,
            vx: dir * (0.9 + i * 0.9),
            vy: -3.6 - i * 0.3,
          })
        this.sound.play('shoot')
      }
    } else if (b.mode === 'paw') {
      if (b.t % 12 === 0) this.burst(b.x, GROUND_Y - 2, 3, '#a07a45')
      if (--b.timer <= 0) {
        b.mode = 'charge'
        b.vx = (Math.sign(this.x - b.x) || -1) * 3.4 * speed
        this.sound.play('warn')
      }
    } else if (b.mode === 'charge') {
      b.x += b.vx
      if (b.x < ARENA_X + 20 || b.x > STAGE_END - 16) {
        b.x = Math.max(ARENA_X + 20, Math.min(STAGE_END - 16, b.x))
        b.mode = 'stunned'
        b.timer = 80
        this.burst(b.x + Math.sign(b.vx) * 14, GROUND_Y - 14, 14, '#a07a45')
        this.sound.play('boom')
      }
    } else if (--b.timer <= 0) {
      b.mode = 'paw'
      b.timer = Math.max(30, 70 - this.level * 6)
    }
    if (
      Math.abs(b.x - this.x) < (b.kind === 'devil' ? 13 : 15) &&
      this.y > b.y - this.bossHeight(b) + 4
    )
      this.hit()
  }

  private updateClods() {
    for (const c of this.clods) {
      c.vy += 0.2
      c.x += c.vx
      c.y += c.vy
      if (Math.abs(c.x - this.x) < 6 && c.y > this.y - 22 && c.y < this.y) {
        c.y = H + 99
        this.hit()
      }
      if (c.y >= GROUND_Y && c.y < H + 50) {
        this.burst(c.x, GROUND_Y - 2, 4, '#a07a45')
        c.y = H + 99
      }
    }
    this.clods = this.clods.filter((c) => c.y < H + 20)
  }

  private hurtBoss(damage: number, x: number, y: number) {
    const b = this.boss
    if (!b || b.dying > 0) return
    if (b.kind === 'bull' && b.mode === 'charge') {
      // Charging, the bull shrugs it off.
      this.burst(x, y, 3, '#9ca3af')
      this.sound.play('blip')
      return
    }
    b.hp -= damage
    b.flash = 6
    this.burst(x, y, 5, '#e5e7eb')
    if (b.hp > 0) return
    b.dying = BOSS_DYING_TICKS
    this.clods = []
    this.addScore(BOSS_POINTS * this.level, b.x, b.y - 50)
    this.sound.play('boom')
  }

  private strike(foe: Foe, damage: number, x: number, y: number) {
    foe.hp -= damage
    this.burst(x, y, 4, '#e5e7eb')
    if (foe.hp <= 0) this.defeat(foe)
  }

  private openCrate(crate: Crate) {
    crate.open = true
    this.drop(
      crate.holds === 'gear' ? this.otherWeapon() : crate.holds,
      crate.x,
      GROUND_Y - 10,
    )
    this.burst(crate.x, GROUND_Y - 8, 10, '#a16207')
    this.sound.play('pop')
  }

  private otherWeapon(): Weapon {
    const choices = WEAPON_LIST.filter((w) => w !== this.weapon)
    return choices[Math.floor(this.rng() * choices.length)] ?? 'kunai'
  }

  private drop(kind: Pickup['kind'], x: number, y: number) {
    this.pickups.push({ x, y, vy: -3, kind, life: 60 * 8 })
  }

  private defeat(f: Foe) {
    this.foes = this.foes.filter((o) => o !== f)
    const points = f.kind === 'hyena' ? 300 : f.kind === 'crow' ? 150 : 100
    this.addScore(points, f.x, f.y - 20)
    const color =
      f.kind === 'spirit'
        ? '#a5f3fc'
        : f.kind === 'crow'
          ? '#475569'
          : '#f5f5f4'
    this.burst(f.x, f.y - 8, 10, color)
    this.sound.play('pop')
    if (f.carrying) this.drop(this.otherWeapon(), f.x, f.y)
    else if (f.kind === 'spirit' && this.rng() < 0.12)
      this.drop('coin', f.x, f.y - 10)
  }

  private updateFoes() {
    const speed = levelCurve(this.level, TRAIL_CURVES.enemySpeed)
    for (const f of this.foes) {
      f.t++
      if (f.kind === 'spirit') {
        if (f.phase === 'rise') {
          f.y -= 0.5
          if (f.y <= f.baseY) {
            f.y = f.baseY
            f.phase = 'walk'
          }
        } else if (f.phase === 'walk') {
          f.x += Math.sign(this.x - f.x) * 0.5 * speed
          if (!this.groundAt(f.x)) f.x -= Math.sign(this.x - f.x) * 0.5 * speed
          if (f.t > 60 * 6) f.phase = 'sink'
        } else {
          f.y += 0.4
          if (f.y > f.baseY + 16) f.hp = -99
        }
      } else if (f.kind === 'crow') {
        // Swoops toward Zuzu's height, then away.
        f.x += f.vx
        const target = this.y - 14
        f.y +=
          Math.max(-1, Math.min(1, (target - f.y) * 0.02)) +
          Math.sin(f.t / 10) * 0.6
      } else {
        f.x += f.vx
        f.vy += GRAVITY
        f.y += f.vy
        if (f.y >= GROUND_Y && this.groundAt(f.x)) {
          f.y = GROUND_Y
          f.vy = 0
          // Leap pits and tombstones.
          const ahead = f.x + Math.sign(f.vx) * 18
          if (
            !this.groundAt(ahead) ||
            this.stage.tombstones.some((t) => Math.abs(t - ahead) < 8)
          )
            f.vy = -5
        }
        if (f.y > H + 20) f.hp = -99
      }
      if (
        f.hp > 0 &&
        f.phase !== 'rise' &&
        Math.abs(f.x - this.x) < 9 &&
        Math.abs(f.y - 8 - (this.y - 10)) < 14
      ) {
        this.hit()
      }
    }
    this.foes = this.foes.filter(
      (f) => f.hp > 0 && f.x > this.camX - 60 && f.x < this.camX + W + 80,
    )
  }

  private updatePickups() {
    for (const p of this.pickups) {
      p.vy += GRAVITY
      p.y += p.vy
      // Pickups settle on the ground (or a boardwalk); over a pit they are lost.
      const deck = this.stage.boardwalks.find(
        (b) => p.x > b.x && p.x < b.x + b.w && p.y - p.vy <= b.y - 6,
      )
      const floor = deck ? deck.y - 6 : GROUND_Y - 6
      if (p.y >= floor && (deck || this.groundAt(p.x))) {
        p.y = floor
        p.vy = 0
      }
      if (p.y > H + 10) p.life = 0
      p.life--
      if (Math.abs(p.x - this.x) < 10 && Math.abs(p.y - (this.y - 8)) < 16) {
        p.life = 0
        if (p.kind === 'poncho') {
          this.poncho = true
          this.floaters.push({ x: p.x, y: p.y - 14, text: 'PONCHO!', life: 50 })
          this.sound.play('extra')
        } else if (p.kind === 'nugget' || p.kind === 'coin') {
          this.addScore(p.kind === 'nugget' ? 500 : 200, p.x, p.y - 14)
          this.sound.play('pickup')
        } else {
          this.weapon = p.kind
          this.throwCooldown = 0
          this.floaters.push({
            x: p.x,
            y: p.y - 14,
            text: WEAPONS[p.kind].label,
            life: 50,
          })
          this.sound.play('pickup')
        }
      }
    }
    this.pickups = this.pickups.filter((p) => p.life > 0)
  }

  /** The poncho rule: first hit knocks the poncho and kasa off; the next one ends him. */
  private hit() {
    if (this.invuln > 0 || this.dead > 0) return
    if (this.poncho) {
      this.poncho = false
      this.invuln = INVULN_TICKS
      this.flying.push({
        x: this.x,
        y: this.y - 18,
        vx: -this.facing * 1.5,
        vy: -3,
        spin: 0,
        life: 70,
      })
      this.vy = -2.5
      this.vx = -this.facing * 0.6
      this.onGround = false
      this.sound.play('warn')
      return
    }
    this.die('STRUCK DOWN')
  }

  private die(text: string) {
    if (this.dead > 0) return
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.x, this.y - 10, 14, '#a16207')
    if (this.poncho)
      this.flying.push({
        x: this.x,
        y: this.y - 18,
        vx: this.facing * 1.2,
        vy: -3.5,
        spin: 0,
        life: 80,
      })
    this.sound.play('die')
    if (this.lives > 0)
      this.banner = { text, sub: 'BACK TO THE CHECKPOINT', ticks: 90 }
  }

  private collectSecret() {
    if (this.foundSecrets.has(this.stage.key)) return
    const { x, y } = this.stage.secret
    if (Math.abs(this.x - x) >= 12 || Math.abs(this.y - 14 - y) >= 13)
      return
    this.foundSecrets.add(this.stage.key)
    this.addScore(800, x, y)
    this.banner = {
      text: 'HIDDEN RELIC',
      sub: `${this.foundSecrets.size}/${STAGES.length} DISCOVERED`,
      ticks: 110,
    }
    this.burst(x, y, 18, '#7dd3fc')
    this.sound.play('extra')
  }

  private stageClear() {
    const timeBonus = Math.floor(this.timer / 60) * 50
    const bonus = 5000 * this.level + timeBonus
    this.addScore(bonus, this.x, this.y - 30)
    this.clear = CLEAR_TICKS
    this.foes = []
    this.banner = {
      text: 'TRAIL CLEARED',
      sub: `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'ONE MORE LIFE', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 18 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.flying) {
      f.x += f.vx
      f.vy += 0.15
      f.y += f.vy
      f.spin += 0.3
      f.life--
    }
    this.flying = this.flying.filter((f) => f.life > 0)
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
    if (this.boss && this.boss.dying === 0) return this.pilotBoss(frame)
    // Deal with whatever is closest, facing it.
    const near = this.foes
      .filter(
        (f) => f.phase !== 'rise' && Math.abs(f.y - 8 - (this.y - 12)) < 22,
      )
      .sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0]
    if (near && Math.abs(near.x - this.x) < 110) {
      const dir = near.x > this.x ? 1 : -1
      if (dir !== this.facing && this.onGround) {
        if (dir > 0) held.right = true
        else held.left = true
        return frame
      }
      // The iai cut only reaches a step ahead: hold still and let it come.
      const reach =
        this.weapon === 'katana' ? 24 : this.weapon === 'lantern' ? 80 : 110
      const gap = Math.abs(near.x - this.x)
      if (this.throwCooldown === 0 && gap < reach) frame.pressed.a = true
      if (gap > 30 || this.weapon === 'katana') return frame
    }
    // Break crates on the way.
    const crate = this.crates.find(
      (c) => !c.open && c.x > this.x && c.x - this.x < 90,
    )
    if (
      crate &&
      this.throwCooldown === 0 &&
      this.facing === 1 &&
      (this.weapon !== 'katana' || crate.x - this.x < 24)
    )
      frame.pressed.a = true
    held.right = true
    if (this.onGround) {
      // Take off close to the edge so the jump clears the whole pit.
      const pit = this.groundAt(this.x) && !this.groundAt(this.x + 12)
      const stone =
        this.stage.tombstones.some((t) => t - this.x > 0 && t - this.x < 20) &&
        this.y > GROUND_Y - 4
      const crateAhead = this.crates.some(
        (c) => !c.open && c.x - this.x > 0 && c.x - this.x < 16,
      )
      // Hold at a pit's edge (throwing) while something is charging across it.
      const charging = this.foes.some((f) => f.x > this.x && f.x - this.x < 110)
      if (pit && charging) {
        held.right = false
        if (this.throwCooldown === 0) frame.pressed.a = true
        return frame
      }
      if ((pit && this.y >= GROUND_Y - 1) || stone || crateAhead) held.up = true
    }
    return frame
  }

  private pilotBoss(frame: InputFrame): InputFrame {
    const b = this.boss!
    const dx = b.x - this.x
    const dir = dx > 0 ? 1 : -1
    // Jump a charging bull.
    // Vault the devil as it drifts in (a committed jump, so take off early).
    const vault =
      b.kind === 'devil' &&
      Math.sign(b.vx) === -dir &&
      Math.abs(dx) < 62 &&
      Math.abs(dx) > 36
    const charging =
      b.mode === 'charge' && Math.sign(b.vx) === -dir && Math.abs(dx) < 80
    if (this.onGround && (charging || vault)) {
      frame.pressed.up = true
      if (vault && dir > 0) frame.held.right = true
      if (vault && dir < 0) frame.held.left = true
      return frame
    }
    if (!this.onGround) return frame
    // Step out from under a clod that will land on him.
    const landing = this.clods
      .map((c) => {
        const drop = c.y - (this.y - 10)
        const t = (-c.vy + Math.sqrt(c.vy * c.vy - 0.4 * drop)) / 0.2
        return c.x + c.vx * t
      })
      .filter((x) => Math.abs(x - this.x) < 12)
    if (landing.length) {
      const away = landing.reduce((a, x) => a + x, 0) / landing.length
      if (away > this.x) frame.held.left = true
      else frame.held.right = true
      return frame
    }
    if (dir !== this.facing) {
      if (dir > 0) frame.held.right = true
      else frame.held.left = true
      return frame
    }
    // Fight from each weapon's reach: a lantern lob carries only so far.
    const want = {
      kunai: 80,
      shuriken: 90,
      kasa: 70,
      lantern: 48,
      katana: 12,
    }[this.weapon]
    if (
      this.throwCooldown === 0 &&
      (this.weapon !== 'katana' || Math.abs(dx) < 30)
    )
      frame.pressed.a = true
    if (Math.abs(dx) > want + 12) {
      if (dir > 0) frame.held.right = true
      else frame.held.left = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    g.save()
    g.translate(-Math.round(this.camX), 0)
    this.renderTown(g)
    this.renderGround(g)
    for (const c of this.crates) if (!c.open) this.renderCrate(g, c.x)
    if (!this.foundSecrets.has(this.stage.key)) this.renderSecret(g)
    for (const p of this.pickups) this.renderPickup(g, p)
    for (const f of this.foes) this.renderFoe(g, f)
    if (this.boss) this.renderBoss(g, this.boss)
    g.fillStyle = '#7c5a32'
    for (const c of this.clods) {
      g.beginPath()
      g.arc(c.x, c.y, 3, 0, Math.PI * 2)
      g.fill()
    }
    for (const fire of this.fires) this.renderFire(g, fire)
    for (const k of this.shots) this.renderShot(g, k)
    for (const f of this.flying) this.renderFlyingKasa(g, f)
    if (this.dead === 0 && !this.over) this.renderZuzu(g)
    else if (this.dead > 0) this.renderFallen(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    g.restore()
    this.renderHud(g)
  }

  private renderSecret(g: CanvasRenderingContext2D) {
    const { x, y } = this.stage.secret
    const pulse = (Math.sin(this.tick / 15) + 1) / 2
    g.save()
    g.translate(x, y)
    g.rotate(Math.PI / 4)
    g.fillStyle = '#0f172a'
    g.fillRect(-6, -6, 12, 12)
    g.fillStyle = pulse > 0.5 ? '#7dd3fc' : '#fef3c7'
    g.fillRect(-4, -4, 8, 8)
    g.fillStyle = '#fff'
    g.fillRect(-1, -1, 2, 2)
    g.restore()
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, this.stage.sky[0])
    sky.addColorStop(0.65, this.stage.sky[1])
    sky.addColorStop(1, this.stage.sky[2])
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // A big pale moon, parallax-slow.
    const mx = 250 - ((this.camX * 0.05) % 400)
    g.fillStyle = '#e2e8f0'
    g.beginPath()
    g.arc(mx, 52, 22, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(15, 27, 61, 0.35)'
    g.beginPath()
    g.arc(mx + 7, 48, 18, 0, Math.PI * 2)
    g.fill()
    // Distant mesas.
    g.fillStyle = this.stage.mesa
    for (let i = 0; i < 6; i++) {
      const x = ((((i * 140 - this.camX * 0.25) % 840) + 840) % 840) - 120
      g.fillRect(x, 150, 90, 60)
      g.fillRect(x + 12, 138, 60, 14)
    }
  }

  private renderTown(g: CanvasRenderingContext2D) {
    if (this.stage.key === 'town') this.renderShacks(g)
    else if (this.stage.key === 'boneyard') this.renderBoneYard(g)
    else if (this.stage.key === 'waterhole') this.renderWaterHole(g)
    else this.renderMission(g)
    this.renderGate(g)
  }

  private renderBoneYard(g: CanvasRenderingContext2D) {
    for (let x = 160; x < STAGE_END; x += 300) {
      // A great ribcage half sunk in the sand.
      g.strokeStyle = '#d6d3d1'
      g.lineWidth = 3
      for (let i = 0; i < 5; i++) {
        const r = 30 - Math.abs(i - 2) * 5
        g.beginPath()
        g.arc(x + i * 14, GROUND_Y, r, Math.PI, Math.PI * 1.5)
        g.stroke()
      }
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(x - 4, GROUND_Y - 30)
      g.lineTo(x + 60, GROUND_Y - 22)
      g.stroke()
      // A cow skull on a post, and a saguaro.
      const px = x + 130
      g.fillStyle = '#57534e'
      g.fillRect(px, GROUND_Y - 34, 3, 34)
      g.fillStyle = '#e7e5e4'
      g.fillRect(px - 3, GROUND_Y - 42, 9, 7)
      g.fillRect(px - 8, GROUND_Y - 44, 5, 2)
      g.fillRect(px + 6, GROUND_Y - 44, 5, 2)
      g.fillStyle = '#292524'
      g.fillRect(px - 1, GROUND_Y - 40, 2, 2)
      g.fillRect(px + 2, GROUND_Y - 40, 2, 2)
      g.fillStyle = '#3f6212'
      g.fillRect(x + 200, GROUND_Y - 44, 8, 44)
      g.fillRect(x + 192, GROUND_Y - 30, 8, 5)
      g.fillRect(x + 192, GROUND_Y - 38, 4, 10)
      g.fillRect(x + 208, GROUND_Y - 24, 8, 5)
      g.fillRect(x + 212, GROUND_Y - 34, 4, 12)
    }
  }

  private renderWaterHole(g: CanvasRenderingContext2D) {
    for (let x = 90; x < STAGE_END; x += 280) {
      // A drowned, dead tree.
      g.fillStyle = '#1f2a2e'
      g.fillRect(x, GROUND_Y - 64, 6, 64)
      g.strokeStyle = '#1f2a2e'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(x + 3, GROUND_Y - 44)
      g.lineTo(x - 14, GROUND_Y - 60)
      g.moveTo(x + 3, GROUND_Y - 54)
      g.lineTo(x + 18, GROUND_Y - 74)
      g.moveTo(x + 12, GROUND_Y - 66)
      g.lineTo(x + 22, GROUND_Y - 64)
      g.stroke()
      // Reeds along the bank.
      g.fillStyle = '#3f5d3a'
      for (let i = 0; i < 6; i++)
        g.fillRect(
          x + 40 + i * 5,
          GROUND_Y - 8 - (i % 3) * 3,
          1,
          8 + (i % 3) * 3,
        )
    }
    for (let x = 420; x < STAGE_END; x += 700) {
      // A creaking windmill over the old well.
      g.strokeStyle = '#334155'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(x - 12, GROUND_Y)
      g.lineTo(x, GROUND_Y - 90)
      g.lineTo(x + 12, GROUND_Y)
      g.moveTo(x - 8, GROUND_Y - 30)
      g.lineTo(x + 8, GROUND_Y - 30)
      g.moveTo(x - 4, GROUND_Y - 60)
      g.lineTo(x + 4, GROUND_Y - 60)
      g.stroke()
      g.lineWidth = 3
      for (let i = 0; i < 4; i++) {
        const a = this.tick / 40 + (i * Math.PI) / 2
        g.beginPath()
        g.moveTo(x, GROUND_Y - 92)
        g.lineTo(x + Math.cos(a) * 18, GROUND_Y - 92 + Math.sin(a) * 18)
        g.stroke()
      }
    }
  }

  private renderMission(g: CanvasRenderingContext2D) {
    for (let x = 140; x < STAGE_END; x += 260) {
      // Adobe houses with vigas and dark arched doorways.
      const h = 40 + ((x / 260) % 2) * 12
      g.fillStyle = '#b77b4f'
      g.fillRect(x, GROUND_Y - h, 76, h)
      g.fillStyle = '#5c3a22'
      for (let i = 0; i < 5; i++)
        g.fillRect(x + 6 + i * 15, GROUND_Y - h + 6, 4, 3)
      g.fillStyle = '#2b1a10'
      g.fillRect(x + 30, GROUND_Y - 22, 14, 22)
      g.beginPath()
      g.arc(x + 37, GROUND_Y - 22, 7, Math.PI, 0)
      g.fill()
      g.fillRect(x + 56, GROUND_Y - h + 16, 8, 8)
    }
    // The bell tower itself, its bell still swinging.
    const tx = 2460
    g.fillStyle = '#c99567'
    g.fillRect(tx, GROUND_Y - 130, 46, 130)
    g.fillRect(tx - 4, GROUND_Y - 136, 54, 8)
    g.beginPath()
    g.arc(tx + 23, GROUND_Y - 136, 14, Math.PI, 0)
    g.fill()
    g.fillStyle = '#2b1a10'
    g.fillRect(tx + 11, GROUND_Y - 116, 24, 26)
    g.beginPath()
    g.arc(tx + 23, GROUND_Y - 116, 12, Math.PI, 0)
    g.fill()
    const swing = Math.sin(this.tick / 25) * 4
    g.fillStyle = '#ca8a04'
    g.beginPath()
    g.moveTo(tx + 23 + swing, GROUND_Y - 118)
    g.lineTo(tx + 31 + swing, GROUND_Y - 98)
    g.lineTo(tx + 15 + swing, GROUND_Y - 98)
    g.fill()
  }

  private renderShacks(g: CanvasRenderingContext2D) {
    // False-front shacks along the trail, weathered and empty.
    for (let x = 120; x < STAGE_END; x += 260) {
      const h = 46 + ((x / 260) % 3) * 10
      g.fillStyle = '#4a3423'
      g.fillRect(x, GROUND_Y - h, 70, h)
      g.fillStyle = '#5c4030'
      g.fillRect(x - 4, GROUND_Y - h - 12, 78, 14)
      g.fillStyle = '#1c1410'
      g.fillRect(x + 10, GROUND_Y - h + 12, 12, 14)
      g.fillRect(x + 46, GROUND_Y - h + 12, 12, 14)
      g.fillRect(x + 28, GROUND_Y - 24, 14, 24)
      // A swinging shutter.
      g.fillStyle = '#6b4a33'
      g.fillRect(
        x + 46 + Math.sin(this.tick / 30 + x) * 2,
        GROUND_Y - h + 12,
        4,
        14,
      )
    }
  }

  private renderGate(g: CanvasRenderingContext2D) {
    // The mission gate at the trail's end.
    g.fillStyle = '#d6c7a1'
    g.fillRect(STAGE_END, GROUND_Y - 70, 12, 70)
    g.fillRect(STAGE_END + 60, GROUND_Y - 70, 12, 70)
    g.fillRect(STAGE_END - 4, GROUND_Y - 82, 80, 14)
    g.fillStyle = '#a16207'
    g.beginPath()
    g.arc(STAGE_END + 36, GROUND_Y - 92, 7, Math.PI, 0)
    g.fill()
    // Iron bars across the gate until the boss falls.
    if (!this.bossDone) {
      g.fillStyle = '#292524'
      for (let x = STAGE_END + 14; x < STAGE_END + 60; x += 7)
        g.fillRect(x, GROUND_Y - 68, 3, 68)
      g.fillRect(STAGE_END + 12, GROUND_Y - 40, 48, 3)
    }
    // Checkpoint lantern.
    g.fillStyle = '#3f2a14'
    g.fillRect(CHECKPOINT_X, GROUND_Y - 40, 3, 40)
    g.fillStyle = this.checkpoint >= CHECKPOINT_X ? '#fbbf24' : '#57534e'
    g.fillRect(CHECKPOINT_X - 3, GROUND_Y - 46, 9, 8)
  }

  private renderGround(g: CanvasRenderingContext2D) {
    const [soil, crust, speck] = this.stage.soil
    if (this.stage.key === 'waterhole') {
      // Dark water fills every pit.
      const runs = this.stage.ground
      for (let i = 0; i < runs.length - 1; i++) {
        const a = runs[i]![1]
        const b = runs[i + 1]![0]
        g.fillStyle = '#1e5a7a'
        g.fillRect(a, GROUND_Y + 8, b - a, H - GROUND_Y - 8)
        g.fillStyle = '#7dd3fc'
        for (let x = a + 4; x < b - 4; x += 12)
          g.fillRect(x + ((this.tick / 8 + x) % 6), GROUND_Y + 10, 4, 1)
      }
    }
    for (const [a, b] of this.stage.ground) {
      g.fillStyle = soil
      g.fillRect(a, GROUND_Y, b - a, H - GROUND_Y)
      g.fillStyle = crust
      g.fillRect(a, GROUND_Y, b - a, 3)
      g.fillStyle = speck
      for (let x = a + 6; x < b; x += 23)
        g.fillRect(x, GROUND_Y + 8 + (x % 3) * 4, 3, 2)
    }
    for (const b of this.stage.boardwalks) {
      g.fillStyle = '#6b4a2b'
      g.fillRect(b.x, b.y, b.w, 5)
      g.fillStyle = '#3f2a14'
      g.fillRect(b.x + 4, b.y + 5, 3, GROUND_Y - b.y - 5)
      g.fillRect(b.x + b.w - 7, b.y + 5, 3, GROUND_Y - b.y - 5)
      g.fillStyle = '#8b6a43'
      for (let x = b.x; x < b.x + b.w; x += 8) g.fillRect(x, b.y, 1, 5)
    }
    for (const t of this.stage.tombstones) {
      if (this.stage.key === 'waterhole') {
        // A mossy boulder.
        g.fillStyle = '#57534e'
        g.beginPath()
        g.ellipse(t, GROUND_Y - 7, 7, 8, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#4d7c0f'
        g.fillRect(t - 5, GROUND_Y - 14, 6, 2)
        continue
      }
      if (this.stage.key === 'belltower') {
        // A tumbled adobe block.
        g.fillStyle = '#a4683f'
        g.fillRect(t - 6, GROUND_Y - 16, 12, 16)
        g.fillStyle = '#c99567'
        g.fillRect(t - 6, GROUND_Y - 16, 12, 3)
        continue
      }
      g.fillStyle = '#78716c'
      g.fillRect(t - 6, GROUND_Y - 14, 12, 14)
      g.beginPath()
      g.arc(t, GROUND_Y - 14, 6, Math.PI, 0)
      g.fill()
      g.fillStyle = '#44403c'
      g.fillRect(t - 1, GROUND_Y - 16, 2, 8)
      g.fillRect(t - 3, GROUND_Y - 13, 6, 2)
    }
  }

  private renderCrate(g: CanvasRenderingContext2D, x: number) {
    g.fillStyle = '#92400e'
    g.fillRect(x - 8, GROUND_Y - 16, 16, 16)
    g.strokeStyle = '#451a03'
    g.lineWidth = 1
    g.strokeRect(x - 7.5, GROUND_Y - 15.5, 15, 15)
    g.beginPath()
    g.moveTo(x - 7, GROUND_Y - 15)
    g.lineTo(x + 7, GROUND_Y - 1)
    g.stroke()
  }

  private renderPickup(g: CanvasRenderingContext2D, p: Pickup) {
    if (p.life < 90 && Math.floor(this.tick / 5) % 2) return
    if (p.kind === 'poncho') {
      g.fillStyle = '#9a3412'
      g.beginPath()
      g.moveTo(p.x, p.y - 7)
      g.lineTo(p.x + 8, p.y + 5)
      g.lineTo(p.x - 8, p.y + 5)
      g.fill()
      g.fillStyle = '#f97316'
      for (let i = -6; i < 6; i += 4) g.fillRect(p.x + i, p.y + 3, 2, 2)
    } else if (p.kind === 'nugget' || p.kind === 'coin') {
      g.fillStyle = p.kind === 'nugget' ? '#facc15' : '#cbd5e1'
      g.beginPath()
      g.arc(p.x, p.y, p.kind === 'nugget' ? 4 : 3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = p.kind === 'nugget' ? '#fef9c3' : '#f8fafc'
      g.fillRect(p.x - 2, p.y - 2, 2, 2)
    } else {
      // Gear comes wrapped in a glinting bundle with its icon on the front.
      g.fillStyle = '#1c1917'
      g.fillRect(p.x - 7, p.y - 7, 14, 13)
      g.strokeStyle = Math.floor(this.tick / 8) % 2 ? '#fbbf24' : '#f59e0b'
      g.lineWidth = 1
      g.strokeRect(p.x - 6.5, p.y - 6.5, 13, 12)
      this.renderWeaponIcon(g, p.kind, p.x, p.y)
    }
  }

  private renderWeaponIcon(
    g: CanvasRenderingContext2D,
    weapon: Weapon,
    x: number,
    y: number,
  ) {
    if (weapon === 'kunai') {
      g.fillStyle = '#cbd5e1'
      g.fillRect(x - 3, y - 1, 7, 2)
      g.fillStyle = '#7c2d12'
      g.fillRect(x - 5, y - 1, 3, 2)
    } else if (weapon === 'shuriken') {
      g.fillStyle = '#cbd5e1'
      g.fillRect(x - 4, y - 1, 8, 2)
      g.fillRect(x - 1, y - 4, 2, 8)
      g.fillStyle = '#1c1917'
      g.fillRect(x - 1, y - 1, 1, 1)
    } else if (weapon === 'kasa') {
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(x - 5, y + 2)
      g.lineTo(x, y - 3)
      g.lineTo(x + 5, y + 2)
      g.fill()
      g.fillStyle = '#a07d32'
      g.fillRect(x - 5, y + 2, 10, 1)
    } else if (weapon === 'lantern') {
      g.fillStyle = '#7c2d12'
      g.fillRect(x - 2, y - 4, 4, 1)
      g.fillStyle = '#fbbf24'
      g.fillRect(x - 3, y - 3, 6, 6)
      g.fillStyle = '#f97316'
      g.fillRect(x - 1, y - 2, 2, 4)
    } else {
      g.fillStyle = '#e5e7eb'
      g.fillRect(x - 4, y - 1, 8, 1)
      g.fillStyle = '#b91c1c'
      g.fillRect(x - 6, y - 1, 2, 2)
      g.fillStyle = '#facc15'
      g.fillRect(x - 4, y - 2, 1, 3)
    }
  }

  private renderShot(g: CanvasRenderingContext2D, k: Shot) {
    if (k.weapon === 'kunai') {
      g.fillStyle = '#cbd5e1'
      g.fillRect(k.x - 4, k.y - 1, 7, 2)
      g.fillStyle = '#7c2d12'
      g.fillRect(k.x - (k.vx > 0 ? 6 : -3), k.y - 1, 3, 2)
    } else if (k.weapon === 'shuriken') {
      g.fillStyle = '#e2e8f0'
      if (Math.floor(k.t / 3) % 2) {
        g.fillRect(k.x - 3, k.y, 7, 1)
        g.fillRect(k.x, k.y - 3, 1, 7)
      } else {
        for (let i = -2; i <= 2; i++) {
          g.fillRect(k.x + i, k.y + i, 1, 1)
          g.fillRect(k.x + i, k.y - i, 1, 1)
        }
      }
    } else if (k.weapon === 'kasa') {
      g.save()
      g.translate(k.x, k.y)
      g.scale(1, Math.abs(Math.cos(k.t / 3)) * 0.6 + 0.4)
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(-9, 2)
      g.lineTo(0, -4)
      g.lineTo(9, 2)
      g.fill()
      g.fillStyle = '#a07d32'
      g.fillRect(-9, 2, 18, 1)
      g.restore()
    } else if (k.weapon === 'lantern') {
      this.renderWeaponIcon(g, 'lantern', k.x, k.y)
    } else {
      // The iai cut: a bright crescent sweeping in front of him.
      const f = this.facing
      g.save()
      g.globalAlpha = Math.max(0.2, k.life / 10)
      g.strokeStyle = '#e0f2fe'
      g.lineWidth = 2
      g.beginPath()
      const sweep = (10 - k.life) / 10
      g.arc(
        this.x + f * 2,
        this.y - 12,
        14,
        f > 0 ? -1.3 + sweep * 0.4 : Math.PI - 1.1 - sweep * 0.4,
        f > 0 ? 1.1 + sweep * 0.4 : Math.PI + 1.3 - sweep * 0.4,
      )
      g.stroke()
      g.restore()
    }
  }

  private renderFire(g: CanvasRenderingContext2D, fire: Fire) {
    const fade = Math.min(1, fire.life / 20)
    for (let i = -2; i <= 2; i++) {
      const flick = Math.sin(this.tick / 3 + i * 1.7 + fire.x) * 2
      const h = (9 + (2 - Math.abs(i)) * 3 + flick) * fade
      g.fillStyle = '#ea580c'
      g.beginPath()
      g.moveTo(fire.x + i * 4 - 3, GROUND_Y)
      g.lineTo(fire.x + i * 4, GROUND_Y - h)
      g.lineTo(fire.x + i * 4 + 3, GROUND_Y)
      g.fill()
      g.fillStyle = '#fde047'
      g.fillRect(fire.x + i * 4 - 1, GROUND_Y - h * 0.45, 2, h * 0.45)
    }
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    const x = f.x
    const y = f.y
    if (f.kind === 'spirit') {
      // A restless spirit clawing up out of the dirt: pale, ragged, hollow-eyed.
      g.save()
      g.beginPath()
      g.rect(x - 10, 0, 20, GROUND_Y + 1)
      g.clip()
      g.globalAlpha = f.phase === 'sink' ? 0.6 : 0.85
      g.fillStyle = '#a5f3fc'
      g.beginPath()
      g.moveTo(x - 6, y)
      g.lineTo(x - 6, y - 14)
      g.arc(x, y - 14, 6, Math.PI, 0)
      g.lineTo(x + 6, y)
      g.fill()
      g.fillStyle = '#164e63'
      g.fillRect(x - 3, y - 16, 2, 3)
      g.fillRect(x + 1, y - 16, 2, 3)
      g.fillRect(x - 1, y - 11, 2, 2)
      // Reaching arms.
      g.fillStyle = '#a5f3fc'
      const reach = Math.sin(f.t / 8) * 2
      g.fillRect(x + Math.sign(this.x - x) * 6, y - 12 + reach, 5, 2)
      g.restore()
      return
    }
    if (f.kind === 'crow') {
      const flap = Math.floor(f.t / 6) % 2
      g.fillStyle = '#1e293b'
      g.fillRect(x - 5, y - 3, 10, 6)
      g.fillStyle = '#334155'
      g.beginPath()
      g.moveTo(x - 2, y - 2)
      g.lineTo(x + 2, y - (flap ? 10 : 2))
      g.lineTo(x + 6, y - 2)
      g.fill()
      g.fillStyle = '#facc15'
      g.fillRect(x - 8, y - 1, 3, 2)
      g.fillStyle = '#fef08a'
      g.fillRect(x - 4, y - 2, 1, 1)
      if (f.carrying) {
        // A bundle of gear swinging from its talons.
        g.fillStyle = '#78350f'
        g.fillRect(x, y + 3, 1, 3)
        g.fillStyle = '#d97706'
        g.fillRect(x - 3, y + 6, 7, 5)
        g.fillStyle = '#fbbf24'
        g.fillRect(x - 1, y + 6, 2, 1)
      }
      return
    }
    // Bone hyena: a skeletal grin on four quick legs.
    const step = Math.floor(f.t / 5) % 2
    g.fillStyle = '#e7e5e4'
    g.fillRect(x - 8, y - 12, 14, 6)
    g.fillRect(x - 12, y - 15, 6, 6)
    g.fillStyle = '#44403c'
    g.fillRect(x - 11, y - 13, 1, 1)
    g.fillRect(x - 12, y - 11, 4, 1)
    for (let i = 0; i < 4; i++) g.fillRect(x - 6 + i * 3, y - 11, 1, 4)
    g.fillStyle = '#e7e5e4'
    g.fillRect(x - 7, y - 6, 2, 6 - step * 2)
    g.fillRect(x + 3, y - 6, 2, 4 + step * 2)
    g.fillRect(x + 6, y - 13, 4, 2)
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    if (b.dying > 0 && Math.floor(b.dying / 3) % 2) return
    const x = Math.round(b.x)
    const y = b.y
    const white = b.flash > 0
    if (b.kind === 'devil') {
      // A whirling funnel of dust, narrow at the ground, with a bull skull in it.
      for (let i = 0; i < 9; i++) {
        const h = i * 4
        const w = 4 + i * 2
        const sway = Math.sin(b.t / 6 + i * 0.7) * (2 + i * 0.4)
        g.fillStyle = white ? '#ffffff' : i % 2 ? '#c9a46a' : '#a07a45'
        g.fillRect(x - w / 2 + sway, y - h - 4, w, 4)
      }
      const sx = x + Math.sin(b.t / 6 + 4) * 4
      g.fillStyle = white ? '#ffffff' : '#f5f5f4'
      g.fillRect(sx - 4, y - 30, 8, 7)
      g.fillRect(sx - 9, y - 32, 5, 2)
      g.fillRect(sx + 4, y - 32, 5, 2)
      g.fillRect(sx - 10, y - 35, 2, 3)
      g.fillRect(sx + 8, y - 35, 2, 3)
      g.fillStyle = '#f97316'
      g.fillRect(sx - 3, y - 28, 2, 2)
      g.fillRect(sx + 1, y - 28, 2, 2)
      return
    }
    // The Bone Bull: ribs, four legs, a long-horned skull, eyes hot when it means it.
    const f =
      b.mode === 'charge' ? Math.sign(b.vx) : Math.sign(this.x - b.x) || -1
    const step = b.mode === 'charge' ? Math.floor(b.t / 3) % 2 : 0
    g.fillStyle = white ? '#ffffff' : '#e7e5e4'
    g.fillRect(x - 14, y - 22, 24, 3)
    for (let i = 0; i < 5; i++) g.fillRect(x - 12 + i * 5, y - 20, 2, 9)
    g.fillRect(x - 14, y - 12, 24, 2)
    g.fillRect(x - 12, y - 10, 2, 10 - step * 2)
    g.fillRect(x - 7, y - 10, 2, 8 + step * 2)
    g.fillRect(x + 3, y - 10, 2, 10 - step * 2)
    g.fillRect(x + 8, y - 10, 2, 8 + step * 2)
    const hx = x + f * 15
    g.fillRect(hx - 4, y - 24, 8, 9)
    g.fillRect(hx - 9, y - 27, 5, 2)
    g.fillRect(hx + 4, y - 27, 5, 2)
    g.fillRect(hx - 10, y - 31, 2, 4)
    g.fillRect(hx + 8, y - 31, 2, 4)
    g.fillStyle = b.mode === 'stunned' ? '#57534e' : '#dc2626'
    g.fillRect(hx - 3, y - 21, 2, 2)
    g.fillRect(hx + 1, y - 21, 2, 2)
    if (b.mode === 'stunned') {
      // Seeing stars.
      g.fillStyle = '#fde047'
      for (let i = 0; i < 3; i++) {
        const a = b.t / 8 + (i * Math.PI * 2) / 3
        g.fillRect(hx + Math.cos(a) * 8 - 1, y - 36 + Math.sin(a) * 3, 2, 2)
      }
    }
  }

  private renderZuzu(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    const f = this.facing
    const step =
      this.onGround && this.vx !== 0 ? Math.floor(this.walkPhase) % 2 : 0
    // Short legs in dark brown trousers.
    g.fillStyle = '#3f2a1d'
    g.fillRect(x - 4, y - 5, 3, 5 - step)
    g.fillRect(x + 1, y - 5, 3, 4 + step)
    // Katana across the back, hilt over the right shoulder.
    g.fillStyle = '#1c1917'
    g.fillRect(x - f * 5, y - 22, 2, 6)
    g.fillStyle = '#b91c1c'
    g.fillRect(x - f * 5, y - 23, 2, 2)
    if (this.poncho) {
      // The rust-brown poncho with orange zigzag trim.
      g.fillStyle = '#9a3412'
      g.beginPath()
      g.moveTo(x, y - 18)
      g.lineTo(x + 8, y - 4)
      g.lineTo(x - 8, y - 4)
      g.fill()
      g.fillStyle = '#f97316'
      for (let i = -7; i < 7; i += 3)
        g.fillRect(x + i, y - 6 + (i % 2 === 0 ? 0 : -1), 2, 1)
    } else {
      // Just the dark tunic and orange sash.
      g.fillStyle = '#1e3a8a'
      g.fillRect(x - 5, y - 15, 10, 10)
      g.fillStyle = '#ea580c'
      g.fillRect(x - 5, y - 9, 10, 2)
    }
    // The throwing arm.
    if (this.throwPose > 0 && this.weapon === 'katana') {
      // Drawn for the iai cut: arm and blade out front.
      g.fillStyle = '#9ca3af'
      g.fillRect(x + f * 5, y - 13, f * 4, 2)
      g.fillStyle = '#e5e7eb'
      g.fillRect(x + f * 9, y - 13, f * 9, 1)
    } else if (this.throwPose > 0) {
      g.fillStyle = '#9ca3af'
      g.fillRect(x + f * 5, y - 14, f * 5, 2)
    }
    // Koala head: grey, big dark nose, round fuzzy ears.
    g.fillStyle = '#9ca3af'
    g.fillRect(x - 5, y - 24, 10, 8)
    g.fillStyle = '#6b7280'
    g.fillRect(x - 8, y - 25, 4, 5)
    g.fillRect(x + 4, y - 25, 4, 5)
    g.fillStyle = '#d1d5db'
    g.fillRect(x - 7, y - 24, 2, 3)
    g.fillRect(x + 5, y - 24, 2, 3)
    g.fillStyle = '#111827'
    g.fillRect(x + f * 2 - 1, y - 20, 3, 3)
    if (this.poncho) {
      // The wide straw kasa, its brim shading his eyes.
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(x - 11, y - 22)
      g.lineTo(x, y - 30)
      g.lineTo(x + 11, y - 22)
      g.fill()
      g.fillStyle = '#a07d32'
      g.fillRect(x - 11, y - 22, 22, 1)
      g.fillStyle = 'rgba(17, 24, 39, 0.5)'
      g.fillRect(x - 5, y - 21, 10, 2)
      // The katana hilt pokes out past the brim, over his right shoulder.
      g.fillStyle = '#1c1917'
      g.fillRect(x - f * 10, y - 27, 2, 6)
      g.fillStyle = '#b91c1c'
      g.fillRect(x - f * 10, y - 28, 2, 2)
    } else {
      // Bare-headed: a serious, level stare.
      g.fillStyle = '#111827'
      g.fillRect(x - 3 + f, y - 22, 2, 1)
      g.fillRect(x + 1 + f, y - 22, 2, 1)
    }
  }

  private renderFlyingKasa(g: CanvasRenderingContext2D, f: Flying) {
    g.save()
    g.translate(f.x, f.y)
    g.rotate(f.spin)
    g.fillStyle = '#d6b25e'
    g.beginPath()
    g.moveTo(-10, 3)
    g.lineTo(0, -4)
    g.lineTo(10, 3)
    g.fill()
    g.fillStyle = '#9a3412'
    g.fillRect(-6, 4, 12, 4)
    g.restore()
  }

  private renderFallen(g: CanvasRenderingContext2D) {
    // Face down in the dust, still serious about it.
    const x = Math.round(this.x)
    const y = Math.min(Math.round(this.y), GROUND_Y)
    if (this.y > GROUND_Y + 4) return
    g.fillStyle = this.poncho ? '#9a3412' : '#1e3a8a'
    g.fillRect(x - 9, y - 5, 16, 5)
    g.fillStyle = '#9ca3af'
    g.fillRect(x + 6, y - 6, 7, 6)
    g.fillStyle = '#6b7280'
    g.fillRect(x + 10, y - 9, 4, 4)
    g.fillStyle = '#3f2a1d'
    g.fillRect(x - 13, y - 3, 5, 3)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0f1b3d'
    g.fillStyle = 'rgba(15, 27, 61, 0.7)'
    g.fillRect(0, 0, W, 16)
    drawText(g, String(this.score).padStart(7, '0'), 4, 2, {
      scale: 2,
      color: '#fbbf24',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#fca5a5',
    })
    drawText(g, `TRAIL ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#bfdbfe',
    })
    const seconds = Math.ceil(this.timer / 60)
    drawText(g, `TIME ${seconds}`, 100, 1, {
      color:
        seconds <= 20 && Math.floor(this.tick / 10) % 2 ? '#ef4444' : '#fde68a',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(100 + i * 12, 15)
      g.lineTo(105 + i * 12, 10)
      g.lineTo(110 + i * 12, 15)
      g.fill()
    }
    // The gear in hand.
    g.fillStyle = 'rgba(15, 27, 61, 0.7)'
    g.fillRect(0, 16, 20 + WEAPONS[this.weapon].label.length * 6, 11)
    this.renderWeaponIcon(g, this.weapon, 9, 21)
    drawText(g, WEAPONS[this.weapon].label, 18, 18, { color: '#fde68a' })
    drawText(g, `RELICS ${this.foundSecrets.size}/${STAGES.length}`, 4, 29, {
      color: '#7dd3fc',
    })
    // Progress along the trail.
    g.fillStyle = '#1f2937'
    g.fillRect(170, 6, 60, 3)
    g.fillStyle = '#fbbf24'
    g.fillRect(170, 6, Math.min(60, (60 * this.x) / STAGE_END), 3)
    if (this.boss && this.boss.dying === 0) {
      const b = this.boss
      g.fillStyle = 'rgba(15, 27, 61, 0.7)'
      g.fillRect(W / 2 - 62, 18, 124, 16)
      drawText(g, b.kind === 'devil' ? 'DUST DEVIL' : 'BONE BULL', W / 2, 19, {
        align: 'center',
        color: '#fca5a5',
      })
      g.fillStyle = '#1f2937'
      g.fillRect(W / 2 - 58, 28, 116, 3)
      g.fillStyle = '#ef4444'
      g.fillRect(W / 2 - 58, 28, (116 * Math.max(0, b.hp)) / b.maxHp, 3)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#fef3c7',
        shadow: '#7c2d12',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 90, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const zuzuGhostTrail: ArcadeGameModule = {
  create: (options) => new ZuzuGhostTrail(options),
}

export const create = zuzuGhostTrail.create
export default zuzuGhostTrail
