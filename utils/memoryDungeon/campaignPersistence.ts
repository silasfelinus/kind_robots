import {
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_WISH_ANCHORS,
  newMemoryCampaignProgress,
  type MemoryCampaignProgress,
  type MemoryWishAnchorId,
  type ExperienceId,
} from './reimaginerCampaign'

/**
 * Campaign discoveries persist apart from World One's stable save key.
 * Current playable bridge is e01/e02; later writers can migrate this
 * version without treating a prototype Dark Briar encounter as full art.
 */
export interface MemoryRealitySave {
  version: 1
  active: 'e01' | 'e02'
  progress: MemoryCampaignProgress
}

export function restoreMemoryCampaignProgress(raw: unknown): MemoryCampaignProgress {
  const fresh = newMemoryCampaignProgress()
  if (!raw || typeof raw !== 'object') return fresh
  const saved = raw as Partial<MemoryCampaignProgress>
  const valid = new Set<ExperienceId>(MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id))
  const completed = Array.isArray(saved.completed)
    ? [...new Set(saved.completed.filter((id): id is ExperienceId => valid.has(id)))]
    : []
  const anchorIds = Object.keys(MEMORY_WISH_ANCHORS) as MemoryWishAnchorId[]
  const anchors = Array.isArray(saved.rememberedAnchors)
    ? [...new Set(saved.rememberedAnchors.filter(
        (id): id is MemoryWishAnchorId => anchorIds.includes(id),
      ))]
    : []
  return {
    completed,
    rememberedAnchors: anchors,
    finaleCommitted: Boolean(saved.finaleCommitted) && completed.includes('e12'),
  }
}

export function restoreMemoryRealitySave(raw: unknown): MemoryRealitySave {
  const fallback: MemoryRealitySave = {
    version: 1, active: 'e01', progress: newMemoryCampaignProgress(),
  }
  if (!raw || typeof raw !== 'object') return fallback
  const saved = raw as Partial<MemoryRealitySave>
  const progress = restoreMemoryCampaignProgress(saved.progress)
  return {
    version: 1,
    active: saved.active === 'e02' && progress.completed.includes('e01') ? 'e02' : 'e01',
    progress,
  }
}
