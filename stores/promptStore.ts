// ~/stores/promptStore.ts
import { defineStore } from 'pinia'
import {
  Prompt as PromptRecord,
  fetchPrompts,
  fetchPromptById,
  addPrompts,
  updatePrompt,
  deletePrompt
} from '../server/api/prompts'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Prompt = PromptRecord

interface PromptState {
  prompts: Prompt[]
  selectedPrompt: Prompt | null
}

export const usePromptStore = defineStore({
  id: 'prompts',
  state: (): PromptState => ({
    prompts: [],
    selectedPrompt: null
  }),
  getters: {
    getSelectedPrompt(): Prompt | null {
      return this.selectedPrompt
    }
  },
  actions: {
    async fetchPrompts(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.prompts = await fetchPrompts(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Prompts fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch prompts.'
      )
    },
    async fetchPromptById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const prompt = await fetchPromptById(id)
          if (prompt) {
            const promptIndex = this.prompts.findIndex((existingPrompt) => existingPrompt.id === id)
            if (promptIndex !== -1) {
              this.prompts.splice(promptIndex, 1, prompt)
            } else {
              this.prompts.push(prompt)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch prompt by id.'
      )
    },
    async addPrompts(promptData: Partial<Prompt>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { prompts: newPrompts } = await addPrompts(promptData)
          this.prompts.push(...newPrompts)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newPrompts.length} prompt(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add prompts.'
      )
    },
    async updatePrompt(id: number, data: Partial<Prompt>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedPrompt = await updatePrompt(id, data)
          if (updatedPrompt) {
            const promptIndex = this.prompts.findIndex((prompt) => prompt.id === id)
            if (promptIndex !== -1) {
              this.prompts.splice(promptIndex, 1, updatedPrompt)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update prompt.'
      )
    },
    async deletePrompt(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const deleteSuccess = await deletePrompt(id)
          if (deleteSuccess) {
            const promptIndex = this.prompts.findIndex((prompt) => prompt.id === id)
            if (promptIndex !== -1) {
              this.prompts.splice(promptIndex, 1)
              statusStore.setStatus(StatusType.SUCCESS, 'Prompt deleted successfully.')
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete prompt.'
      )
    },
    selectPrompt(promptId: number): void {
      const prompt = this.prompts.find((prompt) => prompt.id === promptId)
      if (prompt) {
        this.selectedPrompt = prompt
      } else {
        throw new Error('Cannot select prompt that does not exist')
      }
    },
    deselectPrompt(): void {
      this.selectedPrompt = null
    }
  }
})
