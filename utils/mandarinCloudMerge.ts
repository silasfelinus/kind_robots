// /utils/mandarinCloudMerge.ts
//
// mandarin-tutor/t-017. Pure extraction of `mandarinTutorStore.loadCloudState`'s
// merge semantics, so the rule "server is authoritative, but a local-only
// customSet/artJob the server doesn't know about yet is kept and re-pushed
// rather than dropped" is checkable without Pinia, Nuxt, or a real backend --
// same discipline as `server/utils/mandarinSrs.ts` / `verifyMandarinSrs.test.ts`.
//
// The store itself (`stores/mandarinTutorStore.ts`) calls these two functions
// and re-pushes whatever comes back in `unsynced`; it does not duplicate the
// merge logic inline any more.

import type { MandarinCustomSet } from './mandarin'

export type MandarinCustomSetMergeResult = {
  /** Server sets first, followed by any local-only sets the server hasn't seen. */
  merged: MandarinCustomSet[]
  /** Local-only sets that need to be persisted to the server. */
  unsynced: MandarinCustomSet[]
}

/**
 * Merge a learner's server-side customSets with whatever is already in local
 * state. A set present on the server always wins for that id -- the server
 * copy is authoritative and a local edit made on another device is exactly
 * what `persistCustomSet` is for, not this merge. A set the server has never
 * seen (created offline, or on a device that hasn't synced yet) is kept
 * rather than silently dropped, and reported back in `unsynced` so the caller
 * can re-push it.
 */
export function mergeCustomSets(
  serverSets: MandarinCustomSet[],
  localSets: MandarinCustomSet[],
): MandarinCustomSetMergeResult {
  const serverIds = new Set(serverSets.map((set) => set.id))
  const unsynced = localSets.filter((set) => !serverIds.has(set.id))
  return { merged: [...serverSets, ...unsynced], unsynced }
}

export type MandarinArtJobMergeResult = {
  /** Server links first, with any local-only cardKey -> jobId entries layered on top. */
  merged: Record<string, number>
  /** Local-only [cardKey, jobId] pairs the server doesn't have yet. */
  unsynced: Array<[string, number]>
}

/**
 * Merge a learner's server-side art-job links (cardKey -> ArtJob id) with
 * local state. A cardKey the server already links wins its server value
 * (same authoritative-server rule as customSets). A cardKey only known
 * locally is kept and reported in `unsynced` for re-push.
 */
export function mergeArtJobs(
  serverArtJobs: Record<string, number>,
  localArtJobs: Record<string, number>,
): MandarinArtJobMergeResult {
  const unsynced = Object.entries(localArtJobs).filter(
    ([cardKey]) => !(cardKey in serverArtJobs),
  )
  return {
    merged: { ...serverArtJobs, ...Object.fromEntries(unsynced) },
    unsynced,
  }
}
