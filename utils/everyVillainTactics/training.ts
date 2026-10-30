import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import { henchmanForVillain } from '~/utils/cometAcademy/villainHenchmen'
import { campaignStagesFor } from '~/utils/cometAcademy/identityCampaignStages'
import {
  signatureThreatCells,
  signatureThreatFor,
} from './signatureLieutenant'
import type { SignaturePowerId } from '~/utils/cometAcademy/specialPowers'
import {
  signatureCounterPoint,
  signatureThreatCells,
  signatureThreatFor,
} from './signatureLieutenant'
import {
  FIRST_BELL_MAP,
  chanceFrom,
  clearSuppression,
  gridDistance,
  inside,
  lineOfSight,
  moveAP,
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
  type TacticalMap,
} from './combat'
import type { StageDraft } from './studio'

export type Team = 'squad' | 'rival'
export type Mode = 'move' | 'fire'
export type Cell = Point
export type Unit = Fighter & {
  identity: string
  team: Team
  maxHp: number
  henchmanName?: string
  henchmanType?: 'burrow'
  burrowTarget?: Cell | null
  lieutenantName?: string
  /** The warning ring is visible for a whole player turn before seismic impact. */
  seismicTarget?: Cell | null
  seismicChargeHp?: number
  signatureBoss?: SignaturePowerId
  signatureTarget?: Cell | null
  signatureCounter?: Cell | null
  signatureChargeHp?: number
  signatureCooldown?: boolean
  /** The defector can unleash their signature pattern only once per mission. */
  signatureSupportUsed?: boolean
}
export type TrainingState = {
  map: TacticalMap
  stageId: string | null
  turnLimit: number | null
  units: Unit[]
  selected: string
  hover: Cell | null
  mode: Mode
  turn: number
  seed: number
  phase: 'active' | 'victory' | 'defeat'
  log: string
  events: string[]
  impact: {
    attacker: string
    target: string
    hit: boolean
    serial: number
  } | null
}
export type ShotPreview = Chance & { target: string }
export const WIDTH = FIRST_BELL_MAP.width
export const HEIGHT = FIRST_BELL_MAP.height
export const boardCells: Cell[] = Array.from(
  { length: WIDTH * HEIGHT },
  (_, i) => ({
    x: i % WIDTH,
    y: Math.floor(i / WIDTH),
  }),
)
export function terrainAt(
  p: Cell,
  map = FIRST_BELL_MAP,
): 'wall' | 'cover' | 'floor' {
  const tile = tileAt(map, p)
  return tile.wall ? 'wall' : tile.cover ? 'cover' : 'floor'
}
export const elevationAt = (p: Cell, map = FIRST_BELL_MAP) =>
  tileAt(map, p).elevation
export function personFor(unit: Unit) {
  return IDENTITY_ARCS.find((person) => person.signature === unit.identity)!
}
export const aliasFor = (unit: Unit) =>
  unit.lieutenantName ?? unit.henchmanName ?? personFor(unit).hero.alias
export const isInside = (p: Cell) => inside(FIRST_BELL_MAP, p)
export const manhattan = gridDistance
export function actorAt(state: TrainingState, point: Cell): Unit | undefined {
  return state.units.find((u) => u.hp > 0 && u.x === point.x && u.y === point.y)
}
export function displayUnitAt(
  state: TrainingState,
  point: Cell,
): Unit | undefined {
  return (
    actorAt(state, point) ??
    state.units.find((u) => u.hp === 0 && u.x === point.x && u.y === point.y)
  )
}
function recordImpact(
  state: TrainingState,
  attacker: Unit,
  target: Unit,
  hit: boolean,
) {
  state.impact = {
    attacker: attacker.id,
    target: target.id,
    hit,
    serial: (state.impact?.serial ?? 0) + 1,
  }
}
export const lineClear = (from: Cell, to: Cell) =>
  lineOfSight(FIRST_BELL_MAP, from, to)
