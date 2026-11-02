import { runTournament } from '../slimeCity/playtest'
import { summarizeTournament } from '../slimeCity/tournament'

const seeds = (
  process.argv.slice(2).length ? process.argv.slice(2) : ['7', '29']
).map(Number)
if (seeds.some((seed) => !Number.isSafeInteger(seed) || seed < 1))
  throw new Error('Seeds must be positive integers.')

const matches = runTournament('blackout', seeds)
const report = summarizeTournament('blackout', seeds, matches)
console.log('Slime City BLACKOUT full ordered crew tournament')
console.log(
  'All ' +
    report.matches +
    ' bouts use the CPU and recorded engine, not simulated scores.',
)
console.table(
  report.crews.map((crew) => ({
    crew: crew.team,
    played: crew.matches,
    won: crew.wins,
    lost: crew.losses,
    drawn: crew.draws,
    scorePercent: Math.round(crew.scoreRate * 1000) / 10,
    firstSideWins: crew.asPlayer.wins,
    secondSideWins: crew.asEnemy.wins,
    longestStall: crew.longestStall,
    noContact: crew.withoutContact,
  })),
)
console.log(JSON.stringify(report, null, 2))
