// /utils/arcade/games/rescueRally.ts
//
// Rescue Rally -- the Kind Robots Arcade's arena-shooter riff (conductor
// kr-arcade/t-007). An android hero zips around a neon arena firing a kindness
// beam that reboots glitched drones into friendly bots, while people, pets and
// little bots wait to be rescued for a growing multiplier.
//
// Depth slice 1 (t-035, depth-pass/CABINETS.md section 1, "Twin-stick and teeth") gave it teeth:
// - true twin-stick aim: a second stick (the right stick, the on-screen aim stick, or the arrows
//   while WASD moves) aims and fires on its own; single-stick players still move to aim, A to fire
//   and hold B to strafe;
// - the family is in danger: stompers (wind-up giants no beam can stop, only shove) knock rescuees
//   dizzy, so they wander off home without their bonus; hypnos glitch them into glitched friends
//   who chase the hero until a beam reboots them; sparkers flash, then fire at where the hero is
//   going; pylon posts stand in shapes (hearts, stars, K-I-N-D);
// - every rescue is a choice: touch to collect at once, or hold B to lead up to three in a parade
//   to the wave's beacon pad for double the bonus (a hit scatters the parade);
// - waves are scripts (rescueRally/waves.ts), and the actors are bigger (rescueRally/art.ts).
//
// Depth slice 2 (t-036, "Neon Plaza, Toy Factory and the Shelter") makes it Citywide Reboot's
// campaign (rescueRally/districts.ts): districts of eight waves on their own floors with their own
// music, each closing on a boss (rescueRally/bosses.ts: the Big Wind-Up, the Jack-in-the-Box). The
// Toy Factory's conveyor belts carry everyone and its crates are cover. Every 15 foes rebooted
// inside one chain window free a Reboot Squad bot that orbits the hero and fires on its own (a hit
// costs a squad bot before a hero); eight power-ups (rescueRally/powers.ts) drop from crates and
// heavies and come through a vent each wave. Between districts the Shelter (rescueRally/shelter.ts)
// shows everyone the hero got home, and their thank-you hearts buy spare heroes, squad bots, a wider
// beam and a longer chain window. Progress saves at each district's start (`save`).
//
// Depth slice 3 (t-037, "Districts 3-5, the Glitch Core and the endings") finishes the city: the
// Botanic Dome (vine walls that grow, sprinklers that slow, flowerbeds the family hides in), the
// Data Docks (teleport pads, laser gates on a beat, magnet floors) and the Storm Rooftops (wind that
// turns, lightning after a glowing ring, roof edges the family can be blown to), with the prism,
// thornball, splitter, mimic, shield bot, magnet and kite drone, and Overgrowth, the Static Twins and
// the Glitch Core (rescueRally/bossesLate.ts, floors.ts). A golden chip hides in each district's
// signature wave, earned by getting everyone in it home; the Shelter sells a hint. Beating the Core
// rolls the credits (rescueRally/credits.ts); with all five chips the Reunion comes first, and the
// true ending. Then the rally loops round the city, harder.
//
// Depth slice 4 (t-038, "Co-op and the long rally") seats two to four heroes through the cabinet's
// `players` frames (one shared pool of lives and one rescue multiplier; a hero who goes down sits
// dizzy until a partner stands close for two seconds, or picks themselves up after a while), and
// opens the menu of modes (rescueRally/modes.ts): the Campaign, Rally 100 (the leaderboard's main
// event), District Time Attack, Classic Rally (the original rules, kept) and the Medal Board. Every
// district wave can win three medals: Everyone Home, Untouched and Full Squad.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
} from '../snes'
import type { MusicLoop } from '../sound'
import { emptyInput } from '../types'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  ARENA,
  ARENA_H,
  ARENA_W,
  CX,
  CY,
  H,
  VENTS,
  W,
  clampToArena,
  dist,
  nearWall,
  toward,
} from '../rescueRally/arena'
import type { Point } from '../rescueRally/arena'
import {
  FREED_SPRITES,
  GLITCH,
  HEART_SPRITE,
  HELP_SPRITE,
  HERO_SPRITES,
  heroSprites,
  SHIRTS,
  SKINS,
  SQUAD_SPRITE,
  familySprites,
  glitchTint,
} from '../rescueRally/art'
import {
  BOSSES,
  bossHarms,
  bossTargets,
  hurtBoss,
  inGap,
  newBoss,
  shockAt,
  stepBoss,
  LUNGE_REACH,
} from '../rescueRally/bosses'
import type { Boss, BossWorld } from '../rescueRally/bosses'
import { renderBoss, renderShocks } from '../rescueRally/bossArt'
import { shieldBlocks } from '../rescueRally/bossesLate'
import { SKIP_AFTER, endingTicks, renderEnding } from '../rescueRally/credits'
import {
  GATE_REACH,
  LIGHTNING_RADIUS,
  LIGHTNING_TELL,
  MAGNET_FLOOR_PULL,
  PAD_COOLDOWN,
  SPRINKLER_SLOW,
  gateState,
  inRect,
  padExit,
  pushOutOfRect,
  segmentDistance,
  windAt,
} from '../rescueRally/floors'
import type {
  LaserGate,
  PadPair,
  Rect,
  Sprinkler,
  Storm,
} from '../rescueRally/floors'
import {
  DISTRICTS,
  WAVES_PER_DISTRICT,
  districtStart,
  waveAt,
} from '../rescueRally/districts'
import {
  PARADE_GAP,
  PARADE_MAX,
  RESCUEE_RADIUS,
  stepRescuee,
} from '../rescueRally/family'
import type { FamilyWorld, Rescuee, RescueeKind } from '../rescueRally/family'
import type { HeroSprites } from '../rescueRally/art'
import {
  renderBedTops,
  renderBeds,
  renderConveyors,
  renderFloor,
  renderGates,
  renderMagnetFloors,
  renderPads,
  renderSprinklers,
  renderStorm,
  renderVents,
  renderVines,
} from '../rescueRally/floorArt'
import { renderFoe, renderPuddle } from '../rescueRally/foeArt'
import { BOSS_MUSIC, ENDING_MUSIC, SHELTER_MUSIC } from '../rescueRally/music'
import {
  CRATE_DROP,
  HEAVY_DROP,
  POWERS,
  POWER_FLOOR_TICKS,
  POWER_KINDS,
  POWER_SPRITES,
  VENT_POWER_AT,
  powerFromRoll,
} from '../rescueRally/powers'
import type { PowerKind } from '../rescueRally/powers'
import { pylonSpots } from '../rescueRally/pylons'
import {
  FOES,
  RUSH_MAX,
  RUSH_TICKS,
  SHIELD_ARC,
  SHIELD_KNOCKS,
  SHIELD_RATTLE,
  newFoe,
  stepFoe,
} from '../rescueRally/roster'
import type { Foe, FoeKind, FoeWorld, Quarry } from '../rescueRally/roster'
import {
  BEAM_STEP,
  CHAIN_STEP,
  HEARTS_EVERYONE_HOME,
  HEARTS_PER_BOSS,
  HEARTS_PER_RESCUE,
  SHELTER_ITEMS,
  SHELTER_TICKS,
  THANKS,
  canBuy,
  renderShelter,
} from '../rescueRally/shelter'
import type { ShelterItemId, Upgrades } from '../rescueRally/shelter'
import {
  CONVEYOR_SPEED,
  CRATE_SPACING,
  conveyorStep,
  groupSize,
  REUNION,
} from '../rescueRally/waves'
import type { Conveyor, Entry, WaveScript } from '../rescueRally/waves'
import {
  MEDALS,
  MENU,
  RALLY_BONUS,
  RALLY_LENGTH,
  classicWave,
  clock,
  medalKey,
  rallyWave,
  readMedals,
  readTimes,
  renderBoard,
  renderMenu,
} from '../rescueRally/modes'
import type {
  BestTimes,
  MedalBoard,
  MenuId,
  ModeId,
} from '../rescueRally/modes'

export { W, H }

const PLAYER_SPEED = 1.9
const HERO_RADIUS = 8
const SHOT_SPEED = 6.5
const SHOT_LIFE = 70
const MAX_SHOTS = 6
const FIRE_COOLDOWN = 6
const START_LIVES = 3
const MAX_LIVES = 9
/** Extra heroes: the first at 25,000, then each a further 75,000 more than the gap before. */
const EXTRA_LIFE_FIRST = 25_000
const EXTRA_LIFE_EVERY = 75_000

/** The score of the n-th extra hero (0-based). */
function extraAt(n: number) {
  return EXTRA_LIFE_FIRST + (EXTRA_LIFE_EVERY * n * (n + 1)) / 2
}
const RESCUE_STEP = 1000
const RESCUE_CAP = 5
/** Points for rebooting a glitched friend back into a rescuee (never for hurting one). */
const REBOOT_POINTS = 100
/** Below this a stick's push doesn't aim. */
const AIM_MIN = 0.3
/** Steps of footprints a hero keeps for its parade to follow. */
const TRAIL = (PARADE_MAX + 1) * PARADE_GAP + 2
const BEACON_RADIUS = 18
const BOLT_RADIUS = 3
const BOLT_LIFE = 200
const MAX_BOLTS = 40
const MAX_FOES = 140
/** A vent glows this long before a late group comes through it. */
const VENT_TELL = 70
/** A dizzy rescuee staggers for at least this long. */
const DIZZY_TICKS = 150
/** The Reboot Squad: this many foes rebooted inside one chain window free a squad bot. */
export const SQUAD_CHAIN = 15
export const CHAIN_WINDOW = 120
export const SQUAD_MAX = 3
/** A squad bot fires a sparkle this often, at whatever is nearest in this reach. */
const SQUAD_EVERY = 90
const SQUAD_REACH = 220
/** Points instead of a fourth squad bot. */
const SQUAD_FULL_BONUS = 2500
/** A wave still going after this long fades out by itself (never a boss wave). */
const FADE_TICKS = 60 * 150
/** A downed co-op hero gets up by themselves after this long; a partner close by takes this long. */
const COOP_RESPAWN = 60 * 7
const REVIVE_TICKS = 120
const REVIVE_REACH = 24
/** Each seat's suit. */
const SUITS = [RAMPS.teal, RAMPS.pink, RAMPS.gold, RAMPS.leaf] as const
/** A mode's result card shows this long before the game ends. */
const RESULT_TICKS = 60 * 5
/** A district's title card shows this long. */
const CARD_TICKS = 150
/** Each loop round the city, the walkers start this much faster. */
const LOOP_RUSH = 0.4

/** How a wave remembers its late arrivals. */
type Arrival = { tick: number; kind: FoeKind; count: number; from: Entry }

type Hero = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  aimX: number
  aimY: number
  walk: number
  alive: boolean
  respawn: number
  invuln: number
  fireCooldown: number
  /** A second stick is pointing this tick. */
  aiming: boolean
  /** B is held: touching a rescuee invites them into the parade. */
  gathering: boolean
  /** Where the hero has been, newest last, for the parade to step in. */
  trail: Point[]
  /** Down in co-op: how long a partner has stood by to pick this hero up. */
  reviving: number
  /** Every step of the last few seconds, for the mimics to walk. */
  history: Point[]
  /** A teleport pad won't take this hero again until the tick it allows. */
  padClock: number
  /** Reboot Squad bots orbiting this hero. */
  squad: number
  /** Power-ups running, ticks left on each. */
  powers: Partial<Record<PowerKind, number>>
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  seat: number
  /** Beam radius (a wider beam reaches further either side). */
  r: number
  /** Wall bounces left (the Bounce power). */
  bounce: number
  /** Goes straight through foes (the Wide power), hitting each once. */
  pierce: boolean
  hits: Foe[]
  /** A squad bot's sparkle. */
  squad: boolean
}
/** A spark from a sparker, or the Jack's confetti. */
type Bolt = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  confetti: boolean
  /** Wall bounces left (a thornball's shell). */
  bounces: number
}
type Pickup = { kind: PowerKind; x: number; y: number; life: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
}

/** A rally kept at a district's start (ArcadeGameInstance.save), and handed back as `resume`. */
export type RallySave = {
  v: 3
  /** The district to pick up at the start of (an index into DISTRICTS). */
  district: number
  loop: number
  score: number
  lives: number
  hearts: number
  friends: number
  upgrades: Upgrades
  bought: Record<ShelterItemId, number>
  /** The run it came from ended: picking it up again starts the score from zero. */
  continued: boolean
  /** Golden chips found (district ids), and whether the city has been cleared. */
  chips: string[]
  cleared: boolean
  /** Medals and Time Attack bests won on this device, and the furthest district reached. */
  medals: MedalBoard
  times: BestTimes
  reached: number
}

const isCount = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/** A stored save, checked against this campaign; null when it is not one we can use. */
export function readSave(raw: unknown): RallySave | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  if (v.v !== 1 && v.v !== 2 && v.v !== 3) return null
  if (!isCount(v.district, DISTRICTS.length - 1)) return null
  if (!isCount(v.loop, 99) || v.loop < 1) return null
  if (!isCount(v.score, 250_000_000)) return null
  if (!isCount(v.lives, MAX_LIVES) || v.lives < 1) return null
  if (!isCount(v.hearts, 9999) || !isCount(v.friends, 1_000_000)) return null
  if (typeof v.continued !== 'boolean') return null
  const u = v.upgrades as Record<string, unknown> | null
  if (!u || typeof u !== 'object') return null
  if (
    !isCount(u.beam, 2) ||
    !isCount(u.chain, 2) ||
    !isCount(u.squad, SQUAD_MAX)
  )
    return null
  const b = v.bought as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  const bought = {} as Record<ShelterItemId, number>
  for (const item of SHELTER_ITEMS) {
    const n = b[item.id] ?? 0
    if (!isCount(n, 99)) return null
    bought[item.id] = n
  }
  // Version 1 (before districts 3-5) still reads: no chips, not cleared.
  const ids = new Set(DISTRICTS.map((d) => d.id as string))
  const chips = v.v === 1 ? [] : v.chips
  if (
    !Array.isArray(chips) ||
    !chips.every((c) => typeof c === 'string' && ids.has(c)) ||
    new Set(chips).size !== chips.length
  )
    return null
  const cleared = v.v === 1 ? false : v.cleared
  if (typeof cleared !== 'boolean') return null
  // Versions 1 and 2 (before the modes) still read: no medals or times yet.
  const medals = readMedals(v.v === 3 ? v.medals : undefined)
  const times = readTimes(v.v === 3 ? v.times : undefined)
  const reached = v.v === 3 ? v.reached : v.district
  if (!medals || !times || !isCount(reached, DISTRICTS.length - 1)) return null
  return {
    v: 3,
    district: v.district,
    loop: v.loop,
    score: v.score,
    lives: v.lives,
    hearts: v.hearts,
    friends: v.friends,
    upgrades: { beam: u.beam, chain: u.chain, squad: u.squad },
    bought,
    continued: v.continued,
    chips,
    cleared,
    medals,
    times,
    reached: Math.max(reached, v.district),
  }
}

/** The beacon pad's little house: walk a parade here. */
const HOUSE_SPRITE = pixelSprite(
  [
    '....R....',
    '...RRR...',
    '..RRRRR..',
    '.RRRRRRR.',
    'rRRRRRRRr',
    '.WWWWWWW.',
    '.WkWWWYW.',
    '.WkWWWWW.',
    '.wkwwwww.',
  ],
  {
    R: RAMPS.pink[3],
    r: RAMPS.pink[1],
    W: RAMPS.cream[3],
    w: RAMPS.cream[2],
    k: RAMPS.earth[1],
    Y: RAMPS.gold[3],
  },
)

