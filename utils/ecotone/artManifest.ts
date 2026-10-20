// Written by conductor scripts/export_ecotone_art.py from the art-standard
// ledger (projects/weird-humboldt/art/ART-STANDARD.yaml): the pictures each
// art style has rendered, by asset key, served from
// /ecotone/styles/<style>/<key>.webp. Do not edit by hand.

import type { EcotoneArtStyle } from './artStyles'

export const ECOTONE_STYLE_ART: Partial<
  Record<EcotoneArtStyle, readonly string[]>
> = {}
