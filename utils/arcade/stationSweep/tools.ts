// /utils/arcade/stationSweep/tools.ts
//
// Station Sweep's cleaning tools as data (conductor kr-arcade/t-141). The classic's weapon pickups
// and grenades become cleaning gear. The Sweeper Beam is always on A; every other tool turns up in
// a canister when a floor sac pops, and Mop carries one at a time on B (B jumps while Mop carries
// none). A tool runs on charge: shots, grenades, blocks, or ticks of a held tool; when it runs dry
// Mop goes back to the beam alone. Tool Tanks from the Supply Locker fill each tool fuller.

import { RAMPS, type Ramp } from '../snes'

export type ToolId =
  'beam' | 'wide' | 'foam' | 'vac' | 'bubble' | 'zap' | 'steam' | 'shield'

/** The tools a canister can hold (everything but the beam Mop always has). */
export type PickupTool = Exclude<ToolId, 'beam'>

export type ToolDef = {
  name: string
  /** Short HUD name. */
  short: string
  /** Charge a fresh canister holds. */
  charge: number
  /** How it spends charge: a shot per press, or a tick while B is held. */
  use: 'shot' | 'held'
  /** Ticks between shots, for a shot tool. */
  cooldown: number
  /** Likelihood of turning up in a canister. */
  weight: number
  /** First station it turns up on. */
  from: number
  /** One line for the guide. */
  does: string
  ramp: Ramp
}

export const TOOLS: Record<ToolId, ToolDef> = {
  beam: {
    name: 'SWEEPER BEAM',
    short: 'BEAM',
    charge: Infinity,
    use: 'shot',
    cooldown: 9,
    weight: 0,
    from: 1,
    does: 'A SWEEPS AT THE HEIGHT YOU AIM',
    ramp: RAMPS.teal,
  },
  wide: {
    name: 'WIDE NOZZLE',
    short: 'WIDE',
    charge: 24,
    use: 'shot',
    cooldown: 12,
    weight: 1.2,
    from: 1,
    does: 'THREE BEAMS: LOW, LEVEL AND HIGH',
    ramp: RAMPS.sky,
  },
  foam: {
    name: 'FOAM GUN',
    short: 'FOAM',
    charge: 14,
    use: 'shot',
    cooldown: 16,
    weight: 1.1,
    from: 1,
    does: 'GLUES A CRITTER TO THE FLOOR',
    ramp: RAMPS.cream,
  },
  vac: {
    name: 'VAC PACK',
    short: 'VAC',
    charge: 300,
    use: 'held',
    cooldown: 0,
    weight: 1,
    from: 1,
    does: 'HOLD B: PULLS CRITTERS INTO THE BIN',
    ramp: RAMPS.purple,
  },
  bubble: {
    name: 'BUBBLE GRENADES',
    short: 'BUBBLE',
    charge: 5,
    use: 'shot',
    cooldown: 30,
    weight: 0.9,
    from: 1,
    does: 'LOBBED: TRAPS CRITTERS IN BUBBLES',
    ramp: RAMPS.water,
  },
  zap: {
    name: 'ZAP BROOM',
    short: 'ZAP',
    charge: 18,
    use: 'shot',
    cooldown: 14,
    weight: 0.9,
    from: 2,
    does: 'A BOLT THAT SWEEPS RIGHT THROUGH',
    ramp: RAMPS.gold,
  },
  steam: {
    name: 'STEAM WAND',
    short: 'STEAM',
    charge: 240,
    use: 'held',
    cooldown: 0,
    weight: 0.9,
    from: 1,
    does: 'HOLD B: STUNS, CLEARS SPORES',
    ramp: RAMPS.steel,
  },
  shield: {
    name: 'SQUEEGEE SHIELD',
    short: 'SHIELD',
    charge: 8,
    use: 'held',
    cooldown: 0,
    weight: 0.8,
    from: 1,
    does: 'HOLD B: BLOCKS SPIT FROM THE FRONT',
    ramp: RAMPS.pink,
  },
}

export const PICKUP_TOOLS: readonly PickupTool[] = [
  'wide',
  'foam',
  'vac',
  'bubble',
  'zap',
  'steam',
  'shield',
]

/** The tool a canister holds on `station`, from one roll of the dice. */
export function pickTool(station: number, roll: number): PickupTool {
  const open = PICKUP_TOOLS.filter((t) => station >= TOOLS[t].from)
  const total = open.reduce((sum, t) => sum + TOOLS[t].weight, 0)
  let at = roll * total
  for (const t of open) {
    at -= TOOLS[t].weight
    if (at < 0) return t
  }
  return open[open.length - 1]!
}

/** Charge a canister holds with this many Tool Tanks fitted. */
export function toolCharge(tool: PickupTool, tanks: number): number {
  return Math.round(TOOLS[tool].charge * (1 + 0.5 * tanks))
}

/** Of popped floor sacs: the share that drop a repair kit, and the share that drop a tool. */
export const DROPS = { kit: 0.22, tool: 0.34 } as const
/** A dropped canister waits this long before it fades. */
export const TOOL_LIFE = 60 * 14

// --- tool tuning ---------------------------------------------------------------------------------

/** The Wide Nozzle's three beams, as heights above the floor. */
export const WIDE_HEIGHTS = [5, 15, 24] as const
/** Foam holds a critter this long (and a foamed gloop does not split). */
export const FOAM_TICKS = 60 * 4
/** The Vac Pack's reach, and how hard it pulls. */
export const VAC = { reach: 64, pull: 1.6, swallow: 12 } as const
/** A grenade's lob, its pop, and how long a bubble holds. */
export const BUBBLE = {
  vx: 2.4,
  vy: -3.2,
  gravity: 0.16,
  radius: 30,
  hold: 60 * 4,
  /** A bubble floats with its middle this high above the floor: a standing beam pops it. */
  floatTo: 22,
} as const
/** The Zap Broom's bolt does this much per critter it passes through. */
export const ZAP_DAMAGE = 2
/** The Steam Wand's cone, its stun, and how often it scalds a puffer down. */
export const STEAM = {
  reach: 46,
  stun: 60 * 2,
  biterStun: 60 * 3,
  deflateEvery: 20,
} as const
