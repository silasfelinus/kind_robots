import type { CaptainId } from './rules'

/**
 * Tall full-length captain paintings for the art-first selection screen
 * (conductor game-of-captains t-045, ledger CAPTAIN-SELECTION-ROUND-1). One
 * curated render per captain ships under public/; `artImageId` names the
 * Kind Robots ArtImage each file was exported from, so a re-export can be
 * traced back to its ArtJob.
 */
export const CAPTAIN_SELECTION_ART: Record<
  CaptainId,
  { src: string; artImageId: number }
> = {
  fluke: {
    src: '/game-of-captains/portraits/v3/captain-fluke.webp',
    artImageId: 278424,
  },
  vale: {
    src: '/game-of-captains/portraits/v3/captain-vale.webp',
    artImageId: 278426,
  },
  solace: {
    src: '/game-of-captains/portraits/v3/captain-solace.webp',
    artImageId: 278429,
  },
  rex: {
    src: '/game-of-captains/portraits/v3/captain-rex.webp',
    artImageId: 278431,
  },
  quill: {
    src: '/game-of-captains/portraits/v3/captain-quill.webp',
    artImageId: 278433,
  },
  ro: {
    src: '/game-of-captains/portraits/v3/captain-ro.webp',
    artImageId: 278435,
  },
}

export function captainSelectionPainting(id: CaptainId): string {
  return CAPTAIN_SELECTION_ART[id].src
}
