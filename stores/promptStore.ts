// ~/store/prompts.ts
import { defineStore } from 'pinia'
import { Prompt as PromptRecord } from '@prisma/client'
import axios from 'axios'

export type Prompt = PromptRecord

interface PromptState {
  prompts: Prompt[]
  currentPrompt: Prompt | null
  totalPrompts: number
  errors: string[]
}

export const usePromptStore = defineStore({
  id: 'prompts',
  state: (): PromptState => ({
    prompts: [],
    currentPrompt: null,
    totalPrompts: 0,
    errors: []
  }),
  actions: {
    async getPrompts(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/prompts?page=${page}&pageSize=${pageSize}`)
      this.prompts = data
    },
    async getPromptById(id: number) {
      const { data } = await axios.get(`/api/prompts/${id}`)
      this.currentPrompt = data
    },
    async addPrompts(promptData: Partial<Prompt>[]) {
      const { data } = await axios.post(`/api/prompts`, promptData)
      this.prompts = data.prompts
      this.errors = data.errors

      // Update the total prompts count after adding new prompts
      await this.countPrompts()
    },
    async updatePrompt(id: number, data: Partial<Prompt>) {
      const { data: updatedPrompt } = await axios.put(`/api/prompts/${id}`, data)
      this.currentPrompt = updatedPrompt

      // Fetch the updated list of prompts after updating a prompt
      await this.getPrompts()
    },
    async deletePrompt(id: number) {
      await axios.delete(`/api/prompts/${id}`)

      // Fetch the updated list of prompts and total prompts count after deleting a prompt
      await this.getPrompts()
      await this.countPrompts()
    },
    async randomPrompt() {
      const { data } = await axios.get(`/api/prompts/random`)
      this.currentPrompt = data
    },
    async countPrompts() {
      const { data } = await axios.get(`/api/prompts/count`)
      this.totalPrompts = data
    },
    async loadStore() {
      try {
        await this.getPrompts()
        return `Loaded ${this.prompts.length} prompts`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})
