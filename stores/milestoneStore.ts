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
  const currentMilestone = ref<Milestone | null>(null)
  const highClickScores = ref<UserScore[]>([])
  const highMatchScores = ref<UserScore[]>([])

  const milestoneCountForUser = computed(() => {
    return milestoneRecords.value.filter(
      (record) => record.userId === userStore.userId,
    ).length
  })

  const getMilestoneCountForUser = (userId: number) => {
    return milestoneRecords.value.filter((record) => record.userId === userId)
      .length
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

  function acknowledgeFirstMilestone() {
    const first = activeMilestones.value[0]
    if (first) {
      const target = milestones.value.find((m) => m.id === first.id)
      if (target) target.isActive = false
      saveMilestonesToLocalStorage()
    }
  }

  const activeMilestones = computed(() => {
    return milestones.value.filter((milestone) => milestone.isActive)
  })

  async function initializeMilestones() {
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
  }

  async function confirmMilestone(milestoneId: number) {
    const record = milestoneRecords.value.find(
      (r) => r.userId === userStore.userId && r.milestoneId === milestoneId,
    )

    if (record) {
      record.isConfirmed = true
      saveMilestoneRecordsToLocalStorage()
    } else {
      console.warn(`Milestone record not found for user: ${userStore.userId}`)
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
      saveMilestonesToLocalStorage()
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
      saveMilestoneRecordsToLocalStorage()
    } catch (error) {
      handleError(error, 'fetching milestone records')
    }
  }

  function saveMilestonesToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('milestones', JSON.stringify(milestones.value))
    }
  }

  function saveMilestoneRecordsToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'milestoneRecords',
        JSON.stringify(milestoneRecords.value),
      )
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
  async function updateMilestoneRecord(record: Partial<MilestoneRecord>) {
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
    } catch (error) {
      handleError(error, 'updating milestone record')
      throw error
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
    if (userId === 0) {
      return {
        success: true,
        message: 'Guest accounts cannot record milestones.',
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

  function clearCurrentMilestone() {
    currentMilestone.value = null
  }

  async function clearAllMilestoneRecords() {
    try {
      const response = await performFetch(`/api/milestones/records/clear/`, {
        method: 'DELETE',
      })
      if (response.success) {
        milestoneRecords.value = []
        saveMilestoneRecordsToLocalStorage()
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
        saveMilestoneRecordsToLocalStorage()
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
    initializeMilestones,
    confirmMilestone,
    milestoneRecords,
    isInitialized,
    currentMilestone,
    highClickScores,
    highMatchScores,
    getMilestoneCountForUser,
    updateMilestonesFromData,
    fetchHighClickScores,
    fetchMilestones,
    fetchMilestoneRecords,
    fetchHighMatchScores,
    updateClickRecord,
    updateMatchRecord,
    milestoneCountForUser,
    unconfirmedMilestones,
    milestoneSummary,
    activeMilestones,
    fetchMilestoneById,
    recordMilestone,
    clearAllMilestoneRecords,
    addMilestoneRecord,
    hasMilestone,
    updateMilestoneRecord,
    clearCurrentMilestone,
    acknowledgeFirstMilestone,
  }
})

export type { Milestone, MilestoneRecord }
