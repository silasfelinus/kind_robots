// FIVE ALLEYS (Silas, 2026-11-05 PT): "we still lack the GAME ... Decks should
// be 20 cards, not 10. We need a new version that is slow position rules.
// (Solforge style, you have five rows and you can only attack or defend in the
// row you placed, without a modifier), and non-grid, you chose to attach
// someone or the opponent, hearthstone style."
//
// A turn-by-turn lane game, separate from the grid formats (BLACKOUT, BLOODRUSH,
// TURF). Five alleys, one slot per crew in each. Crews alternate turns: mana
// crystals ramp one a turn to ten, you draw a card a turn, and each crew's boss
// has 20 HP. A creature waits a turn after it lands. On your turn each ready
// creature attacks once, in its own alley only: an enemy holding that alley
// must be fought (both strike at once, armor soaks), and an empty alley lets
// it hit the enemy boss. Keywords are the modifiers that break the alley rule.
// Pure and seeded: every command replays exactly (replayAlleys).
import {
  CARDS,
  cardAttackRange,
  cardById,
  teamById,
  type Card,
  type Keyword,
  type Side,
  type TeamId,
} from './prototypes'

export const ALLEY_LANES = 5
export const ALLEY_BOSS_HP = 20
export const ALLEY_DECK_SIZE = 20
export const ALLEY_MANA_CAP = 10
export const ALLEY_START_HAND = 4
export const ALLEY_HAND_CAP = 8
export const ALLEY_TRAP_CAP = 3
export const ALLEY_DEBT_CAP = 3
/** After this many turns each, the boss with more HP wins. */
export const ALLEY_TURN_LIMIT = 30
/**
 * Mana the second seat gets once, on its first turn (Hearthstone's coin).
 * Measured with the crew calibration below on 30 held-out seeds: no coin, the
 * first seat won 59%; one, 55%; two, 49%.
 */
const COIN = 2

export interface AlleyUnit {
  uid: number
  cardId: string
  side: Side
  lane: number
  hp: number
  maxHp: number
  attack: number
  armor: number
  keywords: Keyword[]
  range: number
  /** Landed this turn: waits for its next turn (summoning sickness). */
  fresh: boolean
  /** Already attacked this turn. */
  spent: boolean
  /** AMBUSH's +2 first blow is used. */
  struck: boolean
  /**
   * Skips its next turn's attack (SNARE, root spells, traps): the command
   * index when the root landed, cleared once its owner has a turn under it.
   */
  rootedAt: number | null
  /** Extra attack for this turn only (boost spells). */
  surge: number
}

export interface AlleyTrap {
  side: Side
  lane: number
  cardId: string
}

export type AlleyLogKind =
  'turn' | 'play' | 'attack' | 'boss' | 'death' | 'trap' | 'spell' | 'end'

export interface AlleyLog {
  turn: number
  side: Side
  kind: AlleyLogKind
  text: string
  /** Lanes the event touched, for the board to flash. */
  lanes?: number[]
}

export type AlleyTarget = number | 'boss'

export type AlleyCommand =
  | { t: 'play'; side: Side; card: string; lane: number; target?: AlleyTarget }
  | { t: 'attack'; side: Side; uid: number; target: AlleyTarget }
  | { t: 'end'; side: Side }

export interface AlleyState {
  seed: number
  rng: number
  teams: Record<Side, TeamId>
  /** Turns each side has started. */
  turn: number
  active: Side
  boss: Record<Side, number>
  maxMana: Record<Side, number>
  mana: Record<Side, number>
  debt: Record<Side, number>
  decks: Record<Side, string[]>
  hands: Record<Side, string[]>
  discards: Record<Side, string[]>
  /** Damage the next empty-deck draw deals (Hearthstone fatigue). */
  fatigue: Record<Side, number>
  units: AlleyUnit[]
  traps: AlleyTrap[]
  log: AlleyLog[]
  victor: Side | 'draw' | null
  nextUid: number
  commands: AlleyCommand[]
  /** Command index at which each side's current or last turn began. */
  turnStart: Record<Side, number>
}

const other = (side: Side): Side => (side === 'player' ? 'enemy' : 'player')

