// Adversarial CLASH evolution matchups: cover the full collectible roster,
// not just each crew's curated starter. Seed-paired seat swaps expose first-seat
// advantage; rotating legal 20-card decks expose weak cards and neutral synergies.
import assert from 'node:assert/strict'
import { CARDS, TEAMS, type TeamId } from '../slimeCity/prototypes'
import {
  applyClashCommand,
  chooseClashCpu,
  clashDeck,
  createClash,
} from '../slimeCity/clash'
import { CLASH_EVOLUTIONS } from '../slimeCity/clashEvolutions'

const crews = TEAMS.map((t) => t.id)
const mercenaries = CARDS.filter((c) => c.team === 'mercenary').map((c) => c.id)
assert.equal(CARDS.length, 300)
assert.equal(mercenaries.length, 60)

const roster = Object.fromEntries(
  crews.map((team) => [team, CARDS.filter((card) => card.team === team)]),
) as Record<TeamId, typeof CARDS>
for (const team of crews) assert.equal(roster[team].length, 40, team)

type DeckPlan = { name: string; build: (team: TeamId) => string[] }
const plans: DeckPlan[] = [
  { name: 'starter', build: (team) => clashDeck(team) },
  ...([0, 1] as const).map((half) => ({
    name: 'faction-half-' + half,
    build: (team: TeamId) =>
      roster[team]
        .filter((_, index) => index % 2 === half)
        .map((card) => card.id),
  })),
  ...Array.from({ length: 6 }, (_, bank) => ({
    name: 'neutral-bank-' + bank,
    build: (team: TeamId) => [
      ...[...roster[team]]
        .sort(
          (a, b) =>
            Number(b.kind === 'creature') - Number(a.kind === 'creature'),
        )
        .slice(0, 10)
        .map((card) => card.id),
      ...mercenaries.slice(bank * 10, bank * 10 + 10),
    ],
  })),
]

const offered = new Set<string>()
for (const plan of plans)
  for (const team of crews) {
    const deck = plan.build(team)
    assert.equal(deck.length, 20, plan.name + '/' + team)
    assert.equal(new Set(deck).size, 20, plan.name + '/' + team)
    for (const id of deck) {
      const card = CARDS.find((candidate) => candidate.id === id)
      assert.ok(card, id + ' exists')
      assert.ok(
        card.team === team || card.team === 'mercenary',
        id + ' belongs in ' + team,
      )
      offered.add(id)
    }
  }
assert.equal(offered.size, 300, 'all 300 cards appear in constructed decks')

type Rate = { games: number; wins: number; draws: number }
const rate = (): Rate => ({ games: 0, wins: 0, draws: 0 })
const observed = new Map<string, { plays: number; l2: number; l3: number }>()
let firstSeatWins = 0
let draws = 0
let games = 0
let rounds = 0
let replays = 0

function play(
  a: TeamId,
  b: TeamId,
  seed: number,
  playerDeck: string[],
  enemyDeck: string[],
  tally: Record<string, Rate>,
  replay: boolean,
): void {
  const options = { decks: { player: playerDeck, enemy: enemyDeck } }
  let state = createClash(a, b, seed, options)
  for (let step = 0; !state.victor && step < 1800; step++) {
    const command = chooseClashCpu(state, state.active)
    if (command.t === 'play') {
      const entry = observed.get(command.card) ?? { plays: 0, l2: 0, l3: 0 }
      entry.plays++
      const level = state.levels[command.side][command.card] ?? 1
      if (level === 2) entry.l2++
      if (level >= 3) entry.l3++
      observed.set(command.card, entry)
    }
    state = applyClashCommand(state, command)
  }
  assert.ok(state.victor, a + '/' + b + ' seed ' + seed + ' terminates')
  assert.ok(state.round <= 24, 'round limit is honored')
  games++
  rounds += state.round
  if (state.victor === 'player') firstSeatWins++
  if (state.victor === 'draw') draws++

  for (const [side, team] of [
    ['player', a],
    ['enemy', b],
  ] as const) {
    const result = tally[team]!
    result.games++
    if (state.victor === side) result.wins++
    if (state.victor === 'draw') result.draws++
  }

  if (replay) {
    let again = createClash(a, b, seed, options)
    for (const command of state.commands)
      again = applyClashCommand(again, command)
    assert.deepEqual(again.boss, state.boss, 'replay boss')
    assert.deepEqual(again.units, state.units, 'replay units')
    assert.deepEqual(again.levels, state.levels, 'replay evolutions')
    assert.equal(again.victor, state.victor, 'replay victor')
    replays++
  }
}

const reports: { name: string; teams: Record<string, Rate> }[] = []
for (const [variant, plan] of plans.entries()) {
  const tally = Object.fromEntries(crews.map((team) => [team, rate()]))
  for (let left = 0; left < crews.length; left++)
    for (let right = left + 1; right < crews.length; right++) {
      const a = crews[left]!
      const b = crews[right]!
      const deckA = plan.build(a)
      const deckB = plan.build(b)
      for (let trial = 0; trial < 4; trial++) {
        const seed = 13001 + variant * 101 + trial * 17 + left * 7 + right
        play(a, b, seed, deckA, deckB, tally, trial === 0)
        play(b, a, seed, deckB, deckA, tally, false)
      }
    }
  reports.push({ name: plan.name, teams: tally })
}

const signatureGroups = new Map<string, string[]>()
let repeatedStage = 0
for (const [id, evolution] of Object.entries(CLASH_EVOLUTIONS)) {
  const sig = (stage: (typeof evolution)[2]) =>
    JSON.stringify({ abilities: stage.abilities, static: stage.static })
  if (sig(evolution[2]) === sig(evolution[3])) repeatedStage++
  const key = JSON.stringify([
    sig(evolution[2]),
    sig(evolution[3]),
    evolution.choice ? sig(evolution.choice.stage) : null,
  ])
  signatureGroups.set(key, [...(signatureGroups.get(key) ?? []), id])
}
const duplicateJourneys = [...signatureGroups.values()].filter(
  (ids) => ids.length > 1,
)
const notPlayed = CARDS.filter((card) => !observed.has(card.id)).map(
  (card) => card.name,
)
const threeUsed = [...observed.values()].filter((card) => card.l3 > 0).length
const pct = (n: number, total: number): string =>
  ((100 * n) / Math.max(1, total)).toFixed(1) + '%'

console.log(
  'CLASH constructed evolution matchups: ' +
    games +
    ' matches, ' +
    replays +
    ' deterministic replays, ' +
    pct(firstSeatWins, games - draws) +
    ' first-seat wins excluding draws, ' +
    pct(draws, games) +
    ' draws, average ' +
    (rounds / games).toFixed(1) +
    ' rounds',
)
for (const report of reports)
  console.log(
    report.name.padEnd(19) +
      crews
        .map((team) => {
          const result = report.teams[team]!
          return team + ' ' + pct(result.wins, result.games)
        })
        .join(' | '),
  )
console.log(
  'Card reach: ' +
    observed.size +
    '/300 played in CPU matchups, ' +
    threeUsed +
    ' played at level 3; unplayed ' +
    notPlayed.length +
    (notPlayed.length ? ': ' + notPlayed.slice(0, 25).join(', ') : ''),
)
console.log(
  'Mechanical repetition among 230 crafted journeys: ' +
    duplicateJourneys.length +
    ' duplicate groups; ' +
    repeatedStage +
    ' identical L2/L3 ability profiles',
)
for (const group of duplicateJourneys.slice(0, 12))
  console.log('  duplicate mechanical journey: ' + group.join(' / '))
