// Constructed CLASH ALLIANCE adversarial QA. Starter decks alone cannot
// exercise a 300-card pool or isolate which of two crews should be general.
// CPU-vs-CPU sweeps are diagnostic, not evidence of human fun acceptance.
import assert from 'node:assert/strict'
import { CARDS, TEAMS, type Card, type TeamId } from '../slimeCity/prototypes'
import {
  ALLIANCE_DECK_SIZE,
  allianceProblems,
  allianceStarter,
  swapGeneral,
  validAllianceDeck,
  type AllianceDeck,
} from '../slimeCity/alliance'
import {
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  createClash,
  replayClash,
} from '../slimeCity/clash'

const crews = TEAMS.map((team) => team.id)
const pool = (team: TeamId | 'mercenary'): Card[] =>
  CARDS.filter((card) => card.team === team)
const mercs = pool('mercenary')
assert.equal(crews.length, 6)
assert.equal(CARDS.length, 300)
assert.equal(mercs.length, 60)

// Rotating whole catalog slices avoids testing the same ten founders repeatedly.
// Pick without replacement, even when the offset wraps around.
function pick(cards: Card[], count: number, offset: number): string[] {
  assert.ok(cards.length >= count, 'enough cards for constructed plan')
  return Array.from(
    { length: count },
    (_, i) => cards[(offset + i) % cards.length]!.id,
  )
}

const plans = [
  'starter',
  'balanced-a',
  'balanced-b',
  'general-heavy',
  'ally-heavy',
  'mercenary-heavy',
  'mercenary-only',
  'creatures-only',
  'specials-only',
] as const
type Plan = (typeof plans)[number]

function construct(
  general: TeamId,
  ally: TeamId,
  plan: Plan,
  rotation: number,
): AllianceDeck {
  if (plan === 'starter') return allianceStarter(general, ally)
  const primary = pool(general)
  const secondary = pool(ally)
  const offset = rotation * 7
  let cards: string[]
  switch (plan) {
    case 'balanced-a':
      cards = [...pick(primary, 10, offset), ...pick(secondary, 10, offset)]
      break
    case 'balanced-b':
      cards = [
        ...pick(primary, 10, offset + 20),
        ...pick(secondary, 10, offset + 20),
      ]
      break
    case 'general-heavy':
      cards = [...pick(primary, 17, offset), ...pick(secondary, 3, offset)]
      break
    case 'ally-heavy':
      cards = [...pick(primary, 3, offset), ...pick(secondary, 17, offset)]
      break
    case 'mercenary-heavy':
      cards = [
        ...pick(primary, 3, offset),
        ...pick(secondary, 3, offset),
        ...pick(mercs, 14, offset),
      ]
      break
    case 'mercenary-only':
      cards = pick(mercs, ALLIANCE_DECK_SIZE, offset)
      break
    case 'creatures-only':
    case 'specials-only': {
      const eligible = [...primary, ...secondary, ...mercs].filter(
        (card) => (card.kind === 'creature') === (plan === 'creatures-only'),
      )
      cards = pick(eligible, ALLIANCE_DECK_SIZE, offset)
      break
    }
  }
  const deck = { general, ally, cards }
  assert.deepEqual(
    allianceProblems(deck),
    [],
    plan + ': ' + general + '/' + ally,
  )
  assert.ok(validAllianceDeck(deck), 'valid saved Alliance deck')
  assert.deepEqual(
    allianceProblems(swapGeneral(deck)),
    [],
    'swapping general cannot invalidate card ownership',
  )
  return deck
}

// Every catalog ID must be constructible, even when a CPU avoids playing it.
// Separates legality/offer coverage from actual play and third-stage reach.
for (const card of CARDS) {
  const general = card.team === 'mercenary' ? crews[0]! : (card.team as TeamId)
  const ally = crews.find((team) => team !== general)!
  const filler = [...pool(general), ...pool(ally), ...mercs].filter(
    (candidate) => candidate.id !== card.id,
  )
  const deck: AllianceDeck = {
    general,
    ally,
    cards: [card.id, ...pick(filler, ALLIANCE_DECK_SIZE - 1, 0)],
  }
  assert.ok(
    validAllianceDeck(deck),
    card.id + ' must fit a legal Alliance deck',
  )
}

type Score = { games: number; wins: number; draws: number; rounds: number }
const empty = (): Score => ({ games: 0, wins: 0, draws: 0, rounds: 0 })
const byPlan = Object.fromEntries(
  plans.map((plan) => [plan, empty()]),
) as Record<Plan, Score>
const byGeneral = Object.fromEntries(
  crews.map((id) => [id, empty()]),
) as Record<TeamId, Score>
const powerUse = Object.fromEntries(crews.map((id) => [id, 0])) as Record<
  TeamId,
  number
>
const offered = new Set<string>()
const played = new Map<string, { plays: number; l2: number; l3: number }>()
let games = 0
let firstSeatWins = 0
let draws = 0
let replays = 0
let generalSwapGames = 0

function observeDeck(deck: AllianceDeck): void {
  for (const id of deck.cards) offered.add(id)
}

