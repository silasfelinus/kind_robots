import { warpArt } from './artManifest'
import type { VoyageRun } from './rules'
import { antagonistFor, missionFor } from './rules'
import { GALACTIC_ENDINGS } from './galacticEndings'

// Every picture This Means Warp shows, by asset key under public/game-of-captains.
// The play page and the Playbook Studio adapter read the same keys, so a render
// exported for one of them (conductor scripts/export_round_art.py) appears in
// both. A slot without a render falls back to the drawn bridge or a monogram.

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const captainArtKey = (id: string) => `portraits/v2/captain-${id}`
export const crewArtKey = (portraitKey: string) => `portraits/v2/${portraitKey}`

/** Show a delivered redesigned face first; retain the old image during rendering. */
export const portraitArt = (
  portraitKey: string,
  lookup: (asset: string) => string | null = warpArt,
): string | null =>
  lookup(`portraits/v2/${portraitKey}`) ?? lookup(`portraits/${portraitKey}`)
export const missionArtKey = (id: string) => `missions/${id}`
export const antagonistArtKey = (id: string) => `antagonists/${id}`
export const endingArtKey = (ending: string) => `endings/${slugify(ending)}`
/**
 * The family title under a finished voyage's ending. The star-chart and
 * clone codas append their own titles (`CAPTAIN OF THE OPEN HORIZON · The
 * Royal Dust Bunny`), and the family's picture must still be found.
 */
export const endingFamilyTitle = (ending: string) => ending.split(' · ')[0]!
/** A nemesis's own ending, by id such as `auditor-undone` (nemesisEndings.ts). */
export const nemesisEndingArtKey = (id: string) => `endings/${id}`
export const SPLASH_ART_KEY = 'front/splash'

/** The four base logs any voyage can close on (rules.ts finishVoyage). */
export const BASE_ENDINGS = [
  'CAPTAIN OF THE OPEN HORIZON',
  'THE LAST SHIP HOME',
  'THE GALACTIC BARGAIN',
  'THE COST OF COMMAND',
] as const

/** Every galactic ending family: the base four, then the twelve earned ones. */
export const WARP_ENDINGS: readonly string[] = [
  ...BASE_ENDINGS,
  ...GALACTIC_ENDINGS.map((ending) => ending.title),
]

/** The stage picture for a voyage moment, or null to keep the drawn bridge. */
export function voyageStageArt(run: VoyageRun | null): string | null {
  if (!run) return warpArt(SPLASH_ART_KEY)
  if (run.phase === 'ending' && run.ending)
    return (
      (run.nemesisEnding && warpArt(nemesisEndingArtKey(run.nemesisEnding))) ||
      warpArt(endingArtKey(endingFamilyTitle(run.ending)))
    )
  if (run.phase === 'finale')
    return warpArt(antagonistArtKey(antagonistFor(run).id))
  return warpArt(missionArtKey(missionFor(run).id))
}
