import {
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_WISH_ANCHORS,
  availableMemoryExperiences,
  commitToMemoryFinale,
  completeMemoryExperience,
  rememberMemoryWish,
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

export function restoreMemoryCampaignProgress(
  raw: unknown,
): MemoryCampaignProgress {
  const fresh = newMemoryCampaignProgress()
  if (!raw || typeof raw !== 'object') return fresh
  const saved = raw as Partial<MemoryCampaignProgress>
  const valid = new Set<ExperienceId>(
    MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id),
  )
  const requested = Array.isArray(saved.completed)
    ? saved.completed.filter((id): id is ExperienceId => valid.has(id))
    : []
  const anchorIds = Object.keys(MEMORY_WISH_ANCHORS) as MemoryWishAnchorId[]
  const requestedAnchors = new Set(
    Array.isArray(saved.rememberedAnchors)
      ? saved.rememberedAnchors.filter((id): id is MemoryWishAnchorId =>
          anchorIds.includes(id),
        )
      : [],
  )

  // A saved list is a claim about history, not proof of a legal campaign.
  // Rebuild its reachable sequence so forged future worlds and missing wish
  // prerequisites cannot unlock the finale on reload.
  let progress = fresh
  for (const id of requested) {
    if (
      progress.completed.includes(id) ||
      !availableMemoryExperiences(progress).includes(id)
    )
      continue

    for (const anchor of requestedAnchors) {
      if (MEMORY_WISH_ANCHORS[anchor].source === id) {
        progress = rememberMemoryWish(progress, anchor)
      }
    }
    if (id === 'e13' && saved.finaleCommitted) {
      progress = commitToMemoryFinale(progress)
    }
    progress = completeMemoryExperience(progress, id)
  }

  // A wish can be remembered while its source experience is still in
  // progress, before that experience is added to the completed list.
  for (const anchor of requestedAnchors) {
    const source = MEMORY_WISH_ANCHORS[anchor].source
    if (
      !progress.rememberedAnchors.includes(anchor) &&
      (progress.completed.includes(source) ||
        availableMemoryExperiences(progress).includes(source))
    ) {
      progress = rememberMemoryWish(progress, anchor)
    }
  }

  // The player may commit after ANY two middle pairs, not only e11/e12.
  // Preserve that commitment even if the final sequence has not started.
  if (
    saved.finaleCommitted &&
    !progress.finaleCommitted &&
    availableMemoryExperiences(progress).includes('e13')
  ) {
    progress = commitToMemoryFinale(progress)
  }
  return progress
}

export function restoreMemoryRealitySave(raw: unknown): MemoryRealitySave {
  const fallback: MemoryRealitySave = {
    version: 1,
    active: 'e01',
    progress: newMemoryCampaignProgress(),
  }
  if (!raw || typeof raw !== 'object') return fallback
  const saved = raw as Partial<MemoryRealitySave>
  const progress = restoreMemoryCampaignProgress(saved.progress)
  return {
    version: 1,
    active:
      saved.active === 'e02' && progress.completed.includes('e01')
        ? 'e02'
        : 'e01',
    progress,
  }
}
