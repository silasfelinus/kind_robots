// /composables/useEarnedKarma.ts
//
// interface-vision/t-066: one batch-fetch of earned karma for a gallery's
// visible cards, shared by every reactable-card consumer.
//
// reward-gallery wrote this first (t-019) and its comment invited the other
// eleven consumers to "copy this pattern." Two did — art-gallery (t-046) and
// dream-gallery (t-048) — and by the third copy the pattern had already
// drifted: two clamped to a 200-item batch and one did not, so a gallery
// rendering more than 200 cards would have taken a 400 from the endpoint
// instead of showing karma. Copying is how that happens; this is the pattern
// as a function instead.
//
// SCOPING IS THE CALLER'S JOB. `visibleIds` should return the RENDERED set,
// not the whole store — a page of art, not every image the user owns. It is a
// getter rather than a ref so callers can pass a computed slice directly, and
// the watch keys on the resulting id list, not on array identity, so
// re-filtering that produces the same cards does not re-fetch.
import { computed, ref, watch, type Ref } from 'vue'
import { performFetch } from '@/stores/utils'
import {
  KARMA_EARNED_BATCH_LIMIT,
  type KarmaRefType,
} from '@/utils/karmaRefTypes'

type KarmaEarnedRow = {
  refType: string
  refId: string
  earnedKarma: number
}

export type UseEarnedKarma = {
  /** Earned totals by object id. Ids absent from the map render nothing. */
  earnedKarma: Ref<Record<number, number>>
  /** Re-fetch now, e.g. after the user reacts to a card on this page. */
  refresh: () => Promise<void>
}

export function useEarnedKarma(
  refType: KarmaRefType,
  visibleIds: () => ReadonlyArray<number | string | null | undefined>,
): UseEarnedKarma {
  const earnedKarma = ref<Record<number, number>>({})

  // Deduplicate BEFORE clamping: a list holding the same id twice should not
  // consume two of the 200 slots, and the endpoint drops duplicates anyway.
  function batchIds(): number[] {
    const ids = new Set<number>()

    for (const raw of visibleIds()) {
      const id = Number(raw)
      if (!Number.isFinite(id)) continue
      ids.add(id)
      if (ids.size >= KARMA_EARNED_BATCH_LIMIT) break
    }

    return Array.from(ids)
  }

  const batchKey = computed(() => batchIds().join(','))

  async function refresh(): Promise<void> {
    const ids = batchIds()

    if (!ids.length) {
      earnedKarma.value = {}
      return
    }

    const res = await performFetch<KarmaEarnedRow[]>(
      '/api/economy/karma-earned',
      {
        method: 'POST',
        body: JSON.stringify({
          items: ids.map((id) => ({ refType, refId: id })),
        }),
      },
    )

    // A failed request (offline, or 401 for a signed-out visitor) leaves the
    // previous totals in place rather than blanking every card — karma is
    // decoration here, and flickering it off on a transient error is worse
    // than showing a slightly stale number.
    if (!res.success || !Array.isArray(res.data)) return

    const next: Record<number, number> = {}

    for (const row of res.data) {
      const id = Number(row.refId)
      if (Number.isFinite(id)) next[id] = row.earnedKarma
    }

    earnedKarma.value = next
  }

  watch(
    batchKey,
    () => {
      void refresh()
    },
    { immediate: true },
  )

  return { earnedKarma, refresh }
}
