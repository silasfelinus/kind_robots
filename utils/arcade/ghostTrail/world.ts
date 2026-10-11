// /utils/arcade/ghostTrail/world.ts
//
// Zuzu: Ghost Trail's campaign data model (conductor kr-arcade t-015). The trail is a book of stages,
// each stage two or three authored acts, each act one long side-scrolling level: its ground and pits,
// ledges, solid blocks, moving platforms, hazards and wind, its crates and relic, its checkpoints,
// and the encounters waiting along it. The game reads acts; it never invents geometry.
//
// Encounters are finite and authored: a squad appears when Zuzu reaches its trigger, and every member
// has a stable id. A member that is put down stays down for the rest of the run, through deaths and
// checkpoint retries, so nothing can be farmed by dying or standing still.
//
// Everything here is plain data plus pure helpers, so tests and bots can read a stage without a canvas.

/** Which painted world an act is drawn in (stageArt themes). */
export type StageTheme =
  'town' | 'boneyard' | 'waterhole' | 'stormpass' | 'belltower' | 'abbey'

export type FoeKind =
  | 'spirit'
  | 'crow'
  | 'hyena'
  | 'gunslinger'
  | 'monk'
  | 'ghoul'
  | 'drowned'
  | 'leech'
  | 'harpy'
  | 'wraith'
  | 'imp'
  | 'acolyte'
  | 'shade'
  | 'sister'

export type BossId =
  'marshal' | 'devil' | 'bull' | 'ferryman' | 'matriarch' | 'heretic' | 'abbess'

export type Holding = 'poncho' | 'nugget' | 'gear' | 'heart'

/** A one-way ledge: land on it from above, jump up through it. */
export type Ledge = { x: number; y: number; w: number }

/** A solid block standing on the ground (or floating, with `y`): its top is walkable. */
export type Block = {
  x: number
  w: number
  h: number
  /** Top edge; omitted means standing on the ground (GROUND_Y - h). */
  y?: number
  look?: 'stone' | 'grave' | 'crate' | 'pillar' | 'rock'
}

/** A moving one-way platform that carries whoever stands on it. */
export type Mover = {
  x: number
  y: number
  w: number
  /** Travel from (x, y) by (dx, dy) and back, over `period` ticks; `phase` 0..1 offsets it. */
  dx: number
  dy: number
  period: number
  phase?: number
  look?: 'raft' | 'lift' | 'bell' | 'beam'
}

/** Ground that hurts: spikes and bone spurs, braziers' coals, the abbey's ritual fire. */
export type Hazard = {
  x: number
  w: number
  kind: 'spikes' | 'coals' | 'ritual'
  /** For timed hazards: active for `on` of every `period` ticks. */
  period?: number
  on?: number
}

/** A column of rising air (Storm Crow Pass): airborne Zuzu is lifted while inside it. */
export type Updraft = { x: number; w: number; top: number; lift: number }

/**
 * The Drowned Watering Hole's tide: the water line rises from `low` to `high` and back over
 * `period` ticks, with a warning before each rise. Below the line Zuzu wades (slowed); held
 * under too long he loses the poncho.
 */
export type Tide = { low: number; high: number; period: number }

export type SquadMember = {
  kind: FoeKind
  /** Absolute x in the act. */
  x: number
  /** For flyers, the flight line; walkers start on the ground or the ledge under them. */
  y?: number
  /** Ticks after the trigger before this one appears. */
  delay?: number
  /** Carries a bundle of gear (crows/harpies), or drops a heart when put down. */
  drops?: Holding
}

export type Encounter = {
  id: string
  /** The squad appears once Zuzu's x reaches this. */
  at: number
  squad: SquadMember[]
  /** Optional: hold the camera here until the squad is cleared (an ambush). */
  lock?: { from: number; to: number }
  /** Shown as a banner when it triggers. */
  title?: string
}

export type Secret = {
  id: string
  x: number
  y: number
  /** What the relic is called on the banner. */
  name: string
}

export type Act = {
  id: string
  /** Stage number (1..6) and act number within it. */
  stage: number
  act: number
  stageName: string
  actName: string
  theme: StageTheme
  length: number
  ground: Array<[number, number]>
  ledges: Ledge[]
  blocks: Block[]
  movers?: Mover[]
  hazards?: Hazard[]
  updrafts?: Updraft[]
  tide?: Tide
  crates: Array<{ x: number; holds: Holding }>
  encounters: Encounter[]
  /** Respawn points; the act start is always one. */
  checkpoints: number[]
  secrets: Secret[]
  /** Light background pressure: a few ambient foes earned only by progress (no farming). */
  ambient: FoeKind[]
  /** Seconds on the clock for the act. */
  seconds: number
  /** The act ends at a boss (arena at the end) or simply at its exit. */
  boss?: BossId
  /** Pre-written text shown on the act's title card. */
  intro: string[]
  /** A climb: the view scrolls up with Zuzu, and the tower's walls replace the far town. */
  vertical?: boolean
}

export type Stage = {
  stage: number
  name: string
  /** Book text between stages. */
  outro: string[]
}

// --- pure helpers --------------------------------------------------------------------------

/** Is there ground under x in this act? */
export function groundAt(act: Pick<Act, 'ground'>, x: number): boolean {
  return act.ground.some(([a, b]) => x >= a && x <= b)
}

/** A mover's position at `tick`. */
export function moverAt(m: Mover, tick: number): { x: number; y: number } {
  const t = (((tick / m.period + (m.phase ?? 0)) % 1) + 1) % 1
  const s = (1 - Math.cos(t * Math.PI * 2)) / 2
  return { x: m.x + m.dx * s, y: m.y + m.dy * s }
}

/** The top of a block. */
export function blockTop(b: Block, groundY: number): number {
  return b.y ?? groundY - b.h
}

/** Is a timed hazard burning at `tick`? */
export function hazardLive(h: Hazard, tick: number): boolean {
  if (!h.period || !h.on) return true
  return tick % h.period < h.on
}

/** The tide's water line at `tick` (y; larger is lower), and whether a rise is coming. */
export function tideAt(t: Tide, tick: number): { y: number; warning: boolean } {
  const phase = (tick % t.period) / t.period
  // Low for 40%, rise over 15%, high for 30%, fall over 15%.
  let k: number
  if (phase < 0.4) k = 0
  else if (phase < 0.55) k = (phase - 0.4) / 0.15
  else if (phase < 0.85) k = 1
  else k = 1 - (phase - 0.85) / 0.15
  const eased = (1 - Math.cos(k * Math.PI)) / 2
  return {
    y: t.low + (t.high - t.low) * eased,
    warning: phase > 0.3 && phase < 0.4,
  }
}

/** Stable id for a squad member. */
export function memberId(act: Act, enc: Encounter, index: number): string {
  return `${act.id}/${enc.id}/${index}`
}

/** Checkpoint to respawn at for a furthest-x reached: the last one at or behind it. */
export function checkpointFor(act: Act, reached: number): number {
  let best = 40
  for (const c of act.checkpoints) if (c <= reached && c > best) best = c
  return best
}
