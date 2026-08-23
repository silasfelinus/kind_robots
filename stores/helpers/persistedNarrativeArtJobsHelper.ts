// /stores/helpers/persistedNarrativeArtJobsHelper.ts
//
// Shared resume-on-reload wiring for narrativeArtJobsHelper's async art jobs
// (davinci/t-025, kaizen from t-021 slice 14 / kind_robots#2046).
// storybookStore.ts, taskmasterStore.ts, and davinci-page.vue each
// independently persist a long-lived art job's in-flight state to
// localStorage so a page reload/remount can find it again, then call
// narrativeArtJobsHelper's resume() unconditionally on whatever the cache
// holds (resume() already no-ops safely for a terminal 'done'/'failed'/
// 'cancelled' state). storybookStore.ts and taskmasterStore.ts are, in
// fact, byte-for-byte the same shape -- the exact "third narrative surface"
// t-025's kaizen note anticipated turned out to already exist at the time
// this task was picked up (verifyNarrativeArtPersistence.mjs enforces both
// stores stay in lockstep).
//
// This wraps createNarrativeArtJobsController() so all three call sites
// share one controller-creation entrypoint, and adds the two genuinely
// reusable pieces of that pattern:
//   - a best-effort, owner-scoped localStorage cache (read/write), for a
//     surface that needs its own dedicated art-jobs cache key (davinci-page.vue
//     does -- a queued/rendering LifeRunArt job has no server-side row until
//     it reaches 'done', so hydrateArtFromRun() alone can never see it);
//   - resumeEntries(), which loops a collection of cached job states and
//     calls resume() for each one, so a future fourth narrative surface with
//     its own keyed collection doesn't need to hand-roll that loop either.
//
// storybookStore.ts's and taskmasterStore.ts's beats already ride inside
// each store's own persisted session JSON (persist()/restoreFromLocalStorage())
// -- neither has a separate art-jobs cache to own, so they only use the
// controller + resumeEntries() below, not readCache()/writeCache().
// davinci-page.vue uses all of it. See
// utils/scripts/verifyDaVinciArtResumeGuard.ts for the regression guard that
// covers davinci-page.vue's specific usage, and
// utils/scripts/verifyNarrativeArtPersistence.mjs for the one covering
// storybookStore.ts/taskmasterStore.ts.
import { createNarrativeArtJobsController } from '@/stores/helpers/narrativeArtJobsHelper'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'

function readLocalStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private browsing and storage quotas should not break the caller.
  }
}

export function createPersistedNarrativeArtJobsController() {
  const controller = createNarrativeArtJobsController()

  /** Best-effort cache read, scoped to `ownerId` (e.g. a run/session id).
   * Returns null on any parse failure or an ownerId mismatch (a cache left
   * over from a different run/session than the one being resumed). */
  function readCache<T>(storageKey: string, ownerId: number): T | null {
    const raw = readLocalStorage(storageKey)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as { ownerId?: number; payload?: T }
      if (parsed.ownerId !== ownerId) return null
      return parsed.payload ?? null
    } catch {
      return null
    }
  }

  /** Best-effort cache write, scoped to `ownerId`. Safe to call on every
   * job-state transition -- a failed write only means a slower reconnect on
   * the next reload, never a broken caller. */
  function writeCache<T>(
    storageKey: string,
    ownerId: number,
    payload: T,
  ): void {
    writeLocalStorage(storageKey, JSON.stringify({ ownerId, payload }))
  }

  /** Calls resume() for every non-null entry in `entries`. Safe to call
   * unconditionally over a whole cached collection -- resume() itself no-ops
   * for a terminal state. */
  function resumeEntries<K>(
    entries: Iterable<readonly [K, NarrativeArtJobState | null | undefined]>,
    onUpdate: (key: K, next: NarrativeArtJobState) => void,
  ): void {
    for (const [key, state] of entries) {
      if (!state) continue
      controller.resume(state, (next: NarrativeArtJobState) =>
        onUpdate(key, next),
      )
    }
  }

  return {
    enqueue: controller.enqueue,
    resume: controller.resume,
    retry: controller.retry,
    resumeEntries,
    readCache,
    writeCache,
  }
}
