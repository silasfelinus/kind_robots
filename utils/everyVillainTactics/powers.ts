// Tactical roles and signature powers for the canonical 48 heroes.
// Roles come from affinity (what the power does in a fight) with an origin
// adjustment (where it comes from). Each hero's signature active is generated
// from the same origin × affinity grid so all 48 are mechanically distinct,
// while the First Bell cast keeps hand-authored identities on top.
// Everything here is deterministic: previews never consume RNG and use the
// exact rules that resolution applies.
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  SIGNATURE_POWERS,
  type PowerAffinityId,
  type PowerOriginId,
  type SignaturePowerId,
} from '../cometAcademy/specialPowers'
import {
  chanceFrom,
  gridDistance,
  inside,
  lineOfSight,
  nextRoll,
  tileAt,
  type Point,
  type Status,
  type TacticalMap,
  type TacticalProfile,
  type WeaponBand,
} from './combat'
import type { Unit } from './training'

export type TacticalRole =
  | 'striker'
  | 'skirmisher'
  | 'tank'
  | 'controller'
  | 'duelist'
  | 'sniper'
  | 'guardian'
  | 'support'
export type RoleProfile = Required<TacticalProfile> & {
  role: TacticalRole
  hp: number
}

export const ROLE_LABELS: Record<TacticalRole, string> = {
  striker: 'Striker',
  skirmisher: 'Skirmisher',
  tank: 'Tank',
  controller: 'Controller',
  duelist: 'Duelist',
  sniper: 'Sniper',
  guardian: 'Guardian',
  support: 'Support',
}
export const WEAPON_LABELS: Record<WeaponBand, string> = {
  short: 'Short range',
  mid: 'Mid range',
  long: 'Long range',
}

const AFFINITY_ROLES: Record<PowerAffinityId, RoleProfile> = {
  fire: {
    role: 'striker',
    weapon: 'mid',
    aim: 85,
    reach: 0,
    mobility: 3,
    hp: 4,
    defense: 0,
  },
  air: {
    role: 'skirmisher',
    weapon: 'short',
    aim: 85,
    reach: 0,
    mobility: 4,
    hp: 3,
    defense: 5,
  },
  earth: {
    role: 'tank',
    weapon: 'short',
    aim: 80,
    reach: 0,
    mobility: 2,
    hp: 5,
    defense: 0,
  },
  water: {
    role: 'controller',
    weapon: 'mid',
    aim: 80,
    reach: 0,
    mobility: 3,
    hp: 4,
    defense: 0,
  },
  discipline: {
    role: 'duelist',
    weapon: 'short',
    aim: 90,
    reach: 0,
    mobility: 4,
    hp: 4,
    defense: 5,
  },
  genius: {
    role: 'sniper',
    weapon: 'long',
    aim: 85,
    reach: 0,
    mobility: 2,
    hp: 3,
    defense: 0,
  },
  birthright: {
    role: 'guardian',
    weapon: 'mid',
    aim: 80,
    reach: 0,
    mobility: 3,
    hp: 5,
    defense: 5,
  },
  social: {
    role: 'support',
    weapon: 'mid',
    aim: 80,
    reach: 0,
    mobility: 3,
    hp: 3,
    defense: 0,
  },
}

/** Origin nudges one stat: mutants are tougher, tech carries scopes, magic
 * aims true, aliens move strangely far, psychics see the shot coming. */
export function roleProfileFor(signature: SignaturePowerId): RoleProfile {
  const [origin, affinity] = signature.split('-') as [
    PowerOriginId,
    PowerAffinityId,
  ]
  const base = AFFINITY_ROLES[affinity]
  if (!base) throw new Error('Unknown tactical signature: ' + signature)
  const profile = { ...base }
  if (origin === 'mutant') profile.hp += 1
  else if (origin === 'tech') profile.reach += 1
  else if (origin === 'magic') profile.aim += 5
  else if (origin === 'alien')
    profile.mobility = Math.min(4, profile.mobility + 1)
  else if (origin === 'psychic') profile.defense += 5
  return profile
}

