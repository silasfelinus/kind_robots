// Live stage rules for studio battles: destructible props, ticking hazards,
// telegraphed reinforcement waves and flexible victory conditions. The rules
// are copied from the stage draft into the battle so the engine never needs
// the draft, and every runtime change lives in `FieldState`, which a save can
// rebuild and check. Nothing here rolls RNG: hazards and waves are fully
// telegraphed and deterministic.
import { henchmanForVillain } from '../cometAcademy/villainHenchmen'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import {
  gridDistance,
  inside,
  tileAt,
  type Cover,
  type Point,
  type TacticalMap,
  type Tile,
} from './combat'

/** A crate, desk or vending machine that gives all-round cover until broken. */
export type StageProp = {
  id: string
  x: number
  y: number
  cover: Cover
  hp: number
}
export type HazardKind = 'fire' | 'water' | 'collapse'
/** Fire burns and spreads; water is live on even rounds; a weak floor gives
 * way at the end of `round`. */
export type StageHazard = {
  id: string
  kind: HazardKind
  x: number
  y: number
  round?: number
}
export type WaveCrew = 'warren-wreckers' | 'wombat-ronin' | 'licensed-legends'
export type StageWave = { round: number; crew: WaveCrew; spawns: Point[] }
export type StageVictory =
  | { kind: 'defeat-all' }
  | { kind: 'survive'; rounds: number }
  | { kind: 'rescue'; count: number }
  | { kind: 'defeat-boss'; unit: string }
  | { kind: 'hold-zone'; rounds: number; cells: Point[] }
export type VictoryKind = StageVictory['kind']

export type StageRules = {
  props: StageProp[]
  hazards: StageHazard[]
  waves: StageWave[]
  victory: StageVictory
}
export type PropState = { id: string; hp: number }
export type FieldState = {
  props: PropState[]
  /** Burning tiles, including the authored origins. */
  fire: Point[]
  /** The tile fire spreads to at the end of this round, shown in advance. */
  fireNext: Point | null
  /** Weak floors that already gave way. */
  collapsed: string[]
  /** Reinforcement unit ids that arrived, and those whose hatch was blocked. */
  reinforced: string[]
  sealed: string[]
  /** Rounds the squad has held the zone (hold-zone victory). */
  held: number
}
/** Source-of-rules fields a stage draft may carry. */
export type RuleSource = {
  props?: StageProp[]
  activeHazards?: StageHazard[]
  waves?: StageWave[]
  victory?: StageVictory
}

export const FIRE_CAP = 8
export const VICTORY_LABELS: Record<VictoryKind, string> = {
  'defeat-all': 'Defeat every rival',
  survive: 'Survive the rounds',
  rescue: 'Evacuate civilians',
  'defeat-boss': 'Defeat the boss',
  'hold-zone': 'Hold the zone',
}
export const WAVE_CREWS: Record<
  WaveCrew,
  { signature: SignaturePowerId; type: 'burrow' | 'phase' | 'windup' }
> = {
  'warren-wreckers': { signature: 'accident-earth', type: 'burrow' },
  'wombat-ronin': { signature: 'alien-discipline', type: 'phase' },
  'licensed-legends': { signature: 'accident-birthright', type: 'windup' },
}

const key = (p: Point) => p.x + ',' + p.y
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y

/** Null when the stage uses none of the live rules (keeps old battles exact). */
export function rulesFor(stage?: RuleSource | null): StageRules | null {
  if (
    !stage ||
    (!stage.props?.length &&
      !stage.activeHazards?.length &&
      !stage.waves?.length &&
      (!stage.victory || stage.victory.kind === 'defeat-all'))
  )
    return null
  return JSON.parse(
    JSON.stringify({
      props: stage.props ?? [],
      hazards: stage.activeHazards ?? [],
      waves: stage.waves ?? [],
      victory: stage.victory ?? { kind: 'defeat-all' },
    }),
  ) as StageRules
}

export function initialField(rules: StageRules): FieldState {
  return {
    props: rules.props.map((p) => ({ id: p.id, hp: p.hp })),
    fire: rules.hazards
      .filter((h) => h.kind === 'fire')
      .map((h) => ({ x: h.x, y: h.y })),
    fireNext: null,
    collapsed: [],
    reinforced: [],
    sealed: [],
    held: 0,
  }
}

/** The battlefield as the rules and field state say it must look: intact
 * props add all-round cover, broken props leave bare floor, and collapsed
 * floors become impassable rubble that blocks sight. */
