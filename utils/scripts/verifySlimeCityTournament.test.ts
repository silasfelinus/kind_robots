import assert from 'node:assert/strict'
import { runTournament, playHeadless } from '../slimeCity/playtest'
import { TEAMS, replayMatch } from '../slimeCity/prototypes'
import { summarizeTournament } from '../slimeCity/tournament'

const seeds = [29]
const matches = runTournament('blackout', seeds)
const report = summarizeTournament('blackout', seeds, matches)
assert.equal(report.matches, 30)
assert.equal(report.crews.length, TEAMS.length)
assert.deepEqual(report.seeds, seeds)
assert.equal(
  report.wins.player + report.wins.enemy + report.wins.draws,
  report.matches,
)
assert.equal(
  report.crews.reduce((sum, team) => sum + team.matches, 0),
  report.matches * 2,
)
for (const crew of report.crews) {
  assert.equal(crew.matches, 10)
  assert.equal(crew.asPlayer.matches, 5)
  assert.equal(crew.asEnemy.matches, 5)
  assert.equal(crew.wins + crew.losses + crew.draws, crew.matches)
  assert.equal(
    crew.asPlayer.wins + crew.asPlayer.losses + crew.asPlayer.draws,
    5,
  )
  assert.ok(crew.scoreRate >= 0 && crew.scoreRate <= 1)
  assert.ok(crew.averageRounds > 0)
}
assert.ok(report.warnings.some((warning) => warning.includes('Exploratory sample')))
assert.ok(report.averageDeadRounds >= 0)
assert.ok(report.averageTrapsSprung >= 0)
assert.ok(report.firstContactAverage === null || report.firstContactAverage >= 1)

assert.throws(
  () => summarizeTournament('blackout', seeds, matches.slice(1)),
  /Incomplete tournament/,
)
assert.throws(
  () => summarizeTournament('blackout', [29, 29], matches),
  /unique seeds/,
)
const duplicates = [...matches]
duplicates[1] = duplicates[0]!
assert.throws(
  () => summarizeTournament('blackout', seeds, duplicates),
  /Duplicate tournament matchup/,
)
const mismatched = [...matches]
mismatched[0] = { ...mismatched[0]!, mode: 'bloodrush' }
assert.throws(
  () => summarizeTournament('blackout', seeds, mismatched),
  /Invalid tournament matchup/,
)
const sample = playHeadless('blackout', 'ironjaw', 'riot', seeds[0]!)
assert.deepEqual(
  replayMatch(
    { mode: 'blackout', teamId: 'ironjaw', foeId: 'riot', seed: seeds[0]! },
    sample.state.commands,
  ),
  sample.state,
  'A sample tournament command log must reproduce its final state exactly',
)
console.log('Slime City matchup audit: all 30 ordered pairs, six crew summaries, full coverage and seed replay PASS')
console.log('Blackout baseline (one seed; NOT a balance claim): ' +
  JSON.stringify({
    wins: report.wins,
    rounds: report.averageRounds,
    deadRounds: report.averageDeadRounds,
    traps: report.averageTrapsSprung,
    winRates: report.crews.map((crew) => [crew.team, crew.scoreRate]),
  }))