function rand(state: AlleyState): number {
  // mulberry32, kept in state so every command replays exactly
  state.rng = (state.rng + 0x6d2b79f5) >>> 0
  let t = state.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function shuffle<T>(state: AlleyState, items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand(state) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Every `count` evenly spaced picks from a list (a spread over its curve). */
function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items]
  return Array.from(
    { length: count },
    (_, i) => items[Math.floor(((i + 0.5) * items.length) / count)]!,
  )
}

/**
 * A crew's 20-card FIVE ALLEYS deck: its ten founders plus six more creatures
 * and four more specials from its own pool, spread across the cost curve, so
 * the deck has ten creatures and a real mana curve.
 */
export function alleyDeck(team: TeamId): string[] {
  const crew = teamById(team)
  const founders = [...crew.creatures, ...crew.special]
  const pool = CARDS.filter(
    (card) => card.team === team && !founders.includes(card.id),
  ).sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
  const creatures = spread(
    pool.filter((card) => card.kind === 'creature'),
    6,
  )
  const specials = spread(
    pool.filter((card) => card.kind !== 'creature'),
    4,
  )
  return [
    ...founders,
    ...creatures.map((c) => c.id),
    ...specials.map((c) => c.id),
  ]
}

function note(
  state: AlleyState,
  side: Side,
  kind: AlleyLogKind,
  text: string,
  lanes?: number[],
) {
  state.log.push({ turn: state.turn, side, kind, text, lanes })
}

function crewName(state: AlleyState, side: Side): string {
  return side === 'player' ? 'You' : teamById(state.teams.enemy).name
}

function draw(state: AlleyState, side: Side): void {
  const card = state.decks[side].shift()
  if (!card) {
    state.fatigue[side]++
    hitBoss(state, side, state.fatigue[side], 'Out of cards: fatigue')
    return
  }
  if (state.hands[side].length >= ALLEY_HAND_CAP) {
    state.discards[side].push(card)
    if (side === 'player')
      note(state, side, 'end', 'Hand full: ' + cardById(card).name + ' burns.')
    return
  }
  state.hands[side].push(card)
}

export function createAlleys(
  playerTeam: TeamId,
  enemyTeam: TeamId,
  seed: number,
): AlleyState {
  const state: AlleyState = {
    seed,
    rng: seed >>> 0,
    teams: { player: playerTeam, enemy: enemyTeam },
    turn: 0,
    active: 'player',
    boss: { player: ALLEY_BOSS_HP, enemy: ALLEY_BOSS_HP },
    maxMana: { player: 0, enemy: 0 },
    mana: { player: 0, enemy: 0 },
    debt: { player: 0, enemy: 0 },
    decks: { player: [], enemy: [] },
    hands: { player: [], enemy: [] },
    discards: { player: [], enemy: [] },
    fatigue: { player: 0, enemy: 0 },
    units: [],
    traps: [],
    log: [],
    victor: null,
    nextUid: 1,
    commands: [],
    turnStart: { player: 0, enemy: 0 },
  }
  state.decks.player = shuffle(state, alleyDeck(playerTeam))
  state.decks.enemy = shuffle(state, alleyDeck(enemyTeam))
  for (let i = 0; i < ALLEY_START_HAND; i++) {
    draw(state, 'player')
    draw(state, 'enemy')
  }
  // Going second draws one extra card.
  draw(state, 'enemy')
  startTurn(state, 'player')
  return state
}

function clone(state: AlleyState): AlleyState {
  return structuredClone(state)
}

function startTurn(state: AlleyState, side: Side): void {
  state.active = side
  state.turnStart[side] = state.commands.length
  if (side === 'player') state.turn++
  state.maxMana[side] = Math.min(ALLEY_MANA_CAP, state.maxMana[side] + 1)
  // Going second, the enemy's first turn gets COIN extra mana, once; it does
  // not raise the crystal count.
  const coin = side === 'enemy' && state.turn === 1 ? COIN : 0
  state.mana[side] = Math.max(0, state.maxMana[side] - state.debt[side]) + coin
  state.debt[side] = 0
  for (const unit of state.units)
    if (unit.side === side) {
      unit.fresh = false
      unit.spent = false
      unit.surge = 0
      if (has(unit, 'regen') && unit.hp < unit.maxHp) unit.hp++
    }
  note(
    state,
    side,
    'turn',
    (side === 'player'
      ? 'Your'
      : possessive(teamById(state.teams.enemy).name)) +
      ' turn ' +
      state.turn +
      ' · ' +
      state.mana[side] +
      ' mana.',
  )
  draw(state, side)
}

