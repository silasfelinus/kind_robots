// /stores/milestoneStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Milestone,
  MilestoneRecord,
} from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { performFetch, handleError, type ApiResponse } from './utils'

type UserScore = {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

const isClient = typeof window !== 'undefined'

export const useMilestoneStore = defineStore('milestoneStore', () => {
  const userStore = useUserStore()

  const milestones = ref<Milestone[]>([])
  const milestoneRecords = ref<MilestoneRecord[]>([])
  const isInitialized = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchMilestonesPromise = ref<Promise<Milestone[]> | null>(null)
  const fetchRecordsPromise = ref<Promise<MilestoneRecord[]> | null>(null)
  const fetchHighClickScoresPromise = ref<Promise<UserScore[]> | null>(null)
  const fetchHighMatchScoresPromise = ref<Promise<UserScore[]> | null>(null)

  const highClickScores = ref<UserScore[]>([])
  const highMatchScores = ref<UserScore[]>([])
  const pendingGuestMilestones = ref<number[]>([])

  const hasPendingGuestMilestones = computed(
    () => pendingGuestMilestones.value.length > 0,
  )

  const milestoneCountForUser = computed(
    () =>
      milestoneRecords.value.filter(
        (record) => record.userId === userStore.userId,
      ).length,
  )

  const unconfirmedMilestones = computed(() => {
    return milestones.value.filter((milestone) =>
      milestoneRecords.value.some(
        (record) =>
          record.userId === userStore.userId &&
          record.milestoneId === milestone.id &&
          !record.isConfirmed,
      ),
    )
  })

  const milestoneSummary = computed(() => {
    return milestones.value.map((milestone) => ({
      id: milestone.id,
      label: milestone.label,
      isActive: milestone.isActive,
    }))
  })

  const activeMilestones = computed(() => {
    return milestones.value.filter((milestone) => milestone.isActive)
  })

  function persist() {
    if (!isClient) return

    localStorage.setItem('milestones', JSON.stringify(milestones.value))
    localStorage.setItem(
      'milestoneRecords',
      JSON.stringify(milestoneRecords.value),
    )
  }

  function shouldRun(): boolean {
    return userStore.isLoggedIn && userStore.userId !== 10
  }

  function hasMilestone(userId: number, milestoneId: number) {
    return milestoneRecords.value.some(
      (record) =>
        record.userId === userId && record.milestoneId === milestoneId,
    )
  }

  function deactivateMilestone(id: number) {
    const milestone = milestones.value.find((entry) => entry.id === id)
    if (milestone) {
      milestone.isActive = false
      persist()
    }
  }

  async function fetchMilestones(force = false): Promise<Milestone[]> {
    if (!force && milestones.value.length) return milestones.value
    if (fetchMilestonesPromise.value) return fetchMilestonesPromise.value

    fetchMilestonesPromise.value = (async () => {
      try {
        const res = await performFetch<Milestone[]>('/api/milestones/')

        if (res.success && Array.isArray(res.data)) {
          milestones.value = res.data
          persist()
        }

        return milestones.value
      } catch (error) {
        handleError(error, 'fetching milestones')
        return []
      } finally {
        fetchMilestonesPromise.value = null
      }
    })()

    return fetchMilestonesPromise.value
  }

  async function fetchMilestoneRecords(
    force = false,
  ): Promise<MilestoneRecord[]> {
    if (!force && milestoneRecords.value.length) return milestoneRecords.value
    if (fetchRecordsPromise.value) return fetchRecordsPromise.value

    fetchRecordsPromise.value = (async () => {
      try {
        const res = await performFetch<MilestoneRecord[]>(
          '/api/milestones/records',
        )

        if (res.success && Array.isArray(res.data)) {
          milestoneRecords.value = res.data
          persist()
        }

        return milestoneRecords.value
      } catch (error) {
        handleError(error, 'fetching milestone records')
        return []
      } finally {
        fetchRecordsPromise.value = null
      }
    })()

    return fetchRecordsPromise.value
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        if (isClient) {
          const storedMilestones = localStorage.getItem('milestones')
          const storedRecords = localStorage.getItem('milestoneRecords')

          if (storedMilestones) {
            milestones.value = JSON.parse(storedMilestones)
          }

          if (storedRecords) {
            milestoneRecords.value = JSON.parse(storedRecords)
          }
        }

        if (!milestones.value.length || !milestoneRecords.value.length) {
          await Promise.all([fetchMilestones(), fetchMilestoneRecords()])
        }

        isInitialized.value = true

        if (!userStore.isGuest && isClient) {
          const storedPending = localStorage.getItem('pendingGuestMilestones')

          if (storedPending) {
            try {
              const pendingIds = JSON.parse(storedPending) as number[]

              for (const id of pendingIds) {
                await rewardMilestone(id)
              }

              pendingGuestMilestones.value = []
              localStorage.removeItem('pendingGuestMilestones')
            } catch (error) {
              console.warn('Failed to restore pending guest milestones:', error)
            }
          }
        }
      } catch (error) {
        handleError(error, 'initializing milestoneStore')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function confirmMilestone(milestoneId: number) {
    if (userStore.isGuest) {
      deactivateMilestone(milestoneId)
      return
    }

    const record = milestoneRecords.value.find(
      (entry) =>
        entry.userId === userStore.userId && entry.milestoneId === milestoneId,
    )

    if (!record) return

    record.isConfirmed = true

    try {
      const result = await updateMilestoneRecord({
        id: record.id,
        isConfirmed: true,
      })

      if (!result.success) {
        console.warn(`[milestoneStore] Failed to confirm ${milestoneId}`)
      }
    } catch (error) {
      handleError(error, 'confirming milestone')
      deactivateMilestone(milestoneId)
    }
  }

  async function updateMilestone(milestone: Milestone) {
    if (!milestone.id) {
      console.error('Milestone ID is required for updating.')
      return
    }

    try {
      const response = await performFetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        body: JSON.stringify(milestone),
      })

      if (response.success) {
        await fetchMilestones(true)
      }
    } catch (error) {
      handleError(error, 'updating milestone')
    }
  }

  async function updateMilestonesFromData() {
    for (const updatedMilestone of milestoneData) {
      const existingMilestone = milestones.value.find(
        (entry) => entry.id === updatedMilestone.id,
      )

      if (existingMilestone) {
        Object.assign(existingMilestone, updatedMilestone)
        await updateMilestone(existingMilestone)
      }
    }
  }

  async function fetchHighClickScores(force = false): Promise<UserScore[]> {
    if (!force && highClickScores.value.length) return highClickScores.value
    if (fetchHighClickScoresPromise.value)
      return fetchHighClickScoresPromise.value

    fetchHighClickScoresPromise.value = (async () => {
      try {
        const response = await performFetch<UserScore[]>(
          '/api/milestones/highClickScores',
        )
        highClickScores.value = response.data ?? []
        return highClickScores.value
      } catch (error) {
        handleError(error, 'fetching high click scores')
        return []
      } finally {
        fetchHighClickScoresPromise.value = null
      }
    })()

    return fetchHighClickScoresPromise.value
  }

  async function fetchHighMatchScores(force = false): Promise<UserScore[]> {
    if (!force && highMatchScores.value.length) return highMatchScores.value
    if (fetchHighMatchScoresPromise.value)
      return fetchHighMatchScoresPromise.value

    fetchHighMatchScoresPromise.value = (async () => {
      try {
        const response = await performFetch<UserScore[]>(
          '/api/milestones/highMatchScores',
        )
        highMatchScores.value = response.data ?? []
        return highMatchScores.value
      } catch (error) {
        handleError(error, 'fetching high match scores')
        return []
      } finally {
        fetchHighMatchScoresPromise.value = null
      }
    })()

    return fetchHighMatchScoresPromise.value
  }

  async function updateClickRecord(newScore: number): Promise<string> {
    try {
      const userId = userStore.userId
      if (!userId) throw new Error('User ID is not available')

      const response = await performFetch('/api/milestones/updateClickRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      return response.success ? 'Updated' : 'Failed'
    } catch (error) {
      handleError(error, 'updating click record')
      return 'Failed'
    }
  }

  async function updateMatchRecord(newScore: number): Promise<void> {
    try {
      const userId = userStore.userId
      if (!userId) throw new Error('User ID is not available')

      await performFetch('/api/milestones/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      await fetchHighMatchScores(true)
    } catch (error) {
      handleError(error, 'updating match record')
    }
  }

  async function updateMilestoneRecord(
    record: Partial<MilestoneRecord>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await performFetch<MilestoneRecord>(
        `/api/milestones/records/${record.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(record),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update milestone record')
      }

      const index = milestoneRecords.value.findIndex(
        (entry) => entry.id === response.data!.id,
      )

      if (index !== -1) {
        milestoneRecords.value[index] = response.data
      }

      persist()
      return { success: true }
    } catch (error) {
      handleError(error, 'updating milestone record')
      return { success: false, message: (error as Error).message }
    }
  }

  async function fetchMilestoneById(
    milestoneId: number,
  ): Promise<ApiResponse<Milestone>> {
    try {
      const response = await performFetch<Milestone>(
        `/api/milestones/${milestoneId}`,
      )

      return response.success && response.data
        ? { success: true, message: 'Milestone recovered', data: response.data }
        : { success: false, message: response.message || 'Milestone not found' }
    } catch (error) {
      handleError(error, 'fetching milestone by ID')
      return {
        success: false,
        message: 'Unknown error occurred while fetching milestone',
      }
    }
  }

  async function addMilestoneRecord(record: Partial<MilestoneRecord>) {
    try {
      const response = await performFetch<MilestoneRecord>(
        '/api/milestones/records',
        {
          method: 'POST',
          body: JSON.stringify(record),
        },
      )

      if (response.success && response.data) {
        milestoneRecords.value.push(response.data)
        persist()
        return { success: true, message: 'Milestone recorded successfully.' }
      }

      throw new Error(response.message || 'Unknown error occurred')
    } catch (error) {
      handleError(error, 'adding milestone record')
      return { success: false, message: 'An error occurred' }
    }
  }

  async function recordMilestone(userId: number, milestoneId: number) {
    if (userStore.isGuest) {
      return {
        success: true,
        message: 'Guest users cannot earn milestones.',
      }
    }

    if (hasMilestone(userId, milestoneId)) {
      return {
        success: true,
        message: 'Milestone already recorded for this user.',
      }
    }

    try {
      return await addMilestoneRecord({
        userId,
        milestoneId,
        username: userStore.username,
      })
    } catch (error) {
      handleError(error, 'recording milestone')
      return {
        success: false,
        message: 'An error occurred while recording milestone',
      }
    }
  }

  async function rewardMilestone(milestoneId: number) {
    const userId = userStore.userId

    if (userStore.isGuest) {
      if (!isClient) return

      try {
        const current = JSON.parse(
          localStorage.getItem('pendingGuestMilestones') || '[]',
        ) as number[]

        if (!current.includes(milestoneId)) {
          current.push(milestoneId)
          localStorage.setItem(
            'pendingGuestMilestones',
            JSON.stringify(current),
          )
        }

        pendingGuestMilestones.value = current
      } catch (error) {
        console.warn('Failed to store pending milestone:', error)
      }

      return
    }

    if (!shouldRun()) return

    let milestone = milestones.value.find((entry) => entry.id === milestoneId)

    if (!milestone) {
      const fetched = await fetchMilestoneById(milestoneId)

      if (!fetched.success || !fetched.data) {
        console.warn(`Milestone ${milestoneId} not found.`)
        return
      }

      milestones.value.push(fetched.data)
      milestone = fetched.data
    }

    if (!hasMilestone(userId, milestoneId)) {
      const result = await recordMilestone(userId, milestoneId)

      if (!result.success) {
        console.warn(`Failed to record milestone: ${result.message}`)
        return
      }
    }

    if (milestone && !milestone.isActive) {
      milestone.isActive = true
      persist()
    }
  }

  async function clearAllMilestoneRecords() {
    try {
      const response = await performFetch(`/api/milestones/records/clear/`, {
        method: 'DELETE',
      })

      if (response.success) {
        milestoneRecords.value = []
        persist()
      } else {
        console.warn(response.message)
      }
    } catch (error) {
      handleError(error, 'clearing all milestone records')
    }
  }

  return {
    milestones,
    milestoneRecords,
    activeMilestones,
    unconfirmedMilestones,
    milestoneSummary,
    highClickScores,
    highMatchScores,
    isInitialized,
    hasPendingGuestMilestones,

    initialize,
    fetchMilestones,
    fetchMilestoneRecords,
    fetchMilestoneById,
    updateMilestone,
    updateMilestonesFromData,
    deactivateMilestone,
    rewardMilestone,

    addMilestoneRecord,
    confirmMilestone,
    updateMilestoneRecord,
    recordMilestone,
    hasMilestone,
    clearAllMilestoneRecords,
    milestoneCountForUser,

    fetchHighClickScores,
    fetchHighMatchScores,
    updateMatchRecord,
    updateClickRecord,

    persist,
  }
})

export type { Milestone, MilestoneRecord }
