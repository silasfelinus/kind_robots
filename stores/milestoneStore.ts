import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { performFetch, handleError } from './utils'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: null as Milestone | null,
    highClickScores: [] as number[],
    highMatchScores: [] as number[],
  }),

  actions: {
    async initializeMilestones() {
      if (this.isInitialized) return

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

      if (!this.milestones.length) await this.fetchMilestones()
      if (!this.milestoneRecords.length) await this.fetchMilestoneRecords()

      this.isInitialized = true
    },

    async fetchHighClickScores() {
      try {
        const response = await performFetch<{ milestones: number[] }>(
          '/api/milestones/highClickScores',
        )
        this.highClickScores = response.data?.milestones || []
      } catch (error) {
        handleError(error, 'fetching high click scores')
      }
    },

    async fetchHighMatchScores() {
      try {
        const response = await performFetch<{ milestones: number[] }>(
          '/api/milestones/highMatchScores',
        )
        this.highMatchScores = response.data?.milestones || []
      } catch (error) {
        handleError(error, 'fetching high match scores')
      }
    },

    // Inside milestoneStore
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
        return response.success && response.data
          ? {
              success: true,
              message: 'Milestone fetched successfully',
              data: response.data.milestone,
            }
          : {
              success: false,
              message: response.message || 'Failed to fetch milestone by ID',
            }
      } catch (error) {
        handleError(error, `fetching milestone by ID ${id}`)
        return { success: false, message: 'An error occurred' }
      }
    },

    async fetchMilestones() {
      try {
        const response = await performFetch<{ milestones: Milestone[] }>(
          '/api/milestones/',
        )
        this.milestones = response.data?.milestones || []
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
        this.milestoneRecords = response.data?.records || []
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
        if (response.success) await this.fetchMilestones()
      } catch (error) {
        handleError(error, 'updating milestone')
      }
    },

    async recordMilestone(userId: number, milestoneId: number) {
      if (userId === 0)
        return {
          success: true,
          message: 'Guest accounts cannot record milestones.',
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
        const response = await performFetch<{ record: MilestoneRecord }>(
          '/api/milestones/records',
          {
            method: 'POST',
            body: JSON.stringify(record),
          },
        )
        if (response.success && response.data) {
          this.milestoneRecords.push(response.data.record)
          this.saveMilestoneRecordsToLocalStorage()
          return { success: true, message: 'Milestone recorded successfully.' }
        }
        throw new Error(response.message)
      } catch (error) {
        handleError(error, 'adding milestone record')
        return { success: false, message: 'An error occurred' }
      }
    },

    hasMilestone(userId: number, milestoneId: number) {
      return this.milestoneRecords.some(
        (record) =>
          record.userId === userId && record.milestoneId === milestoneId,
      )
    },

    getMilestoneCountForUser(userId: number) {
      return this.milestoneRecords.filter((record) => record.userId === userId)
        .length
    },
  },
})

export type { Milestone, MilestoneRecord }
