import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'

export type ArchiveEntrySummary = {
  id: number
  relativePath: string
  parentFolder: string | null
  artImageId: number | null
  imagePath: string | null
  folderCollectionId: number | null
  processState: string
  matchState: string
  resourceMatchLocked: boolean
  rating: number | null
  isActive: boolean
}

export type ArchiveEntryDetail = {
  entry: Omit<ArchiveEntrySummary, 'imagePath'> & {
    extractedMetadata: unknown
    matchSummary: unknown
  }
  artImage: null | {
    id: number
    fileName: string | null
    path: string | null
    promptString: string | null
    negativePrompt: string | null
    checkpointResourceId: number | null
    seed: string | number | null
    cfg: number | null
    sampler: string | null
    steps: number | null
  }
  folderCollection: null | { id: number; label: string | null; parentFolder: string | null }
}

type ArchiveFilters = { search: string; folderCollectionId: string; processState: string; matchState: string; rating: string; includeInactive: boolean }
type ListPayload = { entries: ArchiveEntrySummary[]; page: number; pageSize: number; total: number }
type ActionPayload = { alreadyQuarantined?: boolean; alreadyActive?: boolean }

export const useArtArchiveStore = defineStore('artArchiveStore', () => {
  const entries = ref<ArchiveEntrySummary[]>([])
  const detail = ref<ArchiveEntryDetail | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const actionPending = ref(false)
  const error = ref('')
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(60)
  const filters = ref<ArchiveFilters>({ search: '', folderCollectionId: '', processState: '', matchState: '', rating: '', includeInactive: false })

  const folders = computed(() => {
    const byId = new Map<number, string>()
    for (const entry of entries.value) {
      if (entry.folderCollectionId && entry.parentFolder) byId.set(entry.folderCollectionId, entry.parentFolder)
    }
    return [...byId.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  async function fetchEntries(resetPage = false) {
    if (resetPage) page.value = 1
    loading.value = true
    error.value = ''
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    for (const [key, value] of Object.entries(filters.value)) if (value) params.set(key, String(value))
    const response = await performFetch<ListPayload>(`/api/admin/art-archive/entries?${params}`)
    if (response.success && response.data) {
      entries.value = response.data.entries
      total.value = response.data.total
      page.value = response.data.page
      pageSize.value = response.data.pageSize
    } else error.value = response.message || 'Could not load the archive.'
    loading.value = false
  }

  async function selectEntry(id: number) {
    detailLoading.value = true
    error.value = ''
    const response = await performFetch<ArchiveEntryDetail>(`/api/admin/art-archive/entries/${id}`)
    if (response.success && response.data) detail.value = response.data
    else error.value = response.message || 'Could not load archive entry details.'
    detailLoading.value = false
  }

  function clearSelection() { detail.value = null }

  /** Shared by quarantineEntry/restoreEntry (art-archive/t-012): posts the
   * action, then refreshes the list and selection from the server rather
   * than guessing the resulting isActive/path state locally -- both
   * endpoints are idempotent no-ops when already in the target state, so a
   * refetch is cheap and always correct. */
  async function runEntryAction(id: number, path: 'quarantine' | 'restore'): Promise<boolean> {
    actionPending.value = true
    error.value = ''
    const response = await performFetch<ActionPayload>(`/api/admin/art-archive/entries/${id}/${path}`, { method: 'POST' })
    if (response.success) {
      if (detail.value?.entry.id === id) clearSelection()
      await fetchEntries()
    } else {
      error.value = response.message || `Could not ${path} archive entry #${id}.`
    }
    actionPending.value = false
    return response.success
  }

  function quarantineEntry(id: number) { return runEntryAction(id, 'quarantine') }
  function restoreEntry(id: number) { return runEntryAction(id, 'restore') }

  /** Click and drag/drop rating action (art-archive/t-013). Unlike
   * quarantine/restore, rating doesn't change what the current filters would
   * exclude, so it patches the entry in place (list row + open detail)
   * instead of a full refetch -- keeps the grid scroll position and page
   * stable while rating several images in a row. */
  async function rateEntry(id: number, rating: number | null): Promise<boolean> {
    actionPending.value = true
    error.value = ''
    const response = await performFetch<{ id: number; rating: number | null }>(
      `/api/admin/art-archive/entries/${id}/rate`,
      { method: 'PATCH', body: JSON.stringify({ rating }) },
    )
    if (response.success && response.data) {
      const row = entries.value.find((entry) => entry.id === id)
      if (row) row.rating = response.data.rating
      if (detail.value?.entry.id === id) detail.value.entry.rating = response.data.rating
    } else {
      error.value = response.message || `Could not rate archive entry #${id}.`
    }
    actionPending.value = false
    return response.success
  }

  return { entries, detail, loading, detailLoading, actionPending, error, total, page, pageSize, pageCount, filters, folders, fetchEntries, selectEntry, clearSelection, quarantineEntry, restoreEntry, rateEntry }
})
