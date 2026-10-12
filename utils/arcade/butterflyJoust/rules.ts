// /utils/arcade/butterflyJoust/rules.ts
//
// Butterfly Joust's rules as data (conductor kr-arcade/t-047, the Four Gardens Tourney's slice 1):
// the announced wave types and their bonus rules, the Air Combo, the Charge Joust, the Pond Frog,
// the Carrier, the Thundercap's eye and the Jousting Party. The game reads these tables; nothing
// here touches a canvas or the game's dice.

/** Every kind of wave the tourney announces on its banner. */
export type WaveKind =
  'joust' | 'survival' | 'gladiator' | 'cocoon' | 'storm' | 'team' | 'lantern'

export type WaveType = {
  /** The banner's headline. */
  title: string
  /** The bonus rule, shown under it. */
  rule: string
  /** What the rule pays (per seat for the Team wave). */
  bonus: number
}

export const WAVE_TYPES: Record<WaveKind, WaveType> = {
  joust: { title: 'WAVE', rule: 'HIGHER RIDER WINS', bonus: 0 },
  survival: {
    title: 'SURVIVAL WAVE',
    rule: 'LOSE NO BUTTERFLY: 3000',
    bonus: 3000,
  },
  gladiator: {
    title: 'GLADIATOR WAVE',
    rule: 'FIRST BONK PAYS 3000',
    bonus: 3000,
  },
  cocoon: { title: 'COCOON WAVE', rule: 'SCOOP THEM ALL: 3000', bonus: 3000 },
  storm: {
    title: 'STORM WAVE',
    rule: 'POP THE THUNDERCAP: 3000',
    bonus: 3000,
  },
  team: {
    title: 'TEAM WAVE',
    rule: 'NO FRIENDLY BONK: 3000 EACH',
    bonus: 3000,
  },
  lantern: {
    title: 'LANTERN WAVE',
    rule: 'CATCH ALL 8 LANTERNS: 3000',
    bonus: 3000,
  },
}

/** A lantern wave floats this many lanterns up, one after another. */
export const LANTERN_WAVE = { count: 8, every: 100 } as const

/**
 * The classic pond's announced waves, ten to a lap: a plain joust to open, then each bonus rule in
 * turn. A Team wave needs two riders; solo it plays as another Survival wave.
 */
export const CLASSIC_CYCLE: readonly WaveKind[] = [
  'joust',
  'survival',
  'joust',
  'gladiator',
  'cocoon',
  'storm',
  'survival',
  'team',
  'gladiator',
  'cocoon',
]

export function classicWaveKind(wave: number, seats: number): WaveKind {
  const kind = CLASSIC_CYCLE[(Math.max(1, wave) - 1) % CLASSIC_CYCLE.length]!
  return kind === 'team' && seats < 2 ? 'survival' : kind
}

// --- the Air Combo ------------------------------------------------------------------------------

/** The streamer's multiplier stops climbing here. */
export const COMBO_MAX = 8
/** A combo lapses (and banks) this long after its last bonk. */
export const COMBO_WINDOW = 60 * 4
/** The multiplier the Air Ace medal (and the banner) asks for. */
export const COMBO_ACE = 4

/** The multiplier after `bonks` bonks without landing. */
export function comboMultiplier(bonks: number): number {
  return Math.max(1, Math.min(COMBO_MAX, bonks))
}

/**
 * What one bonk adds to the waiting combo pot: the base points are paid at once, and the
 * multiplier's extra waits on the streamer until a landing banks it.
 */
export function comboExtra(base: number, bonks: number): number {
  return base * (comboMultiplier(bonks) - 1)
}

// --- the Charge Joust ---------------------------------------------------------------------------

/** Hold B at least this long for a lunge (a shorter tap just cancels the brace). */
export const CHARGE_MIN = 12
/** A brace stops building here. */
export const CHARGE_FULL = 36
/** How long the lunge lasts, and its speed at a full brace. */
export const LUNGE_TICKS = 16
export const LUNGE_SPEED = 4.6
/** The wait before the next brace. */
export const CHARGE_COOLDOWN = 120