function root(state: AlleyState, unit: AlleyUnit): void {
  unit.rootedAt = state.commands.length
}

function possessive(name: string): string {
  return /s$/i.test(name) ? name + "'" : name + "'s"
}

function has(unit: AlleyUnit, keyword: Keyword): boolean {
  return unit.keywords.includes(keyword)
}

export function unitAt(
  state: AlleyState,
  side: Side,
  lane: number,
): AlleyUnit | undefined {
  return state.units.find((unit) => unit.side === side && unit.lane === lane)
}

function unitById(state: AlleyState, uid: number): AlleyUnit | undefined {
  return state.units.find((unit) => unit.uid === uid)
}

function checkVictor(state: AlleyState): void {
  if (state.victor) return
  const p = state.boss.player <= 0
  const e = state.boss.enemy <= 0
  if (p && e) state.victor = 'draw'
  else if (p) state.victor = 'enemy'
  else if (e) state.victor = 'player'
  if (state.victor)
    note(
      state,
      state.active,
      'end',
      state.victor === 'player'
        ? 'The enemy boss falls. YOU HOLD THE ALLEYS.'
        : state.victor === 'enemy'
          ? 'Your boss falls. The alleys are lost.'
          : 'Both bosses fall at once.',
    )
}

function hitBoss(
  state: AlleyState,
  side: Side,
  amount: number,
  why: string,
): void {
  if (amount <= 0) return
  state.boss[side] = Math.max(0, state.boss[side] - amount)
  note(
    state,
    other(side),
    'boss',
    why +
      ': ' +
      amount +
      ' to ' +
      (side === 'player' ? 'your' : 'the enemy') +
      ' boss (' +
      state.boss[side] +
      ' left).',
  )
  checkVictor(state)
}

function healBoss(state: AlleyState, side: Side, amount: number): void {
  state.boss[side] = Math.min(ALLEY_BOSS_HP, state.boss[side] + amount)
}

/** Damage to a unit after armor; returns HP actually lost. */
function hurt(
  state: AlleyState,
  unit: AlleyUnit,
  amount: number,
  pierce = 0,
): number {
  const dealt = Math.max(0, amount - Math.max(0, unit.armor - pierce))
  unit.hp -= dealt
  return dealt
}

function bury(state: AlleyState): void {
  // Repeat: a VOLATILE burst can drop the unit across, which may burst too.
  for (let guard = 0; guard < 10; guard++) {
    const dead = state.units.filter((unit) => unit.hp <= 0)
    if (!dead.length) return
    state.units = state.units.filter((unit) => unit.hp > 0)
    for (const unit of dead) {
      state.discards[unit.side].push(unit.cardId)
      note(
        state,
        unit.side,
        'death',
        cardById(unit.cardId).name + ' falls in alley ' + (unit.lane + 1) + '.',
        [unit.lane],
      )
      if (has(unit, 'volatile')) {
        const across = unitAt(state, other(unit.side), unit.lane)
        const burst = cardById(unit.cardId).burst ?? 1
        if (across) {
          hurt(state, across, burst)
          note(
            state,
            unit.side,
            'death',
            'VOLATILE: it bursts for ' + burst + ' on ' + nameOf(across) + '.',
            [unit.lane],
          )
        } else hitBoss(state, other(unit.side), burst, 'VOLATILE burst')
      }
    }
  }
}

function nameOf(unit: AlleyUnit): string {
  return cardById(unit.cardId).name
}

/** Attack power for this blow, before armor. */
export function blowOf(state: AlleyState, unit: AlleyUnit): number {
  let power = unit.attack + unit.surge
  if (has(unit, 'ambush') && !unit.struck) power += 2
  if (
    has(unit, 'swarm') &&
    state.units.some(
      (u) =>
        u.side === unit.side &&
        u.uid !== unit.uid &&
        Math.abs(u.lane - unit.lane) === 1,
    )
  )
    power += 1
  return power
}

/**
 * Who this unit may attack now. Its own alley's enemy must be fought; an empty
 * alley opens the boss. Range 2+ also reaches the enemies in neighbouring
 * alleys (and takes no strike back from them).
 */
