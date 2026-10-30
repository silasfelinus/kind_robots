// Deterministic, renderer-independent grid rules for Every Villain Tactics.
// All combat participants, previews, AI and reactions use these same functions.
export type Point = { x: number; y: number }
export type Side = 'north' | 'south' | 'east' | 'west'
export type Cover = 'half' | 'full'
export type Status = 'guarded' | 'suppressed' | 'marked' | 'sealed'
/** Short weapons hit hard up close and fade fast; long weapons prefer distance
 * and lose accuracy point-blank. 'mid' is the original First Bell rifle curve. */
export type WeaponBand = 'short' | 'mid' | 'long'
export const WEAPON_BANDS: Readonly<
  Record<
    WeaponBand,
    { optimal: number; falloff: number; max: number; pointBlank: number }
  >
> = {
  short: { optimal: 1, falloff: 10, max: 4, pointBlank: 0 },
  mid: { optimal: 2, falloff: 7, max: 6, pointBlank: 0 },
  long: { optimal: 4, falloff: 4, max: 8, pointBlank: 15 },
}
/** Optional per-unit tactical profile. Every field defaults to the original
 * shared values, so older saves and Prom of Doom interludes keep their math. */
export type TacticalProfile = {
  aim?: number
  weapon?: WeaponBand
  /** Extra tiles of maximum range (gadget scopes); never changes falloff. */
  reach?: number
  /** Tiles per 1-AP move; a 2-AP dash covers twice this. Default 3. */
  mobility?: number
  /** Flat accuracy penalty applied to anyone shooting this unit. */
  defense?: number
}
export type Tile = {
  elevation: number
  wall?: boolean
  cover?: Partial<Record<Side, Cover>>
}
export type TacticalMap = {
  width: number
  height: number
  tiles: Readonly<Record<string, Tile>>
}
export type Fighter = Point &
  TacticalProfile & {
    id: string
    team: string
    hp: number
    ap: number
    moved: boolean
    fired: boolean
    overwatch: boolean
    statuses: Status[]
  }
export type Chance = {
  hit: number
  clear: boolean
  aim: number
  range: number
  rangePenalty: number
  cover: number
  flank: number
  elevation: number
  suppressed: number
  guarded: number
  /** Defender's evasive/armored profile; 0 for the original roster math. */
  defense: number
  /** Bonus against a target marked by an analysis power this turn. */
  marked: number
}
export type HitResult = {
  chance: Chance
  roll: number
  hit: boolean
  damage: number
}

export const FIRST_BELL_MAP: TacticalMap = {
  width: 9,
  height: 6,
  tiles: {
    '3,1': { elevation: 0, wall: true },
    '3,2': { elevation: 0, wall: true },
    '5,3': { elevation: 0, wall: true },
    '2,2': { elevation: 0, cover: { west: 'full', north: 'half' } },
    '2,4': { elevation: 0, cover: { west: 'half', north: 'half' } },
    '4,1': { elevation: 0, cover: { north: 'full', east: 'half' } },
    '4,4': { elevation: 0, cover: { south: 'half' } },
    '6,2': { elevation: 1, cover: { east: 'full', north: 'half' } },
    '6,4': { elevation: 0, cover: { east: 'half', south: 'half' } },
    '4,5': { elevation: 1 },
    '5,5': { elevation: 1 },
    '6,1': { elevation: 1 },
  },
}
const KEY = (p: Point) => p.x + ',' + p.y
const DEFAULT_TILE: Tile = { elevation: 0 }
export const inside = (map: TacticalMap, p: Point) =>
  Number.isInteger(p.x) &&
  Number.isInteger(p.y) &&
  p.x >= 0 &&
  p.x < map.width &&
  p.y >= 0 &&
  p.y < map.height

export function tileAt(map: TacticalMap, p: Point): Tile {
  return map.tiles[KEY(p)] ?? DEFAULT_TILE
}

export const gridDistance = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

function adjacent(p: Point): Point[] {
  return [
    { x: p.x + 1, y: p.y },
    { x: p.x - 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x, y: p.y - 1 },
  ]
}

export function pathDistance(
  map: TacticalMap,
  fighters: readonly Fighter[],
  start: Point,
  destination: Point,
): number {
  if (
    !inside(map, start) ||
    !inside(map, destination) ||
    tileAt(map, start).wall ||
    tileAt(map, destination).wall
  )
    return Infinity
  const occupied = new Set(
    fighters.filter((u) => u.hp > 0 && KEY(u) !== KEY(start)).map(KEY),
  )
  if (occupied.has(KEY(destination))) return Infinity
  const visited = new Set([KEY(start)])
  const queue = [{ ...start, length: 0 }]
  for (let index = 0; index < queue.length; index++) {
    const from = queue[index]!
    if (KEY(from) === KEY(destination)) return from.length
    for (const next of adjacent(from)) {
      if (
        !inside(map, next) ||
        visited.has(KEY(next)) ||
        occupied.has(KEY(next))
      )
        continue
      const tile = tileAt(map, next)
      if (
        tile.wall ||
        Math.abs(tile.elevation - tileAt(map, from).elevation) > 1
      )
        continue
      visited.add(KEY(next))
      queue.push({ ...next, length: from.length + 1 })
    }
  }
  return Infinity
}

