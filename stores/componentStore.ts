import { defineStore } from 'pinia'
import { performFetch, handleError } from './utils'
import type { Component } from '@prisma/client'

// Define the Folder interface (from components.json)
interface Folder {
  folderName: string
  components: string[]
}

interface ComponentStoreState {
  components: Component[]
  selectedComponent: Component | null
  selectedFolder: string | null
  isInitialized: boolean
}

export const useComponentStore = defineStore('componentStore', {
  state: (): ComponentStoreState => ({
    components: [],
    selectedComponent: null,
    selectedFolder: null,
    isInitialized: false,
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
    async initialize() {
      if (this.isInitialized) {
        console.log('ComponentStore already initialized — skipping fetch.')
        return
      }

      try {
        const response = await performFetch<Component[]>('/api/components')

        if (response.success && response.data) {
          this.components = response.data
          this.isInitialized = true
          console.log('Components initialized successfully')
        } else {
          throw new Error('Failed to fetch components from API.')
        }
      } catch (error) {
        this.isInitialized = false
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
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          const logProgress = (message: string) => {
            console.log(`[SyncComponents] ${message}`)
            if (progressCallback) progressCallback(message)
          }

          logProgress('Fetching components.json...')
          const response = await fetch('/components.json')
          if (!response.ok) throw new Error('Failed to fetch components.json')

          const folderData: Folder[] = await response.json()
          if (!Array.isArray(folderData)) {
            throw new Error(
              'Invalid data format: components.json must be an array',
            )
          }

          logProgress('Fetched components.json.')

          logProgress('Fetching existing components from the API...')
          const apiResponse = await fetch('/api/components')
          const apiData = await apiResponse.json()
          if (!apiData.success || !Array.isArray(apiData.data)) {
            throw new Error('Invalid API response: expected data array')
          }

          const apiComponents: Component[] = apiData.data
          const matchedComponentIds = new Set<number>()

          logProgress('Synchronizing components...')

          const normalize = (str: string) =>
            str
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .replace(/[\s_]+/g, '-')
              .toLowerCase()

          for (const folder of folderData) {
            for (const componentName of folder.components) {
              const normalizedName = normalize(componentName)

              const existingComponent = apiComponents.find(
                (comp) => normalize(comp.componentName) === normalizedName,
              )

              const alreadyExists = apiComponents.find(
                (comp) => comp.componentName === componentName,
              )

              if (existingComponent) {
                if (
                  alreadyExists &&
                  alreadyExists.id !== existingComponent.id
                ) {
                  // Merge logic: update correct one, delete old
                  logProgress(
                    `Merging "${existingComponent.componentName}" into "${componentName}" (IDs ${existingComponent.id} → ${alreadyExists.id})`,
                  )

                  const patchRes = await performFetch<Component>(
                    `/api/components/${alreadyExists.id}`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({
                        folderName: folder.folderName,
                        updatedAt: new Date(),
                      }),
                    },
                  )

                  if (!patchRes.success) {
                    throw new Error(
                      `Failed to update folderName for ${componentName}: ${patchRes.message}`,
                    )
                  }

                  matchedComponentIds.add(alreadyExists.id)

                  await this.deleteComponent(existingComponent.id)
                  logProgress(
                    `Deleted duplicate "${existingComponent.componentName}" (ID: ${existingComponent.id})`,
                  )
                } else {
                  // Normal update
                  const patchRes = await performFetch<Component>(
                    `/api/components/${existingComponent.id}`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({
                        componentName,
                        folderName: folder.folderName,
                        updatedAt: new Date(),
                      }),
                    },
                  )

                  if (!patchRes.success) {
                    throw new Error(
                      `Failed to update ${componentName}: ${patchRes.message}`,
                    )
                  }

                  matchedComponentIds.add(existingComponent.id)
                  logProgress(`Updated: ${componentName}`)
                }
              } else {
                // No match, create fresh
                const createData: Omit<Component, 'id'> = {
                  componentName,
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

                const newComp = await this.createComponent(
                  createData as Component,
                )
                matchedComponentIds.add(newComp.id)
                logProgress(`Created: ${componentName}`)
              }
            }
          }

          // Delete any stale entries not matched
          const toDelete = apiComponents.filter(
            (comp) => !matchedComponentIds.has(comp.id),
          )

          for (const comp of toDelete) {
            logProgress(`Deleting unmatched component: ${comp.componentName}`)
            await this.deleteComponent(comp.id)
          }

          logProgress('Component sync complete.')
        },
        ErrorType.GENERAL_ERROR,
        'Error syncing components from components.json',
      )
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
    async createComponent(component: Component) {
      try {
        const response = await performFetch<Component>('/api/components', {
          method: 'POST',
          body: JSON.stringify(component),
        })

        // Validate the response
        if (!response.success || !response.data) {
          throw new Error(
            `API failed to create component: ${component.componentName}. Response: ${JSON.stringify(response)}`,
          )
        }

        const serverComponent = response.data

        // Add the new component to the state
        this.components.push(serverComponent)
        console.log(
          `Component "${serverComponent.componentName}" created successfully with ID: ${serverComponent.id}`,
        )
        return serverComponent
      } catch (error) {
        // Handle the error and provide detailed messages
        handleError(
          error,
          `Error while trying to create component: ${component.componentName}`,
        )
        // Optional: Rethrow the error if the calling method needs to handle it
        throw error
      }
    },

    async updateComponent(component: Component) {
      try {
        // Pre-validate the data before sending
        if (!/^[a-zA-Z0-9\s-]+$/.test(component.componentName)) {
          throw new Error(`Invalid componentName: ${component.componentName}`)
        }
        if (!/^[a-z0-9-]+$/.test(component.folderName)) {
          throw new Error(`Invalid folderName: ${component.folderName}`)
        }

        const response = await performFetch<Component>(
          `/api/components/${component.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              ...component,
              notes: component.notes || '', // Replace null with empty string
              artImageId: component.artImageId || null,
            }),
          },
        )

        if (!response.success || !response.data) {
          throw new Error(
            `API failed to update component: ${component.componentName}. Response: ${JSON.stringify(response)}`,
          )
        }

        console.log(
          `Component "${component.componentName}" updated successfully.`,
        )
      } catch (error) {
        console.error(
          `Error updating component "${component.componentName}":`,
          error,
        )
        throw error
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
