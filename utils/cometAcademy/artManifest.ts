// Written by conductor scripts/export_round_art.py: every render shipped under
// public/comet-city-academy/<entry>.webp. Re-run the export; do not edit by hand.

export const PROM_ART: readonly string[] = [
  'affinities/air',
  'affinities/birthright',
  'affinities/discipline',
  'affinities/earth',
  'affinities/fire',
  'affinities/genius',
  'affinities/social',
  'affinities/water',
  'front/dashboard-highlight',
  'front/splash',
  'front/tutorial',
  'origins/accident',
  'origins/alien',
  'origins/magic',
  'origins/mutant',
  'origins/psychic',
  'origins/tech',
  'prom-of-doom/ct-d29-the-guest-list-open-doors-success',
  'prom-of-doom/ct-d29-the-guest-list-private-guard-success',
  'prom-of-doom/ct-d29-the-guest-list-steal-access-success',
  'prom-of-doom/ct-prom-d29-ballroom-doors',
  'prom-of-doom/ct-prom-d30-the-chandelier-turns',
  'prom-of-doom/ct-prom-finale-a-thousand-keys',
  'prom-of-doom/ct-prom-finale-empty-orchestra',
  'prom-of-doom/ct-prom-finale-iron-corsage',
  'prom-of-doom/ct-prom-finale-last-boat',
]

const SHIPPED = new Set(PROM_ART)

/** URL of a shipped Capes & Tassels render (asset relative to public/comet-city-academy), or null. */
export const promArt = (asset: string): string | null =>
  SHIPPED.has(asset) ? `/comet-city-academy/${asset}.webp` : null
