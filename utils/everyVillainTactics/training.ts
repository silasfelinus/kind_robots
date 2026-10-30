import { IDENTITY_ARCS } from '~/utils/cometAcademy/identityArcs'
import { henchmanForVillain } from '~/utils/cometAcademy/villainHenchmen'
import { campaignStagesFor } from '~/utils/cometAcademy/identityCampaignStages'
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
import {
  chooseFireSpread,
  fieldMap,
  incomingSpawns,
  initialField,
  inZone,
  isWaterLive,
  rulesFor,
  shoveTarget,
  waveUnitSeed,
  type FieldState,
  type StageRules,
} from './stageRules'
import {
  applyTacticalProfile,
  bestPowerPlay,
  previewPower,
  powerTargets,
  tacticFor,
  tickPowerCooldowns,
  usePower,
  type PowerPreview,
  type TacticalRole,
} from './powers'

export type Team = 'squad' | 'rival'
export type Mode = 'move' | 'fire' | 'power'
export type Cell = Point
export type Unit = Fighter & {
  identity: string
  team: Team
  maxHp: number
  henchmanName?: string
  henchmanType?: 'burrow' | 'phase' | 'windup'
  burrowTarget?: Cell | null
  /** Clock-face exit a teleporting ronin will phase into next turn. */
  phaseTarget?: Cell | null
  phaseVictim?: string | null
  /** A wind-up toy that just stamped must rewind its key for a turn. */
  windupRewinding?: boolean
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
  /** Heroes carry a tactical role and one signature active (see powers.ts).
   * Henchmen, lieutenants and older saves leave these unset. */
  role?: TacticalRole
  power?: SignaturePowerId
  powerCooldown?: number
  powerSpent?: boolean
}
export type Civilian = {
  id: string
  name: string
  x: number
  y: number
  status: 'waiting' | 'rescued' | 'lost'
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
  /** One-shot triggers that already fired, so a reload never replays them.
   * Optional because Prom of Doom battles saved before it lack the field. */
  fired?: string[]
  /** One-shot bystanders; absent for battles without an evacuation goal. */
  civilians?: Civilian[]
  /** Live studio rules (props, hazards, waves, victory) copied from the
   * stage, and their runtime state. Absent for battles without them. */
  rules?: StageRules
  field?: FieldState
  /** Story flags set by authored scene choices (see sceneGraph). */
  flags?: string[]
  impact: {
    attacker: string
    target: string
    hit: boolean
    serial: number
  } | null
}
export type ShotPreview = Chance & { target: string }
/** Every trigger id a save may record as already fired. */
export const KNOWN_TRIGGERS: readonly string[] = [
  'fire-alarm',
  'story:arrival',
  'story:alarm',
  'story:reckoning',
  'story:victory',
  'story:defeat',
]
export function recordTrigger(state: TrainingState, id: string) {
  if (state.fired && !state.fired.includes(id)) state.fired.push(id)
}
/** Picnic Panic's scene triggers fire only in Picnic Panic; the same
 * burrowers and civilians appear in other stages without its scenes. */
function picnicTrigger(state: TrainingState, id: string) {
  if (state.fired?.includes('picnic:opening')) recordTrigger(state, id)
}
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
/** Rival shooters that could fire on `unit` if it stood at `point`, using the
 * exact shot formula. Telegraphed attackers (wind-up toys, lieutenants) are
 * excluded because their warnings are drawn on the board separately. */
