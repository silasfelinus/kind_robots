import { defineStore } from 'pinia'
import type { Milestone, MilestoneRecord } from '@prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { useErrorStore, ErrorType } from './errorStore'

export const useMilestoneStore = defineStore({
  id: 'milestoneStore',
  state: () => ({
    milestones: [] as Milestone[],
    milestoneRecords: [] as MilestoneRecord[],
    isInitialized: false,
    currentMilestone: null as Milestone | null,
  }),

  actions: {
    // Initialize milestones with localStorage fallback
    async initializeMilestones() {
      const errorStore = useErrorStore()

      if (this.isInitialized) return

      console.log('Initializing milestones...')
      
      // Load milestones from localStorage (only on client-side)
      if (typeof window !== 'undefined') {
        const storedMilestones = localStorage.getItem('milestones')
        const storedRecords = localStorage.getItem('milestoneRecords')

        if (storedMilestones) {
          this.milestones = JSON.parse(storedMilestones)
          console.log('Loaded milestones from localStorage')
        }

        if (storedRecords) {
          this.milestoneRecords = JSON.parse(storedRecords)
          console.log('Loaded milestone records from localStorage')
        }
      }

      // Fetch from database if not loaded or empty in localStorage
      if (this.milestones.length === 0) {
        try {
          await this.fetchMilestones()
        } catch (error) {
          errorStore.setError(ErrorType.NETWORK_ERROR, `Failed to fetch milestones from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Fetch records
      if (this.milestoneRecords.length === 0) {
        try {
          await this.fetchMilestoneRecords()
        } catch (error) {
          errorStore.setError(ErrorType.NETWORK_ERROR, `Failed to fetch milestone records from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      this.isInitialized = true
      console.log('Milestone initialization complete')
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

    // Fetch milestones from the API
    async fetchMilestones() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/milestones/')
        const data = await response.json()

        if (data.success) {
          this.milestones = data.milestones
          this.saveMilestonesToLocalStorage()
          console.log('Fetched milestones from the server')
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch milestones: ${data.message}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error fetching milestones: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Fetch milestone records from the API
    async fetchMilestoneRecords() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/milestones/records')
        const data = await response.json()

        if (data.success) {
          this.milestoneRecords = data.records
          this.saveMilestoneRecordsToLocalStorage()
          console.log('Fetched milestone records from the server')
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch milestone records: ${data.message}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error fetching milestone records: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Save milestones to localStorage (only if in the client)
    saveMilestonesToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('milestones', JSON.stringify(this.milestones))
        console.log('Saved milestones to localStorage')
      }
    },

    // Save milestone records to localStorage
    saveMilestoneRecordsToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('milestoneRecords', JSON.stringify(this.milestoneRecords))
        console.log('Saved milestone records to localStorage')
      }
    },

    // Update milestones from static data
    async updateMilestonesFromData() {
      for (const updatedMilestone of milestoneData) {
        const existingMilestone = this.milestones.find((m) => m.id === updatedMilestone.id)
        if (existingMilestone) {
          Object.assign(existingMilestone, updatedMilestone)
          await this.updateMilestone(existingMilestone)
        }
      }
    },

    // Update a specific milestone via API
    async updateMilestone(milestone: Milestone) {
      const errorStore = useErrorStore()

      if (!milestone.id) {
        console.error('Milestone ID is required for updating.')
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
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to update milestone: ${data.message}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error updating milestone: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Record a milestone for a specific user
    async recordMilestone(userId: number, milestoneId: number) {
      const errorStore = useErrorStore()
      const userStore = useUserStore()
      const username = userStore.username

      if (userId === 0) {
        return { success: true, message: 'Guest accounts cannot record milestones.' }
      }

      if (this.hasMilestone(userId, milestoneId)) {
        return { success: true, message: 'Milestone already recorded for this user.' }
      }

      const milestoneRecord = { userId, milestoneId, username }

      try {
        const response = await this.addMilestoneRecord(milestoneRecord)
        return response
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error recording milestone: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return { success: false, message: `Error recording milestone: ${error}` }
      }
    },

    // Add a milestone record to the database
    async addMilestoneRecord(record: Partial<MilestoneRecord>) {
      const errorStore = useErrorStore()

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
          this.saveMilestoneRecordsToLocalStorage()
          return { success: true, message: 'Milestone recorded successfully.' }
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to add milestone record: ${data.message}`)
          return { success: false, message: data.message }
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error adding milestone record: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return { success: false, message: `Error adding milestone record: ${error}` }
      }
    },
    

    // Check if a user has a specific milestone
    hasMilestone(userId: number, milestoneId: number) {
      return this.milestoneRecords.some(record => record.userId === userId && record.milestoneId === milestoneId)
    },

    // Get the milestone count for a user
    getMilestoneCountForUser(userId: number) {
      return this.milestoneRecords.filter(record => record.userId === userId).length
    },
  },
})

export type { Milestone, MilestoneRecord }
