// ~/stores/modelStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Model as ModelRecord } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { modelData } from './seeds/seedModels'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Model = ModelRecord

interface ModelStoreState {
  models: Model[]
  currentModel: Model | null
  totalModels: number
  errors: string[]
  page: number
  pageSize: number
}

export const useModelStore = defineStore({
  id: 'models',
  state: (): ModelStoreState => ({
    models: [],
    currentModel: null,
    totalModels: 0,
    errors: [],
    page: 1,
    pageSize: 100
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading model store...')
      try {
        // Get the current count of models
        await this.countModels()
        if (this.totalModels === 0) {
          await this.seedModels()
        }

        // Load other store data
        await this.getModels(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.models.length} models`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing model store: ' + error)
      }
    },
    async getModels(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching models...')
      try {
        const { data } = await axios.get(`/api/models?page=${page}&pageSize=${pageSize}`)
        this.models = [...this.models, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.models.length} models`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch models: ' + error)
      }
    },
    async getModelById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching model with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/models/${id}`)
        this.currentModel = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched model with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch model by id: ' + error)
      }
    },
    async addModels(modelData: Partial<Model>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new models...')
      try {
        const { data } = await axios.post(`/api/models`, modelData)
        this.models = [...this.models, ...data.models]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.models.length} models`)
        // Update the total models count after adding new models
        await this.countModels()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add models: ' + error)
      }
    },
    async updateModel(id: number, data: Partial<Model>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating model with id ${id}...`)
      try {
        const { data: updatedModel } = await axios.put(`/api/models/${id}`, data)
        this.currentModel = updatedModel
        statusStore.setStatus(StatusType.SUCCESS, `Updated model with id ${id}`)
        // Fetch the updated list of models after updating a model
        await this.getModels()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update model: ' + error)
      }
    },
    async deleteModel(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting model with id ${id}...`)
      try {
        await axios.delete(`/api/models/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted model with id ${id}`)
        // Fetch the updated list of models and total models count after deleting a model
        await this.getModels()
        await this.countModels()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete model: ' + error)
      }
    },
    async randomModel(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random model...')
      try {
        const { data } = await axios.get(`/api/models/random`)
        this.currentModel = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random model')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random model: ' + error)
      }
    },
    async countModels(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting models...')
      try {
        const { data } = await axios.get(`/api/models/count`)
        this.totalModels = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted a total of ${this.totalModels} models`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count models: ' + error)
      }
    },
    async seedModels(): Promise<void> {
      // If there are no models, load them
      statusStore.setStatus(StatusType.INFO, 'Seeding models...')
      try {
        await this.addModels(modelData)
        statusStore.setStatus(StatusType.SUCCESS, 'Models successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading models: ' + error)
      }

      // Fetch the updated list of models and total models count after seeding
      await this.getModels()
      await this.countModels()
    }
  }
})