function play(
  player: AllianceDeck,
  enemy: AllianceDeck,
  seed: number,
  plan: Plan,
  replay: boolean,
): void {
  const options = { alliance: { player, enemy } }
  let state = createClash(player.general, enemy.general, seed, options)
  for (let step = 0; !state.victor && step < 1800; step++) {
    const command = chooseClashCpu(state, state.active)
    if (command.t === 'play') {
      const level = state.levels[command.side][command.card] ?? 1
      const count = played.get(command.card) ?? { plays: 0, l2: 0, l3: 0 }
      count.plays++
      if (level === 2) count.l2++
      if (level >= 3) count.l3++
      played.set(command.card, count)
    }
    const next = applyClashCommand(state, command)
    assert.notStrictEqual(
      next,
      state,
      'CPU must not issue a no-op: ' + plan + '/' + seed,
    )
    state = next
  }
  assert.ok(state.victor, 'match terminates: ' + plan + '/' + seed)
  assert.ok(state.round <= CLASH_ROUND_LIMIT, 'round cap')
  assert.equal(state.format, 'alliance')
  assert.deepEqual(state.allies, {
    player: player.ally,
    enemy: enemy.ally,
  })
  const powers = state.commands.filter((command) => command.t === 'power')
  assert.equal(
    new Set(
      powers.map(
        (command) =>
          command.side + ':' + (command.team ?? state.teams[command.side]),
      ),
    ).size,
    powers.length,
    'each faction power fires at most once per side',
  )
  for (const side of ['player', 'enemy'] as const) {
    const general = state.teams[side]
    const result = byGeneral[general]
    result.games++
    result.rounds += state.round
    if (state.victor === side) result.wins++
    if (state.victor === 'draw') result.draws++
    if (state.powersUsed?.[side]?.includes(general)) powerUse[general]++
  }
  const result = byPlan[plan]
  result.games++
  result.rounds += state.round
  if (state.victor === 'player') {
    firstSeatWins++
    result.wins++
  }
  if (state.victor === 'draw') {
    draws++
    result.draws++
  }
  games++

  if (replay) {
    const again = replayClash(
      player.general,
      enemy.general,
      seed,
      state.commands,
      options,
    )
    assert.deepEqual(again.boss, state.boss, 'Alliance replay boss')
    assert.deepEqual(again.units, state.units, 'Alliance replay board')
    assert.deepEqual(again.traps, state.traps, 'Alliance replay traps')
    assert.deepEqual(again.levels, state.levels, 'Alliance replay evolutions')
    assert.deepEqual(
      again.powersUsed,
      state.powersUsed,
      'Alliance replay powers',
    )
    assert.equal(again.victor, state.victor, 'Alliance replay result')
    replays++
  }
}

let pairing = 0
for (const general of crews)
  for (const ally of crews.filter((id) => id !== general)) {
    const g = crews.indexOf(general)
    // Opponents change with both crews, not simply the next fixed starter.
    const rival = crews[(g + 2 + crews.indexOf(ally)) % crews.length]!
    const rivalAlly = crews[(crews.indexOf(rival) + 3) % crews.length]!
    for (const [p, plan] of plans.entries()) {
      const a = construct(general, ally, plan, pairing + p)
      const b = construct(rival, rivalAlly, plan, pairing + p + 13)
      observeDeck(a)
      observeDeck(b)
      // Identical opponents, seeds and decks in both seat assignments.
      // Changing the seat must not accidentally change who owns the power.
      for (let trial = 0; trial < 2; trial++) {
        const seed = 41001 + p * 1009 + pairing * 31 + trial
        play(a, b, seed, plan, trial === 0 && pairing % 5 === 0)
        play(b, a, seed, plan, false)
      }
    }
    pairing++
  }
assert.equal(pairing, 30, 'all 30 ordered general/ally pairs tested')

// Isolate the general power: SAME thirty cards, SAME opponent and seed,
// only swap who commands the alliance. Test each arrangement from both seats.
for (let g = 0; g < crews.length; g++) {
  const general = crews[g]!
  for (const ally of crews.filter((id) => id !== general)) {
    const sameCards = construct(general, ally, 'balanced-a', g + 19)
    const rival = crews[(g + 2) % crews.length]!
    const opponent = construct(
      rival,
      crews[(g + 3) % crews.length]!,
      'starter',
      g,
    )
    const seed = 73001 + g * 13 + crews.indexOf(ally)
    play(sameCards, opponent, seed, 'balanced-a', false)
    play(swapGeneral(sameCards), opponent, seed, 'balanced-a', false)
    generalSwapGames += 2
  }
}

const pct = (n: number, total: number): string =>
  ((100 * n) / Math.max(1, total)).toFixed(1) + '%'
const l3Cards = [...played.values()].filter((entry) => entry.l3 > 0).length
const neverPlayed = CARDS.filter((card) => !played.has(card.id)).map(
  (card) => card.name,
)
console.log(
  'CLASH Alliance constructed: ' +
    games +
    ' seeded matches (' +
    generalSwapGames +
    ' general-swap controls), ' +
    replays +
    ' deterministic replays, ' +
    pct(firstSeatWins, games - draws) +
    ' first-seat wins, ' +
    pct(draws, games) +
    ' draws',
)
for (const plan of plans) {
  const r = byPlan[plan]
  console.log(
    '  ' +
      plan.padEnd(18) +
      r.games +
      ' matches · first seat ' +
      pct(r.wins, r.games - r.draws) +
      ' · draws ' +
      pct(r.draws, r.games) +
      ' · avg rounds ' +
      (r.rounds / r.games).toFixed(1),
  )
}
for (const general of crews) {
  const r = byGeneral[general]
  console.log(
    '  general ' +
      general.padEnd(14) +
      pct(r.wins, r.games - r.draws) +
      ' wins · power used ' +
      pct(powerUse[general], r.games),
  )
}
console.log(
  '  catalog: ' +
    offered.size +
    '/300 offered in simulated Alliance decks; ' +
    played.size +
    '/300 actually played; ' +
    l3Cards +
    '/300 played at L3; ' +
    neverPlayed.length +
    ' never played',
)
if (neverPlayed.length)
  console.log('  first never-played: ' + neverPlayed.slice(0, 30).join(', '))
console.log(
  '  Diagnostic only: built deck strategies, CPU heuristics and sparse general-power' +
    ' samples do not establish PvP balance or subjective fun.',
)
