// /utils/arcade/cableCrawler/medals.ts
//
// Cable Crawler's maze medals (conductor kr-arcade/t-067, spec: CABINETS.md section 8, "Power
// and meta"). Every maze can pay three: No Bites (cleared without an unplug), Big Surge (twenty
// or more sparks and glitches taken by one surge) and Battery Saver (cleared with at least half
// the battery left). They are kept for good with the golden bytes.

export const MEDALS = ['bites', 'surge', 'battery'] as const
export type Medal = (typeof MEDALS)[number]

export const MEDAL_NAMES: Record<Medal, string> = {
  bites: 'NO BITES',
  surge: 'BIG SURGE',
  battery: 'BATTERY SAVER',
}

/** How many things one surge takes for the Big Surge medal. */
export const BIG_SURGE = 20
/** The share of the battery that must be left for the Battery Saver medal. */
export const SAVER_SHARE = 0.5

/** What a cleared maze earned. */
export function earnedMedals(run: {
  bitten: boolean
  biggestSurge: number
  battery: number
  batteryMax: number
}): Medal[] {
  const out: Medal[] = []
  if (!run.bitten) out.push('bites')
  if (run.biggestSurge >= BIG_SURGE) out.push('surge')
  if (run.battery >= run.batteryMax * SAVER_SHARE) out.push('battery')
  return out
}
