// /stores/resourceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { resourceData } from './../stores/seeds/seedResources'

export const useResourceStore = defineStore('resourceStore', () => {
  const resources = ref<Resource[]>([])
  const currentResource = ref<Resource | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Resource[]> | null>(null)
  const seedPromise = ref<Promise<void> | null>(null)

  async function loadStore(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      isLoading.value = true

      try {
        await getResources()

        if (resources.value.length === 0) {
          await seedResources()
        }

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing resource store')
      } finally {
        isLoading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function getResources(force = false): Promise<Resource[]> {
    if (!force && hasLoaded.value) return resources.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      const res = await performFetch<Resource[]>('/api/resources')

      if (!res.success) {
        throw new Error(res.message || 'Failed to fetch resources')
      }

      resources.value = res.data || []
      hasLoaded.value = true
      return resources.value
    })()

    try {
      return await fetchPromise.value
    } catch (error) {
      handleError(error, 'fetching resources')
      return []
    } finally {
      fetchPromise.value = null
    }
  }

  async function seedResources(): Promise<void> {
    if (seedPromise.value) return seedPromise.value

    seedPromise.value = (async () => {
      if (resources.value.length > 0) return

      await addResources(resourceData)

      if (resources.value.length === 0) {
        await getResources(true)
      }
    })()

    try {
      await seedPromise.value
    } catch (error) {
      handleError(error, 'seeding resources')
    } finally {
      seedPromise.value = null
    }
  }

  async function getResourceById(id: number): Promise<Resource | null> {
    try {
      const existing = resources.value.find((resource) => resource.id === id)

      if (existing) {
        currentResource.value = existing
        return existing
      }

      const res = await performFetch<Resource>(`/api/resources/${id}`)

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch resource by ID')
      }

      currentResource.value = res.data

      const index = resources.value.findIndex((resource) => resource.id === id)
      if (index === -1) {
        resources.value.push(res.data)
      } else {
        resources.value[index] = res.data
      }

      return res.data
    } catch (error) {
      handleError(error, `fetching resource by ID: ${id}`)
      return null
    }
  }

  async function addResources(data: Partial<Resource>[]): Promise<Resource[]> {
    try {
      const res = await performFetch<Resource[]>('/api/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to add resources')
      }

      const created = res.data
      const createdIds = new Set(created.map((resource) => resource.id))

      resources.value = [
        ...resources.value.filter((resource) => !createdIds.has(resource.id)),
        ...created,
      ]

      hasLoaded.value = true
      return created
    } catch (error) {
      handleError(error, 'adding resources')
      return []
    }
  }

  async function updateResource(
    id: number,
    data: Partial<Resource>,
  ): Promise<Resource | null> {
    try {
      const res = await performFetch<Resource>(`/api/resources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update resource')
      }

      currentResource.value = res.data

      const index = resources.value.findIndex((resource) => resource.id === id)
      if (index !== -1) {
        resources.value[index] = res.data
      } else {
        resources.value.push(res.data)
      }

      return res.data
    } catch (error) {
      handleError(error, `updating resource ID: ${id}`)
      return null
    }
  }

  async function deleteResource(id: number): Promise<boolean> {
    try {
      const res = await performFetch(`/api/resources/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete resource')
      }

      resources.value = resources.value.filter((resource) => resource.id !== id)

      if (currentResource.value?.id === id) {
        currentResource.value = null
      }

      return true
    } catch (error) {
      handleError(error, `deleting resource ID: ${id}`)
      return false
    }
  }

  function clearCurrentResource(): void {
    currentResource.value = null
  }

  return {
    resources,
    currentResource,
    isInitialized,
    isLoading,
    hasLoaded,
    initializePromise,
    fetchPromise,
    seedPromise,
    loadStore,
    getResources,
    seedResources,
    getResourceById,
    addResources,
    updateResource,
    deleteResource,
    clearCurrentResource,
  }
})

export type { Resource }
