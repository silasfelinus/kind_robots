// /utils/collectibles/registry.ts
//
// Every collectible set the site knows. Add a project's set here; the shared
// routes (/api/collectibles/[set]/*) and the scrapbook UI pick it up.

import type { CollectibleSet } from './types'
import { TAROT_COLLECTIBLE_SET } from './sets/tarot'

export const COLLECTIBLE_SETS: Record<string, CollectibleSet> = {
  [TAROT_COLLECTIBLE_SET.slug]: TAROT_COLLECTIBLE_SET,
}

export function collectibleSetBySlug(slug: string): CollectibleSet | null {
  return COLLECTIBLE_SETS[slug] ?? null
}