/** A lunge's speed for a brace held `ticks` long (0 below the minimum). */
export function lungeSpeed(ticks: number): number {
  if (ticks < CHARGE_MIN) return 0
  const t = Math.min(1, (ticks - CHARGE_MIN) / (CHARGE_FULL - CHARGE_MIN))
  return LUNGE_SPEED * (0.7 + 0.3 * t)
}

// --- the Pond Frog ------------------------------------------------------------------------------

export const FROG = {
  /** The first wave the frog surfaces on. */
  from: 2,
  /** Rest between attacks, plus up to `restSpread` more. */
  rest: 60 * 5,
  restSpread: 60 * 4,
  /** Bubbles rise this long, then the eyes surface for `eyes`. */
  bubbles: 70,
  eyes: 40,
  /** Fliers whose feet are this close to the pond tempt it. */
  reach: 74,
  /** How far either side of its eyes the tongue snaps. */
  snapWidth: 26,
  /** The tongue's flick up and back. */
  flick: 10,
  /** Flaps to break free; held-A auto flaps count half. */
  grip: 7,
  /** The pull toward the pond while held (pixels a tick). */
  pull: 0.42,
  /** A flap's tug back up while held. */
  tug: 2.2,
  /** Breaking free pays this. */
  escapeBonus: 500,
} as const

// --- the Carrier --------------------------------------------------------------------------------

export const CARRIER = {
  /** The first wave whose hatchlings are fetched by a carrier. */
  from: 4,
  speed: 1.7,
  /** Bonk a carrier for this. */
  points: 1000,
  /** A bonked carrier's cocoon waits this long for the next one. */
  regrace: 180,
  /** Carrying a cocoon off to hatch it on the wing. */
  carry: 50,
} as const

// --- the Thundercap -----------------------------------------------------------------------------

/**
 * The predator's cycle: a lightning flash (eye shut), the open eye (the only time it can be
 * popped), then the eye shut again as the next flash charges.
 */
export const THUNDERCAP = {
  cycle: 160,
  flash: 30,
  open: 70,
  /** The eye's hit box: half-width and half-height around it. */
  eyeW: 15,
  eyeH: 11,
  points: 2000,
} as const

/** Where in its cycle the Thundercap is at tick `t`. */
export function thundercapPhase(t: number): 'flash' | 'open' | 'shut' {
  const at = ((t % THUNDERCAP.cycle) + THUNDERCAP.cycle) % THUNDERCAP.cycle
  if (at < THUNDERCAP.flash) return 'flash'
  if (at < THUNDERCAP.flash + THUNDERCAP.open) return 'open'
  return 'shut'
}

// --- the Jousting Party -------------------------------------------------------------------------

export type PartyMode = 'tourney' | 'coop' | 'versus'

export const PARTY_MODES: ReadonlyArray<{
  id: PartyMode
  name: string
  about: string
  minSeats: number
}> = [
  { id: 'coop', name: 'CO-OP', about: 'FLY TOGETHER, NEVER BONK', minSeats: 2 },
  {
    id: 'versus',
    name: 'VERSUS',
    about: 'MOST BONKS IN 3 MINUTES',
    minSeats: 2,
  },
]

/** The team bonus each clean co-op wave pays per seat (the Team wave pays WAVE_TYPES.team). */
export const TEAM_BONUS = 1000
/** A knocked co-op rider curls up this long (a teammate's scoop wakes them at once). */
export const KNOCK_TICKS = 60 * 3
/** Last Butterfly Flapping: a bonked rider hatches back this long after. */
export const VERSUS_HATCH = 60 * 5
/** The versus clock. */
export const VERSUS_TICKS = 60 * 180
/** Moths kept in the versus arena. */
export const VERSUS_MOTHS = 3
/** Shared butterflies for `seats` riders. */
export function partyLives(seats: number, start: number): number {
  return start + 2 * (Math.max(1, seats) - 1)
}