export function exposureAt(
  state: TrainingState,
  unit: Unit,
  point: Cell,
): Array<Chance & { shooter: string }> {
  return state.units
    .filter(
      (u) =>
        u.team !== unit.team &&
        u.hp > 0 &&
        u.henchmanType !== 'windup' &&
        !u.lieutenantName &&
        !u.signatureBoss,
    )
    .map((u) => ({
      shooter: u.id,
      ...chanceFrom(state.map, u, { ...unit, x: point.x, y: point.y }),
    }))
    .filter((shot) => shot.hit > 0)
    .sort((a, b) => b.hit - a.hit || a.shooter.localeCompare(b.shooter))
}
export type TrainingOptions = {
  /** Replace the first squad slot with this canonical hero. */
  lead?: string
  /** Apply hero roles and signature powers. Prom of Doom interludes opt out
   * so their saved battles and balance stay exactly as shipped. */
  roles?: boolean
}
export function trainingState(
  seed = 0x53a1b7,
  stage?: StageDraft,
  options: TrainingOptions = {},
): TrainingState {
  const state = baseTrainingState(seed, stage)
  fieldLackeyCrew(state, stage)
  if (stage?.civilians?.length)
    state.civilians = stage.civilians.map((c) => ({
      ...c,
      status: 'waiting' as const,
    }))
  if (stage?.scenes === 'picnic-panic') recordTrigger(state, 'picnic:opening')
  const rules = rulesFor(stage)
  if (stage && rules) {
    state.rules = rules
    state.field = initialField(rules)
    state.map = fieldMap(stage.map, rules, state.field)
    state.field.fireNext = chooseFireSpread(state.map, state.field)
  }
  const lead = state.units[0]!
  if (
    options.lead &&
    IDENTITY_ARCS.some((person) => person.signature === options.lead)
  )
    lead.identity = options.lead
  if (options.roles !== false)
    for (const unit of state.units)
      if (!unit.henchmanName && !unit.lieutenantName) applyTacticalProfile(unit)
  return state
}
/** Canonical one-hit crews fielded as the whole rival line-up. */
const LACKEY_CREWS: Partial<
  Record<
    NonNullable<StageDraft['encounter']>,
    { signature: SignaturePowerId; type: 'phase' | 'windup'; ranks: string[] }
  >
> = {
  'wombat-ronin': {
    signature: 'alien-discipline',
    type: 'phase',
    ranks: ['Ronin Apprentice', 'Ronin Initiate'],
  },
  'licensed-legends': {
    signature: 'accident-birthright',
    type: 'windup',
    ranks: ['Knockoff Mascot', 'Bootleg Mascot'],
  },
}
function fieldLackeyCrew(state: TrainingState, stage?: StageDraft) {
  const crew = stage?.encounter ? LACKEY_CREWS[stage.encounter] : undefined
  if (!crew) return
  const species = henchmanForVillain(crew.signature)
  const rivals = state.units.filter((unit) => unit.team === 'rival')
  rivals.forEach((unit, index) => {
    unit.identity = crew.signature
    unit.hp = species.hp
    unit.maxHp = species.hp
    unit.henchmanName =
      index === 0 ? species.captain : (crew.ranks[index - 1] ?? species.name)
    unit.henchmanType = crew.type
    if (crew.type === 'phase') {
      unit.phaseTarget = null
      unit.phaseVictim = null
    } else unit.windupRewinding = false
  })
  state.log =
    crew.type === 'phase'
      ? species.captain +
        '’s ' +
        species.name +
        ' tick in the shadows. Each marks a clock-face exit behind a hero, then phases through it next turn. Stand on the exit to jam the portal.'
      : species.captain +
        '’s ' +
        species.name +
        ' wind up and swarm. A mascot that starts its turn beside a hero stamps a trademark seal that locks their signature power for a turn.'
  state.events = [
    crew.type === 'phase'
      ? species.captain + ': Your cover faces the wrong way. It always does.'
      : species.captain +
        ': Every power on this floor is now licensed property!',
  ]
}
function baseTrainingState(seed: number, stage?: StageDraft): TrainingState {
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
    fired: [],
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
  return moveAP(walkDistance(state, unit, to), unit.mobility) <= unit.ap
}
function note(state: TrainingState, message: string) {
  state.log = message
  state.events.unshift(message)
  state.events = state.events.slice(0, 6)
}
const waitingCivilians = (state: TrainingState) =>
  (state.civilians ?? []).filter((c) => c.status === 'waiting')
/** Victory under the stage's live rules, or null. Survive and hold-zone are
 * decided at the end of each round in roundEnd. */
