import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import type {
  ArtImage,
  Dream,
  PitchSheet,
} from '~/prisma/generated/prisma/client'

export type SheetDream = Dream & {
  ArtImage?: Partial<ArtImage> | null
}

export type SheetWithDream = PitchSheet & {
  Dream?: SheetDream | null
  ArtImage?: Partial<ArtImage> | null
}

export type SheetCreatePayload = Partial<PitchSheet> & {
  dreamId: number
}

export type WorkspaceSheetOverride = {
  source?: string
  label?: string
  title?: string
  narrative?: string
  imagePath?: string
  artImageId?: number | null
  icon?: string
}

export type WorkspaceSheetOptions = {
  open?: boolean
}

export type WorkspaceTabSheetInput = {
  key?: string
  label?: string
  title?: string
  summary?: string
  description?: string
  narrative?: string
  tagline?: string
  icon?: string
  image?: string
  imagePath?: string
  heroImage?: string
  splashImage?: string
  deckImage?: string
}

export type SheetUpdatePayload = Partial<
  Omit<PitchSheet, 'id' | 'createdAt' | 'updatedAt'>
>

export const useSheetStore = defineStore('sheetStore', () => {
  const sheets = ref<SheetWithDream[]>([])
  const selectedSheet = ref<SheetWithDream | null>(null)
  const loading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const override = ref<WorkspaceSheetOverride | null>(null)

  const sheetsById = computed(() => {
    const map = new Map<number, SheetWithDream>()
    for (const sheet of sheets.value) map.set(sheet.id, sheet)
    return map
  })

  const sheetsByDreamId = computed(() => {
    const map = new Map<number, SheetWithDream>()
    for (const sheet of sheets.value) {
      if (sheet.dreamId !== null) map.set(sheet.dreamId, sheet)
    }
    return map
  })

  function upsertLocal(sheet: SheetWithDream) {
    const index = sheets.value.findIndex((item) => item.id === sheet.id)
    if (index === -1) sheets.value.push(sheet)
    else sheets.value[index] = sheet

    if (selectedSheet.value?.id === sheet.id) selectedSheet.value = sheet
    return sheet
  }

  function removeLocal(id: number) {
    sheets.value = sheets.value.filter((sheet) => sheet.id !== id)
    if (selectedSheet.value?.id === id) selectedSheet.value = null
  }

  async function fetchSheets() {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream[]>('/api/sheets')
      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to fetch sheets')

      sheets.value = res.data
      return res.data
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheets')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchSheet(id: number) {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(`/api/sheets/${id}`)
      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to fetch sheet')

      return upsertLocal(res.data)
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheet')
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchSheetByDreamId(dreamId: number) {
    const cached = sheetsByDreamId.value.get(dreamId)
    if (cached) return cached

    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(
        `/api/sheets/by-dream/${dreamId}`,
      )
      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to fetch sheet by Dream')

      return upsertLocal(res.data)
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheet by Dream')
      return null
    } finally {
      loading.value = false
    }
  }

  async function ensureSheetForDream(dreamId: number) {
    const cached = sheetsByDreamId.value.get(dreamId)
    if (cached) return { success: true, data: cached, created: false }

    isSaving.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(
        `/api/sheets/by-dream/${dreamId}`,
        {
          method: 'POST',
        },
      )

      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to create sheet')

      const sheet = upsertLocal(res.data)
      return { success: true, data: sheet, created: true }
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'creating sheet for Dream')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function ensureSheetsForDreams(dreams: Array<{ id?: number | null }>) {
    isSaving.value = true
    error.value = null

    const created: SheetWithDream[] = []
    const skipped: number[] = []
    const failed: { dreamId: number; message: string }[] = []

    try {
      for (const dream of dreams) {
        const dreamId = Number(dream.id)
        if (!Number.isInteger(dreamId) || dreamId <= 0) continue

        if (sheetsByDreamId.value.has(dreamId)) {
          skipped.push(dreamId)
          continue
        }

        const result = await ensureSheetForDream(dreamId)
        if (result.success && result.data) created.push(result.data)
        else
          failed.push({ dreamId, message: result.message || 'Unknown error' })
      }

      return {
        success: failed.length === 0,
        created,
        skipped,
        failed,
        message: `${created.length} sheets created, ${skipped.length} skipped, ${failed.length} failed.`,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function createSheet(payload: SheetCreatePayload) {
    isSaving.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to create sheet')

      return { success: true, data: upsertLocal(res.data) }
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'creating sheet')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updateSheet(id: number, payload: SheetUpdatePayload) {
    isSaving.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(`/api/sheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data)
        throw new Error(res.message || 'Failed to update sheet')

      return { success: true, data: upsertLocal(res.data) }
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'updating sheet')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteSheet(id: number) {
    isSaving.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(`/api/sheets/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) throw new Error(res.message || 'Failed to delete sheet')

      removeLocal(id)
      return { success: true }
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'deleting sheet')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  function selectSheet(id: number) {
    selectedSheet.value = sheetsById.value.get(id) ?? null
    return selectedSheet.value
  }

  function selectSheetByDreamId(dreamId: number) {
    selectedSheet.value = sheetsByDreamId.value.get(dreamId) ?? null
    return selectedSheet.value
  }

  function clearSelectedSheet() {
    selectedSheet.value = null
  }

  async function syncWorkspaceSheetOpen(open?: boolean) {
    const { useNavStore } = await import('@/stores/navStore')
    const navStore = useNavStore()

    if (typeof open === 'boolean') {
      navStore.setWorkspaceSheetOpen(open)
      return
    }

    navStore.toggleWorkspaceSheet()
  }

  function setSheet(
    payload: WorkspaceSheetOverride,
    options: WorkspaceSheetOptions = {},
  ) {
    override.value = {
      source: payload.source || 'manual',
      label: payload.label || '',
      title: payload.title || '',
      narrative: payload.narrative || '',
      imagePath: payload.imagePath || '',
      artImageId: payload.artImageId ?? null,
      icon: payload.icon || 'kind-icon:blueprint',
    }

    if (typeof options.open === 'boolean') {
      void syncWorkspaceSheetOpen(options.open)
    }

    return override.value
  }

  function setSheetFromTab(tab: WorkspaceTabSheetInput) {
    return setSheet({
      source: tab.key ? `dashboard-tab:${tab.key}` : 'dashboard-tab',
      label: tab.label || 'Dashboard',
      title: tab.title || tab.label || 'Dashboard',
      narrative:
        tab.summary || tab.description || tab.narrative || tab.tagline || '',
      imagePath:
        tab.imagePath ||
        tab.image ||
        tab.heroImage ||
        tab.splashImage ||
        tab.deckImage ||
        '',
      icon: tab.icon || 'kind-icon:layout-dashboard',
    })
  }

  function clearSheet(source?: string) {
    if (source && override.value?.source !== source) return

    override.value = null
  }

  function toggleSheet(open?: boolean) {
    void syncWorkspaceSheetOpen(open)
  }

  return {
    sheets,
    selectedSheet,
    loading,
    isSaving,
    error,
    sheetsById,
    sheetsByDreamId,
    fetchSheets,
    fetchSheet,
    fetchSheetByDreamId,
    ensureSheetForDream,
    ensureSheetsForDreams,
    createSheet,
    updateSheet,
    deleteSheet,
    selectSheet,
    selectSheetByDreamId,
    clearSelectedSheet,
    override,
    setSheet,
    setSheetFromTab,
    clearSheet,
    toggleSheet,
  }
})

export type { PitchSheet }
