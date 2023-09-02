// ~/store/trainingLineStore.ts
import { defineStore } from 'pinia'

interface TrainingLine {
  id: number
  role: string
  content: string
}

interface TrainingLineState {
  trainingLines: TrainingLine[]
  currentTrainingLine: TrainingLine | null
  error: string | null
}

export const useTrainingLineStore = defineStore({
  id: 'trainingLineStore',

  state: (): TrainingLineState => ({
    trainingLines: [],
    currentTrainingLine: null,
    error: null
  }),

  getters: {
    getCurrentRole(): string | null {
      return this.currentTrainingLine?.role || null
    },
    getCurrentContent(): string | null {
      return this.currentTrainingLine?.content || null
    }
  },

  actions: {
    async fetchTrainingLines() {
      try {
        const response = await fetch('/api/training/lines')
        if (!response.ok) {
          throw new Error(`Failed to fetch training lines: ${response.statusText}`)
        }
        const data: TrainingLine[] = await response.json()
        this.trainingLines = data
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    setCurrentTrainingLineById(id: number) {
      const selectedLine = this.trainingLines.find((line) => line.id === id)
      if (selectedLine) {
        this.currentTrainingLine = selectedLine
      } else {
        this.error = `TrainingLine with ID ${id} not found.`
      }
    },

    async createTrainingLine(newLine: Partial<TrainingLine>) {
      try {
        const response = await fetch('/api/training/lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLine)
        })

        if (!response.ok) {
          this.error = `Failed to create training line: ${response.statusText}`
          return
        }

        const createdLine: TrainingLine = await response.json()
        this.trainingLines.push(createdLine)
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    async deleteTrainingLineById(id: number) {
      try {
        const response = await fetch(`/api/training/lines/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          this.error = `Failed to delete training line: ${response.statusText}`
          return
        }

        this.trainingLines = this.trainingLines.filter((line) => line.id !== id)
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    async updateTrainingLine(id: number, updatedLine: Partial<TrainingLine>) {
      try {
        const response = await fetch(`/api/training/lines/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLine)
        })

        if (!response.ok) {
          this.error = `Failed to update training line: ${response.statusText}`
          return
        }

        const updated: TrainingLine = await response.json()
        const index = this.trainingLines.findIndex((line) => line.id === id)
        if (index !== -1) {
          this.trainingLines[index] = updated
        }
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    }
  }
})
