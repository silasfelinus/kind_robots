// CLASH is Slime City's canonical match rules. Older arena formats live in Legacy.
// Seeded, pure commands: client, CPU and replay all use the same transition rules.
// Silas, 2026-11-06 PT: "Attacks should have animation and happen lane to lane
// automatically after the second play." Once a side's card plays are spent, its
// fighters strike straight across their own alley, left to right, one strike
// command per alley so the board can animate each blow.
import { alleyDeck } from './alleys'
import {
  cardById,
  type Card,
  type Keyword,
  type Side,
  type TeamId,
} from './prototypes'

export const CLASH_LANES = 5
export const CLASH_BOSS_HP = 28
/**
 * The crew that moves second starts its boss with extra life (Hearthstone's
 * coin). CPU sweeps, 2026-11-07: at boss 20, +0 let the first seat win
 * ~63% and +5 ~51.5%; at the beefier boss 28 (Silas: "we want creatures to
 * feel fun and beefy"), +8 holds it near 55%.
 */
export const CLASH_SECOND_SEAT_BONUS = 8
export function clashBossMax(side: Side): number {
  return CLASH_BOSS_HP + (side === 'enemy' ? CLASH_SECOND_SEAT_BONUS : 0)
}
export const CLASH_PLAYS = 2
export const CLASH_DECK_SIZE = 20
export const CLASH_HAND_SIZE = 5
export const CLASH_ROUND_LIMIT = 18

export type ClashPhase = 'play' | 'attack'
export interface ClashUnit {
  uid: number
  cardId: string
  side: Side
  lane: number
  hp: number
  maxHp: number
  attack: number
  armor: number
  keywords: Keyword[]
  surge: number
  rooted: boolean
  ambushUsed: boolean
  attacked: boolean
  /** Landed this turn. */
  fresh: boolean
  gear: string[]
}
export interface ClashTrap {
  side: Side
  lane: number
  cardId: string
}
export interface ClashStrike {
  side: Side
  lane: number
  attacker: string
  target: 'unit' | 'boss'
  defender?: string
  dealt: number
  returned: number
  attackerFell: boolean
  defenderFell: boolean
  /** Trap card that sprang on an unblocked strike. */
  trap?: string
}
export interface ClashLog {
  round: number
  text: string
  lane?: number
  kind: 'play' | 'clash' | 'death' | 'boss' | 'turn' | 'trap'
}
export type ClashCommand =
  | { t: 'play'; side: Side; card: string; lane: number }
  | { t: 'pass'; side: Side }
  | { t: 'strike'; side: Side }
  | { t: 'end'; side: Side }

export interface ClashState {
  seed: number
  rng: number
  teams: Record<Side, TeamId>
  round: number
  active: Side
  phase: ClashPhase
  /** Number of card-play slots used during this side's current turn. */
  plays: Record<Side, number>
  boss: Record<Side, number>
  decks: Record<Side, string[]>
  hands: Record<Side, string[]>
  discards: Record<Side, string[]>
  units: ClashUnit[]
  traps: ClashTrap[]
  log: ClashLog[]
  /** Next alley the active crew's automatic attack sweep resolves. */
  cursor: number
  /** Most recent resolved alley strike, for the board's hit animation. */
  strike: ClashStrike | null
  victor: Side | 'draw' | null
  nextUid: number
  commands: ClashCommand[]
}
export interface ClashCardBalance {
  /** All 300 catalog cards get a separate, Clash-only balance profile. */
  plays: 1 | 2
  attack: number
  hp: number
  armor: number
  power: number
}

const opponent = (s: Side): Side => (s === 'player' ? 'enemy' : 'player')
const inside = (lane: number): boolean =>
  Number.isInteger(lane) && lane >= 0 && lane < CLASH_LANES
const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n))
const unitAt = (
  state: ClashState,
  side: Side,
  lane: number,
): ClashUnit | undefined =>
  state.units.find((u) => u.side === side && u.lane === lane)
export const clashUnitAt = unitAt
const has = (u: ClashUnit, k: Keyword): boolean => u.keywords.includes(k)
const nameOf = (u: ClashUnit): string => cardById(u.cardId).name
const note = (
  s: ClashState,
  text: string,
  kind: ClashLog['kind'],
  lane?: number,
): void => {
  s.log.push({ round: s.round, text, kind, lane })
  if (s.log.length > 75) s.log.shift()
}

