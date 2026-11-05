import assert from 'node:assert/strict'
import {
  playHeadless,
  runTournament,
  type MatchMetrics,
} from '../slimeCity/playtest'
import { TEAMS, replayMatch, type TeamId } from '../slimeCity/prototypes'
import { summarizeTournament } from '../slimeCity/tournament'

/**
 * Blackout is tested with the starter decks on both sides to isolate faction
 * and initiative effects from custom deck quality. Ten seeds are exploratory,
 * not enough to claim a final win-rate target for competitive matchmaking.
 */
const seeds = [37, 89, 101, 137, 173, 211, 251, 307, 349, 397]
const matches = runTournament('blackout', seeds)
const summary = summarizeTournament('blackout', seeds, matches)
const teamIds = TEAMS.map((team) => team.id)
const matchup = new Map<string, MatchMetrics>(
  matches.map((match): [string, MatchMetrics] => [
    [match.playerTeam, match.enemyTeam, match.seed].join(':'),
    match,
  ]),
)
assert.equal(matches.length, 300)
assert.equal(summary.matches, 300)
assert.equal(summary.crews.length, 6)
assert.equal(matchup.size, 300)

interface PairScore {
  a: TeamId
  b: TeamId
  matches: number
  aWins: number
  bWins: number
  draws: number
  averageRounds: number
  noContact: number
}

const pairs: PairScore[] = []
for (let first = 0; first < teamIds.length; first++) {
  for (let second = first + 1; second < teamIds.length; second++) {
    const a = teamIds[first]!
    const b = teamIds[second]!
    const tally: PairScore = {
      a,
      b,
      matches: 0,
      aWins: 0,
      bWins: 0,
      draws: 0,
      averageRounds: 0,
      noContact: 0,
    }
    for (const seed of seeds) {
      const forward = matchup.get([a, b, seed].join(':'))
      const reverse = matchup.get([b, a, seed].join(':'))
      assert.ok(forward && reverse, 'Both seating orders must be played')
      for (const bout of [forward, reverse]) {
        tally.matches++
        tally.averageRounds += bout.rounds
        if (bout.firstContact === null) tally.noContact++
        if (bout.victor === 'draw') tally.draws++
        else if (
          (bout.playerTeam === a && bout.victor === 'player') ||
          (bout.enemyTeam === a && bout.victor === 'enemy')
        )
          tally.aWins++
        else tally.bWins++
      }
    }
    assert.equal(tally.matches, seeds.length * 2)
    assert.equal(tally.aWins + tally.bWins + tally.draws, tally.matches)
    tally.averageRounds = Number(
      (tally.averageRounds / tally.matches).toFixed(2),
    )
    pairs.push(tally)
  }
}
assert.equal(pairs.length, 15)
assert.equal(
  pairs.reduce((sum, pair) => sum + pair.matches, 0),
  matches.length,
)

const crews = summary.crews.map((crew) => {
  assert.equal(crew.matches, (teamIds.length - 1) * seeds.length * 2)
  assert.equal(crew.asPlayer.matches, (teamIds.length - 1) * seeds.length)
  assert.equal(crew.asEnemy.matches, (teamIds.length - 1) * seeds.length)
  return {
    team: crew.team,
    games: crew.matches,
    firstSideWins: crew.asPlayer.wins,
    secondSideWins: crew.asEnemy.wins,
    wins: crew.wins,
    losses: crew.losses,
    draws: crew.draws,
    scorePercent: Number((crew.scoreRate * 100).toFixed(1)),
    averageRounds: Number(crew.averageRounds.toFixed(1)),
    longestStall: crew.longestStall,
    withoutContact: crew.withoutContact,
    winPaths: crew.winPaths,
  }
})

// Founder balance guard (t-021, 2026-11-05 PT). Four founder stat changes
// (Broker armor 1->0, Chimera armor 2->1, Pogo HP 2->3, Welder armor 0->1)
// took the held-out spread from 0.142-0.149 to 0.046-0.058 (60 seeds x 30
// pairings, two independent seed sets; every crew 44-58%). These ten seeds
// read 0.083 (crews 42-65%; the old stats read 0.155, Bloodfairies 30%,
// Exchange 70%). Ten seeds is about +/-0.05 of noise per crew, so this
// catches a runaway crew, not a few points of drift; re-measure on held-out
// seeds before moving a limit.
const SPREAD_LIMIT = 0.11
const rates = crews.map((crew) => crew.scorePercent / 100)
const meanRate = rates.reduce((x, y) => x + y, 0) / rates.length
const spread = Math.sqrt(
  rates.reduce((x, r) => x + (r - meanRate) ** 2, 0) / (rates.length - 1),
)
assert.ok(
  spread <= SPREAD_LIMIT,
  'Founder crews stay balanced: spread ' + spread.toFixed(3),
)
for (const crew of crews)
  assert.ok(
    crew.scorePercent >= 35 && crew.scorePercent <= 70,
    crew.team + ' runs away at ' + crew.scorePercent + '%',
  )