export type PowerFamily =
  | 'blaze'
  | 'glide'
  | 'bulwark'
  | 'undertow'
  | 'strike'
  | 'analyze'
  | 'aegis'
  | 'rally'
export type PowerTargeting = 'line' | 'leap' | 'self' | 'enemy' | 'ally'
export type SignatureTactic = {
  id: SignaturePowerId
  hero: string
  /** Name shown on the action button. */
  name: string
  /** The canonical Prom of Doom power this active is drawn from. */
  source: string
  family: PowerFamily
  targeting: PowerTargeting
  role: TacticalRole
  ap: number
  /** Own turns before reuse; 0 means once per battle. */
  cooldown: number
  range: number
  /** Chebyshev spread around the primary cells. */
  radius: number
  aimBonus: number
  ignoresLos: boolean
  enemy: { damage: number; pull: number; suppress: boolean; mark: boolean }
  ally: { heal: number; guard: boolean; ap: number; cleanse: boolean }
  self: { heal: number; guard: boolean }
  rules: string
  flavor: string
  authored: boolean
}

const FAMILY: Record<
  PowerAffinityId,
  Pick<
    SignatureTactic,
    | 'family'
    | 'targeting'
    | 'range'
    | 'radius'
    | 'aimBonus'
    | 'enemy'
    | 'ally'
    | 'self'
  >