export function attackTargets(state: AlleyState, uid: number): AlleyTarget[] {
  const unit = unitById(state, uid)
  if (
    !unit ||
    state.victor ||
    unit.side !== state.active ||
    unit.fresh ||
    unit.spent ||
    unit.rootedAt !== null ||
    blowOf(state, unit) <= 0
  )
    return []
  const foe = other(unit.side)
  const out: AlleyTarget[] = []
  const blocker = unitAt(state, foe, unit.lane)
  if (blocker) out.push(blocker.uid)
  else out.push('boss')
  if (unit.range >= 2)
    for (const lane of [unit.lane - 1, unit.lane + 1]) {
      const near = unitAt(state, foe, lane)
      if (near) out.push(near.uid)
    }
  return out
}

function collect(state: AlleyState, unit: AlleyUnit): void {
  if (!has(unit, 'collect')) return
  const foe = other(unit.side)
  state.debt[foe] = Math.min(ALLEY_DEBT_CAP, state.debt[foe] + 1)
}

export function attack(
  input: AlleyState,
  side: Side,
  uid: number,
  target: AlleyTarget,
): AlleyState {
  if (input.active !== side) return input
  if (!attackTargets(input, uid).includes(target)) return input
  const state = clone(input)
  const unit = unitById(state, uid)!
  const power = blowOf(state, unit)
  const pierce = has(unit, 'pierce') ? 1 : 0
  unit.spent = true
  if (has(unit, 'ambush')) unit.struck = true
  if (target === 'boss') {
    hitBoss(
      state,
      other(side),
      power,
      nameOf(unit) + ' runs alley ' + (unit.lane + 1),
    )
    if (has(unit, 'leech')) healBoss(state, side, 1)
    collect(state, unit)
  } else {
    const defender = unitById(state, target)!
    const fromLane = defender.lane === unit.lane
    const dealt = hurt(state, defender, power, pierce)
    const back = fromLane ? hurt(state, unit, blowOf(state, defender)) : 0
    note(
      state,
      side,
      'attack',
      nameOf(unit) +
        ' hits ' +
        nameOf(defender) +
        ' for ' +
        dealt +
        (fromLane ? ' and takes ' + back : ' from the next alley') +
        '.',
      [unit.lane, defender.lane],
    )
    if (dealt > 0) {
      if (has(unit, 'leech')) healBoss(state, side, 1)
      if (has(unit, 'snare')) root(state, defender)
      collect(state, unit)
    }
    if (back > 0 && has(defender, 'snare')) root(state, unit)
    if (has(unit, 'bulldoze') && defender.hp < 0)
      hitBoss(state, other(side), -defender.hp, 'BULLDOZE tramples through')
    bury(state)
  }
  state.commands.push({ t: 'attack', side, uid, target })
  return state
}

/** Who a non-creature card can aim at, by its effect. */
export type AlleyAim =
  'own-unit' | 'enemy-unit' | 'enemy-any' | 'lane' | 'own-any'

export function aimOf(card: Card): AlleyAim {
  if (card.kind === 'trap') return 'lane'
  if (card.kind === 'equipment') return 'own-unit'
  switch (card.effect) {
    case 'heal':
      return 'own-any'
    case 'boost':
    case 'armor':
    case 'sharpen':
    case 'grant':
    case 'scan':
      return 'own-unit'
    case 'zap':
    case 'chaos':
    case 'debt':
      return 'enemy-any'
    default:
      return 'enemy-unit'
  }
}

/** Can this card be played into this lane (and at this target) right now? */
export function canPlay(
  state: AlleyState,
  side: Side,
  cardId: string,
  lane: number,
  target?: AlleyTarget,
): boolean {
  if (state.victor || state.active !== side) return false
  if (!state.hands[side].includes(cardId)) return false
  const card = cardById(cardId)
  if (card.cost > state.mana[side]) return false
  if (lane < 0 || lane >= ALLEY_LANES) return false
  if (card.kind === 'creature') return !unitAt(state, side, lane)
  if (card.kind === 'trap')
    return (
      !state.traps.some((t) => t.side === side && t.lane === lane) &&
      state.traps.filter((t) => t.side === side).length < ALLEY_TRAP_CAP
    )
  const aim = aimOf(card)
  const mine = unitAt(state, side, lane)
  const theirs = unitAt(state, other(side), lane)
  if (aim === 'own-unit') return !!mine && target === mine.uid
  if (aim === 'own-any')
    return target === 'boss' || (!!mine && target === mine.uid)
  if (aim === 'enemy-unit') return !!theirs && target === theirs.uid
  return target === 'boss' || (!!theirs && target === theirs.uid)
}