// A walk of up to `mobility` tiles costs 1 AP; a dash of up to twice that
// costs both AP. The default mobility of 3 is the original 1-3 / 4-6 rule.
export function moveAP(steps: number, mobility = 3): number {
  if (steps < 1 || !Number.isFinite(steps) || steps > mobility * 2)
    return Infinity
  return steps <= mobility ? 1 : 2
}
export const dashRange = (unit: TacticalProfile) => (unit.mobility ?? 3) * 2
export function reachableCells(
  map: TacticalMap,
  fighters: readonly Fighter[],
  unit: Fighter,
) {
  const result: Array<Point & { steps: number; cost: number }> = []
  if (unit.hp <= 0 || unit.moved || unit.ap <= 0) return result
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const steps = pathDistance(map, fighters, unit, { x, y })
      const cost = moveAP(steps, unit.mobility)
      if (cost <= unit.ap) result.push({ x, y, steps, cost })
    }
  }
  return result
}

// Bresenham with a deliberate blocked-corner rule; intermediate high ground
// occludes a lower ray. The endpoints themselves never block their shot.
export function lineOfSight(map: TacticalMap, from: Point, to: Point): boolean {
  if (!inside(map, from) || !inside(map, to) || KEY(from) === KEY(to))
    return false
  const startZ = tileAt(map, from).elevation + 1.5
  const endZ = tileAt(map, to).elevation + 1.5
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const sx = from.x < to.x ? 1 : -1
  const sy = from.y < to.y ? 1 : -1
  let x = from.x,
    y = from.y,
    error = dx - dy
  while (x !== to.x || y !== to.y) {
    const oldX = x,
      oldY = y
    const twice = 2 * error
    if (twice > -dy) {
      error -= dy
      x += sx
    }
    if (twice < dx) {
      error += dx
      y += sy
    }
    if (x === to.x && y === to.y) break
    if (
      x !== oldX &&
      y !== oldY &&
      tileAt(map, { x: oldX, y }).wall &&
      tileAt(map, { x, y: oldY }).wall
    )
      return false
    const tile = tileAt(map, { x, y })
    const progress =
      Math.hypot(x - from.x, y - from.y) /
      Math.hypot(to.x - from.x, to.y - from.y)
    if (tile.wall || tile.elevation > startZ + (endZ - startZ) * progress)
      return false
  }
  return true
}

function attackEdges(from: Point, to: Point): Side[] {
  const dx = from.x - to.x,
    dy = from.y - to.y
  if (Math.abs(dx) > Math.abs(dy)) return [dx > 0 ? 'east' : 'west']
  if (Math.abs(dy) > Math.abs(dx)) return [dy > 0 ? 'south' : 'north']
  return [dx > 0 ? 'east' : 'west', dy > 0 ? 'south' : 'north']
}
function coverPenalty(map: TacticalMap, from: Point, to: Point) {
  const all = tileAt(map, to).cover
  if (!all) return { cover: 0, flank: 0 }
  const face = attackEdges(from, to)
  const penalty = face.reduce(
    (n, side) =>
      Math.max(n, all[side] === 'full' ? 40 : all[side] === 'half' ? 20 : 0),
    0,
  )
  // Flank rewards actually approaching an unprotected side, not open-ground shots.
  return { cover: penalty, flank: penalty === 0 ? 10 : 0 }
}

