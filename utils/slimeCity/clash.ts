// CLASH: a self-contained, seeded fun-first five-lane experiment.
// No movement, account economy, or mutation of the existing battle formats.
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
export const CLASH_MANA_GRANT = 3
export const CLASH_MANA_CAP = 6
export const CLASH_HAND_SIZE = 5
export const CLASH_ROUND_LIMIT = 14

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

export interface ClashState {
  seed: number
  rng: number
  teams: Record<Side, TeamId>
  round: number
  active: Side
  plays: Record<Side, number>
  boss: Record<Side, number>
  mana: Record<Side, number>
  debt: Record<Side, number>
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
const opponent = (s: Side): Side => (s === 'player' ? 'enemy' : 'player')
const inside = (lane: number): boolean => Number.isInteger(lane) && lane >= 0 && lane < CLASH_LANES
const unitAt = (state: ClashState, side: Side, lane: number): ClashUnit | undefined =>
  state.units.find((u) => u.side === side && u.lane === lane)
export const clashUnitAt = unitAt
const has = (u: ClashUnit, k: Keyword): boolean => u.keywords.includes(k)
const nameOf = (u: ClashUnit): string => cardById(u.cardId).name
const note = (s: ClashState, text: string, kind: ClashLog['kind'], lane?: number): void => {
  s.log.push({ round: s.round, text, kind, lane })
  if (s.log.length > 75) s.log.shift()
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
/** A 20-card catalog-backed prototype deck, not the account's constructed deck. */
export function createClash(player: TeamId = 'catgirls', enemy: TeamId = 'ironjaw', seed = 1): ClashState {
  const s: ClashState = {
    seed, rng: seed >>> 0, teams: { player, enemy }, round: 1, active: 'player',
    plays: { player: 0, enemy: 0 }, boss: { player: CLASH_BOSS_HP, enemy: CLASH_BOSS_HP },
    mana: { player: CLASH_MANA_GRANT, enemy: CLASH_MANA_GRANT },
    debt: { player: 0, enemy: 0 }, decks: { player: [], enemy: [] },
    hands: { player: [], enemy: [] }, discards: { player: [], enemy: [] },
    units: [], traps: [], log: [], victor: null, nextUid: 1, commands: [],
  }
  s.decks.player = shuffle(s, alleyDeck(player))
  s.decks.enemy = shuffle(s, alleyDeck(enemy))
  draw(s, 'player')
  draw(s, 'enemy')
  note(s, 'ROUND 1 · Both crews receive 3 mana. Two plays each, then everyone fights.', 'turn')
  return s
}
/** CLASH-only wording: no AP, movement, or unexplained substitutions. */
export function clashCardText(card: Card): string {
  if (card.kind === 'creature') return card.text
  if (card.kind === 'trap')
    return 'Arm this lane. The next enemy creature deployed here takes ' + (card.power ?? 2) + ' damage' + (card.roots ? ' and misses a clash.' : '.')
  switch (card.effect) {
    case 'heal': return 'Restore ' + (card.power ?? 2) + ' health to a friendly fighter.'
    case 'armor': return 'Friendly fighter permanently gains +1 armor.'
    case 'sharpen': return 'Friendly fighter permanently gains +1 attack.'
    case 'boost': return card.kind === 'equipment'
      ? 'Friendly fighter permanently gains +1 attack.'
      : 'Friendly fighter gains +2 attack for this clash.'
    case 'grant': return 'Friendly fighter gains ' + (card.grants ?? []).join(', ').toUpperCase() + '.'
    case 'scan': return 'Remove an enemy trap from this lane and draw a card.'
    case 'chaos': return 'Deal 1–3 damage to the opposing fighter in this lane.'
    case 'root': return 'Opposing fighter misses its next clash.'
    case 'snare': return 'Deal ' + (card.power ?? 2) + ' damage; opposing fighter misses its next clash.'
    case 'debt': return 'Deal ' + (card.power ?? 2) + ' damage and reduce next round\'s enemy mana.'
    case 'blast': return 'Deal ' + (card.power ?? 2) + ' damage to this foe and 1 to adjacent foes.'
    case 'zap': return 'Deal ' + (card.power ?? 2) + ' damage to an opposing fighter.'
    default: return 'Target a fighter in this lane.'
  }
}
export function clashPower(s: ClashState, u: ClashUnit): number {
  let power = u.attack + u.surge
  if (has(u, 'ambush') && !u.ambushUsed) power += 2
  if (has(u, 'swarm') && s.units.some((v) => v.uid !== u.uid && v.side === u.side && Math.abs(v.lane - u.lane) === 1)) power++
  return power
}
function aim(card: Card): 'own' | 'enemy' | 'lane' {
  if (card.kind === 'creature' || card.kind === 'trap' || card.effect === 'scan') return 'lane'
  if (card.kind === 'equipment' || ['heal', 'boost', 'armor', 'sharpen', 'grant'].includes(card.effect ?? '')) return 'own'
  return 'enemy'
}
export function canClashPlay(s: ClashState, side: Side, id: string, lane: number): boolean {
  if (s.victor || s.active !== side || s.plays[side] >= CLASH_PLAYS || !inside(lane)) return false
  if (!s.hands[side].includes(id)) return false
  const card = cardById(id)
  if (card.team !== sideTeam(s, side) && card.team !== 'mercenary') return false
  if (card.cost > s.mana[side]) return false
  if (card.kind === 'creature') return true // Friendly creature may be replaced.
  if (card.kind === 'trap') return !s.traps.some((t) => t.side === side && t.lane === lane)
  if (card.effect === 'scan') return true
  return aim(card) === 'own' ? !!unitAt(s, side, lane) : !!unitAt(s, opponent(side), lane)
}
function sideTeam(s: ClashState, side: Side): TeamId { return s.teams[side] }
function dealDamage(u: ClashUnit, amount: number, pierce = 0): number {
  const dealt = Math.max(0, amount - Math.max(0, u.armor - pierce))
  u.hp -= dealt
  return dealt
}
function casualties(s: ClashState): void {
  const fallen = s.units.filter((u) => u.hp <= 0)
  s.units = s.units.filter((u) => u.hp > 0)
  for (const u of fallen) {
    s.discards[u.side].push(u.cardId)
    note(s, nameOf(u) + ' falls in lane ' + (u.lane + 1) + '.', 'death', u.lane)
    if (has(u, 'volatile')) {
      const foe = unitAt(s, opponent(u.side), u.lane)
      if (foe) dealDamage(foe, cardById(u.cardId).burst ?? 1)
      else s.boss[opponent(u.side)] -= cardById(u.cardId).burst ?? 1
    }
  }
  if (s.units.some((u) => u.hp <= 0)) casualties(s)
}
function checkWinner(s: ClashState): void {
  if (s.boss.player <= 0 && s.boss.enemy <= 0) s.victor = 'draw'
  else if (s.boss.player <= 0) s.victor = 'enemy'
  else if (s.boss.enemy <= 0) s.victor = 'player'
}
function resolveClash(s: ClashState): void {
  // Snapshot attacks first: lethal damage never cancels the defender's own blow.
  const shots: { source: ClashUnit; target: ClashUnit | undefined; damage: number }[] = []
  for (const unit of s.units) {
    if (unit.rooted) {
      note(s, nameOf(unit) + ' misses this clash.', 'clash', unit.lane)
      unit.rooted = false
      continue
    }
    shots.push({
      source: unit, target: unitAt(s, opponent(unit.side), unit.lane),
      damage: clashPower(s, unit),
    })
  }
  for (const shot of shots) {
    shot.source.ambushUsed = true
    if (!shot.target) {
      s.boss[opponent(shot.source.side)] -= shot.damage
      note(s, nameOf(shot.source) + ' hits the enemy boss for ' + shot.damage + '.', 'boss', shot.source.lane)
      if (has(shot.source, 'leech')) s.boss[shot.source.side] = Math.min(CLASH_BOSS_HP, s.boss[shot.source.side] + 1)
    } else {
      const dealt = dealDamage(shot.target, shot.damage, has(shot.source, 'pierce') ? 1 : 0)
      note(s, nameOf(shot.source) + ' hits ' + nameOf(shot.target) + ' for ' + dealt + '.', 'clash', shot.source.lane)
      if (has(shot.source, 'bulldoze') && shot.target.hp < 0)
        s.boss[opponent(shot.source.side)] += shot.target.hp
      if (dealt > 0 && has(shot.source, 'leech'))
        s.boss[shot.source.side] = Math.min(CLASH_BOSS_HP, s.boss[shot.source.side] + 1)
      if (dealt > 0 && has(shot.source, 'snare')) shot.target.rooted = true
    }
    if (has(shot.source, 'collect'))
      s.debt[opponent(shot.source.side)] = Math.min(3, s.debt[opponent(shot.source.side)] + 1)
  }
  casualties(s)
  for (const u of s.units) {
    if (has(u, 'regen')) u.hp = Math.min(u.maxHp, u.hp + 1)
    u.surge = 0
  }
  checkWinner(s)
  if (s.victor) {
    note(s, s.victor === 'draw' ? 'Double knockout!' : (s.victor === 'player' ? 'YOU WIN!' : 'RIVAL WINS!'), 'turn')
    return
  }
  if (s.round >= CLASH_ROUND_LIMIT) {
    s.victor = s.boss.player === s.boss.enemy ? 'draw' : s.boss.player > s.boss.enemy ? 'player' : 'enemy'
    note(s, 'Final bell! Highest boss health wins.', 'turn')
    return
  }
  s.round++
  s.active = 'player'
  s.plays = { player: 0, enemy: 0 }
  for (const side of ['player', 'enemy'] as Side[]) {
    const grant = Math.max(0, CLASH_MANA_GRANT - s.debt[side])
    s.debt[side] = Math.max(0, s.debt[side] - CLASH_MANA_GRANT)
    s.mana[side] = Math.min(CLASH_MANA_CAP, s.mana[side] + grant)
    draw(s, side)
  }
  note(s, 'ROUND ' + s.round + ' · Mana +3 (bank up to 6).', 'turn')
}
function advance(s: ClashState, side: Side): void {
  s.plays[side]++
  if (s.plays.player === CLASH_PLAYS && s.plays.enemy === CLASH_PLAYS)
    resolveClash(s)
  else if (s.plays[opponent(side)] < CLASH_PLAYS) s.active = opponent(side)
  else s.active = side
}
export function playClash(input: ClashState, side: Side, id: string, lane: number): ClashState {
  if (!canClashPlay(input, side, id, lane)) return input
  const s = structuredClone(input)
  const card = cardById(id)
  s.mana[side] -= card.cost
  s.hands[side].splice(s.hands[side].indexOf(id), 1)
  const foe = opponent(side)
  if (card.kind === 'creature') {
    const old = unitAt(s, side, lane)
    if (old) {
      s.units = s.units.filter((u) => u.uid !== old.uid)
      s.discards[side].push(old.cardId)
      note(s, nameOf(old) + ' makes room for ' + card.name + '.', 'play', lane)
    }
    const u: ClashUnit = {
      uid: s.nextUid++, side, lane, cardId: id, hp: card.hp ?? 2, maxHp: card.hp ?? 2,
      attack: card.attack ?? 1, armor: card.armor ?? 0, keywords: [...(card.keywords ?? [])],
      surge: 0, rooted: false, ambushUsed: false, gear: [],
    }
    s.units.push(u)
    note(s, card.name + ' enters lane ' + (lane + 1) + '.', 'play', lane)
    const trap = s.traps.find((t) => t.side === foe && t.lane === lane)
    if (trap) {
      const effect = cardById(trap.cardId)
      dealDamage(u, effect.power ?? 2)
      if (effect.roots) u.rooted = true
      s.traps = s.traps.filter((t) => t !== trap)
      s.discards[foe].push(trap.cardId)
      note(s, effect.name + ' springs on ' + card.name + '!', 'trap', lane)
      casualties(s)
    }
  } else if (card.kind === 'trap') {
    s.traps.push({ side, lane, cardId: id })
    note(s, 'A trap is armed in lane ' + (lane + 1) + '.', 'trap', lane)
  } else {
    const target = unitAt(s, aim(card) === 'own' ? side : foe, lane)
    const power = card.power ?? 2
    if (card.effect === 'scan') {
      const removed = s.traps.filter((t) => t.side === foe && t.lane === lane)
      s.traps = s.traps.filter((t) => !removed.includes(t))
      for (const trap of removed) s.discards[foe].push(trap.cardId)
      // Refill even if the hand was already near full.
      draw(s, side)
    } else if (target) {
      switch (card.effect) {
        case 'heal': target.hp = Math.min(target.maxHp, target.hp + power); break
        case 'armor': target.armor++; break
        case 'sharpen': target.attack++; break
        case 'boost':
          if (card.kind === 'equipment') target.attack++
          else target.surge += 2
          break
        case 'grant':
          for (const keyword of card.grants ?? [])
            if (!target.keywords.includes(keyword)) target.keywords.push(keyword)
          break
        case 'root': target.rooted = true; break
        case 'snare': dealDamage(target, power); target.rooted = true; break
        case 'chaos': dealDamage(target, 1 + Math.floor(random(s) * 3)); break
        default:
          dealDamage(target, power)
          if (card.effect === 'blast') {
            for (const nearby of s.units.filter((u) => u.side === foe && Math.abs(u.lane - lane) === 1))
              dealDamage(nearby, 1)
          }
          if (card.effect === 'debt' || card.debt)
            s.debt[foe] = Math.min(3, s.debt[foe] + (card.debt ?? 1))
      }
      if (card.kind === 'equipment') target.gear.push(id)
    }
    note(s, card.name + ' played in lane ' + (lane + 1) + '.', 'play', lane)
    casualties(s)
    s.discards[side].push(id)
  }
  s.commands.push({ t: 'play', side, card: id, lane })
  advance(s, side)
  return s
}
export function passClash(input: ClashState, side: Side): ClashState {
  if (input.victor || input.active !== side || input.plays[side] >= CLASH_PLAYS) return input
  const s = structuredClone(input)
  note(s, (side === 'player' ? 'You' : 'Rival') + ' pass.', 'play')
  s.commands.push({ t: 'pass', side })
  advance(s, side)
  return s
}
export function applyClashCommand(s: ClashState, command: ClashCommand): ClashState {
  return command.t === 'pass'
    ? passClash(s, command.side)
    : playClash(s, command.side, command.card, command.lane)
}
export function replayClash(player: TeamId, enemy: TeamId, seed: number, commands: ClashCommand[]): ClashState {
  return commands.reduce(applyClashCommand, createClash(player, enemy, seed))
}
/** Deterministic, public-board-aware CPU. Deliberately no access to human hand. */
export function chooseClashCpu(s: ClashState, side: Side = 'enemy'): ClashCommand {
  if (s.active !== side || s.victor) return { t: 'pass', side }
  let best: { score: number; card: string; lane: number } | undefined
  for (const id of s.hands[side]) {
    const card = cardById(id)
    for (let lane = 0; lane < CLASH_LANES; lane++) {
      if (!canClashPlay(s, side, id, lane)) continue
      const mine = unitAt(s, side, lane)
      const foe = unitAt(s, opponent(side), lane)
      let score: number
      if (card.kind === 'creature') {
        const damage = Math.max(0, (card.attack ?? 1) - (foe?.armor ?? 0))
        score = foe ? 3 + (foe.attack > 0 ? foe.attack : 0) + damage * 0.5
          : 3 + (card.attack ?? 1) * 1.6
        if (mine) score -= mine.hp + mine.attack * 1.5
        if (foe && (card.hp ?? 2) <= foe.attack) score -= 1.5
      } else if (card.kind === 'trap') score = foe ? 0.2 : 1.4
      else if (card.effect === 'scan') score = s.traps.some((t) => t.side !== side && t.lane === lane) ? 3 : 0.3
      else if (aim(card) === 'own') score = 1 + (mine?.attack ?? 0) * 0.35
      else score = 2 + (foe && (card.power ?? 2) >= foe.hp + foe.armor ? 4 : 0)
      score += Math.min(card.cost, 4) * 0.08
      if (!best || score > best.score) best = { score, card: id, lane }
    }
  }
  return best ? { t: 'play', side, card: best.card, lane: best.lane } : { t: 'pass', side }
}
