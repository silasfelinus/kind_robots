import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultButterflyGalleryFeedProvider } from '@/stores/helpers/butterflyGalleryFeedProvider'
import { createDefaultButterflyBins } from '@/stores/helpers/butterflyGalleryFixtures'
import {
  defaultButterflyGalleryFilters,
  type ButterflyBinConfig,
  type ButterflyDropOutcome,
  type ButterflyFeedCursor,
  type ButterflyGalleryFilters,
  type ButterflyGalleryStatus,
  type ButterflyPileEntry,
} from '@/types/butterflyGallery'

// Session-scoped: the intro is a one-time-per-session vignette, not a
// permanent per-account preference, so this deliberately lives in
// sessionStorage rather than the localStorage:v1-envelope pattern other
// stores use for durable progress.
const INTRO_PLAYED_KEY = 'kind-robots:butterfly-gallery:intro-played'

// How many pile entries render as physical thumbnails (t-005). The pile
// metaphor stays "a small stack of paintings", never a rendered wall of
// every queued image -- remainingCount still reflects the full filtered
// queue so the count stays honest as the stack itself stays shallow.
export const BUTTERFLY_PILE_VISIBLE_DEPTH = 5

function readIntroPlayed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(INTRO_PLAYED_KEY) === '1'
  } catch {
    return false
  }
}

function writeIntroPlayed(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(INTRO_PLAYED_KEY, '1')
  } catch {
    // sessionStorage unavailable (private mode, disabled storage) -- the
    // intro simply replays next load, which is a harmless downgrade.
  }
}

