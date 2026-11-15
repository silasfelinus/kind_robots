// /utils/arcade/games/lanternSwarm.ts
//
// Lantern Swarm -- the Kind Robots Arcade's Galaga riff (conductor
// kr-arcade/t-009 game factory, batch 4; depth pass kr-arcade/t-093, t-094).
// Night moths swirl in along looping flight paths and settle into a swaying
// formation above your paper lantern. Then they peel off and dive at you,
// dropping dust. Beam each one with light and it flutters home happy; one that
// dives past you loops back to its place.
//
// The Long Night Festival (lanternSwarm/zones.ts): the night is a run of
// Watches, each a zone of six stages -- three formation stages, a Glow Stage,
// a remix and a Guardian. Every stage scripts its own entrance, formation,
// dive shapes (lanternSwarm/dives.ts) and tuning. A Watch with two zones is a
// fork, chosen on the Sky Chart after the Watch before it.
//
// - Dusk, the Rooftop Festival: escort lunas and a climbing escort bonus, the
//   last-moth frenzy, the turncoat captive lantern, the Paper Cranes Glow
//   Stage and the Grand Lantern Moth (lanternSwarm/guardian.ts).
// - Evening, the Orchard Canopy (cocoon moths that split into moonlet trios,
//   firefly sparkers that can only be hit while lit, the Falling Leaves Glow
//   and the Silk Spinner) or the River of Lights (skimmers that cross just
//   above the water with one gap, dust dusters that fan a curtain with a safe
//   pocket under them, floating candles for cover, the Fish Kites Glow and
//   the Heron Kite).
// - The Welcome Glow and the Flock (lanternSwarm/flock.ts): hold B for a warm
//   cone that befriends a moth diving through it while the gauge is full; up
//   to four friends fly with the lantern, beam with it and take a hit for it;
//   tap B to send them on a Homecoming dive that clears a column.
// - Festival charms float down from perfect Glows and escort bonuses.
// - After each Watch a results card shows shots, hits and the hit ratio.
//
// Left/right move, A beams, B is the Welcome Glow (hold) or the Homecoming
// dive (tap).

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  drawSprite,
  gauge,
  glow,
  hudPanel,
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
  BEAM_SPRITE,
  CHARM_SPRITES,
  CRANES,
  DUST_SPRITES,
  EMBER_SPRITES,
  FISH,
  FRIEND_BEAM_SPRITES,
  KIND_ART,
  LEAVES,
  LIFE_SPRITE,
  QUEENS_HURT,
  SPARKERS_DARK,
  WRAP,
  drawLantern,
  drawMoth,
  type MothSet,
} from '../lanternSwarm/art'
import type { BossFight, GuardianHit } from '../lanternSwarm/boss'
import { planDive } from '../lanternSwarm/dives'
import {
  CHARMS,
  CHARM_FALL,
  CHARM_KINDS,
  CONE_HALF,
  CONE_REACH,
  FLOCK_MAX,
  FLOCK_SLOTS,
  FRIEND_AT,
  FRIEND_BEAM_SPEED,
  GAUGE_DRAIN,
  GAUGE_MAX,
  GAUGE_REFILL,
  HOMECOMING,
  TAP_TICKS,
  beamFor,
  friendBeam,
  inCone,
  type CharmKind,
  type FriendBeam,
} from '../lanternSwarm/flock'
import { grandLanternMoth } from '../lanternSwarm/guardian'
import { heronKite } from '../lanternSwarm/heron'
import {
  escortBonus,
  newTally,
  ratioText,
  resultRows,
  type Tally,
} from '../lanternSwarm/results'
import {
  RIVER_TOP,
  renderSkyBack,
  renderSkyFront,
  skyPreview,
} from '../lanternSwarm/sky'
import { silkSpinner } from '../lanternSwarm/spinner'
import {
  GLOW_ART,
  GLOW_CHOREOGRAPHIES,
  H,
  PATHS,
  SLOT_OF,
  W,
  WATCHES,
  mirrorPath,
  nextWatch,
  placeOf,
  slotsFor,
  stageAt,
  tuneFor,
  type FormationStage,
  type GlowName,
  type GuardianName,
  type Kind,
  type Pt,
  type Slot,
  type SlotKind,
  type StagePlace,
  type Tuning,
  type Zone,
} from '../lanternSwarm/zones'

const HUD_H = 22
const SHIP_Y = H - 30
const SHIP_SPEED = 1.9
const DUST_SPEED = 1.9
const SLOT_X = 18
const SLOT_Y = 15
const FORM_TOP = HUD_H + 26
const ENTER_SPEED = 2.4
const SPAWN_GAP = 9
const GROUP_GAP = 160
const RESPAWN_TICKS = 130
const SAFE_TICKS = 70
const CLEAR_TICKS = 120
const BEAM_TICKS = 150
const START_LIVES = 3
const FIRST_EXTRA = 20_000
const NEXT_EXTRA = 70_000
const GLOW_POINTS = 100
/** The perfect Glow bonus climbs each lap of the night. */
const GLOW_PERFECT = 10_000
const GLOW_PERFECT_STEP = 5_000
const GLOW_PERFECT_MAX = 20_000
const RESCUE_POINTS = 1000
/** The last few moths of a stage dive without stopping, faster each pass. */
const FRENZY_COUNT = 3
const FRENZY_STEP = 0.14
const FRENZY_TOP = 3.6
const ESCORT_OFFSET = 13
const ESCORT_REACH = SLOT_X * 3.5
const RESULTS_TICKS = 420
const RESULTS_SKIP = 90
const CHART_TICKS = 900
const CHART_SKIP = 40
const TITLE_TICKS = 150
/** Firefly sparkers light on a shared beat; only a lit one can be beamed. */
const SPARK_BEAT = 80
const SPARK_LIT = 36
/** A cocoon shimmers this long before it splits into three moonlets. */
const WRAP_TELL = 40
/** Beam all three moonlets of a trio for this. */
const TRIO_BONUS = 1000
/** A dust duster shakes its wings this long, then fans its curtain (none straight down). */
const DUSTER_TELL = 45
const CURTAIN = [-1.4, -1.1, -0.8, -0.5, 0.5, 0.8, 1.1, 1.4]
/** A skimmer crosses just above the water, rising once over its gap. */
const SKIM_Y = SHIP_Y - 2
const SKIM_TELL = 54
const SKIM_LIFT = 42
const SKIM_GAP_HALF = 22
/** Floating candles drift on the river; dust that reaches one goes out on it. */
const CANDLES = 4
const CANDLE_Y = RIVER_TOP + 3
/** Glow and Guardian stages have no formation of their own; their dust and dives use this. */
const OPEN_SKY: Tuning = {
  diveGap: 150,
  divers: 0,
  diveSpeed: 2.1,
  dust: 0.016,
  capture: 0,
}

const GUARDIANS: Record<GuardianName, (lap: number) => BossFight> = {
  'grand-lantern-moth': grandLanternMoth,
  'silk-spinner': silkSpinner,
  'heron-kite': heronKite,
}

type Mode =
  | 'wait'
  | 'enter'
  | 'home'
  | 'form'
  | 'dive'
  | 'beam'
  | 'escort'
  | 'glow'
  | 'skim'
  | 'shake'
  | 'wrap'
