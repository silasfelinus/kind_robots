import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { performFetch, handleError, type ApiResponse } from './utils'

type UserScore = {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

export const useMilestoneStore = defineStore('milestoneStore', () => {
  const userStore = useUserStore()

  const milestones = ref<Milestone[]>([])
  const milestoneRecords = ref<MilestoneRecord[]>([])
  const isInitialized = ref(false)
  const highClickScores = ref<UserScore[]>([])
  const highMatchScores = ref<UserScore[]>([])
  const pendingGuestMilestones = ref<number[]>([])
  const hasPendingGuestMilestones = computed(
    () => pendingGuestMilestones.value.length > 0,
  )

  const milestoneCountForUser = computed(() => {
    return milestoneRecords.value.filter(
      (record) => record.userId === userStore.userId,
    ).length
  })

  function persist() {
    if (typeof window === 'undefined') return
    localStorage.setItem('milestones', JSON.stringify(milestones.value))
    localStorage.setItem(
      'milestoneRecords',
      JSON.stringify(milestoneRecords.value),
    )
  }

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

  async function initialize() {
    if (isInitialized.value) return

    if (typeof window !== 'undefined') {
      const storedMilestones = localStorage.getItem('milestones')
      const storedRecords = localStorage.getItem('milestoneRecords')

      if (storedMilestones) milestones.value = JSON.parse(storedMilestones)
      if (storedRecords) milestoneRecords.value = JSON.parse(storedRecords)
    }

    await fetchMilestones()
    await fetchMilestoneRecords()
    isInitialized.value = true

    if (!userStore.isGuest && typeof window !== 'undefined') {
      const storedPending = localStorage.getItem('pendingGuestMilestones')
      if (storedPending) {
        try {
          console.log('pending guest milestones: ', storedPending)
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
  }

  async function confirmMilestone(milestoneId: number) {
    console.log(`[milestoneStore] Confirming milestone ${milestoneId}...`)

    if (userStore.isGuest) {
      console.warn('[milestoneStore] Guest cannot confirm. Deactivating.')
      deactivateMilestone(milestoneId)
      return
    }

    await fetchMilestoneRecords()

    const record = milestoneRecords.value.find(
      (r) => r.userId === userStore.userId && r.milestoneId === milestoneId,
    )

    if (!record) {
      console.warn(`[milestoneStore] Record not found for ${milestoneId}`)
      return
    }

    try {
      record.isConfirmed = true
      const result = await updateMilestoneRecord({
        id: record.id,
        isConfirmed: true,
      })

      if (!result.success) {
        console.warn(`[milestoneStore] Update failed: ${result.message}`)
      }
    } catch (error) {
      handleError(error, 'confirming milestone')
      deactivateMilestone(milestoneId)
    }
  }

  async function fetchMilestones() {
    try {
      const response = await performFetch<{
        success: boolean
        data: Milestone[]
      }>('/api/milestones/')
      milestones.value =
        response.success && Array.isArray(response.data) ? response.data : []
      persist()
    } catch (error) {
      handleError(error, 'fetching milestones')
    }
  }

  async function fetchMilestoneRecords() {
    try {
      const response = await performFetch<{
        success: boolean
        data: MilestoneRecord[]
      }>('/api/milestones/records')
      milestoneRecords.value =
        response.success && Array.isArray(response.data) ? response.data : []
      persist()
    } catch (error) {
      handleError(error, 'fetching milestone records')
    }
  }

  async function updateMilestone(milestone: Milestone) {
    if (!milestone.id)
      return console.error('Milestone ID is required for updating.')
    try {
      const response = await performFetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        body: JSON.stringify(milestone),
      })
      if (response.success) await fetchMilestones()
    } catch (error) {
      handleError(error, 'updating milestone')
    }
  }

  async function updateMilestonesFromData() {
    for (const updatedMilestone of milestoneData) {
      const existingMilestone = milestones.value.find(
        (m) => m.id === updatedMilestone.id,
      )
      if (existingMilestone) {
        Object.assign(existingMilestone, updatedMilestone)
        await updateMilestone(existingMilestone)
      }
    }
  }

  async function fetchHighClickScores() {
    try {
      const response = await performFetch<UserScore[]>(
        '/api/milestones/highClickScores',
      )
      highClickScores.value = response.data ?? []
    } catch (error) {
      handleError(error, 'fetching high click scores')
    }
  }

  async function fetchHighMatchScores() {
    try {
      const response = await performFetch<UserScore[]>(
        '/api/milestones/highMatchScores',
      )
      highMatchScores.value = response.data ?? []
    } catch (error) {
      handleError(error, 'fetching high match scores')
    }
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

  async function updateMatchRecord(newScore: number) {
    try {
      const userId = userStore.userId
      if (!userId) throw new Error('User ID is not available')

      await performFetch('/api/milestones/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      await fetchHighMatchScores()
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

  async function recordMilestone(userId: number, milestoneId: number) {
    if (useUserStore().isGuest) {
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
      try {
        const current = JSON.parse(
          localStorage.getItem('pendingGuestMilestones') || '[]',
        )
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

    const milestone = milestones.value.find((m) => m.id === milestoneId)
    if (!milestone) {
      const fetched = await fetchMilestoneById(milestoneId)
      if (!fetched.success || !fetched.data) {
        console.warn(`Milestone ${milestoneId} not found.`)
        return
      }
      milestones.value.push(fetched.data)
    }

    if (!hasMilestone(userId, milestoneId)) {
      const result = await recordMilestone(userId, milestoneId)
      if (!result.success) {
        console.warn(`Failed to record milestone: ${result.message}`)
        return
      }
    }

    const m = milestones.value.find((m) => m.id === milestoneId)
    if (m && !m.isActive) {
      m.isActive = true
      persist()
    }

    console.log(`Milestone ${milestoneId} rewarded.`)
  }

  function deactivateMilestone(id: number) {
    const m = milestones.value.find((m) => m.id === id)
    if (m) m.isActive = false
    persist()
  }

  function shouldRun(): boolean {
    return userStore.isLoggedIn && userStore.userId !== 10
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

  function hasMilestone(userId: number, milestoneId: number) {
    return milestoneRecords.value.some(
      (record) =>
        record.userId === userId && record.milestoneId === milestoneId,
    )
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

    // Milestone logic
    initialize,
    fetchMilestones,
    fetchMilestoneRecords,
    fetchMilestoneById,
    updateMilestone,
    updateMilestonesFromData,
    deactivateMilestone,
    rewardMilestone,

    // Milestone record logic
    addMilestoneRecord,
    confirmMilestone,
    updateMilestoneRecord,
    recordMilestone,
    hasMilestone,
    clearAllMilestoneRecords,
    milestoneCountForUser,

    // Leaderboard / game scores
    fetchHighClickScores,
    fetchHighMatchScores,
    updateMatchRecord,
    updateClickRecord,

    // Local persistence
    persist,

    // Debug
    // debugMilestones,
  }
})

export type { Milestone, MilestoneRecord }
