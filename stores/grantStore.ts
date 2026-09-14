// /stores/grantStore.ts
// Thin client for the Grant-sharing API (kind-robots/t-044/t-062,
// SHARING-SPEC.md). Two call shapes: manage grants on a subject you own
// (list/create/revoke), and list what has been shared with you.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Grant,
  GrantLevel,
  GrantSubject,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

export type CreateGrantInput = {
  granteeId: number
  subjectType: GrantSubject
  subjectId: number
  level: GrantLevel
  expiresAt?: string | null
}

export const useGrantStore = defineStore('grantStore', () => {
  // Grants for whatever subject `loadSubjectGrants` last fetched.
  const subjectGrants = ref<Grant[]>([])
  // Active grants where the current user is the grantee ("shared with me").
  const sharedWithMe = ref<Grant[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadSubjectGrants(
    subjectType: GrantSubject,
    subjectId: number,
  ): Promise<Grant[]> {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<Grant[]>(
        `/api/grants?subjectType=${subjectType}&subjectId=${subjectId}`,
      )

      if (!res.success) {
        error.value = res.message
        return []
      }

      subjectGrants.value = res.data ?? []
      return subjectGrants.value
    } catch (err) {
      handleError(err, 'loading shared grants')
      error.value = 'Failed to load grants.'
      return []
    } finally {
      loading.value = false
    }
  }

  async function loadSharedWithMe(): Promise<Grant[]> {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<Grant[]>('/api/grants/mine')

      if (!res.success) {
        error.value = res.message
        return []
      }

      sharedWithMe.value = res.data ?? []
      return sharedWithMe.value
    } catch (err) {
      handleError(err, 'loading content shared with you')
      error.value = 'Failed to load shared content.'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createGrant(input: CreateGrantInput): Promise<Grant | null> {
    error.value = null

    try {
      const res = await performFetch<Grant>('/api/grants', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!res.success || !res.data) {
        error.value = res.message
        return null
      }

      subjectGrants.value = [res.data, ...subjectGrants.value]
      return res.data
    } catch (err) {
      handleError(err, 'sharing this item')
      error.value = 'Failed to create the share.'
      return null
    }
  }

  async function revokeGrant(grantId: number): Promise<boolean> {
    error.value = null

    try {
      const res = await performFetch<Grant>(`/api/grants/${grantId}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        error.value = res.message
        return false
      }

      subjectGrants.value = subjectGrants.value.map((grant) =>
        grant.id === grantId ? { ...grant, status: 'REVOKED' } : grant,
      )
      return true
    } catch (err) {
      handleError(err, 'revoking a share')
      error.value = 'Failed to revoke the share.'
      return false
    }
  }

  return {
    subjectGrants,
    sharedWithMe,
    loading,
    error,
    loadSubjectGrants,
    loadSharedWithMe,
    createGrant,
    revokeGrant,
  }
})