/**
 * A card's old mana cost becomes a balance tier, NOT a second resource.
 * Signature cards and 4+-tier cards are power plays, consuming both slots.
 */
export function clashPlayCost(card: Card): 1 | 2 {
  return card.signature || card.cost >= 4 ? 2 : 1
}
/**
 * Clash budgets (2026-11-07 rebalance). The grid-era stats were tuned around
 * movement, range and action points; in five fixed alleys a fighter is only
 * its strike, its toughness and its traits. Every fighter spends one stat
 * budget per play tier: power costs 2, armor 3, each trait its listed price,
 * and the remainder becomes life. The grid card's attack still sets the
 * character's shape, so bruisers, glass cannons and walls stay distinct.
 * Tuned with `npm run balance:slime-city-clash` CPU sweeps.
 */
export const CLASH_FOLLOWER_BUDGET: Record<1 | 2, number> = { 1: 14, 2: 25 }
export const CLASH_TRAIT_COST: Record<Keyword, number> = {
  ambush: 1,
  regen: 1,
  swarm: 2,
  leech: 3,
  // Bulldoze only matters on overkill; priced as flavor.
  bulldoze: 0,
  volatile: 1,
  pierce: 1,
  snare: 2,
  collect: 1,
}
export const CLASH_TRAIT_TEXT: Record<Keyword, string> = {
  ambush: 'Ambush: +1 power on its first strike or block.',
  regen: 'Regen: recovers 2 life at round end instead of 1.',
  swarm: 'Swarm: +1 power while a friend holds a neighboring alley.',
  leech: 'Leech: heals 1 whenever it deals damage.',
  bulldoze: 'Bulldoze: damage beyond a blocker’s life hits the boss.',
  volatile: 'Volatile: when it falls, it blasts whatever is across its alley.',
  pierce: 'Pierce: ignores 1 armor.',
  snare:
    'Snare: a fighter it damages on its own strike misses its next strike.',
  collect: 'Collect: gains +1 power each time it defeats a fighter.',
}
/** No changes to CARDS or the legacy battle engines. */
export function clashBalance(card: Card): ClashCardBalance {
  const plays = clashPlayCost(card)
  const heavy = plays === 2
  if (card.kind !== 'creature')
    return {
      plays,
      attack: 0,
      hp: 0,
      armor: 0,
      // Traps spend a play on nothing visible, so they hit harder than zaps.
      power:
        card.kind === 'trap'
          ? clamp((card.power ?? 2) + 2, 2, heavy ? 6 : 5)
          : clamp((card.power ?? 2) + 1, 2, heavy ? 5 : 3),
    }
  const armor = clamp(card.armor ?? 0, 0, 1)
  const attack = clamp((card.attack ?? 2) + (heavy ? 2 : 1), 2, heavy ? 6 : 4)
  const traits = (card.keywords ?? []).reduce(
    (sum, k) => sum + CLASH_TRAIT_COST[k],
    0,
  )
  const hp = clamp(
    CLASH_FOLLOWER_BUDGET[plays] - attack * 2 - armor * 3 - traits,
    heavy ? 5 : 2,
    heavy ? 14 : 10,
  )
  return { plays, attack, hp, armor, power: 0 }
}
/** Hand-card badge: the effect in a few characters. */
export function clashCardBadge(card: Card): string {
  const b = clashBalance(card)
  if (card.kind === 'creature') return b.attack + ' ⚔ · ' + b.hp + ' ♥'
  if (card.kind === 'trap') return 'TRAP ' + b.power
  switch (card.effect) {
    case 'heal':
      return '+' + b.power + ' ♥'
    case 'armor':
      return '+1 ARMOR'
    case 'sharpen':
      return '+' + (b.plays === 2 ? 2 : 1) + ' ⚔'
    case 'boost':
      return card.kind === 'equipment'
        ? '+' + (b.plays === 2 ? 2 : 1) + ' ⚔'
        : '+' + b.power + ' ⚔ NOW'
    case 'grant':
      return (card.grants ?? []).join(' ').toUpperCase() || 'GEAR'
    case 'scan':
      return 'DISARM'
    case 'root':
      return 'STUN'
    case 'chaos':
      return '1–' + b.power + ' DMG'
    case 'blast':
      return b.power + ' DMG +1'
    case 'snare':
    case 'debt':
      return b.power + ' DMG STUN'
    default:
      return b.power + ' DMG'
  }
}
/** Clash text explains the effect actually executed, not legacy mana/AP rules. */
export function clashCardText(card: Card): string {
  const b = clashBalance(card)
  const suffix = b.plays === 2 ? ' Costs both card plays.' : ''
  if (card.kind === 'creature')
    return (
      'Fighter: ' +
      b.attack +
      ' power, ' +
      b.hp +
      ' life' +
      (b.armor ? ', 1 armor' : '') +
      '. Strikes straight across its alley every turn; an empty alley means a hit on the rival boss.' +
      (card.keywords ?? []).map((k) => ' ' + CLASH_TRAIT_TEXT[k]).join('') +
      suffix
    )
  if (card.kind === 'trap')
    return (
      'Hidden in your alley. The next rival fighter to land across from it or strike through it takes ' +
      b.power +
      ' damage' +
      (card.roots ? ' and misses its next strike.' : '.') +
      suffix
    )
  let text: string
  switch (card.effect) {
    case 'heal':
      text = 'Restore ' + b.power + ' life to your fighter.'
      break
    case 'armor':
      text = 'Your fighter gains +1 armor, up to 2.'
      break
    case 'sharpen':
      text =
        'Your fighter gains +' + (b.plays === 2 ? 2 : 1) + ' power for good.'
      break
    case 'boost':
      text =
        card.kind === 'equipment'
          ? 'Your fighter gains +' +
            (b.plays === 2 ? 2 : 1) +
            ' power for good.'
          : 'Your fighter gains +' + b.power + ' power this round.'
      break
    case 'grant':
      text =
        'Your fighter gains ' +
        (card.grants ?? []).map((k) => CLASH_TRAIT_TEXT[k] ?? k).join(' ')
      break
    case 'scan':
      text = 'Disarm a rival trap in this alley and draw a replacement card.'
      break
    case 'chaos':
      text = 'Deal 1–' + b.power + ' damage to a rival fighter.'
      break
    case 'root':
      text =
        'Stun a rival fighter: it can’t block this turn or strike on its next.'
      break
    case 'snare':
    case 'debt':
      text =
        'Deal ' +
        b.power +
        ' damage and stun: that fighter can’t block this turn or strike on its next.'
      break
    case 'blast':
      text =
        'Deal ' +
        b.power +
        ' damage, plus 1 to rival fighters in neighboring alleys.'
      break
    default:
      text = 'Deal ' + b.power + ' damage to a rival fighter.'
  }
  return (card.kind === 'equipment' ? 'Gear. ' : '') + text + suffix
}
export function clashPower(s: ClashState, u: ClashUnit): number {
  let power = u.attack + u.surge
  if (has(u, 'ambush') && !u.ambushUsed) power++
  if (
    has(u, 'swarm') &&
    s.units.some(
      (v) =>
        v.uid !== u.uid && v.side === u.side && Math.abs(v.lane - u.lane) === 1,
    )
  )
    power++
  return power
}
function random(state: ClashState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0
  let n = state.rng
  n = Math.imul(n ^ (n >>> 15), n | 1)
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
  return ((n ^ (n >>> 14)) >>> 0) / 4294967296
}
function shuffle(s: ClashState, list: string[]): string[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}
function draw(s: ClashState, side: Side): void {
  while (s.hands[side].length < CLASH_HAND_SIZE) {
    if (!s.decks[side].length) {
      if (!s.discards[side].length) break
      s.decks[side] = shuffle(s, s.discards[side])
      s.discards[side] = []
    }
    const id = s.decks[side].shift()
    if (!id) break
    s.hands[side].push(id)
  }
}
function discardHand(s: ClashState, side: Side): void {
  s.discards[side].push(...s.hands[side])
  s.hands[side] = []
}
function startTurn(s: ClashState, side: Side): void {
  s.active = side
  s.phase = 'play'
  s.plays[side] = 0
  s.cursor = 0
  for (const u of s.units.filter((v) => v.side === side)) u.attacked = false
  draw(s, side)
  note(
    s,
    (side === 'player' ? 'YOUR TURN' : 'RIVAL TURN') +
      ': two card plays, then every fighter strikes across its alley.',
    'turn',
  )
}
/** Twenty unique catalog cards, seeded draws and no retained hand between turns. */
export function createClash(
  player: TeamId = 'catgirls',
  enemy: TeamId = 'ironjaw',
  seed = 1,
): ClashState {
  const s: ClashState = {
    seed,
    rng: seed >>> 0,
    teams: { player, enemy },
    round: 1,
    active: 'player',
    phase: 'play',
    plays: { player: 0, enemy: 0 },
    boss: { player: clashBossMax('player'), enemy: clashBossMax('enemy') },
    decks: { player: [], enemy: [] },
    hands: { player: [], enemy: [] },
    discards: { player: [], enemy: [] },
    units: [],
    traps: [],
    log: [],
    cursor: 0,
    strike: null,
    victor: null,
    nextUid: 1,
    commands: [],
  }
  s.decks.player = shuffle(s, alleyDeck(player))
  s.decks.enemy = shuffle(s, alleyDeck(enemy))
  startTurn(s, 'player')
  return s
}
function aim(card: Card): 'own' | 'enemy' | 'lane' {
  if (
    card.kind === 'creature' ||
    card.kind === 'trap' ||
    card.effect === 'scan'
  )
    return 'lane'
  if (
    card.kind === 'equipment' ||
    ['heal', 'boost', 'armor', 'sharpen', 'grant'].includes(card.effect ?? '')
  )
    return 'own'
  return 'enemy'
}
export function canClashPlay(
  s: ClashState,
  side: Side,
  id: string,
  lane: number,
): boolean {
  if (
    s.victor ||
    s.active !== side ||
    s.phase !== 'play' ||
    !inside(lane) ||
    !s.hands[side].includes(id)
  )
    return false
  const card = cardById(id)
  if (card.team !== s.teams[side] && card.team !== 'mercenary') return false
  if (s.plays[side] + clashPlayCost(card) > CLASH_PLAYS) return false
  if (card.kind === 'creature') return true // Friendly replacement allowed.
  if (card.kind === 'trap')
    return !s.traps.some((t) => t.side === side && t.lane === lane)
  if (card.effect === 'scan') return true
  return aim(card) === 'own'
    ? !!unitAt(s, side, lane)
    : !!unitAt(s, opponent(side), lane)
}
function damage(u: ClashUnit, amount: number, pierce = 0): number {
  const dealt = Math.max(0, amount - Math.max(0, u.armor - pierce))
  u.hp -= dealt
  return dealt
}
function casualties(s: ClashState): void {
  const fallen = s.units.filter((u) => u.hp <= 0)
  s.units = s.units.filter((u) => u.hp > 0)
  for (const u of fallen) {
    s.discards[u.side].push(u.cardId)
    note(
      s,
      nameOf(u) + ' falls in alley ' + (u.lane + 1) + '.',
      'death',
      u.lane,
    )
    if (has(u, 'volatile')) {
      const foe = unitAt(s, opponent(u.side), u.lane)
      const burst = clamp(cardById(u.cardId).burst ?? 1, 1, 2)
      if (foe) damage(foe, burst)
      else s.boss[opponent(u.side)] -= burst
    }
  }
  if (s.units.some((u) => u.hp <= 0)) casualties(s)
}
function checkWinner(s: ClashState): void {
  if (s.boss.player <= 0 && s.boss.enemy <= 0) s.victor = 'draw'
  else if (s.boss.player <= 0) s.victor = 'enemy'
  else if (s.boss.enemy <= 0) s.victor = 'player'
  if (s.victor)
    note(
      s,
      s.victor === 'draw'
        ? 'Double knockout!'
        : s.victor === 'player'
          ? 'YOU WIN!'
          : 'RIVAL WINS!',
      'turn',
    )
}
export function playClash(
  input: ClashState,
  side: Side,
  id: string,
  lane: number,
): ClashState {
  if (!canClashPlay(input, side, id, lane)) return input
  const s = structuredClone(input)
  const card = cardById(id)
  const profile = clashBalance(card)
  s.hands[side].splice(s.hands[side].indexOf(id), 1)
  const foe = opponent(side)
  if (card.kind === 'creature') {
    const old = unitAt(s, side, lane)
    if (old) {
      s.units = s.units.filter((u) => u.uid !== old.uid)
      s.discards[side].push(old.cardId)
      note(s, nameOf(old) + ' makes way for ' + card.name + '.', 'play', lane)
    }
    const unit: ClashUnit = {
      uid: s.nextUid++,
      cardId: id,
      side,
      lane,
      hp: profile.hp,
      maxHp: profile.hp,
      attack: profile.attack,
      armor: profile.armor,
      keywords: [...(card.keywords ?? [])],
      surge: 0,
      rooted: false,
      ambushUsed: false,
      attacked: false,
      fresh: true,
      gear: [],
    }
    s.units.push(unit)
    note(s, card.name + ' enters alley ' + (lane + 1) + '.', 'play', lane)
    const trap = s.traps.find((t) => t.side === foe && t.lane === lane)
    if (trap) {
      const effect = cardById(trap.cardId)
      damage(unit, clashBalance(effect).power)
      if (effect.roots) unit.rooted = true
      s.traps = s.traps.filter((t) => t !== trap)
      s.discards[foe].push(trap.cardId)
      note(s, effect.name + ' springs on ' + card.name + '!', 'trap', lane)
      casualties(s)
    }
  } else if (card.kind === 'trap') {
    s.traps.push({ side, lane, cardId: id })
    note(s, 'Trap armed in alley ' + (lane + 1) + '.', 'trap', lane)
  } else {
    const target = unitAt(s, aim(card) === 'own' ? side : foe, lane)
    const power = profile.power
    if (card.effect === 'scan') {
      const removed = s.traps.filter((t) => t.side === foe && t.lane === lane)
      s.traps = s.traps.filter((t) => !removed.includes(t))
      for (const trap of removed) s.discards[foe].push(trap.cardId)
      draw(s, side)
    } else if (target) {
      switch (card.effect) {
        case 'heal':
          target.hp = Math.min(target.maxHp, target.hp + power)
          break
        case 'armor':
          target.armor = clamp(target.armor + 1, 0, 2)
          break
        case 'sharpen':
          target.attack = clamp(
            target.attack + (profile.plays === 2 ? 2 : 1),
            1,
            6,
          )
          break
        case 'boost':
          if (card.kind === 'equipment')
            target.attack = clamp(
              target.attack + (profile.plays === 2 ? 2 : 1),
              1,
              6,
            )
          else target.surge += power
          break
        case 'grant':
          for (const keyword of card.grants ?? [])
            if (!target.keywords.includes(keyword))
              target.keywords.push(keyword)
          break
        case 'root':
          target.rooted = true
          break
        case 'snare':
        case 'debt':
          damage(target, power)
          target.rooted = true
          break
        case 'chaos':
          damage(target, 1 + Math.floor(random(s) * power))
          break
        default:
          damage(target, power)
          if (card.effect === 'blast') {
            for (const nearby of s.units.filter(
              (u) => u.side === foe && Math.abs(u.lane - lane) === 1,
            ))
              damage(nearby, 1)
          }
      }
      if (card.kind === 'equipment') target.gear.push(id)
    }
    note(s, card.name + ' played in alley ' + (lane + 1) + '.', 'play', lane)
    casualties(s)
    s.discards[side].push(id)
  }
  s.plays[side] += profile.plays
  if (s.plays[side] >= CLASH_PLAYS) {
    s.phase = 'attack'
    s.cursor = 0
  }
  s.commands.push({ t: 'play', side, card: id, lane })
  checkWinner(s)
  return s
}
/** Finish placement early. Remaining plays are forfeited, alley strikes begin. */
export function passClash(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'play')
    return input
  const s = structuredClone(input)
  s.phase = 'attack'
  s.cursor = 0
  note(s, (side === 'player' ? 'You' : 'Rival') + ' send the crew in.', 'play')
  s.commands.push({ t: 'pass', side })
  return s
}
/** Next alley (left to right) where `side` still has a ready fighter, or -1. */
export function nextClashStrike(s: ClashState, side: Side): number {
  if (s.victor || s.active !== side || s.phase !== 'attack') return -1
  for (let lane = s.cursor; lane < CLASH_LANES; lane++) {
    const u = unitAt(s, side, lane)
    // A fighter that just landed brawls with a blocker but can't reach the boss yet.
    if (
      u &&
      !u.rooted &&
      !u.attacked &&
      !(u.fresh && !unitAt(s, opponent(side), lane))
    )
      return lane
  }
  return -1
}
/**
 * Automatic alley strike: the fighter hits whatever stands across its own
 * alley. A blocker strikes back at the same moment, so lethal hits trade; an
 * empty alley means the rival boss takes the blow.
 */
