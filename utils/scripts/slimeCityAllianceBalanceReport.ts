// Slime City ALLIANCE balance sweep: CPU vs CPU, every general pairing, both
// seats, seeded allies. Reports general win rates and how often (and when)
// each faction power fires.
// Usage: npx tsx utils/scripts/slimeCityAllianceBalanceReport.ts [seedsPerPairing]
import { TEAMS, type Side, type TeamId } from '../slimeCity/prototypes'
import { cpuAlliance } from '../slimeCity/alliance'
import {
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  createClash,
  type ClashState,
} from '../slimeCity/clash'

export interface AllianceSweep {
  games: number
  firstSeatWins: number
  draws: number
  roundLimit: number
  averageRounds: number
  generals: Record<string, { games: number; wins: number }>
  powers: Record<string, { used: number; round: number }>
}

export function playAllianceCpuGame(
  player: TeamId,
  enemy: TeamId,
  seed: number,
): ClashState {
  let s = createClash(player, enemy, seed, {
    alliance: {
      player: cpuAlliance(player, seed * 7 + 1),
      enemy: cpuAlliance(enemy, seed * 13 + 3),
    },
  })
  for (let step = 0; !s.victor && step < 800; step++)
    s = applyClashCommand(s, chooseClashCpu(s, s.active))
  return s
}

export function sweepAlliance(seeds: number, offset = 1): AllianceSweep {
  const out: AllianceSweep = {
    games: 0,
    firstSeatWins: 0,
    draws: 0,
    roundLimit: 0,
    averageRounds: 0,
    generals: {},
    powers: {},
  }
  let rounds = 0
  for (const a of TEAMS)
    for (const b of TEAMS) {
      if (a.id === b.id) continue
      for (let seed = offset; seed < offset + seeds; seed++) {
        const s = playAllianceCpuGame(a.id, b.id, seed)
        out.games++
        rounds += s.round
        if (s.victor === 'player') out.firstSeatWins++
        if (s.victor === 'draw') out.draws++
        if (s.round >= CLASH_ROUND_LIMIT) out.roundLimit++
        for (const side of ['player', 'enemy'] as Side[]) {
          const general = (out.generals[s.teams[side]] ??= {
            games: 0,
            wins: 0,
          })
          general.games++
          if (s.victor === side) general.wins++
          const power = (out.powers[s.teams[side]] ??= { used: 0, round: 0 })
          if (s.powersUsed?.[side]?.includes(s.teams[side])) {
            power.used++
            // Round of use: rounds completed (rival end commands) before it.
            const at = s.commands.findIndex(
              (c) => c.t === 'power' && c.side === side && !c.team,
            )
            power.round +=
              1 +
              s.commands
                .slice(0, at)
                .filter((c) => c.t === 'end' && c.side === 'enemy').length
          }
        }
      }
    }
  out.averageRounds = rounds / out.games
  return out
}

const pct = (n: number, d: number): string =>
  d ? ((100 * n) / d).toFixed(1) + '%' : '-'

if (process.argv[1]?.includes('slimeCityAllianceBalanceReport')) {
  const seeds = Number(process.argv[2] ?? 20)
  const r = sweepAlliance(seeds, Number(process.argv[3] ?? 1))
  console.log(
    `ALLIANCE sweep: ${r.games} games · first seat ${pct(r.firstSeatWins, r.games)} · draws ${pct(r.draws, r.games)} · round limit ${pct(r.roundLimit, r.games)} · avg ${r.averageRounds.toFixed(1)} rounds`,
  )
  for (const [id, g] of Object.entries(r.generals).sort(
    (a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games,
  )) {
    const p = r.powers[id]!
    console.log(
      `  ${id.padEnd(13)} wins ${pct(g.wins, g.games).padStart(6)} · power used ${pct(p.used, g.games).padStart(6)} · avg round ${p.used ? (p.round / p.used).toFixed(1) : '-'}`,
    )
  }
}