/** A rescuee's starting look, rolled on the game's rng. */
const KIND_CYCLE: readonly RescueeKind[] = [
  'person',
  'person',
  'cat',
  'dog',
  'bot',
]

/** Foes the beam reboots that count toward a squad chain (not posts, puddles or crates). */
const CHAINS = (kind: FoeKind) =>
  kind !== 'pylon' && kind !== 'puddle' && kind !== 'crate'
/** Foes that walk the floor: conveyors carry them and crates turn them. */
const WALKS = (kind: FoeKind) =>
  kind === 'drone' ||
  kind === 'tank' ||
  kind === 'hypno' ||
  kind === 'sparker' ||
  kind === 'windup' ||
  kind === 'stomper'
/** Foes that leave a power-up behind now and then. */
const HEAVY = (kind: FoeKind) =>
  kind === 'spawner' ||
  kind === 'tank' ||
  kind === 'hypno' ||
  kind === 'sparker'

const emptyBought = (): Record<ShelterItemId, number> => ({
  hero: 0,
  squad: 0,
  beam: 0,
  chain: 0,
  hint: 0,
  leave: 0,
})

class RescueRally implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private heroes: Hero[] = []
  private shots: Shot[] = []
  private bolts: Bolt[] = []
  private foes: Foe[] = []
  private family: Rescuee[] = []
  private arrivals: Arrival[] = []
  private pickups: Pickup[] = []
  private belts: readonly Conveyor[] = []
  private boss: Boss | null = null
  private script: WaveScript
  private loop = 1
  private district = 0
  /** The wave within its district, 0-7. */
  private index = 0
  private waveTick = 0
  private beacon: Point | null = null
  private ventPower = false
  // Districts 3-5's floors (rescueRally/floors.ts), from the wave script.
  private vines: readonly Rect[] = []
  private sprinklers: readonly Sprinkler[] = []
  private beds: readonly Rect[] = []
  private pads: readonly PadPair[] = []
  private gates: readonly LaserGate[] = []
  private magnetFloors: readonly Rect[] = []
  private storm: Storm | undefined
  private wind: Point = { x: 0, y: 0 }
  /** Lightning rings counting down to their strike (a strike flashes for a few ticks below zero). */
  private strikes: Array<{ x: number; y: number; clock: number }> = []
  /** Kite drones' shadows, counting down to the pylon they drop. */
  private drops: Array<{ x: number; y: number; clock: number }> = []
  /** A teleport pad won't take a rescuee or foe again until this tick. */
  private padClock = new WeakMap<object, number>()
  /** Golden chips found (district ids), the district a hint was bought for, and the city cleared. */
  private chips = new Set<string>()
  private hintFor = -1
  private cleared = false
  /** The mode being played, the menu (with its Time Attack district and the board open), records. */
  private mode: ModeId = 'campaign'
  private menu: {
    cursor: number
    district: number
    board: boolean
    ticks: number
  } | null = null
  private medals: MedalBoard = {}
  private times: BestTimes = {}
  private reached = 0
  /** This wave saw a hero hit (no Untouched medal). */
  private waveHit = false
  /** Ticks on the Time Attack clock. */
  private attackTicks = 0
  /** A mode's last card (Time Attack's time, Rally 100's finish) before the game ends. */
  private result: { text: string; sub: string; ticks: number } | null = null
  private suits: HeroSprites[] = []
  /** The credits rolling (and whether it is the true ending). */
  private ending: { t: number; trueEnding: boolean } | null = null
  private nextId = 1
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private freed: Array<{ x: number; y: number; life: number }> = []
  private multiplier = 1
  private nextExtra = EXTRA_LIFE_FIRST
  private extras = 0
  private waveDelay = 0
  /** Every foe frozen (the Pause power), ticks left. */
  private freeze = 0
  /** The Reboot Squad's chain: foes rebooted, and ticks left in the window. */
  private chain = 0
  private chainClock = 0
  /** This wave's family: how many came, how many the hero got home. */
  private familyTotal = 0
  private familySaved = 0
  /** Thank-you hearts to spend at the Shelter, and every friend the hero has got home. */
  private hearts = 0
  private friends = 0
  private upgrades: Upgrades = { beam: 0, chain: 0, squad: 0 }
  private bought = emptyBought()
  private shelter: { cursor: number; ticks: number; thanks: string } | null =
    null
  /** A stored rally offered on the opening card, and which choice is lit. */
  private offer: RallySave | null = null
  private choice = 0
  private savePoint: RallySave | null = null
  private continued = false
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  // Cosmetic sparkles, bursts and rescue rings roll their own dice, so the seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)
  private rings: Array<{ x: number; y: number; life: number; color: string }> =
    []
  private foeWorld: FoeWorld
  private familyWorld: FamilyWorld
  private bossWorld: BossWorld
  /** The pilot's second stick, held between looks, and its Shelter shopping. */
  private pilotAim: Point | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    // Up to four seats, a hero each, one shared pool of lives.
    const seats = Math.max(1, Math.min(4, Math.floor(options.players ?? 1)))
    this.heroes = Array.from({ length: seats }, (_, i) => this.newHero(i))
    this.suits = this.heroes.map((_, i) =>
      i === 0 ? HERO_SPRITES : heroSprites(SUITS[i]!),
    )
    this.lives = START_LIVES + seats - 1
    this.foeWorld = this.makeFoeWorld()
    this.familyWorld = this.makeFamilyWorld()
    this.bossWorld = this.makeBossWorld()
    this.script = waveAt(1).script
    const offer = this.demo ? null : readSave(options.resume)
    if (offer) {
      // What this device has earned stays with every rally: the friends, the medals, the times.
      this.friends = offer.friends
      this.medals = { ...offer.medals }
      this.times = { ...offer.times }
      this.reached = offer.reached
      this.chips = new Set(offer.chips)
      this.cleared = offer.cleared
      this.savePoint = offer
    }
    this.startWave(1)
    if (!this.demo) this.openMenu()
    if (offer && (offer.district > 0 || offer.loop > 1)) {
      // Until the player chooses, the stored rally stays as it was.
      this.offer = offer
      this.menu = null
      this.banner = null
    }
  }

  /** The rally kept on this device: written at each district's start, never by the attract demo. */
  get save(): RallySave | null | undefined {
    return this.demo ? undefined : this.savePoint
  }

  /** The district's loop, the boss theme on a boss wave, the Shelter's tune between districts. */
  get music(): MusicLoop | null {
    if (this.demo || this.over || this.offer || this.menu) return null
    if (this.ending || this.script.reunion) return ENDING_MUSIC
    if (this.shelter) return SHELTER_MUSIC
    if (this.boss) return BOSS_MUSIC
    if (this.mode === 'classic') return DISTRICTS[0]!.music
    return DISTRICTS[this.district]!.music
  }

  private newHero(seat: number): Hero {
    return {
      seat,
      x: CX + this.seatOffset(seat),
      y: CY,
      vx: 0,
      vy: 0,
      aimX: 0,
      aimY: -1,
      walk: 0,
      alive: true,
      respawn: 0,
      invuln: 0,
      fireCooldown: 0,
      aiming: false,
      gathering: false,
      trail: [],
      reviving: 0,
      history: [],
      padClock: 0,
      squad: 0,
      powers: {},
    }
  }

  /** Seats start side by side. */
  private seatOffset(seat: number) {
    return [0, 22, -22, 44][seat] ?? 0
  }

  // --- the worlds the roster, the family and the bosses see ----------------------------

  private nearestHero(from: Point): Hero | null {
    let best: Hero | null = null
    let bestD = Infinity
    for (const h of this.heroes) {
      if (!h.alive) continue
      const d = dist(h, from)
      if (d < bestD) {
        best = h
        bestD = d
      }
    }
    return best
  }

  private quarry(from: Point): Quarry | null {
    const h = this.nearestHero(from)
    return h ? { x: h.x, y: h.y, vx: h.vx, vy: h.vy } : null
  }

  private makeFoeWorld(): FoeWorld {
    return {
      rng: () => this.rng(),
      heat: 1,
      rush: 1,
      hero: (from) => this.quarry(from),
      family: (from) => {
        let best: Rescuee | null = null
        let bestD = Infinity
        for (const r of this.family) {
          if ((r.state !== 'calm' && r.state !== 'parade') || r.immune > 0)
            continue
          // Hiding in a flowerbed: out of sight.
          if (r.state === 'calm' && this.beds.some((b) => inRect(r, b)))
            continue
          const d = dist(r, from)
          if (d < bestD) {
            best = r
            bestD = d
          }
        }
        return best
      },
      bonk: (r, by) => this.bonk(r, by),
      glitch: (r) => this.glitch(r),
      fire: (x, y, vx, vy, bounces) =>
        this.fireBolt(x, y, vx, vy, false, bounces ?? 0),
      echo: (from, ago) => {
        const h = this.nearestHero(from)
        if (!h || !h.history.length) return null
        return h.history[Math.max(0, h.history.length - 1 - ago)]!
      },
      drop: (at) => {
        const p = { ...at }
        clampToArena(p, 16)
        if (this.drops.length < 6) this.drops.push({ ...p, clock: 60 })
      },
      count: (kind) => this.foes.filter((f) => f.kind === kind).length,
      hatch: (kind, at) => {
        if (this.foes.length < MAX_FOES)
          this.foes.push(newFoe(kind, at, this.rng))
      },
      sound: (name) => this.sound.play(name),
    }
  }

  private makeFamilyWorld(): FamilyWorld {
    return {
      rng: () => this.rng(),
      heat: 1,
      hero: (from) => this.nearestHero(from),
      trail: (seat, slot) => {
        const h = this.heroes[seat]
        if (!h || !h.alive) return null
        const back = (slot + 1) * PARADE_GAP
        const at = h.trail[Math.max(0, h.trail.length - 1 - back)]
        return at ?? h
      },
      post: (at, r) => {
        for (const f of this.foes) {
          if (
            (f.kind === 'pylon' || f.kind === 'crate') &&
            dist(f, at) < r + FOES[f.kind].radius
          )
            return f
        }
        return null
      },
    }
  }

  private makeBossWorld(): BossWorld {
    return {
      rng: () => this.rng(),
      heat: 1,
      hero: (from) => this.quarry(from),
      fire: (x, y, vx, vy) =>
        this.fireBolt(x, y, vx, vy, this.boss?.kind === 'jack'),
      hatch: (kind, at) => {
        if (this.foes.length < MAX_FOES) {
          const p = { ...at }
          clampToArena(p, 10)
          this.foes.push(newFoe(kind, p, this.rng))
        }
      },
      count: (kind) => this.foes.filter((f) => f.kind === kind).length,
      glitchAll: () => {
        for (const r of this.family)
          if (r.state !== 'glitched' && r.state !== 'dizzy') this.glitch(r)
      },
      sound: (name) => this.sound.play(name),
    }
  }

  private fireBolt(
    x: number,
    y: number,
    vx: number,
    vy: number,
    confetti: boolean,
    bounces = 0,
  ) {
    if (this.bolts.length < MAX_BOLTS)
      this.bolts.push({ x, y, vx, vy, life: BOLT_LIFE, confetti, bounces })
  }

  // --- the family under threat -------------------------------------------------------

  private leaveParade(r: Rescuee) {
    if (r.state !== 'parade') return
    const seat = r.seat
    r.state = 'calm'
    this.reslot(seat)
  }

  private reslot(seat: number) {
    let slot = 0
    for (const m of this.family)
      if (m.state === 'parade' && m.seat === seat) m.slot = slot++
  }

  private parade(seat: number): Rescuee[] {
    return this.family.filter((r) => r.state === 'parade' && r.seat === seat)
  }

  /** A stomper (or a shockwave) caught one: dizzy, off home without a bonus (never hurt). */
  private bonk(r: Rescuee, by: Point) {
    this.leaveParade(r)
    r.state = 'dizzy'
    r.clock = DIZZY_TICKS
    const u = toward(by, r)
    r.x += u.x * 6
    r.y += u.y * 6
    this.floaters.push({
      x: r.x,
      y: r.y - 16,
      text: 'DIZZY!',
      life: 50,
      color: RAMPS.gold[3],
    })
    this.sound.play('warn')
  }

  /** A hypno reached one: a glitched friend, until a beam reboots them. */
  private glitch(r: Rescuee) {
    this.leaveParade(r)
    r.state = 'glitched'
    r.vx = 0
    r.vy = 0
    this.floaters.push({
      x: r.x,
      y: r.y - 16,
      text: 'GLITCHED!',
      life: 50,
      color: GLITCH[3],
    })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: GLITCH[3] })
    this.sound.play('warn')
  }

  /** A beam reached a glitched friend: back to themselves, a moment dazed and safe from hypnos. */
  private reboot(r: Rescuee) {
    r.state = 'calm'
    r.clock = 40
    r.immune = 180
    r.turn = 0
    this.addScore(REBOOT_POINTS, r.x, r.y - 12, GLITCH[4])
    this.floaters.push({
      x: r.x,
      y: r.y - 24,
      text: 'REBOOT!',
      life: 40,
      color: RAMPS.leaf[3],
    })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.leaf[3] })
    this.fx.burst(r.x, r.y - 6, this.fxRng, {
      count: 8,
      speed: 1.4,
      colours: [RAMPS.leaf[3], GLITCH[4], RAMPS.gold[4]],
    })
    this.sound.play('pickup')
  }

  // --- setup ---------------------------------------------------------------------------

  /** Pylons and crates: the posts and boxes nothing is placed on. */
  private clearOfPosts(p: Point, r: number) {
    return !this.foes.some(
      (f) =>
        (f.kind === 'pylon' || f.kind === 'crate') &&
        dist(f, p) < r + FOES[f.kind].radius,
    )
  }

  private scatterSpot(minDistance: number, clearance = 12): Point {
    const from = this.heroes[0]!
    for (let attempt = 0; attempt < 60; attempt++) {
      const p = {
        x: ARENA.left + 18 + this.rng() * (ARENA_W - 36),
        y: ARENA.top + 18 + this.rng() * (ARENA_H - 36),
      }
      if (dist(p, from) >= minDistance && this.clearOfPosts(p, clearance))
        return p
    }
    return { x: ARENA.left + 24, y: ARENA.top + 24 }
  }

  /** Where the i-th of n comes in through an entry. */
  private entrySpot(from: Entry, i: number, n: number): Point {
    const hero = this.heroes[0]!
    const inset = 22
    const jitter = (k: number) => (this.rng() - 0.5) * k
    const L = ARENA.left + inset
    const R = ARENA.right - inset
    const T = ARENA.top + inset
    const B = ARENA.bottom - inset
    const along = (a: number, b: number) =>
      a + ((i + 0.5 + jitter(0.6)) / n) * (b - a)
    let p: Point
    switch (from) {
      case 'scatter':
        return this.scatterSpot(110)
      case 'edges': {
        // Round the walls clockwise from the top-left, spread out evenly.
        const perimeter = 2 * (R - L) + 2 * (B - T)
        let t = ((i + 0.5 + jitter(0.5)) / n) * perimeter
        if (t < R - L) p = { x: L + t, y: T }
        else if ((t -= R - L) < B - T) p = { x: R, y: T + t }
        else if ((t -= B - T) < R - L) p = { x: R - t, y: B }
        else p = { x: L, y: B - (t - (R - L)) }
        break
      }
      case 'corners': {
        const c = i % 4
        p = {
          x: (c === 0 || c === 3 ? L + 14 : R - 14) + jitter(36),
          y: (c < 2 ? T + 14 : B - 14) + jitter(36),
        }
        break
      }
      case 'ring': {
        const a = (i / n) * Math.PI * 2 + jitter(0.3)
        p = {
          x: hero.x + Math.cos(a) * 135,
          y: hero.y + Math.sin(a) * 110,
        }
        break
      }
      case 'vents': {
        const v = VENTS[i % VENTS.length]!
        p = { x: v.x + jitter(20), y: v.y + jitter(20) }
        break
      }
      case 'top':
        p = { x: along(L, R), y: T + jitter(10) }
        break
      case 'bottom':
        p = { x: along(L, R), y: B + jitter(10) }
        break
      case 'left':
        p = { x: L + jitter(10), y: along(T, B) }
        break
      case 'right':
        p = { x: R + jitter(10), y: along(T, B) }
        break
    }
    clampToArena(p, 14)
    return p
  }

  private place(kind: FoeKind, count: number, from: Entry) {
    for (let i = 0; i < count && this.foes.length < MAX_FOES; i++)
      this.foes.push(newFoe(kind, this.entrySpot(from, i, count), this.rng))
  }

  /** Where wave `n` falls for the mode being played. */
  private spotFor(n: number) {
    if (this.mode === 'rally100') return rallyWave(n)
    if (this.mode === 'classic')
      return { script: classicWave(n), loop: 1, district: 0, index: 0 }
    return waveAt(n)
  }

  private startWave(n: number) {
    const spot = this.spotFor(n)
    this.level = n
    this.district = spot.district
    this.index = spot.index
    this.setupWave(spot.script, spot.loop)
  }

  /** Lay out a wave from its script (the campaign's, or the Reunion's). */
  private setupWave(script: WaveScript, loop: number) {
    const n = this.level
    const spot = { index: this.index }
    this.script = script
    this.loop = loop
    this.foeWorld.heat = n
    this.familyWorld.heat = n
    this.bossWorld.heat = n
    this.foes = []
    this.shots = []
    this.bolts = []
    this.family = []
    this.arrivals = []
    this.pickups = []
    this.belts = script.conveyors ?? []
    this.vines = script.vines ?? []
    this.sprinklers = script.sprinklers ?? []
    this.beds = script.beds ?? []
    this.pads = script.pads ?? []
    this.gates = script.gates ?? []
    this.magnetFloors = script.magnets ?? []
    this.storm = script.storm
    this.wind = { x: 0, y: 0 }
    this.strikes = []
    this.drops = []
    this.multiplier = 1
    this.waveTick = 0
    this.freeze = 0
    this.ventPower = false
    this.beacon = script.beacon
    const start = script.hero ?? { x: CX, y: CY }
    for (const h of this.heroes) {
      Object.assign(h, {
        x: start.x + this.seatOffset(h.seat),
        y: start.y,
        vx: 0,
        vy: 0,
      })
      h.trail = []
      h.history = []
    }
    // The pylon garden and the crates first, so nothing else is placed on a post.
    const inside = (p: Point) =>
      p.x > ARENA.left + 8 &&
      p.x < ARENA.right - 8 &&
      p.y > ARENA.top + 8 &&
      p.y < ARENA.bottom - 8
    for (const place of script.pylons ?? []) {
      for (const p of pylonSpots(place)) {
        if (inside(p) && dist(p, start) > 26)
          this.foes.push(newFoe('pylon', p, this.rng))
      }
    }
    for (const place of script.crates ?? []) {
      for (const p of pylonSpots({ spacing: CRATE_SPACING, ...place })) {
        if (inside(p) && dist(p, start) > 26)
          this.foes.push(newFoe('crate', p, this.rng))
      }
    }
    for (let i = 0; i < (script.puddles ?? 0); i++)
      this.foes.push(newFoe('puddle', this.scatterSpot(60, 16), this.rng))
    for (const group of script.groups) {
      const count = groupSize(group, loop)
      if (!group.at) {
        this.place(group.kind, count, group.from)
        continue
      }
      for (let k = 0; k < (group.times ?? 1); k++) {
        this.arrivals.push({
          tick: group.at + k * (group.every ?? 0),
          kind: group.kind,
          count,
          from: group.from,
        })
      }
    }
    const bossAt =
      script.boss === 'twins'
        ? { x: CX, y: CY }
        : script.boss === 'core'
          ? { x: CX, y: CY - 30 }
          : script.boss === 'overgrowth'
            ? { x: CX, y: ARENA.top + 90 }
            : { x: CX, y: ARENA.top + 80 }
    this.boss = script.boss ? newBoss(script.boss, bossAt, this.rng) : null
    if (script.power)
      this.pickups.push({ ...script.power, life: POWER_FLOOR_TICKS * 2 })
    this.placeFamily(script, loop)
    for (const h of this.heroes) h.invuln = 90
    const d = DISTRICTS[this.district]!
    this.waveHit = false
    if (this.mode === 'campaign' && spot.index === 0)
      this.reached = Math.max(this.reached, this.district)
    if (this.mode === 'classic' || this.mode === 'rally100') {
      this.banner = {
        text:
          this.mode === 'classic'
            ? `WAVE ${n}`
            : `RALLY ${n} OF ${RALLY_LENGTH}`,
        sub: script.name,
        ticks: 100,
      }
    } else if (script.reunion) {
      this.banner = { text: 'THE REUNION', sub: script.hint, ticks: 180 }
    } else if (spot.index === 0) {
      this.writeSave()
      this.banner = {
        text: d.name,
        sub:
          loop > 1
            ? `DISTRICT ${this.district + 1}  LOOP ${loop}`
            : `DISTRICT ${this.district + 1}: ${d.tagline}`,
        ticks: CARD_TICKS,
      }
    } else {
      this.banner = {
        text: script.boss
          ? 'BOSS!'
          : `WAVE ${this.district + 1}-${spot.index + 1}`,
        sub: script.name,
        ticks: 110,
      }
    }
  }

  private placeFamily(script: WaveScript, loop: number) {
    const count = script.family.count + Math.min(3, loop - 1)
    const kinds = script.family.kinds ?? KIND_CYCLE
    const shapes = [...(script.pylons ?? []), ...(script.crates ?? [])].filter(
      (p) => p.shape !== 'row' && p.shape !== 'column',
    )
    for (let i = 0; i < count; i++) {
      let p: Point
      switch (script.family.at) {
        case 'center':
          p = {
            x: CX + (this.rng() - 0.5) * 120,
            y: CY + (this.rng() - 0.5) * 80,
          }
          break
        case 'corners':
          p = this.entrySpot('corners', i, count)
          break
        case 'ring': {
          const a = (i / count) * Math.PI * 2
          p = { x: CX + Math.cos(a) * 110, y: CY + Math.sin(a) * 90 }
          break
        }
        case 'beds': {
          // Most hide in the flowerbeds; the rest wander the floor.
          const bed = this.beds[i % Math.max(1, this.beds.length)]
          p =
            bed && i < this.beds.length * 3
              ? {
                  x: bed.x + 8 + this.rng() * (bed.w - 16),
                  y: bed.y + 8 + this.rng() * (bed.h - 16),
                }
              : this.scatterSpot(50, 14)
          break
        }
        case 'shapes': {
          // Half wait inside the shapes (behind the posts), the rest out on the floor.
          const shape = shapes[i % Math.max(1, shapes.length)]
          p =
            shape && i < shapes.length * 2
              ? {
                  x: shape.x + (this.rng() - 0.5) * 12,
                  y: shape.y + (this.rng() - 0.5) * 8,
                }
              : this.scatterSpot(50, 14)
          break
        }
        default:
          p = this.scatterSpot(50, 14)
      }
      clampToArena(p, 12)
      if (!this.clearOfPosts(p, RESCUEE_RADIUS + 2))
        p = this.scatterSpot(50, 14)
      this.family.push({
        id: this.nextId++,
        kind: kinds[i % kinds.length]!,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        turn: 0,
        color: SHIRTS[Math.floor(this.rng() * SHIRTS.length)]!,
        skin: SKINS[Math.floor(this.rng() * SKINS.length)]!,
        state: 'calm',
        clock: 0,
        immune: 0,
        seat: 0,
        slot: 0,
      })
    }
    this.familyTotal = count
    this.familySaved = 0
  }

  // --- saves, the opening card and the Shelter ------------------------------------------

  private writeSave() {
    if (this.demo) return
    if (this.mode !== 'campaign') return this.keepRecords()
    this.savePoint = {
      v: 3,
      district: this.district,
      loop: this.loop,
      score: this.score,
      lives: Math.min(MAX_LIVES, Math.max(1, this.lives)),
      hearts: Math.min(9999, this.hearts),
      friends: Math.min(1_000_000, this.friends),
      upgrades: this.held(),
      bought: { ...this.bought },
      continued: this.continued,
      chips: [...this.chips],
      cleared: this.cleared,
      medals: { ...this.medals },
      times: { ...this.times },
      reached: this.reached,
    }
  }

  /**
   * Everything earned on this device (friends home, golden chips, the clear, medals, Time Attack
   * bests, the furthest district) written to the save at once, without moving its rally's
   * checkpoint, so a quit at any moment keeps it.
   */
  private keepRecords() {
    if (this.demo) return
    const base = this.savePoint ?? {
      v: 3 as const,
      district: 0,
      loop: 1,
      score: 0,
      lives: START_LIVES,
      hearts: 0,
      friends: 0,
      upgrades: { beam: 0, chain: 0, squad: 0 },
      bought: emptyBought(),
      continued: false,
      chips: [],
      cleared: false,
      medals: {},
      times: {},
      reached: 0,
    }
    const chips = [...new Set([...base.chips, ...this.chips])]
    this.savePoint = {
      ...base,
      friends: Math.max(base.friends, Math.min(1_000_000, this.friends)),
      chips,
      cleared: base.cleared || this.cleared,
      medals: { ...this.medals },
      times: { ...this.times },
      reached: Math.max(base.reached, this.reached),
    }
  }

  // --- the menu of modes -------------------------------------------------------------------------

  private openMenu() {
    this.menu = { cursor: 0, district: 0, board: false, ticks: 0 }
    this.banner = null
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    m.ticks++
    if (m.board) {
      if (
        m.ticks > 10 &&
        (input.pressed.a || input.pressed.b || input.pressed.start)
      )
        m.board = false
      return
    }
    if (input.pressed.up) m.cursor = (m.cursor + MENU.length - 1) % MENU.length
    if (input.pressed.down) m.cursor = (m.cursor + 1) % MENU.length
    if (input.pressed.up || input.pressed.down) this.sound.play('blip')
    if (MENU[m.cursor]!.id === 'timeattack') {
      if (input.pressed.left)
        m.district = (m.district + DISTRICTS.length - 1) % DISTRICTS.length
      if (input.pressed.right) m.district = (m.district + 1) % DISTRICTS.length
    }
    if (m.ticks < 8 || (!input.pressed.a && !input.pressed.start)) return
    const id = MENU[m.cursor]!.id
    if (id === 'board') {
      m.board = true
      m.ticks = 0
      return
    }
    if (id === 'timeattack' && m.district > this.reached) {
      this.sound.play('warn')
      return
    }
    this.begin(id, m.district)
  }

  /** Start a mode from the menu (Time Attack in a district). */
  private begin(id: Exclude<MenuId, 'board'>, district = 0) {
    this.menu = null
    this.mode = id
    this.score = 0
    this.attackTicks = 0
    this.sound.play('start')
    if (id === 'timeattack') this.startWave(districtStart(district))
    else {
      this.startWave(1)
      if (id === 'campaign') this.writeSave()
    }
  }

  private updateChoice(input: InputFrame) {
    if (input.pressed.up || input.pressed.down) {
      this.choice = 1 - this.choice
      this.sound.play('blip')
    }
    if (!input.pressed.a && !input.pressed.start) return
    const offer = this.offer!
    this.offer = null
    if (this.choice === 0) {
      this.continued = offer.continued
      this.score = offer.continued ? 0 : offer.score
      this.extras = 0
      while (extraAt(this.extras) <= this.score) this.extras++
      this.nextExtra = extraAt(this.extras)
      this.lives = offer.lives
      this.hearts = offer.hearts
      this.friends = offer.friends
      this.upgrades = { ...offer.upgrades }
      this.chips = new Set(offer.chips)
      this.cleared = offer.cleared
      for (const h of this.heroes) h.squad = offer.upgrades.squad
      this.bought = { ...offer.bought }
      this.startWave(districtStart(offer.district, offer.loop))
    } else {
      // A new rally: the rally's place is reset, the menu picks the mode.
      this.savePoint = {
        ...offer,
        district: 0,
        loop: 1,
        score: 0,
        continued: false,
      }
      this.writeSave()
      this.openMenu()
    }
    this.sound.play('start')
  }

  private openShelter() {
    this.shelter = {
      cursor: 0,
      ticks: 0,
      thanks: THANKS[Math.floor(this.fxRng() * THANKS.length)]!,
    }
    this.banner = null
    this.bolts = []
    this.shots = []
  }

  private updateShelter(input: InputFrame) {
    const s = this.shelter!
    s.ticks++
    if (input.pressed.up) {
      s.cursor = (s.cursor + SHELTER_ITEMS.length - 1) % SHELTER_ITEMS.length
      this.sound.play('blip')
    }
    if (input.pressed.down) {
      s.cursor = (s.cursor + 1) % SHELTER_ITEMS.length
      this.sound.play('blip')
    }
    const leave = () => {
      this.shelter = null
      this.startWave(this.level + 1)
    }
    if (s.ticks > SHELTER_TICKS) return leave()
    if (!input.pressed.a || s.ticks < 20) return
    const item = SHELTER_ITEMS[s.cursor]!
    if (item.id === 'leave') return leave()
    if (!canBuy(item, this.shop())) {
      this.sound.play('warn')
      return
    }
    this.hearts -= item.cost(this.bought[item.id])
    this.bought[item.id]++
    switch (item.id) {
      case 'hero':
        this.lives = Math.min(MAX_LIVES, this.lives + 1)
        break
      case 'squad':
        for (const h of this.heroes) h.squad = Math.min(SQUAD_MAX, h.squad + 1)
        break
      case 'beam':
        this.upgrades.beam++
        break
      case 'chain':
        this.upgrades.chain++
        break
      case 'hint':
        this.hintFor = waveAt(this.level + 1).district
        break
    }
    this.sound.play('extra')
  }

  /** What the Shelter's prices and caps are checked against. */
  private shop() {
    return {
      hearts: this.hearts,
      bought: this.bought,
      held: this.held(),
      hinted: this.hintFor === waveAt(this.level + 1).district,
    }
  }

  /** Upgrades held, with the squad bots the hero has right now. */
  private held(): Upgrades {
    return { ...this.upgrades, squad: this.heroes[0]!.squad }
  }

  // --- update ----------------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.offer) {
      this.updateChoice(controls)
      return
    }
    if (this.menu) {
      this.updateMenu(controls)
      return
    }
    if (this.result) {
      if (--this.result.ticks <= 0) this.over = true
      return
    }
    if (this.shelter) {
      this.updateShelter(controls)
      return
    }
    if (this.ending) {
      this.updateEnding(controls)
      return
    }
    if (this.lives <= 0 && !this.heroes.some((h) => h.alive)) {
      if (++this.overTimer > 100) this.gameOver()
      return
    }
    if (this.waveDelay > 0) {
      if (this.mode === 'timeattack') this.attackTicks++
      if (--this.waveDelay === 0) this.nextWave()
      return
    }

    this.heroes.forEach((h, i) =>
      this.stepHero(h, i === 0 ? controls : (players?.[i] ?? emptyInput())),
    )
    this.waveTick++
    if (this.mode === 'timeattack') this.attackTicks++
    // Walkers hurry as a wave drags on, and every loop round the city starts them faster.
    // (Classic Rally keeps the original's steady pace.)
    this.foeWorld.rush =
      this.mode === 'classic'
        ? 1
        : (1 + (RUSH_MAX - 1) * Math.min(1, this.waveTick / RUSH_TICKS)) *
          (1 + LOOP_RUSH * (this.loop - 1))
    this.arrive()
    if (this.freeze > 0) this.freeze--
    else {
      const before = this.sprinklers.length
        ? this.foes.map((f) => ({ x: f.x, y: f.y }))
        : null
      for (let i = 0; i < this.foes.length; i++)
        stepFoe(this.foes[i]!, this.foeWorld)
      if (before) {
        // In the sprinklers' spray everyone wades.
        before.forEach((p, i) => {
          const f = this.foes[i]
          if (f && this.sprinklers.some((sp) => dist(f, sp) < sp.r))
            Object.assign(f, {
              x: p.x + (f.x - p.x) * SPRINKLER_SLOW,
              y: p.y + (f.y - p.y) * SPRINKLER_SLOW,
            })
        })
      }
      if (this.boss) this.stepTheBoss(this.boss)
    }
    this.carry()
    this.stepFloors()
    this.moveFamily()
    this.moveShots()
    this.squadsFire()
    this.collide()
    if (this.chainClock > 0 && --this.chainClock === 0) this.chain = 0

    // A safety net: a wave that drags on this long fades out (the glitch gives up).
    if (this.waveTick === FADE_TICKS && !this.boss && !this.script.reunion)
      this.fadeWave()
    if (this.boss?.kind === 'core')
      this.boss.guard = this.family.some((r) => r.state === 'glitched')
    const busy =
      (this.script.reunion === true && this.family.length > 0) ||
      this.arrivals.length > 0 ||
      this.boss !== null ||
      this.foes.some((f) => FOES[f.kind].hostile) ||
      this.family.some((r) => r.state === 'glitched')
    if (!busy && this.waveDelay === 0) this.clearWave()
  }

  private gameOver() {
    this.over = true
    if (this.mode !== 'campaign') return this.keepRecords()
    // The rally stays saved at this district's start, its score back to zero.
    if (this.savePoint) {
      this.savePoint = {
        ...this.savePoint,
        score: 0,
        lives: START_LIVES,
        continued: true,
      }
    }
  }

  private stepTheBoss(b: Boss) {
    stepBoss(b, this.bossWorld)
    if (b.down === 1) {
      this.boss = null
      return
    }
    if (b.down) return
    // The Big Wind-Up's shockwaves knock the family dizzy; the bosses crush what they walk into.
    for (const r of this.family) {
      if ((r.state === 'calm' || r.state === 'parade') && shockAt(b, r))
        this.bonk(r, b)
    }
    for (let i = this.foes.length - 1; i >= 0; i--) {
      const f = this.foes[i]!
      if ((f.kind === 'crate' || f.kind === 'pylon') && bossHarms(b, f, 4)) {
        this.foes.splice(i, 1)
        this.burst(f.x, f.y, 8, [RAMPS.earth[3], RAMPS.gold[3]])
      }
    }
  }

  private clearWave() {
    // Anyone still in a parade walks home with the hero, at the plain bonus.
    for (const h of this.heroes) {
      for (const r of this.parade(h.seat)) this.collect(r, 1)
    }
    this.waveDelay = 120
    this.sound.play('level')
    const all = this.familySaved >= this.familyTotal
    if (all) this.hearts += HEARTS_EVERYONE_HOME
    const won = this.awardMedals(all)
    const id = DISTRICTS[this.district]!.id
    if (
      this.mode === 'campaign' &&
      this.script.signature &&
      all &&
      !this.chips.has(id)
    ) {
      // The district's golden chip, for getting everyone in its signature wave home.
      this.chips.add(id)
      this.keepRecords()
      this.addScore(10_000, CX, CY - 50, RAMPS.gold[4])
      this.banner = {
        text: 'GOLDEN CHIP!',
        sub: `${this.chips.size} OF ${DISTRICTS.length} FOUND`,
        ticks: 150,
      }
      this.sound.play('extra')
      return
    }
    this.banner = {
      text: this.script.boss ? 'DISTRICT CLEAR!' : 'WAVE CLEAR!',
      sub: won.length
        ? won.length === MEDALS.length
          ? 'ALL THREE MEDALS!'
          : won.join(' + ')
        : all
          ? 'EVERYONE HOME!'
          : `SAVED ${this.familySaved} OF ${this.familyTotal}`,
      ticks: 120,
    }
  }

  /** A district wave's medals: Everyone Home, Untouched and Full Squad. Returns the names won. */
  private awardMedals(all: boolean): string[] {
    if (this.mode !== 'campaign' && this.mode !== 'timeattack') return []
    if (this.script.reunion) return []
    const bits =
      (all ? 1 : 0) |
      (this.waveHit ? 0 : 2) |
      (this.heroes.some((h) => h.squad >= SQUAD_MAX) ? 4 : 0)
    if (!bits) return []
    const key = medalKey(this.district, this.index)
    const had = this.medals[key] ?? 0
    this.medals = { ...this.medals, [key]: had | bits }
    if ((had | bits) !== had) this.keepRecords()
    return MEDALS.filter((m) => bits & m.bit).map((m) => m.name)
  }

  /** The glitch gives up on a wave that has dragged on: every helper reboots by itself, unpaid. */
  private fadeWave() {
    for (const f of this.foes) {
      if (FOES[f.kind].hostile) this.freed.push({ x: f.x, y: f.y, life: 60 })
    }
    this.foes = this.foes.filter((f) => !FOES[f.kind].hostile)
    this.arrivals = []
    for (const r of this.family) {
      if (r.state === 'glitched') {
        r.state = 'calm'
        r.immune = 180
      }
    }
    this.banner = { text: 'THE GLITCH FADES', ticks: 90 }
  }

  /** After a wave: the next one, the Shelter after a district, or the endings after the last. */
  private nextWave() {
    if (this.mode === 'classic') return this.startWave(this.level + 1)
    if (this.mode === 'rally100') {
      if (this.level < RALLY_LENGTH) return this.startWave(this.level + 1)
      this.addScore(RALLY_BONUS, CX, CY, RAMPS.gold[4])
      return this.finish('RALLY 100 COMPLETE!', `${this.score} POINTS`)
    }
    if (this.mode === 'timeattack' && this.index === WAVES_PER_DISTRICT - 1) {
      const id = DISTRICTS[this.district]!.id
      const best = this.times[id]
      const fresh = !best || this.attackTicks < best
      if (fresh) this.times = { ...this.times, [id]: this.attackTicks }
      this.keepRecords()
      return this.finish(
        fresh ? 'NEW BEST TIME!' : 'DISTRICT CLEAR!',
        `${clock(this.attackTicks)}   BEST ${clock(fresh ? this.attackTicks : best!)}`,
      )
    }
    if (this.mode === 'timeattack') return this.startWave(this.level + 1)
    if (this.script.reunion) return this.startEnding(true)
    if (this.index === WAVES_PER_DISTRICT - 1) {
      if (this.district === DISTRICTS.length - 1) {
        // The Glitch Core is beaten. With every golden chip, the Reunion first.
        if (this.chips.size >= DISTRICTS.length) {
          this.setupWave(REUNION, this.loop)
          return
        }
        return this.startEnding(false)
      }
      return this.openShelter()
    }
    this.startWave(this.level + 1)
  }

  /** A mode's last card, then the game ends. */
  private finish(text: string, sub: string) {
    this.result = { text, sub, ticks: RESULT_TICKS }
    this.banner = null
    this.foes = []
    this.bolts = []
    this.sound.play('extra')
  }

  private startEnding(trueEnding: boolean) {
    this.ending = { t: 0, trueEnding }
    // The city is cleared the moment the Core reboots, credits watched or not.
    this.cleared = true
    this.keepRecords()
    this.banner = null
    this.foes = []
    this.bolts = []
    this.shots = []
    this.addScore(trueEnding ? 250_000 : 100_000, CX, CY, RAMPS.gold[4])
    this.sound.play('extra')
  }

  private updateEnding(input: InputFrame) {
    const e = this.ending!
    e.t++
    const skip = e.t > SKIP_AFTER && (input.pressed.a || input.pressed.start)
    if (e.t < endingTicks(e.trueEnding) && !skip) return
    // The city is cleared; the rally goes on, round the city again and harder.
    this.ending = null
    this.cleared = true
    this.startWave(this.level + 1)
  }

  private arrive() {
    for (const a of this.arrivals) {
      if (this.waveTick === a.tick - VENT_TELL) this.sound.play('warn')
      if (this.waveTick >= a.tick) this.place(a.kind, a.count, a.from)
    }
    this.arrivals = this.arrivals.filter((a) => this.waveTick < a.tick)
    // Partway in, a power-up comes through a vent.
    if (this.mode === 'classic') this.ventPower = true
    if (!this.ventPower && this.waveTick >= VENT_POWER_AT) {
      this.ventPower = true
      const v = VENTS[Math.floor(this.rng() * VENTS.length)]!
      const p = { x: v.x, y: v.y }
      clampToArena(p, 20)
      this.pickups.push({
        kind: powerFromRoll(this.rng()),
        x: p.x + (CX - p.x) * 0.15,
        y: p.y + (CY - p.y) * 0.15,
        life: POWER_FLOOR_TICKS,
      })
    }
  }

  private stepHero(h: Hero, input: InputFrame) {
    const running: Partial<Record<PowerKind, number>> = {}
    for (const kind of POWER_KINDS) {
      const left = (h.powers[kind] ?? 0) - 1
      if (left > 0) running[kind] = left
    }
    h.powers = running
    if (!h.alive) {
      const partner = this.heroes.some(
        (o) => o !== h && o.alive && dist(o, h) < REVIVE_REACH,
      )
      h.reviving = partner ? h.reviving + 1 : Math.max(0, h.reviving - 2)
      if (partner && h.reviving >= REVIVE_TICKS) {
        // Picked up by a partner, right where they fell.
        h.alive = true
        h.invuln = 120
        h.reviving = 0
        this.rings.push({ x: h.x, y: h.y, life: 24, color: RAMPS.leaf[3] })
        this.floaters.push({
          x: h.x,
          y: h.y - 22,
          text: 'BACK UP!',
          life: 50,
          color: RAMPS.leaf[3],
        })
        this.sound.play('pickup')
      } else if (this.lives > 0 && --h.respawn <= 0) this.revive(h)
      return
    }
    const stick =
      input.aim && Math.hypot(input.aim.x, input.aim.y) >= AIM_MIN
        ? input.aim
        : null
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    const fromX = h.x
    const fromY = h.y
    const wading = this.sprinklers.some((sp) => dist(h, sp) < sp.r)
    const speed =
      PLAYER_SPEED * (h.powers.sprint ? 1.4 : 1) * (wading ? SPRINKLER_SLOW : 1)
    if (dx || dy) {
      const len = Math.hypot(dx, dy)
      h.x += (dx / len) * speed
      h.y += (dy / len) * speed
      h.walk += 0.3
      // Moving aims, unless B holds the aim (strafe) or a second stick is aiming.
      if (!input.held.b && !stick) {
        h.aimX = dx / len
        h.aimY = dy / len
      }
    }
    clampToArena(h, HERO_RADIUS)
    this.pushOffCrates(h, HERO_RADIUS)
    for (const v of this.vines) pushOutOfRect(h, HERO_RADIUS, v)
    h.vx = h.x - fromX
    h.vy = h.y - fromY
    if (h.vx || h.vy) {
      h.trail.push({ x: h.x, y: h.y })
      if (h.trail.length > TRAIL) h.trail.shift()
    }
    h.history.push({ x: h.x, y: h.y })
    if (h.history.length > 150) h.history.shift()
    h.aiming = stick !== null
    if (stick) {
      const len = Math.hypot(stick.x, stick.y)
      h.aimX = stick.x / len
      h.aimY = stick.y / len
    }
    h.gathering = input.held.b
    if (h.fireCooldown > 0) h.fireCooldown--
    if ((input.held.a || h.aiming) && h.fireCooldown === 0) this.fire(h)
    if (h.invuln > 0) h.invuln--
  }

  private fire(h: Hero) {
    const rapid = !!h.powers.rapid
    const spread = !!h.powers.spread
    const wide = !!h.powers.wide
    const cap = (rapid ? MAX_SHOTS * 2 : MAX_SHOTS) * (spread ? 3 : 1)
    const mine = this.shots.reduce(
      (n, s) => n + (s.seat === h.seat && !s.squad ? 1 : 0),
      0,
    )
    if (mine >= cap) return
    const base = Math.atan2(h.aimY, h.aimX)
    for (const turn of spread ? [-0.2, 0, 0.2] : [0]) {
      const a = base + turn
      this.shots.push({
        x: h.x + Math.cos(a) * 10,
        y: h.y - 4 + Math.sin(a) * 10,
        vx: Math.cos(a) * SHOT_SPEED,
        vy: Math.sin(a) * SHOT_SPEED,
        life: SHOT_LIFE,
        seat: h.seat,
        r: 2 + this.upgrades.beam * BEAM_STEP + (wide ? 4 : 0),
        bounce: h.powers.bounce ? 1 : 0,
        pierce: wide,
        hits: [],
        squad: false,
      })
    }
    h.fireCooldown = rapid ? FIRE_COOLDOWN / 2 : FIRE_COOLDOWN
    this.sound.play('shoot')
  }

  /** Each squad bot fires a sparkle a second at whatever is nearest. */
  private squadsFire() {
    for (const h of this.heroes) {
      if (!h.alive) continue
      for (let i = 0; i < h.squad; i++) {
        if ((this.tick + i * 20) % SQUAD_EVERY !== 0) continue
        const bot = this.squadSpot(h, i)
        const target = this.nearestTarget(bot, SQUAD_REACH)
        if (!target) continue
        const u = toward(bot, target)
        this.shots.push({
          x: bot.x,
          y: bot.y,
          vx: u.x * 5,
          vy: u.y * 5,
          life: 50,
          seat: h.seat,
          r: 2,
          bounce: 0,
          pierce: false,
          hits: [],
          squad: true,
        })
      }
    }
  }

  private squadSpot(h: Hero, i: number): Point {
    const a = this.tick / 30 + (i * Math.PI * 2) / Math.max(1, h.squad)
    return { x: h.x + Math.cos(a) * 22, y: h.y - 4 + Math.sin(a) * 16 }
  }

  /** The nearest thing worth beaming: a hostile foe, a glitched friend or a boss's soft spot. */
  private nearestTarget(from: Point, reach: number): Point | null {
    let best: Point | null = null
    let bestD = reach
    const consider = (p: Point) => {
      const d = dist(p, from)
      if (d < bestD) {
        best = p
        bestD = d
      }
    }
    for (const f of this.foes) if (FOES[f.kind].hostile) consider(f)
    for (const r of this.family) if (r.state === 'glitched') consider(r)
    if (this.boss)
      for (const t of bossTargets(this.boss)) if (t.hurts) consider(t)
    return best
  }

  /** Districts 3-5's floors: magnets and wind, teleport pads, laser gates, lightning, kite drops. */
  private stepFloors() {
    this.wind = windAt(this.waveTick, this.storm)
    const pad = (o: Point, key: object) => {
      if (!this.pads.length || this.waveTick < (this.padClock.get(key) ?? 0))
        return false
      const to = padExit(o, this.pads)
      if (!to) return false
      o.x = to.x
      o.y = to.y
      this.padClock.set(key, this.waveTick + PAD_COOLDOWN)
      return true
    }
    for (const h of this.heroes) {
      if (!h.alive) continue
      for (const m of this.magnetFloors) {
        if (inRect(h, m))
          h.y += Math.sign(m.y + m.h / 2 - h.y) * MAGNET_FLOOR_PULL
      }
      for (const f of this.foes) {
        if (f.kind === 'magnet' && f.mode === 2 && dist(f, h) < 180) {
          const u = toward(h, f)
          h.x += u.x * 0.8
          h.y += u.y * 0.8
        }
      }
      h.x += this.wind.x
      h.y += this.wind.y
      if (pad(h, h)) {
        h.trail = []
        this.rings.push({ x: h.x, y: h.y, life: 24, color: RAMPS.pink[3] })
        this.sound.play('blip')
      }
      for (const v of this.vines) pushOutOfRect(h, HERO_RADIUS, v)
      clampToArena(h, HERO_RADIUS)
      const zapped = this.gates.some(
        (g) =>
          gateState(g, this.waveTick) === 'on' &&
          segmentDistance(h, g.x0, g.y0, g.x1, g.y1) <
            GATE_REACH + HERO_RADIUS - 3,
      )
      if (zapped && h.invuln === 0) this.hurtHero(h)
    }
    for (const r of this.family) {
      if (r.state === 'parade') continue
      if (this.wind.x || this.wind.y) {
        r.x += this.wind.x * 0.8
        r.y += this.wind.y * 0.8
        // A low roof edge: blown right to it, they cling on, dizzy, and head home.
        if (r.state === 'calm' && nearWall(r, 10))
          this.bonk(r, { x: CX, y: CY })
      }
      if (r.state === 'calm' || r.state === 'glitched') pad(r, r)
      if (r.state !== 'dizzy') clampToArena(r, RESCUEE_RADIUS)
    }
    if (this.freeze === 0) {
      for (const f of this.foes) {
        const kite = f.kind === 'kite'
        if (!WALKS(f.kind) && !kite) continue
        f.x += this.wind.x * (kite ? 1.5 : 0.5)
        f.y += this.wind.y * (kite ? 1.5 : 0.5)
        if (kite) continue
        for (const m of this.magnetFloors) {
          if (inRect(f, m))
            f.y += Math.sign(m.y + m.h / 2 - f.y) * MAGNET_FLOOR_PULL
        }
        pad(f, f)
        clampToArena(f, FOES[f.kind].radius)
      }
    }
    // Magnets bend the beam.
    for (const s of this.shots) {
      let bent = false
      for (const m of this.magnetFloors) {
        if (inRect(s, m)) {
          s.vy += Math.sign(m.y + m.h / 2 - s.y) * 0.3
          bent = true
        }
      }
      for (const f of this.foes) {
        if (f.kind === 'magnet' && f.mode === 2 && dist(f, s) < 120) {
          const u = toward(s, f)
          s.vx += u.x * 0.35
          s.vy += u.y * 0.35
          bent = true
        }
      }
      if (bent) {
        const len = Math.hypot(s.vx, s.vy) || 1
        s.vx = (s.vx / len) * SHOT_SPEED
        s.vy = (s.vy / len) * SHOT_SPEED
      }
    }
    // Lightning: a ring glows where it will strike, near the hero, then it strikes.
    const every = this.storm?.lightningEvery ?? 0
    if (every && this.waveTick > 60 && this.waveTick % every === 0) {
      const h = this.heroes.find((o) => o.alive)
      if (h) {
        const p = {
          x: h.x + h.vx * 30 + (this.rng() - 0.5) * 50,
          y: h.y + h.vy * 30 + (this.rng() - 0.5) * 50,
        }
        clampToArena(p, 20)
        this.strikes.push({ ...p, clock: LIGHTNING_TELL })
        this.sound.play('warn')
      }
    }
    for (const st of this.strikes) {
      if (--st.clock !== 0) continue
      this.sound.play('boom')
      for (const h of this.heroes) {
        if (
          h.alive &&
          h.invuln === 0 &&
          dist(h, st) < LIGHTNING_RADIUS + HERO_RADIUS - 4
        )
          this.hurtHero(h)
      }
      for (const r of this.family) {
        if (
          (r.state === 'calm' || r.state === 'parade') &&
          dist(r, st) < LIGHTNING_RADIUS
        )
          this.bonk(r, st)
      }
      // Glitched helpers under it are rebooted by the jolt (no points for the weather).
      for (const f of this.foes) {
        if (FOES[f.kind].hostile && dist(f, st) < LIGHTNING_RADIUS)
          this.freed.push({ x: f.x, y: f.y, life: 60 })
      }
      this.foes = this.foes.filter(
        (f) => !(FOES[f.kind].hostile && dist(f, st) < LIGHTNING_RADIUS),
      )
    }
    this.strikes = this.strikes.filter((st) => st.clock > -8)
    // Kite drones' pylons land where their shadows were.
    for (const d of this.drops) {
      if (--d.clock > 0) continue
      if (this.foes.filter((f) => f.kind === 'pylon').length < 40)
        this.foes.push(newFoe('pylon', d, this.rng))
    }
    this.drops = this.drops.filter((d) => d.clock > 0)
  }

  /** Conveyor strips carry whoever stands on them. */
  private carry() {
    if (!this.belts.length) return
    const ride = (o: Point) => {
      for (const c of this.belts) {
        if (o.x < c.x || o.x > c.x + c.w || o.y < c.y || o.y > c.y + c.h)
          continue
        const step = conveyorStep(c)
        o.x += step.x * CONVEYOR_SPEED
        o.y += step.y * CONVEYOR_SPEED
        return
      }
    }
    for (const h of this.heroes) {
      if (!h.alive) continue
      ride(h)
      clampToArena(h, HERO_RADIUS)
    }
    for (const r of this.family) if (r.state !== 'parade') ride(r)
    if (this.freeze > 0) return
    for (const f of this.foes) if (WALKS(f.kind)) ride(f)
  }

  /** Crates are boxes: the hero, the family and the walkers are pushed back off them. */
  private pushOffCrates(o: Point, r: number) {
    for (const f of this.foes) {
      if (f.kind !== 'crate') continue
      const reach = r + FOES.crate.radius
      const d = dist(o, f)
      if (d >= reach) continue
      const u = d > 0.01 ? toward(f, o) : { x: 0, y: 1 }
      o.x = f.x + u.x * reach
      o.y = f.y + u.y * reach
    }
  }

  private moveFamily() {
    const home: Rescuee[] = []
    for (const r of this.family) {
      const was = { x: r.x, y: r.y }
      if (stepRescuee(r, this.familyWorld)) home.push(r)
      if (this.sprinklers.some((sp) => dist(r, sp) < sp.r)) {
        r.x = was.x + (r.x - was.x) * SPRINKLER_SLOW
        r.y = was.y + (r.y - was.y) * SPRINKLER_SLOW
      }
      if (r.state !== 'glitched')
        for (const v of this.vines) pushOutOfRect(r, RESCUEE_RADIUS, v)
      // The magnet calls the waiting family to its hero.
      if (r.state === 'calm') {
        const h = this.nearestHero(r)
        if (h && h.powers.magnet && dist(h, r) < 220) {
          const u = toward(r, h)
          r.x += u.x * 1.1
          r.y += u.y * 1.1
        }
      }
    }
    for (const r of home) {
      // A dizzy one wandered off: home safe, but no bonus this wave.
      this.family.splice(this.family.indexOf(r), 1)
      this.floaters.push({
        x: r.x,
        y: Math.max(ARENA.top + 12, r.y - 10),
        text: 'HOME SAFE',
        life: 45,
        color: RAMPS.sky[3],
      })
    }
    if (this.freeze > 0) return
    for (const f of this.foes) {
      if (WALKS(f.kind) && f.kind !== 'stomper')
        this.pushOffCrates(f, FOES[f.kind].radius)
    }
    // Stompers trample crates flat.
    for (const f of this.foes) {
      if (f.kind !== 'stomper') continue
      for (let i = this.foes.length - 1; i >= 0; i--) {
        const c = this.foes[i]!
        if (c.kind === 'crate' && dist(c, f) < FOES.stomper.radius + 6) {
          this.foes.splice(i, 1)
          this.burst(c.x, c.y, 8, [RAMPS.earth[3], RAMPS.gold[3]])
          this.sound.play('pop')
        }
      }
    }
  }

  private moveShots() {
    const out = (o: Point) =>
      o.x < ARENA.left ||
      o.x > ARENA.right ||
      o.y < ARENA.top ||
      o.y > ARENA.bottom
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (this.vines.some((v) => inRect(s, v))) {
        s.life = 0
        continue
      }
      if (!out(s)) continue
      if (s.bounce > 0) {
        // The Bounce power: off the wall once.
        s.bounce--
        if (s.x < ARENA.left || s.x > ARENA.right) s.vx *= -1
        if (s.y < ARENA.top || s.y > ARENA.bottom) s.vy *= -1
        clampToArena(s, 1)
      } else s.life = 0
    }
    this.shots = this.shots.filter((s) => s.life > 0)
    if (this.freeze > 0) return
    for (const b of this.bolts) {
      b.x += b.vx
      b.y += b.vy
      b.life--
      if (out(b)) {
        if (b.bounces > 0) {
          // A thornball's shell rebounds off the wall.
          b.bounces--
          if (b.x < ARENA.left || b.x > ARENA.right) b.vx *= -1
          if (b.y < ARENA.top || b.y > ARENA.bottom) b.vy *= -1
          clampToArena(b, 1)
        } else b.life = 0
      }
      if (this.vines.some((v) => inRect(b, v))) b.life = 0
    }
    this.bolts = this.bolts.filter((b) => b.life > 0)
  }

  private collide() {
    for (const s of this.shots) {
      // A beam meets a spark: both fizzle.
      const bolt = this.bolts.find((b) => dist(b, s) < BOLT_RADIUS + s.r + 2)
      if (bolt) {
        bolt.life = 0
        s.life = 0
        this.burst(s.x, s.y, 5, [RAMPS.gold[4], '#ffffff'])
        continue
      }
      // A glitched friend in the way is rebooted, never harmed.
      const friend = this.family.find(
        (r) =>
          r.state === 'glitched' && dist(r, { x: s.x, y: s.y + 4 }) < 7 + s.r,
      )
      if (friend) {
        s.life = 0
        this.reboot(friend)
        continue
      }
      if (this.boss && shieldBlocks(this.boss, s)) {
        // The Glitch Core's shields: only a beam through every gap gets in.
        s.life = 0
        this.burst(s.x, s.y, 3, [RAMPS.purple[3], RAMPS.teal[3]])
        continue
      }
      if (this.boss && this.hitBoss(this.boss, s)) continue
      const hit = this.foes.findIndex(
        (f) => !s.hits.includes(f) && dist(s, f) < FOES[f.kind].radius + s.r,
      )
      if (hit < 0) continue
      const foe = this.foes[hit]!
      if (s.pierce && foe.kind !== 'crate' && foe.kind !== 'pylon')
        s.hits.push(foe)
      else s.life = 0
      this.hitFoe(hit, s)
    }
    this.shots = this.shots.filter((s) => s.life > 0)
    // Crates are cover: sparks and confetti stop at them.
    for (const b of this.bolts) {
      if (
        this.foes.some(
          (f) => f.kind === 'crate' && dist(f, b) < FOES.crate.radius + 2,
        )
      )
        b.life = 0
    }
    this.bolts = this.bolts.filter((b) => b.life > 0)

    for (const h of this.heroes) {
      if (!h.alive) continue
      this.touchFamily(h)
      this.touchBeacon(h)
      this.touchPickups(h)
      if (h.invuln > 0) continue
      const touched =
        this.foes.some(
          (f) =>
            !FOES[f.kind].harmless &&
            dist(f, h) < FOES[f.kind].radius + HERO_RADIUS - 2,
        ) ||
        this.family.some(
          (r) =>
            r.state === 'glitched' &&
            dist(r, h) < RESCUEE_RADIUS + HERO_RADIUS - 2,
        ) ||
        this.bolts.some((b) => dist(b, h) < BOLT_RADIUS + HERO_RADIUS - 2) ||
        (this.boss !== null && bossHarms(this.boss, h, HERO_RADIUS - 2))
      if (touched) this.hurtHero(h)
    }
  }

  /** A beam at the boss: true when it hit something (a soft spot or plain armour). */
  private hitBoss(b: Boss, s: Shot): boolean {
    for (const t of bossTargets(b)) {
      if (dist(s, t) >= t.r + s.r) continue
      s.life = 0
      if (!t.hurts) {
        this.burst(s.x, s.y, 3, [RAMPS.steel[4], RAMPS.gold[3]])
        this.sound.play('blip')
        return true
      }
      const result = hurtBoss(b, t.id)
      this.burst(s.x, s.y, 4, [RAMPS.gold[4], '#ffffff'])
      if (result === 'hit') {
        this.sound.play('blip')
      } else if (result === 'phase') {
        this.sound.play('boom')
        this.rings.push({ x: b.x, y: b.y - 16, life: 24, color: RAMPS.gold[3] })
        this.addScore(2000, b.x, b.y - 40, RAMPS.gold[4])
      } else {
        this.bossDown(b)
      }
      return true
    }
    return false
  }

  private bossDown(b: Boss) {
    const spec = BOSSES[b.kind]
    this.addScore(spec.points, b.x, b.y - 50, RAMPS.gold[4])
    this.hearts += HEARTS_PER_BOSS
    this.sound.play('extra')
    // Every foe in the arena reboots with it.
    for (const f of this.foes) {
      if (!FOES[f.kind].hostile) continue
      this.freed.push({ x: f.x, y: f.y, life: 60 })
    }
    this.foes = this.foes.filter((f) => !FOES[f.kind].hostile)
    this.bolts = []
    for (const r of this.family) if (r.state === 'glitched') this.reboot(r)
    this.banner = {
      text:
        b.kind === 'windup'
          ? 'WOUND DOWN!'
          : b.kind === 'jack'
            ? 'BACK IN THE BOX!'
            : b.kind === 'overgrowth'
              ? 'IN FULL BLOOM!'
              : b.kind === 'twins'
                ? 'LINKED AS FRIENDS!'
                : 'THE CORE REBOOTS!',
      sub: `${spec.name} REBOOTS AS A FRIEND`,
      ticks: 140,
    }
    this.fx.burst(b.x, b.y - 20, this.fxRng, { count: 30, speed: 2.4 })
  }

  private hitFoe(index: number, s: Shot) {
    const foe = this.foes[index]!
    const spec = FOES[foe.kind]
    if (spec.shove) {
      const len = Math.hypot(s.vx, s.vy) || 1
      foe.pushX += (s.vx / len) * spec.shove
      foe.pushY += (s.vy / len) * spec.shove
    }
    if (foe.kind === 'shieldbot') {
      // Its shield turns a beam from the front: flank it.
      const from = Math.atan2(-s.vy, -s.vx)
      const off = Math.atan2(
        Math.sin(from - foe.face),
        Math.cos(from - foe.face),
      )
      if (Math.abs(off) < SHIELD_ARC && foe.mode === 0) {
        this.burst(s.x, s.y, 3, [RAMPS.gold[4], RAMPS.gold[3]])
        this.sound.play('blip')
        if (++foe.clock >= SHIELD_KNOCKS) {
          foe.mode = 1
          foe.clock = SHIELD_RATTLE
          this.floaters.push({
            x: foe.x,
            y: foe.y - 18,
            text: 'RATTLED!',
            life: 40,
            color: RAMPS.gold[3],
          })
        }
        return
      }
    }
    if (spec.hp === 0) {
      // Nothing reboots a stomper: the beam only shoves it.
      this.burst(s.x, s.y, 3, [RAMPS.steel[4], RAMPS.gold[3]])
      this.sound.play('blip')
      return
    }
    if (--foe.hp > 0) {
      this.sound.play('blip')
      return
    }
    this.foes.splice(index, 1)
    this.addScore(spec.points, foe.x, foe.y, '#fde68a')
    const colours =
      foe.kind === 'puddle'
        ? ['#a3e635', '#4d7c0f']
        : foe.kind === 'pylon'
          ? [RAMPS.teal[3], RAMPS.pink[3], '#ffffff']
          : foe.kind === 'crate'
            ? [RAMPS.earth[3], RAMPS.gold[3], RAMPS.earth[2]]
            : foe.kind === 'hypno'
              ? [GLITCH[3], GLITCH[4], RAMPS.leaf[3]]
              : ['#a78bfa', '#86efac', '#e0e7ff']
    this.burst(foe.x, foe.y, foe.kind === 'drone' ? 8 : 16, colours)
    if (
      foe.kind === 'drone' ||
      foe.kind === 'tank' ||
      foe.kind === 'hypno' ||
      foe.kind === 'sparker'
    ) {
      this.freed.push({ x: foe.x, y: foe.y, life: 60 })
      this.fx.burst(foe.x, foe.y, this.fxRng, {
        count: 6,
        speed: 1.2,
        colours: [RAMPS.leaf[3], RAMPS.teal[3], RAMPS.gold[4]],
      })
    }
    if (CHAINS(foe.kind) && this.mode !== 'classic') this.chainUp(foe)
    if (foe.kind === 'splitter') {
      // It splits into four drones.
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4
        const p = { x: foe.x + Math.cos(a) * 12, y: foe.y + Math.sin(a) * 12 }
        clampToArena(p, 10)
        if (this.foes.length < MAX_FOES)
          this.foes.push(newFoe('drone', p, this.rng))
      }
    }
    // Crates and heavies leave a power-up behind now and then.
    const drop =
      this.mode === 'classic'
        ? 0
        : foe.kind === 'crate'
          ? CRATE_DROP
          : HEAVY(foe.kind)
            ? HEAVY_DROP
            : 0
    if (drop && this.rng() < drop) {
      this.pickups.push({
        kind: powerFromRoll(this.rng()),
        x: foe.x,
        y: foe.y,
        life: POWER_FLOOR_TICKS,
      })
    }
    this.sound.play(
      foe.kind === 'spawner' || foe.kind === 'hypno' ? 'boom' : 'pop',
    )
  }

  /** One more reboot in the chain: fifteen inside one window free a squad bot. */
  private chainUp(at: Point) {
    // The window opens on the first reboot of a chain and doesn't stretch.
    if (this.chain === 0)
      this.chainClock = CHAIN_WINDOW + this.upgrades.chain * CHAIN_STEP
    this.chain++
    if (this.chain < SQUAD_CHAIN) return
    this.chainClock = 0
    this.chain = 0
    const h = this.nearestHero(at) ?? this.heroes[0]!
    if (h.squad < SQUAD_MAX) {
      h.squad++
      this.floaters.push({
        x: h.x,
        y: h.y - 24,
        text: 'SQUAD BOT!',
        life: 60,
        color: RAMPS.leaf[3],
      })
      this.rings.push({ x: h.x, y: h.y, life: 24, color: RAMPS.leaf[3] })
      this.sound.play('extra')
    } else {
      this.addScore(SQUAD_FULL_BONUS, h.x, h.y - 24, RAMPS.leaf[4])
    }
  }

  private touchPickups(h: Hero) {
    for (const p of this.pickups) {
      if (p.life <= 0 || dist(p, h) > HERO_RADIUS + 8) continue
      p.life = 0
      const spec = POWERS[p.kind]
      if (p.kind === 'pause') this.freeze = spec.ticks
      else h.powers[p.kind] = spec.ticks
      this.floaters.push({
        x: p.x,
        y: p.y - 14,
        text: `${spec.name}!`,
        life: 50,
        color: spec.ramp[3],
      })
      this.rings.push({ x: p.x, y: p.y, life: 24, color: spec.ramp[3] })
      this.sound.play('pickup')
    }
    for (const p of this.pickups) p.life--
    this.pickups = this.pickups.filter((p) => p.life > 0)
  }

  private touchFamily(h: Hero) {
    for (const r of [...this.family]) {
      if (dist(r, h) >= HERO_RADIUS + RESCUEE_RADIUS) continue
      if (r.state === 'calm') {
        const parade = this.parade(h.seat)
        if (h.gathering && this.beacon && parade.length < PARADE_MAX) {
          r.state = 'parade'
          r.seat = h.seat
          r.slot = parade.length
          if (!parade.length)
            this.floaters.push({
              x: r.x,
              y: r.y - 16,
              text: 'FOLLOW ME!',
              life: 40,
              color: RAMPS.pink[3],
            })
          this.sound.play('blip')
        } else {
          this.collect(r, 1)
        }
      } else if (r.state === 'dizzy') {
        // Caught before they wandered off: safe, though the bonus is gone for this wave.
        this.family.splice(this.family.indexOf(r), 1)
        this.familySaved++
        this.friends++
        this.keepRecords()
        this.hearts += HEARTS_PER_RESCUE
        this.floaters.push({
          x: r.x,
          y: r.y - 14,
          text: 'SAFE!',
          life: 40,
          color: RAMPS.sky[3],
        })
        this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.sky[3] })
        this.sound.play('pickup')
      }
    }
  }

  private touchBeacon(h: Hero) {
    if (!this.beacon || dist(h, this.beacon) > BEACON_RADIUS) return
    const parade = this.parade(h.seat)
    if (!parade.length) return
    for (const r of parade) this.collect(r, 2)
    this.floaters.push({
      x: this.beacon.x,
      y: this.beacon.y - 26,
      text: 'DOUBLE!',
      life: 60,
      color: RAMPS.gold[4],
    })
    this.rings.push({
      x: this.beacon.x,
      y: this.beacon.y,
      life: 24,
      color: RAMPS.gold[3],
    })
    this.sound.play('extra')
  }

  /** A rescue: the bonus (doubled at the beacon), and the multiplier climbs. */
  private collect(r: Rescuee, times: number) {
    const i = this.family.indexOf(r)
    if (i >= 0) this.family.splice(i, 1)
    this.familySaved++
    this.friends++
    this.keepRecords()
    this.hearts += HEARTS_PER_RESCUE
    const points = RESCUE_STEP * this.multiplier * times
    this.addScore(points, r.x, r.y, times > 1 ? RAMPS.gold[4] : '#86efac')
    this.multiplier = Math.min(RESCUE_CAP, this.multiplier + 1)
    this.sound.play('pickup')
    this.fx.burst(r.x, r.y - 4, this.fxRng, { count: 14, speed: 1.8 })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.leaf[3] })
  }

  /** A hit: the parade scatters, then a bubble shield or a squad bot takes it before a hero does. */
  private hurtHero(h: Hero) {
    this.waveHit = true
    for (const r of this.parade(h.seat)) {
      r.state = 'calm'
      const u = toward(h, r)
      r.vx = u.x * 1.5
      r.vy = u.y * 1.5
      r.clock = 30
    }
    if (h.powers.shield) {
      delete h.powers.shield
      h.invuln = 60
      this.rings.push({ x: h.x, y: h.y, life: 24, color: RAMPS.teal[3] })
      this.floaters.push({
        x: h.x,
        y: h.y - 24,
        text: 'POP!',
        life: 40,
        color: RAMPS.teal[3],
      })
      this.sound.play('pop')
      return
    }
    if (h.squad > 0) {
      h.squad--
      h.invuln = 90
      this.burst(h.x, h.y, 14, [RAMPS.leaf[3], RAMPS.gold[4]])
      this.floaters.push({
        x: h.x,
        y: h.y - 24,
        text: 'SQUAD BOT TOOK IT!',
        life: 50,
        color: RAMPS.leaf[3],
      })
      this.sound.play('boom')
      return
    }
    this.loseLife(h)
  }

  private loseLife(h: Hero) {
    h.alive = false
    this.lives--
    h.reviving = 0
    // In co-op a downed hero sits dizzy where they fell, for a partner to pick up.
    h.respawn = this.heroes.length > 1 ? COOP_RESPAWN : 90
    h.powers = {}
    this.multiplier = 1
    this.shots = this.shots.filter((s) => s.seat !== h.seat)
    this.bolts = []
    this.burst(h.x, h.y, 30, ['#f472b6', '#2dd4bf', '#fde68a'])
    this.sound.play('die')
    if (this.lives <= 0 && !this.heroes.some((o) => o.alive))
      this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive(h: Hero) {
    const start = this.script.hero ?? { x: CX, y: CY }
    Object.assign(h, {
      x: start.x + this.seatOffset(h.seat),
      y: start.y,
      vx: 0,
      vy: 0,
    })
    h.trail = []
    // Move anything crowding the spot back out toward the walls.
    for (const f of this.foes) {
      if (
        f.kind === 'puddle' ||
        f.kind === 'pylon' ||
        f.kind === 'crate' ||
        dist(f, h) >= 100
      )
        continue
      const a = Math.atan2(f.y - h.y, f.x - h.x)
      f.x = h.x + Math.cos(a) * 140
      f.y = h.y + Math.sin(a) * 120
      clampToArena(f, FOES[f.kind].radius)
    }
    for (const r of this.family) {
      if (r.state === 'glitched' && dist(r, h) < 80) {
        const u = toward(h, r)
        r.x = h.x + u.x * 110
        r.y = h.y + u.y * 90
        clampToArena(r, RESCUEE_RADIUS)
      }
    }
    if (this.boss && dist(this.boss, h) < 110) {
      const u = toward(h, this.boss)
      this.boss.x = h.x + u.x * 140
      this.boss.y = h.y + u.y * 110
    }
    h.alive = true
    h.invuln = 150
  }

  private addScore(points: number, x: number, y: number, color: string) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50, color })
    if (this.score >= this.nextExtra) {
      this.lives = Math.min(MAX_LIVES, this.lives + 1)
      this.nextExtra = extraAt(++this.extras)
      this.sound.play('extra')
      this.banner = { text: 'EXTRA HERO!', ticks: 90 }
    }
  }

  private burst(
    x: number,
    y: number,
    count: number,
    colors: readonly string[],
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2.2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.fxRng() * 25),
        max: 45,
        color: colors[i % colors.length]!,
      })
    }
  }

  private updateEffects() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vx *= 0.94
      s.vy *= 0.94
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const f of this.freed) {
      f.y -= 0.6
      f.life--
    }
    this.freed = this.freed.filter((f) => f.life > 0)
    this.fx.update()
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  // --- attract-mode pilot ------------------------------------------------------------------

  /**
   * The attract demo's pilot (and the probes' stand-in player): steps away from whatever is close
   * and out of the line of any spark, slips through a shockwave's gaps and off the Jack's lunge
   * line, heads for the nearest of the family (leading a parade to the beacon when there is one) or
   * a power-up close by, and aims its second stick at what matters most: a glitched friend to
   * reboot, a hypno on the hunt, a boss's soft spot, then whatever is nearest. At the Shelter it
   * buys what it can afford and moves on.
   */
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
    if (this.shelter) return this.shelterPilot(frame)
    if (this.menu) {
      frame.pressed.a = this.tick % 20 === 0
      return frame
    }
    if (this.offer) {
      frame.pressed.a = this.tick % 30 === 0
      return frame
    }
    const h = this.heroes[0]!
    if (!h.alive) return frame
    let mx = 0
    let my = 0
    const away = (p: Point, reach: number, weight = 1) => {
      const d = dist(p, h)
      if (d >= reach) return
      if (d < 0.5) {
        mx += h.x <= CX ? 1 : -1
        my += h.y <= CY ? 0.5 : -0.5
        return
      }
      const k = weight * (1 - d / reach) * 2
      mx += ((h.x - p.x) / d) * k
      my += ((h.y - p.y) / d) * k
    }
    for (const f of this.foes) {
      const r = FOES[f.kind].radius
      if (f.kind === 'pylon' || f.kind === 'puddle') away(f, r + 16, 1.6)
      else if (f.kind === 'crate') away(f, r + 12, 0.6)
      else if (f.kind === 'stomper') away(f, r + 44, 1.4)
      else away(f, r + 46)
    }
    for (const r of this.family) if (r.state === 'glitched') away(r, 50)
    const b = this.boss
    if (b && !b.down) {
      if (b.kind === 'windup') away({ x: b.x, y: b.y - 12 }, 90, 2)
      else if (b.mode !== 'hide') away({ x: b.x, y: b.y - 6 }, 70, 2)
      // A stomp coming: walk into the nearest safe lane while the floor cracks.
      if (b.kind === 'windup' && b.mode === 'crack') {
        const a = Math.atan2(h.y - (b.y + 8), h.x - b.x)
        const lane = b.gaps.reduce((best, gap) =>
          Math.abs(Math.atan2(Math.sin(gap - a), Math.cos(gap - a))) <
          Math.abs(Math.atan2(Math.sin(best - a), Math.cos(best - a)))
            ? gap
            : best,
        )
        const d = Math.max(60, dist(h, { x: b.x, y: b.y + 8 }))
        mx += (b.x + Math.cos(lane) * d - h.x) * 0.08
        my += (b.y + 8 + Math.sin(lane) * d - h.y) * 0.08
      }
      // A shockwave on its way: slide round toward the nearest gap.
      for (const s of b.shocks) {
        const d = dist(s, h)
        if (d < s.r - 4 || d > s.r + 46) continue
        const a = Math.atan2(h.y - s.y, h.x - s.x)
        // Already well inside a gap: stay put in it.
        if (inGap(s.gaps, a, -0.22)) continue
        let bestTurn = 0
        let bestGap = Infinity
        for (const gap of s.gaps) {
          const turn = Math.atan2(Math.sin(gap - a), Math.cos(gap - a))
          if (Math.abs(turn) < Math.abs(bestGap)) {
            bestGap = turn
            bestTurn = Math.sign(turn)
          }
        }
        mx += -Math.sin(a) * bestTurn * 2.5
        my += Math.cos(a) * bestTurn * 2.5
      }
      // On the Jack's lunge line: step off it.
      if (
        b.kind === 'jack' &&
        (b.mode === 'aim' || b.mode === 'lunge' || b.mode === 'back')
      ) {
        const rx = h.x - b.x
        const ry = h.y - (b.y - 14)
        const along = rx * b.aim.x + ry * b.aim.y
        const off = ry * b.aim.x - rx * b.aim.y
        if (along > 0 && along < LUNGE_REACH + 20 && Math.abs(off) < 26) {
          const side = off >= 0 ? 1 : -1
          mx += -b.aim.y * side * 2.5
          my += b.aim.x * side * 2.5
        }
      }
    }
    // Off any line that's about to hurt: a hot (or flickering) gate, a root whip, the Twins' link.
    const offLine = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      reach: number,
    ) => {
      const d = segmentDistance(h, x0, y0, x1, y1)
      if (d >= reach) return
      const len = Math.hypot(x1 - x0, y1 - y0) || 1
      const nx = -(y1 - y0) / len
      const ny = (x1 - x0) / len
      const side = (h.x - x0) * nx + (h.y - y0) * ny >= 0 ? 1 : -1
      const k = 2.6 * (1 - d / reach)
      mx += nx * side * k
      my += ny * side * k
    }
    for (const gt of this.gates)
      if (gateState(gt, this.waveTick) !== 'off')
        offLine(gt.x0, gt.y0, gt.x1, gt.y1, 24)
    if (b && !b.down) {
      for (const wp of b.whips) offLine(wp.x0, wp.y0, wp.x1, wp.y1, 26)
      if (b.kind === 'twins' && b.phase === 0) {
        const [t0, t1] = b.twins
        offLine(t0!.x, t0!.y, t1!.x, t1!.y, 30)
        for (const t of b.twins) away(t, 46, 2)
      }
      if (b.kind === 'twins' && b.phase > 0)
        for (const t of b.twins) if (t.hp > 0) away(t, 60, 2)
      if (b.kind === 'overgrowth' || b.kind === 'core') away(b, 70, 2)
    }
    for (const st of this.strikes)
      if (st.clock > 0) away(st, LIGHTNING_RADIUS + 18, 2.5)
    for (const d of this.drops) away(d, 22, 2)
    // Sidestep any spark flying this way, off the line it is flying along.
    for (const bolt of this.bolts) {
      const rx = h.x - bolt.x
      const ry = h.y - bolt.y
      if (Math.hypot(rx, ry) > 90) continue
      const speed = Math.hypot(bolt.vx, bolt.vy) || 1
      const ux = bolt.vx / speed
      const uy = bolt.vy / speed
      if (rx * ux + ry * uy < 0) continue
      const off = ry * ux - rx * uy
      if (Math.abs(off) > 14) continue
      const side = off >= 0 ? 1 : -1
      const push = 2.4 * (1 - Math.abs(off) / 14)
      mx += -uy * side * push
      my += ux * side * push
    }
    // A shield bot facing the pilot: circle round to its side.
    for (const f of this.foes) {
      if (f.kind !== 'shieldbot' || dist(f, h) > 170) continue
      const from = Math.atan2(h.y - f.y, h.x - f.x)
      const off = Math.atan2(Math.sin(from - f.face), Math.cos(from - f.face))
      if (Math.abs(off) > SHIELD_ARC + 0.2) continue
      const side = off >= 0 ? 1 : -1
      mx += -Math.sin(from) * side * 1.6
      my += Math.cos(from) * side * 1.6
      break
    }
    // Keep off the walls while dodging, so a corner never pins the pilot.
    if (Math.abs(mx) + Math.abs(my) > 0.4) {
      if (h.x < ARENA.left + 24) mx += 0.8
      if (h.x > ARENA.right - 24) mx -= 0.8
      if (h.y < ARENA.top + 24) my += 0.8
      if (h.y > ARENA.bottom - 24) my -= 0.8
    }
    const parade = this.parade(h.seat)
    const waiting = this.family.filter(
      (r) => r.state === 'calm' || r.state === 'dizzy',
    )
    const nearest = (list: readonly Point[]) =>
      list.reduce<Point | null>(
        (best, p) => (!best || dist(p, h) < dist(best, h) ? p : best),
        null,
      )
    const banking =
      this.beacon &&
      parade.length > 0 &&
      (parade.length >= PARADE_MAX || !waiting.length)
    const power = nearest(this.pickups.filter((p) => dist(p, h) < 110))
    const goal: Point | null = banking
      ? this.beacon
      : (power ?? nearest(waiting))
    // Lead a parade whenever there's a pad to walk it to.
    held.b = !!this.beacon && parade.length < PARADE_MAX
    if (goal) {
      const d = dist(goal, h) || 1
      const pull = Math.abs(mx) + Math.abs(my) < 0.4 ? 1.2 : 0.7
      mx += ((goal.x - h.x) / d) * pull
      my += ((goal.y - h.y) / d) * pull
    } else if (Math.abs(mx) + Math.abs(my) < 0.3) {
      mx = (CX - h.x) * 0.02
      my = (CY - h.y) * 0.02
    }
    if (mx < -0.25) held.left = true
    if (mx > 0.25) held.right = true
    if (my < -0.25) held.up = true
    if (my > 0.25) held.down = true

    // The second stick: the most urgent thing in reach.
    let target: Point | null = null
    let best = Infinity
    const consider = (p: Point, weight: number) => {
      const d = dist(p, h) * weight
      if (d < best && dist(p, h) < 260) {
        best = d
        target = p
      }
    }
    for (const r of this.family) if (r.state === 'glitched') consider(r, 0.5)
    if (b) for (const t of bossTargets(b)) if (t.hurts) consider(t, 0.8)
    for (const f of this.foes) {
      if (f.kind === 'pylon' || f.kind === 'puddle' || f.kind === 'crate')
        continue
      if (f.kind === 'stomper') {
        // Shove a stomper only when it's closing on the family or the pilot.
        const prey = this.foeWorld.family(f)
        if ((prey && dist(prey, f) < 60) || dist(f, h) < 70) consider(f, 1.1)
        continue
      }
      consider(f, f.kind === 'hypno' ? 0.45 : f.kind === 'tank' ? 1.6 : 1)
    }
    // A post or crate between the pilot and the family it wants: pop it.
    if (!target && goal) {
      for (const f of this.foes) {
        if (f.kind !== 'pylon' && f.kind !== 'crate') continue
        if (onSegment(f, h, goal, 14)) consider(f, 1)
      }
    }
    // Like a person, it settles on a target for a few ticks before it looks again.
    if (target && (this.tick % 6 === 0 || !this.pilotAim)) {
      const u = toward(h, target as Point)
      this.pilotAim = { x: u.x, y: u.y }
    } else if (!target) this.pilotAim = null
    if (this.pilotAim) frame.aim = { ...this.pilotAim }
    return frame
  }

  /** At the Shelter the pilot buys a squad bot, then a spare hero, then the rest, and moves on. */
  private shelterPilot(frame: InputFrame): InputFrame {
    const s = this.shelter!
    const wants: ShelterItemId[] = ['squad', 'hero', 'chain', 'beam', 'leave']
    const want = wants.find((id) =>
      canBuy(
        SHELTER_ITEMS.find((i) => i.id === id)!,
        this.shop(),
      ),
    )!
    const at = SHELTER_ITEMS.findIndex((i) => i.id === want)
    if (s.ticks < 40) return frame
    if (s.cursor !== at) frame.pressed.down = s.ticks % 8 === 0
    else frame.pressed.a = s.ticks % 20 === 0
    return frame
  }

  // --- render ------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.menu?.board) {
      renderBoard(g, this.medals, this.times, this.reached)
      return
    }
    if (this.ending) {
      renderEnding(g, {
        tick: this.tick,
        t: this.ending.t,
        trueEnding: this.ending.trueEnding,
        friends: this.friends,
        chips: this.chips.size,
      })
      if (this.ending.t > SKIP_AFTER)
        drawText(g, 'A TO GO ON', W - 8, 8, {
          align: 'right',
          color: RAMPS.steel[3],
          outline: INK,
        })
      return
    }
    if (this.shelter) {
      renderShelter(g, {
        tick: this.tick,
        cursor: this.shelter.cursor,
        hearts: this.hearts,
        friends: this.friends,
        bought: this.bought,
        held: this.held(),
        lives: this.lives,
        next: this.nextDistrictLine(),
        thanks: this.shelter.thanks,
        chips: this.chips.size,
        hinted: this.hintFor === waveAt(this.level + 1).district,
      })
      return
    }
    const d = DISTRICTS[this.district]!
    renderFloor(g, d.floor, d.id, this.district, this.tick)
    renderConveyors(g, this.belts, this.tick)
    renderBeds(g, this.beds)
    renderSprinklers(g, this.sprinklers, this.tick)
    renderMagnetFloors(g, this.magnetFloors, this.tick)
    renderPads(g, this.pads, this.tick)
    renderGates(g, this.gates, this.waveTick)
    renderVines(g, this.vines, this.tick)
    for (const d of this.drops) {
      // A kite's shadow, darkening as its pylon falls.
      const t = 1 - d.clock / 60
      dropShadow(g, d.x, d.y + 4, 5 + t * 6, 2 + t * 2, 0.25 + t * 0.4)
    }
    const due = this.arrivals.some(
      (a) => a.tick - this.waveTick <= VENT_TELL && a.tick > this.waveTick,
    )
    renderVents(g, due, this.tick)
    if (this.beacon) this.renderBeacon(g, this.beacon)
    for (const f of this.foes)
      if (f.kind === 'puddle') renderPuddle(g, f, this.tick)
    if (this.boss) renderShocks(g, this.boss)
    for (const p of this.pickups) this.renderPickup(g, p)
    // Everything that stands up is drawn back to front.
    const actors: Array<{ y: number; draw: () => void }> = []
    for (const f of this.foes) {
      if (f.kind === 'puddle') continue
      actors.push({ y: f.y, draw: () => renderFoe(g, f, this.tick) })
    }
    for (const r of this.family)
      actors.push({ y: r.y, draw: () => this.renderRescuee(g, r) })
    for (const h of this.heroes) {
      if (!h.alive) {
        if (this.heroes.length > 1 && this.lives >= 0)
          actors.push({ y: h.y, draw: () => this.renderDowned(g, h) })
        continue
      }
      if (h.invuln > 0 && Math.floor(h.invuln / 5) % 2 === 0) continue
      actors.push({ y: h.y, draw: () => this.renderHero(g, h) })
    }
    const boss = this.boss
    if (boss)
      actors.push({ y: boss.y, draw: () => renderBoss(g, boss, this.tick) })
    actors.sort((a, b) => a.y - b.y)
    for (const a of actors) a.draw()
    renderBedTops(g, this.beds, this.tick)
    for (const h of this.heroes) if (h.alive) this.renderSquad(g, h)
    for (const f of this.freed) this.renderFreed(g, f)
    this.renderBolts(g)
    this.renderShots(g)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const t = Math.max(0, s.life / s.max)
      const size = t > 0.5 ? 2 : 1
      g.globalAlpha = Math.min(1, t * 1.6)
      g.fillStyle = s.color
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, size + 1, size + 1)
      if (size > 1) {
        g.fillStyle = '#ffffff'
        g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)
      }
    }
    g.restore()
    if (this.storm || this.strikes.length)
      renderStorm(g, this.wind, this.strikes, this.tick)
    this.renderRings(g)
    this.fx.render(g)
    if (this.freeze > 0) {
      // The pause button: everything held in a blue hush.
      g.fillStyle = rgba(RAMPS.sky[2], 0.12 + 0.06 * Math.sin(this.tick / 5))
      g.fillRect(ARENA.left, ARENA.top, ARENA_W, ARENA_H)
    }
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.result) {
      g.fillStyle = rgba(INK, 0.7)
      g.fillRect(0, 0, W, H)
      drawText(g, this.result.text, W / 2, H / 2 - 30, {
        scale: 3,
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      drawText(g, this.result.sub, W / 2, H / 2 + 6, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
    }
    if (this.menu)
      renderMenu(g, {
        tick: this.tick,
        cursor: this.menu.cursor,
        district: this.menu.district,
        reached: this.reached,
        times: this.times,
        players: this.heroes.length,
      })
    if (this.offer) this.renderChoice(g, this.offer)
  }

  private nextDistrictLine(): string {
    const next = waveAt(this.level + 1)
    const name = DISTRICTS[next.district]!.name
    return next.loop > 1 ? `${name}, LOOP ${next.loop}` : name
  }

  /** The opening card when a rally is saved: continue it, or start a new one. */
  private renderChoice(g: CanvasRenderingContext2D, offer: RallySave) {
    g.fillStyle = rgba(INK, 0.82)
    g.fillRect(0, 0, W, H)
    drawText(g, 'WELCOME BACK!', W / 2, 70, {
      scale: 3,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
      shadow: RAMPS.pink[1],
    })
    const d = DISTRICTS[offer.district]!
    const options = [
      `CONTINUE: DISTRICT ${offer.district + 1} ${d.name}${offer.loop > 1 ? ` (LOOP ${offer.loop})` : ''}`,
      'START A NEW RALLY',
    ]
    options.forEach((text, i) => {
      const y = 140 + i * 40
      const on = i === this.choice
      const w = measureText(text) * 2 + 30
      hudPanel(g, W / 2 - w / 2, y - 6, w, 26, on ? RAMPS.gold : RAMPS.purple)
      drawText(g, text, W / 2, y, {
        scale: 2,
        align: 'center',
        color: on ? '#ffffff' : RAMPS.steel[3],
        outline: INK,
      })
    })
    const sub = offer.continued
      ? 'THE SCORE STARTS FROM ZERO'
      : `SCORE ${offer.score}   ${offer.lives} HEROES   ${offer.hearts} HEARTS`
    drawText(g, sub, W / 2, 238, {
      align: 'center',
      color: RAMPS.cream[3],
      outline: INK,
    })
    drawText(g, 'UP/DOWN PICK   A CHOOSE', W / 2, 290, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
  }

  private renderPickup(g: CanvasRenderingContext2D, p: Pickup) {
    if (p.life < 120 && Math.floor(p.life / 6) % 2 === 0) return
    const bob = Math.round(Math.sin((this.tick + p.x) / 8) * 2)
    const ramp = POWERS[p.kind].ramp
    glow(g, p.x, p.y - 2 + bob, 14, ramp[3], 0.5)
    dropShadow(g, p.x, p.y + 8, 6, 1.5, 0.35)
    drawSprite(g, POWER_SPRITES[p.kind], p.x, p.y + bob)
  }

  private renderSquad(g: CanvasRenderingContext2D, h: Hero) {
    for (let i = 0; i < h.squad; i++) {
      const p = this.squadSpot(h, i)
      glow(g, p.x, p.y, 8, RAMPS.leaf[3], 0.4)
      drawSprite(
        g,
        SQUAD_SPRITE,
        p.x,
        p.y + Math.round(Math.sin(this.tick / 8 + i) * 1),
      )
    }
  }

  private renderBeacon(g: CanvasRenderingContext2D, b: Point) {
    const h = this.heroes[0]!
    const leading = this.parade(h.seat).length > 0
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 10)
    dropShadow(g, b.x, b.y + 2, BEACON_RADIUS + 2, 7, 0.4)
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(b.x, b.y, BEACON_RADIUS + 1, 10, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[1]
    g.beginPath()
    g.ellipse(b.x, b.y, BEACON_RADIUS, 9, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = leading ? RAMPS.gold[2] : RAMPS.teal[1]
    g.beginPath()
    g.ellipse(b.x, b.y - 1, BEACON_RADIUS - 3, 7, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = leading ? RAMPS.gold[3] : RAMPS.teal[2]
    g.beginPath()
    g.ellipse(b.x - 2, b.y - 2, BEACON_RADIUS - 8, 4, 0, 0, Math.PI * 2)
    g.fill()
    glow(
      g,
      b.x,
      b.y - 4,
      28,
      leading ? RAMPS.gold[3] : RAMPS.teal[3],
      0.25 + 0.25 * pulse,
    )
    drawSprite(g, HOUSE_SPRITE, b.x, b.y - 2, { anchor: 'feet' })
    if (leading) {
      // Rings rise off the pad while a parade is on its way.
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let k = 0; k < 2; k++) {
        const t = ((this.tick / 40 + k / 2) % 1) as number
        g.globalAlpha = 1 - t
        g.strokeStyle = RAMPS.gold[3]
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(
          b.x,
          b.y - t * 18,
          BEACON_RADIUS * (1 - t * 0.3),
          6,
          0,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
      g.restore()
    }
  }

  private renderHero(g: CanvasRenderingContext2D, h: Hero) {
    const bob = Math.sin(h.walk) > 0.5 ? -1 : 0
    const frame = Math.floor(h.walk / 1.2) % 2
    // Facing comes from the aim; pixel sprites flip, never rotate.
    const vertical = Math.abs(h.aimY) > Math.abs(h.aimX) * 1.2
    const suit = this.suits[h.seat] ?? HERO_SPRITES
    const set = vertical ? (h.aimY > 0 ? suit.front : suit.back) : suit.side
    glow(g, h.x, h.y, 30, SUITS[h.seat]![3], 0.16)
    if (this.heroes.length > 1) {
      // Co-op: each hero's seat number over its head.
      drawText(g, `P${h.seat + 1}`, h.x, h.y - 30, {
        align: 'center',
        color: SUITS[h.seat]![3],
        outline: INK,
      })
    }
    dropShadow(g, h.x, h.y + 9, 8, 2.5, 0.4)
    drawSprite(g, set[frame ? 1 : 0], h.x, h.y + 10 + bob, {
      anchor: 'feet',
      flipX: !vertical && h.aimX < 0,
    })
    // The beam emitter's aim pip.
    const ax = Math.round(h.x + h.aimX * 16)
    const ay = Math.round(h.y - 4 + h.aimY * 16)
    glow(g, ax, ay, 5, RAMPS.gold[3], 0.6)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(ax - 1, ay, 3, 1)
    g.fillRect(ax, ay - 1, 1, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(ax, ay, 1, 1)
    if (h.powers.shield) {
      // The bubble shield, shimmering.
      g.save()
      g.globalAlpha = 0.5 + 0.2 * Math.sin(this.tick / 6)
      g.strokeStyle = RAMPS.teal[3]
      g.lineWidth = 1
      g.beginPath()
      g.arc(h.x, h.y - 3, 15, 0, Math.PI * 2)
      g.stroke()
      g.restore()
      glow(g, h.x, h.y - 3, 18, RAMPS.teal[3], 0.25)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(h.x) - 8, Math.round(h.y) - 13, 2, 1)
    }
    if (h.gathering && this.beacon) {
      // Arms out: a parade will follow. A little arrow points the way to the pad.
      const u = toward(h, this.beacon)
      const px = Math.round(h.x + u.x * 22)
      const py = Math.round(h.y - 2 + u.y * 22)
      g.fillStyle = INK
      g.fillRect(px - 2, py - 2, 5, 5)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(px - 1, py - 1, 3, 3)
    }
  }

  private renderShots(g: CanvasRenderingContext2D) {
    if (!this.shots.length) return
    for (const s of this.shots)
      glow(g, s.x, s.y, 7 + s.r, s.squad ? RAMPS.leaf[3] : RAMPS.pink[3], 0.5)
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.lineCap = 'round'
    for (const s of this.shots) {
      const tx = s.x - s.vx * 1.6
      const ty = s.y - s.vy * 1.6
      g.strokeStyle = rgba(s.squad ? RAMPS.leaf[2] : RAMPS.pink[2], 0.6)
      g.lineWidth = 2 + s.r
      g.beginPath()
      g.moveTo(tx, ty)
      g.lineTo(s.x, s.y)
      g.stroke()
      g.strokeStyle = RAMPS.gold[3]
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(s.x - s.vx * 0.9, s.y - s.vy * 0.9)
      g.lineTo(s.x, s.y)
      g.stroke()
    }
    g.restore()
    g.fillStyle = '#ffffff'
    for (const s of this.shots) {
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2)
    }
  }

  /** A sparker's spark (a crackling gold ball with a jagged tail), or a scrap of the Jack's confetti. */
  private renderBolts(g: CanvasRenderingContext2D) {
    const confetti = [
      RAMPS.pink[3],
      RAMPS.teal[3],
      RAMPS.gold[3],
      RAMPS.purple[3],
    ]
    for (const b of this.bolts) {
      if (b.confetti) {
        const c = confetti[(Math.floor(b.x + b.y) & 3) % confetti.length]!
        const flip = Math.floor((this.tick + b.x) / 4) % 2
        g.fillStyle = INK
        g.fillRect(
          Math.round(b.x) - 3,
          Math.round(b.y) - 2,
          flip ? 6 : 4,
          flip ? 4 : 6,
        )
        g.fillStyle = c
        g.fillRect(
          Math.round(b.x) - 2,
          Math.round(b.y) - 1,
          flip ? 4 : 2,
          flip ? 2 : 4,
        )
        continue
      }
      glow(g, b.x, b.y, 10, RAMPS.gold[3], 0.6)
      g.strokeStyle = RAMPS.gold[3]
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(b.x, b.y)
      for (let k = 1; k <= 3; k++) {
        const zig = ((b.life + k) % 2 ? 1 : -1) * 2
        g.lineTo(
          b.x - b.vx * k * 1.6 - b.vy * zig * 0.4,
          b.y - b.vy * k * 1.6 + b.vx * zig * 0.4,
        )
      }
      g.stroke()
      shadedOrb(g, b.x, b.y, BOLT_RADIUS, RAMPS.gold, { glint: false })
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2)
    }
  }

  private renderRescuee(g: CanvasRenderingContext2D, r: Rescuee) {
    const moving = Math.abs(r.vx) + Math.abs(r.vy) > 0.05
    const bob = moving ? Math.abs(Math.sin(this.tick / 6 + r.id)) * 1.2 : 0
    const x = r.x
    const y = r.y - bob
    const frame = moving ? Math.floor(this.tick / 7 + r.id) % 2 : 0
    const sprites = familySprites(r.kind, r.color, r.skin)
    let sprite = sprites[frame]!
    if (r.state === 'glitched') sprite = glitchTint(sprite)
    dropShadow(g, r.x, r.y + 8, 6, 1.8, 0.35)
    const jolt =
      r.state === 'glitched' && (this.tick + r.id * 7) % 41 < 3
        ? this.tick % 2
          ? 2
          : -2
        : 0
    drawSprite(g, sprite, x + jolt, y + 8, {
      anchor: 'feet',
      flipX: r.vx < 0,
    })
    const top = y - sprite.height + 6
    switch (r.state) {
      case 'calm':
        if (r.clock > 0 && Math.floor(this.tick / 4) % 2 === 0) {
          glow(g, x, top + 4, 10, RAMPS.leaf[3], 0.5)
        } else if (Math.floor((this.tick + r.id * 5) / 20) % 2 === 0) {
          glow(g, x, top - 6, 6, RAMPS.pink[3], 0.45)
          drawSprite(g, HELP_SPRITE, x, top - 6)
        }
        break
      case 'parade':
        glow(g, x, top - 5, 6, RAMPS.gold[3], 0.5)
        drawSprite(g, HEART_SPRITE, x, top - 5)
        break
      case 'dizzy':
        // Stars go round their head.
        for (let k = 0; k < 3; k++) {
          const a = this.tick / 8 + (k * Math.PI * 2) / 3
          const sx = Math.round(x + Math.cos(a) * 7)
          const sy = Math.round(top - 3 + Math.sin(a) * 2.5)
          g.fillStyle = INK
          g.fillRect(sx - 1, sy - 1, 3, 3)
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(sx, sy - 1, 1, 3)
          g.fillRect(sx - 1, sy, 3, 1)
        }
        break
      case 'glitched': {
        // A swirl over their head, turning.
        glow(g, x, top - 5, 9, GLITCH[3], 0.55)
        const a = this.tick / 4
        for (let k = 0; k < 5; k++) {
          const rr = 1 + k * 0.9
          g.fillStyle = k % 2 ? GLITCH[4] : GLITCH[2]
          g.fillRect(
            Math.round(x + Math.cos(a + k * 1.3) * rr),
            Math.round(top - 5 + Math.sin(a + k * 1.3) * rr * 0.7),
            1,
            1,
          )
        }
        break
      }
    }
  }

  private renderFreed(
    g: CanvasRenderingContext2D,
    f: { x: number; y: number; life: number },
  ) {
    const fade = Math.max(0, f.life / 60)
    glow(g, f.x, f.y, 14, RAMPS.leaf[3], 0.45 * fade)
    drawSprite(g, FREED_SPRITES[Math.floor(f.life / 4) % 2]!, f.x, f.y, {
      alpha: fade,
    })
  }

  private renderRings(g: CanvasRenderingContext2D) {
    if (!this.rings.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const r of this.rings) {
      const t = 1 - r.life / 24
      g.globalAlpha = 1 - t
      g.strokeStyle = r.color
      g.lineWidth = 2
      g.beginPath()
      g.arc(r.x, r.y, 4 + t * 20, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = RAMPS.gold[4]
      g.lineWidth = 1
      g.beginPath()
      g.arc(r.x, r.y, 2 + t * 12, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }

  /** A co-op hero down: sitting dizzy, a ring filling as a partner picks them up. */
  private renderDowned(g: CanvasRenderingContext2D, h: Hero) {
    const suit = this.suits[h.seat] ?? HERO_SPRITES
    dropShadow(g, h.x, h.y + 9, 8, 2.5, 0.4)
    drawSprite(g, suit.front[0], h.x, h.y + 10, { anchor: 'feet', alpha: 0.75 })
    for (let k = 0; k < 3; k++) {
      const a = this.tick / 8 + (k * Math.PI * 2) / 3
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(h.x + Math.cos(a) * 9),
        Math.round(h.y - 22 + Math.sin(a) * 3),
        2,
        2,
      )
    }
    if (h.reviving > 0) {
      g.strokeStyle = RAMPS.leaf[3]
      g.lineWidth = 2
      g.beginPath()
      g.arc(
        h.x,
        h.y - 4,
        16,
        -Math.PI / 2,
        -Math.PI / 2 + (h.reviving / REVIVE_TICKS) * Math.PI * 2,
      )
      g.stroke()
    } else if (Math.floor(this.tick / 20) % 2 === 0) {
      drawText(g, 'HELP!', h.x, h.y - 34, {
        align: 'center',
        color: SUITS[h.seat]![3],
        outline: INK,
      })
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score, high score and lives sit in boxes in the strip above the rim.
    hudPanel(g, 4, 3, 96, 18)
    drawText(g, String(this.score).padStart(7, '0'), 11, 5, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    const hi =
      this.mode === 'timeattack'
        ? `TIME ${clock(this.attackTicks)}`
        : `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 14
    hudPanel(g, Math.round(W / 2 - hiW / 2), 3, hiW, 18)
    drawText(g, hi, W / 2, 5, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      const w = lives * 17 + 5
      hudPanel(g, W - 4 - w, 3, w, 18)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, HEART_SPRITE, W - 15 - i * 17, 12, { scale: 2 })
      }
    }
    // The wave and its name, the parade and the rescue multiplier sit in boxes below the rim.
    const wave =
      this.mode === 'rally100'
        ? `${this.level}/${RALLY_LENGTH}  ${this.script.name}`
        : this.mode === 'classic'
          ? `CLASSIC WAVE ${this.level}`
          : `${this.district + 1}-${this.index + 1}  ${this.script.name}`
    hudPanel(g, 4, H - 13, measureText(wave) + 14, 11)
    drawText(g, wave, 11, H - 10, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    this.renderChainHud(g)
    this.renderPowersHud(g)
    this.renderChipHud(g)
    if (this.boss) this.renderBossBar(g, this.boss)
    if (this.beacon) {
      const seat = this.heroes[0]!.seat
      const n = this.parade(seat).length
      const pw = 14 + PARADE_MAX * 9
      const px = 262
      hudPanel(g, px, H - 13, pw, 11)
      for (let i = 0; i < PARADE_MAX; i++) {
        drawSprite(g, HEART_SPRITE, px + 11 + i * 9, H - 7, {
          alpha: i < n ? 1 : 0.25,
        })
      }
    }
    const rescue = `RESCUE X${this.multiplier}`
    const rescueW = measureText(rescue)
    const panelW = rescueW + 74
    hudPanel(g, W - 4 - panelW, H - 13, panelW, 11)
    drawText(g, rescue, W - 4 - panelW + 7, H - 10, {
      color: RAMPS.leaf[3],
      outline: INK,
    })
    gauge(
      g,
      W - 63,
      H - 10,
      52,
      6,
      this.multiplier / RESCUE_CAP,
      this.multiplier >= RESCUE_CAP ? RAMPS.gold : RAMPS.leaf,
    )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 28, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 4, {
          scale: 2,
          align: 'center',
          color: RAMPS.leaf[3],
          outline: INK,
        })
      }
    }
  }

  /** The Reboot Squad: the bots in hand, and how far the chain is toward the next. */
  private renderChainHud(g: CanvasRenderingContext2D) {
    const h = this.heroes[0]!
    const x = 176
    const w = 82
    hudPanel(g, x, H - 13, w, 11)
    for (let i = 0; i < SQUAD_MAX; i++)
      drawSprite(g, SQUAD_SPRITE, x + 9 + i * 11, H - 7, {
        alpha: i < h.squad ? 1 : 0.25,
      })
    gauge(
      g,
      x + 42,
      H - 10,
      34,
      5,
      this.chain / SQUAD_CHAIN,
      this.chainClock > 0 && this.chainClock < 40 ? RAMPS.ember : RAMPS.leaf,
    )
  }

  /** In a signature wave: the golden chip waits (shown once hinted, or once found). */
  private renderChipHud(g: CanvasRenderingContext2D) {
    if (!this.script.signature) return
    const found = this.chips.has(DISTRICTS[this.district]!.id)
    if (!found && this.hintFor !== this.district) return
    const text = found ? 'CHIP FOUND' : `CHIP: SAVE ALL ${this.familyTotal}`
    const w = measureText(text) + 22
    const x = ARENA.right - 6 - w
    hudPanel(g, x, ARENA.top + 4, w, 12, RAMPS.gold)
    shadedOrb(g, x + 8, ARENA.top + 10, 3, RAMPS.gold)
    drawText(g, text, x + 15, ARENA.top + 7, {
      color: found ? RAMPS.leaf[3] : '#ffffff',
      outline: INK,
    })
  }

  /** Running power-ups, each with its timer, along the top of the arena. */
  private renderPowersHud(g: CanvasRenderingContext2D) {
    const h = this.heroes[0]!
    let x = ARENA.left + 6
    const show = (kind: PowerKind, left: number) => {
      const spec = POWERS[kind]
      drawSprite(g, POWER_SPRITES[kind], x + 6, ARENA.top + 9)
      gauge(g, x + 14, ARENA.top + 7, 22, 3, left / spec.ticks, spec.ramp)
      x += 42
    }
    for (const kind of POWER_KINDS) {
      const left = h.powers[kind]
      if (left) show(kind, left)
    }
    if (this.freeze > 0) show('pause', this.freeze)
  }

  private renderBossBar(g: CanvasRenderingContext2D, b: Boss) {
    const spec = BOSSES[b.kind]
    const w = 200
    const x = W / 2 - w / 2
    const y = ARENA.top + 4
    hudPanel(g, x, y, w, 20, RAMPS.ember)
    drawText(g, spec.name, W / 2, y + 3, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    const phases = spec.hp.length
    const seg = (w - 20) / phases
    for (let p = 0; p < phases; p++) {
      const fill = b.down
        ? 0
        : p < b.phase
          ? 0
          : p > b.phase
            ? 1
            : b.hp / spec.hp[p]!
      gauge(
        g,
        x + 10 + p * seg + 1,
        y + 12,
        seg - 3,
        4,
        fill,
        p === 2 ? RAMPS.gold : RAMPS.ember,
      )
    }
  }
}

/** True when `p` lies within `reach` of the segment a-b (and between its ends). */
function onSegment(p: Point, a: Point, b: Point, reach: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy || 1
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  if (t < 0 || t > 1) return false
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y) < reach
}

const rescueRally: ArcadeGameModule = {
  create: (options) => new RescueRally(options),
}

export const create = rescueRally.create
export default rescueRally
