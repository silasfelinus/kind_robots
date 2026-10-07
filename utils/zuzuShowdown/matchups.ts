// /utils/zuzuShowdown/matchups.ts
//
// Zuzu Showdown matchup lines (conductor zuzu-showdown t-018, shown by the t-019 screens). The lines
// live in conductor's projects/zuzu-showdown/matchups.yaml; tools/matchups_to_ts.py ports them here
// as matchups.json (edit the YAML and re-run it, never the JSON). Every unordered pair and every
// mirror has an intro exchange spoken before the fight, and a win quote for each winner, spoken to
// the loser.

import data from './matchups.json'

export type MatchupLine = { speaker: string; line: string }

export type Matchup = {
  pair: string[]
  intro: MatchupLine[]
  win: Partial<Record<string, string>>
}

export const MATCHUPS: Matchup[] = data.matchups as Matchup[]

/** Before the final fight in Arcade mode; the Thing never speaks. */
export const BOSS_INTROS: Partial<Record<string, string>> = data.boss

function find(a: string, b: string): Matchup | null {
  return (
    MATCHUPS.find(
      (m) =>
        (m.pair[0] === a && m.pair[1] === b) ||
        (m.pair[0] === b && m.pair[1] === a),
    ) ?? null
  )
}

/**
 * The intro exchange for a fight between `p1` and `p2`, each line tagged with the side that speaks it
 * (in a mirror match the speakers alternate, starting with P1). Empty for a fighter without lines.
 */
export function introFor(
  p1: string,
  p2: string,
): Array<MatchupLine & { side: 0 | 1 }> {
  const m = find(p1, p2)
  if (!m) return []
  if (p1 === p2)
    return m.intro.map((l, i) => ({ ...l, side: (i % 2) as 0 | 1 }))
  return m.intro.map((l) => ({ ...l, side: l.speaker === p1 ? 0 : 1 }))
}

/** What the winner says to the loser after the fight, or silence for a fighter without lines. */
export function winQuote(winner: string, loser: string): string {
  return find(winner, loser)?.win[winner] ?? '...'
}
