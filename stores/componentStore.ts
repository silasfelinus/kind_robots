import { defineStore } from 'pinia'
import { performFetch, handleError } from './utils'
import type { Component } from '@prisma/client'

// Define the Folder interface (from components.json)
interface Folder {
  folderName: string
  components: string[]
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    components: [] as Component[],
    selectedComponent: null as Component | null,
    selectedFolder: null as string | null,
    isInitialized: false, // Tracks initialization state
  }),

  getters: {
    getSelectedComponent: (state) => state.selectedComponent,
    allComponents(state) {
      return state.components
    },
    getSelectedFolder: (state) => state.selectedFolder,
    getIsInitialized: (state) => state.isInitialized, // Getter for initialization state
  },

  actions: {
    async initializeComponents() {
      try {
        const response = await performFetch<Component[]>('/api/components')

        if (response.success && response.data) {
          this.components = response.data
          this.isInitialized = true // Mark as initialized
          console.log('Components initialized successfully')
        } else {
          throw new Error('Failed to fetch components from API.')
        }
      } catch (error) {
        this.isInitialized = false // Ensure it resets on failure
        handleError(error, 'Error fetching components from API')
      }
    },

    setSelectedFolder(folderName: string) {
      this.selectedFolder = folderName
    },

    clearSelectedFolder() {
      this.selectedFolder = null
    },

    async syncComponents(progressCallback?: (message: string) => void) {
      try {
        const logProgress = (message: string) => {
          console.log(`[SyncComponents] ${message}`)
          if (progressCallback) progressCallback(message)
        }

        logProgress('Fetching components.json...')
        const folderDataResponse = await fetch('/components.json')
        if (!folderDataResponse.ok) {
          throw new Error(
            `Failed to load components.json: ${folderDataResponse.statusText}`,
          )
        }
        const folderData: Folder[] = await folderDataResponse.json()

        logProgress('Fetching components from the API...')
        const apiResponse = await performFetch<Component[]>('/api/components')
        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(
            apiResponse.message || 'Failed to fetch API components',
          )
        }
        const apiComponents = apiResponse.data

        logProgress('Synchronizing components...')
        const componentsFromJson = folderData.flatMap((folder) =>
          folder.components.map((componentName) => ({
            componentName,
            folderName: folder.folderName,
          })),
        )

        for (const apiComponent of apiComponents) {
          const existsInJson = componentsFromJson.some(
            (jsonComp) =>
              jsonComp.componentName === apiComponent.componentName &&
              jsonComp.folderName === apiComponent.folderName,
          )
          if (!existsInJson) {
            logProgress(`Deleting component: ${apiComponent.componentName}`)
            await this.deleteComponent(apiComponent.id)
          }
        }

        for (const folder of folderData) {
          for (const componentName of folder.components) {
            const existingComponent = apiComponents.find(
              (comp) =>
                comp.componentName === componentName &&
                comp.folderName === folder.folderName,
            )

            const componentData: Component = {
              id: existingComponent ? existingComponent.id : 0,
              componentName,
              folderName: folder.folderName,
              createdAt: existingComponent?.createdAt || new Date(),
              updatedAt: new Date(),
              isWorking: existingComponent?.isWorking || true,
              underConstruction: existingComponent?.underConstruction || false,
              isBroken: existingComponent?.isBroken || false,
              title: existingComponent?.title || null,
              notes: existingComponent?.notes || null,
              artImageId: existingComponent?.artImageId || null,
            }

            const action = existingComponent ? 'update' : 'create'
            logProgress(
              `${action === 'create' ? 'Creating' : 'Updating'} component: ${componentName}`,
            )
            await this.createOrUpdateComponent(componentData, action)
          }
        }

        logProgress('Sync complete!')
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'An unexpected error occurred during sync.'

        console.error('[SyncComponents] Error:', errorMessage)
        handleError(
          errorMessage,
          'Error syncing components from components.json',
        )
        throw new Error(errorMessage)
      }
    },

    async fetchComponentById(id: number) {
      try {
        console.log(`Fetching component with ID: ${id}`)
        const response = await performFetch<Component>(`/api/components/${id}`)
        if (response.success && response.data) {
          this.selectedComponent = response.data
          console.log(
            `Component with ID: ${id} fetched successfully`,
            response.data,
          )
          return response.data
        } else {
          throw new Error(`Failed to fetch component with ID: ${id}`)
        }
      } catch (error) {
        handleError(error, `Error fetching component with ID ${id}`)
      }
    },

    findComponentByName(componentName: string) {
      const foundComponent = this.components.find(
        (component) => component.componentName === componentName,
      )

      if (!foundComponent) {
        throw new Error(`Component with name "${componentName}" not found.`)
      }

      this.selectedComponent = foundComponent
      console.log(
        `Component with name "${componentName}" found successfully`,
        foundComponent,
      )
      return foundComponent
    },

    async createOrUpdateComponent(
      component: Component,
      action: 'create' | 'update',
    ) {
      try {
        const method = action === 'create' ? 'POST' : 'PATCH'
        const response = await performFetch<Component>('/api/components', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })

        // Validate the response
        if (!response.success || !response.data) {
          throw new Error(
            `API failed to ${action} component: ${component.componentName}. Response: ${JSON.stringify(response)}`,
          )
        }

        const serverComponent = response.data

        if (action === 'create') {
          // Add new component to state
          this.components.push(serverComponent)
          console.log(
            `Component "${serverComponent.componentName}" created successfully with ID: ${serverComponent.id}`,
          )
          return serverComponent
        } else {
          // Update existing component in state
          const index = this.components.findIndex(
            (comp) => comp.id === component.id,
          )
          if (index !== -1) {
            this.components[index] = serverComponent
          } else {
            // Log a sync issue if the updated component is missing locally
            console.warn(
              `Component "${component.componentName}" updated on server but not found in local state.`,
            )
          }
          console.log(
            `Component "${component.componentName}" updated successfully.`,
          )
        }
      } catch (error) {
        // Ensure proper error handling and detailed messages
        handleError(
          error,
          `Error while trying to ${action} component: ${component.componentName} (${component.id || 'new'})`,
        )
        // Optional: Rethrow the error if the calling method needs to handle it
        throw error
      }
    },

    clearSelectedComponent() {
      this.selectedComponent = null
    },

    async deleteComponent(id: number) {
      try {
        const response = await performFetch(`/api/components/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.components = this.components.filter((c) => c.id !== id)
          console.log(`Component with ID ${id} deleted successfully`)
        } else {
          throw new Error(
            response.message || `Failed to delete component with ID: ${id}`,
          )
        }
      } catch (error) {
        handleError(error, `Error deleting component with ID ${id}`)
      }
    },
  },
})

export type { Component as KindComponent }