export function fieldMap(
  base: TacticalMap,
  rules: StageRules | null | undefined,
  field: FieldState | null | undefined,
): TacticalMap {
  if (!rules || !field) return base
  const tiles: Record<string, Tile> = { ...base.tiles }
  for (const prop of rules.props) {
    const hp = field.props.find((p) => p.id === prop.id)?.hp ?? 0
    const tile = tileAt(base, prop)
    const { cover: _old, ...rest } = tile
    tiles[key(prop)] =
      hp > 0
        ? {
            ...rest,
            cover: {
              north: prop.cover,
              south: prop.cover,
              east: prop.cover,
              west: prop.cover,
            },
          }
        : rest
  }
  for (const hazard of rules.hazards)
    if (hazard.kind === 'collapse' && field.collapsed.includes(hazard.id))
      tiles[key(hazard)] = { elevation: 0, wall: true }
  return { ...base, tiles }
}

export const isWaterLive = (round: number) => round % 2 === 0

/** Unit ids a wave will field, in spawn order. */
export const waveUnitId = (wave: number, slot: number) =>
  'wave' + (wave + 1) + '-' + (slot + 1)

export type WaveUnitSeed = {
  id: string
  identity: SignaturePowerId
  hp: number
  henchmanName: string
  henchmanType: 'burrow' | 'phase' | 'windup'
  x: number
  y: number
}
export function waveUnitSeed(
  rules: StageRules,
  wave: number,
  slot: number,
): WaveUnitSeed | null {
  const entry = rules.waves[wave]
  const spawn = entry?.spawns[slot]
  if (!entry || !spawn) return null
  const crew = WAVE_CREWS[entry.crew]
  const species = henchmanForVillain(crew.signature)
  return {
    id: waveUnitId(wave, slot),
    identity: crew.signature,
    hp: species.hp,
    henchmanName: species.name + ' reinforcement ' + (slot + 1),
    henchmanType: crew.type,
    x: spawn.x,
    y: spawn.y,
  }
}
/** Every wave unit id whose arrival round has been reached by `round`. */
export function dueWaveIds(rules: StageRules, round: number): string[] {
  return rules.waves.flatMap((wave, w) =>
    wave.round <= round ? wave.spawns.map((_, s) => waveUnitId(w, s)) : [],
  )
}
/** Waves arriving at the start of next round, for the warning markers. */
export function incomingSpawns(rules: StageRules, round: number): Point[] {
  return rules.waves
    .filter((wave) => wave.round === round + 1)
    .flatMap((wave) => wave.spawns)
}

/** The tile fire will spread to next, or null. Deterministic: the oldest
 * burning tile tries east, south, west, north; occupied tiles are skipped
 * at selection time but block the spread when it resolves. */
export function chooseFireSpread(
  map: TacticalMap,
  field: FieldState,
): Point | null {
  if (field.fire.length >= FIRE_CAP) return null
  const burning = new Set(field.fire.map(key))
  for (const from of field.fire)
    for (const d of [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ]) {
      const p = { x: from.x + d.x, y: from.y + d.y }
      if (inside(map, p) && !tileAt(map, p).wall && !burning.has(key(p)))
        return p
    }
  return null
}

/** Nearest free walkable tile to shove a unit off a collapsing floor. */
export function shoveTarget(
  map: TacticalMap,
  from: Point,
  blocked: ReadonlySet<string>,
): Point | null {
  const options: Point[] = []
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      const p = { x, y }
      if (
        gridDistance(p, from) === 1 &&
        !tileAt(map, p).wall &&
        !blocked.has(key(p))
      )
        options.push(p)
    }
  return options.sort((a, b) => a.y - b.y || a.x - b.x)[0] ?? null
}

export const inZone = (rules: StageRules, p: Point) =>
  rules.victory.kind === 'hold-zone' &&
  rules.victory.cells.some((cell) => same(cell, p))