export function strikeClash(input: ClashState, side: Side): ClashState {
  const lane = nextClashStrike(input, side)
  if (lane < 0) return input
  const s = structuredClone(input)
  const attacker = unitAt(s, side, lane)!
  const foeSide = opponent(side)
  const defender = unitAt(s, foeSide, lane)
  const attackPower = clashPower(s, attacker)
  attacker.attacked = true
  attacker.ambushUsed = true
  s.cursor = lane + 1
  const strike: ClashStrike = {
    side,
    lane,
    attacker: attacker.cardId,
    target: defender ? 'unit' : 'boss',
    defender: defender?.cardId,
    dealt: 0,
    returned: 0,
    attackerFell: false,
    defenderFell: false,
  }
  // An unblocked strike runs through the alley first, springing any trap there.
  const trap = defender
    ? undefined
    : s.traps.find((t) => t.side === foeSide && t.lane === lane)
  if (trap) {
    const effect = cardById(trap.cardId)
    strike.dealt = 0
    strike.returned = damage(attacker, clashBalance(effect).power)
    if (effect.roots) attacker.rooted = true
    s.traps = s.traps.filter((t) => t !== trap)
    s.discards[foeSide].push(trap.cardId)
    note(s, effect.name + ' springs on ' + nameOf(attacker) + '!', 'trap', lane)
    strike.attackerFell = attacker.hp <= 0
    strike.trap = trap.cardId
  } else if (!defender) {
    s.boss[foeSide] -= attackPower
    strike.dealt = attackPower
    note(
      s,
      nameOf(attacker) + ' hits the rival boss for ' + attackPower + '.',
      'boss',
      lane,
    )
  } else {
    const defensePower = defender.rooted ? 0 : clashPower(s, defender)
    const dealt = damage(defender, attackPower, has(attacker, 'pierce') ? 1 : 0)
    const returned = damage(
      attacker,
      defensePower,
      has(defender, 'pierce') ? 1 : 0,
    )
    defender.ambushUsed = true
    strike.dealt = dealt
    strike.returned = returned
    note(
      s,
      nameOf(attacker) +
        ' deals ' +
        dealt +
        ' to ' +
        nameOf(defender) +
        ' and takes ' +
        returned +
        ' back.',
      'clash',
      lane,
    )
    if (has(attacker, 'bulldoze') && defender.hp < 0)
      s.boss[foeSide] += defender.hp
    if (dealt > 0 && has(attacker, 'snare')) defender.rooted = true
    if (dealt > 0 && has(attacker, 'leech'))
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
    if (returned > 0 && has(defender, 'leech'))
      defender.hp = Math.min(defender.maxHp, defender.hp + 1)
    if (defender.hp <= 0 && has(attacker, 'collect'))
      attacker.attack = clamp(attacker.attack + 1, 1, 7)
    if (attacker.hp <= 0 && has(defender, 'collect'))
      defender.attack = clamp(defender.attack + 1, 1, 7)
    strike.attackerFell = attacker.hp <= 0
    strike.defenderFell = defender.hp <= 0
  }
  s.strike = strike
  casualties(s)
  checkWinner(s)
  s.commands.push({ t: 'strike', side })
  return s
}
/**
 * End this side's turn once every ready fighter has struck. Unplayed hand
 * cards expire, never carry over.
 */
