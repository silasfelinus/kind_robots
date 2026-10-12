// /utils/arcade/games/seedLander.ts
//
// Seed Lander -- the Kind Robots Arcade's Lunar Lander riff (conductor kr-arcade/t-009, depth
// pass t-069..t-073: "The Great Replanting", depth-pass CABINETS.md section 9). Pilot a seed pod
// across a wide island several screens across, leaning and puffing sunlight, and set it down
// soft, slow and level on the garden beds to plant them. The camera scrolls with the pod and zooms
// in close below about 40 px of altitude, so the last pixels of a touchdown are easy to read.
//
// Landings rank Feather, Soft, Bumpy or Bonk; a run of Feathers builds a streak multiplier that
// carries from hill to hill. Beds run x1 to x5, the x5s tucked into narrow valleys or on peaks.
// Each mission has its own sun tank, topped up at sunflower beds; running dry opens the pod's leaf
// cap as a parachute and the mission is tried again with a spare pod. B hops (the classic's abort:
// upright and one strong puff, for a lot of sun), and holding DOWN over a seed crate hooks it on
// the tether winch to tow to the shed.
//
// The flight tier is chosen at the start (Breezy shows the landing arc and gives more sun, Gale
// is heavy and allows one hop a mission). Free Flight builds an endless run of hills from the
// seeded rng (seedLander/missions.ts) and unlocks a new hazard every 4 hills.
//
// Left/right lean the pod; Up or A puffs; B hops; DOWN works the winch.

import { drawText } from '../font'
import { INK, RAMPS, Sparkles, backdropRng, glow, vignette } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  BLOOM_COLOURS,
  FLOWER_SPARKS,
  PAD_RAMP,
  drawBloom,
  drawCargo,
  drawPadLive,
  drawPod,
  drawVent,
  paintSky,
  paintTerrain,
} from '../seedLander/art'
import { Camera, VIEW_H } from '../seedLander/camera'
import {
  BUMPY,
  POD_FEET,
  POD_HALF,
  POD_TOP,
  RANK_NAMES,
  RANK_PAY,
  SAFE,
  SETTLE_TICKS,
  TIERS,
  TIER_ORDER,
  canHop,
  newPod,
  nextStreak,
  predictArc,
  rankLanding,
  steerPod,
  streakMultiplier,
} from '../seedLander/flight'
import type { LandingRank, Pod, TierId } from '../seedLander/flight'
import {
  H,
  HAZARD_NAMES,
  HUD_H,
  W,
  freeHill,
  highestBetween,
} from '../seedLander/missions'
import type { MissionSpec, VentSpec } from '../seedLander/missions'
import {
  drawHud,
  drawMenu,
  drawMissionCard,
  drawTally,
} from '../seedLander/screens'
import type { MenuRow, TallyLine } from '../seedLander/screens'
import {
  WINCH,
  canHook,
  dropCargo,
  groundCargo,
  newCargo,
  swingCargo,
} from '../seedLander/tether'
import type { Cargo } from '../seedLander/tether'
import { Terrain } from '../seedLander/terrain'
import type { Pad } from '../seedLander/terrain'

export const START_PODS = 3
export const MAX_PODS = 5
/** Free Flight hands out a spare pod every this many hills cleared. */
export const EXTRA_POD_HILLS = 4
/** A bonk's scattered seeds still sprout a few wildflowers: this times the hill. */
export const BONK_POINTS = 25
/** A delivered crate pays this per seedling still in it. */
export const DELIVERY_POINTS = 400
/** A spare pod after a bonk never starts with less than this share of the mission's sun. */
export const SPARE_SUN = 0.25
/** Sunflowers refuel a resting pod this much a tick. */
export const SUN_REFILL = 6
/** A planting tops the tank up by this share. */
export const PLANT_SUN = 0.15

const BONK_TICKS = 110
const DRY_TICKS = 100
const CLEAR_TICKS = 200
const PLANT_SETTLE = 40
const CARD_TICKS = 150

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  kind: 'puff' | 'chip' | 'streamer'
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
}
type Bloom = { x: number; y: number; colour: string; age: number }
type Phase = 'fly' | 'bonk' | 'dry' | 'clear'
type MenuId = 'free' | 'tier'