export type ChanceOptions = {
  /** Signature strikes add accuracy without hiding it from the breakdown. */
  aimBonus?: number
  /** A power's own reach replaces the weapon's maximum range. */
  maxRange?: number
  /** Dimensional powers may strike without a sightline. */
  ignoreLos?: boolean
}
// Uses only the supplied positions/status/profile and map; never consumes RNG.
export function chanceFrom(
  map: TacticalMap,
  attacker: Point & TacticalProfile & { statuses?: readonly Status[] },
  defender: Point & TacticalProfile & { statuses?: readonly Status[] },
  options: ChanceOptions = {},
): Chance {
  const range = gridDistance(attacker, defender)
  const band = WEAPON_BANDS[attacker.weapon ?? 'mid']
  const aim = (attacker.aim ?? 85) + (options.aimBonus ?? 0)
  const maxRange = options.maxRange ?? band.max + (attacker.reach ?? 0)
  const clear =
    range > 0 &&
    range <= maxRange &&
    (!!options.ignoreLos || lineOfSight(map, attacker, defender))
  const rangePenalty =
    Math.max(0, range - band.optimal) * band.falloff +
    (range <= 1 ? band.pointBlank : 0)
  const { cover, flank } = coverPenalty(map, attacker, defender)
  const elevation = Math.max(
    -20,
    Math.min(
      20,
      (tileAt(map, attacker).elevation - tileAt(map, defender).elevation) * 10,
    ),
  )
  const suppressed = attacker.statuses?.includes('suppressed') ? 15 : 0
  const guarded = defender.statuses?.includes('guarded') ? 15 : 0
  const defense = defender.defense ?? 0
  const marked = defender.statuses?.includes('marked') ? 20 : 0
  const hit = clear
    ? Math.max(
        5,
        Math.min(
          95,
          aim -
            rangePenalty -
            cover +
            flank +
            elevation -
            suppressed -
            guarded -
            defense +
            marked,
        ),
      )
    : 0
  return {
    hit,
    clear,
    aim,
    range,
    rangePenalty,
    cover,
    flank,
    elevation,
    suppressed,
    guarded,
    defense,
    marked,
  }
}

export function nextRoll(state: { seed: number }): number {
  let seed = state.seed >>> 0 || 1
  seed ^= seed << 13
  seed ^= seed >>> 17
  seed ^= seed << 5
  state.seed = seed >>> 0
  return state.seed % 10000
}

// 10000 equally indexed thresholds, so a shown 64% means exactly <6400.
export function resolveAttack(
  state: { seed: number },
  map: TacticalMap,
  attacker: Fighter,
  defender: Fighter,
  damage = 2,
): HitResult | null {
  const chance = chanceFrom(map, attacker, defender)
  if (
    attacker.hp <= 0 ||
    defender.hp <= 0 ||
    attacker.team === defender.team ||
    attacker.ap < 1 ||
    attacker.fired ||
    !chance.clear
  )
    return null
  attacker.ap -= 1
  attacker.fired = true
  const roll = nextRoll(state)
  const hit = roll < chance.hit * 100
  if (hit) {
    defender.hp = Math.max(0, defender.hp - damage)
    if (defender.hp > 0 && !defender.statuses.includes('suppressed')) {
      defender.statuses.push('suppressed')
    }
    defender.overwatch = false
  }
  return { chance, roll, hit, damage: hit ? damage : 0 }
}

export function takeCover(unit: Fighter): boolean {
  if (unit.hp <= 0 || unit.ap < 1 || unit.statuses.includes('guarded'))
    return false
  unit.ap--
  unit.statuses.push('guarded')
  return true
}
export function prepareOverwatch(unit: Fighter): boolean {
  if (unit.hp <= 0 || unit.ap < 1 || unit.fired) return false
  unit.ap--
  unit.fired = true
  unit.overwatch = true
  return true
}
// Overwatch reserves its AP when armed. Reactions get one attempt as movement
// occurs, share the exact displayed hit formula and consume RNG only for a shot.
export function resolveOverwatch(
  state: { seed: number },
  map: TacticalMap,
  watcher: Fighter,
  mover: Fighter,
): HitResult | null {
  if (
    !watcher.overwatch ||
    watcher.hp <= 0 ||
    mover.hp <= 0 ||
    watcher.team === mover.team
  )
    return null
  const chance = chanceFrom(map, watcher, mover)
  if (!chance.clear) return null
  watcher.overwatch = false
  const roll = nextRoll(state)
  const hit = roll < chance.hit * 100
  if (hit) {
    mover.hp = Math.max(0, mover.hp - 1)
    if (mover.hp > 0 && !mover.statuses.includes('suppressed'))
      mover.statuses.push('suppressed')
  }
  return { chance, roll, hit, damage: hit ? 1 : 0 }
}

// A fresh team's turn clears temporary penalties/guarding for that team only.
export function refreshTurn(fighters: readonly Fighter[], team: string) {
  for (const unit of fighters) {
    if (unit.team !== team || unit.hp <= 0) continue
    unit.ap = 2
    unit.moved = false
    unit.fired = false
    unit.overwatch = false
    unit.statuses = unit.statuses.filter(
      (status) => status === 'suppressed' || status === 'sealed',
    )
  }
}
// Suppression affects the victim's next acting turn, never disappearing
// before their attack. It expires only after they have had that turn.
export function clearSuppression(fighters: readonly Fighter[], team: string) {
  for (const unit of fighters) {
    if (unit.team === team)
      unit.statuses = unit.statuses.filter(
        (status) => status !== 'suppressed' && status !== 'sealed',
      )
  }
}