export const walkDistance = (state: TrainingState, from: Cell, to: Cell) =>
  pathDistance(state.map, state.units, from, to)
export function previewShot(
  from: Cell & { statuses?: readonly Status[] },
  target: Unit,
  map = FIRST_BELL_MAP,
): ShotPreview {
  return { target: target.id, ...chanceFrom(map, from, target) }
}
export function trainingState(
  seed = 0x53a1b7,
  stage?: StageDraft,
): TrainingState {
  const placements: Array<[string, string, Team, number, number, number]> = [
    ['backdraft', 'accident-fire', 'squad', 0, 4, 4],
    ['priya', 'tech-genius', 'squad', 1, 5, 3],
    ['hattie', 'mutant-earth', 'squad', 0, 2, 5],
    ['pip', 'accident-air', 'rival', 7, 1, 3],
    ['vee', 'tech-fire', 'rival', 8, 3, 3],
    ['remy', 'magic-social', 'rival', 7, 4, 3],
  ]
  return {
    map: stage?.map ?? FIRST_BELL_MAP,
    stageId: stage?.id ?? null,
    turnLimit: stage?.turnLimit ?? null,
    units: placements.map(([id, identity, team, x, y, hp], index) => {
      const picnic = stage?.encounter === 'warren-wreckers'
      const quarry = stage?.encounter === 'quarry-lieutenant'
      const warren = team === 'rival' && (picnic || (quarry && index > 3))
      const boss = team === 'rival' && quarry && index === 3
      const crew = warren ? henchmanForVillain('accident-earth') : null
      const name =
        picnic && index === 3
          ? crew?.captain
          : quarry && index === 4
            ? crew?.captain
            : index === 4
              ? 'Warren Surveyor'
              : 'Warren Burrower'
      return {
        id,
        identity: warren || boss ? 'accident-earth' : identity,
        team,
        x: stage?.spawns.find((spawn) => spawn.id === id)?.x ?? x,
        y: stage?.spawns.find((spawn) => spawn.id === id)?.y ?? y,
        hp: warren
          ? 1
          : boss
            ? campaignStagesFor('accident-earth').lieutenant.hp
            : hp,
        maxHp: warren
          ? 1
          : boss
            ? campaignStagesFor('accident-earth').lieutenant.hp
            : hp,
        ...(warren
          ? {
              henchmanName: name,
              henchmanType: 'burrow' as const,
              burrowTarget: null,
            }
          : {}),
        ...(boss
          ? {
              lieutenantName:
                campaignStagesFor('accident-earth').lieutenant.name,
              seismicTarget: null,
              seismicChargeHp: 4,
            }
          : {}),
        moved: false,
        fired: false,
        ap: 2,
        overwatch: false,
        statuses: [],
      }
    }),
    selected: 'backdraft',
    hover: null,
    mode: 'move',
    turn: 1,
    seed: seed >>> 0 || 1,
    phase: 'active',
    log:
      stage?.encounter === 'quarry-lieutenant'
        ? 'Mags Hardpan guards the title auction with a four-hit-point seismic drum. Strike the drumbeat or leave the marked quake tiles. Foreman Thumpkin commands the one-hit Warren Wreckers.'
        : stage?.encounter === 'warren-wreckers'
          ? 'Foreman Thumpkin and the Warren Wreckers interrupt the picnic. Watch for dust-ring warnings.'
          : 'The rival patrol is guarding the auditorium. Select a card, move to cover, or line up a shot.',
    events:
      stage?.encounter === 'quarry-lieutenant'
        ? [
            'Mags Hardpan: The Wreckers get a safe union contract, or nobody gets a deed!',
            'The missing downbeat exposes her resonant drum. A hit after a seismic warning cancels the next quake.',
          ]
        : stage?.encounter === 'warren-wreckers'
          ? [
              'Foreman Thumpkin: The picnic lawn is a disputed tunnel right-of-way!',
            ]
          : ['The bell rang twice. Nobody signed up for the second one.'],
    impact: null,
  }
}
export function selectedUnit(state: TrainingState) {
  return state.units.find(
    (u) => u.id === state.selected && u.hp > 0 && u.team === 'squad',
  )
}
export function availableMove(state: TrainingState, to: Cell) {
  const unit = selectedUnit(state)
  if (
    !unit ||
    unit.moved ||
    unit.ap < 1 ||
    actorAt(state, to) ||
    state.phase !== 'active'
  )
    return false
  return moveAP(walkDistance(state, unit, to)) <= unit.ap
}
function note(state: TrainingState, message: string) {
  state.log = message
  state.events.unshift(message)
  state.events = state.events.slice(0, 6)
}
function updateOutcome(state: TrainingState) {
  if (state.units.every((u) => u.team !== 'rival' || u.hp <= 0)) {
    state.phase = 'victory'
    note(
      state,
      'The rival squad stands down. What you call victory depends on whom you ask.',
    )
  } else if (state.units.every((u) => u.team !== 'squad' || u.hp <= 0)) {
    state.phase = 'defeat'
    note(
      state,
      'The academy patrol is overwhelmed. Their story will not end here.',
    )
  }
}
function triggerReactions(state: TrainingState, moved: Unit) {
  // Reactions happen before the mover gets their next action.
  for (const enemy of state.units.filter(
    (u) => u.team !== moved.team && u.hp > 0 && u.overwatch,
  )) {
    const result = resolveOverwatch(state, state.map, enemy, moved)
    if (!result) continue
    recordImpact(state, enemy, moved, result.hit)
    note(
      state,
      aliasFor(enemy) +
        (result.hit ? ' interrupts ' : ' misses ') +
        aliasFor(moved) +
        ' on overwatch (' +
        result.chance.hit +
        '%).',
    )
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
  note(
    state,
    aliasFor(unit) +
      (cost === 2 ? ' dashes ' : ' advances ') +
      'into ' +
      (terrainAt(to, state.map) === 'cover' ? 'cover.' : 'position.') +
      ' (' +
      cost +
      ' AP)',
  )
  triggerReactions(state, unit)
  if (unit.hp <= 0)
    state.selected =
      state.units.find((u) => u.team === 'squad' && u.hp > 0)?.id ??
      state.selected
  return true
}
export function fireSelected(state: TrainingState, target: Unit): boolean {
  const shooter = selectedUnit(state)
  if (!shooter || state.phase !== 'active') return false
  const result = resolveAttack(state, state.map, shooter, target, 2)
  if (!result) return false
  recordImpact(state, shooter, target, result.hit)
  note(
    state,
    aliasFor(shooter) +
      (result.hit ? ' hits ' : ' misses ') +
      aliasFor(target) +
      ' (' +
      result.chance.hit +
      '%).',
  )
  if (result.hit && target.signatureBoss && target.signatureTarget) {
    target.signatureTarget = null
    target.signatureCounter = null
    target.signatureCooldown = true
    note(
      state,
      aliasFor(shooter) +
        ' interrupts ' +
        aliasFor(target) +
        ' before the signature attack lands.',
    )
  }
  updateOutcome(state)
  return true
}
/** A former boss can be selected and commanded directly. Unlike a second
 * generic gun, the earned ally fires the real signature geometry against the
 * nearest visible opponent. Friendly fire is disabled by design, the preview
 * exactly matches damage, and the single charge never refreshes after turns. */
export function previewAlliedSignature(state: TrainingState) {
  const ally = selectedUnit(state)
  if (
    !ally ||
    ally.id !== 'allied-lieutenant' ||
    !ally.lieutenantName ||
    ally.signatureSupportUsed ||
    ally.ap < 2 ||
    state.phase !== 'active'
  )
    return null
  const targets = state.units
    .filter(
      (unit) =>
        unit.team === 'rival' &&
        unit.hp > 0 &&
        lineOfSight(state.map, ally, unit),
    )
    .sort(
      (a, b) =>
        gridDistance(ally, a) - gridDistance(ally, b) ||
        a.id.localeCompare(b.id),
    )
  const target = targets[0]
  if (!target) return null
  const threat = signatureThreatFor(ally.identity as SignaturePowerId)
  return {
    ally,
    target,
    cells: signatureThreatCells(
      state.map,
      ally.identity as SignaturePowerId,
      target,
    ),
    attack: threat.attack,
  }
}

export function useAlliedSignature(state: TrainingState): boolean {
  const preview = previewAlliedSignature(state)
  if (!preview) return false
  const { ally, target, cells, attack } = preview
  ally.ap -= 2
  ally.fired = true
  ally.signatureSupportUsed = true
  const threatened = new Set(cells.map((point) => point.x + ',' + point.y))
  const struck = state.units.filter(
    (unit) =>
      unit.team === 'rival' &&
      unit.hp > 0 &&
      threatened.has(unit.x + ',' + unit.y),
  )
  for (const unit of struck) {
    unit.hp = Math.max(0, unit.hp - 1)
    unit.overwatch = false
    recordImpact(state, ally, unit, true)
  }
  note(
    state,
    aliasFor(ally) +
      ' joins the fight with ' +
      attack +
      ' against ' +
      aliasFor(target) +
      ': ' +
      struck.length +
      ' rival(s) hit. Your squadmates are protected from the blast.',
  )
  updateOutcome(state)
  return true
}

export function overwatchSelected(state: TrainingState): boolean {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active' || !prepareOverwatch(unit)) return false
  note(
    state,
    aliasFor(unit) + ' holds a reaction shot for an enemy move (1 AP).',
  )
  return true
}
export function hunkerSelected(state: TrainingState): boolean {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active' || !takeCover(unit)) return false
  note(
    state,
    aliasFor(unit) +
      ' hunkers down: incoming accuracy −15 until their next turn.',
  )
  return true
}
function bestShot(state: TrainingState, shooter: Unit, from: Point = shooter) {
  return state.units
    .filter((u) => u.team !== shooter.team && u.hp > 0)
    .map((target) => ({
      target,
      chance: chanceFrom(state.map, { ...shooter, ...from }, target),
    }))
    .filter((choice) => choice.chance.hit > 0)
    .sort(
      (a, b) =>
        b.chance.hit - a.chance.hit ||
        a.target.hp - b.target.hp ||
        a.target.id.localeCompare(b.target.id),
    )[0]
}
function burrowPlan(state: TrainingState, enemy: Unit): boolean {
  if (enemy.henchmanType !== 'burrow') return false
  const to = enemy.burrowTarget
  if (to) {
    enemy.burrowTarget = null
    if (actorAt(state, to) || tileAt(state.map, to).wall) {
      note(
        state,
        aliasFor(enemy) +
          ' loses the marked tunnel: the emergence square was blocked.',
      )
      return true
    }
    enemy.x = to.x
    enemy.y = to.y
    enemy.ap--
    note(state, aliasFor(enemy) + ' bursts from the announced dust ring!')
    triggerReactions(state, enemy)
    if (enemy.hp <= 0 || state.phase !== 'active') return true
    const shot = bestShot(state, enemy)
    if (shot && enemy.ap > 0) {
      const result = resolveAttack(state, state.map, enemy, shot.target, 1)
      if (result) {
        recordImpact(state, enemy, shot.target, result.hit)
        note(
          state,
          aliasFor(enemy) +
            (result.hit ? ' hits ' : ' misses ') +
            aliasFor(shot.target) +
            ' after emerging (' +
            result.chance.hit +
            '%).',
        )
      }
    }
    updateOutcome(state)
    return true
  }

  const occupied = new Set(
    state.units.filter((u) => u.hp > 0).map((u) => u.x + ',' + u.y),
  )
  const reserved = new Set(
    state.units
      .filter((u) => u.hp > 0 && u.burrowTarget)
      .map((u) => u.burrowTarget!.x + ',' + u.burrowTarget!.y),
  )
  const heroes = state.units.filter((u) => u.team === 'squad' && u.hp > 0)
  const targets: Cell[] = []
  for (let y = 0; y < state.map.height; y++)
    for (let x = 0; x < state.map.width; x++) {
      const point = { x, y }
      const key = x + ',' + y
      if (
        occupied.has(key) ||
        reserved.has(key) ||
        tileAt(state.map, point).wall
      )
        continue
      if (heroes.some((u) => gridDistance(u, point) === 1)) targets.push(point)
    }
  targets.sort((a, b) => a.y - b.y || a.x - b.x)
  const target = targets[0]
  if (!target) return false
  enemy.burrowTarget = target
  enemy.ap = 0
  note(
    state,
    aliasFor(enemy) +
      ' digs toward column ' +
      (target.x + 1) +
      ', row ' +
      (target.y + 1) +
      '. The dust ring warns one turn in advance.',
  )
  return true
}
/** A fully telegraphed signature attack. The next rival turn must use the
 * exact saved target and cells, so a reload cannot reroll or retarget it. */
function signatureLieutenantPlan(state: TrainingState, enemy: Unit): boolean {
  const signature = enemy.signatureBoss
  if (!signature) return false
  const threat = signatureThreatFor(signature)
  if (enemy.signatureCooldown) {
    enemy.signatureCooldown = false
    enemy.signatureTarget = null
    enemy.signatureCounter = null
    enemy.ap = 0
    note(
      state,
      threat.name + ' staggers. The disrupted device needs a round to recover.',
    )
    return true
  }
  if (enemy.signatureTarget) {
    const target = enemy.signatureTarget
    const hit = enemy.hp < (enemy.signatureChargeHp ?? enemy.hp)
    enemy.signatureTarget = null
    enemy.signatureCounter = null
    enemy.signatureChargeHp = enemy.hp
    enemy.ap = 0
    if (hit) {
      enemy.signatureCooldown = true
      note(
        state,
        threat.name +
          ' loses control of ' +
          threat.attack +
          '. The warning clears.',
      )
      return true
    }
    const threatened = new Set(
      signatureThreatCells(state.map, signature, target).map(
        (p) => p.x + ',' + p.y,
      ),
    )
    const struck = state.units.filter(
      (unit) =>
        unit.team === 'squad' &&
        unit.hp > 0 &&
        threatened.has(unit.x + ',' + unit.y),
    )
    for (const unit of struck) {
      unit.hp = Math.max(0, unit.hp - 1)
      unit.overwatch = false
      recordImpact(state, enemy, unit, true)
    }
    note(
      state,
      threat.name +
        ' unleashes ' +
        threat.attack +
        ': ' +
        struck.length +
        ' allies struck. ' +
        threat.power,
    )
    updateOutcome(state)
    return true
  }
  const nearest = state.units
    .filter((unit) => unit.team === 'squad' && unit.hp > 0)
    .sort(
      (a, b) =>
        gridDistance(a, enemy) - gridDistance(b, enemy) ||
        a.id.localeCompare(b.id),
    )[0]
  if (!nearest) return true
  enemy.signatureTarget = { x: nearest.x, y: nearest.y }
  enemy.signatureCounter = signatureCounterPoint(state.map, signature, nearest)
  enemy.signatureChargeHp = enemy.hp
  enemy.ap = 0
  note(
    state,
    threat.name +
      ' charges ' +
      threat.attack +
      ' at (' +
      (nearest.x + 1) +
      ', ' +
      (nearest.y + 1) +
      '). ' +
      threat.counterVerb +
      ' at the marked station or shoot the lieutenant. ' +
      threat.counter,
  )
  return true
}

/** A real AP decision: get a living squadmate within one cell of the signal.
 * A legal disruption cancels the next attack and staggers the boss for one
 * enemy phase. No arbitrary chance roll is allowed. */
export function counterSignatureLieutenant(state: TrainingState): boolean {
  if (state.phase !== 'active') return false
  const ally = selectedUnit(state)
  const boss = state.units.find(
    (unit) => unit.signatureBoss && unit.hp > 0 && unit.signatureTarget,
  )
  if (
    !ally ||
    ally.ap < 1 ||
    !boss?.signatureCounter ||
    gridDistance(ally, boss.signatureCounter) > 1
  )
    return false
  ally.ap--
  boss.signatureTarget = null
  boss.signatureCounter = null
  boss.signatureCooldown = true
  note(
    state,
    aliasFor(ally) +
      ' disrupts ' +
      aliasFor(boss) +
      ': ' +
      signatureThreatFor(boss.signatureBoss!).counter,
  )
  return true
}

/** A named four-HP lieutenant is a different unit class from one-hit species.
 * Seismic warnings resolve only on her next turn, allowing a deliberate dodge
 * or a normal, previewed ranged hit to interrupt the resonant drum. */
function lieutenantPlan(state: TrainingState, enemy: Unit): boolean {
  if (!enemy.lieutenantName) return false
  if (enemy.seismicTarget) {
    const marked = enemy.seismicTarget
    const interrupted = enemy.hp < (enemy.seismicChargeHp ?? enemy.hp)
    enemy.seismicTarget = null
    enemy.seismicChargeHp = enemy.hp
    enemy.ap = 0
    if (interrupted) {
      note(
        state,
        aliasFor(enemy) +
          ' loses the downbeat: a hit on the exposed drumhead cancels the quake.',
      )
      return true
    }
    const struck = state.units.filter(
      (unit) =>
        unit.team === 'squad' &&
        unit.hp > 0 &&
        Math.abs(unit.x - marked.x) <= 1 &&
        Math.abs(unit.y - marked.y) <= 1,
    )
    for (const unit of struck) {
      unit.hp = Math.max(0, unit.hp - 1)
      unit.overwatch = false
      recordImpact(state, enemy, unit, true)
    }
    note(
      state,
      aliasFor(enemy) +
        ' cracks the announced quarry tiles (' +
        (marked.x + 1) +
        ', ' +
        (marked.y + 1) +
        '). ' +
        struck.length +
        ' squadmate(s) take 1 seismic damage.',
    )
    updateOutcome(state)
    return true
  }
  const target = state.units
    .filter((unit) => unit.team === 'squad' && unit.hp > 0)
    .sort(
      (a, b) =>
        gridDistance(enemy, a) - gridDistance(enemy, b) ||
        a.id.localeCompare(b.id),
    )[0]
  if (!target) return true
  enemy.seismicTarget = { x: target.x, y: target.y }
  enemy.seismicChargeHp = enemy.hp
  enemy.ap = 0
  note(
    state,
    aliasFor(enemy) +
      ' raises the granite drum. A 3×3 quake is marked around column ' +
      (target.x + 1) +
      ', row ' +
      (target.y + 1) +
      '. Move clear or land a normal hit on the drum before her next turn.',
  )
  return true
}
function enemyPlan(state: TrainingState, enemy: Unit) {
  if (
    signatureLieutenantPlan(state, enemy) ||
    lieutenantPlan(state, enemy) ||
    burrowPlan(state, enemy)
  )
    return
  let shot = bestShot(state, enemy)
  const positions = reachableCells(state.map, state.units, enemy)
  const improvement = positions
    .filter((p) => p.cost === 1)
    .map((p) => ({ point: p, next: bestShot(state, enemy, p) }))
    .filter((p): p is typeof p & { next: NonNullable<typeof shot> } => !!p.next)
    .sort(
      (a, b) =>
        b.next.chance.hit - a.next.chance.hit ||
        b.point.y - a.point.y ||
        a.point.x - b.point.x,
    )[0]
  if (
    improvement &&
    (improvement.next.chance.hit >= (shot?.chance.hit ?? 0) + 12 ||
      (!shot && improvement.next.chance.hit > 0))
  ) {
    enemy.x = improvement.point.x
    enemy.y = improvement.point.y
    enemy.ap--
    enemy.moved = true
    triggerReactions(state, enemy)
    shot = bestShot(state, enemy)
  } else if (!shot && positions.length) {
    // When out of range, close distance by actual path rather than teleporting.
    const targets = state.units.filter((u) => u.team === 'squad' && u.hp > 0)
    const move = positions
      .map((p) => ({
        point: p,
        distance: Math.min(...targets.map((t) => gridDistance(p, t))),
        cover: !!tileAt(state.map, p).cover,
      }))
      .sort(
        (a, b) =>
          a.distance - b.distance ||
          Number(b.cover) - Number(a.cover) ||
          a.point.cost - b.point.cost ||
          a.point.y - b.point.y ||
          a.point.x - b.point.x,
      )[0]
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
    const result = resolveAttack(state, state.map, enemy, shot.target, 1)
    if (result) {
      recordImpact(state, enemy, shot.target, result.hit)
      note(
        state,
        aliasFor(enemy) +
          (result.hit ? ' hits ' : ' misses ') +
          aliasFor(shot.target) +
          ' (' +
          result.chance.hit +
          '%).',
      )
    }
  }
  if (enemy.ap > 0 && !enemy.fired) {
    if (tileAt(state.map, enemy).cover) takeCover(enemy)
    else prepareOverwatch(enemy)
  }
  updateOutcome(state)
}
export function endTurn(state: TrainingState) {
  if (state.phase !== 'active') return
  if (state.units.every((unit) => unit.team !== 'rival' || unit.hp <= 0)) {
    // Do not strand the player with 0 AP when the enemies have fallen but
    // a separate physical extraction objective remains incomplete.
    state.turn++
    if (state.turnLimit !== null && state.turn > state.turnLimit) {
      state.phase = 'defeat'
      note(state, 'The objective expired before extraction.')
      return
    }
    refreshTurn(state.units, 'squad')
    note(
      state,
      'The opposition is down. Finish securing the mission objective.',
    )
    return
  }
  clearSuppression(state.units, 'squad')
  refreshTurn(state.units, 'rival')
  for (const enemy of state.units.filter(
    (u) => u.team === 'rival' && u.hp > 0,
  )) {
    if (state.phase !== 'active') break
    enemyPlan(state, enemy)
  }
  if (state.phase !== 'active') return
  clearSuppression(state.units, 'rival')
  state.turn++
  if (state.turnLimit !== null && state.turn > state.turnLimit) {
    state.phase = 'defeat'
    note(state, 'The mission timer expired before the squad could finish.')
    return
  }
  refreshTurn(state.units, 'squad')
  if (!selectedUnit(state))
    state.selected = state.units.find((u) => u.team === 'squad' && u.hp > 0)!.id
  const warnings = state.units.filter(
    (unit) => unit.hp > 0 && unit.burrowTarget,
  ).length
  const quake = state.units.find((unit) => unit.hp > 0 && unit.seismicTarget)
  const signature = state.units.find(
    (unit) => unit.hp > 0 && unit.signatureBoss && unit.signatureTarget,
  )
  note(
    state,
    signature
      ? 'Round ' +
          state.turn +
          ': ' +
          signatureThreatFor(signature.signatureBoss!).name +
          ' has marked ' +
          signatureThreatFor(signature.signatureBoss!).attack +
          '. Move out of danger, disrupt the station, or shoot the lieutenant.'
      : quake
        ? 'Round ' +
          state.turn +
          ': Mags Hardpan’s marked 3×3 seismic zone is live. Dodge or land a hit to cancel her downbeat.'
        : warnings
          ? 'Round ' +
            state.turn +
            ': ' +
            warnings +
            ' dust rings mark coming Warren Wrecker eruptions. Occupy a ring to seal its tunnel.'
          : 'Round ' +
            state.turn +
            ': the rival patrol has acted. Your squad has the initiative.',
  )
  if (state.turn === 3)
    state.events.unshift(
      'A fire alarm cuts through the gym. A second rescue call is coming.',
    )
  state.events = state.events.slice(0, 6)
}
