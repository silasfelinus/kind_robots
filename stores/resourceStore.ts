import { defineStore } from 'pinia'
import type { Resource } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { resourceData } from './seeds/seedResources'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

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
      statusStore.setStatus(StatusType.INFO, 'Loading resource store...')
      try {
        if (!this.isInitialized) {
          await this.getResources()
          if (this.resources.length === 0) {
            await this.seedResources()
            await this.getResources()
          }
          this.isInitialized = true
        }


        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.resources.length} resources`)
      } catch (error) {
        console.error('Resource Store Load Error:', error)
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          `Error initializing resource store: ${error instanceof Error ? error.message : error}`,
        )
        this.errors.push(`Resource Store Load Error: ${error}`)
      }
    },

    async getResources(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching resources...')
      try {
        const response = await fetch(`/api/resources`)
        if (!response.ok) throw new Error('Failed to fetch resources')
        const data = await response.json()
        this.resources = [...this.resources, ...data]
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.resources.length} resources`)
      } catch (error) {
        console.error('Failed to fetch resources:', error) // Log detailed error
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Failed to fetch resources: ${error instanceof Error ? error.message : error}`,
        )
        this.errors.push(`Fetch Resources Error: ${error}`)
      }
    },

    async seedResources(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding resources...')
      try {
        await this.addResources(resourceData)
        statusStore.setStatus(StatusType.SUCCESS, 'Resources successfully seeded.')
      } catch (error) {
        console.error('Error seeding resources:', error) // Log detailed error
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          `Error loading resources: ${error instanceof Error ? error.message : error}`,
        )
        this.errors.push(`Seed Resources Error: ${error}`)
      }

      await this.getResources()
    },
    async getResourceById(id: number): Promise<void> {
      statusStore.setStatus(
        StatusType.INFO,
        `Fetching resource with id ${id}...`,
      )
      try {
        const response = await fetch(`/api/resources/${id}`)
        if (!response.ok) throw new Error('Failed to fetch resource')
        const data = await response.json()
        this.currentResource = data
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Fetched resource with id ${id}`,
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch resource by id: ' + error,
        )
      }
    },
    async addResources(resourceData: Partial<Resource>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new resources...')
      try {
        const response = await fetch(`/api/resources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resourceData),
        })
        if (!response.ok) throw new Error('Failed to add resources')
        const data = await response.json()
        this.resources = [...this.resources, ...data.resources]
        this.errors = data.errors
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Added ${this.resources.length} resources`,
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to add resources: ' + error,
        )
      }
    },
    async updateResource(id: number, data: Partial<Resource>): Promise<void> {
      statusStore.setStatus(
        StatusType.INFO,
        `Updating resource with id ${id}...`,
      )
      try {
        const response = await fetch(`/api/resources/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error('Failed to update resource')
        const updatedResource = await response.json()
        this.currentResource = updatedResource
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Updated resource with id ${id}`,
        )
        // Fetch the updated list of resources after updating a resource
        await this.getResources()
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to update resource: ' + error,
        )
      }
    },
    async deleteResource(id: number): Promise<void> {
      statusStore.setStatus(
        StatusType.INFO,
        `Deleting resource with id ${id}...`,
      )
      try {
        const response = await fetch(`/api/resources/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete resource')
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Deleted resource with id ${id}`,
        )
        // Fetch the updated list of resources and total resources count after deleting a resource
        await this.getResources()
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to delete resource: ' + error,
        )
      }
    },
  },
})
