import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import {
  FIRST_BELL_MAP,
  chanceFrom,
  gridDistance,
  inside,
  lineOfSight,
  moveAP,
  nextRoll,
  pathDistance,
  prepareOverwatch,
  reachableCells,
  refreshTurn,
  resolveAttack,
  resolveOverwatch,
  takeCover,
  tileAt,
  type Chance,
  type Fighter,
  type Point,
  type Status,
} from './combat'

export type Team = 'squad' | 'rival'
export type Mode = 'move' | 'fire'
export type Cell = Point
export type Unit = Fighter & {
  identity: string
  team: Team
  maxHp: number
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
export type ShotPreview = Chance & { target: string }
export const WIDTH = FIRST_BELL_MAP.width
export const HEIGHT = FIRST_BELL_MAP.height
export const boardCells: Cell[] = Array.from({ length: WIDTH * HEIGHT }, (_, i) => ({
  x: i % WIDTH,
  y: Math.floor(i / WIDTH),
}))
export function terrainAt(p: Cell): 'wall' | 'cover' | 'floor' {
  const tile = tileAt(FIRST_BELL_MAP, p)
  return tile.wall ? 'wall' : tile.cover ? 'cover' : 'floor'
}
export const elevationAt = (p: Cell) => tileAt(FIRST_BELL_MAP, p).elevation
export function personFor(unit: Unit) {
  return IDENTITY_ARCS.find((person) => person.signature === unit.identity)!
}
export const aliasFor = (unit: Unit) => personFor(unit).hero.alias
export const isInside = (p: Cell) => inside(FIRST_BELL_MAP, p)
export const manhattan = gridDistance
export function actorAt(state: TrainingState, point: Cell): Unit | undefined {
  return state.units.find((u) => u.hp > 0 && u.x === point.x && u.y === point.y)
}
export const lineClear = (from: Cell, to: Cell) =>
  lineOfSight(FIRST_BELL_MAP, from, to)
export const walkDistance = (state: TrainingState, from: Cell, to: Cell) =>
  pathDistance(FIRST_BELL_MAP, state.units, from, to)
export function previewShot(
  from: Cell & { statuses?: readonly Status[] },
  target: Unit,
): ShotPreview {
  return { target: target.id, ...chanceFrom(FIRST_BELL_MAP, from, target) }
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
      id, identity, team, x, y, hp, maxHp: hp,
      moved: false, fired: false, ap: 2, overwatch: false, statuses: [],
    })),
    selected: 'backdraft',
    hover: null,
    mode: 'move',
    turn: 1,
    seed: seed >>> 0 || 1,
    phase: 'active',
    log: 'The rival patrol is guarding the auditorium. Select a card, move to cover, or line up a shot.',
    events: ['The bell rang twice. Nobody signed up for the second one.'],
  }
}
export function selectedUnit(state: TrainingState) {
  return state.units.find(u => u.id === state.selected && u.hp > 0 && u.team === 'squad')
}
export function availableMove(state: TrainingState, to: Cell) {
  const unit = selectedUnit(state)
  if (!unit || unit.moved || unit.ap < 1 || actorAt(state, to) ||
    state.phase !== 'active') return false
  return moveAP(walkDistance(state, unit, to)) <= unit.ap
}
function note(state: TrainingState, message: string) {
  state.log = message
  state.events.unshift(message)
  state.events = state.events.slice(0, 6)
}
function updateOutcome(state: TrainingState) {
  if (state.units.every(u => u.team !== 'rival' || u.hp <= 0)) {
    state.phase = 'victory'
    note(state, 'The rival squad stands down. What you call victory depends on whom you ask.')
  } else if (state.units.every(u => u.team !== 'squad' || u.hp <= 0)) {
    state.phase = 'defeat'
    note(state, 'The academy patrol is overwhelmed. Their story will not end here.')
  }
}
function triggerReactions(state: TrainingState, moved: Unit) {
  // Reactions happen before the mover gets their next action.
  for (const enemy of state.units.filter(u => u.team !== moved.team && u.hp > 0 && u.overwatch)) {
    const result = resolveOverwatch(state, FIRST_BELL_MAP, enemy, moved)
    if (!result) continue
    note(state, aliasFor(enemy) + (result.hit ? ' interrupts ' : ' misses ') +
      aliasFor(moved) + ' on overwatch (' + result.chance.hit + '%).')
    if (moved.hp <= 0) break
  }
  updateOutcome(state)
}
export function moveSelected(state: TrainingState, to: Cell): boolean {
  if (!availableMove(state, to)) return false
  const unit = selectedUnit(state)!
  const distance = walkDistance(state, unit, to)
  const cost = moveAP(distance)
  unit.ap -= cost
  unit.x = to.x
  unit.y = to.y
  unit.moved = true
  state.hover = to
  note(state, aliasFor(unit) + (cost === 2 ? ' dashes ' : ' advances ') +
    'into ' + (terrainAt(to) === 'cover' ? 'cover.' : 'position.') +
    ' (' + cost + ' AP)')
  triggerReactions(state, unit)
  if (unit.hp <= 0) state.selected = state.units.find(u => u.team === 'squad' && u.hp > 0)?.id ?? state.selected
  return true
}
export function fireSelected(state: TrainingState, target: Unit): boolean {
  const shooter = selectedUnit(state)
  if (!shooter || state.phase !== 'active') return false
  const result = resolveAttack(state, FIRST_BELL_MAP, shooter, target, 2)
  if (!result) return false
  note(state, aliasFor(shooter) + (result.hit ? ' hits ' : ' misses ') +
    aliasFor(target) + ' (' + result.chance.hit + '%).')
  updateOutcome(state)
  return true
}
export function overwatchSelected(state: TrainingState): boolean {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active' || !prepareOverwatch(unit)) return false
  note(state, aliasFor(unit) + ' holds a reaction shot for an enemy move (1 AP).')
  return true
}
export function hunkerSelected(state: TrainingState): boolean {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active' || !takeCover(unit)) return false
  note(state, aliasFor(unit) + ' hunkers down: incoming accuracy −15 until their next turn.')
  return true
}
function bestShot(state: TrainingState, shooter: Unit, from: Point = shooter) {
  return state.units
    .filter(u => u.team !== shooter.team && u.hp > 0)
    .map(target => ({ target, chance: chanceFrom(FIRST_BELL_MAP, { ...shooter, ...from }, target) }))
    .filter(choice => choice.chance.hit > 0)
    .sort((a,b) => b.chance.hit - a.chance.hit || a.target.hp - b.target.hp ||
      a.target.id.localeCompare(b.target.id))[0]
}
function enemyPlan(state: TrainingState, enemy: Unit) {
  let shot = bestShot(state, enemy)
  const positions = reachableCells(FIRST_BELL_MAP, state.units, enemy)
  const improvement = positions
    .filter(p => p.cost === 1)
    .map(p => ({ point: p, next: bestShot(state, enemy, p) }))
    .filter((p): p is typeof p & { next: NonNullable<typeof shot> } => !!p.next)
    .sort((a,b) => b.next.chance.hit - a.next.chance.hit ||
      b.point.y - a.point.y || a.point.x - b.point.x)[0]
  if (improvement && (improvement.next.chance.hit >= (shot?.chance.hit ?? 0) + 12 ||
      (!shot && improvement.next.chance.hit > 0))) {
    enemy.x = improvement.point.x
    enemy.y = improvement.point.y
    enemy.ap--
    enemy.moved = true
    triggerReactions(state, enemy)
    shot = bestShot(state, enemy)
  } else if (!shot && positions.length) {
    // When out of range, close distance by actual path rather than teleporting.
    const targets = state.units.filter(u => u.team === 'squad' && u.hp > 0)
    const move = positions
      .map(p => ({
        point: p,
        distance: Math.min(...targets.map(t => gridDistance(p, t))),
        cover: !!tileAt(FIRST_BELL_MAP, p).cover,
      }))
      .sort((a,b) => a.distance - b.distance ||
        Number(b.cover) - Number(a.cover) ||
        a.point.cost - b.point.cost || a.point.y - b.point.y || a.point.x - b.point.x)[0]
    if (move) {
      enemy.x = move.point.x
      enemy.y = move.point.y
      enemy.ap -= move.point.cost
      enemy.moved = true
      triggerReactions(state, enemy)
      shot = bestShot(state, enemy)
    }
  }
  if (enemy.hp <= 0 || state.phase !== 'active') return
  if (enemy.ap > 0 && shot) {
    const result = resolveAttack(state, FIRST_BELL_MAP, enemy, shot.target, 1)
    if (result) note(state, aliasFor(enemy) + (result.hit ? ' hits ' : ' misses ') +
      aliasFor(shot.target) + ' (' + result.chance.hit + '%).')
  }
  if (enemy.ap > 0 && !enemy.fired) {
    if (tileAt(FIRST_BELL_MAP, enemy).cover) takeCover(enemy)
    else prepareOverwatch(enemy)
  }
  updateOutcome(state)
}
export function endTurn(state: TrainingState) {
  if (state.phase !== 'active') return
  refreshTurn(state.units, 'rival')
  for (const enemy of state.units.filter(u => u.team === 'rival' && u.hp > 0)) {
    if (state.phase !== 'active') break
    enemyPlan(state, enemy)
  }
  if (state.phase !== 'active') return
  state.turn++
  refreshTurn(state.units, 'squad')
  if (!selectedUnit(state)) state.selected = state.units.find(u => u.team === 'squad' && u.hp > 0)!.id
  note(state, 'Round ' + state.turn + ': the rival patrol has acted. Your squad has the initiative.')
  if (state.turn === 3) state.events.unshift('A fire alarm cuts through the gym. A second rescue call is coming.')
  state.events = state.events.slice(0, 6)
}
