import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Component } from '~/prisma/generated/prisma/client'
import {
  fetchComponentById as helperFetch,
  createComponent as helperCreate,
  updateComponent as helperUpdate,
  deleteComponent as helperDelete,
  findComponentByName as helperFind,
  createOrUpdateComponent as helperCreateOrUpdate,
} from '@/stores/helpers/componentHelper'
import { performFetch } from '@/stores/utils'
import {
  loadSnapshot,
  markSnapshotActive,
} from '@/stores/helpers/snapshotLoader'

export const useComponentStore = defineStore('componentStore', () => {
  const components = ref<Component[]>([])
  const usingSnapshot = ref(false)
  const selectedComponent = ref<Component | null>(null)
  const selectedFolder = ref<string | null>(null)
  const isInitialized = ref(false)

  const getSelectedComponent = computed(() => selectedComponent.value)
  const allComponents = computed(() => components.value)
  const getSelectedFolder = computed(() => selectedFolder.value)
  const getIsInitialized = computed(() => isInitialized.value)

  async function initialize(force = false) {
    if (isInitialized.value && !force) return

    try {
      // performFetch (not raw fetch) so a dead DB trips the shared circuit
      // breaker instead of hanging every page that lists components.
      const data = await performFetch<Component[]>('/api/components')
      if (data.success && data.data) {
        components.value = data.data
        usingSnapshot.value = false
        markSnapshotActive('components', false)
        isInitialized.value = true
      } else {
        throw new Error('Failed to fetch components')
      }
    } catch (error) {
      isInitialized.value = false
      console.error('Initialization failed', error)

      // Database unreachable and nothing loaded yet: fall back to the
      // nightly snapshot. isInitialized stays false, so the next
      // initialize() call still retries the live fetch.
      if (components.value.length === 0) {
        const snapshotRows = await loadSnapshot<Component>('components')

        if (snapshotRows.length && components.value.length === 0) {
          components.value = snapshotRows
          usingSnapshot.value = true
          markSnapshotActive('components', true)
        }
      }
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
    const component = await helperFetch(id)
    if (component) selectedComponent.value = component
    return component
  }

  async function createComponent(component: Component) {
    const created = await helperCreate(component)
    components.value.push(created)
    return created
  }

  async function updateComponent(component: Component) {
    const updated = await helperUpdate(component)
    const index = components.value.findIndex((entry) => entry.id === component.id)
    if (index !== -1) components.value[index] = updated
    return updated
  }

  async function deleteComponent(id: number) {
    const success = await helperDelete(id)
    if (success) {
      components.value = components.value.filter((entry) => entry.id !== id)
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
      const index = components.value.findIndex((entry) => entry.id === result.id)
      if (index !== -1) components.value[index] = result
    }

    return result
  }

  return {
    components,
    usingSnapshot,
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
  }
})

export type { Component as KindComponent }
