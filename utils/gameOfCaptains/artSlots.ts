import { warpArt } from './artManifest'
import type { VoyageRun } from './rules'
import { antagonistFor, missionFor } from './rules'

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

export const captainArtKey = (id: string) => `portraits/captain-${id}`
export const crewArtKey = (portraitKey: string) => `portraits/${portraitKey}`
export const missionArtKey = (id: string) => `missions/${id}`
export const antagonistArtKey = (id: string) => `antagonists/${id}`
export const endingArtKey = (ending: string) => `endings/${slugify(ending)}`
/** A nemesis's own ending, by id such as `auditor-undone` (nemesisEndings.ts). */
export const nemesisEndingArtKey = (id: string) => `endings/${id}`
export const SPLASH_ART_KEY = 'front/splash'

export const WARP_ENDINGS = [
  'CAPTAIN OF THE OPEN HORIZON',
  'THE LAST SHIP HOME',
  'THE GALACTIC BARGAIN',
  'THE COST OF COMMAND',
] as const

/** The stage picture for a voyage moment, or null to keep the drawn bridge. */
export function voyageStageArt(run: VoyageRun | null): string | null {
  if (!run) return warpArt(SPLASH_ART_KEY)
  if (run.phase === 'ending' && run.ending)
    return (
      (run.nemesisEnding && warpArt(nemesisEndingArtKey(run.nemesisEnding))) ||
      warpArt(endingArtKey(run.ending))
    )
  if (run.phase === 'finale')
    return warpArt(antagonistArtKey(antagonistFor(run).id))
  return warpArt(missionArtKey(missionFor(run).id))
}
