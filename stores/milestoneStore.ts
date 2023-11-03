// @/stores/milestoneStore.ts
import { defineStore } from 'pinia'
import { type Milestone, type MilestoneRecord } from '@prisma/client'
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
    error: null as string | null
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
      } catch (error) {
        const { success, message } = errorHandler({ error })
        if (!success) {
          console.error(`Error initializing milestones: ${message}`)
        }
      }
    },
    async fetchMilestoneById(
      id: number
    ): Promise<{ success: boolean; message: string; data?: Milestone }> {
      try {
        const response = await fetch(`/api/milestones/${id}`)
        const data = await response.json()
        if (data.success && data.milestone) {
          return {
            success: true,
            message: 'Milestone fetched successfully',
            data: data.milestone as Milestone
          }
        } else {
          console.error(`Failed to fetch milestone by ID ${id}:`, data.message)
          return { success: false, message: data.message }
        }
      } catch (error: any) {
        const { success, message } = errorHandler({ error })
        this.error = message
        console.error(`Error fetching milestone by ID ${id}: ${message}`)
        return { success, message }
      }
    },

    // Add this action to your existing milestoneStore
    async fetchMilestoneRecords() {
      try {
        const response = await fetch('/api/milestones/records')
        const data = await response.json()
        if (data.success) {
          this.milestoneRecords = data.records
        } else {
          console.error('Failed to fetch milestone records:', data.message)
        }
      } catch (error) {
        const { success, message } = errorHandler({ error })
        if (!success) {
          console.error(`Error fetching milestone records: ${message}`)
        }
      }
    },
    async updateMilestonesFromData() {
      // Loop through milestoneData and update existing milestones
      for (const updatedMilestone of milestoneData) {
        const existingMilestone = this.milestones.find((m) => m.id === updatedMilestone.id)
        if (existingMilestone) {
          // Update the existing milestone with the new data
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
      } catch (error) {
        const { success, message } = errorHandler({ error })
        if (!success) {
          console.error(`Error fetching milestones: ${message}`)
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
          method: 'PATCH', // Refactored to use centralized error handler
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(milestone)
        })

        const data = await response.json()
        if (data.success) {
          this.fetchMilestones() // Refresh the milestones list
        } else {
          console.error('Failed to update milestone:', data.message)
        }
      } catch (error) {
        console.error('An error occurred while updating a milestone:', error)
      }
    },
    async recordMilestone(
      userId: number,
      milestoneId: number
    ): Promise<{ success: boolean; message: string }> {
      try {
        const userStore = useUserStore()
        const username = userStore.username
        if (userId === 0) {
          return {
            success: true,
            message:
              'I made the motions, but stopped before recording because it is a guest account'
          }
        }
        if (this.hasMilestone(userId, milestoneId)) {
          return { success: true, message: 'NP Boss! It was already done when I got here!' }
        }

        const milestoneRecord = {
          userId,
          milestoneId,
          username
        }

        const response = await this.addMilestoneRecord(milestoneRecord)

        return { success: true, message: 'Milestone successfully awarded.' }
      } catch (error: any) {
        const { message } = errorHandler(error)
        return { success: false, message }
      }
    },

    async addMilestoneRecord(record: Partial<MilestoneRecord>) {
      try {
        const userStore = useUserStore()
        if (userStore.userId === 0) return
        const response = await fetch('/api/milestones/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        })
        const data = await response.json()
        if (data.success) {
          this.milestoneRecords.push(data.record)
        } else {
          console.error('Failed to add milestone record:', data.message)
        }
      } catch (error) {
        console.error('An error occurred while adding a milestone record:', error)
      }
    },
    hasMilestone(userId: number, milestoneId: number) {
      return this.milestoneRecords.some(
        (record) => record.userId === userId && record.milestoneId === milestoneId
      )
    },
    // New function to get the count of milestones for a user
    getMilestoneCountForUser(userId: number) {
      return this.milestoneRecords.filter((record) => record.userId === userId).length
    }
  }
})

export type { Milestone, MilestoneRecord }
