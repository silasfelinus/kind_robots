// Slime City: reproducible card-decision telemetry, not a balance approval.
// Run: npx tsx utils/scripts/slimeCityDecisionTelemetry.ts
import assert from 'node:assert/strict'
import {
  applyClashCommand,
  chooseClashCpu,
  clashDeck,
  createClash,
  replayClash,
} from '../slimeCity/clash'
import { TEAMS, type Side } from '../slimeCity/prototypes'

type Counts = {
  deckGames: number
  seenGames: number
  playedGames: number
  plays: number
  activations: number
  upgradedGames: number
}
const stats = new Map<string, Counts>()
const key = (crew: string, card: string) => crew + '/' + card
function row(crew: string, card: string): Counts {
  const id = key(crew, card)
  let found = stats.get(id)
  if (!found) {
    found = {
      deckGames: 0,
      seenGames: 0,
      playedGames: 0,
      plays: 0,
      activations: 0,
      upgradedGames: 0,
    }
    stats.set(id, found)
  }
  return found
}

let games = 0
let activationCommands = 0
let totalRounds = 0
let draws = 0
const sides: Side[] = ['player', 'enemy']
// Both seats and mirrored crew pairings, with multiple deterministic draws.
for (const a of TEAMS)
  for (const b of TEAMS)
    for (const seed of [11, 29]) {
      let state = createClash(a.id, b.id, seed)
      const seen = new Map<Side, Set<string>>(
        sides.map((side) => [side, new Set(state.hands[side])]),
      )
      const played = new Map<Side, Set<string>>(
        sides.map((side) => [side, new Set()]),
      )
      for (let step = 0; !state.victor && step < 700; step++) {
        const side = state.active
        const command = chooseClashCpu(state, side)
        if (command.t === 'play') {
          row(state.teams[side], command.card).plays++
          played.get(side)!.add(command.card)
        }
        if (command.t === 'activate') {
          const unit = state.units.find(
            (candidate) => candidate.uid === command.uid && candidate.side === side,
          )
          assert.ok(unit, 'activation must target an existing friendly unit')
          row(state.teams[side], unit.cardId).activations++
          activationCommands++
        }
        const next = applyClashCommand(state, command)
        assert.notEqual(next, state, 'CPU command must advance the match')
        state = next
        for (const trackedSide of sides)
          for (const card of state.hands[trackedSide])
            seen.get(trackedSide)!.add(card)
      }
      assert.ok(state.victor, 'seeded match must finish')
      assert.deepEqual(
        replayClash(a.id, b.id, seed, state.commands),
        state,
        'telemetry must preserve exact deterministic replay',
      )
      games++
      totalRounds += state.round
      if (state.victor === 'draw') draws++
      for (const side of sides) {
        const crew = state.teams[side]
        for (const card of clashDeck(crew)) {
          const counts = row(crew, card)
          counts.deckGames++
          if (seen.get(side)!.has(card)) counts.seenGames++
          if (played.get(side)!.has(card)) counts.playedGames++
          if ((state.levels[side][card] ?? 1) > 1) counts.upgradedGames++
        }
      }
    }

const cards = [...stats.entries()].map(([card, counts]) => ({
  card,
  ...counts,
  selectionRate:
    counts.seenGames > 0
      ? Number((counts.playedGames / counts.seenGames).toFixed(3))
      : null,
}))
assert.equal(games, TEAMS.length * TEAMS.length * 2)
assert.ok(cards.every((card) => card.playedGames <= card.seenGames))
assert.ok(cards.every((card) => card.seenGames <= card.deckGames))
assert.ok(cards.every((card) => card.upgradedGames <= card.playedGames))
const underselected = cards
  .filter((card) => card.seenGames >= 12 && card.selectionRate !== null)
  .sort((a, b) => a.selectionRate! - b.selectionRate!)
  .slice(0, 25)
console.log(
  'SLIME_CITY_DECISION_TELEMETRY ' +
    JSON.stringify({
      games,
      draws,
      averageRounds: Number((totalRounds / games).toFixed(2)),
      activationCommands,
      definition:
        'selectionRate=matches played at least once / matches seen in hand; starter CPU only, not human preference',
      underselected,
      cards,
    }),
)