function ruleVictory(state: TrainingState, rules: StageRules): string | null {
  const v = rules.victory
  const rivalsDown = state.units.every((u) => u.team !== 'rival' || u.hp <= 0)
  const pending = rules.waves.some((wave) => wave.round > state.turn)
  if (v.kind === 'defeat-boss') {
    const boss = state.units.find((u) => u.id === v.unit)
    if (boss && boss.hp <= 0)
      return aliasFor(boss) + ' is down. The rest of their crew scatters.'
  }
  if (v.kind === 'rescue') {
    const rescued = (state.civilians ?? []).filter(
      (c) => c.status === 'rescued',
    ).length
    return rescued >= v.count
      ? 'Evacuation complete: ' + rescued + ' civilian(s) are safe.'
      : null
  }
  if (v.kind === 'hold-zone') return null
  return rivalsDown && !pending
    ? 'The rival squad stands down. What you call victory depends on whom you ask.'
    : null
}
function updateOutcome(state: TrainingState) {
  const civilians = state.civilians ?? []
  const rules = state.rules
  const rescue = rules?.victory.kind === 'rescue' ? rules.victory : null
  const won = rules ? ruleVictory(state, rules) : null
  if (civilians.length && civilians.every((c) => c.status === 'lost')) {
    state.phase = 'defeat'
    note(state, 'Every family was pulled under. The picnic is lost.')
  } else if (
    rescue &&
    civilians.filter((c) => c.status !== 'lost').length < rescue.count
  ) {
    state.phase = 'defeat'
    note(state, 'Too many civilians were lost to finish the evacuation.')
  } else if (rules && won) {
    state.phase = 'victory'
    note(state, won)
  } else if (
    !rules &&
    state.units.every((u) => u.team !== 'rival' || u.hp <= 0)
  ) {
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
/** A shot at a unit sheltering behind a destructible prop chips the prop,
 * hit or miss. At 0 HP the prop breaks and its cover is gone for good. */
function strikeProp(state: TrainingState, defender: Point, cover: number) {
  if (!cover) return
  const prop = state.rules?.props.find(
    (p) => p.x === defender.x && p.y === defender.y,
  )
  if (prop) damageProp(state, prop.id, 'takes the shot')
}
function damageProp(state: TrainingState, id: string, cause: string) {
  const rules = state.rules
  const live = state.field?.props.find((p) => p.id === id)
  const prop = rules?.props.find((p) => p.id === id)
  if (!rules || !live || !prop || live.hp <= 0) return
  live.hp--
  if (live.hp > 0) {
    note(
      state,
      'The cover at column ' +
        (prop.x + 1) +
        ', row ' +
        (prop.y + 1) +
        ' ' +
        cause +
        ' (' +
        live.hp +
        ' left).',
    )
    return
  }
  const { cover: _broken, ...bare } = tileAt(state.map, prop)
  state.map = {
    ...state.map,
    tiles: { ...state.map.tiles, [prop.x + ',' + prop.y]: bare },
  }
  note(
    state,
    'The cover at column ' +
      (prop.x + 1) +
      ', row ' +
      (prop.y + 1) +
      ' shatters. That tile is open ground now.',
  )
}
function attack(
  state: TrainingState,
  attacker: Unit,
  defender: Unit,
  damage: number,
) {
  const result = resolveAttack(state, state.map, attacker, defender, damage)
  if (result) strikeProp(state, defender, result.chance.cover)
  return result
}
function triggerReactions(state: TrainingState, moved: Unit) {
  // Reactions happen before the mover gets their next action.
  for (const enemy of state.units.filter(
    (u) => u.team !== moved.team && u.hp > 0 && u.overwatch,
  )) {
    const result = resolveOverwatch(state, state.map, enemy, moved)
    if (!result) continue
    strikeProp(state, moved, result.chance.cover)
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
  const cost = moveAP(distance, unit.mobility)
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
  const result = attack(state, shooter, target, 2)
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

export function selectedPowerTargets(state: TrainingState): Cell[] {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active') return []
  return powerTargets(state, unit)
}
export function previewSelectedPower(
  state: TrainingState,
  target: Cell,
): PowerPreview | null {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active') return null
  return previewPower(state, unit, target)
}
function narratePower(
  state: TrainingState,
  user: Unit,
  preview: PowerPreview,
  hit: boolean,
  roll: number | null,
) {
  const touched = preview.effects.filter((e) => e.id !== user.id)
  const enemies = touched.filter((e) => e.side === 'enemy')
  for (const effect of enemies) {
    const target = state.units.find((u) => u.id === effect.id)!
    if (effect.damage || preview.chance !== null)
      recordImpact(state, user, target, hit)
  }
  const struck = hit ? enemies.filter((e) => e.damage).length : 0
  note(
    state,
    aliasFor(user) +
      ' uses ' +
      preview.power.name +
      (roll === null
        ? ''
        : (hit ? ' and connects' : ' and misses') +
          ' (' +
          preview.chance +
          '%)') +
      (struck ? ': ' + struck + ' rival(s) hit' : '') +
      (touched.length - enemies.length
        ? '. ' + (touched.length - enemies.length) + ' ally(s) helped'
        : '') +
      '.',
  )
}
/** The player's signature active, previewed by previewSelectedPower. */
export function useSelectedPower(state: TrainingState, target: Cell): boolean {
  const unit = selectedUnit(state)
  if (!unit || state.phase !== 'active') return false
  const result = usePower(state, unit, target)
  if (!result) return false
  narratePower(state, unit, result.preview, result.hit, result.roll)
  // A leap lands in view of rival overwatch like any other move.
  if (result.preview.power.targeting === 'leap') triggerReactions(state, unit)
  updateOutcome(state)
  state.mode = 'move'
  return true
}
export function powerFor(unit: Unit) {
  return unit.power ? tacticFor(unit.power) : undefined
}

/** Waiting civilians the selected squadmate can reach this action. */
export function rescueTargets(state: TrainingState): Civilian[] {
  const unit = selectedUnit(state)
  if (!unit || unit.ap < 1 || state.phase !== 'active') return []
  return waitingCivilians(state)
    .filter((c) => gridDistance(unit, c) <= 1)
    .sort((a, b) => a.id.localeCompare(b.id))
}
/** Spend 1 AP beside (or on) a civilian to walk them out of danger. */
export function rescueSelected(state: TrainingState): boolean {
  const unit = selectedUnit(state)
  const civilian = rescueTargets(state)[0]
  if (!unit || !civilian) return false
  unit.ap--
  civilian.status = 'rescued'
  note(state, aliasFor(unit) + ' evacuates ' + civilian.name + ' (1 AP).')
  if (!waitingCivilians(state).length && state.civilians?.length)
    picnicTrigger(state, 'picnic:all-rescued')
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
    picnicTrigger(state, 'picnic:first-emergence')
    // Any family beside the ring is pulled into the tunnel with it.
    for (const civilian of waitingCivilians(state))
      if (gridDistance(civilian, enemy) <= 1) {
        civilian.status = 'lost'
        picnicTrigger(state, 'picnic:civilian-lost')
        note(state, civilian.name + ' is dragged into the tunnel!')
      }
    updateOutcome(state)
    if (state.phase !== 'active') return true
    triggerReactions(state, enemy)
    if (enemy.hp <= 0 || state.phase !== 'active') return true
    const shot = bestShot(state, enemy)
    if (shot && enemy.ap > 0) {
      const result = attack(state, enemy, shot.target, 1)
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
      if (
        heroes.some((u) => gridDistance(u, point) === 1) ||
        waitingCivilians(state).some((c) => gridDistance(c, point) === 1)
      )
        targets.push(point)
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
/** Teleporting ronin: one turn marks an exit beside a hero on the side their
 * cover does not protect; the next turn phases there and strikes. A unit
 * standing on the exit jams it. Exits never move after they are shown. */
function phasePlan(state: TrainingState, enemy: Unit): boolean {
  if (enemy.henchmanType !== 'phase') return false
  const exit = enemy.phaseTarget
  if (exit) {
    const victim = state.units.find((u) => u.id === enemy.phaseVictim)
    enemy.phaseTarget = null
    enemy.phaseVictim = null
    if (actorAt(state, exit) || tileAt(state.map, exit).wall) {
      enemy.ap = 0
      note(
        state,
        aliasFor(enemy) +
          '’s portal watch jams: someone is standing on the exit.',
      )
      return true
    }
    enemy.x = exit.x
    enemy.y = exit.y
    enemy.ap--
    note(state, aliasFor(enemy) + ' phases out of the clock-face exit!')
    triggerReactions(state, enemy)
    if (enemy.hp <= 0 || state.phase !== 'active') return true
    if (victim && victim.hp > 0 && enemy.ap > 0) {
      const result = attack(state, enemy, victim, 1)
      if (result) {
        recordImpact(state, enemy, victim, result.hit)
        note(
          state,
          aliasFor(enemy) +
            (result.hit ? ' strikes ' : ' misses ') +
            aliasFor(victim) +
            ' from the flank (' +
            result.chance.hit +
            '%).',
        )
      }
    }
    updateOutcome(state)
    return true
  }
  const reserved = new Set(
    state.units
      .filter((u) => u.hp > 0)
      .flatMap((u) => [u.phaseTarget, u.burrowTarget])
      .filter((p): p is Cell => !!p)
      .map((p) => p.x + ',' + p.y),
  )
  const victim = state.units
    .filter((u) => u.team === 'squad' && u.hp > 0)
    .sort(
      (a, b) =>
        gridDistance(enemy, a) - gridDistance(enemy, b) ||
        a.id.localeCompare(b.id),
    )[0]
  if (!victim) return false
  const exits = [
    { x: victim.x + 1, y: victim.y },
    { x: victim.x - 1, y: victim.y },
    { x: victim.x, y: victim.y + 1 },
    { x: victim.x, y: victim.y - 1 },
  ]
    .filter(
      (p) =>
        inside(state.map, p) &&
        !tileAt(state.map, p).wall &&
        !actorAt(state, p) &&
        !reserved.has(p.x + ',' + p.y),
    )
    .map((p) => ({ p, cover: chanceFrom(state.map, p, victim).cover }))
    .sort(
      (a, b) =>
        a.cover - b.cover ||
        gridDistance(enemy, b.p) - gridDistance(enemy, a.p) ||
        a.p.y - b.p.y ||
        a.p.x - b.p.x,
    )
  const chosen = exits[0]?.p
  if (!chosen) return false
  enemy.phaseTarget = chosen
  enemy.phaseVictim = victim.id
  enemy.ap = 0
  note(
    state,
    aliasFor(enemy) +
      ' sets a clock-face exit beside ' +
      aliasFor(victim) +
      ' at column ' +
      (chosen.x + 1) +
      ', row ' +
      (chosen.y + 1) +
      '. Stand on it to jam the portal.',
  )
  return true
}
/** Wind-up mascots never shoot. They swarm into the way; one that starts its
 * turn beside a powered hero stamps a seal locking that hero's signature
 * power through their next turn, then spends a turn rewinding its key. */
function windupPlan(state: TrainingState, enemy: Unit): boolean {
  if (enemy.henchmanType !== 'windup') return false
  if (enemy.windupRewinding) {
    enemy.windupRewinding = false
    enemy.ap = 0
    note(state, aliasFor(enemy) + ' rewinds its key. Its next stamp is coming.')
    return true
  }
  const mark = state.units
    .filter(
      (u) =>
        u.team === 'squad' &&
        u.hp > 0 &&
        u.power &&
        !u.statuses.includes('sealed') &&
        gridDistance(u, enemy) === 1,
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0]
  if (mark) {
    mark.statuses.push('sealed')
    enemy.windupRewinding = true
    enemy.ap = 0
    recordImpact(state, enemy, mark, true)
    note(
      state,
      aliasFor(enemy) +
        ' stamps a TRADEMARK seal on ' +
        aliasFor(mark) +
        ': their signature power is locked next turn. Basic actions still work.',
    )
    return true
  }
  const heroes = state.units.filter((u) => u.team === 'squad' && u.hp > 0)
  const move = reachableCells(state.map, state.units, enemy)
    .map((p) => ({
      p,
      distance: Math.min(...heroes.map((h) => gridDistance(p, h))),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.p.cost - b.p.cost ||
        a.p.y - b.p.y ||
        a.p.x - b.p.x,
    )[0]
  if (
    move &&
    move.distance < Math.min(...heroes.map((h) => gridDistance(enemy, h)))
  ) {
    enemy.x = move.p.x
    enemy.y = move.p.y
    enemy.ap -= move.p.cost
    enemy.moved = true
    note(state, aliasFor(enemy) + ' clatters into the way.')
    triggerReactions(state, enemy)
  }
  enemy.ap = 0
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
    for (const prop of state.rules?.props ?? [])
      if (Math.abs(prop.x - marked.x) <= 1 && Math.abs(prop.y - marked.y) <= 1)
        damageProp(state, prop.id, 'cracks in the quake')
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
/** Rival heroes weigh their signature power with the player's own preview
 * rules, and spend it only when it beats the plain one-damage shot. */
function aiPower(
  state: TrainingState,
  enemy: Unit,
  shot: ReturnType<typeof bestShot>,
): boolean {
  const play = bestPowerPlay(state, enemy)
  if (!play || play.score < (shot && !enemy.fired ? shot.chance.hit / 10 : 0))
    return false
  const result = usePower(state, enemy, play.target)
  if (!result) return false
  narratePower(state, enemy, result.preview, result.hit, result.roll)
  updateOutcome(state)
  return true
}
function enemyPlan(state: TrainingState, enemy: Unit) {
  if (
    signatureLieutenantPlan(state, enemy) ||
    lieutenantPlan(state, enemy) ||
    burrowPlan(state, enemy) ||
    phasePlan(state, enemy) ||
    windupPlan(state, enemy)
  )
    return
  let shot = bestShot(state, enemy)
  if (aiPower(state, enemy, shot)) {
    if (enemy.hp <= 0 || state.phase !== 'active') return
    shot = bestShot(state, enemy)
  }
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
  if (aiPower(state, enemy, shot)) {
    if (enemy.hp <= 0 || state.phase !== 'active') return
    shot = bestShot(state, enemy)
  }
  if (enemy.ap > 0 && shot) {
    const result = attack(state, enemy, shot.target, 1)
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
const cellKey = (p: Cell) => p.x + ',' + p.y
/** End-of-round ticks for live stage rules: hazards burn and shock whoever
 * stands in them, weak floors give way on their announced round, fire spreads
 * to the tile it marked a round earlier, and survive/hold objectives count. */
function roundEnd(state: TrainingState) {
  const rules = state.rules
  const field = state.field
  if (!rules || !field || state.phase !== 'active') return
  const round = state.turn
  const burning = new Set(field.fire.map(cellKey))
  const live = isWaterLive(round)
    ? new Set(rules.hazards.filter((h) => h.kind === 'water').map(cellKey))
    : new Set<string>()
  for (const unit of state.units.filter((u) => u.hp > 0)) {
    const fire = burning.has(cellKey(unit))
    if (!fire && !live.has(cellKey(unit))) continue
    unit.hp = Math.max(0, unit.hp - 1)
    unit.overwatch = false
    note(
      state,
      aliasFor(unit) +
        (fire
          ? ' is caught in the fire (1 damage).'
          : ' is shocked by the live water (1 damage).'),
    )
  }
  for (const prop of rules.props)
    if (burning.has(cellKey(prop))) damageProp(state, prop.id, 'burns')
  for (const hazard of rules.hazards) {
    if (
      hazard.kind !== 'collapse' ||
      hazard.round !== round ||
      field.collapsed.includes(hazard.id)
    )
      continue
    field.collapsed.push(hazard.id)
    state.map = {
      ...state.map,
      tiles: {
        ...state.map.tiles,
        [cellKey(hazard)]: { elevation: 0, wall: true },
      },
    }
    note(
      state,
      'The weak floor at column ' +
        (hazard.x + 1) +
        ', row ' +
        (hazard.y + 1) +
        ' gives way into rubble.',
    )
    const victim = actorAt(state, hazard)
    if (victim) {
      const blocked = new Set(state.units.filter((u) => u.hp > 0).map(cellKey))
      const landing = shoveTarget(state.map, hazard, blocked)
      if (landing) {
        victim.x = landing.x
        victim.y = landing.y
        victim.hp = Math.max(0, victim.hp - 1)
        note(state, aliasFor(victim) + ' scrambles clear (1 damage).')
      } else {
        victim.hp = 0
        note(state, aliasFor(victim) + ' falls with the floor.')
      }
    }
  }
  if (field.fireNext) {
    const next = field.fireNext
    const blocker = actorAt(state, next)
    if (blocker)
      note(state, aliasFor(blocker) + ' stamps out the spreading fire.')
    else if (!tileAt(state.map, next).wall) {
      field.fire.push({ x: next.x, y: next.y })
      note(
        state,
        'The fire spreads to column ' +
          (next.x + 1) +
          ', row ' +
          (next.y + 1) +
          '.',
      )
    }
  }
  field.fireNext = chooseFireSpread(state.map, field)
  updateOutcome(state)
  if (state.phase !== 'active') return
  const v = rules.victory
  if (v.kind === 'hold-zone') {
    const living = state.units.filter((u) => u.hp > 0 && inZone(rules, u))
    if (
      living.some((u) => u.team === 'squad') &&
      !living.some((u) => u.team === 'rival')
    ) {
      field.held++
      note(
        state,
        'The squad holds the zone (' + field.held + ' / ' + v.rounds + ').',
      )
    }
    if (field.held >= v.rounds) {
      state.phase = 'victory'
      note(state, 'The zone is secured. Nobody is moving the squad now.')
    }
  } else if (v.kind === 'survive' && round >= v.rounds) {
    state.phase = 'victory'
    note(
      state,
      'The squad outlasted the assault: ' + v.rounds + ' rounds survived.',
    )
  }
}
export function waveUnit(rules: StageRules, id: string): Unit | null {
  const match = /^wave(\d+)-(\d+)$/.exec(id)
  const seed = match
    ? waveUnitSeed(rules, Number(match[1]) - 1, Number(match[2]) - 1)
    : null
  if (!seed) return null
  return {
    id: seed.id,
    identity: seed.identity,
    team: 'rival',
    x: seed.x,
    y: seed.y,
    hp: seed.hp,
    maxHp: seed.hp,
    henchmanName: seed.henchmanName,
    henchmanType: seed.henchmanType,
    ...(seed.henchmanType === 'burrow'
      ? { burrowTarget: null }
      : seed.henchmanType === 'phase'
        ? { phaseTarget: null, phaseVictim: null }
        : { windupRewinding: false }),
    moved: false,
    fired: false,
    ap: 2,
    overwatch: false,
    statuses: [],
  }
}
/** Reinforcements arrive at the start of their round on the hatches shown a
 * round earlier. A unit standing on a hatch seals it for good. */
function arriveWaves(state: TrainingState) {
  const rules = state.rules
  const field = state.field
  if (!rules || !field || state.phase !== 'active') return
  rules.waves.forEach((wave, w) => {
    if (wave.round !== state.turn) return
    wave.spawns.forEach((spawn, s) => {
      const unit = waveUnit(rules, 'wave' + (w + 1) + '-' + (s + 1))!
      if (actorAt(state, spawn)) {
        field.sealed.push(unit.id)
        note(
          state,
          'A squadmate stands on the hatch at column ' +
            (spawn.x + 1) +
            ', row ' +
            (spawn.y + 1) +
            ': that reinforcement never arrives.',
        )
        return
      }
      state.units.push(unit)
      field.reinforced.push(unit.id)
      note(state, unit.henchmanName + ' arrives through the hatch!')
    })
  })
}
function waveWarning(state: TrainingState) {
  if (!state.rules || state.phase !== 'active') return
  const hatches = incomingSpawns(state.rules, state.turn).length
  if (hatches)
    note(
      state,
      'Reinforcements arrive next round at ' +
        hatches +
        ' marked hatch(es). Stand on a hatch to seal it.',
    )
}
export function endTurn(state: TrainingState) {
  if (state.phase !== 'active') return
  if (state.units.every((unit) => unit.team !== 'rival' || unit.hp <= 0)) {
    // Do not strand the player with 0 AP when the enemies have fallen but
    // a separate physical extraction objective remains incomplete.
    roundEnd(state)
    if (state.phase !== 'active') return
    state.turn++
    if (state.turnLimit !== null && state.turn > state.turnLimit) {
      state.phase = 'defeat'
      note(state, 'The objective expired before extraction.')
      return
    }
    refreshTurn(state.units, 'squad')
    tickPowerCooldowns(state.units, 'squad')
    arriveWaves(state)
    note(
      state,
      'The opposition is down. Finish securing the mission objective.',
    )
    waveWarning(state)
    return
  }
  clearSuppression(state.units, 'squad')
  refreshTurn(state.units, 'rival')
  tickPowerCooldowns(state.units, 'rival')
  for (const enemy of state.units.filter(
    (u) => u.team === 'rival' && u.hp > 0,
  )) {
    if (state.phase !== 'active') break
    enemyPlan(state, enemy)
  }
  if (state.phase !== 'active') return
  clearSuppression(state.units, 'rival')
  roundEnd(state)
  if (state.phase !== 'active') return
  state.turn++
  if (state.turnLimit !== null && state.turn > state.turnLimit) {
    state.phase = 'defeat'
    note(state, 'The mission timer expired before the squad could finish.')
    return
  }
  arriveWaves(state)
  refreshTurn(state.units, 'squad')
  tickPowerCooldowns(state.units, 'squad')
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
  waveWarning(state)
  if (state.turn === 3) {
    state.events.unshift(
      'A fire alarm cuts through the gym. A second rescue call is coming.',
    )
    recordTrigger(state, 'fire-alarm')
  }
  state.events = state.events.slice(0, 6)
}
