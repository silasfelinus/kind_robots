// /utils/arcade/games/zuzuGhostTrail.ts
//
// Zuzu: Ghost Trail -- the Kind Robots Arcade's Ghosts 'n Goblins riff (conductor kr-arcade t-009 game
// factory; the campaign, t-015..t-020 and ghost-trail/CAMPAIGN-BLUEPRINT.md). Zuzu, the koala ronin,
// walks a haunted weird-west trail, a book of stages, each two or three authored acts, each guarded at
// its end by a boss from the thin places.
//
// The poncho rule, as in the classic: the first hit knocks Zuzu's poncho and kasa off, leaving him in
// his tunic; a second hit sends him back to the last checkpoint. Crates hide a fresh poncho. Jumps are
// committed once he leaves the ground. Left/right walk, Up or B jumps, A throws.
//
// Gear, as in the classic's weapon pickups: crates and the bundles some flyers carry hold a new
// throwable, and picking one up replaces the current one. Shuriken fly three ways, the spare kasa
// boomerangs back through everything in its path, a lantern lobs and leaves a ground fire that even
// catches spirits still in the dirt, and the iai cut is a short, strong katana slash.
//
// The trail is authored, not generated (ghostTrail/world.ts, campaign.ts, acts/): each act's ground and
// pits, ledges, solid blocks, moving platforms, hazards, updrafts and tide, its crates and relics, its
// checkpoints, and the squads waiting along it. A squad appears when Zuzu reaches it; every member has
// a stable id and, once put down, stays down for the run, through deaths and checkpoint retries, so
// nothing can be farmed. A thin ambient trickle is earned only by forward progress (the encounter
// budget below). Foes (ghostTrail/foes.ts) and bosses (ghostTrail/bosses.ts) all telegraph: a tell,
// an active window, a recovery to punish.
//
// Zuzu's canon (CAST-PICKS.md, VIDEO-GUARDRAILS.md): short and stocky, rust-brown poncho with orange
// zigzag trim, a wide straw kasa that shades his eyes, the katana across his back with the hilt over
// his right shoulder, and never a smile.

import { drawText } from '../font'
import {
  drawFlyingKasa,
  drawFlyingPoncho,
  drawZuzu,
  drawZuzuFallen,
  drawZuzuPortrait,
} from '../ghostTrail/heroArt'
import {
  drawBoss,
  drawFire,
  drawFoe,
  drawPickup,
  drawShot,
  drawWeaponIcon,
} from '../ghostTrail/foeArt'
import { drawBanner, drawHud, hitsFor } from '../ghostTrail/hudArt'
import {
  drawBackdrop,
  drawCheckpoint,
  drawCrate,
  drawForeground,
  drawGate,
  drawSecret,
  drawTerrain,
  type StageKey,
  type TerrainStage,
} from '../ghostTrail/stageArt'
import {
  drawBlock,
  drawBolt,
  drawCard,
  drawHazard,
  drawMover,
  drawStandInBoss,
  drawUpdraft,
  drawWater,
  type Card,
} from '../ghostTrail/worldArt'
import {
  ACTS,
  CREDITS,
  RELIC_COUNT,
  TRUE_ENDING,
  stageInfo,
} from '../ghostTrail/campaign'
import {
  FOES,
  makeFoe,
  stepBolt,
  type Bolt,
  type Foe,
  type FoeCtx,
} from '../ghostTrail/foes'
import {
  BOSSES,
  makeBoss,
  type Boss,
  type BossCtx,
  type BossDef,
} from '../ghostTrail/bosses'
import {
  blockTop,
  groundAt,
  hazardLive,
  memberId,
  moverAt,
  tideAt,
  type Act,
  type Encounter,
  type Holding,
  type SquadMember,
  type StageTheme,
} from '../ghostTrail/world'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND_Y = 208
const GRAVITY = 0.3
const JUMP_VY = -5.4
const WALK = 1.3
const JUMP_VX = 2
const KUNAI_SPEED = 4.5
const INVULN_TICKS = 100
const DEATH_TICKS = 110
const CLEAR_TICKS = 160
const START_LIVES = 3
const EXTRA_EVERY = 20_000
const BOSS_POINTS = 5000
const BOSS_DYING_TICKS = 70
/** Zuzu's body: half width, height. */
const BODY_HW = 5
const BODY_H = 22
/** Ticks Zuzu can stay under the tide before it costs him a hit. */
const BREATH_TICKS = 150
/** A title card and a story page close themselves after this long. */
const CARD_TICKS = 420

/** Ambient pressure is budgeted by forward progress, so standing still can never farm. */
export const ENCOUNTER_STEP = 112
export const ENCOUNTERS_PER_STEP = 2
export const MAX_ENCOUNTER_CREDITS = 6

