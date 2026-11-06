// CLASH is Slime City's canonical match rules. Older arena formats live in Legacy.
// Seeded, pure commands: client, CPU and replay all use the same transition rules.
import { alleyDeck } from './alleys'
import {
  cardById,
  type Card,
  type Keyword,
  type Side,
  type TeamId,
} from './prototypes'

export const CLASH_LANES = 5
export const CLASH_BOSS_HP = 18
export const CLASH_PLAYS = 2
export const CLASH_DECK_SIZE = 20
export const CLASH_HAND_SIZE = 5
export const CLASH_ROUND_LIMIT = 14

export type ClashPhase = 'play' | 'attack'
export type ClashTarget = number | 'boss'
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
  gear: string[]
}
export interface ClashTrap {
  side: Side
  lane: number
  cardId: string
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
  | { t: 'attack'; side: Side; uid: number; target: ClashTarget }
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
/** No changes to CARDS or the legacy battle engines. */
export function clashBalance(card: Card): ClashCardBalance {
  const plays = clashPlayCost(card)
  const heavy = plays === 2
  return {
    plays,
    // Baseline 2 power keeps the mandatory end-of-round heal from stalling duels.
    attack: clamp((card.attack ?? 2) + (heavy ? 1 : 0), 2, heavy ? 5 : 4),
    hp: clamp((card.hp ?? 3) + (heavy ? 2 : 0), 2, heavy ? 9 : 6),
    armor: clamp(card.armor ?? 0, 0, 1),
    power: clamp(card.power ?? 2, 1, heavy ? 4 : 2),
  }
}
/** Clash text explains the effect actually executed, not legacy mana/AP rules. */
export function clashCardText(card: Card): string {
  const b = clashBalance(card)
  const suffix = b.plays === 2 ? ' Costs both card plays.' : ''
  if (card.kind === 'creature')
    return (
      'Deploy a ' +
      b.attack +
      '-power, ' +
      b.hp +
      '-life follower. Attacks trade damage; survivors heal 1 at round end.' +
      (card.keywords?.length
        ? ' Traits: ' + card.keywords.join(', ') + '.'
        : '') +
      suffix
    )
  if (card.kind === 'trap')
    return (
      'Arm a lane. Its next enemy entrant takes ' +
      b.power +
      ' damage' +
      (card.roots ? ' and cannot attack on its next turn.' : '.') +
      suffix
    )
  let text: string
  switch (card.effect) {
    case 'heal':
      text = 'Restore ' + b.power + ' life to a friendly follower.'
      break
    case 'armor':
      text = 'Friendly follower gains +1 armor, up to 2.'
      break
    case 'sharpen':
      text =
        'Friendly follower gains +' +
        (b.plays === 2 ? 2 : 1) +
        ' permanent power.'
      break
    case 'boost':
      text =
        card.kind === 'equipment'
          ? 'Friendly follower gains +' +
            (b.plays === 2 ? 2 : 1) +
            ' permanent power.'
          : 'Friendly follower gains +' + b.power + ' power for this round.'
      break
    case 'grant':
      text = 'Friendly follower gains ' + (card.grants ?? []).join(', ') + '.'
      break
    case 'scan':
      text = 'Clear an enemy trap in this lane. Draw a replacement card.'
      break
    case 'chaos':
      text = 'Deal 1–' + b.power + ' damage to an opposing follower.'
      break
    case 'root':
      text = 'Opposing follower misses its attack this turn.'
      break
    case 'snare':
    case 'debt':
      text =
        'Deal ' +
        b.power +
        ' damage and stop that follower attacking this turn.'
      break
    case 'blast':
      text = 'Deal ' + b.power + ' damage, plus 1 to adjacent enemy followers.'
      break
    default:
      text = 'Deal ' + b.power + ' damage to an opposing follower.'
  }
  return text + suffix
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
  for (const u of s.units.filter((v) => v.side === side)) u.attacked = false
  draw(s, side)
  note(
    s,
    (side === 'player' ? 'YOUR TURN' : 'RIVAL TURN') +
      ': two card plays, then choose your attacks. Unplayed cards expire.',
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
    boss: { player: CLASH_BOSS_HP, enemy: CLASH_BOSS_HP },
    decks: { player: [], enemy: [] },
    hands: { player: [], enemy: [] },
    discards: { player: [], enemy: [] },
    units: [],
    traps: [],
    log: [],
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
  if (s.plays[side] >= CLASH_PLAYS) s.phase = 'attack'
  s.commands.push({ t: 'play', side, card: id, lane })
  checkWinner(s)
  return s
}
/** Finish placement early. Remaining plays are forfeited, attacks begin. */
export function passClash(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'play')
    return input
  const s = structuredClone(input)
  s.phase = 'attack'
  note(
    s,
    (side === 'player' ? 'You' : 'Rival') + ' finish placing cards.',
    'play',
  )
  s.commands.push({ t: 'pass', side })
  return s
}
export function canClashAttack(
  s: ClashState,
  side: Side,
  uid: number,
  target: ClashTarget,
): boolean {
  if (s.victor || s.active !== side || s.phase !== 'attack') return false
  const attacker = s.units.find((u) => u.uid === uid && u.side === side)
  if (!attacker || attacker.attacked || attacker.rooted) return false
  const foes = s.units.filter((u) => u.side === opponent(side))
  if (target === 'boss') return foes.length === 0
  return foes.some((u) => u.uid === target)
}
/**
 * Player-chosen attack: any enemy follower must be fought before face.
 * Both fighters deal their current power simultaneously, so lethal hits trade.
 */
export function attackClash(
  input: ClashState,
  side: Side,
  uid: number,
  target: ClashTarget,
): ClashState {
  if (!canClashAttack(input, side, uid, target)) return input
  const s = structuredClone(input)
  const attacker = s.units.find((u) => u.uid === uid)!
  const foeSide = opponent(side)
  const attackPower = clashPower(s, attacker)
  attacker.attacked = true
  attacker.ambushUsed = true
  if (target === 'boss') {
    s.boss[foeSide] -= attackPower
    note(
      s,
      nameOf(attacker) + ' hits the rival boss for ' + attackPower + '.',
      'boss',
      attacker.lane,
    )
  } else {
    const defender = s.units.find((u) => u.uid === target)!
    const defensePower = defender.rooted ? 0 : clashPower(s, defender)
    const dealt = damage(defender, attackPower, has(attacker, 'pierce') ? 1 : 0)
    const returned = damage(
      attacker,
      defensePower,
      has(defender, 'pierce') ? 1 : 0,
    )
    defender.ambushUsed = true
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
      attacker.lane,
    )
    if (has(attacker, 'bulldoze') && defender.hp < 0)
      s.boss[foeSide] += defender.hp
    if (dealt > 0 && has(attacker, 'snare')) defender.rooted = true
    if (dealt > 0 && has(defender, 'snare')) attacker.rooted = true
    if (dealt > 0 && has(attacker, 'leech'))
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1)
    if (returned > 0 && has(defender, 'leech'))
      defender.hp = Math.min(defender.maxHp, defender.hp + 1)
    if (defender.hp <= 0 && has(attacker, 'collect'))
      attacker.attack = clamp(attacker.attack + 1, 1, 6)
  }
  casualties(s)
  checkWinner(s)
  s.commands.push({ t: 'attack', side, uid, target })
  return s
}
/** End this side's attacks. Unplayed hand cards expire, never carry over. */
export function endClashTurn(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.phase !== 'attack')
    return input
  const s = structuredClone(input)
  discardHand(s, side)
  for (const u of s.units.filter((v) => v.side === side)) u.rooted = false
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
  note(s, 'ROUND END: surviving followers recover 1 life.', 'turn')
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
    case 'attack':
      return attackClash(s, command.side, command.uid, command.target)
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
  if (s.phase === 'attack') {
    const attackers = s.units.filter(
      (u) => u.side === side && !u.attacked && !u.rooted,
    )
    if (!attackers.length) return { t: 'end', side }
    const foes = s.units.filter((u) => u.side === opponent(side))
    if (!foes.length) {
      const strongest = [...attackers].sort(
        (a, b) => clashPower(s, b) - clashPower(s, a) || a.uid - b.uid,
      )[0]!
      return { t: 'attack', side, uid: strongest.uid, target: 'boss' }
    }
    let best: { score: number; uid: number; target: number } | undefined
    for (const mine of attackers) {
      for (const foe of foes) {
        const dealt = Math.max(0, clashPower(s, mine) - foe.armor)
        const taken = Math.max(0, clashPower(s, foe) - mine.armor)
        const score =
          (dealt >= foe.hp ? 9 + foe.attack : dealt * 1.7) -
          (taken >= mine.hp ? 3 + mine.attack : taken * 0.7)
        if (!best || score > best.score)
          best = { score, uid: mine.uid, target: foe.uid }
      }
    }
    return { t: 'attack', side, uid: best!.uid, target: best!.target }
  }
  let best: { score: number; card: string; lane: number } | undefined
  for (const id of s.hands[side]) {
    const card = cardById(id)
    const b = clashBalance(card)
    for (let lane = 0; lane < CLASH_LANES; lane++) {
      if (!canClashPlay(s, side, id, lane)) continue
      const mine = unitAt(s, side, lane)
      const foe = unitAt(s, opponent(side), lane)
      let score: number
      if (card.kind === 'creature') {
        score = 3 + b.attack * 1.6 + b.hp * 0.3
        if (mine) score -= 2 + mine.attack * 1.3 + mine.hp * 0.3
        if (foe) score += 0.5
        if ((card.keywords ?? []).includes('swarm'))
          score += s.units.some(
            (u) => u.side === side && Math.abs(u.lane - lane) === 1,
          )
            ? 2
            : 0
      } else if (card.kind === 'trap') score = 1.1
      else if (card.effect === 'scan')
        score = s.traps.some((t) => t.side !== side && t.lane === lane)
          ? 5
          : 0.5
      else if (aim(card) === 'own') score = 1.3 + (mine?.attack ?? 0) * 0.8
      else score = 2.2 + (foe && b.power >= foe.hp + foe.armor ? 5 : b.power)
      score /= b.plays
      if (!best || score > best.score) best = { score, card: id, lane }
    }
  }
  return best
    ? { t: 'play', side, card: best.card, lane: best.lane }
    : { t: 'pass', side }
}
