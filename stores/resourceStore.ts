// ~/stores/resourceStore.ts
import { defineStore } from 'pinia'
import type { Resource } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { resourceData } from './seeds/seedResources' // Assuming you have a seeds file for Resource data

const errorStore = useErrorStore()
const statusStore = useStatusStore()

interface ResourceStoreState {
  resources: Resource[]
  currentResource: Resource | null
  totalResources: number
  errors: string[]
  page: number
  pageSize: number
}

export const useResourceStore = defineStore({
  id: 'resources',
  state: (): ResourceStoreState => ({
    resources: [],
    currentResource: null,
    totalResources: 0,
    errors: [],
    page: 1,
    pageSize: 100,
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading resource store...')
      try {
        // Get the current count of resources
        await this.countResources()
        if (this.totalResources === 0) {
          await this.seedResources()
        }

        // Load other store data
        await this.getResources(this.page, this.pageSize)

        statusStore.setStatus(
          StatusType.SUCCESS,
          `Loaded ${this.resources.length} resources`,
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'Error initializing resource store: ' + error,
        )
      }
    },
    async getResources(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching resources...')
      try {
        const response = await fetch(
          `/api/resources?page=${page}&pageSize=${pageSize}`,
        )
        if (!response.ok) throw new Error('Failed to fetch resources')
        const data = await response.json()
        this.resources = [...this.resources, ...data]
        this.page++
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Fetched ${this.resources.length} resources`,
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch resources: ' + error,
        )
      }
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
        // Update the total resources count after adding new resources
        await this.countResources()
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
          method: 'PUT',
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
        await this.countResources()
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to delete resource: ' + error,
        )
      }
    },
    async randomResource(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random resource...')
      try {
        const response = await fetch(`/api/resources/random`)
        if (!response.ok) throw new Error('Failed to fetch a random resource')
        const data = await response.json()
        this.currentResource = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random resource')
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch a random resource: ' + error,
        )
      }
    },
    async countResources(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting resources...')
      try {
        const response = await fetch(`/api/resources/count`)
        if (!response.ok) throw new Error('Failed to count resources')
        const data = await response.json()
        this.totalResources = data
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Counted a total of ${this.totalResources} resources`,
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Failed to count resources: ' + error,
        )
      }
    },
    async seedResources(): Promise<void> {
      // If there are no resources, load them
      statusStore.setStatus(StatusType.INFO, 'Seeding resources...')
      try {
        await this.addResources(resourceData)
        statusStore.setStatus(
          StatusType.SUCCESS,
          'Resources successfully seeded.',
        )
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'Error loading resources: ' + error,
        )
      }

      // Fetch the updated list of resources and total resources count after seeding
      await this.getResources()
      await this.countResources()
    },
  },
})
