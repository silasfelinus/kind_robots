import type { MemoryCollisionFragmentId } from './reimaginerCampaign'

export type FinaleWorld = 'e11' | 'e12'

/** The two displaced memories each late collision world must recover. */
export const FINALE_FRAGMENT_SITES: Readonly<
  Record<FinaleWorld, Readonly<Record<string, MemoryCollisionFragmentId>>>
> = {
  e11: { '2,3': 'sea-unwritten-map', '7,6': 'sea-sister-bell' },
  e12: { '2,2': 'village-wolf-door', '7,6': 'village-tidal-oven' },
}
