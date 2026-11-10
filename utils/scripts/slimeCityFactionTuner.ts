// Slime City shared faction balance tuner (slime-city/t-029).
// One reusable held-out measurement for founders in Blackout and BLOODRUSH, so
// every re-measure (t-028's 20-card pass, later stat changes) uses one method.
//
// Usage: npx tsx utils/scripts/slimeCityFactionTuner.ts [seedsPerPairing] [firstSeed] [modes]
//   seedsPerPairing  default 60   (each seed plays both seats of all 15 pairings)
//   firstSeed        default 1000 (held-out: the committed guard uses 37..397)
//   modes            default blackout,bloodrush (comma list of playtest modes)
// Read the spread, not single crews: n=60 is about +/-0.03 per crew. A change
// is real only if it also holds on a second, disjoint firstSeed.
import { runTournament } from '../slimeCity/playtest'
import { TEAMS, type ModeId } from '../slimeCity/prototypes'

export interface CrewRate {
  team: string
  games: number
  score: number
}
export interface TunerReport {
  mode: ModeId
  seeds: number
  firstSeed: number
  crews: CrewRate[]
  spread: number
  min: number
  max: number
}

/** Sample standard deviation of per-crew score rates (the guards' metric). */
export function spreadOf(rates: number[]): number {
  const mean = rates.reduce((x, y) => x + y, 0) / rates.length
  return Math.sqrt(
    rates.reduce((x, r) => x + (r - mean) ** 2, 0) / (rates.length - 1),
  )
}

export function measureMode(
  mode: ModeId,
  seeds = 60,
  firstSeed = 1000,
): TunerReport {
  const list = Array.from({ length: seeds }, (_, i) => firstSeed + i)
  const score: Record<string, number> = {}
  const games: Record<string, number> = {}
  for (const bout of runTournament(mode, list)) {
    const p = bout.victor === 'player' ? 1 : bout.victor === 'draw' ? 0.5 : 0
    score[bout.playerTeam] = (score[bout.playerTeam] ?? 0) + p
    score[bout.enemyTeam] = (score[bout.enemyTeam] ?? 0) + 1 - p
    games[bout.playerTeam] = (games[bout.playerTeam] ?? 0) + 1
    games[bout.enemyTeam] = (games[bout.enemyTeam] ?? 0) + 1
  }
  const crews = TEAMS.map((t) => ({
    team: t.id as string,
    games: games[t.id] ?? 0,
    score: Number(((score[t.id] ?? 0) / (games[t.id] || 1)).toFixed(3)),
  }))
  const rates = crews.map((c) => c.score)
  return {
    mode,
    seeds,
    firstSeed,
    crews,
    spread: Number(spreadOf(rates).toFixed(3)),
    min: Math.min(...rates),
    max: Math.max(...rates),
  }
}

if (process.argv[1]?.endsWith('slimeCityFactionTuner.ts')) {
  const seeds = Number(process.argv[2] ?? 60)
  const firstSeed = Number(process.argv[3] ?? 1000)
  const modes = (process.argv[4] ?? 'blackout,bloodrush').split(',') as ModeId[]
  for (const mode of modes) {
    const r = measureMode(mode, seeds, firstSeed)
    console.log(
      `${mode} spread ${r.spread} (min ${r.min}, max ${r.max}) seeds ${firstSeed}..${firstSeed + seeds - 1}`,
    )
    for (const c of r.crews) console.log(`  ${c.team.padEnd(14)} ${c.score}`)
  }
}
