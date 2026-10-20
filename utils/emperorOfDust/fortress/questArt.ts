// Quest images (conductor projects/emperor-of-dust/art/QUESTS-ROUND-1.yaml): a
// notice that presents each quest, and a success and a failure scene for the
// dawn report. Each listed asset is a file at
// public/emperor-of-dust/quests/<asset>.webp; until a quest's art is exported
// the game shows Silas's painted map, cropped around the quest's region.

import { REGIONS } from './factions'
import type { QuestResultTier } from './types'

export type QuestArtVariant = 'notice' | 'success' | 'failure'

export const QUEST_ART: readonly string[] = []

const AVAILABLE = new Set(QUEST_ART)
const MAP = '/emperor-of-dust/map/wasteland.webp'

const templateOf = (questId: string) => questId.split('@')[0] ?? questId

/** The rendered image for a quest, or undefined while it has none. */
export const questArtUrl = (
  questId: string,
  variant: QuestArtVariant = 'notice',
): string | undefined => {
  const base = templateOf(questId)
  const asset = variant === 'notice' ? base : `${base}-${variant}`
  if (AVAILABLE.has(asset)) return `/emperor-of-dust/quests/${asset}.webp`
  return AVAILABLE.has(base)
    ? `/emperor-of-dust/quests/${base}.webp`
    : undefined
}

/** Which outcome scene a dawn result shows. */
export const outcomeVariant = (
  tier: QuestResultTier | 'expired',
): QuestArtVariant =>
  tier === 'triumph' || tier === 'success'
    ? 'success'
    : tier === 'expired'
      ? 'notice'
      : 'failure'

/** The painted map, zoomed onto a region, as an inline style. */
export const regionCropStyle = (regionId: string): Record<string, string> => {
  const region = REGIONS.find((entry) => entry.id === regionId)
  return {
    backgroundImage: `url(${MAP})`,
    backgroundSize: '320%',
    backgroundPosition: `${region?.x ?? 50}% ${region?.y ?? 50}%`,
  }
}
