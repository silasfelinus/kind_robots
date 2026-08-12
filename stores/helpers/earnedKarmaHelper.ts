// /stores/helpers/earnedKarmaHelper.ts
import { computed, ref, watch, type Ref } from 'vue'
import { KARMA_EARNED_BATCH_LIMIT, type KarmaRefType } from '@/utils/karmaRefTypes'

export type KarmaEarnedRow = {
  refType: string
  refId: string
  earnedKarma: number
}

export type EarnedKarmaLoader = (
  refType: KarmaRefType,
  ids: number[],
) => Promise<KarmaEarnedRow[] | null>

export function createEarnedKarmaTracker(
  refType: KarmaRefType,
  visibleIds: () => ReadonlyArray<number | string | null | undefined>,
  load: EarnedKarmaLoader,
): { earnedKarma: Ref<Record<number, number>>; refresh: () => Promise<void> } {
  const earnedKarma = ref<Record<number, number>>({})

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

    const rows = await load(refType, ids)
    if (!rows) return

    const next: Record<number, number> = {}
    for (const row of rows) {
      const id = Number(row.refId)
      if (Number.isFinite(id)) next[id] = row.earnedKarma
    }
    earnedKarma.value = next
  }

  watch(batchKey, () => void refresh(), { immediate: true })
  return { earnedKarma, refresh }
}
