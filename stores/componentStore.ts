import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Component } from '~/server/generated/prisma'
import {
  fetchComponentById as helperFetch,
  createComponent as helperCreate,
  updateComponent as helperUpdate,
  deleteComponent as helperDelete,
  findComponentByName as helperFind,
  createOrUpdateComponent as helperCreateOrUpdate,
} from '@/stores/helpers/componentHelper'
import { performFetch } from '@/stores/utils'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

interface Folder {
  folderName: string
  components: string[]
}

export const useComponentStore = defineStore('componentStore', () => {
  const components = ref<Component[]>([])
  const selectedComponent = ref<Component | null>(null)
  const selectedFolder = ref<string | null>(null)
  const isInitialized = ref(false)

  const getSelectedComponent = computed(() => selectedComponent.value)
  const allComponents = computed(() => components.value)
  const getSelectedFolder = computed(() => selectedFolder.value)
  const getIsInitialized = computed(() => isInitialized.value)

  async function initialize() {
    if (isInitialized.value) return
    try {
      const response = await fetch('/api/components')
      const data = await response.json()
      if (data.success && data.data) {
        components.value = data.data
        isInitialized.value = true
      } else {
        throw new Error('Failed to fetch components')
      }
    } catch (error) {
      isInitialized.value = false
      console.error('Initialization failed', error)
    }
  }

  function setSelectedFolder(folderName: string) {
    selectedFolder.value = folderName
  }

  function clearSelectedFolder() {
    selectedFolder.value = null
  }

  function clearSelectedComponent() {
    selectedComponent.value = null
  }

  async function fetchComponentById(id: number) {
    const comp = await helperFetch(id)
    if (comp) selectedComponent.value = comp
    return comp
  }

  async function createComponent(component: Component) {
    const created = await helperCreate(component)
    components.value.push(created)
    return created
  }

  async function updateComponent(component: Component) {
    const updated = await helperUpdate(component)
    const index = components.value.findIndex(
      (c: { id: any }) => c.id === component.id,
    )
    if (index !== -1) components.value[index] = updated
    return updated
  }

  async function deleteComponent(id: number) {
    const success = await helperDelete(id)
    if (success) {
      components.value = components.value.filter(
        (c: { id: number }) => c.id !== id,
      )
    }
    return success
  }

  function findComponentByName(name: string) {
    const found = helperFind(components.value, name)
    selectedComponent.value = found
    return found
  }

  async function createOrUpdateComponent(
    component: Component,
    action: 'create' | 'update',
  ) {
    const result = await helperCreateOrUpdate(component, action)
    if (action === 'create') {
      components.value.push(result)
    } else {
      const index = components.value.findIndex(
        (c: { id: any }) => c.id === result.id,
      )
      if (index !== -1) components.value[index] = result
    }
    return result
  }

  async function syncComponents(progressCallback?: (msg: string) => void) {
    const errorStore = useErrorStore()

    return errorStore.handleError(
      async () => {
        const log = (msg: string) => {
          console.log(`[SyncComponents] ${msg}`)
          if (progressCallback) progressCallback(msg)
        }

        log('Fetching components.json...')
        const response = await fetch('/components.json')
        if (!response.ok) throw new Error('Failed to fetch components.json')
        const folderData: Folder[] = await response.json()

        if (!Array.isArray(folderData)) {
          throw new Error(
            'Invalid data format: components.json must be an array',
          )
        }

        log('Fetched components.json.')
        log('Fetching existing components from the API...')
        const apiResponse = await fetch('/api/components')
        const apiData = await apiResponse.json()
        if (!apiData.success || !Array.isArray(apiData.data)) {
          throw new Error('Invalid API response: expected data array')
        }

        const apiComponents: Component[] = apiData.data
        const matchedComponentIds = new Set<number>()

        const normalize = (str: string) =>
          str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()

        for (const folder of folderData) {
          for (const name of folder.components) {
            const normalizedName = normalize(name)

            const existing = apiComponents.find(
              (c) => normalize(c.componentName) === normalizedName,
            )
            const directMatch = apiComponents.find(
              (c) => c.componentName === name,
            )

            if (existing) {
              if (directMatch && directMatch.id !== existing.id) {
                log(`Merging "${existing.componentName}" into "${name}"`)

                const patchRes = await performFetch<Component>(
                  `/api/components/${directMatch.id}`,
                  {
                    method: 'PATCH',
                    body: JSON.stringify({
                      folderName: folder.folderName,
                      updatedAt: new Date(),
                    }),
                  },
                )

                if (!patchRes.success)
                  throw new Error(
                    `Failed to update folderName: ${patchRes.message}`,
                  )

                matchedComponentIds.add(directMatch.id)
                await deleteComponent(existing.id)
                log(`Deleted duplicate "${existing.componentName}"`)
              } else {
                const patchRes = await performFetch<Component>(
                  `/api/components/${existing.id}`,
                  {
                    method: 'PATCH',
                    body: JSON.stringify({
                      componentName: name,
                      folderName: folder.folderName,
                      updatedAt: new Date(),
                    }),
                  },
                )

                if (!patchRes.success)
                  throw new Error(
                    `Failed to update ${name}: ${patchRes.message}`,
                  )

                matchedComponentIds.add(existing.id)
                log(`Updated: ${name}`)
              }
            } else {
              const newComp: Omit<Component, 'id'> = {
                componentName: name,
                folderName: folder.folderName,
                createdAt: new Date(),
                updatedAt: new Date(),
                isWorking: true,
                underConstruction: false,
                isBroken: false,
                title: null,
                notes: null,
                artImageId: null,
              }

              const created = await createComponent(newComp as Component)
              matchedComponentIds.add(created.id)
              log(`Created: ${name}`)
            }
          }
        }

        const stale = apiComponents.filter(
          (c) => !matchedComponentIds.has(c.id),
        )
        for (const comp of stale) {
          log(`Deleting unmatched: ${comp.componentName}`)
          await deleteComponent(comp.id)
        }

        log('Component sync complete.')
      },
      ErrorType.GENERAL_ERROR,
      'Error syncing components',
    )
  }

  return {
    components,
    selectedComponent,
    selectedFolder,
    isInitialized,
    getSelectedComponent,
    allComponents,
    getSelectedFolder,
    getIsInitialized,
    initialize,
    setSelectedFolder,
    clearSelectedFolder,
    clearSelectedComponent,
    fetchComponentById,
    createComponent,
    updateComponent,
    deleteComponent,
    findComponentByName,
    createOrUpdateComponent,
    syncComponents,
  }
})

export type { Component as KindComponent }