export const useButterflyGalleryStore = defineStore(
  'butterflyGalleryStore',
  () => {
    const status = ref<ButterflyGalleryStatus>('loading')
    const errorMessage = ref('')

    const pile = ref<ButterflyPileEntry[]>([])
    const bins = ref<ButterflyBinConfig[]>(createDefaultButterflyBins())
    const filters = ref<ButterflyGalleryFilters>(
      defaultButterflyGalleryFilters(),
    )

    const selectedImageId = ref<number | null>(null)
    const draggingImageId = ref<number | null>(null)
    const batchSelectedIds = ref<number[]>([])
    const introPlayed = ref(false)
    const lastSaveMessage = ref('')
    const nextCursor = ref<ButterflyFeedCursor>(null)
    const isLoadingMore = ref(false)

    const visiblePile = computed<ButterflyPileEntry[]>(() =>
      pile.value.filter((entry) => {
        if (entry.trashed && filters.value.matchState !== 'missing')
          return false

        if (filters.value.processed === 'processed' && !entry.processed)
          return false
        if (filters.value.processed === 'unprocessed' && entry.processed)
          return false

        if (
          filters.value.rating !== null &&
          entry.rating !== filters.value.rating
        )
          return false

        if (
          filters.value.matchState !== 'all' &&
          entry.matchState !== filters.value.matchState
        ) {
          return false
        }

        if (filters.value.folder && entry.folder !== filters.value.folder)
          return false

        if (
          filters.value.collection &&
          !entry.collections.includes(filters.value.collection)
        ) {
          return false
        }

        if (filters.value.search) {
          const needle = filters.value.search.toLowerCase()
          if (!(entry.prompt ?? '').toLowerCase().includes(needle)) return false
        }

        return true
      }),
    )

    const remainingCount = computed(() => visiblePile.value.length)

    /** Only the physical top of the stack renders as thumbnails -- see
     * BUTTERFLY_PILE_VISIBLE_DEPTH. remainingCount (above) stays keyed to
     * the full visiblePile so the displayed count never undercounts the
     * queue just because the stack itself renders shallow. */
    const topOfPile = computed<ButterflyPileEntry[]>(() =>
      visiblePile.value.slice(0, BUTTERFLY_PILE_VISIBLE_DEPTH),
    )

    const selectedEntry = computed<ButterflyPileEntry | null>(
      () =>
        pile.value.find((entry) => entry.id === selectedImageId.value) ?? null,
    )

    const leftBins = computed(() =>
      bins.value
        .filter((bin) => bin.side === 'left' && bin.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    )

    const rightBins = computed(() =>
      bins.value
        .filter((bin) => bin.side === 'right' && bin.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    )

    const batchSelectedCount = computed(() => batchSelectedIds.value.length)

    const hasMore = computed(() => nextCursor.value !== null)

    const isBusy = computed(
      () =>
        status.value === 'saving' ||
        status.value === 'rescanning' ||
        status.value === 'loading',
    )

    function entryById(entryId: number): ButterflyPileEntry | null {
      return pile.value.find((entry) => entry.id === entryId) ?? null
    }

    function binById(binId: string): ButterflyBinConfig | null {
      return bins.value.find((bin) => bin.id === binId) ?? null
    }

    function selectNextFromPile(): void {
      const next = visiblePile.value.find(
        (entry) => entry.id !== selectedImageId.value,
      )
      selectedImageId.value = next ? next.id : null
    }

    function selectImage(entryId: number): void {
      if (!entryById(entryId)) return
      selectedImageId.value = entryId
    }

    function clearSelection(): void {
      selectedImageId.value = null
    }

    /** Promote a pile entry into the central frame by drag (as opposed to
     * dropOnBin's sort-and-advance) -- dropping a dragged pile thumbnail on
     * the central frame's own drop zone selects it there instead of sorting
     * it. Falls back to whatever is currently being dragged when no
     * explicit id is passed, matching dropOnBin's convention. */
    function promoteToFrame(entryId?: number): void {
      const targetId = entryId ?? draggingImageId.value
      const entry = targetId != null ? entryById(targetId) : null

      if (!entry) {
        cancelDrag()
        return
      }

      selectedImageId.value = entry.id
      if (status.value === 'dragging') cancelDrag()
    }

    /** Load the first page through whatever ButterflyGalleryFeedProvider is
     * installed (a fixture provider today; a real art-archive-backed one
     * later -- see stores/helpers/butterflyGalleryFeedProvider.ts). Callers
     * outside the store never need to change when that swap happens. */
    async function loadPile(): Promise<void> {
      status.value = 'loading'
      errorMessage.value = ''

      try {
        const page = await defaultButterflyGalleryFeedProvider().fetchPage({})
        pile.value = page.entries
        nextCursor.value = page.nextCursor
        introPlayed.value = readIntroPlayed()

        if (!selectedImageId.value) selectNextFromPile()

        status.value = introPlayed.value ? 'ready' : 'intro'
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Failed to load the gallery.'
        status.value = 'error'
      }
    }

    /** Append the next page onto the pile. A no-op once the provider reports
     * no further cursor. */
    async function loadMore(): Promise<void> {
      if (isLoadingMore.value || isBusy.value || !hasMore.value) return

      isLoadingMore.value = true
      try {
        const page = await defaultButterflyGalleryFeedProvider().fetchPage({
          cursor: nextCursor.value,
        })
        const existingIds = new Set(pile.value.map((entry) => entry.id))
        pile.value = [
          ...pile.value,
          ...page.entries.filter((entry) => !existingIds.has(entry.id)),
        ]
        nextCursor.value = page.nextCursor
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Could not load more of the pile.'
      } finally {
        isLoadingMore.value = false
      }
    }

    function completeIntro(): void {
      if (status.value !== 'intro') return
      introPlayed.value = true
      writeIntroPlayed()
      status.value = 'ready'
    }

    function replayIntro(): void {
      if (isBusy.value) return
      introPlayed.value = false
      status.value = 'intro'
    }

    function startDrag(entryId: number): void {
      if (status.value !== 'ready' || !entryById(entryId)) return
      draggingImageId.value = entryId
      status.value = 'dragging'
    }

    function cancelDrag(): void {
      if (status.value !== 'dragging') return
      draggingImageId.value = null
      status.value = 'ready'
    }

    /** Drop the currently dragged (or explicitly passed) entry onto a bin,
     * running the state machine through dropping -> saving -> ready/error.
     * Actual persistence is a fixture no-op today; t-007 wires real archive
     * actions in behind this same entry point. */
    async function dropOnBin(
      binId: string,
      entryId?: number,
    ): Promise<ButterflyDropOutcome | null> {
      const targetId = entryId ?? draggingImageId.value
      const bin = binById(binId)
      const entry = targetId ? entryById(targetId) : null

      if (
        !bin ||
        !entry ||
        (status.value !== 'dragging' && status.value !== 'ready')
      ) {
        cancelDrag()
        return null
      }

      status.value = 'dropping'
      draggingImageId.value = null

      status.value = 'saving'
      try {
        applyBinOutcome(entry, bin)
        lastSaveMessage.value = `Sorted into ${bin.label}.`

        if (selectedImageId.value === entry.id) selectNextFromPile()

        status.value = 'ready'
        return { entryId: entry.id, binId: bin.id, kind: bin.kind }
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Could not save that sort.'
        status.value = 'error'
        return null
      }
    }

    function applyBinOutcome(
      entry: ButterflyPileEntry,
      bin: ButterflyBinConfig,
    ): void {
      switch (bin.kind) {
        case 'processed':
          entry.processed = true
          break
        case 'unprocessed':
          entry.processed = false
          break
        case 'trash':
          entry.trashed = true
          break
        case 'needs-review':
          entry.matchState = 'unmatched'
          break
        case 'collection': {
          const collection =
            typeof bin.payload.collection === 'string'
              ? bin.payload.collection
              : null
          if (collection && !entry.collections.includes(collection)) {
            entry.collections = [...entry.collections, collection]
          }
          break
        }
        case 'rating': {
          const rating =
            typeof bin.payload.rating === 'number' ? bin.payload.rating : null
          if (rating !== null) entry.rating = rating
          break
        }
        default:
          break
      }
    }

    function setRating(entryId: number, rating: number | null): void {
      const entry = entryById(entryId)
      if (entry) entry.rating = rating
    }

    function setFilter<K extends keyof ButterflyGalleryFilters>(
      key: K,
      value: ButterflyGalleryFilters[K],
    ): void {
      filters.value = { ...filters.value, [key]: value }
    }

    function resetFilters(): void {
      filters.value = defaultButterflyGalleryFilters()
    }

    function toggleBatchSelected(entryId: number): void {
      const ids = new Set(batchSelectedIds.value)
      if (ids.has(entryId)) ids.delete(entryId)
      else ids.add(entryId)
      batchSelectedIds.value = [...ids]
    }

    function clearBatchSelection(): void {
      batchSelectedIds.value = []
    }

    function upsertBin(bin: ButterflyBinConfig): void {
      const index = bins.value.findIndex((existing) => existing.id === bin.id)
      if (index === -1) bins.value = [...bins.value, bin]
      else
        bins.value = bins.value.map((existing, i) =>
          i === index ? bin : existing,
        )
    }

    function removeBin(binId: string): void {
      bins.value = bins.value.filter((bin) => bin.id !== binId)
    }

    async function rescan(): Promise<void> {
      if (isBusy.value) return
      status.value = 'rescanning'
      errorMessage.value = ''

      try {
        const page = await defaultButterflyGalleryFeedProvider().fetchPage({})
        pile.value = page.entries
        nextCursor.value = page.nextCursor
        batchSelectedIds.value = []
        if (!entryById(selectedImageId.value ?? -1)) selectNextFromPile()
        status.value = 'ready'
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Rescan failed.'
        status.value = 'error'
      }
    }

    function clearError(): void {
      errorMessage.value = ''
      if (status.value === 'error')
        status.value = pile.value.length ? 'ready' : 'loading'
    }

    return {
      status,
      errorMessage,
      pile,
      bins,
      filters,
      selectedImageId,
      draggingImageId,
      batchSelectedIds,
      introPlayed,
      lastSaveMessage,
      nextCursor,
      isLoadingMore,
      visiblePile,
      remainingCount,
      topOfPile,
      selectedEntry,
      leftBins,
      rightBins,
      batchSelectedCount,
      isBusy,
      hasMore,
      entryById,
      binById,
      selectImage,
      clearSelection,
      promoteToFrame,
      loadPile,
      loadMore,
      completeIntro,
      replayIntro,
      startDrag,
      cancelDrag,
      dropOnBin,
      setRating,
      setFilter,
      resetFilters,
      toggleBatchSelected,
      clearBatchSelection,
      upsertBin,
      removeBin,
      rescan,
      clearError,
    }
  },
)
