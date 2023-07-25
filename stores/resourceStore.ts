// ~/store/resources.ts
import { defineStore } from 'pinia'
import { Resource as ResourceRecord } from '@prisma/client'
import axios from 'axios'

export type Resource = ResourceRecord

interface ResourceState {
  resources: Resource[]
  currentResource: Resource | null
  totalResources: number
  errors: string[]
}

export const useResourceStore = defineStore({
  id: 'resources',
  state: (): ResourceState => ({
    resources: [],
    currentResource: null,
    totalResources: 0,
    errors: []
  }),
  actions: {
    async getResources(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/resources?page=${page}&pageSize=${pageSize}`)
      this.resources = data
    },
    async getResourceById(id: number) {
      const { data } = await axios.get(`/api/resources/${id}`)
      this.currentResource = data
    },
    async addResources(resourceData: Partial<Resource>[]) {
      const { data } = await axios.post(`/api/resources`, resourceData)
      this.resources = data.resources
      this.errors = data.errors

      // Update the total resources count after adding new resources
      await this.countResources()
    },
    async updateResource(id: number, data: Partial<Resource>) {
      const { data: updatedResource } = await axios.put(`/api/resources/${id}`, data)
      this.currentResource = updatedResource

      // Fetch the updated list of resources after updating a resource
      await this.getResources()
    },
    async deleteResource(id: number) {
      await axios.delete(`/api/resources/${id}`)

      // Fetch the updated list of resources and total resources count after deleting a resource
      await this.getResources()
      await this.countResources()
    },
    async randomResource() {
      const { data } = await axios.get(`/api/resources/random`)
      this.currentResource = data
    },
    async countResources() {
      const { data } = await axios.get(`/api/resources/count`)
      this.totalResources = data
    },
    async loadStore() {
      try {
        await this.getResources()
        return `Loaded ${this.resources.length} resources`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})
