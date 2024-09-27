import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore' // Import errorStore and ErrorType
import type { Component } from '@prisma/client'

// Define the Folder interface (from components.json)
interface Folder {
  folderName: string
  components: string[]
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    components: [] as Component[], // Flat list of all Component objects for ease of lookup
    selectedComponent: null as Component | null, // Full Component object for the selected component
  }),

  getters: {
    getSelectedComponent: (state) => state.selectedComponent,
    allComponents(state) {
      return state.components
    },
  },

  actions: {
    // Initialize by fetching components from the API (no syncing)
    async initializeComponents() {
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          console.log('Initializing components from API...')
          const response = await fetch('/api/components')

          if (!response.ok) {
            throw new Error('Failed to fetch components from API.')
          }

          const apiData = await response.json()

          if (!apiData.success || !Array.isArray(apiData.components)) {
            throw new Error(
              'Invalid data format: API response must contain a components array.',
            )
          }

          this.components = apiData.components
          console.log('Components initialized from API:', this.components)
        },
        ErrorType.NETWORK_ERROR,
        'Error fetching components from API',
      )
    },

    // Sync components from components.json to the database
    async syncComponents() {
      const errorStore = useErrorStore()

      return errorStore.handleError(
        async () => {
          console.log('Syncing components from components.json...')

          // Fetch folder and component names from components.json
          const response = await fetch('/components.json')
          if (!response.ok) {
            throw new Error('Failed to fetch components.json')
          }

          const folderData: Folder[] = await response.json()

          if (!Array.isArray(folderData)) {
            throw new Error(
              'Invalid data format: components.json must be an array',
            )
          }

          console.log('Fetched components.json:', folderData)

          // Fetch existing components from the API
          const apiResponse = await fetch('/api/components')
          if (!apiResponse.ok) {
            throw new Error('Failed to fetch components from API')
          }

          const apiData = await apiResponse.json()
          if (!apiData.success || !Array.isArray(apiData.components)) {
            throw new Error(
              'Invalid data format: API response must contain a components array',
            )
          }

          const apiComponents: Component[] = apiData.components

          // Identify and delete components in the database not in components.json
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
              console.log(
                `Deleting component: ${apiComponent.componentName} from folder: ${apiComponent.folderName}`,
              )
              await this.deleteComponent(apiComponent.id)
            }
          }

          // Sync (Upsert) components from components.json to the database
          for (const folder of folderData) {
            for (const componentName of folder.components) {
              const existingComponent = apiComponents.find(
                (comp) =>
                  comp.componentName === componentName &&
                  comp.folderName === folder.folderName,
              )

              const componentData = {
                id: existingComponent ? existingComponent.id : 0, // Use 0 for new components
                componentName,
                folderName: folder.folderName,
                createdAt: existingComponent?.createdAt || new Date(),
                updatedAt: new Date(),
                isWorking: existingComponent?.isWorking || true,
                underConstruction:
                  existingComponent?.underConstruction || false,
                isBroken: existingComponent?.isBroken || false,
                title: existingComponent?.title || null,
                notes: existingComponent?.notes || null,
              }

              await this.createOrUpdateComponent(
                componentData as Component,
                existingComponent ? 'update' : 'create',
              )
            }
          }

          console.log('Components synced from components.json to the API.')
        },
        ErrorType.GENERAL_ERROR,
        'Error syncing components from components.json',
      )
    },

    // Fetch a single component by ID with error handling
    async fetchComponentById(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          console.log(`Fetching component with ID: ${id}`)

          const response = await fetch(`/api/components/${id}`)

          if (!response.ok) {
            throw new Error(`Failed to fetch component with ID: ${id}`)
          }

          const component: Component = await response.json()

          this.selectedComponent = component
          console.log(
            `Component with ID: ${id} fetched successfully`,
            component,
          )

          return component
        },
        ErrorType.NETWORK_ERROR,
        `Error fetching component with ID ${id}`,
      )
    },

    // Find a component by its name from the store
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

    // Create or update a component in the database with error handling
    async createOrUpdateComponent(
      component: Component,
      action: 'create' | 'update',
    ) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          console.log(
            `${action === 'create' ? 'Creating' : 'Updating'} component: ${component.componentName}`,
          )

          const response = await fetch('/api/components', {
            method: action === 'create' ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(component),
          })

          if (!response.ok) {
            throw new Error(
              `${action === 'create' ? 'Create' : 'Update'} component failed: ${response.statusText}`,
            )
          }

          if (action === 'create') {
            const newComponent = await response.json()
            this.components.push(newComponent) // Add the new component to the store
            console.log(
              `Component ${newComponent.componentName} created successfully with ID: ${newComponent.id}`,
            )
            return newComponent
          } else {
            // Update the component in the store
            const index = this.components.findIndex(
              (comp) => comp.id === component.id,
            )
            if (index !== -1) {
              this.components[index] = component // Update the store component
            }
            console.log(
              `Component ${component.componentName} updated successfully`,
            )
          }
        },
        ErrorType.GENERAL_ERROR,
        `Error ${action === 'create' ? 'creating' : 'updating'} component`,
      )
    },

    clearSelectedComponent() {
      this.selectedComponent = null
    },

    // Delete a specific component by ID with error handling
    async deleteComponent(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          console.log(`Deleting component with ID: ${id}`)
          const response = await fetch(`/api/components/${id}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error(`Failed to delete component with id: ${id}`)
          }
          this.components = this.components.filter((c) => c.id !== id) // Remove from the store
          console.log(`Component with ID ${id} deleted successfully`)
        },
        ErrorType.GENERAL_ERROR,
        `Error deleting component with ID ${id}`,
      )
    },
  },
})

export type { Component as KindComponent }
