// /utils/artSlideshowRotation.ts
//
// The pure half of the ArtJob slideshow: which finished render comes next.
//
// Two things drive the rotation and they pull in opposite directions. New art
// should appear as soon as it finishes -- that is the whole point of leaving
// the slideshow running next to the queue -- while everything else is a random
// draw from the last N finished jobs, so a long watch doesn't just replay the
// same handful. Keeping the arithmetic here (rather than inside the store's
// reactive state) means the awkward cases are testable without a Pinia
// instance: see utils/scripts/verifyArtSlideshowRotation.test.ts.
//
// WHY ARRIVALS ARE TRACKED BY SET MEMBERSHIP, NOT BY MAX ID
// A "newest id wins" watermark looks equivalent and isn't. Jobs finish out of
// order -- a slow job queued this morning can reach DONE after one queued five
// minutes ago -- so the older id would land below the watermark and never be
// announced. Membership in the seen set is the only test that survives that.

export type SlideshowJobLike = { id: number }

/** Ceiling on the no-repeat window, so a small pool still rotates at all. */
export function historyLimit(poolSize: number): number {
  if (poolSize <= 1) return 0
  return Math.min(poolSize - 1, 25)
}

/**
 * Fold freshly fetched rows into the pool: same-id rows are replaced (a retry
 * can rewrite a job's payload under a stable id), the result is ordered newest
 * id first, and anything past `depth` falls off the end.
 */
export function mergeSlideshowPool<T extends SlideshowJobLike>(
  pool: readonly T[],
  incoming: readonly T[],
  depth: number,
): T[] {
  const byId = new Map<number, T>()
  for (const job of pool) byId.set(job.id, job)
  for (const job of incoming) byId.set(job.id, job)

  const merged = [...byId.values()].sort((a, b) => b.id - a.id)
  const limit = Math.max(1, Math.floor(depth))
  return merged.slice(0, limit)
}

/**
 * Ids in `incoming` the slideshow has never held, oldest first so they play in
 * the order they finished rather than newest-first as the API returns them.
 */
export function unseenJobIds(
  seenIds: Iterable<number>,
  incoming: readonly SlideshowJobLike[],
): number[] {
  const seen = new Set(seenIds)
  const fresh: number[] = []
  for (const job of incoming) {
    if (seen.has(job.id)) continue
    seen.add(job.id)
    fresh.push(job.id)
  }
  return fresh.reverse()
}

/**
 * A random id from the pool that hasn't been shown recently.
 *
 * `recentIds` is the no-repeat window, most recent last. Once the window covers
 * everything available the draw falls back to the whole pool minus whatever is
 * on screen right now, which is what keeps a two-image pool alternating instead
 * of stalling on one frame.
 */
export function pickRandomJobId(
  poolIds: readonly number[],
  recentIds: readonly number[],
  random: () => number = Math.random,
): number | null {
  if (!poolIds.length) return null
  if (poolIds.length === 1) return poolIds[0] ?? null

  const window = recentIds.slice(-historyLimit(poolIds.length))
  const blocked = new Set(window)
  let candidates = poolIds.filter((id) => !blocked.has(id))

  if (!candidates.length) {
    const current = recentIds[recentIds.length - 1]
    candidates = poolIds.filter((id) => id !== current)
  }
  if (!candidates.length) candidates = [...poolIds]

  const roll = random()
  const safeRoll = Number.isFinite(roll)
    ? Math.min(Math.max(roll, 0), 0.999999)
    : 0
  const index = Math.floor(safeRoll * candidates.length)
  return candidates[index] ?? candidates[0] ?? null
}

/** Append a shown id to the history tail, capped so it can't grow unbounded. */
export function rememberShownId(
  history: readonly number[],
  id: number,
  cap = 50,
): number[] {
  const next = [...history, id]
  const limit = Math.max(1, Math.floor(cap))
  return next.length > limit ? next.slice(next.length - limit) : next
}
