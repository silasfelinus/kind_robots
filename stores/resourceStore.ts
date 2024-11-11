import { defineStore } from 'pinia'
import type { Resource } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { resourceData } from './../stores/seeds/seedResources'

interface ResourceStoreState {
  resources: Resource[]
  currentResource: Resource | null
  errors: string[]
  isInitialized: boolean
}

export const useResourceStore = defineStore({
  id: 'resources',
  state: (): ResourceStoreState => ({
    resources: [],
    currentResource: null,
    errors: [],
    isInitialized: false,
  }),

  actions: {
    async loadStore(): Promise<void> {
      return handleError(async () => {
        if (!this.isInitialized) {
          await this.getResources()
          if (this.resources.length === 0) {
            await this.seedResources()
            await this.getResources()
          }
          this.isInitialized = true
        }
      }, 'initializing resource store')
    },

    async getResources(): Promise<void> {
      return handleError(async () => {
        const response = await performFetch<Resource[]>(
          '/api/resources',
        )
        if (response.success) {
          this.resources = response.data || []
        } else {
          throw new Error(response.message || 'Failed to fetch resources')
        }
      }, 'fetching resources')
    },

    async seedResources(): Promise<void> {
      return handleError(async () => {
        await this.addResources(resourceData)
        await this.getResources() // Refresh after seeding
      }, 'seeding resources')
    },

    async getResourceById(id: number): Promise<void> {
      return handleError(async () => {
        const response = await performFetch<Resource>(
          `/api/resources/${id}`,
        )
        if (response.success && response.data) {
          this.currentResource = response.data
        } else {
          throw new Error(response.message || 'Failed to fetch resource by ID')
        }
      }, `fetching resource by ID: ${id}`)
    },

    async addResources(resourceData: Partial<Resource>[]): Promise<void> {
      return handleError(async () => {
        const response = await performFetch<Resource[]>('/api/resources', {
          method: 'POST',
          body: JSON.stringify(resourceData),
        })
        if (response.success && response.data) {
          this.resources = [...this.resources, ...response.data]
          this.errors = response.data.errors || []
        } else {
          throw new Error(response.message || 'Failed to add resources')
        }
      }, 'adding resources')
    },

    async updateResource(id: number, data: Partial<Resource>): Promise<void> {
      return handleError(async () => {
        const response = await performFetch<Resource>(
          `/api/resources/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          },
        )
        if (response.success && response.data) {
          this.currentResource = response.data
          await this.getResources() // Refresh after updating
        } else {
          throw new Error(response.message || 'Failed to update resource')
        }
      }, `updating resource ID: ${id}`)
    },

    async deleteResource(id: number): Promise<void> {
      return handleError(async () => {
        const response = await performFetch(`/api/resources/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          await this.getResources() // Refresh after deleting
        } else {
          throw new Error(response.message || 'Failed to delete resource')
        }
      }, `deleting resource ID: ${id}`)
    },
  },
})