export function advanceEncounterBudget(
  frontier: number,
  credits: number,
  x: number,
): { frontier: number; credits: number } {
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

/** Enemy pace by stage: a little brisker through the book, never a twitch test. */
export const TRAIL_CURVES = {
  enemySpeed: { start: 1, step: 0.06, limit: 1.3 },
  ambientEvery: { start: 260, step: -15, limit: 170 },
}

function curve(
  stage: number,
  c: { start: number; step: number; limit: number },
) {
  const v = c.start + (Math.max(1, stage) - 1) * c.step
  return c.step < 0 ? Math.max(c.limit, v) : Math.min(c.limit, v)
}

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

type Shot = {
  weapon: Weapon
  x: number
  y: number
  vx: number
  vy: number
  life: number
  t: number
  /** Everything this throw has already struck (a kasa or a cut passes through, but hits each once). */
  struck: Array<Foe | Boss>
}
type Fire = { x: number; y: number; life: number }
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
type Pending = { id: string; member: SquadMember; due: number }
/** What happens when the card on screen closes. */
type CardThen = 'play' | 'next' | 'end' | 'choose'

/** The slice's painted worlds; the newer themes borrow the closest until their own art lands. */
const ART_KEY: Record<StageTheme, StageKey> = {
  town: 'town',
  boneyard: 'boneyard',
  waterhole: 'waterhole',
  stormpass: 'boneyard',
  belltower: 'belltower',
  abbey: 'belltower',
}

const BOSS_COLOR: Record<string, string> = {
  marshal: '#fbbf24',
  ferryman: '#2dd4bf',
  matriarch: '#94a3b8',
  heretic: '#f97316',
  abbess: '#e879f9',
}

/**
 * A saved run (utils/arcade/saves.ts): where the current act began, never mid-act state, so a reload
 * replays the act from its start with the score it began with and nothing can be collected twice.
 * After a game over the save is marked `continued`: the trail and relics are kept, the score is not.
 */
export type GhostSave = {
  v: 1
  act: string
  score: number
  lives: number
  weapon: Weapon
  relics: string[]
  continued: boolean
  /** New Game+ tier: 1 on a first run; each campaign clear unlocks the next. */
  tier: number
}

/** The hardest New Game+ tier. */
const MAX_TIER = 5

/** A stored save, validated against this build's campaign; null when unusable. */
export function readSave(raw: unknown): GhostSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1 || typeof r.act !== 'string') return null
  if (!ACTS.some((a) => a.id === r.act)) return null
  if (!count(r.score, 99_999_999) || !count(r.lives, 99)) return null
  if (typeof r.weapon !== 'string' || !(r.weapon in WEAPONS)) return null
  if (!Array.isArray(r.relics)) return null
  const known = new Set(ACTS.flatMap((a) => a.secrets.map((x) => x.id)))
  return {
    v: 1,
    act: r.act,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    weapon: r.weapon as Weapon,
    relics: [
      ...new Set(
        r.relics.filter(
          (x): x is string => typeof x === 'string' && known.has(x),
        ),
      ),
    ],
    continued: r.continued === true,
    tier:
      count(r.tier, MAX_TIER) && (r.tier as number) >= 1
        ? (r.tier as number)
        : 1,
  }
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
  /** Ticks since the act began (movers, hazards and the tide run on it). */
  private actTick = 0
  private actIndex = 0
  private act: Act = ACTS[0]!
  private terrain: TerrainStage = terrainOf(ACTS[0]!)
  private x = 40
  private y = GROUND_Y
  private vx = 0
  private vy = 0
  private onGround = true
  /** The mover he is standing on, if any. */
  private riding: number | null = null
  private facing: 1 | -1 = 1
  private poncho = true
  private weapon: Weapon = 'kunai'
  private invuln = 0
  private throwCooldown = 0
  private throwPose = 0
  private walkPhase = 0
  private underwater = 0
  private checkpoint = 40
  private dead = 0
  private clear = 0
  private timer = 0
  private camX = 0
  private foes: Foe[] = []
  private shots: Shot[] = []
  private fires: Fire[] = []
  private boss: Boss | null = null
  private bossDone = false
  private bolts: Bolt[] = []
  private crates: Crate[] = []
  private pickups: Pickup[] = []
  private flying: Flying[] = []
  private ambientTimer = 200
  private encounterFrontier = 0
  private encounterCredits = 2
  /** Squad members put down this run: they never come back. */
  private defeated = new Set<string>()
  /** Encounters already sprung in this attempt at the act. */
  private triggered = new Set<string>()
  private pending: Pending[] = []
  private foundSecrets = new Set<string>()
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  /** Render bookkeeping: which banner is up and the tick it appeared (for its unfurl). */
  private bannerSeen: ZuzuGhostTrail['banner'] = null
  private bannerFrom = 0
  private card: (Card & { then: CardThen; max: number }) | null = null
  /** Progress the cabinet keeps for this player (see GhostSave); demos never save. */
  save: GhostSave | null = null
  /** New Game+ tier (1 on a first run): tougher bosses and brisker foes. */
  private tier = 1
  /** A saved run offered on the opening card. */
  private offer: GhostSave | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startAct(0)
    const offer = this.demo ? null : readSave(options.resume)
    const fresh = offer && offer.act === ACTS[0]!.id && !offer.relics.length
    if (offer && (!fresh || offer.tier > 1)) {
      this.offer = offer
      // Until the player chooses, the stored run stays as it was.
      this.save = offer
      const act = ACTS.find((a) => a.id === offer.act)!
      const plus = offer.tier > 1 ? `NEW GAME+ ${offer.tier - 1}` : null
      this.showCard({
        kind: 'title',
        heading: fresh && plus ? plus : 'CONTINUE?',
        sub: fresh ? 'THE DEAD STIR AGAIN, STRONGER' : 'THE TRAIL REMEMBERS',
        lines: [
          ...(plus && !fresh ? [plus] : []),
          `STAGE ${act.stage} - ACT ${act.act}: ${act.actName}`,
          act.stageName,
          offer.continued
            ? 'SCORE STARTS AGAIN FROM ZERO'
            : `SCORE ${offer.score}  LIVES ${offer.lives}`,
          `${offer.relics.length}/${RELIC_COUNT} RELICS FOUND`,
          '',
          'A: CONTINUE     B: NEW RUN',
        ],
        then: 'choose',
      })
    }
  }

  /** Pick the saved run back up at the start of its act. */
  private resumeFrom(s: GhostSave) {
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.nextExtra = (Math.floor(this.score / EXTRA_EVERY) + 1) * EXTRA_EVERY
    this.weapon = s.weapon
    this.foundSecrets = new Set(s.relics)
    this.tier = s.tier
    this.startAct(ACTS.findIndex((a) => a.id === s.act))
  }

  // --- the act ------------------------------------------------------------------

  private get length() {
    return this.act.length
  }

  private get arenaL() {
    return this.act.length - W + 60
  }

  /** Enemy pace: by stage, then brisker on each New Game+ tier. */
  private get speed() {
    return (
      curve(this.act.stage, TRAIL_CURVES.enemySpeed) *
      (1 + (this.tier - 1) * 0.12)
    )
  }

  private startAct(index: number) {
    this.actIndex = index
    this.act = ACTS[index]!
    this.terrain = terrainOf(this.act)
    this.level = this.act.stage
    this.actTick = 0
    this.clear = 0
    this.checkpoint = 40
    this.bossDone = !this.act.boss
    this.encounterFrontier = 0
    this.encounterCredits = 2
    this.crates = this.act.crates.map((c) => ({ ...c, open: false }))
    this.respawn()
    this.showCard({
      kind: 'title',
      heading: this.act.stageName,
      sub: `STAGE ${this.act.stage}  -  ACT ${this.act.act}: ${this.act.actName}`,
      lines: this.act.intro,
      then: 'play',
    })
    if (!this.demo)
      this.save = {
        v: 1,
        act: this.act.id,
        score: this.score,
        lives: this.lives,
        weapon: this.weapon,
        relics: [...this.foundSecrets],
        continued: false,
        tier: this.tier,
      }
  }

  /** Back to the last checkpoint: the act's living foes reset; the defeated stay down. */
  private respawn() {
    this.x = this.checkpoint
    this.camX = Math.max(0, this.x - 120)
    this.y = this.floorAt(this.x, -999) ?? GROUND_Y
    this.vx = 0
    this.vy = 0
    this.onGround = true
    this.riding = null
    this.facing = 1
    this.poncho = true
    this.invuln = INVULN_TICKS
    this.underwater = 0
    this.timer = this.act.seconds * 60
    this.foes = []
    this.shots = []
    this.fires = []
    this.boss = null
    this.bolts = []
    this.pickups = []
    this.pending = []
    this.ambientTimer = 200
    // Squads behind the checkpoint are forgiven; those ahead wait with whoever is left of them.
    this.triggered = new Set(
      this.act.encounters
        .filter((e) => e.at < this.checkpoint)
        .map((e) => e.id),
    )
  }

  private showCard(c: Omit<Card, 'age'> & { then: CardThen }) {
    const max =
      c.then === 'choose'
        ? Infinity
        : c.kind === 'credits'
          ? 900 + c.lines.length * 34
          : this.demo
            ? 90
            : CARD_TICKS
    this.card = { ...c, age: 0, max }
  }

  private closeCard() {
    const then = this.card?.then
    this.card = null
    if (then === 'next') this.startAct(this.actIndex + 1)
    else if (then === 'end') this.over = true
  }

  // --- the world's surfaces ---------------------------------------------------------

  private groundAt(x: number): boolean {
    return groundAt(this.act, x)
  }

  /** The highest standing surface at x at or below `y` (ledge, block top or ground), else null. */
  private floorAt(x: number, y: number): number | null {
    let best: number | null = null
    const take = (s: number) => {
      if (s >= y - 1 && (best === null || s < best)) best = s
    }
    for (const l of this.act.ledges) if (x > l.x && x < l.x + l.w) take(l.y)
    for (const b of this.act.blocks)
      if (x >= b.x - 2 && x <= b.x + b.w + 2) take(blockTop(b, GROUND_Y))
    if (this.groundAt(x)) take(GROUND_Y)
    return best
  }

  /** Is (x, y) inside a solid block? */
  private blockedAt(x: number, y: number): boolean {
    return this.act.blocks.some((b) => {
      const top = blockTop(b, GROUND_Y)
      const bottom = b.y !== undefined ? top + b.h : GROUND_Y
      return x > b.x && x < b.x + b.w && y > top && y < bottom
    })
  }

  private waterY(): number | null {
    return this.act.tide ? tideAt(this.act.tide, this.actTick).y : null
  }

  private foeCtx(): FoeCtx {
    return {
      px: this.x,
      py: this.y,
      groundY: GROUND_Y,
      speed: this.speed,
      rng: this.rng,
      groundAt: (x) => this.groundAt(x),
      floorAt: (x, y) => this.floorAt(x, y),
      blockedAt: (x, y) => this.blockedAt(x, y),
      waterY: this.waterY(),
      bolt: (b) => this.bolts.push({ ...b, t: 0 }),
      sound: (name) => this.sound.play(name as never),
    }
  }

  private bossCtx(): BossCtx {
    return {
      ...this.foeCtx(),
      arenaL: this.arenaL,
      arenaR: this.length,
      tier: this.tier,
      summon: (kind, x, y) => {
        if (this.foes.length >= 4) return
        this.foes.push(makeFoe(kind, null, x, y, null, this.foeCtx()))
      },
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.card?.then === 'choose') {
      this.card.age++
      if (this.card.age < 20) return
      if ((controls.pressed.a || controls.pressed.start) && this.offer)
        this.resumeFrom(this.offer)
      else if (controls.pressed.b) this.startAct(0)
      return
    }
    if (this.card) {
      this.card.age++
      const skip =
        this.card.age > 30 &&
        (controls.pressed.a || controls.pressed.start || controls.pressed.b)
      if (skip || this.card.age >= this.card.max) this.closeCard()
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.advance()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
          // The trail and relics wait for a continue; the score does not.
          if (this.save) this.save = { ...this.save, continued: true }
        } else this.respawn()
      }
      return
    }

    this.actTick++
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
    this.springEncounters()
    this.spawnAmbient()
    this.updateShots()
    this.updateFires()
    this.updateFoes()
    this.updateBolts()
    this.updatePickups()
    this.updateBoss()
    this.updateHazards()
    if (this.dead > 0) return

    for (const c of this.act.checkpoints) {
      if (c > this.checkpoint && this.x > c) {
        this.checkpoint = c
        this.banner = { text: 'CHECKPOINT', ticks: 70 }
        this.sound.play('pickup')
      }
    }
    if (this.x >= this.length && this.bossDone) this.actClear()
    this.moveCamera()
  }

  private moveCamera() {
    const lock = this.activeLock()
    if (this.boss) this.camX += (this.arenaL - this.camX) * 0.15
    else if (lock) {
      const want = Math.max(lock.from, Math.min(lock.to - W, this.x - 120))
      this.camX += (want - this.camX) * 0.2
    } else this.camX = Math.max(0, Math.min(this.length + 80 - W, this.x - 120))
  }

  /** An ambush holds the camera until its squad is down. */
  private activeLock(): Encounter['lock'] | null {
    for (const e of this.act.encounters) {
      if (!e.lock || !this.triggered.has(e.id)) continue
      const prefix = `${this.act.id}/${e.id}/`
      const alive =
        this.foes.some((f) => f.id?.startsWith(prefix)) ||
        this.pending.some((p) => p.id.startsWith(prefix))
      if (alive) return e.lock
    }
    return null
  }

  private move(input: InputFrame) {
    const water = this.waterY()
    const wading = water !== null && this.y > water + 6
    // Riding a mover: it carries him.
    if (this.riding !== null && this.onGround) {
      const m = this.act.movers?.[this.riding]
      if (m) {
        const now = moverAt(m, this.actTick)
        const was = moverAt(m, this.actTick - 1)
        this.x += now.x - was.x
        this.y += now.y - was.y
      }
    }
    if (this.onGround) {
      const walk = wading ? WALK * 0.6 : WALK
      this.vx = 0
      if (input.held.left) {
        this.vx = -walk
        this.facing = -1
      }
      if (input.held.right) {
        this.vx = walk
        this.facing = 1
      }
      if (this.vx !== 0) this.walkPhase += wading ? 0.15 : 0.25
      if (
        input.pressed.up ||
        input.pressed.b ||
        ((input.held.up || input.held.b) && this.onGround)
      ) {
        // A committed jump, as in the classic: no steering once in the air.
        this.vy = wading ? JUMP_VY * 0.85 : JUMP_VY
        this.vx = this.vx === 0 ? 0 : Math.sign(this.vx) * JUMP_VX
        this.onGround = false
        this.riding = null
        this.sound.play('blip')
      }
    }
    const prevY = this.y
    this.vy += GRAVITY
    if (!this.onGround)
      for (const u of this.act.updrafts ?? [])
        if (this.x > u.x && this.x < u.x + u.w && this.y > u.top)
          this.vy = Math.max(-3.4, this.vy - u.lift)
    let nx = this.x + this.vx
    // Blocks stop him at their faces.
    for (const b of this.act.blocks) {
      const top = blockTop(b, GROUND_Y)
      const bottom = b.y !== undefined ? top + b.h : GROUND_Y + 40
      if (this.y > top + 1 && this.y - BODY_H < bottom)
        if (nx + BODY_HW > b.x && nx - BODY_HW < b.x + b.w)
          nx =
            this.x < b.x + b.w / 2
              ? b.x - BODY_HW - 0.01
              : b.x + b.w + BODY_HW + 0.01
    }
    // The gate stays barred until the boss falls; an ambush holds him on screen.
    const gate = this.bossDone ? this.length + 40 : this.length - 12
    const right = this.activeLock() ? Math.min(gate, this.camX + W - 6) : gate
    this.x = Math.max(this.camX + 6, Math.min(right, nx))
    this.y += this.vy
    this.onGround = false
    this.riding = null
    if (this.vy >= 0) {
      let land: number | null = null
      let mover: number | null = null
      const take = (s: number, m: number | null = null) => {
        if (land === null || s < land) {
          land = s
          mover = m
        }
      }
      for (const l of this.act.ledges)
        if (this.x > l.x && this.x < l.x + l.w && prevY <= l.y && this.y >= l.y)
          take(l.y)
      ;(this.act.movers ?? []).forEach((m, i) => {
        const p = moverAt(m, this.actTick)
        if (
          this.x > p.x &&
          this.x < p.x + m.w &&
          prevY <= p.y + 3 &&
          this.y >= p.y
        )
          take(p.y, i)
      })
      for (const b of this.act.blocks) {
        const top = blockTop(b, GROUND_Y)
        if (
          this.x > b.x - 3 &&
          this.x < b.x + b.w + 3 &&
          prevY <= top &&
          this.y >= top
        )
          take(top)
      }
      if (this.y >= GROUND_Y && prevY <= GROUND_Y && this.groundAt(this.x))
        take(GROUND_Y)
      if (land !== null) {
        this.y = land
        this.vy = 0
        this.onGround = true
        this.riding = mover
      }
    } else {
      // Bonk on the underside of a floating block.
      for (const b of this.act.blocks) {
        if (b.y === undefined) continue
        const bottom = b.y + b.h
        if (
          this.x > b.x - 3 &&
          this.x < b.x + b.w + 3 &&
          prevY - BODY_H >= bottom &&
          this.y - BODY_H < bottom
        ) {
          this.y = bottom + BODY_H
          this.vy = 0
        }
      }
    }
    if (this.y > H + 20) {
      this.die('INTO THE DARK')
      return
    }
    // Held under the tide too long, he loses a hit.
    if (water !== null && this.y - BODY_H + 4 > water) {
      if (++this.underwater > BREATH_TICKS) {
        this.underwater = 0
        this.hit()
      }
    } else this.underwater = 0
  }

  private updateHazards() {
    if (!this.onGround || this.y < GROUND_Y - 1) return
    for (const h of this.act.hazards ?? [])
      if (this.x > h.x && this.x < h.x + h.w && hazardLive(h, this.actTick)) {
        this.hit()
        return
      }
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

  // --- encounters -----------------------------------------------------------------

  /** Squads spring when Zuzu reaches them; members already put down this run stay down. */
  private springEncounters() {
    for (const e of this.act.encounters) {
      if (this.triggered.has(e.id) || this.x < e.at) continue
      this.triggered.add(e.id)
      let fresh = 0
      e.squad.forEach((member, i) => {
        const id = memberId(this.act, e, i)
        if (this.defeated.has(id) || this.foes.some((f) => f.id === id)) return
        this.pending.push({
          id,
          member,
          due: this.actTick + (member.delay ?? 0),
        })
        fresh++
      })
      if (fresh && e.title) this.banner = { text: e.title, ticks: 80 }
      if (fresh && e.lock) this.sound.play('warn')
    }
    if (!this.pending.length) return
    const ctx = this.foeCtx()
    this.pending = this.pending.filter((p) => {
      if (p.due > this.actTick) return true
      const m = p.member
      const def = FOES[m.kind]
      const y = def.flies
        ? (m.y ?? 110)
        : (this.floorAt(m.x, m.y ?? -999) ?? GROUND_Y)
      this.foes.push(makeFoe(m.kind, p.id, m.x, y, m.drops ?? null, ctx))
      return false
    })
  }

  /** A thin trickle of the act's ambient foes, paid for by forward progress only. */
  private spawnAmbient() {
    if (this.boss || this.x > this.arenaL - 40 || !this.act.ambient.length)
      return
    const budget = advanceEncounterBudget(
      this.encounterFrontier,
      this.encounterCredits,
      this.x,
    )
    this.encounterFrontier = budget.frontier
    this.encounterCredits = budget.credits
    if (this.encounterCredits <= 0 || this.activeLock()) return
    if (--this.ambientTimer > 0) return
    this.ambientTimer = Math.round(
      (curve(this.act.stage, TRAIL_CURVES.ambientEvery) /
        (1 + (this.tier - 1) * 0.2)) *
        (0.7 + this.rng() * 0.6),
    )
    const kind =
      this.act.ambient[Math.floor(this.rng() * this.act.ambient.length)]!
    const def = FOES[kind]
    let sx: number
    let sy: number
    if (def.rises) {
      const side = this.rng() < 0.7 ? 1 : -1
      sx = this.x + side * (50 + this.rng() * 90)
      // Risers never claw up right at a pit's edge (a landing spot) or inside a block.
      if (
        !this.groundAt(sx - 24) ||
        !this.groundAt(sx + 24) ||
        sx > this.length - 40 ||
        this.blockedAt(sx, GROUND_Y - 4) ||
        this.act.blocks.some((b) => sx > b.x - 10 && sx < b.x + b.w + 10)
      )
        return
      sy = GROUND_Y
    } else if (def.flies) {
      sx = this.camX + W + 10
      sy = 70 + this.rng() * 60
    } else {
      sx = this.camX + W + 10
      if (!this.groundAt(sx) || this.blockedAt(sx, GROUND_Y - 4)) return
      sy = GROUND_Y
    }
    this.encounterCredits--
    const carrying: Holding | null =
      kind === 'crow' && this.rng() < 0.3 ? 'gear' : null
    this.foes.push(makeFoe(kind, null, sx, sy, carrying, this.foeCtx()))
  }

  // --- combat -------------------------------------------------------------------

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
          const floor = this.floorAt(k.x, k.y - k.vy)
          if (floor !== null && k.y >= floor - 2) {
            this.ignite(k.x, floor)
            k.life = 0
          } else if (k.y > H + 10) k.life = 0
        }
      }
      if (
        (k.weapon === 'kunai' || k.weapon === 'shuriken') &&
        this.blockedAt(k.x, k.y)
      )
        k.life = 0
      // The iai cut only bites on its first few frames; the rest is follow-through.
      if (k.life <= 0 || (k.weapon === 'katana' && k.t > 4)) continue
      const pad = k.weapon === 'katana' ? 4 : k.weapon === 'kasa' ? 2 : 0
      const foes = this.foes.filter((f) => {
        if (f.hp <= 0 || k.struck.includes(f)) return false
        const def = FOES[f.kind]
        // A riser can be hit once it is mostly out of the dirt.
        if (def.rises && f.phase === 'rise' && f.y > f.baseY + 6) return false
        return (
          Math.abs(f.x - k.x) < def.hw + pad &&
          Math.abs(f.y - def.cy - k.y) < def.hh + pad
        )
      })
      const pierce = k.weapon === 'katana' || k.weapon === 'kasa'
      for (const foe of pierce ? foes : foes.slice(0, 1)) {
        k.struck.push(foe)
        this.strike(foe, WEAPONS[k.weapon].damage, k.x, k.y)
      }
      if (foes.length && !pierce) {
        if (k.weapon === 'lantern') this.ignite(k.x, this.floorAt(k.x, k.y))
        k.life = 0
        continue
      }
      const b = this.boss
      if (b && b.dying === 0 && !k.struck.includes(b)) {
        const def = bossDef(b)
        if (
          Math.abs(b.x - k.x) < def.hw + pad &&
          k.y > b.y - def.height &&
          k.y < b.y
        ) {
          k.struck.push(b)
          this.hurtBoss(WEAPONS[k.weapon].damage, k.x, k.y)
          if (!pierce) {
            if (k.weapon === 'lantern') this.ignite(k.x, this.floorAt(k.x, k.y))
            k.life = 0
            continue
          }
        }
      }
      const crate = this.crates.find(
        (c) => !c.open && Math.abs(c.x - k.x) < 9 + pad && k.y > GROUND_Y - 18,
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

  private ignite(x: number, floor: number | null) {
    if (floor === null) return
    this.fires.push({ x, y: floor, life: FIRE_TICKS })
    if (this.fires.length > MAX_FIRES) this.fires.shift()
    this.burst(x, floor - 4, 8, '#f97316')
    this.sound.play('pop')
  }

  /** Ground fire burns anything standing in it, even spirits still in the dirt. */
  private updateFires() {
    for (const fire of this.fires) {
      fire.life--
      if (fire.life % 8 !== 0) continue
      for (const f of this.foes)
        if (
          f.hp > 0 &&
          Math.abs(f.x - fire.x) < 14 &&
          Math.abs(f.y - fire.y) < 24
        )
          this.strike(f, 1, f.x, fire.y - 10)
      if (this.boss && Math.abs(this.boss.x - fire.x) < 16)
        this.hurtBoss(1, this.boss.x, fire.y - 10)
    }
    this.fires = this.fires.filter((f) => f.life > 0)
  }

  private updateFoes() {
    const ctx = this.foeCtx()
    for (const f of this.foes) {
      f.t++
      const def = FOES[f.kind]
      def.update(f, ctx)
      if (f.y > H + 20) f.hp = -99
      if (f.hp <= 0) continue
      if (def.rises && f.phase === 'rise') continue
      if (
        Math.abs(f.x - this.x) < def.hw &&
        Math.abs(f.y - def.cy - (this.y - 11)) < def.hh + 6
      )
        this.hit()
    }
    this.foes = this.foes.filter((f) => {
      if (f.hp <= 0) return false
      // Squads wait wherever they were placed; strays and ambient foes leave with the screen.
      const ahead = f.id ? this.length + 100 : this.camX + W + 80
      return f.x > this.camX - 80 && f.x < ahead
    })
  }

  private updateBolts() {
    for (const b of this.bolts) {
      const prevY = b.y
      stepBolt(b)
      if (
        b.arm === 0 &&
        Math.abs(b.x - this.x) < b.hw + BODY_HW &&
        b.y + b.hh > this.y - BODY_H &&
        b.y - b.hh < this.y
      ) {
        this.hit()
        if (b.kind !== 'pillar' && b.kind !== 'wave') b.life = 0
      }
      if (b.grav > 0 && b.vy > 0) {
        const floor = this.floorAt(b.x, prevY)
        if (floor !== null && b.y >= floor) {
          this.burst(
            b.x,
            floor - 2,
            4,
            b.kind === 'ember' ? '#f97316' : '#a07a45',
          )
          b.life = 0
        }
      }
      if (
        b.kind !== 'pillar' &&
        (this.blockedAt(b.x, b.y) ||
          b.y > H + 20 ||
          Math.abs(b.x - this.camX - W / 2) > W)
      )
        b.life = 0
    }
    this.bolts = this.bolts.filter((b) => b.life > 0)
  }

  private strike(foe: Foe, damage: number, x: number, y: number) {
    foe.hp -= damage
    this.burst(x, y, 4, '#e5e7eb')
    if (foe.hp <= 0) this.defeat(foe)
  }

  private defeat(f: Foe) {
    this.foes = this.foes.filter((o) => o !== f)
    if (f.id) this.defeated.add(f.id)
    const def = FOES[f.kind]
    this.addScore(def.points, f.x, f.y - 20)
    const color =
      f.kind === 'spirit'
        ? '#a5f3fc'
        : f.kind === 'crow'
          ? '#475569'
          : '#f5f5f4'
    this.burst(f.x, f.y - def.cy, 10, color)
    this.sound.play('pop')
    if (f.carrying === 'gear') this.drop(this.otherWeapon(), f.x, f.y - def.cy)
    else if (f.carrying === 'poncho' || f.carrying === 'heart')
      this.drop('poncho', f.x, f.y - def.cy)
    else if (f.carrying === 'nugget') this.drop('nugget', f.x, f.y - def.cy)
    else if (f.kind === 'spirit' && this.rng() < 0.12)
      this.drop('coin', f.x, f.y - 10)
  }

  private openCrate(crate: Crate) {
    crate.open = true
    const holds = crate.holds === 'heart' ? 'poncho' : crate.holds
    this.drop(
      holds === 'gear' ? this.otherWeapon() : holds,
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

  // --- bosses -------------------------------------------------------------------

  private updateBoss() {
    const b = this.boss
    const id = this.act.boss
    if (!b) {
      if (id && !this.bossDone && this.x > this.arenaL + 60) this.spawnBoss(id)
      return
    }
    const def = bossDef(b)
    b.t++
    if (b.flash > 0) b.flash--
    if (b.dying > 0) {
      if (b.dying % 6 === 0)
        this.burst(
          b.x + (this.rng() - 0.5) * 24,
          b.y - this.rng() * def.height,
          8,
          BOSS_COLOR[b.id] ?? '#d6b25e',
        )
      if (--b.dying === 0) {
        this.boss = null
        this.bossDone = true
        this.banner = { text: 'THE WAY IS OPEN', ticks: 90 }
        this.sound.play('level')
      }
      return
    }
    def.update(b, this.bossCtx())
    const touch = def.contact?.(b)
    if (
      touch &&
      Math.abs(b.x - this.x) < touch.hw &&
      this.y > b.y - touch.height + 4 &&
      this.y - BODY_H < b.y
    )
      this.hit()
  }

  private spawnBoss(id: NonNullable<Act['boss']>) {
    const b = makeBoss(id, this.length - 50, GROUND_Y, this.bossCtx())
    this.boss = b
    // The arena is the boss's alone.
    this.foes = this.foes.filter((f) => f.x < this.arenaL)
    const def = bossDef(b)
    this.banner = { text: def.name, sub: def.title, ticks: 100 }
    this.sound.play('warn')
  }

  private hurtBoss(damage: number, x: number, y: number) {
    const b = this.boss
    if (!b || b.dying > 0) return
    if (bossDef(b).immune?.(b)) {
      this.burst(x, y, 3, '#9ca3af')
      this.sound.play('blip')
      return
    }
    b.hp -= damage
    b.flash = 6
    this.burst(x, y, 5, '#e5e7eb')
    if (b.hp > 0) return
    b.dying = BOSS_DYING_TICKS
    this.bolts = []
    this.foes = []
    this.addScore(BOSS_POINTS * this.act.stage, b.x, b.y - 50)
    this.sound.play('boom')
  }

  // --- pickups, hits and progress ---------------------------------------------------

  private updatePickups() {
    for (const p of this.pickups) {
      const prevY = p.y
      p.vy += GRAVITY
      p.y += p.vy
      // Pickups settle on whatever is under them; over a pit they are lost.
      const floor = this.floorAt(p.x, prevY + 6)
      if (floor !== null && p.y >= floor - 6) {
        p.y = floor - 6
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
      this.riding = null
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
    for (const s of this.act.secrets) {
      if (this.foundSecrets.has(s.id)) continue
      if (Math.abs(this.x - s.x) >= 12 || Math.abs(this.y - 14 - s.y) >= 13)
        continue
      this.foundSecrets.add(s.id)
      this.addScore(800, s.x, s.y)
      this.banner = {
        text: s.name,
        sub: `${this.foundSecrets.size}/${RELIC_COUNT} RELICS FOUND`,
        ticks: 110,
      }
      this.burst(s.x, s.y, 18, '#7dd3fc')
      this.sound.play('extra')
    }
  }

  private actClear() {
    const timeBonus = Math.floor(this.timer / 60) * 50
    const bonus = 2000 * this.act.stage + timeBonus
    this.addScore(bonus, this.x, this.y - 30)
    this.clear = CLEAR_TICKS
    this.foes = []
    this.bolts = []
    const last = this.actIndex + 1 >= ACTS.length
    const stageDone = last || ACTS[this.actIndex + 1]!.stage !== this.act.stage
    this.banner = {
      text: stageDone ? 'STAGE CLEARED' : 'ACT CLEARED',
      sub: `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  /** After the clear interlude: the next act, a stage's closing page, or the ending. */
  private advance() {
    const next = ACTS[this.actIndex + 1]
    const stage = stageInfo(this.act.stage)
    if (!next) {
      this.won = true
      // The clear unlocks the next New Game+ tier: a fresh run, harder, relics to find again.
      this.save = {
        v: 1,
        act: ACTS[0]!.id,
        score: 0,
        lives: START_LIVES,
        weapon: 'kunai',
        relics: [],
        continued: false,
        tier: Math.min(MAX_TIER, this.tier + 1),
      }
      const all = this.foundSecrets.size >= RELIC_COUNT
      this.showCard({
        kind: 'credits',
        heading: all ? 'THE TRUE ENDING' : 'THE TRAIL ENDS',
        lines: [
          ...(stage?.outro ?? []),
          '',
          ...(all
            ? TRUE_ENDING
            : [
                'EVERY RELIC HOLDS A MEMORY.',
                'FIND THEM ALL FOR THE TRUE END.',
              ]),
          '',
          'NEW GAME+ UNLOCKED',
          '',
          `RELICS FOUND: ${this.foundSecrets.size}/${RELIC_COUNT}`,
          `FINAL SCORE: ${this.score}`,
          '',
          ...CREDITS,
        ],
        then: 'end',
      })
      return
    }
    if (next.stage !== this.act.stage && stage?.outro.length)
      this.showCard({
        kind: 'story',
        heading: stage.name,
        sub: `STAGE ${stage.stage} CLEARED`,
        lines: stage.outro,
        then: 'next',
      })
    else this.startAct(this.actIndex + 1)
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
    if (this.card) return frame
    if (this.boss && this.boss.dying === 0) return this.pilotBoss(frame)
    if (this.hopIncoming(frame)) return frame
    // Deal with whatever is closest, facing it.
    const near = this.foes
      .filter((f) => {
        const def = FOES[f.kind]
        return (
          !(def.rises && f.phase === 'rise') &&
          Math.abs(f.y - def.cy - (this.y - 12)) < 22
        )
      })
      .sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0]
    const cover =
      near &&
      this.act.blocks.some(
        (b) =>
          b.x + b.w > Math.min(near.x, this.x) &&
          b.x < Math.max(near.x, this.x) &&
          blockTop(b, GROUND_Y) < this.y - 6,
      )
    if (near && !cover && Math.abs(near.x - this.x) < 110) {
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
    if (this.dodgeBolts(frame)) return frame
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
      const wall = this.act.blocks.some(
        (b) =>
          b.x - this.x > 0 &&
          b.x - this.x < 20 &&
          blockTop(b, GROUND_Y) < this.y - 1 &&
          (b.y === undefined || b.y + b.h > this.y - BODY_H),
      )
      const hazard = (this.act.hazards ?? []).some(
        (h) => h.x - this.x > 0 && h.x - this.x < 14,
      )
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
      if ((pit && this.y >= GROUND_Y - 1) || wall || hazard || crateAhead)
        held.up = true
    }
    return frame
  }

  /** Hop bullets and waves coming in low. */
  private hopIncoming(frame: InputFrame): boolean {
    if (!this.onGround) return false
    const incoming = this.bolts.some(
      (k) =>
        k.grav === 0 &&
        k.vx !== 0 &&
        Math.sign(k.vx) === Math.sign(this.x - k.x) &&
        Math.abs(k.x - this.x) < 26 + Math.abs(k.vx) * 6 &&
        k.y + k.hh > this.y - BODY_H &&
        k.y - k.hh < this.y,
    )
    if (incoming) frame.pressed.up = true
    return incoming
  }

  /** Step out from under anything falling on him. */
  private dodgeBolts(frame: InputFrame): boolean {
    if (!this.onGround) return false
    const landing = this.bolts
      .filter((b) => b.vy > 0 || b.grav > 0 || b.kind === 'pillar')
      .map((b) => {
        if (b.kind === 'pillar' || b.grav <= 0) return b.x
        const drop = b.y - (this.y - 10)
        const t =
          (-b.vy + Math.sqrt(Math.max(0, b.vy * b.vy - 2 * b.grav * drop))) /
          b.grav
        return b.x + b.vx * t
      })
      .filter((x) => Math.abs(x - this.x) < 12)
    if (!landing.length) return false
    const away = landing.reduce((a, x) => a + x, 0) / landing.length
    if (away > this.x) frame.held.left = true
    else frame.held.right = true
    return true
  }

  private pilotBoss(frame: InputFrame): InputFrame {
    const b = this.boss!
    const dx = b.x - this.x
    const dir = dx > 0 ? 1 : -1
    // Vault the devil as it drifts in; jump anything charging (a committed jump, so take off early).
    const closing = Math.sign(b.vx) === -dir
    const vault =
      b.id === 'devil' && closing && Math.abs(dx) < 62 && Math.abs(dx) > 36
    const charging = b.mode === 'charge' && closing && Math.abs(dx) < 80
    if (this.onGround && (charging || vault)) {
      frame.pressed.up = true
      if (vault && dir > 0) frame.held.right = true
      if (vault && dir < 0) frame.held.left = true
      return frame
    }
    if (!this.onGround) return frame
    if (this.dodgeBolts(frame) || this.hopIncoming(frame)) return frame
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
    const camX = Math.round(this.camX)
    const theme = this.act.theme
    const key = ART_KEY[theme]
    drawBackdrop(g, key, camX, this.tick)
    g.save()
    g.translate(-camX, 0)
    for (const u of this.act.updrafts ?? [])
      drawUpdraft(g, u, GROUND_Y, this.tick)
    drawTerrain(g, this.terrain, camX, this.tick)
    for (const b of this.act.blocks)
      if (!isGrave(b) && b.x + b.w > camX - 8 && b.x < camX + W + 8)
        drawBlock(g, b, blockTop(b, GROUND_Y), theme)
    for (const h of this.act.hazards ?? []) {
      if (h.x + h.w < camX - 8 || h.x > camX + W + 8) continue
      const live = hazardLive(h, this.actTick)
      const warm =
        !live && !!h.period && h.period - (this.actTick % h.period) < 40
      drawHazard(g, h, GROUND_Y, live, warm, this.tick)
    }
    for (const m of this.act.movers ?? []) {
      const p = moverAt(m, this.actTick)
      if (p.x + m.w > camX - 8 && p.x < camX + W + 8)
        drawMover(g, m, p.x, p.y, theme, this.tick)
    }
    drawGate(g, key, this.length, this.tick, !this.bossDone)
    for (const c of this.act.checkpoints)
      if (c > 40) drawCheckpoint(g, key, c, this.checkpoint >= c, this.tick)
    for (const c of this.crates) if (!c.open) drawCrate(g, c.x, GROUND_Y)
    for (const s of this.act.secrets)
      if (!this.foundSecrets.has(s.id)) drawSecret(g, s.x, s.y, this.tick)
    for (const p of this.pickups) drawPickup(g, p, this.tick)
    for (const f of this.foes) this.renderFoe(g, f)
    if (this.boss) this.renderBoss(g, this.boss)
    for (const b of this.bolts) drawBolt(g, b, this.tick)
    for (const fire of this.fires)
      drawFire(g, { x: fire.x, life: fire.life }, fire.y, this.tick)
    for (const k of this.shots)
      drawShot(g, { ...k, face: Math.sign(k.vx) || this.facing }, this.tick)
    for (const f of this.flying) {
      drawFlyingPoncho(g, f.x, f.y + 6, f.spin)
      drawFlyingKasa(g, f.x, f.y, f.spin)
    }
    if (this.dead === 0 && !this.over) this.renderZuzu(g)
    else if (this.dead > 0) this.renderFallen(g)
    if (this.act.tide) {
      const t = tideAt(this.act.tide, this.actTick)
      drawWater(g, camX, t.y, t.warning, this.tick)
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    g.restore()
    drawForeground(g, key, camX, this.tick, this.act.ground)
    this.renderHud(g)
    if (this.card) drawCard(g, this.card)
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    // The slice's three always turn to Zuzu; the campaign roster faces the way its behaviour set.
    const slice = f.kind === 'spirit' || f.kind === 'crow' || f.kind === 'hyena'
    drawFoe(
      g,
      {
        ...f,
        carrying: !!f.carrying,
        face: slice ? Math.sign(this.x - f.x) || -1 : f.face,
      },
      this.tick,
    )
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    const face = Math.sign(this.x - b.x) || -1
    const draw = BOSSES[b.id]?.draw
    if (draw) {
      draw(g, b, this.tick, face)
      return
    }
    if (b.id === 'devil' || b.id === 'bull') {
      const mode =
        b.id === 'devil'
          ? 'drift'
          : b.mode === 'charge' || b.mode === 'stunned'
            ? b.mode
            : 'paw'
      drawBoss(g, { ...b, kind: b.id, mode, face }, this.tick)
      return
    }
    const def = bossDef(b)
    drawStandInBoss(
      g,
      { ...b, hw: def.hw, height: def.height, face },
      BOSS_COLOR[b.id] ?? '#e7e5e4',
      this.tick,
    )
  }

  private renderZuzu(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const cut = this.weapon === 'katana'
    const action =
      this.throwPose > 0
        ? cut
          ? 'cut'
          : 'throw'
        : !this.onGround
          ? this.vy < 0
            ? 'jump'
            : 'fall'
          : this.vx !== 0
            ? 'walk'
            : 'idle'
    drawZuzu(g, {
      x: this.x,
      y: this.y,
      facing: this.facing,
      poncho: this.poncho,
      action,
      walkPhase: this.walkPhase,
      tick: this.tick,
      progress:
        this.throwPose > 0 ? 1 - this.throwPose / (cut ? 12 : 8) : undefined,
      airborne: !this.onGround,
    })
  }

  private renderFallen(g: CanvasRenderingContext2D) {
    if (this.y > GROUND_Y + 4) return
    drawZuzuFallen(
      g,
      this.x,
      Math.min(this.y, GROUND_Y),
      DEATH_TICKS - this.dead,
      this.poncho,
    )
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const spec = WEAPONS[this.weapon]
    const b = this.boss && this.boss.dying === 0 ? this.boss : null
    drawHud(
      g,
      {
        score: this.score,
        hiScore: Math.max(this.hiScore, this.score),
        lives: this.lives,
        hits: hitsFor(this.poncho, this.dead > 0 || this.over),
        invuln: this.invuln,
        weapon: this.weapon,
        weaponLabel: spec.label,
        shotsMax: spec.max,
        shotsOut: this.shots.filter((k) => k.weapon === this.weapon).length,
        cadence: Math.max(
          0,
          Math.min(1, 1 - this.throwCooldown / spec.cooldown),
        ),
        trail: this.act.stage,
        stageName: this.act.stageName,
        seconds: Math.ceil(this.timer / 60),
        progress: Math.max(0, Math.min(1, this.x / this.length)),
        relics: this.foundSecrets.size,
        relicsMax: RELIC_COUNT,
        boss: b && {
          name: bossDef(b).name,
          hp: Math.max(0, b.hp),
          maxHp: b.maxHp,
          flash: b.flash,
        },
        tick: this.tick,
      },
      (h, x, y, w, ht) => drawZuzuPortrait(h, x, y, w, ht, this.poncho),
      (h, weapon, x, y) => drawWeaponIcon(h, weapon as Weapon, x, y, 12),
    )
    if (this.banner !== this.bannerSeen) {
      this.bannerSeen = this.banner
      this.bannerFrom = this.tick
    }
    if (this.banner)
      drawBanner(
        g,
        this.banner.text,
        this.banner.sub,
        this.tick - this.bannerFrom,
      )
  }
}

function bossDef(b: Boss): BossDef {
  return BOSSES[b.id] ?? BOSSES.devil!
}

/** The slice's terrain draws 12x16 graves itself; every other block is drawn by worldArt. */
function isGrave(b: Act['blocks'][number]) {
  return b.look === 'grave' && b.w === 12 && b.h === 16 && b.y === undefined
}

function terrainOf(act: Act): TerrainStage {
  return {
    key: ART_KEY[act.theme],
    ground: act.ground,
    boardwalks: act.ledges,
    tombstones: act.blocks.filter(isGrave).map((b) => b.x + 6),
  }
}

const zuzuGhostTrail: ArcadeGameModule = {
  create: (options) => new ZuzuGhostTrail(options),
}

export const create = zuzuGhostTrail.create
export default zuzuGhostTrail
