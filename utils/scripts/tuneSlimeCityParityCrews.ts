// PARITY crew calibration (Silas, 2026-11-03: "do it", the crew-balance pass
// after PARITY showed even cards but uneven crews). Plays every ordered crew
// pairing (so every crew sits in both seats) under PARITY, nudges each crew's
// creature budget toward an even 50% match, repeats, then validates the
// result on fresh seeds it was never tuned on.
//
//   npx tsx utils/scripts/tuneSlimeCityParityCrews.ts [iterations] [seeds] [mode]
import {
  PARITY_CREW_EDGE,
  TEAMS,
  type ParityMode,
  type TeamId,
} from '../slimeCity/prototypes'
import { playHeadless } from '../slimeCity/playtest'

const iterations = Number(process.argv[2] ?? 8)
const seedCount = Number(process.argv[3] ?? 16)
const mode = (process.argv[4] ?? 'blackout') as ParityMode
const edges = PARITY_CREW_EDGE[mode]
const tuneSeeds = Array.from({ length: seedCount }, (_, i) => 211 + i * 17)
const checkSeeds = Array.from({ length: seedCount }, (_, i) => 9001 + i * 29)

function roundRobin(seeds: number[]) {
  const score: Record<string, number> = {}
  const games: Record<string, number> = {}
  let playerSeat = 0
  let total = 0
  for (const a of TEAMS)
    for (const b of TEAMS) {
      if (a.id === b.id) continue
      for (const seed of seeds) {
        const { state } = playHeadless(mode, a.id, b.id, seed, undefined, {
          parity: true,
        })
        const p =
          state.victor === 'player' ? 1 : state.victor === 'draw' ? 0.5 : 0
        score[a.id] = (score[a.id] ?? 0) + p
        score[b.id] = (score[b.id] ?? 0) + 1 - p
        games[a.id] = (games[a.id] ?? 0) + 1
        games[b.id] = (games[b.id] ?? 0) + 1
        playerSeat += p
        total++
      }
    }
  const rates = Object.fromEntries(
    TEAMS.map((t) => [t.id, Number((score[t.id]! / games[t.id]!).toFixed(3))]),
  ) as Record<TeamId, number>
  const values = Object.values(rates)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const spread = Math.sqrt(
    values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1),
  )
  return {
    rates,
    spread: Number(spread.toFixed(3)),
    playerSeatWinRate: Number((playerSeat / total).toFixed(3)),
    gamesPerCrew: games[TEAMS[0]!.id],
  }
}

const started = Date.now()
const history: unknown[] = []
for (let i = 0; i <= iterations; i++) {
  const result = roundRobin(tuneSeeds)
  history.push({ iteration: i, edges: { ...edges }, ...result })
  if (i === iterations) break
  for (const team of TEAMS) {
    const gap = 0.5 - result.rates[team.id]
    // A two-point budget swing moves a crew about fifty points of win rate,
    // so step in quarter points, at most half a point a round, and shrink the
    // step as the rounds go on so the fit settles instead of oscillating.
    const damp = 1 / (1 + i / 4)
    const step = Math.max(
      -0.5,
      Math.min(0.5, Math.round(gap * 3 * damp * 4) / 4),
    )
    edges[team.id] = edges[team.id] + step
  }
}
const validation = roundRobin(checkSeeds)
console.log(
  'SLIME_CITY_PARITY_CREWS ' +
    JSON.stringify({ mode, history, finalEdges: edges, validation }, null, 2),
)
console.log('took ' + Math.round((Date.now() - started) / 1000) + 's')
