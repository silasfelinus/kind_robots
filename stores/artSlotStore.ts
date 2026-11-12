// /stores/artSlotStore.ts
//
// Admin art-slot chooser state (pages/admin/art-slots.vue): every render made
// for one place an image is used, which one is in use, verdicts, and the
// same-picture cleanup. Server side: server/utils/artSlots.ts.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { handleError, performFetch } from '@/stores/utils'
import { resolveArtImageSource } from '@/utils/artImageSource'

export type ArtSlotCandidate = {
  id: number
  artImageId: number
  artJobId: number | null
  source: string
  sourceRef: string | null
  seed: number | null
  checkpoint: string | null
  verdict: string
  note: string | null
  isActive: boolean
  isMature: boolean
  thumbnailUrl: string | null
}

export type ArtSlot = {
  id: number
  slotKey: string
  projectSlug: string | null
  label: string | null
  selectedArtImageId: number | null
  candidates: ArtSlotCandidate[]
}

type SlotPage = {
  slots: ArtSlot[]
  page: number
  pageCount: number
  totalCount: number
}

type DedupeResult = {
  apply: boolean
  removed: number
  slots: Array<{ groups: Array<{ removeArtImageIds: number[] }> }>
}

export const useArtSlotStore = defineStore('artSlotStore', () => {
  const slots = ref<ArtSlot[]>([])
  const page = ref(1)
  const pageCount = ref(1)
  const totalCount = ref(0)
  const projectSlug = ref('')
  const prefix = ref('')
  const multipleOnly = ref(true)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isDeduping = ref(false)
  const errorMessage = ref('')
  const notice = ref('')
  const dedupePlan = ref<null | { count: number; slots: number }>(null)

  function query(): string {
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: '24',
    })
    if (projectSlug.value) params.set('projectSlug', projectSlug.value)
    if (prefix.value) params.set('prefix', prefix.value)
    if (multipleOnly.value) params.set('multiple', '1')
    return params.toString()
  }

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await performFetch<SlotPage>(`/api/art/slots?${query()}`)
      if (!res.success || !res.data)
        throw new Error(res.message || 'Could not load the art slots.')
      slots.value = res.data.slots
      page.value = res.data.page
      pageCount.value = res.data.pageCount
      totalCount.value = res.data.totalCount
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load art slots.'
      handleError(error, 'loading art slots')
    } finally {
      isLoading.value = false
    }
  }

  async function search(): Promise<void> {
    page.value = 1
    dedupePlan.value = null
    notice.value = ''
    await load()
  }

  async function goTo(next: number): Promise<void> {
    page.value = Math.min(Math.max(next, 1), pageCount.value)
    await load()
  }

  async function choose(
    slot: ArtSlot,
    candidate: ArtSlotCandidate,
  ): Promise<boolean> {
    isSaving.value = true
    errorMessage.value = ''
    try {
      const res = await performFetch(`/api/art/slots/${slot.id}/select`, {
        method: 'POST',
        body: JSON.stringify({ artImageId: candidate.artImageId }),
      })
      if (!res.success)
        throw new Error(res.message || 'Could not choose that image.')
      slot.selectedArtImageId = candidate.artImageId
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not choose that image.'
      handleError(error, 'choosing slot art')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function setVerdict(
    candidate: ArtSlotCandidate,
    verdict: string,
  ): Promise<boolean> {
    isSaving.value = true
    errorMessage.value = ''
    try {
      const res = await performFetch(
        `/api/art/slots/candidates/${candidate.id}`,
        { method: 'PATCH', body: JSON.stringify({ verdict }) },
      )
      if (!res.success)
        throw new Error(res.message || 'Could not save the verdict.')
      candidate.verdict = verdict
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not save the verdict.'
      handleError(error, 'saving a candidate verdict')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function dedupe(apply: boolean): Promise<void> {
    if (!projectSlug.value) return
    isDeduping.value = true
    errorMessage.value = ''
    notice.value = ''
    try {
      const res = await performFetch<DedupeResult>(
        '/api/art/slots/dedupe',
        {
          method: 'POST',
          body: JSON.stringify({ projectSlug: projectSlug.value, apply }),
        },
        1,
        60000,
      )
      if (!res.success || !res.data)
        throw new Error(res.message || 'Could not check for duplicates.')
      if (apply) {
        dedupePlan.value = null
        notice.value = `${res.data.removed} duplicate render(s) moved to the Recycle Bin.`
        await load()
        return
      }
      const count = res.data.slots.reduce(
        (sum, slot) =>
          sum +
          slot.groups.reduce(
            (n, group) => n + group.removeArtImageIds.length,
            0,
          ),
        0,
      )
      dedupePlan.value = { count, slots: res.data.slots.length }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not check duplicates.'
      handleError(error, 'deduping art slots')
    } finally {
      isDeduping.value = false
    }
  }

  async function fullImageSrc(artImageId: number): Promise<string> {
    const res = await performFetch<Parameters<typeof resolveArtImageSource>[0]>(
      `/api/art/image/${artImageId}?includeImageData=true&showMature=true`,
    )
    return res.success && res.data ? resolveArtImageSource(res.data).src : ''
  }

  return {
    slots,
    page,
    pageCount,
    totalCount,
    projectSlug,
    prefix,
    multipleOnly,
    isLoading,
    isSaving,
    isDeduping,
    errorMessage,
    notice,
    dedupePlan,
    load,
    search,
    goTo,
    choose,
    setVerdict,
    dedupe,
    fullImageSrc,
  }
})