/**
 * FIVE ALLEYS crew calibration (t-027): lane fights reward big blockers, so on
 * first measurement Ironjaw won 92% of CPU games and Bloodfairies 10%. Each
 * crew's own creatures get a dithered HP offset in this mode only (an offset
 * of 0.5 gives a fixed half of its creature cards +1 HP, by a hash of the card
 * id), the lever BLOODRUSH uses; mercenaries are unchanged.
 */
export const ALLEY_CREW_HP: Record<TeamId, number> = {
  // Auto-tuned on 16 seeds, checked on 30 held-out seeds (1,800 games):
  // spread 0.238 -> 0.038, every crew 47-57%.
  catgirls: 0.25,
  bloodfairies: 1.25,
  ironjaw: -1.75,
  riot: 0.25,
  undertow: 0,
  exchange: -0.125,
}

/** A creature's FIVE ALLEYS health, crew calibration included. */
export function alleyHp(card: Card): number {
  const base = card.hp || 2
  if (card.team === 'mercenary') return base
  const offset = ALLEY_CREW_HP[card.team as TeamId] ?? 0
  if (!offset) return base
  let hash = 2166136261
  for (let i = 0; i < card.id.length; i++)
    hash = Math.imul(hash ^ card.id.charCodeAt(i), 16777619)
  const shift = Math.floor(offset + (hash >>> 0) / 4294967296)
  return Math.max(1, base + shift)
}

function newUnit(
  state: AlleyState,
  side: Side,
  card: Card,
  lane: number,
): AlleyUnit {
  const hp = alleyHp(card)
  return {
    uid: state.nextUid++,
    cardId: card.id,
    side,
    lane,
    hp,
    maxHp: hp,
    attack: card.attack ?? 1,
    armor: card.armor ?? 0,
    keywords: [...(card.keywords ?? [])],
    range: cardAttackRange(card),
    fresh: true,
    spent: false,
    struck: false,
    rootedAt: null,
    surge: 0,
  }
}

function springTrap(state: AlleyState, victim: AlleyUnit): void {
  const trap = state.traps.find(
    (t) => t.side !== victim.side && t.lane === victim.lane,
  )
  if (!trap) return
  state.traps = state.traps.filter((t) => t !== trap)
  const card = cardById(trap.cardId)
  const dealt = hurt(state, victim, card.power ?? 2)
  if (card.roots || card.effect === 'snare') root(state, victim)
  if (card.debt)
    state.debt[victim.side] = Math.min(
      ALLEY_DEBT_CAP,
      state.debt[victim.side] + card.debt,
    )
  state.discards[trap.side].push(trap.cardId)
  note(
    state,
    trap.side,
    'trap',
    card.name + ' springs on ' + nameOf(victim) + ' for ' + dealt + '.',
    [victim.lane],
  )
  bury(state)
}