export function endClashTurn(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'attack')
    return input
  if (nextClashStrike(input, side) >= 0) return input
  const s = structuredClone(input)
  discardHand(s, side)
  for (const u of s.units.filter((v) => v.side === side)) {
    u.rooted = false
    u.fresh = false
  }
  s.commands.push({ t: 'end', side })
  if (side === 'player') {
    startTurn(s, 'enemy')
    return s
  }
  // Both crews finished: one life of natural recovery, then the next round.
  for (const unit of s.units) {
    unit.hp = Math.min(unit.maxHp, unit.hp + 1 + (has(unit, 'regen') ? 1 : 0))
    unit.surge = 0
  }
  note(s, 'ROUND END: surviving fighters recover 1 life.', 'turn')
  if (s.round >= CLASH_ROUND_LIMIT) {
    s.victor =
      s.boss.player === s.boss.enemy
        ? 'draw'
        : s.boss.player > s.boss.enemy
          ? 'player'
          : 'enemy'
    note(s, 'Final bell! Highest boss health wins.', 'turn')
    return s
  }
  s.round++
  startTurn(s, 'player')
  return s
}
export function applyClashCommand(
  s: ClashState,
  command: ClashCommand,
): ClashState {
  switch (command.t) {
    case 'play':
      return playClash(s, command.side, command.card, command.lane)
    case 'pass':
      return passClash(s, command.side)
    case 'strike':
      return strikeClash(s, command.side)
    case 'end':
      return endClashTurn(s, command.side)
  }
}
export function replayClash(
  player: TeamId,
  enemy: TeamId,
  seed: number,
  commands: ClashCommand[],
): ClashState {
  return commands.reduce(applyClashCommand, createClash(player, enemy, seed))
}
/** Deterministic CPU using public fighters + only its own hand. */
export function chooseClashCpu(
  s: ClashState,
  side: Side = 'enemy',
): ClashCommand {
  if (s.victor || s.active !== side) return { t: 'end', side }
  if (s.phase === 'attack')
    return nextClashStrike(s, side) >= 0
      ? { t: 'strike', side }
      : { t: 'end', side }
  const foeSide = opponent(side)
  let best: { score: number; card: string; lane: number } | undefined
  for (const id of s.hands[side]) {
    const card = cardById(id)
    const b = clashBalance(card)
    for (let lane = 0; lane < CLASH_LANES; lane++) {
      if (!canClashPlay(s, side, id, lane)) continue
      const mine = unitAt(s, side, lane)
      const foe = unitAt(s, foeSide, lane)
      let score: number
      if (card.kind === 'creature') {
        score = 2 + b.attack * 1.2 + b.hp * 0.5 + b.armor * 1.5
        if (mine) score -= 3 + mine.attack * 1.2 + mine.hp * 0.5
        if (foe) {
          const foePower = clashPower(s, foe)
          if (b.attack >= foe.hp + foe.armor) score += 3 + foe.attack
          if (foePower >= b.hp + b.armor) score -= 2.5
          // Blocking also shields our boss from that fighter's next strike.
          score += foePower * 0.6
        } else score += b.attack * 0.9
        if ((card.keywords ?? []).includes('swarm'))
          score += s.units.some(
            (u) => u.side === side && Math.abs(u.lane - lane) === 1,
          )
            ? 1.5
            : 0
      } else if (card.kind === 'trap')
        score =
          foe && !mine
            ? 2 +
              Math.min(b.power, foe.hp) +
              (b.power >= foe.hp + foe.armor ? 2 : 0)
            : mine
              ? 0.4
              : 1.4
      else if (card.effect === 'scan')
        score = s.traps.some((t) => t.side === foeSide && t.lane === lane)
          ? 5
          : 0.5
      else if (aim(card) === 'own') {
        const across = unitAt(s, foeSide, lane)
        score =
          1.5 +
          (mine?.attack ?? 0) * 0.6 +
          (across ? 0.5 : 1.5) +
          (card.effect === 'heal' && mine
            ? Math.min(b.power, mine.maxHp - mine.hp) * 1.2 - 1.5
            : 0)
      } else
        score =
          2.2 +
          (foe && b.power >= foe.hp + foe.armor
            ? 5 + foe.attack
            : b.power * 0.8) +
          (foe && !mine ? 1 : 0)
      score /= b.plays
      if (!best || score > best.score) best = { score, card: id, lane }
    }
  }
  return best
    ? { t: 'play', side, card: best.card, lane: best.lane }
    : { t: 'pass', side }
}
