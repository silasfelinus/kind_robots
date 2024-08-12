import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from '@/training/milestoneData'
import { errorHandler } from '@/server/api/utils/error'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: ref<Milestone | null>(null),
    error: null as string | null,
  }),
  actions: {
    async initializeMilestones() {
      // Exit early if already initialized
      if (this.isInitialized) return

      try {
        // Fetch the updated milestones
        await this.fetchMilestones()
        // Fetch the milestone records
        await this.fetchMilestoneRecords()

        // Mark as initialized
        this.isInitialized = true
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        if (!handledError.success) {
          console.error(`Error initializing milestones: ${handledError.message}`)
        }
      }
    },

    async fetchMilestoneById(id: number): Promise<{ success: boolean; message: string; data?: Milestone }> {
      try {
        const response = await fetch(`/api/milestones/${id}`)
        const data = await response.json()
        if (data.success && data.milestone) {
          return {
            success: true,
            message: 'Milestone fetched successfully',
            data: data.milestone as Milestone,
          }
        } else {
          console.error(`Failed to fetch milestone by ID ${id}:`, data.message)
          return { success: false, message: data.message }
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        this.error = handledError.message
        console.error(`Error fetching milestone by ID ${id}: ${handledError.message}`)
        return { success: handledError.success, message: handledError.message }
      }
    },

    async fetchMilestoneRecords() {
      try {
        const response = await fetch('/api/milestones/records')
        const data = await response.json()
        if (data.success) {
          this.milestoneRecords = data.records
        } else {
          console.error('Failed to fetch milestone records:', data.message)
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        if (!handledError.success) {
          console.error(`Error fetching milestone records: ${handledError.message}`)
        }
      }
    },

    async updateMilestonesFromData() {
      for (const updatedMilestone of milestoneData) {
        const existingMilestone = this.milestones.find(m => m.id === updatedMilestone.id)
        if (existingMilestone) {
          Object.assign(existingMilestone, updatedMilestone)
          await this.updateMilestone(existingMilestone)
        }
      }
    },

    async fetchMilestones() {
      try {
        const response = await fetch('/api/milestones/')
        const data = await response.json()
        if (data.success) {
          this.milestones = data.milestones
        } else {
          console.error('Failed to fetch milestones:', data.message)
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        if (!handledError.success) {
          console.error(`Error fetching milestones: ${handledError.message}`)
        }
      }
    },

    async updateMilestone(milestone: Milestone) {
      try {
        if (!milestone.id) {
          console.error('Milestone ID is required for updating.')
          return
        }

        const response = await fetch(`/api/milestones/${milestone.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(milestone),
        })

        const data = await response.json()
        if (data.success) {
          this.fetchMilestones() // Refresh the milestones list
        } else {
          console.error('Failed to update milestone:', data.message)
        }
      }
      catch (error: unknown) {
        console.error('An error occurred while updating a milestone:', error)
      }
    },

    async recordMilestone(userId: number, milestoneId: number): Promise<{ success: boolean; message: string }> {
      try {
        const userStore = useUserStore()
        const username = userStore.username
        if (userId === 0) {
          return {
            success: true,
            message: 'I made the motions, but stopped before recording because it is a guest account',
          }
        }
        if (this.hasMilestone(userId, milestoneId)) {
          return { success: true, message: 'NP Boss! It was already done when I got here!' }
        }
    
        const milestoneRecord = {
          userId,
          milestoneId,
          username,
        }
    
        const response = await this.addMilestoneRecord(milestoneRecord)
    
        return response
      } catch (error: unknown) {
        const handledError = errorHandler(error)
        return { success: handledError.success, message: handledError.message }
      }
    },

    async addMilestoneRecord(record: Partial<MilestoneRecord>): Promise<{ success: boolean; message: string }> {
      try {
        const userStore = useUserStore()
        if (userStore.userId === 0) {
          return { success: false, message: 'Guest accounts cannot record milestones.' }
        }
    
        const response = await fetch('/api/milestones/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        })
    
        const data = await response.json()
        if (data.success) {
          this.milestoneRecords.push(data.record)
          return { success: true, message: 'Milestone recorded successfully.' }
        } else {
          console.error('Failed to add milestone record:', data.message)
          return { success: false, message: data.message }
        }
      } catch (error: unknown) {
        console.error('An error occurred while adding a milestone record:', error)
        return { success: false, message: 'An error occurred while adding a milestone record.' }
      }
    },

    hasMilestone(userId: number, milestoneId: number) {
      return this.milestoneRecords.some(record => record.userId === userId && record.milestoneId === milestoneId)
    },

    getMilestoneCountForUser(userId: number) {
      return this.milestoneRecords.filter(record => record.userId === userId).length
    },
  },
})

export type { Milestone, MilestoneRecord }
