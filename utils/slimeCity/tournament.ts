import { TEAMS, type ModeId, type Side, type TeamId } from './prototypes'
import { type MatchMetrics } from './playtest'

export interface SideRecord {
  wins: number
  losses: number
  draws: number
  matches: number
}

export interface CrewRecord extends SideRecord {
  team: TeamId
  /** Wins plus half of draws, divided by matches. Not an Elo rating. */
  scoreRate: number
  asPlayer: SideRecord
  asEnemy: SideRecord
  averageRounds: number
  longestStall: number
  withoutContact: number
  winPaths: Record<string, number>
}

export interface TournamentReport {
  mode: ModeId
  seeds: number[]
  matches: number
  wins: { player: number; enemy: number; draws: number }
  firstContactAverage: number | null
  averageRounds: number
  averageDeadRounds: number
  averageTrapsSprung: number
  crews: CrewRecord[]
  warnings: string[]
}

const record = (): SideRecord => ({
  wins: 0,
  losses: 0,
  draws: 0,
  matches: 0,
})

function score(record: SideRecord): number {
  return record.matches
    ? (record.wins + record.draws * 0.5) / record.matches
    : 0
}

function add(record: SideRecord, victor: Side | 'draw', perspective: Side) {
  record.matches++
  if (victor === 'draw') record.draws++
  else if (victor === perspective) record.wins++
  else record.losses++
}

/**
 * Inspect complete, ordered cross-faction evidence. Never silently report a
 * partial or duplicate matrix as though it represented all six crews.
 */
export function summarizeTournament(
  mode: ModeId,
  seeds: readonly number[],
  results: readonly MatchMetrics[],
): TournamentReport {
  const teamIds = TEAMS.map((team) => team.id)
  if (!seeds.length || new Set(seeds).size !== seeds.length)
    throw new Error('Tournament needs unique seeds')
  const expected = teamIds.length * (teamIds.length - 1) * seeds.length
  if (results.length !== expected)
    throw new Error('Incomplete tournament: expected ' + expected + ' matches, got ' + results.length)

  const seen = new Set<string>()
  const counts = { player: 0, enemy: 0, draws: 0 }
  let totalRounds = 0
  let deadRounds = 0
  let traps = 0
  let contactSum = 0
  let contactCount = 0
  const crews = new Map(
    teamIds.map((team) => [
      team,
      {
        team,
        ...record(),
        scoreRate: 0,
        asPlayer: record(),
        asEnemy: record(),
        averageRounds: 0,
        longestStall: 0,
        withoutContact: 0,
        winPaths: {} as Record<string, number>,
      },
    ]),
  )
  for (const match of results) {
    if (
      match.mode !== mode ||
      !teamIds.includes(match.playerTeam) ||
      !teamIds.includes(match.enemyTeam) ||
      match.playerTeam === match.enemyTeam ||
      !seeds.includes(match.seed) ||
      !Number.isFinite(match.rounds) ||
      match.rounds < 1 ||
      match.victor !== 'draw' && match.victor !== 'player' && match.victor !== 'enemy'
    ) throw new Error('Invalid tournament matchup')
    const key = [match.seed, match.playerTeam, match.enemyTeam].join(':')
    if (seen.has(key)) throw new Error('Duplicate tournament matchup: ' + key)
    seen.add(key)

    if (match.victor === 'draw') counts.draws++
    else counts[match.victor]++
    totalRounds += match.rounds
    deadRounds += match.deadRounds
    traps += match.trapsSprung
    if (match.firstContact !== null) {
      contactSum += match.firstContact
      contactCount++
    }
    for (const [team, side] of [
      [match.playerTeam, 'player'],
      [match.enemyTeam, 'enemy'],
    ] as const) {
      const crew = crews.get(team)!
      add(crew, match.victor, side)
      add(side === 'player' ? crew.asPlayer : crew.asEnemy, match.victor, side)
      crew.averageRounds += match.rounds
      crew.longestStall = Math.max(crew.longestStall, match.longestDeadStreak)
      if (match.firstContact === null) crew.withoutContact++
      if (match.victor === side && match.winPath)
        crew.winPaths[match.winPath] = (crew.winPaths[match.winPath] ?? 0) + 1
    }
  }
  const reportCrews = [...crews.values()].map((crew) => ({
    ...crew,
    scoreRate: score(crew),
    averageRounds: crew.averageRounds / crew.matches,
  }))
  const warnings: string[] = []
  if (seeds.length < 10)
    warnings.push('Exploratory sample: fewer than ten seeds per ordered pairing; do not infer faction balance.')
  if (counts.draws / results.length > 0.4)
    warnings.push('Over 40% draws: examine stalls and objective reachability.')
  if (seeds.length >= 10 && Math.abs(counts.player - counts.enemy) / results.length > 0.25)
    warnings.push('Large first-side victory gap: inspect initiative and mirrored matchups.')
  return {
    mode,
    seeds: [...seeds],
    matches: results.length,
    wins: counts,
    firstContactAverage: contactCount ? contactSum / contactCount : null,
    averageRounds: totalRounds / results.length,
    averageDeadRounds: deadRounds / results.length,
    averageTrapsSprung: traps / results.length,
    crews: reportCrews,
    warnings,
  }
}
