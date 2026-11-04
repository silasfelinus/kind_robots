// TURF crew balance guard (Silas, 2026-11-04: "I want both", the Turf balance
// test after the wards/traps, slime, trait and PARITY passes). A fixed-seed
// round-robin, every crew in both seats, in normal TURF and under PARITY.
// Deterministic, so it only moves when the rules or the CPU change.
//
// Twenty games a crew is a small sample (about ±0.11 of noise per crew), so
// this catches a runaway crew (Riot's 1.00 before the VOLATILE fix), not a
// few points of drift. On these seeds normal TURF reads 0.110 (crews
// 0.35-0.65) and PARITY 0.173 (0.30-0.75); tripling SWARM's worth reads 0.210
// with Bloodfairies at 0.80 and fails. It is deterministic: if a deliberate
// rule change trips it, re-measure on a large sample before moving a limit.
// The measured balance (160 games a crew) is 0.06 normal, 0.07 PARITY.
import assert from 'node:assert/strict'
import { TEAMS } from '../slimeCity/prototypes'
import { playHeadless } from '../slimeCity/playtest'

const SEEDS = [401, 414]
const SPREAD_LIMIT = 0.19
const FLOOR = 0.25
const CEILING = 0.78

for (const parity of [false, true]) {
  const label = parity ? 'PARITY TURF' : 'TURF'
  const score: Record<string, number> = {}
  for (const a of TEAMS)
    for (const b of TEAMS) {
      if (a.id === b.id) continue
      for (const seed of SEEDS) {
        const { state } = playHeadless('turf', a.id, b.id, seed, undefined, {
          parity,
        })
        assert.ok(state.victor, label + ' resolves')
        const p =
          state.victor === 'player' ? 1 : state.victor === 'draw' ? 0.5 : 0
        score[a.id] = (score[a.id] ?? 0) + p
        score[b.id] = (score[b.id] ?? 0) + 1 - p
      }
    }
  const games = SEEDS.length * (TEAMS.length - 1) * 2
  const rates = TEAMS.map((t) => score[t.id]! / games)
  const mean = rates.reduce((x, y) => x + y, 0) / rates.length
  const spread = Math.sqrt(
    rates.reduce((x, r) => x + (r - mean) ** 2, 0) / (rates.length - 1),
  )
  assert.ok(
    spread <= SPREAD_LIMIT,
    label + ' crews stay balanced: spread ' + spread.toFixed(3),
  )
  TEAMS.forEach((team, i) =>
    assert.ok(
      rates[i]! >= FLOOR && rates[i]! <= CEILING,
      label + ': ' + team.id + ' runs away at ' + rates[i]!.toFixed(2),
    ),
  )
}

console.log(
  'Slime City TURF crews: fixed-seed round-robins in normal TURF and PARITY, no crew runs away PASS',
)
