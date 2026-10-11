// /utils/arcade/ghostTrail/acts/build34.ts
//
// Small layout helpers for Stages 3 and 4 of Zuzu: Ghost Trail (conductor kr-arcade t-015..t-020,
// CAMPAIGN-BLUEPRINT.md). Acts are authored by hand; these only spare the arithmetic of turning a
// list of pits into ground runs, so a pit is written once as where it starts and how wide it is.

/** Ground runs for an act from its pits ([left edge, width]); the trail runs on past the exit. */
export function groundWithPits(
  length: number,
  pits: Array<[number, number]>,
): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let from = 0
  for (const [x, w] of [...pits].sort((a, b) => a[0] - b[0])) {
    runs.push([from, x])
    from = x + w
  }
  runs.push([from, length + 320])
  return runs
}
