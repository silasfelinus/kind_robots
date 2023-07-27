// ~/stores/promptStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Prompt as PromptRecord } from '@prisma/client'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'
import { promptData } from './seeds/seedPrompts'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Prompt = PromptRecord

interface PromptStoreState {
  prompts: Prompt[]
  currentPrompt: Prompt | null
  totalPrompts: number
  errors: string[]
  page: number
  pageSize: number
}

export const usePromptStore = defineStore({
  id: 'prompts',
  state: (): PromptStoreState => ({
    prompts: [],
    currentPrompt: null,
    totalPrompts: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading prompt store...')
      try {
        await this.countPrompts()
        if (this.totalPrompts === 0) {
          await this.seedPrompts()
        }

        await this.getPrompts(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.prompts.length} prompts`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing prompt store: ' + error)
      }
    },
    async getPrompts(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching prompts...')
      try {
        const { data } = await axios.get(`/api/prompts?page=${page}&pageSize=${pageSize}`)
        this.prompts = [...this.prompts, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.prompts.length} prompts`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch prompts: ' + error)
      }
    },
    async getPromptById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching prompt with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/prompts/${id}`)
        this.currentPrompt = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched prompt with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch prompt by id: ' + error)
      }
    },
    async addPrompts(promptData: Partial<Prompt>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new prompts...')
      try {
        const { data } = await axios.post(`/api/prompts`, promptData)
        this.prompts = [...this.prompts, ...data.prompts]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.prompts.length} prompts`)
        await this.countPrompts()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add prompts: ' + error)
      }
    },
    async updatePrompt(id: number, data: Partial<Prompt>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating prompt with id ${id}...`)
      try {
        const { data: updatedPrompt } = await axios.put(`/api/prompts/${id}`, data)
        this.currentPrompt = updatedPrompt
        statusStore.setStatus(StatusType.SUCCESS, `Updated prompt with id ${id}`)
        await this.getPrompts()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update prompt: ' + error)
      }
    },
    async deletePrompt(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting prompt with id ${id}...`)
      try {
        await axios.delete(`/api/prompts/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted prompt with id ${id}`)
        await this.getPrompts()
        await this.countPrompts()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete prompt: ' + error)
      }
    },
    async randomPrompt(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random prompt...')
      try {
        const { data } = await axios.get(`/api/prompts/random`)
        this.currentPrompt = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random prompt')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random prompt: ' + error)
      }
    },
    async countPrompts(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting prompts...')
      try {
        const { data } = await axios.get(`/api/prompts/count`)
        this.totalPrompts = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted a total of ${this.totalPrompts} prompts`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count prompts: ' + error)
      }
    },
    async seedPrompts(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding prompts...')
      try {
        await this.addPrompts(promptData)
        statusStore.setStatus(StatusType.SUCCESS, 'Prompts successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading prompts: ' + error)
      }

      await this.getPrompts()
      await this.countPrompts()
    }
  }
})
