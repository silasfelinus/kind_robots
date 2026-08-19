// /stores/socialDraftsStore.ts
//
// kind-economy/t-025: owns the fetch/approve/reject/populate calls behind
// the admin social-drafts review queue (pages/admin/social-drafts.vue).
// Components never call APIs directly, per AGENTS.md -- same shape as
// creatorEarningsStore.ts. There is no "publish"/"post" action anywhere in
// this store: approve/reject are the only two mutations, and neither calls
// an external platform.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from './utils'

export type SocialPlatform = 'BLUESKY' | 'INSTAGRAM'
export type SocialPostDraftStatus = 'DRAFT' | 'APPROVED' | 'REJECTED'

export type SocialPostDraft = {
  id: number
  createdAt: string
  updatedAt: string | null
  platform: SocialPlatform
  sourceType: string
  sourceId: number
  bodyText: string
  disclosureLabel: string
  mediaUrl: string | null
  status: SocialPostDraftStatus
  reviewedBy: number | null
  reviewedAt: string | null
}

export type CeilingStatus = {
  platform: SocialPlatform
  approvedToday: number
  ceiling: number
}

export const useSocialDraftsStore = defineStore('socialDraftsStore', () => {
  const drafts = ref<SocialPostDraft[]>([])
  const ceilingStatus = ref<CeilingStatus[]>([])
  const loading = ref(false)
  const error = ref('')

  const statusFilter = ref<SocialPostDraftStatus | ''>('DRAFT')
  const platformFilter = ref<SocialPlatform | ''>('')

  const pendingDrafts = computed(() =>
    drafts.value.filter((draft) => draft.status === 'DRAFT'),
  )

  async function fetchDrafts() {
    loading.value = true
    error.value = ''
    try {
      const params = new URLSearchParams()
      if (statusFilter.value) params.set('status', statusFilter.value)
      if (platformFilter.value) params.set('platform', platformFilter.value)
      const qs = params.toString()

      const res = await performFetch<{
        drafts: SocialPostDraft[]
        ceilingStatus: CeilingStatus[]
      }>(`/api/social/drafts${qs ? `?${qs}` : ''}`)

      if (res.success && res.data) {
        drafts.value = res.data.drafts
        ceilingStatus.value = res.data.ceilingStatus
      } else {
        error.value = res.message || 'Failed to load social post drafts.'
      }
    } catch (err) {
      handleError(err, 'socialDraftsStore.fetchDrafts')
      error.value = 'Failed to load social post drafts.'
    } finally {
      loading.value = false
    }
  }

  async function populate() {
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<{
        scanned: number
        created: number
        skipped: number
      }>('/api/social/drafts/populate', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      if (!res.success) {
        error.value = res.message || 'Failed to populate drafts.'
      }
      await fetchDrafts()
      return res
    } catch (err) {
      handleError(err, 'socialDraftsStore.populate')
      error.value = 'Failed to populate drafts.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function approve(id: number) {
    error.value = ''
    try {
      const res = await performFetch<SocialPostDraft>(
        `/api/social/drafts/${id}/approve`,
        { method: 'POST' },
      )
      if (res.success && res.data) {
        applyUpdate(res.data)
      } else {
        error.value = res.message || 'Failed to approve draft.'
      }
      return res
    } catch (err) {
      handleError(err, 'socialDraftsStore.approve')
      error.value = 'Failed to approve draft.'
      return null
    }
  }

  async function reject(id: number) {
    error.value = ''
    try {
      const res = await performFetch<SocialPostDraft>(
        `/api/social/drafts/${id}/reject`,
        { method: 'POST' },
      )
      if (res.success && res.data) {
        applyUpdate(res.data)
      } else {
        error.value = res.message || 'Failed to reject draft.'
      }
      return res
    } catch (err) {
      handleError(err, 'socialDraftsStore.reject')
      error.value = 'Failed to reject draft.'
      return null
    }
  }

  function applyUpdate(updated: SocialPostDraft) {
    const index = drafts.value.findIndex((draft) => draft.id === updated.id)
    if (index === -1) return
    if (statusFilter.value && updated.status !== statusFilter.value) {
      drafts.value.splice(index, 1)
    } else {
      drafts.value[index] = updated
    }
    const ceilingIndex = ceilingStatus.value.findIndex(
      (row) => row.platform === updated.platform,
    )
    if (ceilingIndex !== -1 && updated.status === 'APPROVED') {
      const row = ceilingStatus.value[ceilingIndex]
      if (row) row.approvedToday += 1
    }
  }

  return {
    drafts,
    pendingDrafts,
    ceilingStatus,
    loading,
    error,
    statusFilter,
    platformFilter,
    fetchDrafts,
    populate,
    approve,
    reject,
  }
})
