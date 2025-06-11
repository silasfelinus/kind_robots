// /stores/resourceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Resource } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { resourceData } from './../stores/seeds/seedResources'

export const useResourceStore = defineStore('resourceStore', () => {
  const resources = ref<Resource[]>([])
  const currentResource = ref<Resource | null>(null)
  const isInitialized = ref(false)

  async function loadStore(): Promise<void> {
    return handleError(async () => {
      if (!isInitialized.value) {
        await getResources()
        if (resources.value.length === 0) {
          await seedResources()
          await getResources()
        }
        isInitialized.value = true
      }
    }, 'initializing resource store')
  }

  async function getResources(): Promise<void> {
    return handleError(async () => {
      const res = await performFetch<Resource[]>('/api/resources')
      if (res.success) {
        resources.value = res.data || []
      } else {
        throw new Error(res.message || 'Failed to fetch resources')
      }
    }, 'fetching resources')
  }

  async function seedResources(): Promise<void> {
    return handleError(async () => {
      await addResources(resourceData)
      await getResources()
    }, 'seeding resources')
  }

  async function getResourceById(id: number): Promise<void> {
    return handleError(async () => {
      const res = await performFetch<Resource>(`/api/resources/${id}`)
      if (res.success && res.data) {
        currentResource.value = res.data
      } else {
        throw new Error(res.message || 'Failed to fetch resource by ID')
      }
    }, `fetching resource by ID: ${id}`)
  }

  async function addResources(data: Partial<Resource>[]): Promise<void> {
    return handleError(async () => {
      const res = await performFetch<Resource[]>('/api/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (res.success && res.data) {
        resources.value = [...resources.value, ...res.data]
      } else {
        throw new Error(res.message || 'Failed to add resources')
      }
    }, 'adding resources')
  }

  async function updateResource(
    id: number,
    data: Partial<Resource>,
  ): Promise<void> {
    return handleError(async () => {
      const res = await performFetch<Resource>(`/api/resources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      if (res.success && res.data) {
        currentResource.value = res.data
        await getResources()
      } else {
        throw new Error(res.message || 'Failed to update resource')
      }
    }, `updating resource ID: ${id}`)
  }

  async function deleteResource(id: number): Promise<void> {
    return handleError(async () => {
      const res = await performFetch(`/api/resources/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        await getResources()
      } else {
        throw new Error(res.message || 'Failed to delete resource')
      }
    }, `deleting resource ID: ${id}`)
  }

  return {
    resources,
    currentResource,
    isInitialized,
    loadStore,
    getResources,
    seedResources,
    getResourceById,
    addResources,
    updateResource,
    deleteResource,
  }
})

export type { Resource }