// BLOODRUSH crew guard (t-025, 2026-11-05 PT). The timed lane needs its own
// lever (BLOODRUSH_CREW_HP, dithered per-crew HP offsets): held-out spread
// 0.191 -> 0.064 and 0.169 -> 0.068. These ten seeds read 0.079 (crews
// 43-65%; the uncalibrated lane read 0.165 with Riot at 25%).
{
  const rush = runTournament('bloodrush', seeds)
  assert.equal(rush.length, 300)
  const score: Record<string, number> = {}
  for (const bout of rush) {
    const p = bout.victor === 'player' ? 1 : bout.victor === 'draw' ? 0.5 : 0
    score[bout.playerTeam] = (score[bout.playerTeam] ?? 0) + p
    score[bout.enemyTeam] = (score[bout.enemyTeam] ?? 0) + 1 - p
  }
  const rushRates = teamIds.map((id) => score[id]! / 100)
  const rushMean = rushRates.reduce((x, y) => x + y, 0) / rushRates.length
  const rushSpread = Math.sqrt(
    rushRates.reduce((x, r) => x + (r - rushMean) ** 2, 0) /
      (rushRates.length - 1),
  )
  assert.ok(
    rushSpread <= 0.12,
    'BLOODRUSH crews stay balanced: spread ' + rushSpread.toFixed(3),
  )
  teamIds.forEach((id, i) =>
    assert.ok(
      rushRates[i]! >= 0.3 && rushRates[i]! <= 0.7,
      'BLOODRUSH: ' + id + ' runs away at ' + rushRates[i]!.toFixed(2),
    ),
  )
}

const warnings = [...summary.warnings]
for (const crew of crews) {
  if (crew.scorePercent < 30 || crew.scorePercent > 70)
    warnings.push(
      crew.team + ' has a highly skewed 100-bout score in this seed sample',
    )
}
if (Math.abs(summary.wins.player - summary.wins.enemy) / matches.length > 0.15)
  warnings.push('Over 15 percentage points of first/second-side separation')

const noContact = matches.filter((match) => match.firstContact === null).length
const overtime = matches.filter((match) => match.overtime).length
const comebacks = matches.filter((match) => match.comeback).length
const leadChanges = matches.reduce((sum, match) => sum + match.leadChanges, 0)
const deadRounds = matches.reduce((sum, match) => sum + match.deadRounds, 0)
const longestDeadStreak = Math.max(
  ...matches.map((match) => match.longestDeadStreak),
)
const winPaths: Record<string, number> = {}
for (const match of matches) {
  const path = match.winPath ?? 'draw'
  winPaths[path] = (winPaths[path] ?? 0) + 1
}

// A complete replay for every crew, plus two identical seeded evaluations.
// This verifies commands, not only the winner shown by the summary.
for (const [index, team] of TEAMS.entries()) {
  const rival = TEAMS[(index + 1) % TEAMS.length]!
  const seed = seeds[index]!
  const first = playHeadless('blackout', team.id, rival.id, seed)
  const second = playHeadless('blackout', team.id, rival.id, seed)
  assert.deepEqual(first.state, second.state)
  assert.deepEqual(first.metrics, second.metrics)
  assert.deepEqual(
    replayMatch(
      { mode: 'blackout', teamId: team.id, foeId: rival.id, seed },
      first.state.commands,
    ),
    first.state,
    'A finished seeded match must reconstruct from its exact command log',
  )
}
console.log(
  'SLIME_CITY_TEN_SEED_FACTION_REPORT ' +
    JSON.stringify({
      method: 'actual Blackout CPU-versus-CPU engine; every crew in both seats',
      seeds,
      games: matches.length,
      sideWins: summary.wins,
      noContact,
      averageRounds: Number(summary.averageRounds.toFixed(2)),
      averageFirstContact: summary.firstContactAverage,
      averageDeadRounds: Number(summary.averageDeadRounds.toFixed(2)),
      deadRounds,
      longestDeadStreak,
      overtime,
      comebacks,
      leadChanges,
      winPaths,
      crews,
      pairs,
      warnings,
      interpretation:
        'Exploratory ten-seed sample; not a player-fun or balance approval',
    }),
)
console.log(
  'Slime City ten-seed faction balance: 300 real bouts, both seats, 15 pairings, six exact replays PASS',
)
