import {
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_REALITY_PAIRS,
  MEMORY_COLLISION_ORDER,
  MEMORY_COLLISION_FRAGMENTS,
  MEMORY_LAST_CHOICE,
  recoverMemoryCollisionFragment,
  chooseMemoryLastChoice,
  MEMORY_PAIR_ENDINGS,
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
  chooseMemoryPairEnding,
  chooseMemoryScyllaDeparture,
  type MemoryPairEndingWorld,
  type MemoryScyllaDepartureChoice,
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

  // Reconstruct in canonical pair order, not in possibly older forked-save
  // order. This preserves earned paired content when a legacy save recorded
  // middle worlds in a different order, without granting any missing worlds.
  // A claim about history is not proof that its prerequisites were earned.
  const isCurrentSave = saved.campaignVersion === 2
  // Older saves used e09–e16 for different geographies. Current saves
  // reserve e09–e12 for the collision finale, but e13–e16 must still be
  // archived if an intermediate save left them in the completed list.
  const historicalFromCompleted = (
    Array.isArray(saved.completed) ? saved.completed : []
  ).filter(
    (id): id is ExperienceId =>
      typeof id === 'string' &&
      (isCurrentSave
        ? /^e(?:13|14|15|16)$/.test(id)
        : /^e(?:09|10|11|12|13|14|15|16)$/.test(id)),
  )
  const historicalFromArchive = (
    Array.isArray(saved.legacyCompleted) ? saved.legacyCompleted : []
  ).filter(
    (id): id is ExperienceId =>
      typeof id === 'string' && /^e(?:09|10|11|12|13|14|15|16)$/.test(id),
  )
  const legacyCompleted = [
    ...new Set([...historicalFromArchive, ...historicalFromCompleted]),
  ]
  const canonicalRequested: ExperienceId[] = [
    ...MEMORY_REALITY_PAIRS.flat(),
    ...(isCurrentSave ? MEMORY_COLLISION_ORDER : []),
  ].filter((id) => requested.includes(id))
  const earnedFragments = new Set(
    isCurrentSave && Array.isArray(saved.recoveredFragments)
      ? saved.recoveredFragments.filter(
          (id) =>
            typeof id === 'string' &&
            MEMORY_COLLISION_FRAGMENTS.some((part) => part.id === id),
        )
      : [],
  )
  const validEndingDecision = (id: MemoryPairEndingWorld): string | null => {
    const candidate = saved.pairDecisions?.[id]
    if (candidate === 'legacy-unresolved') return candidate
    if (
      typeof candidate === 'string' &&
      MEMORY_PAIR_ENDINGS[id].some((choice) => choice.id === candidate)
    )
      return candidate
    if (requested.includes(id) && id !== 'e02') return 'legacy-unresolved'
    return null
  }
  let progress: MemoryCampaignProgress = legacyCompleted.length
    ? { ...fresh, legacyCompleted: [...new Set(legacyCompleted)] }
    : fresh
  for (const id of canonicalRequested) {
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
    if (id === 'e05') {
      const oldChoice = saved.scyllaDeparture
      if (
        oldChoice &&
        MEMORY_SCYLLA_DEPARTURE_CHOICES.some(
          (choice) => choice.id === oldChoice,
        )
      ) {
        progress = chooseMemoryScyllaDeparture(
          progress,
          oldChoice as MemoryScyllaDepartureChoice,
        )
      } else if (requested.includes('e05')) {
        progress = { ...progress, scyllaDeparture: 'legacy-unspoken' }
      }
    }
    if (Object.prototype.hasOwnProperty.call(MEMORY_PAIR_ENDINGS, id)) {
      const world = id as MemoryPairEndingWorld
      const ending = validEndingDecision(world)
      if (ending && ending !== 'legacy-unresolved') {
        progress = chooseMemoryPairEnding(progress, world, ending)
      } else if (ending) {
        progress = {
          ...progress,
          pairDecisions: {
            ...progress.pairDecisions,
            [world]: ending,
          },
        }
      }
    }
    if (id === 'e09' && saved.finaleCommitted)
      progress = commitToMemoryFinale(progress)
    for (const fragment of MEMORY_COLLISION_FRAGMENTS) {
      if (fragment.world === id && earnedFragments.has(fragment.id))
        progress = recoverMemoryCollisionFragment(progress, fragment.id)
    }
    if (id === 'e12') {
      const last = saved.lastChoice
      if (last && MEMORY_LAST_CHOICE.some((option) => option.id === last))
        progress = chooseMemoryLastChoice(progress, last)
    }
    if (
      MEMORY_COLLISION_ORDER.some((world) => world === id) &&
      MEMORY_COLLISION_FRAGMENTS.some(
        (fragment) =>
          fragment.world === id &&
          !progress.recoveredFragments?.includes(fragment.id),
      )
    )
      break
    if (id === 'e12' && !progress.lastChoice) break
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

  // An in-progress choice belongs in a save even before completion. Keep it
  // only when the correct reality is the next available experience.
  const next = availableMemoryExperiences(progress)
  if (next.includes('e05') && saved.scyllaDeparture) {
    const choice = saved.scyllaDeparture
    if (MEMORY_SCYLLA_DEPARTURE_CHOICES.some((option) => option.id === choice))
      progress = chooseMemoryScyllaDeparture(
        progress,
        choice as MemoryScyllaDepartureChoice,
      )
  }
  const pendingWorld = next[0] as MemoryPairEndingWorld | undefined
  if (
    pendingWorld &&
    Object.prototype.hasOwnProperty.call(MEMORY_PAIR_ENDINGS, pendingWorld)
  ) {
    const candidate = saved.pairDecisions?.[pendingWorld]
    if (
      typeof candidate === 'string' &&
      MEMORY_PAIR_ENDINGS[pendingWorld].some(
        (choice) => choice.id === candidate,
      )
    )
      progress = chooseMemoryPairEnding(progress, pendingWorld, candidate)
  }

  // The four paired acts earn the four-map finale, without old e13 locks.
  if (
    saved.finaleCommitted &&
    !progress.finaleCommitted &&
    availableMemoryExperiences(progress).includes('e09')
  ) {
    progress = commitToMemoryFinale(progress)
  }
  const remaining = availableMemoryExperiences(progress)[0]
  if (remaining && MEMORY_COLLISION_ORDER.some((id) => id === remaining)) {
    for (const fragment of MEMORY_COLLISION_FRAGMENTS) {
      if (fragment.world === remaining && earnedFragments.has(fragment.id))
        progress = recoverMemoryCollisionFragment(progress, fragment.id)
    }
    if (remaining === 'e12') {
      const last = saved.lastChoice
      if (
        last &&
        MEMORY_LAST_CHOICE.some((option) => option.id === last) &&
        !progress.lastChoice
      )
        progress = chooseMemoryLastChoice(progress, last)
    }
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
