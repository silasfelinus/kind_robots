// FIVE ALLEYS CPU: a readable, greedy rival. It returns one command at a time
// so the board can play its turn out step by step (the play-by-play), and
// alleyCpuTurn runs a whole turn for headless tests.
import { cardById, type Side } from './prototypes'
import {
  ALLEY_LANES,
  aimOf,
  applyAlleyCommand,
  attackTargets,
  blowOf,
  canPlay,
  unitAt,
  type AlleyCommand,
  type AlleyState,
  type AlleyTarget,
  type AlleyUnit,
} from './alleys'

const other = (side: Side): Side => (side === 'player' ? 'enemy' : 'player')

function strikeOn(state: AlleyState, from: AlleyUnit, to: AlleyUnit): number {
  const pierce = from.keywords.includes('pierce') ? 1 : 0
  return Math.max(0, blowOf(state, from) - Math.max(0, to.armor - pierce))
}

/** Score a candidate creature landing: blockers, kills next turn, open alleys. */
function laneValue(
  state: AlleyState,
  side: Side,
  cardId: string,
  lane: number,
): number {
  const card = cardById(cardId)
  const theirs = unitAt(state, other(side), lane)
  const hp = card.hp || 2
  const atk = card.attack ?? 1
  if (!theirs) {
    // An empty alley: a clear run at the boss next turn, more so if their
    // creatures are elsewhere hitting us.
    const threatened = state.units.some((u) => u.side !== side)
    return 3 + atk * 0.6 - (threatened ? 0.5 : 0)
  }
  // Block a threat; better when we would survive its blow and hit back hard.
  const survives = hp > Math.max(0, theirs.attack - (card.armor ?? 0))
  const kills = atk >= theirs.hp + theirs.armor
  return 2 + theirs.attack * 0.8 + (survives ? 2 : -1) + (kills ? 2 : 0)
}

function bestPlay(state: AlleyState, side: Side): AlleyCommand | null {
  const foe = other(side)
  let best: { cmd: AlleyCommand; value: number } | null = null
  const consider = (cmd: AlleyCommand & { t: 'play' }, value: number) => {
    if (!canPlay(state, side, cmd.card, cmd.lane, cmd.target)) return
    if (!best || value > best.value) best = { cmd, value }
  }
  for (const cardId of state.hands[side]) {
    const card = cardById(cardId)
    if (card.cost > state.mana[side]) continue
    // Spend mana: bigger cards first, all else equal.
    const costBias = card.cost * 0.4
    for (let lane = 0; lane < ALLEY_LANES; lane++) {
      const mine = unitAt(state, side, lane)
      const theirs = unitAt(state, foe, lane)
      if (card.kind === 'creature') {
        consider(
          { t: 'play', side, card: cardId, lane },
          laneValue(state, side, cardId, lane) + costBias,
        )
        continue
      }
      if (card.kind === 'trap') {
        // Traps wait where the rival is likely to play: empty enemy slots.
        if (!theirs)
          consider({ t: 'play', side, card: cardId, lane }, 1.5 + costBias)
        continue
      }
      const aim = aimOf(card)
      const power = card.power ?? 2
      if (aim === 'enemy-unit' || aim === 'enemy-any') {
        if (theirs) {
          const kill = power >= theirs.hp + theirs.armor
          consider(
            { t: 'play', side, card: cardId, lane, target: theirs.uid },
            (kill ? 4 + theirs.attack : 1 + theirs.attack * 0.3) + costBias,
          )
        }
        if (aim === 'enemy-any' && lane === 0) {
          const lethal = power >= state.boss[foe]
          consider(
            { t: 'play', side, card: cardId, lane, target: 'boss' },
            (lethal ? 50 : 0.8) + costBias * 0.5,
          )
        }
      } else if (mine && (aim === 'own-unit' || aim === 'own-any')) {
        const hurt = mine.maxHp - mine.hp
        const value =
          card.effect === 'heal'
            ? hurt * 1.2
            : card.effect === 'scan'
              ? 1.6
              : 1.5 + mine.hp * 0.2
        consider(
          { t: 'play', side, card: cardId, lane, target: mine.uid },
          value + costBias,
        )
      } else if (aim === 'own-any' && lane === 0 && card.effect === 'heal') {
        const missing = 20 - state.boss[side]
        consider(
          { t: 'play', side, card: cardId, lane, target: 'boss' },
          Math.min(missing, card.power ?? 2) * 0.8,
        )
      }
    }
  }
  const chosen = best as { cmd: AlleyCommand; value: number } | null
  return chosen && chosen.value > 0.9 ? chosen.cmd : null
}

function bestAttack(state: AlleyState, side: Side): AlleyCommand | null {
  const foe = other(side)
  let best: { cmd: AlleyCommand; value: number } | null = null
  // Lethal first: all the boss damage open this turn.
  const open = state.units
    .filter(
      (u) => u.side === side && attackTargets(state, u.uid).includes('boss'),
    )
    .reduce((sum, u) => sum + blowOf(state, u), 0)
  for (const unit of state.units) {
    if (unit.side !== side) continue
    for (const target of attackTargets(state, unit.uid)) {
      let value: number
      if (target === 'boss') {
        value = open >= state.boss[foe] ? 100 : 3 + blowOf(state, unit)
      } else {
        const defender = state.units.find((u) => u.uid === target)!
        const dealt = strikeOn(state, unit, defender)
        const sameLane = defender.lane === unit.lane
        const back = sameLane ? strikeOn(state, defender, unit) : 0
        const kills = dealt >= defender.hp
        const dies = back >= unit.hp
        value =
          (kills ? 4 + defender.attack + defender.hp * 0.3 : dealt * 0.5) -
          (dies ? 2 + unit.attack : back * 0.3)
      }
      if (!best || value > best.value)
        best = {
          cmd: {
            t: 'attack',
            side,
            uid: unit.uid,
            target: target as AlleyTarget,
          },
          value,
        }
    }
  }
  const chosen = best as { cmd: AlleyCommand; value: number } | null
  // Hold a creature back (it still blocks its alley) rather than lose it for nothing.
  return chosen && chosen.value > 0 ? chosen.cmd : null
}

/** The CPU's next command this turn; 'end' when it has nothing left worth doing. */
export function alleyCpuStep(
  state: AlleyState,
  side: Side,
): AlleyCommand | null {
  if (state.victor || state.active !== side) return null
  return bestPlay(state, side) ?? bestAttack(state, side) ?? { t: 'end', side }
}

/** Play the side's whole turn (headless tests and the CPU-vs-CPU sweep). */
export function alleyCpuTurn(input: AlleyState, side: Side): AlleyState {
  let state = input
  for (let guard = 0; guard < 40; guard++) {
    const cmd = alleyCpuStep(state, side)
    if (!cmd) break
    const next = applyAlleyCommand(state, cmd)
    if (cmd.t === 'end' || next === state) {
      return cmd.t === 'end'
        ? next
        : applyAlleyCommand(state, { t: 'end', side })
    }
    state = next
  }
  return state.active === side
    ? applyAlleyCommand(state, { t: 'end', side })
    : state
}
