// @/stores/milestoneStore.ts
import { defineStore } from 'pinia'
import { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from '@/training/milestoneData'
import { errorHandler } from '@/server/api/utils/error'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false // Add this state variable
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
    async fetchMilestoneById(id: number) {
      try {
        const response = await fetch(`/api/milestones/${id}`)
        const data = await response.json()
        if (data.success && data.milestone) {
          return data.milestone
        } else {
          console.error(`Failed to fetch milestone by ID ${id}:`, data.message)
          return { success: false, message: data.message }
        }
      } catch (error) {
        const { success, message } = errorHandler({ error })
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
    // Refactored to use centralized error handler
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
          method: 'PATCH',
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
    async awardMilestone(
      userId: number,
      milestoneId: number
    ): Promise<{ success: boolean; message: string }> {
      try {
        if (this.hasMilestone(userId, milestoneId)) {
          return { success: true, message: 'Milestone already recorded.' }
        }

        const milestoneRecord = {
          userId,
          milestoneId
        }

        const response = await this.addMilestoneRecord(milestoneRecord)

        const userStore = useUserStore()
        userStore.addMilestone(milestoneId)

        return { success: true, message: 'Milestone successfully awarded.', response }
      } catch (error: any) {
        const { message } = errorHandler(error)
        return { success: false, message }
      }
    },

    async addMilestoneRecord(record: MilestoneRecord) {
      try {
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
    }
  }
})

export type { Milestone }
