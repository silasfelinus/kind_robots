// Written by conductor scripts/export_round_art.py: every render shipped under
// public/game-of-captains/<entry>.webp. Re-run the export; do not edit by hand.

export const WARP_ART: readonly string[] = [
  'front/splash',
  'portraits/captain-fluke',
  'portraits/captain-quill',
  'portraits/captain-rex',
  'portraits/captain-ro',
  'portraits/captain-solace',
  'portraits/captain-vale',
  'portraits/crew-brin',
  'portraits/crew-fen',
  'portraits/crew-jex',
  'portraits/crew-kivo',
  'portraits/crew-mox',
  'portraits/crew-omi',
  'portraits/crew-pell',
  'portraits/crew-rue',
  'portraits/crew-sora',
  'portraits/crew-taal',
  'portraits/crew-tess',
  'portraits/crew-vela',
]

const SHIPPED = new Set(WARP_ART)

/** URL of a shipped This Means Warp render (asset relative to public/game-of-captains), or null. */
export const warpArt = (asset: string): string | null =>
  SHIPPED.has(asset) ? `/game-of-captains/${asset}.webp` : null
