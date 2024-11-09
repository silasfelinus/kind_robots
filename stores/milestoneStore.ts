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

  getters: {
    milestoneCountForUser: (state) => {
      const userId = useUserStore().userId
      const count = state.milestoneRecords.filter(
        (record) => record.userId === userId,
      ).length
      console.log(`Milestone count for user ${userId}:`, count)
      return count
    },

    milestoneSummary: (state) => {
      const summary = state.milestones.map((milestone) => ({
        id: milestone.id,
        label: milestone.label,
        isActive: milestone.isActive,
      }))
      console.log('Milestone Summary:', summary)
      return summary
    },

    activeMilestones: (state) => {
      const activeMilestones = state.milestones.filter((milestone) => milestone.isActive)
      console.log('Active Milestones:', activeMilestones)
      return activeMilestones
    },
  },

  actions: {
    async initializeMilestones() {
      console.log('Initializing milestones...')
      if (this.isInitialized) {
        console.log('Milestones already initialized')
        return
      }

      if (typeof window !== 'undefined') {
        const storedMilestones = localStorage.getItem('milestones')
        const storedRecords = localStorage.getItem('milestoneRecords')

        if (storedMilestones) {
          this.milestones = JSON.parse(storedMilestones)
          console.log('Loaded milestones from localStorage:', this.milestones)
        }

        if (storedRecords) {
          this.milestoneRecords = JSON.parse(storedRecords)
          console.log('Loaded milestone records from localStorage:', this.milestoneRecords)
        }
      }

      if (!this.milestones.length) {
        console.log('Fetching milestones from API...')
        await this.fetchMilestones()
      }
      if (!this.milestoneRecords.length) {
        console.log('Fetching milestone records from API...')
        await this.fetchMilestoneRecords()
      }

      this.isInitialized = true
      console.log('Milestones initialization complete')
    },

    async fetchHighClickScores() {
      console.log('Fetching high click scores...')
      try {
        const response = await performFetch<{ milestones: number[] }>(
          '/api/milestones/highClickScores',
        )
        this.highClickScores = response.data || []
        console.log('Fetched high click scores:', this.highClickScores)
      } catch (error) {
        handleError(error, 'fetching high click scores')
      }
    },

    async fetchHighMatchScores() {
      console.log('Fetching high match scores...')
      try {
        const response = await performFetch<{ milestones: number[] }>(
          '/api/milestones/highMatchScores',
        )
        this.highMatchScores = response.data || []
        console.log('Fetched high match scores:', this.highMatchScores)
      } catch (error) {
        handleError(error, 'fetching high match scores')
      }
    },

    async updateClickRecord(newScore: number): Promise<string> {
      console.log('Updating click record with new score:', newScore)
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
          console.log('Click record updated successfully')
          return 'Updated'
        } else {
          console.log('Failed to update click record')
          return 'Failed'
        }
      } catch (error: unknown) {
        handleError(error, 'updating click record')
        return 'Failed'
      }
    },

    async updateMatchRecord(newScore: number) {
      console.log('Updating match record with new score:', newScore)
      try {
        const userId = useUserStore().userId
        if (!userId) throw new Error('User ID is not available')

        await performFetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          body: JSON.stringify({ newScore, userId }),
        })
        console.log('Match record updated successfully')
        await this.fetchHighMatchScores()
      } catch (error) {
        handleError(error, 'updating match record')
      }
    },

    async fetchMilestoneById(id: number) {
      console.log(`Fetching milestone by ID: ${id}`)
      try {
        const response = await performFetch<{ milestone: Milestone }>(
          `/api/milestones/${id}`,
        )
        if (response.success && response.data) {
          console.log('Fetched milestone:', response.data.milestone)
          return {
            success: true,
            message: 'Milestone fetched successfully',
            data: response.data,
          }
        } else {
          console.log('Failed to fetch milestone by ID')
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
      console.log('Fetching all milestones...')
      try {
        const response = await performFetch<{ milestones: Milestone[] }>(
          '/api/milestones/',
        )
        this.milestones = response.data || []
        console.log('Fetched milestones:', this.milestones)
        this.saveMilestonesToLocalStorage()
      } catch (error) {
        handleError(error, 'fetching milestones')
      }
    },

    async fetchMilestoneRecords() {
      console.log('Fetching all milestone records...')
      try {
        const response = await performFetch<{ records: MilestoneRecord[] }>(
          '/api/milestones/records',
        )
        this.milestoneRecords = response.data || []
        console.log('Fetched milestone records:', this.milestoneRecords)
        this.saveMilestoneRecordsToLocalStorage()
      } catch (error) {
        handleError(error, 'fetching milestone records')
      }
    },

    saveMilestonesToLocalStorage() {
      if (typeof window !== 'undefined') {
        console.log('Saving milestones to localStorage')
        localStorage.setItem('milestones', JSON.stringify(this.milestones))
      }
    },

    saveMilestoneRecordsToLocalStorage() {
      if (typeof window !== 'undefined') {
        console.log('Saving milestone records to localStorage')
        localStorage.setItem(
          'milestoneRecords',
          JSON.stringify(this.milestoneRecords),
        )
      }
    },

    async updateMilestonesFromData() {
      console.log('Updating milestones from data...')
      for (const updatedMilestone of milestoneData) {
        const existingMilestone = this.milestones.find(
          (m) => m.id === updatedMilestone.id,
        )
        if (existingMilestone) {
          Object.assign(existingMilestone, updatedMilestone)
          console.log('Updating milestone:', existingMilestone)
          await this.updateMilestone(existingMilestone)
        }
      }
    },

    async updateMilestone(milestone: Milestone) {
      console.log('Updating milestone:', milestone)
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
          console.log('Milestone updated successfully')
          await this.fetchMilestones()
        }
      } catch (error) {
        handleError(error, 'updating milestone')
      }
    },

    async recordMilestone(userId: number, milestoneId: number) {
      console.log(`Recording milestone for user ${userId} with milestone ID ${milestoneId}`)
      if (userId === 0) {
        console.log('Guest accounts cannot record milestones')
        return {
          success: true,
          message: 'Guest accounts cannot record milestones.',
        }
      }
      if (this.hasMilestone(userId, milestoneId)) {
        console.log('Milestone already recorded for this user.')
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
        console.log('Milestone recorded successfully')
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
      console.log('Adding milestone record:', record)
      try {
        const response = await performFetch<{ record: MilestoneRecord }>(
          '/api/milestones/records',
          {
            method: 'POST',
            body: JSON.stringify(record),
          },
        )
        if (response.success && response.data) {
          this.milestoneRecords.push(response.data)
          this.saveMilestoneRecordsToLocalStorage()
          console.log('Milestone record added successfully')
          return { success: true, message: 'Milestone recorded successfully.' }
        }
        throw new Error(response.message)
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
      console.log(`User ${userId} has milestone ${milestoneId}:`, hasMilestone)
      return hasMilestone
    },

    getMilestoneCountForUser(userId: number) {
      const count = this.milestoneRecords.filter((record) => record.userId === userId).length
      console.log(`Milestone count for user ${userId}:`, count)
      return count
    },
  },
})

export type { Milestone, MilestoneRecord }