> = {
  fire: {
    family: 'blaze',
    targeting: 'line',
    range: 4,
    radius: 0,
    aimBonus: 0,
    enemy: { damage: 1, pull: 0, suppress: false, mark: false },
    ally: { heal: 0, guard: false, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  air: {
    family: 'glide',
    targeting: 'leap',
    range: 4,
    radius: 0,
    aimBonus: 0,
    enemy: { damage: 0, pull: 0, suppress: false, mark: false },
    ally: { heal: 0, guard: false, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  earth: {
    family: 'bulwark',
    targeting: 'self',
    range: 0,
    radius: 1,
    aimBonus: 0,
    enemy: { damage: 0, pull: 0, suppress: false, mark: false },
    ally: { heal: 0, guard: true, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  water: {
    family: 'undertow',
    targeting: 'enemy',
    range: 4,
    radius: 0,
    aimBonus: 0,
    enemy: { damage: 0, pull: 2, suppress: true, mark: false },
    ally: { heal: 0, guard: false, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  discipline: {
    family: 'strike',
    targeting: 'enemy',
    range: 1,
    radius: 0,
    aimBonus: 20,
    enemy: { damage: 2, pull: 0, suppress: false, mark: false },
    ally: { heal: 0, guard: false, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  genius: {
    family: 'analyze',
    targeting: 'enemy',
    range: 6,
    radius: 0,
    aimBonus: 0,
    enemy: { damage: 0, pull: 0, suppress: false, mark: true },
    ally: { heal: 0, guard: false, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  birthright: {
    family: 'aegis',
    targeting: 'ally',
    range: 3,
    radius: 0,
    aimBonus: 0,
    enemy: { damage: 0, pull: 0, suppress: false, mark: false },
    ally: { heal: 1, guard: true, ap: 0, cleanse: false },
    self: { heal: 0, guard: false },
  },
  social: {
    family: 'rally',
    targeting: 'self',
    range: 0,
    radius: 2,
    aimBonus: 0,
    enemy: { damage: 0, pull: 0, suppress: false, mark: false },
    ally: { heal: 0, guard: false, ap: 1, cleanse: true },
    self: { heal: 0, guard: false },
  },
}
const OFFENSIVE: readonly PowerFamily[] = ['blaze', 'undertow', 'strike']

type Draft = Omit<SignatureTactic, 'rules'>

/** Origin decides cost, recharge and one genuinely different rider. */
function applyOrigin(power: Draft, origin: PowerOriginId) {
  const selfCentered = power.targeting === 'self'
  if (origin === 'accident') {
    // Surge: unrepeatable and stronger, once per battle.
    power.cooldown = 0
    if (power.family === 'blaze') power.enemy.damage += 1
    else if (power.family === 'glide') power.range += 2
    else if (power.family === 'bulwark') power.ally.heal += 1
    else if (power.family === 'undertow') power.enemy.damage += 1
    else if (power.family === 'strike') power.enemy.damage += 1
    else if (power.family === 'analyze') power.radius += 1
    else if (power.family === 'aegis') power.ally.heal += 1
    else power.ally.guard = true
  } else if (origin === 'mutant') {
    power.cooldown = 2
    power.self.heal += 1
  } else if (origin === 'tech') {
    power.cooldown = 2
    if (selfCentered) power.radius += 1
    else power.range += 2
  } else if (origin === 'magic') {
    // Ritual: slower and costlier, but a wider hexed area.
    power.cooldown = 3
    power.ap = 2
    power.radius += 1
    power.enemy.suppress = true
    if (power.family === 'glide') power.enemy.damage += 1
  } else if (origin === 'alien') {
    power.cooldown = 2
    if (power.family === 'glide') {
      power.range += 1
      power.self.guard = true
    } else {
      power.ignoresLos = true
      power.enemy.mark = true
    }
  } else {
    power.cooldown = 2
    if (power.family === 'glide') power.radius += 1
    if (power.enemy.suppress) power.enemy.mark = true
    else power.enemy.suppress = true
    power.ally.cleanse = true
  }
}

type Authored = Partial<
  Omit<SignatureTactic, 'enemy' | 'ally' | 'self' | 'id'>
> & {
  enemy?: Partial<SignatureTactic['enemy']>
  ally?: Partial<SignatureTactic['ally']>
  self?: Partial<SignatureTactic['self']>
}
/** The First Bell cast are hand-authored rather than grid-generated. */
const FIRST_BELL_POWERS: Partial<Record<SignaturePowerId, Authored>> = {
  'accident-fire': {
    name: 'Backdraft Flare',
    range: 3,
    cooldown: 0,
    enemy: { damage: 2 },
    self: { guard: true },
    flavor:
      'Dez vents every degree he has been holding into a roaring three-tile corridor, then stands inside the heat shimmer it leaves behind.',
  },
  'accident-air': {
    name: 'Updraft Catch',
    range: 6,
    radius: 1,
    cooldown: 0,
    ally: { guard: true },
    flavor:
      'Pip rides a sudden column of air across the room and lands with her arms already out, catching whoever is beside her before they fall.',
  },
  'mutant-earth': {
    name: 'Heartbeat Quake',
    radius: 2,
    cooldown: 2,
    enemy: { suppress: true },
    self: { heal: 1 },
    flavor:
      'Hattie hears every heartbeat through the floor, stamps once, and the gym boards buckle under the rivals while her friends brace behind her.',
  },
  'tech-fire': {
    name: 'Thermite Cut',
    range: 2,
    cooldown: 2,
    ignoresLos: true,
    enemy: { damage: 2, mark: false },
    flavor:
      'Vee drags the gauntlet through brick and lockers alike: two tiles of white-hot slag that nothing in the way can hide behind.',
  },
  'tech-genius': {
    name: 'Adhesive Pad Volley',
    range: 7,
    radius: 1,
    cooldown: 2,
    enemy: { suppress: true, mark: true },
    flavor:
      'Dr. Frog lobs a spread of sticky rescue pads that glue a whole cluster of rivals in place and paint them bright for his team.',
  },
  'magic-social': {
    name: 'Grand Illusion',
    radius: 3,
    cooldown: 3,
    ap: 2,
    enemy: { suppress: true, mark: true },
    ally: { ap: 1, cleanse: true },
    flavor:
      'Remy throws a curtain of stage-light glamour over the whole floor: rivals chase phantoms while his friends get one free beat to act.',
  },
}

const VERB: Record<PowerFamily, string> = {
  blaze: 'channels a line attack',
  glide: 'repositions through the air',
  bulwark: 'braces the squad',
  undertow: 'drags a rival out of position',
  strike: 'lands a precision strike',
  analyze: 'exposes a rival',
  aegis: 'shields an ally',
  rally: 'rallies nearby allies',
}

function describe(power: Draft): string {
  const parts: string[] = [
    power.ap + ' AP',
    power.cooldown === 0
      ? 'once per battle'
      : 'recharges in ' + power.cooldown + ' turns',
  ]
  const area = power.radius
    ? ' and everything within ' +
      power.radius +
      ' tile' +
      (power.radius > 1 ? 's' : '')
    : ''
  const reach = power.ignoresLos ? ' (ignores walls and sightlines)' : ''
  if (power.targeting === 'line')
    parts.push(
      'Line of ' +
        power.range +
        ' tiles in a straight direction' +
        area +
        reach,
    )
  else if (power.targeting === 'leap')
    parts.push(
      'Leap to an empty tile within ' +
        power.range +
        ', ignoring paths' +
        (power.radius
          ? '; affects the landing zone within ' + power.radius
          : ''),
    )
  else if (power.targeting === 'self')
    parts.push('Centered on the hero, radius ' + power.radius)
  else if (power.targeting === 'enemy')
    parts.push('Target a rival within ' + power.range + area + reach)
  else parts.push('Target an ally or self within ' + power.range + area + reach)
  const foe: string[] = []
  if (power.enemy.damage)
    foe.push(
      power.enemy.damage +
        ' damage' +
        (power.family === 'strike'
          ? ' on a hit (+' + power.aimBonus + ' aim)'
          : ''),
    )
  if (power.enemy.pull)
    foe.push('pull ' + power.enemy.pull + ' toward the hero')
  if (power.enemy.suppress) foe.push('suppress')
  if (power.enemy.mark) foe.push('mark (+20 to hit)')
  if (foe.length) parts.push('Rivals: ' + foe.join(', '))
  const ally: string[] = []
  if (power.ally.heal) ally.push('heal ' + power.ally.heal)
  if (power.ally.guard) ally.push('guard')
  if (power.ally.ap) ally.push('+' + power.ally.ap + ' AP')
  if (power.ally.cleanse) ally.push('clear suppression')
  if (ally.length) parts.push('Allies: ' + ally.join(', '))
  const self: string[] = []
  if (power.self.heal) self.push('heal ' + power.self.heal)
  if (power.self.guard) self.push('guard')
  if (self.length) parts.push('Self: ' + self.join(', '))
  parts.push('Never harms allies')
  return parts.join(' · ') + '.'
}

function build(signature: SignaturePowerId): SignatureTactic {
  const [origin, affinity] = signature.split('-') as [
    PowerOriginId,
    PowerAffinityId,
  ]
  const source = SIGNATURE_POWERS.find((power) => power.id === signature)
  const person = IDENTITY_ARCS.find((arc) => arc.signature === signature)
  if (!source || !person)
    throw new Error('Unknown power signature: ' + signature)
  const family = FAMILY[affinity]
  const draft: Draft = {
    id: signature,
    hero: person.hero.alias,
    name: source.name,
    source: source.name,
    ...family,
    enemy: { ...family.enemy },
    ally: { ...family.ally },
    self: { ...family.self },
    role: roleProfileFor(signature).role,
    ap: 1,
    cooldown: 2,
    ignoresLos: false,
    flavor:
      person.hero.alias +
      ' ' +
      VERB[family.family] +
      ': ' +
      source.action +
      '.',
    authored: false,
  }
  applyOrigin(draft, origin)
  const authored = FIRST_BELL_POWERS[signature]
  if (authored) {
    const { enemy, ally, self, ...rest } = authored
    Object.assign(draft, rest, { authored: true })
    Object.assign(draft.enemy, enemy)
    Object.assign(draft.ally, ally)
    Object.assign(draft.self, self)
  }
  return { ...draft, rules: describe(draft) }
}

export const SIGNATURE_TACTICS: readonly SignatureTactic[] =
  SIGNATURE_POWERS.map((power) => build(power.id))
const BY_ID = new Map(SIGNATURE_TACTICS.map((power) => [power.id, power]))
export function tacticFor(signature: string): SignatureTactic | undefined {
  return BY_ID.get(signature as SignaturePowerId)
}

/** Copy a hero's role and power onto a unit. Health resets to the role. */
export function applyTacticalProfile(unit: Unit) {
  const profile = roleProfileFor(unit.identity as SignaturePowerId)
  unit.role = profile.role
  unit.weapon = profile.weapon
  unit.aim = profile.aim
  unit.reach = profile.reach
  unit.mobility = profile.mobility
  unit.defense = profile.defense
  unit.hp = profile.hp
  unit.maxHp = profile.hp
  unit.power = unit.identity as SignaturePowerId
  unit.powerCooldown = 0
  unit.powerSpent = false
}

/** At the start of a side's turn, each hero's recharge counts down by one. */
export function tickPowerCooldowns(units: readonly Unit[], team: string) {
  for (const unit of units)
    if (unit.team === team && (unit.powerCooldown ?? 0) > 0)
      unit.powerCooldown = unit.powerCooldown! - 1
}

export type PowerState = { map: TacticalMap; units: Unit[]; seed: number }
export type PowerEffect = {
  id: string
  side: 'self' | 'ally' | 'enemy'
  damage: number
  heal: number
  ap: number
  statuses: Status[]
  cleanse: boolean
  moveTo: Point | null
}
export type PowerPreview = {
  power: SignatureTactic
  user: string
  target: Point
  /** Every tile the power touches, shown on the board before committing. */
  cells: Point[]
  /** Hit chance for a rolled strike; null when the power cannot miss. */
  chance: number | null
  effects: PowerEffect[]
}
export type PowerResult = {
  preview: PowerPreview
  roll: number | null
  hit: boolean
}

const key = (p: Point) => p.x + ',' + p.y
const alive = (state: PowerState) => state.units.filter((u) => u.hp > 0)

export function powerBlocker(unit: Unit): string | null {
  const power = unit.power ? tacticFor(unit.power) : undefined
  if (!power) return 'No signature power'
  if (unit.hp <= 0) return 'Knocked out'
  if (unit.powerSpent) return 'Already used this battle'
  if ((unit.powerCooldown ?? 0) > 0)
    return 'Recharging: ' + unit.powerCooldown + ' turn(s)'
  if (unit.ap < power.ap) return 'Needs ' + power.ap + ' AP'
  if (OFFENSIVE.includes(power.family) && unit.fired)
    return 'Already attacked this turn'
  if (power.targeting === 'leap' && unit.moved) return 'Already moved this turn'
  return null
}

function lineCells(
  state: PowerState,
  power: SignatureTactic,
  from: Point,
  dir: Point,
): Point[] {
  const cells: Point[] = []
  for (let step = 1; step <= power.range; step++) {
    const p = { x: from.x + dir.x * step, y: from.y + dir.y * step }
    if (!inside(state.map, p)) break
    if (tileAt(state.map, p).wall) {
      if (power.ignoresLos) continue
      break
    }
    cells.push(p)
  }
  return cells
}
const DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/** Every legal target tile, in stable row-major order. */
export function powerTargets(state: PowerState, unit: Unit): Point[] {
  if (powerBlocker(unit)) return []
  const power = tacticFor(unit.power!)!
  const living = alive(state)
  let targets: Point[] = []
  if (power.targeting === 'self') targets = [{ x: unit.x, y: unit.y }]
  else if (power.targeting === 'line')
    targets = DIRECTIONS.flatMap((dir) => lineCells(state, power, unit, dir))
  else if (power.targeting === 'leap') {
    const occupied = new Set(living.map(key))
    for (let y = 0; y < state.map.height; y++)
      for (let x = 0; x < state.map.width; x++) {
        const p = { x, y }
        const d = gridDistance(unit, p)
        if (
          d >= 1 &&
          d <= power.range &&
          !occupied.has(key(p)) &&
          !tileAt(state.map, p).wall
        )
          targets.push(p)
      }
  } else {
    targets = living
      .filter((other) =>
        power.targeting === 'enemy'
          ? other.team !== unit.team
          : other.team === unit.team,
      )
      .filter(
        (other) =>
          gridDistance(unit, other) <= power.range &&
          (other.id === unit.id ||
            power.ignoresLos ||
            lineOfSight(state.map, unit, other)),
      )
      .filter((other) => power.targeting !== 'enemy' || other.id !== unit.id)
      .filter(
        (other) =>
          gridDistance(unit, other) >= (power.targeting === 'enemy' ? 1 : 0),
      )
      .map((other) => ({ x: other.x, y: other.y }))
  }
  return targets.sort((a, b) => a.y - b.y || a.x - b.x)
}

function spread(state: PowerState, cells: Point[], radius: number): Point[] {
  const seen = new Map<string, Point>()
  for (const cell of cells)
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        const p = { x: cell.x + dx, y: cell.y + dy }
        if (inside(state.map, p) && !tileAt(state.map, p).wall)
          seen.set(key(p), p)
      }
  return [...seen.values()].sort((a, b) => a.y - b.y || a.x - b.x)
}

function pullDestination(
  state: PowerState,
  user: Unit,
  target: Unit,
  steps: number,
): Point {
  const occupied = new Set(
    alive(state)
      .filter((u) => u.id !== target.id)
      .map(key),
  )
  let at = { x: target.x, y: target.y }
  for (let step = 0; step < steps; step++) {
    if (gridDistance(at, user) <= 1) break
    const dx = user.x - at.x
    const dy = user.y - at.y
    const next =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: at.x + Math.sign(dx), y: at.y }
        : { x: at.x, y: at.y + Math.sign(dy) }
    if (
      !inside(state.map, next) ||
      tileAt(state.map, next).wall ||
      occupied.has(key(next))
    )
      break
    at = next
  }
  return at
}

/** Pure preview: exactly what usePower will change, before committing. */
export function previewPower(
  state: PowerState,
  unit: Unit,
  target: Point,
): PowerPreview | null {
  if (
    !powerTargets(state, unit).some((p) => p.x === target.x && p.y === target.y)
  )
    return null
  const power = tacticFor(unit.power!)!
  const living = alive(state)
  let primary: Point[] = [target]
  let moveTo: Point | null = null
  let pulled: { id: string; to: Point } | null = null
  let chance: number | null = null
  if (power.targeting === 'line') {
    const dir = {
      x: Math.sign(target.x - unit.x),
      y: Math.sign(target.y - unit.y),
    }
    primary = lineCells(state, power, unit, dir)
  } else if (power.targeting === 'leap') moveTo = { ...target }
  const victim =
    power.targeting === 'enemy'
      ? living.find((u) => u.x === target.x && u.y === target.y)!
      : null
  if (victim && power.enemy.pull) {
    const to = pullDestination(state, unit, victim, power.enemy.pull)
    pulled = { id: victim.id, to }
    primary = [to]
  }
  if (victim && power.family === 'strike')
    chance = chanceFrom(state.map, unit, victim, {
      aimBonus: power.aimBonus,
      maxRange: power.range,
      ignoreLos: power.ignoresLos,
    }).hit
  const cells = spread(state, primary, power.radius)
  const area = new Set(cells.map(key))
  // Allies and the user are judged at their post-move tiles.
  const positionOf = (u: Unit): Point =>
    u.id === unit.id && moveTo ? moveTo : pulled?.id === u.id ? pulled.to : u
  const effects: PowerEffect[] = []
  for (const other of living) {
    const at = positionOf(other)
    const inArea =
      area.has(key(at)) ||
      (power.targeting !== 'line' &&
        power.targeting !== 'leap' &&
        other.id === victim?.id)
    const isSelf = other.id === unit.id
    const effect: PowerEffect = {
      id: other.id,
      side: isSelf ? 'self' : other.team === unit.team ? 'ally' : 'enemy',
      damage: 0,
      heal: 0,
      ap: 0,
      statuses: [],
      cleanse: false,
      moveTo: isSelf ? moveTo : pulled?.id === other.id ? pulled.to : null,
    }
    let heal = 0
    let guard = false
    if (effect.side === 'enemy' && inArea) {
      effect.damage = Math.min(other.hp, power.enemy.damage)
      // A knocked-out rival takes no lingering status.
      const survives = other.hp > effect.damage
      if (
        survives &&
        power.enemy.suppress &&
        !other.statuses.includes('suppressed')
      )
        effect.statuses.push('suppressed')
      if (survives && power.enemy.mark && !other.statuses.includes('marked'))
        effect.statuses.push('marked')
    } else if (
      effect.side !== 'enemy' &&
      inArea &&
      (power.targeting !== 'leap' || !isSelf)
    ) {
      heal += power.ally.heal
      guard ||= power.ally.guard
      if (!isSelf) effect.ap = power.ally.ap
      effect.cleanse =
        power.ally.cleanse && other.statuses.includes('suppressed')
    }
    if (isSelf) {
      heal += power.self.heal
      guard ||= power.self.guard
    }
    effect.heal = Math.min(heal, other.maxHp - other.hp)
    if (guard && !other.statuses.includes('guarded'))
      effect.statuses.push('guarded')
    if (
      effect.damage ||
      effect.heal ||
      effect.ap ||
      effect.statuses.length ||
      effect.cleanse ||
      effect.moveTo
    )
      effects.push(effect)
  }
  return { power, user: unit.id, target: { ...target }, cells, chance, effects }
}

/** Commit a power. Only a strike rolls, using the same threshold rule as
 * shots; every other power resolves exactly as previewed. */
export function usePower(
  state: PowerState,
  unit: Unit,
  target: Point,
): PowerResult | null {
  const preview = previewPower(state, unit, target)
  if (!preview) return null
  const { power } = preview
  unit.ap -= power.ap
  if (power.cooldown === 0) unit.powerSpent = true
  else unit.powerCooldown = power.cooldown
  if (OFFENSIVE.includes(power.family)) unit.fired = true
  if (power.targeting === 'leap') unit.moved = true
  let roll: number | null = null
  let hit = true
  if (preview.chance !== null) {
    roll = nextRoll(state)
    hit = roll < preview.chance * 100
  }
  for (const effect of preview.effects) {
    const other = state.units.find((u) => u.id === effect.id)!
    if (effect.side === 'enemy' && !hit) continue
    if (effect.moveTo) {
      other.x = effect.moveTo.x
      other.y = effect.moveTo.y
    }
    if (effect.damage) {
      other.hp = Math.max(0, other.hp - effect.damage)
      other.overwatch = false
    }
    other.hp = Math.min(other.maxHp, other.hp + effect.heal)
    other.ap += effect.ap
    if (effect.cleanse)
      other.statuses = other.statuses.filter((s) => s !== 'suppressed')
    if (other.hp > 0)
      for (const status of effect.statuses)
        if (!other.statuses.includes(status)) other.statuses.push(status)
  }
  return { preview, roll, hit }
}

/** Deterministic AI scoring over the same previews the player sees. Leaps
 * are left to the movement planner. Returns null when nothing is worth it. */
export function bestPowerPlay(
  state: PowerState,
  unit: Unit,
): { target: Point; score: number } | null {
  const power = unit.power ? tacticFor(unit.power) : undefined
  if (!power || power.targeting === 'leap') return null
  let best: { target: Point; score: number } | null = null
  for (const target of powerTargets(state, unit)) {
    const preview = previewPower(state, unit, target)
    if (!preview) continue
    const odds = (preview.chance ?? 100) / 100
    let score = 0
    for (const effect of preview.effects) {
      const other = state.units.find((u) => u.id === effect.id)!
      if (effect.side === 'enemy') {
        score += effect.damage * 10 * odds
        if (effect.damage >= other.hp) score += 5 * odds
        score += effect.statuses.length * 2 * odds
        if (effect.moveTo) score += 1
      } else {
        score += effect.heal * 6 + effect.ap * 2 + (effect.cleanse ? 2 : 0)
        score += effect.statuses.length * 2
      }
    }
    if (score >= 5 && (!best || score > best.score)) best = { target, score }
  }
  return best
}
