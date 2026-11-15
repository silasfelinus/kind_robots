// /utils/arcade/lanternSwarm/results.ts
//
// Lantern Swarm depth pass, slice 1 (conductor kr-arcade/t-093): the tallies behind the results card
// shown after each Watch (shots, hits, hit ratio, perfect Glows, escort bonuses) and the whole
// night's hit ratio on the game-over screen.

export type Tally = {
  shots: number
  hits: number
  /** Glow Stages flown, and how many were perfect. */
  glows: number
  perfectGlows: number
  escortBonuses: number
  /** The Guardians calmed. */
  guardians: number
}

export const newTally = (): Tally => ({
  shots: 0,
  hits: 0,
  glows: 0,
  perfectGlows: 0,
  escortBonuses: 0,
  guardians: 0,
})

/** Hits per shot as a percentage to one decimal (0 before the first shot). */
export function hitRatio(t: Pick<Tally, 'shots' | 'hits'>): number {
  if (t.shots <= 0) return 0
  return Math.round((Math.min(t.hits, t.shots) / t.shots) * 1000) / 10
}

export const ratioText = (t: Pick<Tally, 'shots' | 'hits'>): string =>
  `${hitRatio(t).toFixed(1)}%`

/** The results card's rows, label then value. */
export function resultRows(t: Tally): Array<[string, string]> {
  return [
    ['SHOTS FIRED', String(t.shots)],
    ['NUMBER OF HITS', String(t.hits)],
    ['HIT RATIO', ratioText(t)],
    ['PERFECT GLOWS', `${t.perfectGlows} / ${t.glows}`],
    ['ESCORT BONUSES', String(t.escortBonuses)],
    ['GUARDIANS CALMED', String(t.guardians)],
  ]
}

/** The escort bonus climbs with each one earned in the same Watch. */
export const ESCORT_BONUS = [800, 1600, 3200] as const
export const escortBonus = (earned: number): number =>
  ESCORT_BONUS[Math.min(Math.max(0, earned), ESCORT_BONUS.length - 1)]!