/** Studio validation for the live-rule fields of a stage. */
export function ruleProblems(
  stage: RuleSource & {
    map: TacticalMap
    spawns: Array<Point & { id: string }>
    civilians?: Array<Point & { id: string }>
  },
): string[] {
  const issues: string[] = []
  const { map } = stage
  const walkable = (p: Point) =>
    !!p &&
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    inside(map, p) &&
    !tileAt(map, p).wall
  const spawnAt = (p: Point) => stage.spawns.some((s) => same(s, p))
  const civilianAt = (p: Point) =>
    (stage.civilians ?? []).some((c) => same(c, p))
  const ids = new Set<string>()
  const props = stage.props ?? []
  if (props.length > 8) issues.push('A stage can hold at most eight props.')
  for (const prop of props) {
    if (!walkable(prop)) issues.push('Props must stand on walkable ground.')
    if (!['half', 'full'].includes(prop.cover))
      issues.push('Props give half or full cover.')
    if (!Number.isInteger(prop.hp) || prop.hp < 1 || prop.hp > 3)
      issues.push('Props have 1 to 3 hit points.')
    if (!prop.id || ids.has(prop.id))
      issues.push('Each prop needs a unique id.')
    ids.add(prop.id)
  }
  if (new Set(props.map(key)).size !== props.length)
    issues.push('Two props cannot share a tile.')
  const hazards = stage.activeHazards ?? []
  if (hazards.length > 10)
    issues.push('A stage can hold at most ten live hazards.')
  for (const hazard of hazards) {
    if (!['fire', 'water', 'collapse'].includes(hazard.kind))
      issues.push('Unknown hazard.')
    if (!walkable(hazard)) issues.push('Hazards must be on walkable ground.')
    if (hazard.kind !== 'water' && (spawnAt(hazard) || civilianAt(hazard)))
      issues.push('Fire and weak floors cannot start under a unit.')
    if (
      hazard.kind === 'collapse' &&
      (!Number.isInteger(hazard.round) ||
        hazard.round! < 1 ||
        hazard.round! > 40)
    )
      issues.push('A weak floor gives way on round 1 to 40.')
    if (hazard.kind === 'collapse' && props.some((p) => same(p, hazard)))
      issues.push('A prop cannot stand on a weak floor.')
    if (!hazard.id || ids.has(hazard.id))
      issues.push('Each hazard needs a unique id.')
    ids.add(hazard.id)
  }
  if (new Set(hazards.map(key)).size !== hazards.length)
    issues.push('Two hazards cannot share a tile.')
  const waves = stage.waves ?? []
  if (waves.length > 3) issues.push('A stage can hold at most three waves.')
  for (const wave of waves) {
    if (!(wave.crew in WAVE_CREWS)) issues.push('Unknown reinforcement crew.')
    if (!Number.isInteger(wave.round) || wave.round < 2 || wave.round > 40)
      issues.push('Reinforcements arrive on round 2 to 40.')
    if (!Array.isArray(wave.spawns) || !wave.spawns.length)
      issues.push('A wave needs at least one spawn.')
    else if (wave.spawns.length > 3)
      issues.push('A wave holds at most three reinforcements.')
    else
      for (const spawn of wave.spawns)
        if (!walkable(spawn) || hazards.some((h) => same(h, spawn)))
          issues.push('Reinforcements must arrive on safe walkable ground.')
    if (
      Array.isArray(wave.spawns) &&
      new Set(wave.spawns.map(key)).size !== wave.spawns.length
    )
      issues.push('Two reinforcements cannot share a hatch.')
  }
  const victory = stage.victory
  if (victory) {
    const rounds = (n: number) => Number.isInteger(n) && n >= 1 && n <= 40
    if (victory.kind === 'survive' && !rounds(victory.rounds))
      issues.push('Survive 1 to 40 rounds.')
    else if (victory.kind === 'rescue') {
      const total = stage.civilians?.length ?? 0
      if (!total) issues.push('A rescue objective needs civilians.')
      else if (
        !Number.isInteger(victory.count) ||
        victory.count < 1 ||
        victory.count > total
      )
        issues.push('Rescue count must be between 1 and the civilians placed.')
    } else if (
      victory.kind === 'defeat-boss' &&
      !['pip', 'vee', 'remy'].includes(victory.unit)
    )
      issues.push('The boss must be one of the three rival spawns.')
    else if (victory.kind === 'hold-zone') {
      if (!rounds(victory.rounds)) issues.push('Hold the zone 1 to 40 rounds.')
      if (
        !Array.isArray(victory.cells) ||
        !victory.cells.length ||
        victory.cells.length > 6 ||
        !victory.cells.every(walkable) ||
        new Set(victory.cells.map(key)).size !== victory.cells.length
      )
        issues.push('A hold zone covers 1 to 6 walkable tiles.')
    } else if (
      !['defeat-all', 'survive', 'rescue', 'defeat-boss', 'hold-zone'].includes(
        victory.kind,
      )
    )
      issues.push('Unknown victory condition.')
  }
  return issues
}

/** One line for the HUD describing how this battle is won. */
export function victoryLine(
  rules: StageRules | null | undefined,
  field: FieldState | null | undefined,
  round: number,
): string | null {
  if (!rules) return null
  const v = rules.victory
  if (v.kind === 'survive')
    return 'Survive ' + Math.max(0, v.rounds - round + 1) + ' more round(s)'
  if (v.kind === 'hold-zone')
    return 'Hold the zone: ' + (field?.held ?? 0) + ' / ' + v.rounds + ' rounds'
  if (v.kind === 'rescue') return 'Evacuate ' + v.count + ' civilian(s)'
  if (v.kind === 'defeat-boss') return 'Defeat the marked boss'
  return rules.waves.length
    ? 'Defeat every rival, including reinforcements'
    : null
}
