import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultButterflyGalleryActionAdapter } from '@/stores/helpers/butterflyGalleryActionAdapter'
import {
  applyAddToCollectionAction,
  applyProcessedAction,
  applyRatingAction,
  applyRemoveFromCollectionAction,
  applyRestoreAction,
  applyTrashAction,
  applyBinOutcome,
  persistBinOutcome,
} from '@/stores/helpers/butterflyGalleryActions'
import { defaultButterflyGalleryFeedProvider } from '@/stores/helpers/butterflyGalleryFeedProvider'
import { createDefaultButterflyBins } from '@/stores/helpers/butterflyGalleryFixtures'
import {
  matchesButterflyGalleryFilters,
  summarizeButterflyGalleryCollections,
  summarizeButterflyGalleryFolders,
} from '@/stores/helpers/butterflyGalleryFilters'
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
      pile.value.filter((entry) =>
        matchesButterflyGalleryFilters(entry, filters.value),
      ),
    )

    const remainingCount = computed(() => visiblePile.value.length)

    /** Folder/collection browsing lists (butterfly-gallery/t-009): counted
     * across the whole pile, not the filtered view, so picking one filter
     * never makes another folder/collection vanish from the list. */
    const folderSummaries = computed(() =>
      summarizeButterflyGalleryFolders(pile.value),
    )
    const collectionSummaries = computed(() =>
      summarizeButterflyGalleryCollections(pile.value),
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
     * Persists through the injectable action adapter (a fixture no-op today;
     * t-022 wires a real art-archive-backed adapter behind the same seam)
     * before mutating local state. */
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
        await persistBinOutcome(
          defaultButterflyGalleryActionAdapter(),
          entry.id,
          bin,
        )
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

    /** First-class curation actions (butterfly-gallery/t-007): each persists
     * through the injectable action adapter before mutating local state, so
     * a real adapter's failure never leaves the pile showing an outcome that
     * was never actually saved. Usable independently of the sorting-bin
     * drop flow above (quick-action drawer, keyboard shortcuts, batch
     * actions) since they share the same pure appliers as dropOnBin. */
    async function setProcessed(
      entryId: number,
      processed: boolean,
    ): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry) return false
      try {
        await defaultButterflyGalleryActionAdapter().setProcessed(
          entryId,
          processed,
        )
        applyProcessedAction(entry, processed)
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Could not update processed state.'
        status.value = 'error'
        return false
      }
    }

    async function setRating(
      entryId: number,
      rating: number | null,
    ): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry) return false
      try {
        await defaultButterflyGalleryActionAdapter().setRating(entryId, rating)
        applyRatingAction(entry, rating)
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Could not update rating.'
        status.value = 'error'
        return false
      }
    }

    /** Reversible: sets the local trashed flag without ever dropping the
     * entry from the pile, so restoreEntry can always undo it. */
    async function trashEntry(entryId: number): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry) return false
      try {
        await defaultButterflyGalleryActionAdapter().trash(entryId)
        applyTrashAction(entry)
        if (selectedImageId.value === entry.id) selectNextFromPile()
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Could not trash that entry.'
        status.value = 'error'
        return false
      }
    }

    async function restoreEntry(entryId: number): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry) return false
      try {
        await defaultButterflyGalleryActionAdapter().restore(entryId)
        applyRestoreAction(entry)
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Could not restore that entry.'
        status.value = 'error'
        return false
      }
    }

    async function addToCollection(
      entryId: number,
      collection: string,
    ): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry || !collection) return false
      try {
        await defaultButterflyGalleryActionAdapter().addToCollection(
          entryId,
          collection,
        )
        applyAddToCollectionAction(entry, collection)
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Could not add to that collection.'
        status.value = 'error'
        return false
      }
    }

    async function removeFromCollection(
      entryId: number,
      collection: string,
    ): Promise<boolean> {
      const entry = entryById(entryId)
      if (!entry || !collection) return false
      try {
        await defaultButterflyGalleryActionAdapter().removeFromCollection(
          entryId,
          collection,
        )
        applyRemoveFromCollectionAction(entry, collection)
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Could not remove from that collection.'
        status.value = 'error'
        return false
      }
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

    /** Clicking an already-selected folder/collection chip clears that
     * filter instead of re-applying it, so the browsing list doubles as a
     * toggle rather than needing a separate "clear" control per chip. */
    function toggleFolderFilter(folder: string): void {
      setFilter('folder', filters.value.folder === folder ? null : folder)
    }

    function toggleCollectionFilter(collection: string): void {
      setFilter(
        'collection',
        filters.value.collection === collection ? null : collection,
      )
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
      folderSummaries,
      collectionSummaries,
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
      loadPile,
      loadMore,
      completeIntro,
      replayIntro,
      startDrag,
      cancelDrag,
      dropOnBin,
      setProcessed,
      setRating,
      trashEntry,
      restoreEntry,
      addToCollection,
      removeFromCollection,
      setFilter,
      resetFilters,
      toggleFolderFilter,
      toggleCollectionFilter,
      toggleBatchSelected,
      clearBatchSelection,
      upsertBin,
      removeBin,
      rescan,
      clearError,
    }
  },
)