export function playCard(
  input: AlleyState,
  side: Side,
  cardId: string,
  lane: number,
  target?: AlleyTarget,
): AlleyState {
  if (!canPlay(input, side, cardId, lane, target)) return input
  const state = clone(input)
  const card = cardById(cardId)
  state.mana[side] -= card.cost
  state.hands[side].splice(state.hands[side].indexOf(cardId), 1)
  const who = crewName(state, side)
  const foe = other(side)
  if (card.kind === 'creature') {
    const unit = newUnit(state, side, card, lane)
    state.units.push(unit)
    note(
      state,
      side,
      'play',
      who + ' send ' + card.name + ' into alley ' + (lane + 1) + '.',
      [lane],
    )
    springTrap(state, unit)
  } else if (card.kind === 'trap') {
    state.traps.push({ side, lane, cardId })
    note(
      state,
      side,
      'play',
      who +
        (side === 'player' ? ' hide ' + card.name : ' hide a trap') +
        ' in alley ' +
        (lane + 1) +
        '.',
      [lane],
    )
  } else {
    const power = card.power ?? 2
    const unit =
      typeof target === 'number' ? unitById(state, target) : undefined
    const label = who + ' cast ' + card.name
    switch (card.effect) {
      case 'heal':
        if (unit) unit.hp = Math.min(unit.maxHp, unit.hp + power)
        else healBoss(state, side, power)
        note(state, side, 'spell', label + ': +' + power + ' HP.', [lane])
        break
      case 'boost':
        if (unit) {
          if (card.kind === 'equipment') unit.attack += 1
          else {
            unit.surge += 1
            unit.fresh = false
            if (card.rearm) unit.struck = false
          }
        }
        note(
          state,
          side,
          'spell',
          label + ' on ' + (unit ? nameOf(unit) : 'nobody') + '.',
          [lane],
        )
        break
      case 'armor':
        if (unit) unit.armor += 1
        note(state, side, 'spell', label + ': +1 armor.', [lane])
        break
      case 'sharpen':
        if (unit) unit.attack += 1
        note(state, side, 'spell', label + ': +1 attack.', [lane])
        break
      case 'grant':
        if (unit)
          for (const k of card.grants ?? [])
            if (!unit.keywords.includes(k)) unit.keywords.push(k)
        note(
          state,
          side,
          'spell',
          label + ': ' + (card.grants ?? []).join(', ').toUpperCase() + '.',
          [lane],
        )
        break
      case 'scan': {
        draw(state, side)
        const before = state.traps.length
        state.traps = state.traps.filter(
          (t) => !(t.side === foe && t.lane === lane),
        )
        note(
          state,
          side,
          'spell',
          label +
            ': draw a card' +
            (before > state.traps.length ? ' and disarm a trap' : '') +
            '.',
          [lane],
        )
        break
      }
      default: {
        // Damage spells: zap, blast, chaos, root, snare, debt.
        const amount =
          card.effect === 'chaos'
            ? 1 + Math.floor(rand(state) * 3)
            : card.effect === 'root'
              ? (card.power ?? 0)
              : power
        if (target === 'boss') hitBoss(state, foe, amount, card.name)
        else if (unit) {
          const dealt = hurt(state, unit, amount)
          if (card.effect === 'root' || card.effect === 'snare')
            root(state, unit)
          note(
            state,
            side,
            'spell',
            label + ' on ' + nameOf(unit) + ' for ' + dealt + '.',
            [lane],
          )
          if (card.effect === 'blast')
            for (const l of [lane - 1, lane + 1]) {
              const near = unitAt(state, foe, l)
              if (near) hurt(state, near, 1)
              if (card.splash === 'all') {
                const friend = unitAt(state, side, l)
                if (friend) hurt(state, friend, 1)
              }
            }
        }
        if (card.effect === 'debt' || card.debt)
          state.debt[foe] = Math.min(
            ALLEY_DEBT_CAP,
            state.debt[foe] + (card.debt ?? 2),
          )
        bury(state)
      }
    }
    state.discards[side].push(cardId)
  }
  state.commands.push({ t: 'play', side, card: cardId, lane, target })
  return state
}

export function endTurn(input: AlleyState, side: Side): AlleyState {
  if (input.victor || input.active !== side) return input
  const state = clone(input)
  // A root that landed before this turn began has now cost its turn.
  for (const unit of state.units)
    if (
      unit.side === side &&
      unit.rootedAt !== null &&
      unit.rootedAt < state.turnStart[side]
    )
      unit.rootedAt = null
  state.commands.push({ t: 'end', side })
  if (side === 'enemy' && state.turn >= ALLEY_TURN_LIMIT) {
    const p = state.boss.player
    const e = state.boss.enemy
    state.victor = p === e ? 'draw' : p > e ? 'player' : 'enemy'
    note(
      state,
      side,
      'end',
      'Last call: the boss with more HP takes the alleys.',
    )
    return state
  }
  startTurn(state, other(side))
  return state
}

export function applyAlleyCommand(
  state: AlleyState,
  cmd: AlleyCommand,
): AlleyState {
  if (cmd.t === 'play')
    return playCard(state, cmd.side, cmd.card, cmd.lane, cmd.target)
  if (cmd.t === 'attack') return attack(state, cmd.side, cmd.uid, cmd.target)
  return endTurn(state, cmd.side)
}

export function replayAlleys(
  playerTeam: TeamId,
  enemyTeam: TeamId,
  seed: number,
  commands: AlleyCommand[],
): AlleyState {
  let state = createAlleys(playerTeam, enemyTeam, seed)
  for (const cmd of commands) state = applyAlleyCommand(state, cmd)
  return state
}