type Moth = {
  kind: Kind
  hp: number
  col: number
  row: number
  x: number
  y: number
  heading: number
  speed: number
  mode: Mode
  path: Pt[]
  step: number
  /** Ticks spent heading for the current path point. */
  stepTicks: number
  spawnAt: number
  timer: number
  /** A queen holding a captured lantern. */
  holding: boolean
  /** Flock moths a queen's glow has taken. */
  heldFlock: Kind[]
  gone: boolean
  /** Dust dropped flying in, as a share of the stage's dive dust. */
  fire: number
  /** Dive waypoints that lean toward the lantern. */
  track: number[]
  /** This dive comes back up from below on its own. */
  returns: boolean
  /** An escort's queen, and the side it flies on. */
  leader: Moth | null
  offset: number
  /** A diving queen's escorts, and how many of them were beamed. */
  escorts: number
  escortsBeamed: number
  /** Last-moth frenzy passes flown. */
  passes: number
  /** This dive's trick (a duster's curtain, a cocoon's wrap) is spent. */
  trick: boolean
  /** A moonlet's trio. */
  brood: number
  /** A skimmer's crossing: which way, and where its gap is. */
  dir: -1 | 1
  gapX: number
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  owner: 'lantern' | FriendBeam
  /** A piercing beam's moths already struck. */
  pierced: Moth[]
}
type Dust = { x: number; y: number; vx: number; ember: boolean }
type Drifter = { x: number; y: number; tx: number; ty: number; dock: boolean }
type Friend = { kind: Kind; beam: FriendBeam; x: number; y: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
type Banner = { text: string; sub?: string; sub2?: string; ticks: number }
type Results = { ticks: number; tally: Tally; zone: Zone }
type Chart = { ticks: number; lap: number; watch: number; choice: number }
type Homecoming = { x: number; y: number; members: Kind[]; power: number }

const POINTS: Record<Kind, [number, number]> = {
  moth: [50, 100],
  luna: [80, 160],
  escort: [80, 160],
  queen: [150, 400],
  cocoon: [60, 160],
  sparker: [80, 200],
  skimmer: [100, 300],
  duster: [100, 250],
  moonlet: [100, 150],
}

const CRANE_SETS: Record<'crane' | 'leaf' | 'fish', readonly MothSet[]> = {
  crane: CRANES,
  leaf: LEAVES,
  fish: FISH,
}

/** The queen's tractor glow, banded light stepping down the beam. */
const TRACTOR = [RAMPS.purple[2], RAMPS.purple[3], RAMPS.teal[3]] as const

const skimLift = (m: Moth, x: number) =>
  SKIM_LIFT * Math.exp(-(((x - m.gapX) / SKIM_GAP_HALF) ** 2))

class LanternSwarm implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private stageTick = 0
  private stageIndex = 0
  private place: StagePlace = stageAt(0)
  private tune: Tuning = OPEN_SKY
  private x = W / 2
  private alive = true
  private twin = false
  private respawn = 0
  private safe = 0
  private beams: Shot[] = []
  private dust: Dust[] = []
  private moths: Moth[] = []
  private drifters: Drifter[] = []
  private guardian: BossFight | null = null
  private diveTimer = 0
  private clear = 0
  private glow = false
  private glowHits = 0
  private glowTotal = 0
  private frenzy = false
  /** Escort bonuses earned this Watch: each pays more than the last. */
  private escortChain = 0
  private tally: Tally = newTally()
  private night = { shots: 0, hits: 0 }
  private results: Results | null = null
  private chart: Chart | null = null
  private gauge = GAUGE_MAX
  private bTicks = 0
  private coneOpen = false
  private flock: Friend[] = []
  private homecoming: Homecoming | null = null
  private charm: { kind: CharmKind; ticks: number } | null = null
  private charms: Array<{ kind: CharmKind; x: number; y: number }> = []
  private broods = new Map<number, number>()
  private nextBrood = 1
  private nextExtra = FIRST_EXTRA
  private stars: Array<{ x: number; y: number; s: number }> = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  /** Flock moths fluttering home after taking a hit (cosmetic). */
  private homing: Array<{ kind: Kind; x: number; y: number; life: number }> = []
  private banner: Banner | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(83)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 50; i++)
      this.stars.push({
        x: this.rng() * W,
        y: this.rng() * H,
        s: 0.2 + this.rng() * 0.8,
      })
    this.startStage(0)
  }

  // --- the night's route ----------------------------------------------------------

  /** Jumps to the night's `index`th stage, taking `branches` at its forks (tests and resumes). */
  private startStage(index: number, branches: readonly number[] = []) {
    this.stageIndex = index
    this.place = stageAt(index, branches)
    this.beginStage()
  }

  private beginStage() {
    const { stage, zone, stageIndex, lap } = this.place
    this.level = this.stageIndex + 1
    this.glow = stage.kind === 'glow'
    this.stageTick = 0
    this.moths = []
    this.dust = []
    this.beams = []
    this.guardian = null
    this.homecoming = null
    this.frenzy = false
    this.diveTimer = 120
    if (stageIndex === 0) {
      this.tally = newTally()
      this.escortChain = 0
    }
    this.tune =
      stage.kind === 'formation'
        ? tuneFor(stage.tune, lap)
        : tuneFor(OPEN_SKY, lap)
    if (stage.kind === 'formation') this.buildEntrance(stage)
    else if (stage.kind === 'glow') this.buildGlow(stage.choreography)
    else this.guardian = GUARDIANS[stage.guardian](lap)
    this.glowHits = 0
    this.glowTotal = this.moths.length
    if (stageIndex === 0)
      this.banner = {
        text: `${zone.watch} WATCH`,
        sub: lap > 1 ? `${zone.name}  NIGHT ${lap}` : zone.name,
        ticks: TITLE_TICKS,
      }
    else if (stage.kind === 'glow')
      this.banner = { text: 'GLOW STAGE', sub: stage.name, ticks: 120 }
    else if (stage.kind === 'guardian')
      this.banner = { text: 'GUARDIAN!', sub: stage.name, ticks: 140 }
    else
      this.banner = { text: `STAGE ${this.level}`, sub: stage.name, ticks: 100 }
  }

  private formationStage(): FormationStage | null {
    const stage = this.place.stage
    return stage.kind === 'formation' ? stage : null
  }

  private nextStage() {
    const { stageIndex, zone } = this.place
    if (stageIndex === zone.stages.length - 1) {
      this.tally.flock = this.flock.length
      this.results = { ticks: 0, tally: this.tally, zone }
      this.banner = null
      this.sound.play('level')
      return
    }
    this.stageIndex++
    this.place = placeOf({ ...this.place, stage: stageIndex + 1 })
    this.beginStage()
  }

  /** After the results card: the Sky Chart when the next Watch forks, else straight on. */
  private afterResults() {
    this.results = null
    const next = nextWatch(this.place.lap, this.place.watch)
    if (WATCHES[next.watch]!.length > 1) {
      this.chart = { ticks: 0, ...next, choice: 0 }
      this.sound.play('start')
      return
    }
    this.flyTo(next.lap, next.watch, 0)
  }

  private flyTo(lap: number, watch: number, branch: number) {
    this.chart = null
    this.stageIndex++
    this.place = placeOf({ lap, watch, branch, stage: 0 })
    this.beginStage()
  }

  private newMoth(
    kind: Kind,
    slot: Slot,
    path: readonly Pt[],
    spawnAt: number,
    fire: number,
  ): Moth {
    return {
      kind,
      hp: kind === 'queen' ? 2 : 1,
      col: slot.col,
      row: slot.row,
      x: path[0]!.x,
      y: path[0]!.y,
      heading: Math.PI / 2,
      speed: ENTER_SPEED,
      mode: 'wait',
      path: path.map((p) => ({ ...p })),
      step: 1,
      stepTicks: 0,
      spawnAt,
      timer: 0,
      holding: false,
      heldFlock: [],
      gone: false,
      fire,
      track: [],
      returns: false,
      leader: null,
      offset: 0,
      escorts: 0,
      escortsBeamed: 0,
      passes: 0,
      trick: false,
      brood: 0,
      dir: 1,
      gapX: W / 2,
    }
  }

  /** The stage's scripted entrance: each group flies its path, filling slots in the stage's order. */
  private buildEntrance(stage: FormationStage) {
    const kinds: SlotKind[] = ['queen', 'escort', 'luna', 'moth']
    const slots = Object.fromEntries(
      kinds.map((k) => [k, slotsFor(stage.layout, k, stage.fill)]),
    ) as Record<SlotKind, Slot[]>
    const used: Record<SlotKind, number> = {
      queen: 0,
      escort: 0,
      luna: 0,
      moth: 0,
    }
    for (const group of stage.entrance) {
      group.kinds.forEach((kind, i) => {
        const slotKind = SLOT_OF[kind] ?? 'moth'
        const list = slots[slotKind]
        const slot = list[used[slotKind]++ % list.length]!
        const twin = group.pair && i % 2 === 1
        const path = PATHS[twin ? mirrorPath(group.path) : group.path]
        const order = group.pair ? Math.floor(i / 2) : i
        const at = 30 + Math.round(group.at * GROUP_GAP) + order * SPAWN_GAP
        this.moths.push(this.newMoth(kind, slot, path, at, group.fire ?? 0))
      })
    }
  }

  /** A Glow Stage: forty dancers fly the choreography through and away, no dives and no dust. */
  private buildGlow(name: GlowName) {
    GLOW_CHOREOGRAPHIES[name].forEach((group, gi) => {
      for (let i = 0; i < group.count; i++) {
        const at = 30 + Math.round(group.at * GROUP_GAP) + i * SPAWN_GAP
        this.moths.push(
          this.newMoth('moth', { row: gi, col: i }, group.path, at, 0),
        )
      }
    })
  }

  private updateResults(input: InputFrame) {
    const r = this.results!
    r.ticks++
    if (
      (r.ticks >= RESULTS_SKIP && input.pressed.a) ||
      r.ticks >= RESULTS_TICKS
    )
      this.afterResults()
  }

  private updateChart(input: InputFrame) {
    const c = this.chart!
    c.ticks++
    const ways = WATCHES[c.watch]!.length
    if (input.pressed.left) c.choice = 0
    if (input.pressed.right) c.choice = ways - 1
    if ((input.pressed.left || input.pressed.right) && c.ticks > 1)
      this.sound.play('blip')
    if ((c.ticks >= CHART_SKIP && input.pressed.a) || c.ticks >= CHART_TICKS)
      this.flyTo(c.lap, c.watch, c.choice)
  }

  private slotPos(m: Moth): Pt {
    const sway = Math.sin(this.tick / 70) * 12
    return {
      x: W / 2 + (m.col - 4.5) * SLOT_X + sway,
      y: FORM_TOP + m.row * SLOT_Y,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    this.fx.update()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    for (const s of this.stars) {
      s.y += s.s
      if (s.y > H) s.y -= H
    }
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.chart) {
      this.updateChart(controls)
      return
    }
    if (this.results) {
      this.updateResults(controls)
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.nextStage()
      return
    }
    this.stageTick++
    this.updateShip(controls)
    this.updateFlock()
    if (this.guardian) this.updateGuardianStage(this.guardian)
    this.updateMoths()
    this.befriend()
    this.updateShots()
    this.updateHomecoming()
    this.updateCharms()
    this.updateDrifters()
    this.checkStageEnd()
  }

  private updateShip(input: InputFrame) {
    if (!this.alive) {
      this.coneOpen = false
      this.bTicks = 0
      if (this.respawn > 0 && --this.respawn === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'LIGHTS OUT',
            sub: 'GAME OVER',
            sub2: `NIGHT HIT RATIO ${ratioText(this.night)}`,
            ticks: 9999,
          }
          return
        }
        this.alive = true
        this.x = W / 2
        this.safe = SAFE_TICKS
      }
      return
    }
    if (this.safe > 0) this.safe--
    const half = this.twin ? 14 : 7
    if (input.held.left) this.x = Math.max(half, this.x - SHIP_SPEED)
    if (input.held.right) this.x = Math.min(W - half, this.x + SHIP_SPEED)
    // B: hold for the Welcome Glow, tap for the Homecoming dive.
    if (input.held.b) this.bTicks++
    else {
      if (this.bTicks > 0 && this.bTicks <= TAP_TICKS && this.flock.length > 0)
        this.launchHomecoming()
      this.bTicks = 0
    }
    this.coneOpen = input.held.b && this.gauge > 0
    if (this.coneOpen) this.gauge = Math.max(0, this.gauge - GAUGE_DRAIN)
    if (input.pressed.a) this.fire()
  }

  private fire() {
    const spec = beamFor(this.charm?.kind ?? null)
    const guns = this.twin ? [this.x - 7, this.x + 7] : [this.x]
    const mine = this.beams.filter((b) => b.owner === 'lantern').length
    const friendly = this.beams.length - mine
    if (mine + guns.length > spec.perGun * guns.length) return
    for (const gx of guns)
      this.beams.push({
        x: gx,
        y: SHIP_Y - 8,
        vx: 0,
        vy: -spec.speed,
        owner: 'lantern',
        pierced: [],
      })
    this.tally.shots += guns.length
    this.night.shots += guns.length
    // The Flock beams with you, each friend its own way.
    if (friendly < this.flock.length * 2)
      for (const f of this.flock) {
        const speed = FRIEND_BEAM_SPEED[f.beam]
        this.beams.push({
          x: f.x,
          y: f.y - 6,
          vx: speed.vx * (f.x < this.x ? -1 : 1),
          vy: speed.vy,
          owner: f.beam,
          pierced: [],
        })
      }
    this.sound.play('shoot')
  }

  private countHit() {
    this.tally.hits++
    this.night.hits++
  }

  private updateFlock() {
    this.flock.forEach((f, i) => {
      const slot = FLOCK_SLOTS[i]!
      f.x += (this.x + slot.x - f.x) * 0.25
      f.y += (SHIP_Y + slot.y + Math.sin(this.tick / 12 + i) - f.y) * 0.25
    })
    for (const h of this.homing) {
      h.y -= 1.2
      h.x += Math.sin(h.life / 6)
      h.life--
    }
    this.homing = this.homing.filter((h) => h.life > 0)
  }

  /** A moth diving through the cone while the gauge is full joins the Flock. */
  private befriend() {
    if (!this.coneOpen || !this.alive || this.gauge < FRIEND_AT) return
    if (this.flock.length >= FLOCK_MAX) return
    const friend = this.moths.find(
      (m) =>
        !m.gone &&
        (m.mode === 'dive' || m.mode === 'escort') &&
        friendBeam(m.kind, m.hp) !== null &&
        inCone(m.x, m.y, this.x, SHIP_Y),
    )
    if (!friend) return
    friend.gone = true
    this.flock.push({
      kind: friend.kind,
      beam: friendBeam(friend.kind, friend.hp)!,
      x: friend.x,
      y: friend.y,
    })
    this.gauge = 0
    this.tally.friends++
    this.addScore(POINTS[friend.kind][1], friend.x, friend.y - 8)
    this.floaters.push({
      x: friend.x,
      y: friend.y - 18,
      text: 'FRIEND!',
      life: 50,
    })
    this.fx.burst(friend.x, friend.y, this.fxRng, {
      count: 10,
      colours: [RAMPS.gold[4], RAMPS.pink[3]],
    })
    this.sound.play('pickup')
    if (friend.holding) {
      friend.holding = false
      this.rescue(friend.x, friend.y - 10, true)
    }
    this.freeFlock(friend)
  }

  /** Flock moths a queen's glow took come back when she is beamed or befriended. */
  private freeFlock(m: Moth) {
    if (m.heldFlock.length === 0) return
    for (const kind of m.heldFlock)
      if (this.flock.length < FLOCK_MAX)
        this.flock.push({
          kind,
          beam: friendBeam(kind, 1) ?? 'straight',
          x: m.x,
          y: m.y,
        })
    m.heldFlock = []
    this.banner = { text: 'FLOCK FREED!', ticks: 80 }
  }

  private launchHomecoming() {
    this.homecoming = {
      x: this.x,
      y: SHIP_Y - 12,
      members: this.flock.map((f) => f.kind),
      power: this.flock.length * HOMECOMING.hitsEach,
    }
    this.flock = []
    this.floaters.push({
      x: this.x,
      y: SHIP_Y - 30,
      text: 'HOMECOMING!',
      life: 60,
    })
    this.sound.play('extra')
  }

  /** The Homecoming dive flies up through everything in its column. */
  private updateHomecoming() {
    const h = this.homecoming
    if (!h) return
    h.y -= HOMECOMING.speed
    for (const m of this.moths) {
      if (m.gone || m.mode === 'wait') continue
      if (Math.abs(m.x - h.x) >= HOMECOMING.half || Math.abs(m.y - h.y) >= 8)
        continue
      m.hp = 1
      this.hitMoth(m)
    }
    if (this.guardian && h.power > 0) {
      const hit = this.guardian.hit(h.x, h.y)
      if (hit) {
        h.power--
        this.guardianHit(this.guardian, hit)
      }
    }
    if (h.y < HUD_H) this.homecoming = null
  }

  private updateCharms() {
    for (const c of this.charms) {
      c.y += CHARM_FALL
      if (
        this.alive &&
        Math.abs(c.x - this.x) < 12 &&
        Math.abs(c.y - SHIP_Y) < 12
      ) {
        this.charm = { kind: c.kind, ticks: CHARMS[c.kind].ticks }
        this.banner = {
          text: CHARMS[c.kind].name,
          sub: CHARMS[c.kind].line,
          ticks: 90,
        }
        this.sound.play('pickup')
        c.y = H + 99
      }
    }
    this.charms = this.charms.filter((c) => c.y < H + 10)
    if (this.charm && --this.charm.ticks <= 0) this.charm = null
  }

  private dropCharm(x: number, y: number) {
    const kind = CHARM_KINDS[Math.floor(this.rng() * CHARM_KINDS.length)]!
    this.charms.push({ kind, x: Math.max(12, Math.min(W - 12, x)), y })
  }

  private updateMoths() {
    const stage = this.formationStage()
    const live = this.moths.filter((m) => !m.gone)
    const diving = live.filter(
      (m) => m.mode === 'dive' || m.mode === 'beam' || m.mode === 'skim',
    ).length
    const entering = live.some((m) => m.mode === 'wait' || m.mode === 'enter')
    if (
      stage &&
      !this.frenzy &&
      !entering &&
      live.length > 0 &&
      live.length <= FRENZY_COUNT
    ) {
      this.frenzy = true
      this.floaters.push({ x: W / 2, y: 136, text: 'LAST FLUTTER!', life: 70 })
    }
    for (const m of this.moths) {
      if (m.gone) continue
      switch (m.mode) {
        case 'wait':
          if (this.stageTick >= m.spawnAt) m.mode = this.glow ? 'glow' : 'enter'
          break
        case 'enter':
        case 'glow':
          if (m.mode === 'enter' && m.fire > 0) this.maybeDust(m, m.fire)
          if (this.followPath(m, 0.13)) {
            if (m.mode === 'glow') m.gone = true
            else m.mode = 'home'
          }
          break
        case 'home': {
          const slot = this.slotPos(m)
          this.steer(m, slot, 0.2, 2.2)
          if (Math.hypot(slot.x - m.x, slot.y - m.y) < 4) {
            m.mode = 'form'
            m.heading = Math.PI / 2
          }
          break
        }
        case 'form': {
          const slot = this.slotPos(m)
          m.x = slot.x
          m.y = slot.y
          if (this.frenzy) this.launchDive(m)
          break
        }
        case 'dive':
          this.dive(m)
          break
        case 'beam':
          this.tractor(m)
          break
        case 'escort':
          this.escortFly(m)
          break
        case 'skim':
          this.skim(m)
          break
        case 'shake':
          this.shake(m)
          break
        case 'wrap':
          this.wrap(m)
          break
      }
    }
    if (!stage) return
    // Launch a new dive now and then (on some stages, even mid-entrance).
    const early = !!stage.earlyDives && this.stageTick > 30 + 2 * GROUP_GAP
    if (
      !this.frenzy &&
      (!entering || early) &&
      this.alive &&
      --this.diveTimer <= 0
    ) {
      this.diveTimer = Math.round(this.tune.diveGap * (0.6 + this.rng() * 0.8))
      if (diving < this.tune.divers) this.launchDive()
    }
  }

  /** Steers along the moth's path; true when the last point is reached. */
  private followPath(m: Moth, turn: number): boolean {
    const target = m.path[m.step]
    if (!target) return true
    this.steer(m, target, turn, m.speed)
    // Close enough, or circling it too long: on to the next point.
    if (
      Math.hypot(target.x - m.x, target.y - m.y) < m.speed * 4 + 6 ||
      ++m.stepTicks > 110
    ) {
      m.step++
      m.stepTicks = 0
    }
    return m.step >= m.path.length
  }

  private steer(m: Moth, target: Pt, turn: number, speed: number) {
    const want = Math.atan2(target.y - m.y, target.x - m.x)
    let diff = want - m.heading
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    m.heading += Math.max(-turn, Math.min(turn, diff))
    m.x += Math.cos(m.heading) * speed
    m.y += Math.sin(m.heading) * speed
  }

  /** Sends `chosen` (or a moth picked at random from the formation) on a dive. */
  private launchDive(chosen?: Moth) {
    const stage = this.formationStage()
    if (!stage) return
    let m = chosen
    if (!m) {
      const ready = this.moths.filter((x) => x.mode === 'form' && !x.gone)
      if (ready.length === 0) return
      m = ready[Math.floor(this.rng() * ready.length)]!
    }
    const side = m.x < W / 2 ? -1 : 1
    if (this.frenzy) {
      m.passes++
      m.speed = Math.min(
        FRENZY_TOP,
        this.tune.diveSpeed * (1 + FRENZY_STEP * m.passes),
      )
    } else m.speed = this.tune.diveSpeed
    m.step = 0
    m.stepTicks = 0
    m.heading = -Math.PI / 2
    m.escorts = 0
    m.escortsBeamed = 0
    m.trick = false
    // A queen without a captive sometimes comes down to shine her glow.
    if (
      m.kind === 'queen' &&
      !m.holding &&
      m.heldFlock.length === 0 &&
      !this.twin &&
      !this.frenzy &&
      this.rng() < this.tune.capture
    ) {
      m.mode = 'beam'
      m.timer = -1
      m.track = []
      m.path = [
        { x: m.x + side * 26, y: m.y - 16 },
        { x: this.x, y: H - 120 },
      ]
      return
    }
    // A skimmer drops off the side to the water, then skims across.
    if (m.kind === 'skimmer') {
      m.mode = 'skim'
      m.timer = -1
      m.dir = side < 0 ? 1 : -1
      m.gapX = 40 + this.rng() * (W - 80)
      m.track = []
      m.path = [
        { x: side < 0 ? 24 : W - 24, y: 170 },
        { x: side < 0 ? -16 : W + 16, y: SKIM_Y - 30 },
      ]
      this.sound.play('warn')
      return
    }
    const plan = planDive(stage.dives, {
      x: m.x,
      y: m.y,
      side,
      lanternX: this.x,
      shipY: SHIP_Y,
      rng: this.rng,
    })
    m.mode = 'dive'
    m.path = plan.path
    m.track = plan.track
    m.returns = plan.returns
    if (m.kind === 'queen' && !this.frenzy) this.callEscorts(m)
    this.sound.play('warn')
  }

  /** Up to two escort lunas near a diving queen peel off with her, one on each side. */
  private callEscorts(q: Moth) {
    const dist = (e: Moth) => Math.hypot(e.x - q.x, e.y - q.y)
    const near = this.moths
      .filter(
        (e) =>
          !e.gone &&
          e.kind === 'escort' &&
          e.mode === 'form' &&
          dist(e) < ESCORT_REACH,
      )
      .sort((a, b) => dist(a) - dist(b))
      .slice(0, 2)
      .sort((a, b) => a.x - b.x)
    near.forEach((e, i) => {
      e.mode = 'escort'
      e.leader = q
      e.speed = q.speed
      e.heading = q.heading
      e.offset =
        near.length === 2
          ? (i === 0 ? -1 : 1) * ESCORT_OFFSET
          : (Math.sign(e.x - q.x) || 1) * ESCORT_OFFSET
    })
    q.escorts = near.length
  }

  private escortFly(m: Moth) {
    const lead = m.leader
    if (lead && !lead.gone && lead.mode === 'dive') {
      m.x += (lead.x + m.offset - m.x) * 0.3
      m.y += (lead.y + 3 - m.y) * 0.3
      m.heading = lead.heading
      this.maybeDust(m)
      return
    }
    m.leader = null
    if (lead && !lead.gone) {
      // Her dive is over: back to the swarm too (round from the top when off the bottom).
      if (m.y > H) {
        m.y = -12
        m.x = this.slotPos(m).x
        m.heading = Math.PI / 2
      }
      m.mode = 'home'
      return
    }
    // Its queen was beamed: it flies the rest of her dive alone.
    m.mode = 'dive'
    m.speed = Math.max(m.speed, lead?.speed ?? this.tune.diveSpeed)
    m.path = lead
      ? lead.path.slice(lead.step).map((p) => ({ x: p.x + m.offset, y: p.y }))
      : []
    if (m.path.length === 0) m.path = [{ x: m.x, y: H + 30 }]
    m.step = 0
    m.stepTicks = 0
    m.track = []
    m.returns = lead?.returns ?? false
  }

  private dive(m: Moth) {
    // The tracking waypoints lean toward the lantern as the moth comes down.
    for (const i of m.track) {
      const p = m.path[i]
      if (p && m.step <= i) p.x += Math.sign(this.x - p.x) * 0.5
    }
    const done = this.followPath(m, 0.11)
    this.maybeDust(m)
    if (m.holding) {
      const c = this.captivePos(m)
      this.dropDust(c.x, c.y, this.tune.dust * 0.8, true)
    }
    // A duster stops mid-dive to shake out its curtain; a cocoon wraps itself up to split.
    if (!m.trick && m.kind === 'duster' && m.y > 96 && m.y < SHIP_Y - 110) {
      m.trick = true
      m.mode = 'shake'
      m.timer = DUSTER_TELL
      return
    }
    if (
      !m.trick &&
      m.kind === 'cocoon' &&
      m.step >= 2 &&
      m.y > 110 &&
      m.y < SHIP_Y - 70
    ) {
      m.trick = true
      m.mode = 'wrap'
      m.timer = WRAP_TELL
      return
    }
    if (done || (!m.returns && m.y > H + 20)) {
      // A moonlet has no place in the swarm: once past, it is gone.
      if (m.kind === 'moonlet') {
        m.gone = true
        return
      }
      if (!m.returns) {
        // Loop back in from the top and settle into its place.
        m.y = -12
        m.x = this.slotPos(m).x
        m.heading = Math.PI / 2
      }
      m.mode = 'home'
    }
  }

  /** The duster hangs and shakes (the tell), then fans a curtain with a pocket under its body. */
  private shake(m: Moth) {
    if (--m.timer > 0) return
    if (this.alive)
      for (const vx of CURTAIN)
        this.dust.push({ x: m.x, y: m.y + 6, vx, ember: false })
    this.sound.play('warn')
    m.mode = 'dive'
  }

  /** The cocoon shimmers in its silk (the tell), then splits into three fast moonlets. */
  private wrap(m: Moth) {
    m.y += 0.3
    if (--m.timer > 0) return
    m.gone = true
    const brood = this.nextBrood++
    for (const k of [-1, 0, 1] as const)
      this.spawnMoonlet(m.x + k * 8, m.y, brood, k)
    this.fx.burst(m.x, m.y, this.fxRng, {
      count: 10,
      colours: [RAMPS.steel[4], RAMPS.purple[3]],
    })
    this.sound.play('pop')
  }

  private spawnMoonlet(x: number, y: number, brood: number, k: -1 | 0 | 1) {
    const m = this.newMoth('moonlet', { row: 0, col: k + 1 }, [{ x, y }], 0, 0)
    m.mode = 'dive'
    m.brood = brood
    m.speed = Math.min(FRENZY_TOP, this.tune.diveSpeed * 1.45)
    m.step = 0
    m.path = [
      { x: this.x + k * 26, y: SHIP_Y },
      { x: this.x + k * 44, y: H + 30 },
    ]
    m.track = [0]
    this.broods.set(brood, this.broods.get(brood) ?? 0)
    this.moths.push(m)
  }

  /** A skimmer: down to the water off one side, a ripple (the tell), then the crossing. */
  private skim(m: Moth) {
    const edge = m.dir > 0 ? -16 : W + 16
    if (m.timer < 0) {
      m.speed = this.tune.diveSpeed
      if (this.followPath(m, 0.15)) {
        m.timer = SKIM_TELL
        m.x = edge
        m.y = SKIM_Y
      }
      return
    }
    if (m.timer > 0) {
      m.timer--
      return
    }
    m.x += m.dir * (this.tune.diveSpeed + 0.3)
    m.y = SKIM_Y - skimLift(m, m.x) + Math.sin(m.x / 9) * 1.5
    m.heading = m.dir > 0 ? 0 : Math.PI
    if ((m.dir > 0 && m.x > W + 16) || (m.dir < 0 && m.x < -16)) {
      m.y = -12
      m.x = this.slotPos(m).x
      m.heading = Math.PI / 2
      m.mode = 'home'
    }
  }

  private tractor(m: Moth) {
    if (m.timer < 0) {
      if (this.followPath(m, 0.13)) {
        m.timer = BEAM_TICKS
        m.heading = Math.PI / 2
        this.sound.play('warn')
      }
      return
    }
    m.timer--
    const reach = this.beamReach(m)
    if (
      this.alive &&
      this.safe === 0 &&
      !this.twin &&
      reach > 0.8 &&
      Math.abs(this.x - m.x) < this.beamHalf(m)
    ) {
      m.timer = 0
      this.sound.play('die')
      if (this.flock.length > 0) {
        // The glow takes the Flock instead of the lantern.
        m.heldFlock = this.flock.map((f) => f.kind)
        this.flock = []
        this.banner = {
          text: 'FLOCK CAUGHT!',
          sub: 'BEAM THE QUEEN TO FREE THEM',
          ticks: 110,
        }
      } else {
        // Caught! The lantern floats up to the queen.
        this.alive = false
        this.lives--
        this.respawn = RESPAWN_TICKS
        this.drifters.push({
          x: this.x,
          y: SHIP_Y,
          tx: m.x,
          ty: m.y - 10,
          dock: false,
        })
        m.holding = true
        this.banner = {
          text: 'CAUGHT!',
          sub: 'BEAM THE QUEEN TO GET IT BACK',
          ticks: 110,
        }
      }
    }
    if (m.timer <= 0) {
      m.mode = 'home'
      m.speed = 2
    }
  }

  /** 0..1: how far down the queen's glow has spread. */
  private beamReach(m: Moth): number {
    if (m.mode !== 'beam' || m.timer < 0) return 0
    const t = BEAM_TICKS - m.timer
    return Math.min(1, t / 40, m.timer / 20)
  }

  private beamHalf(m: Moth): number {
    return 6 + 14 * this.beamReach(m)
  }

  /**
   * Where a queen's captive lantern flies: over her in the swarm, and trailing off her shoulder in
   * a dive, where a careless beam can reach it.
   */
  private captivePos(m: Moth): Pt {
    if (m.mode === 'form' || m.mode === 'home' || m.mode === 'beam')
      return { x: m.x, y: m.y - 14 }
    const h = m.heading
    return {
      x: m.x - Math.cos(h) * 10 - Math.sin(h) * 9,
      y: m.y - Math.sin(h) * 10 + Math.cos(h) * 9,
    }
  }

  private sparkLit(): boolean {
    return this.stageTick % SPARK_BEAT < SPARK_LIT
  }

  /** Can a beam strike this moth now? (A dark sparker or an offstage skimmer cannot be hit.) */
  private hittable(m: Moth): boolean {
    if (m.gone || m.mode === 'wait') return false
    if (m.kind === 'sparker' && !this.sparkLit()) return false
    if (m.mode === 'skim' && m.timer !== 0) return false
    return true
  }

  private maybeDust(m: Moth, share = 1) {
    this.dropDust(m.x, m.y, this.tune.dust * share, false)
  }

  private dropDust(x: number, y: number, chance: number, ember: boolean) {
    if (!this.alive || y > SHIP_Y - 50 || y < HUD_H) return
    if (this.rng() >= chance) return
    // Dust drifts a little toward the lantern.
    const ticks = (SHIP_Y - y) / DUST_SPEED
    const vx = Math.max(-0.7, Math.min(0.7, (this.x - x) / ticks))
    this.dust.push({ x, y: y + 6, vx, ember })
  }

  /** The floating candles' places on the river (River of Lights only). */
  private candles(): number[] {
    if (!this.place.zone.candles) return []
    return Array.from(
      { length: CANDLES },
      (_, i) => ((i * 64 + this.stageTick * 0.3) % (W + 24)) - 12,
    )
  }

  private updateGuardianStage(gd: BossFight) {
    gd.update({
      rng: this.rng,
      lanternX: this.x,
      shipY: SHIP_Y,
      open: this.alive && this.safe === 0,
      diveSpeed: this.tune.diveSpeed,
      dust: (x, y, vx) => {
        if (this.alive) this.dust.push({ x, y, vx, ember: false })
      },
      caught: (x) => this.guardianCaught(gd, x),
      crash: (x) => this.loseShip(x),
      sound: (name) => this.sound.play(name),
      spawn: (_kind, x, y, brood) =>
        this.spawnMoonlet(
          x,
          y,
          10_000 + brood,
          (Math.sign(x - gd.x) || 0) as -1 | 0 | 1,
        ),
    })
  }

  /** A Guardian's glow took hold: a friend or a twin takes it, else the lantern is carried off. */
  private guardianCaught(gd: BossFight, x: number): boolean {
    if (this.twin || this.flock.length > 0) {
      this.loseShip(x)
      return false
    }
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.beams = []
    this.drifters.push({ x, y: SHIP_Y, tx: gd.x, ty: gd.y + 18, dock: false })
    this.sound.play('die')
    this.banner = {
      text: 'CAUGHT!',
      sub: 'CALM THE GUARDIAN TO WIN IT BACK',
      ticks: 110,
    }
    return true
  }

  private guardianHit(gd: BossFight, hit: GuardianHit) {
    this.gauge = Math.min(GAUGE_MAX, this.gauge + GAUGE_REFILL / 2)
    if (hit.kind === 'shrug') {
      this.fx.burst(hit.x, hit.y + 10, this.fxRng, {
        count: 3,
        speed: 0.8,
        colours: [RAMPS.steel[3], RAMPS.gold[3]],
      })
      this.sound.play('blip')
      return
    }
    if (hit.points > 0) this.addScore(hit.points, hit.x, hit.y - 8)
    if (hit.kind === 'ring') this.sparkle(hit.x, hit.y, 'escort')
    else if (hit.points > 0) {
      this.fx.burst(hit.x, hit.y, this.fxRng, {
        count: 14,
        speed: 2,
        colours: [RAMPS.gold[4], RAMPS.rust[3], RAMPS.pink[3]],
      })
      this.sound.play('pop')
    } else {
      this.fx.burst(hit.x, hit.y, this.fxRng, { count: 4, speed: 1 })
      this.sound.play('blip')
    }
    if (hit.calmed) {
      this.tally.guardians++
      this.banner = { text: 'AT PEACE!', sub: gd.calmLine, ticks: 170 }
      this.fx.burst(gd.x, gd.y, this.fxRng, {
        count: 30,
        speed: 2.6,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
      })
      this.sound.play('extra')
      // Whatever it let loose flutters home with it.
      for (const m of this.moths)
        if (!m.gone) {
          m.gone = true
          this.sparkle(m.x, m.y, m.kind)
        }
      if (gd.holding) {
        gd.holding = false
        this.rescue(gd.x, gd.y + 18, true)
      }
    } else if (hit.phaseOver) this.banner = { ...gd.phaseBanner(), ticks: 90 }
  }

  private updateShots() {
    const lantern = beamFor(this.charm?.kind ?? null)
    for (const b of this.beams) {
      if (b.owner === 'lantern' && this.charm?.kind === 'kite') this.curve(b)
      b.x += b.vx
      b.y += b.vy
      const ours = b.owner === 'lantern'
      if (this.guardian) {
        const hit = this.guardian.hit(b.x, b.y)
        if (hit) {
          b.y = -99
          if (ours) this.countHit()
          this.guardianHit(this.guardian, hit)
          continue
        }
      }
      const half = ours ? lantern.half : b.owner === 'pierce' ? 9 : 6
      const hit = this.moths.find(
        (m) =>
          this.hittable(m) &&
          !b.pierced.includes(m) &&
          Math.abs(m.x - b.x) < half &&
          Math.abs(m.y - b.y) < 7,
      )
      if (hit) {
        if (b.owner === 'pierce') b.pierced.push(hit)
        else b.y = -99
        if (ours) this.countHit()
        this.gauge = Math.min(GAUGE_MAX, this.gauge + GAUGE_REFILL)
        this.hitMoth(hit)
        continue
      }
      const captive = this.moths.find((m) => {
        if (m.gone || !m.holding) return false
        const c = this.captivePos(m)
        return Math.abs(c.x - b.x) < 5 && Math.abs(c.y - b.y) < 6
      })
      if (captive) {
        b.y = -99
        if (ours) this.countHit()
        this.loseCaptive(captive)
      }
    }
    this.beams = this.beams.filter(
      (b) => b.y > HUD_H - 4 && b.x > -8 && b.x < W + 8,
    )
    const candles = this.candles()
    for (const d of this.dust) {
      d.y += DUST_SPEED
      d.x += d.vx
      if (
        candles.some(
          (cx) => Math.abs(cx - d.x) < 5 && Math.abs(CANDLE_Y - d.y) < 5,
        )
      ) {
        d.y = H + 99
        continue
      }
      if (this.alive && this.safe === 0 && this.shipHit(d.x, d.y, 3)) {
        d.y = H + 99
        if (this.charm?.kind === 'mirror') {
          this.charm = null
          this.safe = 30
          this.floaters.push({
            x: this.x,
            y: SHIP_Y - 20,
            text: 'BLOCKED!',
            life: 40,
          })
          this.sound.play('blip')
        } else this.loseShip(d.x)
      }
    }
    this.dust = this.dust.filter((d) => d.y < H)
    // Diving moths that fly into the lantern.
    if (this.alive && this.safe === 0)
      for (const m of this.moths)
        if (
          !m.gone &&
          (m.mode === 'dive' ||
            m.mode === 'home' ||
            m.mode === 'escort' ||
            (m.mode === 'skim' && m.timer === 0)) &&
          this.shipHit(m.x, m.y, 6)
        ) {
          this.hitMoth(m, true)
          this.loseShip(m.x)
          break
        }
  }

  /** Kite String: a lantern beam leans toward the nearest moth still above it. */
  private curve(b: Shot) {
    let best: Moth | null = null
    for (const m of this.moths)
      if (
        this.hittable(m) &&
        m.y < b.y &&
        (!best || Math.abs(m.x - b.x) < Math.abs(best.x - b.x))
      )
        best = m
    const tx = best ? best.x : this.guardian ? this.guardian.x : b.x
    b.vx = Math.max(
      -1.6,
      Math.min(1.6, b.vx + Math.max(-0.12, Math.min(0.12, (tx - b.x) * 0.02))),
    )
  }

  /** Is (x, y) touching the lantern (or either twin)? */
  private shipHit(x: number, y: number, r: number): boolean {
    if (Math.abs(y - SHIP_Y) > 6 + r) return false
    const guns = this.twin ? [this.x - 7, this.x + 7] : [this.x]
    return guns.some((gx) => Math.abs(gx - x) < 5 + r)
  }

  private hitMoth(m: Moth, crash = false) {
    if (!crash && --m.hp > 0) {
      this.fx.burst(m.x, m.y, this.fxRng, {
        count: 4,
        speed: 1,
        colours: [RAMPS.sky[4], RAMPS.purple[3]],
      })
      this.sound.play('blip')
      return
    }
    m.gone = true
    const diving = m.mode !== 'form' && m.mode !== 'home'
    const points = this.glow ? GLOW_POINTS : POINTS[m.kind][diving ? 1 : 0]
    if (!crash) this.addScore(points, m.x, m.y - 8)
    if (this.glow) this.glowHits++
    const lead = m.leader
    if (!crash && m.mode === 'escort' && lead && !lead.gone)
      lead.escortsBeamed++
    if (
      !crash &&
      m.kind === 'queen' &&
      m.mode === 'dive' &&
      m.escorts === 2 &&
      m.escortsBeamed >= 2
    )
      this.payEscortBonus(m)
    if (!crash && m.kind === 'moonlet' && m.brood > 0) {
      const beamed = (this.broods.get(m.brood) ?? 0) + 1
      this.broods.set(m.brood, beamed)
      if (beamed === 3) {
        this.addScore(TRIO_BONUS, m.x, m.y - 18)
        this.floaters.push({ x: m.x, y: m.y - 28, text: 'TRIO!', life: 50 })
      }
    }
    this.sparkle(m.x, m.y, m.kind)
    this.sound.play('pop')
    if (m.holding) {
      m.holding = false
      this.rescue(m.x, m.y - 10, !crash)
    }
    this.freeFlock(m)
  }

  /** Both escorts first, then their queen: the bonus climbs through the Watch, and a charm falls. */
  private payEscortBonus(q: Moth) {
    const bonus = escortBonus(this.escortChain++)
    this.tally.escortBonuses++
    this.addScore(bonus, q.x, q.y - 18)
    this.floaters.push({ x: q.x, y: q.y - 28, text: 'ESCORT BONUS', life: 60 })
    this.dropCharm(q.x, Math.min(q.y, SHIP_Y - 60))
    this.sound.play('extra')
  }

  /** A freed lantern drifts down to dock as a twin, or waits as a spare. */
  private rescue(x: number, y: number, paid: boolean) {
    const dock = this.alive && !this.twin
    this.drifters.push({ x, y, tx: this.x + 14, ty: SHIP_Y, dock })
    if (paid) this.addScore(RESCUE_POINTS, x, y - 8)
    this.fx.burst(x, y, this.fxRng, {
      count: 16,
      speed: 2.2,
      colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.rust[3]],
    })
    this.banner = { text: 'RESCUED!', ticks: 80 }
    if (!dock) this.lives++
  }

  /** Beaming the turncoat captive itself loses it for good. */
  private loseCaptive(m: Moth) {
    m.holding = false
    const c = this.captivePos(m)
    this.fx.burst(c.x, c.y, this.fxRng, {
      count: 12,
      speed: 1.6,
      colours: [RAMPS.ember[2], RAMPS.ember[3], RAMPS.steel[3]],
    })
    this.sound.play('boom')
    this.banner = {
      text: 'LANTERN LOST',
      sub: 'BEAM THE QUEEN, NOT HER CAPTIVE',
      ticks: 100,
    }
  }

  /** The lantern is hit: a Flock moth takes it, then a twin, then the lantern itself. */
  private loseShip(x: number) {
    if (this.flock.length > 0) {
      const i = this.flock.reduce(
        (best, f, j) =>
          Math.abs(f.x - x) < Math.abs(this.flock[best]!.x - x) ? j : best,
        0,
      )
      const [f] = this.flock.splice(i, 1)
      this.homing.push({ kind: f!.kind, x: f!.x, y: f!.y, life: 60 })
      this.floaters.push({
        x: f!.x,
        y: f!.y - 12,
        text: 'THANK YOU!',
        life: 50,
      })
      this.safe = 50
      this.sound.play('blip')
      return
    }
    this.sparkle(x, SHIP_Y, 'queen')
    this.sound.play('die')
    if (this.twin) {
      // One of the pair is knocked off; the other carries on in the middle.
      this.twin = false
      this.x = x < this.x ? this.x + 7 : this.x - 7
      this.safe = 40
      return
    }
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.beams = []
  }

  private updateDrifters() {
    for (const d of this.drifters) {
      if (d.dock) {
        d.tx = this.x + 14
        d.ty = SHIP_Y
      }
      d.x += (d.tx - d.x) * 0.06
      d.y += (d.ty - d.y) * 0.06
      if (Math.hypot(d.tx - d.x, d.ty - d.y) < 2) {
        if (d.dock && this.alive && !this.twin) {
          this.twin = true
          this.x = Math.min(W - 14, this.x + 7)
          this.fx.burst(d.x, d.y, this.fxRng, { count: 12 })
          this.sound.play('extra')
          this.banner = { text: 'TWIN BEAMS!', ticks: 80 }
        } else if (d.dock) {
          // Lost the lantern it was flying to: it waits as a spare instead.
          this.lives++
          this.sound.play('extra')
          this.fx.burst(d.x, d.y, this.fxRng, { count: 8 })
        }
        d.dock = false
        d.tx = -99
      }
    }
    this.drifters = this.drifters.filter((d) => d.tx !== -99)
  }

  private checkStageEnd() {
    if (this.guardian) {
      if (!this.guardian.done) return
      this.clear = CLEAR_TICKS
      this.banner = {
        text: 'WATCH CLEAR!',
        sub: 'THE FESTIVAL CHEERS',
        ticks: CLEAR_TICKS,
      }
      this.sound.play('level')
      return
    }
    if (this.moths.some((m) => !m.gone)) return
    this.clear = CLEAR_TICKS
    if (this.glow) {
      const perfect = this.glowHits === this.glowTotal
      this.tally.glows++
      if (perfect) {
        this.tally.perfectGlows++
        this.dropCharm(W / 2, HUD_H + 10)
      }
      const bonus = perfect
        ? Math.min(
            GLOW_PERFECT_MAX,
            GLOW_PERFECT + GLOW_PERFECT_STEP * (this.place.lap - 1),
          )
        : 0
      this.addScore(bonus, W / 2, 140)
      this.banner = {
        text: perfect ? 'PERFECT GLOW!' : 'GLOW STAGE OVER',
        sub: `${this.glowHits} OF ${this.glowTotal} BEAMED`,
        ticks: CLEAR_TICKS,
      }
    } else {
      this.banner = { text: 'STAGE CLEAR!', ticks: CLEAR_TICKS }
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += NEXT_EXTRA
      this.lives++
      this.sound.play('extra')
    }
  }

  private sparkle(x: number, y: number, kind: Kind) {
    const colors =
      kind === 'queen'
        ? ['#c4b5fd', '#fde047']
        : kind === 'escort'
          ? ['#f9a8d4', '#fde68a']
          : kind === 'luna'
            ? ['#bbf7d0', '#fef9c3']
            : ['#fde68a', '#fef3c7']
    for (let i = 0; i < 12; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 22 + Math.floor(this.rng() * 14),
        color: colors[i % 2]!,
      })
    }
    this.fx.burst(x, y, this.fxRng, { count: 6, colours: colors })
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy -= 0.01
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
   * Dodges dust, divers, glows and Guardians; slides under a skimmer's gap and a duster's body;
   * welcomes divers into the cone when the gauge is full and sends the Flock home up a crowded
   * column; otherwise lines up under the nearest target and beams it.
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
    if (this.chart) {
      // Either branch, as the run has gone (no dice: the pilot leaves the rng alone).
      const want = (this.night.shots + this.place.lap) % 2
      if (this.chart.ticks === 60 && want !== this.chart.choice) {
        held.right = want > 0
        held.left = want === 0
      }
      if (this.chart.ticks === 100) held.a = true
      frame.pressed = { ...held }
      return frame
    }
    if (!this.alive || this.results || this.clear > 0) return frame
    const half = this.twin ? 12 : 6
    let push = 0
    let aim: number | null = null
    const threat = (x: number, y: number, reach: number) => {
      if (y > SHIP_Y - 60 && y < SHIP_Y + 10 && Math.abs(x - this.x) < reach)
        push += x < this.x ? 1 : -1
    }
    for (const d of this.dust)
      if (
        d.y > SHIP_Y - 70 &&
        d.y < SHIP_Y + 4 &&
        Math.abs(d.x - this.x) < half + 8
      )
        push += d.x < this.x ? 1 : -1
    let goTo: number | null = null
    for (const m of this.moths) {
      if (m.gone) continue
      if (m.mode === 'dive' || m.mode === 'home' || m.mode === 'escort')
        threat(m.x, m.y, half + 14)
      if (m.mode === 'beam' && Math.abs(m.x - this.x) < this.beamHalf(m) + 12)
        push += m.x < this.x ? 1 : -1
      if (m.mode === 'skim' && (m.timer >= 0 || m.y > SHIP_Y - 90))
        goTo = m.gapX
      if (m.mode === 'shake') goTo = m.x
    }
    const gd = this.guardian
    if (gd) {
      const hint = gd.pilot(this.x, SHIP_Y)
      push += hint.push
      aim = hint.aim
    }
    if (goTo !== null && Math.abs(goTo - this.x) > 4)
      push = goTo > this.x ? 3 : -3
    if (push !== 0) {
      if (push > 0 && this.x < W - half - 2) held.right = true
      else if (push < 0 && this.x > half + 2) held.left = true
      else if (push > 0) held.left = true
      else held.right = true
    } else {
      // Aim: a captive's queen, a cocoon about to split, a diver (worth double), then the nearest.
      const targets = this.moths.filter(
        (m) => this.hittable(m) && m.y > HUD_H && m.mode !== 'skim',
      )
      const target =
        targets.find((m) => m.holding || m.heldFlock.length > 0) ??
        targets.find((m) => m.mode === 'wrap') ??
        targets
          .filter((m) => m.mode === 'dive' || m.mode === 'escort')
          .sort((a, b) => b.y - a.y)[0] ??
        targets.sort(
          (a, b) =>
            Math.abs(a.x - this.x) - Math.abs(b.x - this.x) || b.y - a.y,
        )[0]
      if (target) {
        const lead = target.mode === 'form' ? 0 : Math.cos(target.heading) * 10
        aim = target.x + lead
      }
      if (aim !== null) {
        const dx = aim - this.x
        if (dx > 2) held.right = true
        if (dx < -2) held.left = true
      }
    }
    // The Welcome Glow: open it for a diver coming down close overhead.
    const welcome =
      this.gauge >= FRIEND_AT &&
      this.flock.length < FLOCK_MAX &&
      this.moths.some(
        (m) =>
          !m.gone &&
          m.mode === 'dive' &&
          friendBeam(m.kind, m.hp) !== null &&
          m.y > SHIP_Y - 140 &&
          m.y < SHIP_Y - 30 &&
          Math.abs(m.x - this.x) < 30,
      )
    // The Homecoming dive: up a column with three or more moths in it, or at a Guardian.
    const column = this.moths.filter(
      (m) =>
        !m.gone &&
        m.mode === 'form' &&
        Math.abs(m.x - this.x) < HOMECOMING.half,
    ).length
    const sendHome =
      this.flock.length >= 2 &&
      !this.homecoming &&
      (column >= 3 ||
        (gd !== null &&
          aim !== null &&
          this.flock.length >= 3 &&
          Math.abs(aim - this.x) < 8))
    if (sendHome) held.b = this.bTicks === 0
    else if (welcome) held.b = true
    // Beam whenever something is roughly overhead.
    const overhead =
      (gd !== null && aim !== null && Math.abs(aim - this.x) < 10) ||
      this.moths.some(
        (m) =>
          this.hittable(m) && Math.abs(m.x - this.x) < 8 && m.y < SHIP_Y - 10,
      )
    if (overhead && this.tick % 6 === 0) held.a = true
    frame.pressed = { ...held, b: held.b && this.bTicks === 0 }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const sky = this.chart
      ? WATCHES[this.chart.watch]![this.chart.choice]!.sky
      : this.place.zone.sky
    renderSkyBack(g, sky, this.glow && !this.chart && !this.results, this.tick)
    this.renderNearStars(g)
    renderSkyFront(g, sky, this.tick)
    if (this.chart || this.results) {
      if (this.chart) this.renderChart(g, this.chart)
      else if (this.results) this.renderResults(g, this.results)
      vignette(g, W, H, 0.3)
      this.renderHud(g)
      return
    }
    if (sky === 'river' && !this.glow) this.renderReflections(g)
    for (const cx of this.candles()) this.renderCandle(g, cx)
    for (const m of this.moths)
      if (m.mode === 'skim' && m.timer > 0 && !m.gone) this.renderRipple(g, m)
    // (A beamed-down queen's glow goes out with her.)
    for (const m of this.moths)
      if (m.mode === 'beam' && !m.gone) this.renderGlow(g, m)
    if (this.guardian) this.guardian.render(g, this.tick, SHIP_Y)
    for (const m of this.moths)
      if (!m.gone && m.mode !== 'wait') this.renderMoth(g, m)
    for (const d of this.drifters) {
      glow(g, d.x, d.y - 2, 14, d.dock ? RAMPS.gold[3] : RAMPS.ember[2], 0.4)
      drawLantern(g, d.x, d.y, !d.dock, this.tick)
    }
    for (const c of this.charms) {
      glow(g, c.x, c.y, 10, RAMPS.gold[3], 0.45)
      drawSprite(g, CHARM_SPRITES[c.kind], c.x, c.y + Math.sin(this.tick / 9))
    }
    this.renderBeams(g)
    const mote = Math.floor(this.tick / 4) % 2
    for (const d of this.dust) {
      glow(g, d.x, d.y, 6, d.ember ? RAMPS.ember[2] : RAMPS.pink[2], 0.4)
      drawSprite(g, (d.ember ? EMBER_SPRITES : DUST_SPRITES)[mote]!, d.x, d.y)
    }
    this.renderHomecoming(g)
    if (this.coneOpen) this.renderCone(g)
    const flap = Math.floor(this.tick / 7) % 2
    for (const f of this.flock)
      drawMoth(g, KIND_ART[f.kind], f.x, f.y, -Math.PI / 2, flap)
    for (const h of this.homing) {
      g.save()
      g.globalAlpha *= Math.min(1, h.life / 30)
      drawMoth(g, KIND_ART[h.kind], h.x, h.y, -Math.PI / 2, flap)
      g.restore()
    }
    if (this.alive && (this.safe === 0 || Math.floor(this.safe / 4) % 2)) {
      const grip = this.guardian ? this.guardian.grip() : 0
      if (grip > 0) glow(g, this.x, SHIP_Y, 20, RAMPS.purple[3], 0.6 * grip)
      if (this.charm?.kind === 'mirror')
        glow(g, this.x, SHIP_Y - 2, 16, RAMPS.sky[3], 0.4)
      if (this.twin) {
        this.renderShip(g, this.x - 7)
        this.renderShip(g, this.x + 7)
      } else this.renderShip(g, this.x)
    }
    // The game's own bursts, drawn as additive embers.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.restore()
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** The nearest stars streak past (the game's own, on its seeded layout). */
  private renderNearStars(g: CanvasRenderingContext2D) {
    for (const s of this.stars) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      if (s.s > 0.7) {
        g.fillStyle = RAMPS.sky[2]
        g.fillRect(x, y - 2, 1, 2)
        g.fillStyle = RAMPS.sky[4]
        g.fillRect(x, y, 1, 1)
      } else {
        g.fillStyle = s.s > 0.45 ? RAMPS.sky[3] : RAMPS.purple[3]
        g.fillRect(x, y, 1, 1)
      }
    }
  }

  /** The river mirrors the swarm, squashed and dim, along the bottom of the screen. */
  private renderReflections(g: CanvasRenderingContext2D) {
    g.save()
    g.globalAlpha *= 0.22
    const flap = Math.floor(this.tick / 8) % 2
    for (const m of this.moths) {
      if (m.gone || m.mode === 'wait' || m.y > RIVER_TOP) continue
      const y = RIVER_TOP + 4 + (RIVER_TOP - m.y) * 0.16
      drawMoth(g, KIND_ART[m.kind], m.x, y, Math.PI / 2, flap)
    }
    g.restore()
  }

  private renderCandle(g: CanvasRenderingContext2D, x: number) {
    const cx = Math.round(x)
    const flicker = Math.sin(this.tick / 4 + x) > 0
    glow(g, cx, CANDLE_Y - 4, 9, RAMPS.gold[3], 0.4)
    g.fillStyle = RAMPS.earth[2]
    g.fillRect(cx - 4, CANDLE_Y + 2, 9, 2)
    g.fillStyle = RAMPS.cream[3]
    g.fillRect(cx - 2, CANDLE_Y - 3, 5, 5)
    g.fillStyle = flicker ? RAMPS.gold[4] : RAMPS.gold[3]
    g.fillRect(cx, CANDLE_Y - 6, 1, 3)
    g.fillStyle = rgba(RAMPS.gold[3], 0.3)
    g.fillRect(cx - 1, CANDLE_Y + 5, 3, 3)
  }

  /** The skimmer's tell: a ripple on the river at its side, and a calm patch over its gap. */
  private renderRipple(g: CanvasRenderingContext2D, m: Moth) {
    const x = m.dir > 0 ? 10 : W - 10
    const t = (SKIM_TELL - m.timer) % 18
    g.fillStyle = rgba(RAMPS.water[4], 0.8 - t / 30)
    g.fillRect(Math.round(x - 3 - t), SKIM_Y + 6, Math.round(6 + t * 2), 1)
    g.fillStyle = rgba(RAMPS.water[4], 0.45)
    g.fillRect(Math.round(m.gapX - 10), SKIM_Y + 8, 21, 1)
    glow(g, m.gapX, SKIM_Y + 8, 14, RAMPS.water[3], 0.25)
  }

  private renderBeams(g: CanvasRenderingContext2D) {
    const wide = this.charm?.kind === 'crane'
    for (const b of this.beams) {
      if (b.owner === 'lantern') {
        glow(g, b.x, b.y, wide ? 14 : 9, RAMPS.gold[3], 0.55)
        drawSprite(g, BEAM_SPRITE, b.x, b.y)
        if (wide) {
          drawSprite(g, BEAM_SPRITE, b.x - 5, b.y + 3, { alpha: 0.6 })
          drawSprite(g, BEAM_SPRITE, b.x + 5, b.y + 3, { alpha: 0.6 })
        }
      } else {
        glow(g, b.x, b.y, 6, RAMPS.cream[3], 0.4)
        drawSprite(g, FRIEND_BEAM_SPRITES[b.owner], b.x, b.y)
      }
    }
  }

  /** The Welcome Glow: a warm cone, gold while the gauge is full, pink as it runs low. */
  private renderCone(g: CanvasRenderingContext2D) {
    const ready = this.gauge >= FRIEND_AT
    const colour = ready ? RAMPS.gold[3] : RAMPS.pink[2]
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let up = 0; up < CONE_REACH; up += 2) {
      const w = Math.round(6 + (CONE_HALF - 6) * (up / CONE_REACH))
      const y = SHIP_Y - 6 - up
      const wave = Math.sin((up - this.tick * 2) / 8) * 0.04
      g.fillStyle = rgba(colour, (ready ? 0.16 : 0.08) + wave)
      g.fillRect(Math.round(this.x) - w, y, w * 2, 2)
      g.fillStyle = rgba(colour, ready ? 0.4 : 0.2)
      g.fillRect(Math.round(this.x) - w, y, 1, 2)
      g.fillRect(Math.round(this.x) + w - 1, y, 1, 2)
    }
    g.restore()
  }

  private renderHomecoming(g: CanvasRenderingContext2D) {
    const h = this.homecoming
    if (!h) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = rgba(RAMPS.gold[3], 0.18)
    g.fillRect(
      Math.round(h.x - HOMECOMING.half),
      Math.round(h.y),
      HOMECOMING.half * 2,
      Math.round(SHIP_Y - h.y),
    )
    g.restore()
    const flap = Math.floor(this.tick / 4) % 2
    h.members.forEach((kind, i) => {
      glow(g, h.x, h.y + i * 11, 10, RAMPS.gold[3], 0.4)
      drawMoth(
        g,
        KIND_ART[kind],
        h.x + (i % 2 ? 4 : -4),
        h.y + i * 11,
        -Math.PI / 2,
        flap,
      )
    })
  }

  private renderGlow(g: CanvasRenderingContext2D, m: Moth) {
    const reach = this.beamReach(m)
    if (reach <= 0) return
    const top = Math.round(m.y + 8)
    const bottom = Math.round(top + (SHIP_Y + 8 - top) * reach)
    const span = Math.max(1, bottom - top)
    const half = this.beamHalf(m)
    // Banded light (colour math) pulsing down the cone, its edges brighter than its heart.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let y = top; y < bottom; y += 2) {
      const t = (y - top) / span
      const w = Math.round(4 + (half - 4) * t)
      const band = Math.floor((y - top - this.tick * 1.5) / 6)
      const colour = TRACTOR[((band % 3) + 3) % 3]!
      g.fillStyle = rgba(colour, 0.26)
      g.fillRect(Math.round(m.x) - w, y, w * 2, 2)
      g.fillStyle = rgba(RAMPS.purple[4], 0.45)
      g.fillRect(Math.round(m.x) - w, y, 1, 2)
      g.fillRect(Math.round(m.x) + w - 1, y, 1, 2)
    }
    // Motes riding up the beam.
    g.fillStyle = rgba(RAMPS.teal[4], 0.8)
    for (let i = 0; i < 8; i++) {
      const py = bottom - ((this.tick * 1.2 + i * 29) % span)
      const t = (py - top) / span
      const px =
        m.x + Math.sin(this.tick / 9 + i * 1.7) * (4 + (half - 4) * t) * 0.8
      g.fillRect(Math.round(px), Math.round(py), 1, 1)
    }
    g.restore()
    glow(g, m.x, top, 12, RAMPS.purple[3], 0.5)
    glow(g, m.x, bottom, half + 6, RAMPS.teal[3], 0.3 * reach)
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const flap = Math.floor((this.tick + m.col * 7) / 8) % 2
    const stage = this.place.stage
    if (m.mode === 'wrap') {
      const shimmer = Math.floor(m.timer / 3) % 2
      glow(g, m.x, m.y, 12, shimmer ? '#ffffff' : RAMPS.purple[3], 0.5)
      drawSprite(g, WRAP, m.x + (shimmer ? 1 : -1), m.y)
      return
    }
    const set =
      stage.kind === 'glow'
        ? CRANE_SETS[GLOW_ART[stage.choreography]][(m.row + m.col) % 2]!
        : m.kind === 'queen' && m.hp <= 1
          ? QUEENS_HURT
          : m.kind === 'sparker' && !this.sparkLit()
            ? SPARKERS_DARK
            : KIND_ART[m.kind]
    const facing = m.mode === 'form' ? Math.PI / 2 : m.heading
    if (m.kind === 'queen' && !this.glow)
      glow(g, m.x, m.y, 14, RAMPS.purple[3], 0.25)
    if (m.kind === 'sparker' && this.sparkLit())
      glow(g, m.x, m.y + 4, 12, RAMPS.leaf[4], 0.45)
    // The last moths of a stage burn with a warning glow while they dive non-stop.
    if (this.frenzy) glow(g, m.x, m.y, 11, RAMPS.ember[3], 0.3)
    const quiver =
      m.mode === 'shake' ? (Math.floor(m.timer / 2) % 2) * 2 - 1 : 0
    if (m.mode === 'shake') glow(g, m.x, m.y + 8, 14, RAMPS.pink[2], 0.3)
    drawMoth(
      g,
      set,
      m.x + quiver,
      m.y,
      facing,
      flap + (m.mode === 'shake' ? m.timer : 0),
    )
    if (m.kind === 'queen' && m.holding && m.mode !== 'beam') {
      const c = this.captivePos(m)
      glow(g, c.x, c.y - 1, 10, RAMPS.ember[2], 0.35)
      drawLantern(g, c.x, c.y, true, this.tick)
    }
    m.heldFlock.forEach((kind, i) =>
      drawMoth(g, KIND_ART[kind], m.x - 9 + i * 6, m.y - 12, Math.PI / 2, flap),
    )
  }

  private renderShip(g: CanvasRenderingContext2D, x: number) {
    const flicker = Math.sin(this.tick / 5 + x) * 2
    glow(g, x, SHIP_Y - 1, 22 + flicker, RAMPS.gold[3], 0.42)
    glow(g, x, SHIP_Y - 1, 9, RAMPS.gold[4], 0.35)
    drawLantern(g, x, SHIP_Y, false, this.tick)
  }

  /** The Watch's results card: shots, hits and hit ratio, Glows, escort bonuses and the Flock. */
  private renderResults(g: CanvasRenderingContext2D, r: Results) {
    const x = 18
    const y = 46
    const w = W - 36
    const h = 200
    hudPanel(g, x, y, w, h)
    drawText(g, `${r.zone.watch} WATCH`, W / 2, y + 8, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, r.zone.name, W / 2, y + 28, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    resultRows(r.tally).forEach(([label, value], i) => {
      if (r.ticks <= 20 + i * 12) return
      const ry = y + 46 + i * 15
      drawText(g, label, x + 8, ry, { color: RAMPS.purple[4], outline: INK })
      drawText(g, value, x + w - 8, ry, {
        align: 'right',
        color: '#ffffff',
        outline: INK,
      })
    })
    if (r.ticks >= RESULTS_SKIP && Math.floor(this.tick / 20) % 2 === 0)
      drawText(g, 'PRESS A TO FLY ON', W / 2, y + h - 14, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
  }

  /** The Sky Chart: the next Watch's two zones as cards; LEFT/RIGHT choose, A flies. */
  private renderChart(g: CanvasRenderingContext2D, c: Chart) {
    const zones = WATCHES[c.watch]!
    drawText(g, 'SKY CHART', W / 2, 30, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, `${zones[0]!.watch} WATCH: CHOOSE A WAY`, W / 2, 50, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    const cw = 100
    zones.forEach((zone, i) => {
      const x = i === 0 ? 8 : W - 8 - cw
      const y = 66
      const chosen = i === c.choice
      if (chosen) glow(g, x + cw / 2, y + 80, 70, RAMPS.gold[3], 0.25)
      hudPanel(g, x, y, cw, 172, chosen ? RAMPS.gold : RAMPS.purple)
      skyPreview(g, zone.sky, x + 6, y + 6, cw - 12, 60, this.tick)
      zone.newMoths.forEach((kind, k) =>
        drawMoth(
          g,
          KIND_ART[kind],
          x + cw / 2 + (k - (zone.newMoths.length - 1) / 2) * 26,
          y + 34,
          Math.PI / 2,
          Math.floor(this.tick / 9) % 2,
        ),
      )
      drawText(g, zone.name, x + cw / 2, y + 74, {
        align: 'center',
        color: chosen ? '#ffffff' : RAMPS.purple[4],
        outline: INK,
      })
      const words = zone.chart.split(' ')
      const lines: string[] = []
      for (const word of words) {
        const last = lines[lines.length - 1]
        if (last !== undefined && (last + ' ' + word).length <= 15)
          lines[lines.length - 1] = `${last} ${word}`
        else lines.push(word)
      }
      lines.forEach((line, k) =>
        drawText(g, line, x + cw / 2, y + 90 + k * 10, {
          align: 'center',
          color: RAMPS.teal[3],
          outline: INK,
        }),
      )
      const guardian = zone.stages[zone.stages.length - 1]!.name.replace(
        'THE ',
        '',
      )
      drawText(g, 'GUARDIAN', x + cw / 2, y + 130, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
      drawText(g, guardian, x + cw / 2, y + 142, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
      if (chosen)
        drawText(
          g,
          '↑',
          x + cw / 2,
          y + 158 + (Math.floor(this.tick / 10) % 2),
          {
            align: 'center',
            color: RAMPS.gold[4],
            outline: INK,
          },
        )
    })
    if (c.ticks >= CHART_SKIP && Math.floor(this.tick / 20) % 2 === 0)
      drawText(g, 'LEFT/RIGHT CHOOSE  A FLY', W / 2, H - 34, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 2, 2, 82, 18)
    drawText(g, String(this.score).padStart(6, '0'), 7, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    hudPanel(g, W - 66, 2, 64, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 5, 3, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `STAGE ${this.level}`, W - 5, 11, {
      align: 'right',
      color: this.glow ? RAMPS.purple[3] : RAMPS.teal[3],
      outline: INK,
    })
    // Stage badges: one pip per stage of this Watch, lit as they are cleared.
    const stages = this.place.zone.stages
    for (let i = 0; i < stages.length; i++) {
      const lit =
        i < this.place.stageIndex ||
        (i === this.place.stageIndex && (this.clear > 0 || !!this.results))
      const kind = stages[i]!.kind
      g.fillStyle = INK
      g.fillRect(W - 66 + i * 6, 21, 5, 4)
      g.fillStyle = lit
        ? kind === 'guardian'
          ? RAMPS.gold[4]
          : kind === 'glow'
            ? RAMPS.purple[3]
            : RAMPS.teal[3]
        : i === this.place.stageIndex
          ? RAMPS.steel[3]
          : RAMPS.night[3]
      g.fillRect(W - 65 + i * 6, 22, 3, 2)
    }
    const spares = Math.min(this.lives - (this.alive ? 1 : 0), 6)
    if (spares > 0) {
      hudPanel(g, 2, H - 14, spares * 9 + 4, 12)
      for (let i = 0; i < spares; i++)
        drawSprite(g, LIFE_SPRITE, 8 + i * 9, H - 8)
    }
    // The glow gauge, its full mark, and the charm in play.
    hudPanel(g, W - 62, H - 14, 60, 12)
    const ready = this.gauge >= FRIEND_AT
    gauge(
      g,
      W - 58,
      H - 10,
      52,
      4,
      this.gauge / GAUGE_MAX,
      ready ? RAMPS.gold : RAMPS.pink,
    )
    g.fillStyle = '#ffffff'
    g.fillRect(W - 58 + Math.round((52 * FRIEND_AT) / GAUGE_MAX), H - 11, 1, 6)
    if (this.charm) {
      const left = this.charm.ticks
      drawSprite(g, CHARM_SPRITES[this.charm.kind], W - 72, H - 8)
      if (Number.isFinite(left) && left < 180 && Math.floor(this.tick / 6) % 2)
        glow(g, W - 72, H - 8, 8, RAMPS.ember[3], 0.5)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 150, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 170, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      if (this.banner.sub2)
        drawText(g, this.banner.sub2, W / 2, 182, {
          align: 'center',
          color: RAMPS.teal[3],
          outline: INK,
        })
    }
  }
}

const lanternSwarm: ArcadeGameModule = {
  create: (options) => new LanternSwarm(options),
}

export const create = lanternSwarm.create
export default lanternSwarm
