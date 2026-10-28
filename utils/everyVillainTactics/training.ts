import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'

// The First Bell preview is intentionally a small, deterministic training rule set.
// Full elevation, directional cover, abilities and enemy AI are t-002/t-003.
export type Team = 'squad' | 'rival'
export type Mode = 'move' | 'fire'
export type Cell = { x: number; y: number }
export type Unit = Cell & {
  id: string
  identity: string
  team: Team
  hp: number
  maxHp: number
  moved: boolean
  fired: boolean
}
export type TrainingState = {
  units: Unit[]
  selected: string
  hover: Cell | null
  mode: Mode
  turn: number
  seed: number
  phase: 'active' | 'victory' | 'defeat'
  log: string
  events: string[]
}
export const WIDTH = 9
export const HEIGHT = 6
const WALLS = ['3,1', '3,2', '5,3']
const COVER = ['2,2', '2,4', '4,1', '4,4', '6,2', '6,4']

const key = (p: Cell) => p.x + ',' + p.y
export const boardCells: Cell[] = Array.from({ length: WIDTH * HEIGHT }, (_, n) => ({
  x: n % WIDTH,
  y: Math.floor(n / WIDTH),
}))
export function terrainAt(p: Cell): 'wall' | 'cover' | 'floor' {
  return WALLS.includes(key(p)) ? 'wall' : COVER.includes(key(p)) ? 'cover' : 'floor'
}
export function personFor(unit: Unit) {
  return IDENTITY_ARCS.find((person) => person.signature === unit.identity)!
}
export function aliasFor(unit: Unit) {
  return personFor(unit).hero.alias
}
export function isInside(p: Cell) {
  return p.x >= 0 && p.x < WIDTH && p.y >= 0 && p.y < HEIGHT
}
export function manhattan(a: Cell, b: Cell) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}
export function actorAt(state: TrainingState, point: Cell): Unit | undefined {
  return state.units.find((u) => u.hp > 0 && u.x === point.x && u.y === point.y)
}
export function walkDistance(state: TrainingState, from: Cell, to: Cell): number {
  if (!isInside(to) || terrainAt(to) === 'wall') return Infinity
  const visited = new Set([key(from)])
  const open = [{ ...from, steps: 0 }]
  for (let n = 0; n < open.length; n++) {
    const item = open[n]!
    if (item.x === to.x && item.y === to.y) return item.steps
    for (const next of [
      { x: item.x + 1, y: item.y },
      { x: item.x - 1, y: item.y },
      { x: item.x, y: item.y + 1 },
      { x: item.x, y: item.y - 1 },
    ]) {
      if (!isInside(next) || terrainAt(next) === 'wall' || visited.has(key(next))) continue
      const occupant = actorAt(state, next)
      if (occupant && key(next) !== key(to)) continue
      visited.add(key(next))
      open.push({ ...next, steps: item.steps + 1 })
    }
  }
  return Infinity
}
// Symmetric grid ray, including diagonal corner blockers.
export function lineClear(from: Cell, to: Cell): boolean {
  let x = from.x, y = from.y
  const dx = Math.abs(to.x - x), dy = Math.abs(to.y - y)
  const sx = x < to.x ? 1 : -1, sy = y < to.y ? 1 : -1
  let err = dx - dy
  while (x !== to.x || y !== to.y) {
    const oldX = x, oldY = y
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
    if (x === to.x && y === to.y) break
    if (terrainAt({ x, y }) === 'wall') return false
    if (x !== oldX && y !== oldY &&
        terrainAt({ x: oldX, y }) === 'wall' &&
        terrainAt({ x, y: oldY }) === 'wall') return false
  }
  return true
}
export type ShotPreview = {
  target: string
  hit: number
  range: number
  cover: number
  aim: number
  clear: boolean
}
export function previewShot(from: Cell, target: Unit): ShotPreview {
  const range = manhattan(from, target)
  const clear = range <= 6 && lineClear(from, target)
  const cover = terrainAt(target) === 'cover' ? 20 : 0
  const aim = 85
  return { target: target.id, range, cover, aim, clear,
    hit: clear ? Math.max(15, Math.min(95, aim - Math.max(0, range - 2) * 7 - cover)) : 0 }
}
export function trainingState(seed = 0x53a1b7): TrainingState {
  const placements: Array<[string, string, Team, number, number, number]> = [
    ['backdraft', 'accident-fire', 'squad', 0, 4, 4],
    ['priya', 'tech-genius', 'squad', 1, 5, 3],
    ['hattie', 'mutant-earth', 'squad', 0, 2, 5],
    ['pip', 'accident-air', 'rival', 7, 1, 3],
    ['vee', 'tech-fire', 'rival', 8, 3, 3],
    ['remy', 'magic-social', 'rival', 7, 4, 3],
  ]
  return {
    units: placements.map(([id, identity, team, x, y, hp]) => ({
      id, identity, team, x, y, hp, maxHp: hp, moved: false, fired: false,
    })),
    selected: 'backdraft', hover: null, mode: 'move', turn: 1,
    seed: seed >>> 0 || 1, phase: 'active',
    log: 'The rival patrol is guarding the auditorium. Select a card, move to cover, or line up a shot.',
    events: ['The bell rang twice. Nobody signed up for the second one.'],
  }
}
function roll(state: TrainingState) {
  // xorshift32; pure reproducible combat preview follows the same percentage.
  let x = state.seed >>> 0
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5
  state.seed = x >>> 0
  return (state.seed % 10000) / 100
}
export function selectedUnit(state: TrainingState) {
  return state.units.find((u) => u.id === state.selected && u.hp > 0 && u.team === 'squad')
}
export function availableMove(state: TrainingState, to: Cell) {
  const current = selectedUnit(state)
  if (!current || current.moved || actorAt(state, to) || state.phase !== 'active') return false
  return walkDistance(state, current, to) <= 3
}
export function moveSelected(state: TrainingState, to: Cell): boolean {
  if (!availableMove(state, to)) return false
  const unit = selectedUnit(state)!
  unit.x = to.x; unit.y = to.y; unit.moved = true
  state.hover = to
  state.log = aliasFor(unit) + ' advances into ' + (terrainAt(to) === 'cover' ? 'cover.' : 'position.')
  state.events.unshift(state.log)
  return true
}
export function fireSelected(state: TrainingState, target: Unit): boolean {
  const attacker = selectedUnit(state)
  if (!attacker || attacker.fired || target.team !== 'rival' || target.hp <= 0 ||
      state.phase !== 'active') return false
  const odds = previewShot(attacker, target)
  if (!odds.clear) return false
  attacker.fired = true
  const hit = roll(state) < odds.hit
  if (hit) target.hp = Math.max(0, target.hp - 2)
  state.log = aliasFor(attacker) + (hit ? ' lands a hit on ' : ' misses ') +
    aliasFor(target) + ' (' + odds.hit + '%).'
  state.events.unshift(state.log)
  if (state.units.every((u) => u.team !== 'rival' || u.hp <= 0)) {
    state.phase = 'victory'
    state.log = 'The rival squad stands down. What you call victory depends on whom you ask.'
  }
  return true
}
export function endTurn(state: TrainingState) {
  if (state.phase !== 'active') return
  const activeSquad = state.units.filter((u) => u.hp > 0 && u.team === 'squad')
  for (const rival of state.units.filter((u) => u.hp > 0 && u.team === 'rival')) {
    const target = [...activeSquad].filter((u) => u.hp > 0)
      .sort((a, b) => manhattan(a, rival) - manhattan(b, rival))
      .find((u) => previewShot(rival, u).hit > 0)
    if (!target) continue
    const odds = previewShot(rival, target)
    const landed = roll(state) < odds.hit
    if (landed) target.hp = Math.max(0, target.hp - 1)
    state.events.unshift(aliasFor(rival) + (landed ? ' hits ' : ' misses ') + aliasFor(target) + '.')
  }
  if (activeSquad.every((u) => u.hp <= 0)) {
    state.phase = 'defeat'
    state.log = 'The academy patrol is overwhelmed. Their story will not end here.'
  } else {
    state.turn++
    for (const unit of activeSquad) { unit.moved = false; unit.fired = false }
    const survivor = selectedUnit(state)
    if (!survivor) state.selected = activeSquad.find((u) => u.hp > 0)!.id
    state.log = 'Round ' + state.turn + ': the rival patrol has moved. Your squad has the initiative.'
    if (state.turn === 3) state.events.unshift('A fire alarm cuts through the gym. A second rescue call is coming.')
  }
  state.events = state.events.slice(0, 6)
}
