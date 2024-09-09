import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: null as Milestone | null,
  }),

  actions: {
    async initializeMilestones() {
      const errorStore = useErrorStore()

      if (this.isInitialized) return

      try {
        await this.fetchMilestones()
        await this.fetchMilestoneRecords()
        this.isInitialized = true
      } catch (error) {
        const message = `Error initializing milestones: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
      }
    },

    async fetchMilestoneById(id: number) {
      const errorStore = useErrorStore()

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
          const message = `Failed to fetch milestone by ID ${id}: ${data.message}`
          errorStore.setError(ErrorType.VALIDATION_ERROR, message)
          console.error(message)
          return { success: false, message: data.message }
        }
      } catch (error) {
        const message = `Error fetching milestone by ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
        return { success: false, message }
      }
    },

    async fetchMilestoneRecords() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/milestones/records')
        const data = await response.json()

        if (data.success) {
          this.milestoneRecords = data.records
        } else {
          const message = `Failed to fetch milestone records: ${data.message}`
          errorStore.setError(ErrorType.VALIDATION_ERROR, message)
          console.error(message)
        }
      } catch (error) {
        const message = `Error fetching milestone records: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
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

    async fetchMilestones() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/milestones/')
        const data = await response.json()

        if (data.success) {
          this.milestones = data.milestones
        } else {
          const message = `Failed to fetch milestones: ${data.message}`
          errorStore.setError(ErrorType.VALIDATION_ERROR, message)
          console.error(message)
        }
      } catch (error) {
        const message = `Error fetching milestones: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
      }
    },

    async updateMilestone(milestone: Milestone) {
      const errorStore = useErrorStore()

      if (!milestone.id) {
        const message = 'Milestone ID is required for updating.'
        console.error(message)
        return
      }

      try {
        const response = await fetch(`/api/milestones/${milestone.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(milestone),
        })

        const data = await response.json()
        if (data.success) {
          await this.fetchMilestones() // Refresh the milestones list
        } else {
          const message = `Failed to update milestone: ${data.message}`
          errorStore.setError(ErrorType.VALIDATION_ERROR, message)
          console.error(message)
        }
      } catch (error) {
        const message = `Error updating milestone: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
      }
    },

    async recordMilestone(userId: number, milestoneId: number) {
      const errorStore = useErrorStore()
      const userStore = useUserStore()
      const username = userStore.username

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

      const milestoneRecord = {
        userId,
        milestoneId,
        username,
      }

      try {
        const response = await this.addMilestoneRecord(milestoneRecord)
        return response
      } catch (error) {
        const message = `Error recording milestone: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
        return {
          success: false,
          message,
        }
      }
    },

    async addMilestoneRecord(record: Partial<MilestoneRecord>) {
      const errorStore = useErrorStore()
      const userStore = useUserStore()

      if (userStore.userId === 0) {
        return {
          success: false,
          message: 'Guest accounts cannot record milestones.',
        }
      }

      try {
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
          const message = `Failed to add milestone record: ${data.message}`
          errorStore.setError(ErrorType.VALIDATION_ERROR, message)
          console.error(message)
          return { success: false, message }
        }
      } catch (error) {
        const message = `Error adding milestone record: ${error instanceof Error ? error.message : 'Unknown error'}`
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        console.error(message)
        return { success: false, message }
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
