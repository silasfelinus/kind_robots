import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: ref<Milestone | null>(null),
  }),
  actions: {
    async initializeMilestones() {
      if (this.isInitialized) return

      const errorStore = useErrorStore() // Use errorStore

      try {
        await this.fetchMilestones()
        await this.fetchMilestoneRecords()
        this.isInitialized = true
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error initializing milestones')
        console.error(`Error initializing milestones: ${errorStore.getErrors().slice(-1)[0]?.message}`)
      }
    },

    async fetchMilestoneById(id: number): Promise<{ success: boolean; message: string; data?: Milestone }> {
      const errorStore = useErrorStore() // Use errorStore

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
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch milestone by ID ${id}: ${data.message}`)
          console.error(`Failed to fetch milestone by ID ${id}: ${data.message}`)
          return { success: false, message: data.message }
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error fetching milestone by ID ${id}`)
        console.error(`Error fetching milestone by ID ${id}: ${errorStore.getErrors().slice(-1)[0]?.message}`)
        return { success: false, message: errorStore.getErrors().slice(-1)[0]?.message }
      }
    },

    async fetchMilestoneRecords() {
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch('/api/milestones/records')
        const data = await response.json()
        if (data.success) {
          this.milestoneRecords = data.records
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch milestone records: ${data.message}`)
          console.error('Failed to fetch milestone records:', data.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error fetching milestone records')
        console.error(`Error fetching milestone records: ${errorStore.getErrors().slice(-1)[0]?.message}`)
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
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch('/api/milestones/')
        const data = await response.json()
        if (data.success) {
          this.milestones = data.milestones
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch milestones: ${data.message}`)
          console.error('Failed to fetch milestones:', data.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error fetching milestones')
        console.error(`Error fetching milestones: ${errorStore.getErrors().slice(-1)[0]?.message}`)
      }
    },

    async updateMilestone(milestone: Milestone) {
      if (!milestone.id) {
        console.error('Milestone ID is required for updating.')
        return
      }

      const errorStore = useErrorStore() // Use errorStore

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
          this.fetchMilestones() // Refresh the milestones list
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to update milestone: ${data.message}`)
          console.error('Failed to update milestone:', data.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error updating milestone')
        console.error('An error occurred while updating a milestone:', errorStore.getErrors().slice(-1)[0]?.message)
      }
    },

    async recordMilestone(userId: number, milestoneId: number): Promise<{ success: boolean; message: string }> {
      const errorStore = useErrorStore() // Use errorStore
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

      try {
        const response = await this.addMilestoneRecord(milestoneRecord)
        return response
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error recording milestone')
        console.error('Error recording milestone:', errorStore.getErrors().slice(-1)[0]?.message)
        return { success: false, message: errorStore.getErrors().slice(-1)[0]?.message }
      }
    },

    async addMilestoneRecord(record: Partial<MilestoneRecord>): Promise<{ success: boolean; message: string }> {
      const errorStore = useErrorStore() // Use errorStore
      const userStore = useUserStore()

      if (userStore.userId === 0) {
        return { success: false, message: 'Guest accounts cannot record milestones.' }
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
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to add milestone record: ${data.message}`)
          console.error('Failed to add milestone record:', data.message)
          return { success: false, message: data.message }
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error adding milestone record')
        console.error('An error occurred while adding a milestone record:', errorStore.getErrors().slice(-1)[0]?.message)
        return { success: false, message: errorStore.getErrors().slice(-1)[0]?.message }
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
