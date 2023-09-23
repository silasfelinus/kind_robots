// @/stores/milestoneStore.ts
import { defineStore } from 'pinia'
import { Milestone, MilestoneRecord } from '@prisma/client'
import { milestoneData } from '@/training/milestoneData'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false // Add this state variable
  }),
  actions: {
    async initializeMilestones() {
      // Check if already initialized
      if (this.isInitialized) return

      try {
        const response = await fetch('/api/milestones')
        const data = await response.json()

        if (data.success && data.milestones.length === 0) {
          // Seed initial data if the database is empty
          for (const milestone of milestoneData) {
            await this.addMilestone(milestone)
          }
        }

        if (data.success) {
          updateMilestonesFromData()
          this.milestones = data.milestones
          this.isInitialized = true // Set to true after initialization
        } else {
          console.error('Failed to initialize milestones:', data.message)
        }
      } catch (error) {
        console.error('Error initializing milestones:', error)
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
    async awardMilestone(userId: number, milestoneId: number) {
      // Check if the user has already been awarded the first milestone
      if (this.hasMilestone(userId, milestoneId)) {
        return
      }

      // Create a new milestone record for the first milestone
      const firstMilestoneRecord: MilestoneRecord = {
        userId,
        milestoneId,
        awardedAt: new Date()
      }

      // Add the new milestone record
      await this.addMilestoneRecord(firstMilestoneRecord)
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
        console.error('An error occurred while fetching milestones:', error)
      }
    },
    async addMilestone(milestone: Milestone) {
      try {
        const response = await fetch('/api/milestones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(milestone)
        })

        const data = await response.json()
        if (data.success) {
          this.fetchMilestones() // Refresh the milestones list
        } else {
          console.error('Failed to add milestone:', data.message)
        }
      } catch (error) {
        console.error('An error occurred while adding a milestone:', error)
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
