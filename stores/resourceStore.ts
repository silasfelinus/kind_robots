// ~/stores/resourceStore.ts
import { defineStore } from 'pinia'
import {
  Resource as ResourceRecord,
  fetchResources,
  fetchResourceById,
  addResources,
  updateResource,
  deleteResource
} from '../server/api/resources'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Resource = ResourceRecord

interface ResourceState {
  resources: Resource[]
  selectedResource: Resource | null
}

export const useResourceStore = defineStore({
  id: 'resources',
  state: (): ResourceState => ({
    resources: [],
    selectedResource: null
  }),
  getters: {
    getSelectedResource(): Resource | null {
      return this.selectedResource
    }
  },
  actions: {
    async fetchResources(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.resources = await fetchResources(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Resources fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch resources.'
      )
    },
    async fetchResourceById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const resource = await fetchResourceById(id)
          if (resource) {
            const resourceIndex = this.resources.findIndex(
              (existingResource) => existingResource.id === id
            )
            if (resourceIndex !== -1) {
              this.resources.splice(resourceIndex, 1, resource)
            } else {
              this.resources.push(resource)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch resource by id.'
      )
    },
    async addResources(resourceData: Partial<Resource>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { resources: newResources } = await addResources(resourceData)
          this.resources.push(...newResources)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newResources.length} resource(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add resources.'
      )
    },
    async updateResource(id: number, data: Partial<Resource>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedResource = await updateResource(id, data)
          if (updatedResource) {
            const resourceIndex = this.resources.findIndex((resource) => resource.id === id)
            if (resourceIndex !== -1) {
              this.resources.splice(resourceIndex, 1, updatedResource)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update resource.'
      )
    },
    async deleteResource(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const deleteSuccess = await deleteResource(id)
          if (deleteSuccess) {
            const resourceIndex = this.resources.findIndex((resource) => resource.id === id)
            if (resourceIndex !== -1) {
              this.resources.splice(resourceIndex, 1)
              statusStore.setStatus(StatusType.SUCCESS, 'Resource deleted successfully.')
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete resource.'
      )
    },
    selectResource(resourceId: number): void {
      const resource = this.resources.find((resource) => resource.id === resourceId)
      if (resource) {
        this.selectedResource = resource
      } else {
        throw new Error('Cannot select resource that does not exist')
      }
    },
    deselectResource(): void {
      this.selectedResource = null
    }
  }
})
