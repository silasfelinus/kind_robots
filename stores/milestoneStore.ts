import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { performFetch, handleError } from './utils'

type UserScore = {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: null as Milestone | null,
    highClickScores: [] as UserScore[],
    highMatchScores: [] as UserScore[],
  }),

  getters: {
    milestoneCountForUser: (state) => {
      const userId = useUserStore().userId
      const count = state.milestoneRecords.filter(
        (record) => record.userId === userId,
      ).length

      return count
    },

    milestoneSummary: (state) => {
      const summary = state.milestones.map((milestone) => ({
        id: milestone.id,
        label: milestone.label,
        isActive: milestone.isActive,
      }))

      return summary
    },

    activeMilestones: (state) => {
      const activeMilestones = state.milestones.filter(
        (milestone) => milestone.isActive,
      )

      return activeMilestones
    },
  },

  actions: {
    async initializeMilestones() {
      if (this.isInitialized) {
        return
      }

      if (typeof window !== 'undefined') {
        const storedMilestones = localStorage.getItem('milestones')
        const storedRecords = localStorage.getItem('milestoneRecords')

        if (storedMilestones) {
          this.milestones = JSON.parse(storedMilestones)
        }

        if (storedRecords) {
          this.milestoneRecords = JSON.parse(storedRecords)
        }
      }

      if (!this.milestones.length) {
        await this.fetchMilestones()
      }
      if (!this.milestoneRecords.length) {
        await this.fetchMilestoneRecords()
      }

      this.isInitialized = true
    },

    async fetchHighClickScores() {
      try {
        const response = await performFetch<UserScore[]>(
          '/api/milestones/highClickScores',
        )
        this.highClickScores = response.data ?? [] // Use the unwrapped `response.data` array directly
      } catch (error) {
        handleError(error, 'fetching high click scores')
      }
    },

    async fetchHighMatchScores() {
      try {
        const response = await performFetch<UserScore[]>(
          '/api/milestones/highMatchScores',
        )
        this.highMatchScores = response.data ?? [] // Use the unwrapped `response.data` array directly
      } catch (error) {
        handleError(error, 'fetching high match scores')
      }
    },
    async updateClickRecord(newScore: number): Promise<string> {
      try {
        const userStore = useUserStore()
        const userId = userStore.userId
        if (!userId) throw new Error('User ID is not available')

        const response = await fetch('/api/milestones/updateClickRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        })

        const data = await response.json()
        if (data.success) {
          return 'Updated'
        } else {
          return 'Failed'
        }
      } catch (error: unknown) {
        handleError(error, 'updating click record')
        return 'Failed'
      }
    },

    async updateMatchRecord(newScore: number) {
      try {
        const userId = useUserStore().userId
        if (!userId) throw new Error('User ID is not available')

        await performFetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          body: JSON.stringify({ newScore, userId }),
        })

        await this.fetchHighMatchScores()
      } catch (error) {
        handleError(error, 'updating match record')
      }
    },

    async fetchMilestoneById(id: number) {
      try {
        const response = await performFetch<{ milestone: Milestone }>(
          `/api/milestones/${id}`,
        )
        if (response.success && response.data) {
          return {
            success: true,
            message: 'Milestone fetched successfully',
            data: response.data,
          }
        } else {
          return {
            success: false,
            message: response.message || 'Failed to fetch milestone by ID',
          }
        }
      } catch (error) {
        handleError(error, `fetching milestone by ID ${id}`)
        return { success: false, message: 'An error occurred' }
      }
    },

    async fetchMilestones() {
      try {
        const response = await performFetch<{
          success: boolean
          data: Milestone[]
        }>('/api/milestones/')

        // Check if response is successful and `data` is properly populated
        if (response.success && Array.isArray(response.data)) {
          this.milestones = response.data
        } else {
          this.milestones = [] // Fallback in case data is null or undefined
        }

        console.log('Fetched milestones:', this.milestones)
        this.saveMilestonesToLocalStorage()
      } catch (error) {
        handleError(error, 'fetching milestones')
      }
    },

    async fetchMilestoneRecords() {
      try {
        const response = await performFetch<{ records: MilestoneRecord[] }>(
          '/api/milestones/records',
        )
        this.milestoneRecords = response.data?.records ?? [] // Access `records` inside `data`
        this.saveMilestoneRecordsToLocalStorage()
      } catch (error) {
        handleError(error, 'fetching milestone records')
      }
    },

    saveMilestonesToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('milestones', JSON.stringify(this.milestones))
      }
    },

    saveMilestoneRecordsToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'milestoneRecords',
          JSON.stringify(this.milestoneRecords),
        )
      }
    },

    async updateMilestonesFromData() {
      for (const updatedMilestone of milestoneData) {
        const existingMilestone = this.milestones.find(
          (m) => m.id === updatedMilestone.id,
        )
        if (existingMilestone) {
          Object.assign(existingMilestone, updatedMilestone)

          await this.updateMilestone(existingMilestone)
        }
      }
    },

    async updateMilestone(milestone: Milestone) {
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
          await this.fetchMilestones()
        }
      } catch (error) {
        handleError(error, 'updating milestone')
      }
    },

    async recordMilestone(userId: number, milestoneId: number) {
      if (userId === 0) {
        return {
          success: true,
          message: 'Guest accounts cannot record milestones.',
        }
      }
      if (this.hasMilestone(userId, milestoneId)) {
        return {
          success: true,
          message: 'Milestone already recorded for this user.',
        }
      }

      try {
        const response = await this.addMilestoneRecord({
          userId,
          milestoneId,
          username: useUserStore().username,
        })

        return response
      } catch (error) {
        handleError(error, 'recording milestone')
        return {
          success: false,
          message: 'An error occurred while recording milestone',
        }
      }
    },

    async addMilestoneRecord(record: Partial<MilestoneRecord>) {
      try {
        const response = await performFetch<MilestoneRecord>(
          '/api/milestones/records',
          {
            method: 'POST',
            body: JSON.stringify(record),
          },
        )

        if (response.success && response.data) {
          this.milestoneRecords.push(response.data) // Directly use `response.data` as a MilestoneRecord
          this.saveMilestoneRecordsToLocalStorage()
          return { success: true, message: 'Milestone recorded successfully.' }
        }

        // Log a warning if milestone record creation failed
        console.warn('Failed to create milestone record:', response.message)
        throw new Error(response.message || 'Unknown error occurred')
      } catch (error) {
        handleError(error, 'adding milestone record')
        return { success: false, message: 'An error occurred' }
      }
    },

    hasMilestone(userId: number, milestoneId: number) {
      const hasMilestone = this.milestoneRecords.some(
        (record) =>
          record.userId === userId && record.milestoneId === milestoneId,
      )

      return hasMilestone
    },

    getMilestoneCountForUser(userId: number) {
      const count = this.milestoneRecords.filter(
        (record) => record.userId === userId,
      ).length

      return count
    },
  },
})

export type { Milestone, MilestoneRecord }