class SeedLander implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_PODS
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private menu: { pick: number } | null = null
  private tier: TierId = 'standard'
  private mission!: MissionSpec
  private terrain!: Terrain
  private pods: Pod[] = []
  private cargo: Cargo[] = []
  private cargoTo = new Map<string, string>()
  private vents: VentSpec[] = []
  private blooms: Bloom[] = []
  private phase: Phase = 'fly'
  private phaseTicks = 0
  private card = 0
  private planted = 0
  private streak = 0
  private bestStreak = 0
  private missionTicks = 0
  private sunMax = 900
  private wind = 0
  private windTarget = 0
  private hillsCleared = 0
  private lastRank: LandingRank | null = null
  private tally: TallyLine[] = []
  private hookTicks = 0
  private camera = new Camera()
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles, puffs and bloom colours roll their own dice; the game's rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(61)
  private bonkAt = { x: 0, y: 0 }
  private terrainArt: HTMLCanvasElement | null = null
  private terrainArtFor: { terrain: Terrain; version: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    if (!this.demo) this.menu = { pick: 0 }
    this.startHill(1)
  }

  /** Player 1's pod. */
  private get pod(): Pod {
    return this.pods[0]!
  }

  private get flightTier() {
    return TIERS[this.tier]
  }

  private get gravity() {
    return this.flightTier.gravity * (this.mission.gravity ?? 1)
  }

  // --- the mode card --------------------------------------------------------------------

  private menuRows(): Array<MenuRow & { id: MenuId }> {
    const t = this.flightTier
    return [
      { id: 'free', name: 'FREE FLIGHT', about: 'ENDLESS HILLS, NEW HAZARDS' },
      { id: 'tier', name: `FLIGHT: ${t.name}`, about: t.about, picker: true },
    ]
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    const rows = this.menuRows()
    const step = input.pressed.up ? -1 : input.pressed.down ? 1 : 0
    if (step) {
      m.pick = (m.pick + step + rows.length) % rows.length
      this.sound.play('blip')
    }
    const row = rows[m.pick]!
    const turn = input.pressed.left ? -1 : input.pressed.right ? 1 : 0
    if (row.id === 'tier' && (turn || input.pressed.a)) {
      const i = TIER_ORDER.indexOf(this.tier)
      const n = TIER_ORDER.length
      this.tier = TIER_ORDER[(i + (turn || 1) + n) % n]!
      this.sound.play('blip')
      return
    }
    if (input.pressed.a || input.pressed.start) {
      this.menu = null
      this.sound.play('start')
      this.startHill(1)
    }
  }

  // --- missions ---------------------------------------------------------------------------

  /** Free Flight hill `hill`: a fresh island from the seeded rng. */
  private startHill(hill: number) {
    this.level = hill
    this.startMission(freeHill(hill, this.rng))
  }

  /** Lay out a mission: its terrain, cargo and vents, a full tank and the pod at the start. */
  private startMission(spec: MissionSpec) {
    this.mission = spec
    this.terrain = new Terrain(spec.map)
    this.cargo = []
    this.cargoTo.clear()
    ;(spec.cargo ?? []).forEach((c, i) => {
      const id = c.id ?? `cargo${i}`
      const crate = newCargo(id, c.kind, c.x, 0, c.seedlings ?? 3)
      crate.y = this.terrain.groundAt(c.x) - crate.r
      this.cargo.push(crate)
      this.cargoTo.set(id, c.to)
    })
    this.vents = (spec.vents ?? []).map((v) => ({ ...v }))
    this.sunMax = Math.round(spec.sun * this.flightTier.sun)
    this.pods = [newPod(0, spec.start.x, spec.start.y, this.sunMax)]
    this.blooms = []
    this.planted = 0
    this.missionTicks = 0
    this.wind = 0
    this.windTarget = 0
    this.phase = 'fly'
    this.phaseTicks = 0
    this.card = CARD_TICKS
    this.camera.snap(
      spec.start.x,
      spec.start.y + 60,
      this.terrain.w,
      this.terrain.h,
    )
  }

  /** Try the same mission again (the sun ran dry): the same island, a full tank, beds unplanted. */
  private retryMission() {
    const spec = this.mission
    this.startMission(spec)
    this.banner = { text: 'TRY AGAIN', sub: 'A FULL TANK OF SUN', ticks: 100 }
  }

  // --- update ----------------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    const controls = this.demo ? this.demoInput() : input
    if (this.card > 0) {
      this.card--
      if (
        this.card < CARD_TICKS - 30 &&
        (controls.pressed.a || controls.pressed.start)
      )
        this.card = 0
    }
    this.missionTicks++
    this.updateWind()
    switch (this.phase) {
      case 'fly':
        for (const pod of this.pods) this.flyPod(pod, controls)
        this.updateCargo()
        break
      case 'bonk':
        this.updateCargo()
        if (++this.phaseTicks >= BONK_TICKS) this.afterBonk()
        break
      case 'dry':
        this.updateDry()
        break
      case 'clear':
        if (++this.phaseTicks >= CLEAR_TICKS) this.nextHill()
        break
    }
    this.followCamera()
  }

  private updateWind() {
    const max = this.mission.wind * this.flightTier.wind
    if (this.tick % 180 === 0) this.windTarget = (this.rng() * 2 - 1) * max
    this.wind += (this.windTarget - this.wind) * 0.02
  }

  /** Outside pushes at a point: the wind, and lift in an updraft column. */
  private pushAt(x: number, y: number): { x: number; y: number } {
    let lift = 0
    for (const v of this.vents) {
      if (Math.abs(x - v.x) > v.w / 2) continue
      const ground = this.terrain.groundAt(v.x)
      if (y > ground - v.h && y < ground) lift += v.lift
    }
    return { x: this.wind, y: -lift }
  }

  private flyPod(pod: Pod, input: InputFrame) {
    const controls = {
      left: input.held.left,
      right: input.held.right,
      puff: input.held.up || input.held.a,
      hop: input.pressed.b,
    }
    this.workWinch(pod, input)
    if (pod.restOn) {
      this.rest(pod, controls.puff || controls.hop)
      return
    }
    const sunBefore = pod.sun
    if (
      steerPod(
        pod,
        controls,
        this.flightTier,
        this.gravity,
        this.pushAt(pod.x, pod.y),
      )
    ) {
      this.sound.play('pickup')
      this.puffBurst(pod, 10, 1.4)
    }
    if (pod.puffing && this.tick % 3 === 0) this.puffBurst(pod, 1, 0.8)
    // The island's edges are cliffs of air: the pod bumps gently back.
    if (pod.x < POD_HALF + 2) {
      pod.x = POD_HALF + 2
      pod.vx = Math.abs(pod.vx) * 0.3
    }
    if (pod.x > this.terrain.w - POD_HALF - 2) {
      pod.x = this.terrain.w - POD_HALF - 2
      pod.vx = -Math.abs(pod.vx) * 0.3
    }
    if (pod.y < POD_TOP + 2) {
      pod.y = POD_TOP + 2
      pod.vy = Math.max(0, pod.vy)
    }
    if (sunBefore > 0 && pod.sun <= 0 && !pod.chute) {
      pod.chute = true
      pod.puffing = false
      this.dropHooked(pod)
      this.sound.play('warn')
      this.banner = {
        text: 'OUT OF SUN',
        sub: 'STEER ONTO A SUNFLOWER',
        ticks: 120,
      }
    }
    this.touchDown(pod)
  }

  /** Resting on a pad: sunflowers refuel; puffing (after a moment to settle) lifts off. */
  private rest(pod: Pod, lift: boolean) {
    const pad = this.terrain.pad(pod.restOn!)
    pod.rest++
    pod.puffing = false
    if (pad) {
      pod.x += pad.vx
      pod.y = pad.y - POD_FEET
      if (pad.kind === 'sun' && pod.sun < this.sunMax) {
        pod.sun = Math.min(this.sunMax, pod.sun + SUN_REFILL)
        if (this.tick % 6 === 0)
          this.fx.burst(pod.x, pod.y - 4, this.fxRng, {
            count: 1,
            speed: 0.6,
            colours: [RAMPS.gold[3], RAMPS.gold[4]],
          })
      }
    }
    // Dry on a pad with no sunflower: nothing to lift off with, so the mission is tried again.
    if (pod.sun <= 0 && pad?.kind !== 'sun' && pod.rest >= SETTLE_TICKS) {
      this.phase = 'dry'
      this.phaseTicks = 0
      this.banner = { text: 'OUT OF SUN', sub: 'NO SUNFLOWER HERE', ticks: 100 }
      return
    }
    if (lift && pod.rest >= SETTLE_TICKS && pod.sun > 0) {
      pod.restOn = null
      pod.rest = 0
      pod.vy = -0.35
      pod.y -= 2
    }
  }

  private touchDown(pod: Pod) {
    const t = this.terrain
    const feet = pod.y + POD_FEET
    const floorL = t.floorAt(pod.x - POD_HALF, pod.y)
    const floorR = t.floorAt(pod.x + POD_HALF, pod.y)
    const roof = Math.max(
      t.ceilingAt(pod.x, pod.y),
      t.ceilingAt(pod.x - POD_HALF, pod.y),
      t.ceilingAt(pod.x + POD_HALF, pod.y),
    )
    if (pod.y - POD_TOP <= roof) {
      if (pod.chute) pod.vy = Math.max(0, pod.vy)
      else return this.crash(pod, 'BUMPED THE ROOF')
    }
    if (
      !pod.chute &&
      (t.insideLedge(pod.x - POD_HALF, pod.y) ||
        t.insideLedge(pod.x + POD_HALF, pod.y))
    )
      return this.crash(pod, 'CLIPPED A LEDGE')
    if (feet < Math.min(floorL, floorR)) return
    // Climbing away with a foot brushing a slope is a scrape, not a touchdown.
    if (pod.vy < 0 && feet < t.floorAt(pod.x, pod.y) - 1) return
    const floor = Math.min(floorL, floorR)
    if (pod.chute) {
      // Floated down onto a sunflower: saved, and refuelling.
      const sun = t.padUnder(pod.x, POD_HALF, floor)
      if (sun?.kind === 'sun') {
        pod.chute = false
        this.land(pod, sun, 'soft')
        this.banner = {
          text: 'SAVED!',
          sub: 'A SUNFLOWER CATCHES THE POD',
          ticks: 100,
        }
        return
      }
      pod.y = floor - POD_FEET
      pod.vx = 0
      pod.vy = 0
      this.phase = 'dry'
      this.phaseTicks = 0
      return
    }
    const pad = t.padUnder(pod.x, POD_HALF, floor)
    const rank = pad
      ? rankLanding(pod.vx - pad.vx, pod.vy - pad.vy, pod.tilt, BUMPY)
      : 'bonk'
    if (!pad || rank === 'bonk')
      return this.crash(
        pod,
        !pad
          ? 'MISSED THE PAD'
          : Math.abs(pod.tilt) > SAFE.tilt
            ? 'TOO TILTED'
            : 'TOO FAST',
      )
    this.land(pod, pad, rank)
  }

  private land(pod: Pod, pad: Pad, rank: LandingRank) {
    // Settle both feet onto the bed.
    if (pad.x1 - pad.x0 >= POD_HALF * 2)
      pod.x = Math.max(pad.x0 + POD_HALF, Math.min(pad.x1 - POD_HALF, pod.x))
    pod.y = pad.y - POD_FEET
    pod.vx = 0
    pod.vy = 0
    pod.tilt = 0
    pod.puffing = false
    pod.restOn = pad.id
    pod.rest = 0
    this.lastRank = rank
    const cx = Math.max(pad.x0 + 3, Math.min(pad.x1 - 3, pod.x))
    if (pad.kind === 'seed' && !pad.planted) {
      this.streak = nextStreak(this.streak, rank)
      this.bestStreak = Math.max(this.bestStreak, this.streak)
      const mult = streakMultiplier(this.streak)
      const points = Math.round(50 * pad.mult * RANK_PAY[rank] * mult) * 10
      pad.planted = true
      this.planted++
      // A planting breathes a little sunlight back into the tank.
      pod.sun = Math.min(
        this.sunMax,
        pod.sun + Math.round(this.sunMax * PLANT_SUN),
      )
      pod.rest = SETTLE_TICKS - PLANT_SETTLE
      this.addScore(points, cx, pad.y - 22, RAMPS.gold[3])
      const colour =
        BLOOM_COLOURS[Math.floor(this.fxRng() * BLOOM_COLOURS.length)]!
      this.blooms.push({ x: cx, y: pad.y, colour, age: 0 })
      this.fx.burst(cx, pad.y - 8, this.fxRng, {
        count: 14,
        colours: FLOWER_SPARKS[colour],
        speed: 1.8,
      })
      this.banner = {
        text: `${RANK_NAMES[rank]} LANDING`,
        sub:
          `${pad.mult > 1 ? `X${pad.mult} BED  ` : ''}${points}` +
          (this.streak > 1 ? `  STREAK X${mult.toFixed(1)}` : ''),
        ticks: 110,
      }
      this.sound.play('level')
      if (this.planted >= this.mission.seeds) this.clearMission()
      return
    }
    // Any other pad: a rest stop. Sunflowers refuel; the shed and planted beds just hold the pod.
    this.floaters.push({
      x: cx,
      y: pad.y - 18,
      text: RANK_NAMES[rank],
      life: 50,
      color: rank === 'feather' ? RAMPS.teal[3] : RAMPS.cream[3],
    })
    if (pad.kind === 'sun') {
      this.banner = {
        text: 'SUNFLOWER',
        sub: 'REFUELLING: PUFF TO LIFT OFF',
        ticks: 90,
      }
      this.sound.play('pickup')
    } else this.sound.play('blip')
  }

  private crash(pod: Pod, why: string) {
    this.lives--
    this.streak = 0
    this.lastRank = 'bonk'
    this.dropHooked(pod)
    this.addScore(BONK_POINTS * this.level, pod.x, pod.y - 12, RAMPS.leaf[3])
    this.phase = 'bonk'
    this.phaseTicks = 0
    this.bonkAt = { x: pod.x, y: pod.y }
    this.chips(pod.x, pod.y, 22, '#a3e635')
    this.chips(pod.x, pod.y, 10, '#fde047')
    pod.puffing = false
    this.sound.play('die')
    this.banner = {
      text: 'BONK!',
      sub:
        this.lives > 0
          ? `${why}  ${this.lives} POD${this.lives > 1 ? 'S' : ''} LEFT`
          : why,
      ticks: BONK_TICKS,
    }
  }

  /** After a bonk: a spare pod drops in at the start (or the run ends). */
  private afterBonk() {
    if (this.lives <= 0) {
      this.endRun()
      return
    }
    const old = this.pod
    const pod = newPod(
      0,
      this.mission.start.x,
      this.mission.start.y,
      Math.max(old.sun, Math.round(this.sunMax * SPARE_SUN)),
    )
    pod.hops = old.hops
    this.pods[0] = pod
    this.phase = 'fly'
    this.phaseTicks = 0
  }

  /** The leaf-cap parachute: drift down, then the mission is tried again with a spare pod. */
  private updateDry() {
    if (++this.phaseTicks < DRY_TICKS) return
    this.lives--
    if (this.lives <= 0) {
      this.endRun()
      return
    }
    this.retryMission()
  }

  private endRun() {
    this.over = true
    this.banner = { text: 'OUT OF PODS', sub: 'GAME OVER', ticks: 9999 }
  }

  private clearMission() {
    this.phase = 'clear'
    this.phaseTicks = 0
    this.hillsCleared++
    const pod = this.pod
    const sunUsed = this.sunMax - pod.sun
    const bonus = Math.round((pod.sun / this.sunMax) * 100) * 10
    const thrifty = sunUsed <= this.mission.par.sun * this.flightTier.sun
    const swift = this.missionTicks <= this.mission.par.ticks
    const medals = (thrifty ? 1 : 0) + (swift ? 1 : 0)
    const medalPoints = medals * 250 * Math.min(10, this.level)
    this.tally = [
      { label: 'SUN LEFT', value: `${bonus}` },
      {
        label: thrifty ? 'THRIFTY' : 'SUN OVER PAR',
        value: thrifty ? `${250 * Math.min(10, this.level)}` : '-',
      },
      {
        label: swift ? 'SWIFT' : 'TIME OVER PAR',
        value: swift ? `${250 * Math.min(10, this.level)}` : '-',
      },
    ]
    this.addScore(bonus + medalPoints, pod.x, pod.y - 34, RAMPS.gold[4])
    if (this.hillsCleared % EXTRA_POD_HILLS === 0 && this.lives < MAX_PODS) {
      this.lives++
      this.tally.push({ label: 'SPARE POD', value: '+1' })
      this.sound.play('extra')
    } else this.sound.play('level')
    this.banner = null
  }

  private nextHill() {
    this.startHill(this.level + 1)
  }

  // --- the tether winch -------------------------------------------------------------------

  private workWinch(pod: Pod, input: InputFrame) {
    const hooked = this.cargo.find((c) => c.hookedBy === pod.seat)
    if (hooked) {
      this.hookTicks++
      if (input.pressed.down && this.hookTicks > 20) {
        hooked.hookedBy = -1
        this.sound.play('blip')
      }
      return
    }
    if (!input.held.down || pod.chute) return
    const crate = this.cargo.find((c) => canHook(pod, c, WINCH.line))
    if (!crate) return
    crate.hookedBy = pod.seat
    crate.resting = false
    this.hookTicks = 0
    this.sound.play('pickup')
    this.floaters.push({
      x: crate.x,
      y: crate.y - 14,
      text: 'HOOKED',
      life: 40,
      color: RAMPS.cream[3],
    })
  }

  private dropHooked(pod: Pod) {
    for (const c of this.cargo) if (c.hookedBy === pod.seat) c.hookedBy = -1
  }

  private updateCargo() {
    for (const c of this.cargo) {
      if (c.delivered) continue
      const pod = this.pods.find((p) => p.seat === c.hookedBy)
      if (pod && !pod.restOn)
        swingCargo(pod, c, WINCH.line, this.gravity, this.wind)
      else if (pod) {
        c.resting = false
        dropCargo(c, this.gravity)
      } else dropCargo(c, this.gravity)
      c.x = Math.max(c.r, Math.min(this.terrain.w - c.r, c.x))
      const result = groundCargo(c, this.terrain.floorAt(c.x, c.y))
      if (result === 'bump') {
        this.sound.play('pop')
        this.floaters.push({
          x: c.x,
          y: c.y - 14,
          text: c.seedlings > 0 ? 'BUMP! -1 SEEDLING' : 'BUMP!',
          life: 50,
          color: RAMPS.rust[3],
        })
      }
      if (result === 'land') this.checkDelivery(c)
    }
  }

  private checkDelivery(c: Cargo) {
    const pad = this.terrain.pad(this.cargoTo.get(c.id) ?? '')
    if (!pad || c.x < pad.x0 || c.x > pad.x1 || Math.abs(c.y + c.r - pad.y) > 3)
      return
    c.delivered = true
    c.hookedBy = -1
    c.resting = true
    const points =
      DELIVERY_POINTS * Math.max(1, c.seedlings) * (c.seedlings > 0 ? 1 : 0) +
      100
    this.addScore(points, c.x, c.y - 18, RAMPS.gold[3])
    this.fx.burst(c.x, c.y - 6, this.fxRng, { count: 12 })
    this.banner = {
      text: 'DELIVERED!',
      sub: `${c.seedlings} SEEDLINGS  ${points}`,
      ticks: 100,
    }
    this.sound.play('extra')
  }

  // --- scoring and effects ---------------------------------------------------------------

  private addScore(points: number, x: number, y: number, color: string) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50, color })
  }

  private puffBurst(pod: Pod, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const a = pod.tilt + Math.PI / 2 + (this.fxRng() - 0.5) * 0.9
      this.particles.push({
        x: pod.x - Math.sin(pod.tilt) * POD_FEET,
        y: pod.y + Math.cos(pod.tilt) * POD_FEET,
        vx: Math.cos(a) * 0.3 * speed - Math.sin(pod.tilt) * 0.8,
        vy: Math.sin(a) * 0.3 * speed + Math.cos(pod.tilt) * 0.8,
        life: 18,
        color: '#e0f2fe',
        kind: 'puff',
      })
    }
  }

  private chips(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.4 + this.fxRng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 24 + Math.floor(this.fxRng() * 18),
        color,
        kind: 'chip',
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.kind === 'chip') p.vy += 0.03
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    // Gust streamers: ribbons of air blowing across the view, as many as the wind is strong.
    if (
      this.mission &&
      Math.abs(this.wind) > 0.0015 &&
      this.tick % Math.max(3, Math.round(0.03 / Math.abs(this.wind))) === 0
    ) {
      const v = this.camera.view()
      const fromLeft = this.wind > 0
      this.particles.push({
        x: fromLeft ? v.x0 - 10 : v.x1 + 10,
        y: v.y0 + this.fxRng() * (v.y1 - v.y0),
        vx: this.wind * 260,
        vy: (this.fxRng() - 0.5) * 0.2,
        life: Math.round(
          (v.x1 - v.x0 + 40) / Math.max(0.4, Math.abs(this.wind * 260)),
        ),
        color: RAMPS.cream[4],
        kind: 'streamer',
      })
    }
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const b of this.blooms) {
      b.age++
      if (b.age < 140 && this.tick % 9 === 0)
        this.fx.burst(
          b.x + (this.fxRng() - 0.5) * 18,
          b.y - 6 - this.fxRng() * 14,
          this.fxRng,
          {
            count: 2,
            speed: 0.5,
            colours: FLOWER_SPARKS[b.colour],
          },
        )
    }
    this.fx.update()
  }

  private followCamera() {
    const pod = this.pod
    const floor = this.terrain.floorAt(pod.x, pod.y)
    const altitude = floor - (pod.y + POD_FEET)
    // Lean the view down toward the ground under the pod, keeping the pod well inside it.
    const halfH = VIEW_H / 2 / this.camera.zoom
    const y = Math.max(pod.y, Math.min(floor - halfH + 30, pod.y + halfH - 30))
    this.camera.follow(
      pod.x,
      y,
      altitude,
      this.terrain.w,
      this.terrain.h,
      pod.vx * 30,
    )
  }

  // --- attract-mode pilot ----------------------------------------------------------------

  /** The pad the pilot heads for: the sunflower when low, else the best unplanted bed. */
  private pilotTarget(): Pad | undefined {
    const pod = this.pod
    const pads = this.terrain.pads
    if (pod.restOn) {
      const on = this.terrain.pad(pod.restOn)
      if (on?.kind === 'sun' && pod.sun < this.sunMax * 0.95) return on
    }
    const beds = pads.filter((p) => p.kind === 'seed' && !p.planted)
    const suns = pads.filter((p) => p.kind === 'sun')
    const far = (p: Pad) => Math.abs((p.x0 + p.x1) / 2 - pod.x)
    const bed = [...beds].sort(
      (a, b) => far(a) / (4 + a.mult) - far(b) / (4 + b.mult),
    )[0]
    const sun = [...suns].sort((a, b) => far(a) - far(b))[0]
    // Refuel first when the bed is further than the tank comfortably reaches.
    const need = (bed ? far(bed) : 0) * 0.6 + 280
    if (sun && (pod.sun < need || pod.sun < this.sunMax * 0.3)) return sun
    return bed
  }

  /** Picks a pad, climbs over the hills between, drifts over it, then sets down gently and upright. */
  demoInput(): InputFrame {
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
    const pod = this.pod
    if (!pod || this.phase !== 'fly') return frame
    const pad = this.pilotTarget()
    if (!pad) return frame
    if (pod.restOn) {
      if (pod.restOn === pad.id) return frame
      held.a = true
      return frame
    }
    const cx = (pad.x0 + pad.x1) / 2
    const dx = cx - pod.x
    if (pod.chute) {
      // Under the leaf cap: drift toward the sunflower.
      held.left = dx < -2
      held.right = dx > 2
      return frame
    }
    const halfPad = (pad.x1 - pad.x0) / 2
    const over = Math.abs(dx) < Math.max(1.5, halfPad - 3)
    const feet = pod.y + POD_FEET
    const height = pad.y - feet
    // Clear every hill between here and the pad (looking a little past the pod's drift).
    const span = this.terrain
    const reach = pod.x + Math.sign(dx) * Math.min(Math.abs(dx), 120)
    const ridge = highestBetween(
      (x) => span.floorAt(x, pod.y),
      pod.x - Math.sign(dx) * 8,
      reach,
    )
    const cruise = Math.min(ridge, pad.y) - 26 - Math.abs(pod.vx) * 12
    const altitude = span.floorAt(pod.x, pod.y) - feet
    const near = Math.abs(dx) < 26
    // Never faster across than the pod can stop in before the bed.
    let wantVx = Math.sign(dx) * Math.min(1.3, Math.sqrt(0.016 * Math.abs(dx)))
    // Close in, aim where the pod will be in a moment, not where it is (no overshooting).
    if (near) wantVx = Math.max(-0.6, Math.min(0.6, (dx - pod.vx * 18) / 30))
    // Well under the hills ahead: climb before crossing, don't charge at them.
    if (!near && feet > cruise + 8)
      wantVx = Math.max(-0.25, Math.min(0.25, wantVx))
    let wantVy: number
    if (!near && feet > cruise) wantVy = -0.45
    else if (!near) wantVy = feet < cruise - 40 ? 0.5 : 0.05
    else if (!over) {
      // Close, but not yet over the bed: hold clear of its rims until the pod is above it.
      const rim = highestBetween(
        (x) => span.floorAt(x, pod.y),
        pod.x - Math.sign(dx) * 7,
        cx,
      )
      wantVy = feet > rim - 12 ? -0.3 : feet < rim - 30 ? 0.35 : 0
    } else if (Math.abs(pod.vx) > 0.12 && height < 40) {
      // Over the bed but still sliding: hold height until the slide is gone.
      wantVy = 0
    } else wantVy = Math.min(1.1, 0.16 + Math.max(0, height) / 95)
    const authority = near ? 0.3 : 0.5
    let wantTilt = Math.max(
      -authority,
      Math.min(authority, (wantVx - pod.vx) * 1.5),
    )
    // Low over the bed (or just beside it): stay nearly upright and hover across.
    if (height < 24 && Math.abs(dx) < halfPad + 12) {
      wantTilt = Math.max(-0.12, Math.min(0.12, (wantVx - pod.vx) * 0.8))
      if (over) wantTilt = Math.max(-0.07, Math.min(0.07, wantTilt))
      else wantVy = Math.min(wantVy, -0.05)
    }
    // Hemmed in by close walls (climbing out of a valley): straight up first.
    const wall = highestBetween(
      (x) => span.floorAt(x, pod.y),
      pod.x - 16,
      pod.x + 16,
    )
    if (!near && feet > wall - 6) {
      wantTilt = Math.max(-0.15, Math.min(0.15, -pod.vx * 1.5))
      wantVy = Math.min(wantVy, -0.4)
    }
    if (wantTilt < pod.tilt - 0.03) held.left = true
    if (wantTilt > pod.tilt + 0.03) held.right = true
    const steer = wantVx - pod.vx
    const leaning =
      Math.abs(pod.tilt) > 0.2 && Math.sign(pod.tilt) === Math.sign(steer)
    if (
      pod.vy > wantVy ||
      (Math.abs(pod.tilt) > 0.3 && pod.vy > 0.15 && altitude < 50) ||
      (leaning && Math.abs(steer) > 0.12 && pod.vy > wantVy - 0.05)
    )
      held.a = true
    // The hop, when the ground comes up much too fast.
    const ahead = span.floorAt(pod.x + pod.vx * 20, pod.y) - feet
    if (!over && ahead < 10 && pod.vy > 0.6 && canHop(pod, this.flightTier)) {
      held.b = true
      frame.pressed.b = true
    }
    return frame
  }

  // --- render ----------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const theme = this.mission.theme
    paintSky(g, theme, this.tick, this.camera.x, this.camera.y, this.wind)
    g.save()
    g.beginPath()
    g.rect(0, HUD_H, W, H - HUD_H)
    g.clip()
    this.camera.apply(g)
    this.renderTerrain(g)
    const ground = (x: number) => this.terrain.groundAt(x)
    for (const v of this.vents) drawVent(g, v, ground(v.x), this.tick)
    this.terrain.pads.forEach((p, i) =>
      drawPadLive(g, p, this.tick, i, p.kind === 'seed'),
    )
    for (const b of this.blooms)
      drawBloom(g, b.x, b.y, b.colour, b.age, this.tick)
    if (this.flightTier.arc && this.phase === 'fly' && !this.pod.restOn)
      this.renderArc(g)
    for (const c of this.cargo)
      drawCargo(
        g,
        c,
        this.pods.find((p) => p.seat === c.hookedBy) ?? null,
        this.tick,
      )
    this.renderParticles(g)
    if (this.phase === 'bonk' && this.phaseTicks < 24) {
      const t = 1 - this.phaseTicks / 24
      glow(
        g,
        this.bonkAt.x,
        this.bonkAt.y,
        10 + 22 * (1 - t),
        RAMPS.gold[3],
        0.7 * t,
      )
    }
    if (this.phase !== 'bonk' && !this.over)
      for (const pod of this.pods) {
        const floor = this.terrain.floorAt(pod.x, pod.y)
        const near = Math.max(0, 1 - (floor - (pod.y + POD_FEET)) / 110)
        if (near > 0) {
          g.fillStyle = 'rgba(20, 10, 38, 0.35)'
          g.beginPath()
          g.ellipse(pod.x, floor + 1, 3 + near * 4, 1 + near, 0, 0, Math.PI * 2)
          g.fill()
        }
        drawPod(g, pod, this.tick)
      }
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    g.restore()
    this.renderPointers(g)
    vignette(g, W, H, 0.24)
    const pod = this.pod
    drawHud(g, {
      score: this.score,
      hi: Math.max(this.hiScore, this.score),
      sun: pod.sun / Math.max(1, this.sunMax),
      wind: this.wind,
      vx: pod.vx,
      vy: pod.vy,
      tilt: pod.tilt,
      lives: this.lives,
      label: `HILL ${this.level}`,
      planted: this.planted,
      seeds: this.mission.seeds,
      streak: this.streak,
      tier: this.flightTier,
      hopsLeft: Math.max(0, this.flightTier.hops - pod.hops),
      zoom: this.camera.zoom,
      map: {
        terrain: this.terrain,
        pods: this.pods,
        cargo: this.cargo,
        view: this.camera.view(),
      },
      tick: this.tick,
    })
    if (this.card > 0 && !this.menu && this.phase === 'fly')
      drawMissionCard(g, {
        name: this.mission.name,
        brief: this.mission.brief,
        unlocked: (this.mission.unlocked ?? [])
          .filter((h) => h !== 'gust' || this.level > 1)
          .map((h) => `NEW: ${HAZARD_NAMES[h]}`),
        t: CARD_TICKS - this.card,
        left: this.card,
      })
    if (this.phase === 'clear')
      drawTally(g, {
        title: `${this.mission.name} PLANTED`,
        lines: this.tally,
        t: this.phaseTicks,
      })
    if (this.banner && this.phase !== 'clear') {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 92, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
    if (this.menu)
      drawMenu(g, {
        title: 'SEED LANDER',
        subtitle: 'THE GREAT REPLANTING',
        rows: this.menuRows(),
        pick: this.menu.pick,
        tick: this.tick,
      })
  }

  private renderTerrain(g: CanvasRenderingContext2D) {
    const t = this.terrain
    const theme = this.mission.theme
    const v = this.camera.view()
    if (typeof document === 'undefined') {
      paintTerrain(g, t, theme, v.x0 - 2, v.x1 + 2)
      return
    }
    const key = this.terrainArtFor
    if (!key || key.terrain !== t || key.version !== t.version) {
      this.terrainArtFor = { terrain: t, version: t.version }
      const canvas = document.createElement('canvas')
      canvas.width = t.w
      canvas.height = t.h + 80
      const k = canvas.getContext('2d')
      if (k) {
        k.translate(0, 40)
        paintTerrain(k, t, theme)
      }
      this.terrainArt = k ? canvas : null
    }
    if (!this.terrainArt) {
      paintTerrain(g, t, theme, v.x0 - 2, v.x1 + 2)
      return
    }
    g.save()
    g.imageSmoothingEnabled = false
    g.drawImage(this.terrainArt, 0, -40)
    g.restore()
  }

  private renderArc(g: CanvasRenderingContext2D) {
    const pod = this.pod
    const points = predictArc(pod, this.gravity, this.wind, (x) =>
      this.terrain.floorAt(x, pod.y),
    )
    points.forEach((p, i) => {
      const last = i === points.length - 1
      g.fillStyle = INK
      g.fillRect(
        Math.round(p.x) - 1,
        Math.round(p.y + POD_FEET) - 1,
        last ? 5 : 3,
        last ? 3 : 3,
      )
      g.fillStyle = last ? RAMPS.gold[4] : RAMPS.teal[3]
      g.fillRect(Math.round(p.x), Math.round(p.y + POD_FEET), last ? 3 : 1, 1)
    })
  }

  /** Arrows at the screen's edge toward goal beds out of view (and the shed when towing). */
  private renderPointers(g: CanvasRenderingContext2D) {
    const v = this.camera.view()
    const goals = this.terrain.pads.filter(
      (p) =>
        (p.kind === 'seed' && !p.planted) ||
        (p.kind === 'drop' &&
          this.cargo.some(
            (c) => c.hookedBy >= 0 && this.cargoTo.get(c.id) === p.id,
          )) ||
        (p.kind === 'sun' && this.pod.sun < this.sunMax * 0.3),
    )
    const marks = goals.flatMap((p) => {
      const cx = (p.x0 + p.x1) / 2
      if (cx >= v.x0 && cx <= v.x1 && p.y >= v.y0 && p.y <= v.y1) return []
      const s = this.camera.toScreen(cx, p.y)
      return [
        {
          p,
          x: Math.max(10, Math.min(W - 10, s.x)),
          y: Math.max(HUD_H + 10, Math.min(H - 22, s.y)),
          dir: s.x < 0 ? -1 : s.x > W ? 1 : 0,
        },
      ]
    })
    // Marks on the same edge stack apart rather than overlapping.
    marks.sort((a, b) => a.y - b.y)
    marks.forEach((m, i) => {
      for (const prev of marks.slice(0, i))
        if (Math.abs(m.x - prev.x) < 11 && Math.abs(m.y - prev.y) < 11)
          m.y = prev.y + 11
    })
    const bob = Math.sin(this.tick / 8) > 0 ? 1 : 0
    for (const { p, x: mx, y, dir } of marks) {
      const x = mx + dir * bob
      const ramp =
        p.kind === 'sun'
          ? RAMPS.gold
          : p.kind === 'drop'
            ? RAMPS.steel
            : (PAD_RAMP[p.mult] ?? RAMPS.teal)
      g.fillStyle = INK
      g.fillRect(x - 4, y - 4, 9, 9)
      g.fillStyle = ramp[3]
      g.fillRect(x - 3, y - 3, 7, 7)
      drawText(
        g,
        p.kind === 'seed' ? `${p.mult}` : p.kind === 'sun' ? '*' : 'S',
        x + 1,
        y - 3,
        { align: 'center', color: INK },
      )
      if (dir) {
        const tipX = dir > 0 ? x + 6 : x - 7
        g.fillStyle = INK
        g.fillRect(tipX, y - 2, 2, 5)
        g.fillStyle = ramp[4]
        g.fillRect(tipX, y - 1, 1, 3)
      }
    }
  }

  private renderParticles(g: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      if (p.kind === 'streamer') {
        g.globalAlpha = 0.35
        g.fillStyle = p.color
        const len = Math.min(18, Math.abs(p.vx) * 8 + 4)
        g.fillRect(p.vx > 0 ? x - len : x, y, len, 1)
        continue
      }
      if (p.kind === 'puff') {
        const r = 1 + Math.floor((18 - p.life) / 6)
        g.globalAlpha = Math.max(0, (p.life / 18) * 0.7)
        g.fillStyle = RAMPS.cream[2]
        g.fillRect(x - r, y - r + 1, r * 2 + 1, r * 2 - 1)
        g.fillRect(x - r + 1, y - r, r * 2 - 1, r * 2 + 1)
        g.fillStyle = RAMPS.cream[4]
        g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2)
        continue
      }
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y - 1, 1, 1)
    }
    g.globalAlpha = 1
  }
}

const seedLander: ArcadeGameModule = {
  create: (options) => new SeedLander(options),
}

export const create = seedLander.create
export default seedLander
