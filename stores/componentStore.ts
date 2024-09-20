import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/errorStore' // Import errorStore and ErrorType
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
    // Initialize the components by syncing them from components.json and the API
    async initializeComponents() {
      const errorStore = useErrorStore()
      
      return errorStore.handleError(async () => {
        console.log('Starting components initialization...')
    
        try {
          // Step 1: Fetch folder and component names from components.json
          console.log('Fetching components.json...')
          const response = await fetch('/components.json')
          if (!response.ok) {
            throw new Error('Failed to fetch components.json')
          }
          const folderData: Folder[] = await response.json()
          if (!Array.isArray(folderData)) {
            throw new Error('Invalid data format: components.json must be an array')
          }
          console.log('Fetched components.json:', folderData)
    
          // Step 2: Fetch existing components from the API (database)
          console.log('Fetching existing components from API...')
          const apiResponse = await fetch('/api/components')
          if (!apiResponse.ok) {
            throw new Error('Failed to fetch components from API')
          }
          const apiComponents: Component[] = await apiResponse.json()
          if (!Array.isArray(apiComponents)) {
            throw new Error('Invalid data format: API components must be an array')
          }
          console.log('Fetched existing components from API:', apiComponents)
    
          // Step 3: Identify and delete components in the database not in components.json
          console.log('Identifying components that need to be deleted...')
          const componentsFromJson = folderData.flatMap(folder =>
            folder.components.map(componentName => ({
              componentName,
              folderName: folder.folderName
            }))
          )
    
          if (!Array.isArray(componentsFromJson)) {
            throw new Error('Failed to process components.json into a valid format')
          }
    
          for (const apiComponent of apiComponents) {
            const existsInJson = componentsFromJson.some(
              (jsonComp) => jsonComp.componentName === apiComponent.componentName && jsonComp.folderName === apiComponent.folderName
            )
    
            if (!existsInJson) {
              // Delete component from database if it doesn't exist in components.json
              console.log(`Deleting component: ${apiComponent.componentName} from folder: ${apiComponent.folderName}`)
              await this.deleteComponent(apiComponent.id)
            }
          }
    
          // Step 4: Sync (Upsert) components from components.json to the database
          console.log('Syncing components from components.json to the API...')
          for (const folder of folderData) {
            for (const componentName of folder.components) {
              const existingComponent = apiComponents.find(
                (comp) => comp.componentName === componentName && comp.folderName === folder.folderName
              )
    
              const componentData = {
                id: existingComponent ? existingComponent.id : 0, // Use 0 for new components
                componentName,
                folderName: folder.folderName,
                createdAt: existingComponent?.createdAt || new Date(),
                updatedAt: new Date(),
                isWorking: existingComponent?.isWorking || true,
                underConstruction: existingComponent?.underConstruction || false,
                isBroken: existingComponent?.isBroken || false,
                title: existingComponent?.title || null,
                notes: existingComponent?.notes || null,
              }
    
              await this.createOrUpdateComponent(componentData as Component, existingComponent ? 'update' : 'create')
            }
          }
    
          console.log('Components initialization complete!')
    
        } catch (error) {
          console.error('Error during initialization:', error)
          throw new Error(`Initialization failed: ${error}`)
        }
      }, ErrorType.GENERAL_ERROR, 'Error initializing components')
    },
    

    // Fetch all components from the API with error handling
    async fetchAllComponents() {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        console.log('Fetching all components from API...')
        const response = await fetch('/api/components')
        if (!response.ok) {
          throw new Error('Failed to fetch components.')
        }
        const data: Component[] = await response.json()
        this.components = data
        console.log('Components fetched successfully:', this.components)
      }, ErrorType.NETWORK_ERROR, 'Error fetching all components')
    },

    // Create or update a component in the database with error handling
    async createOrUpdateComponent(component: Component, action: 'create' | 'update') {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        console.log(`${action === 'create' ? 'Creating' : 'Updating'} component: ${component.componentName}`)
        const response = await fetch('/api/components', {
          method: action === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })

        if (!response.ok) {
          throw new Error(
            `${action === 'create' ? 'Create' : 'Update'} component failed: ${response.statusText}`
          )
        }

        if (action === 'create') {
          const newComponent = await response.json()
          this.components.push(newComponent) // Add the new component to the store
          console.log(
            `Component ${newComponent.componentName} created successfully with ID: ${newComponent.id}`
          )
          return newComponent
        } else {
          // Update the component in the store
          const index = this.components.findIndex((comp) => comp.id === component.id)
          if (index !== -1) {
            this.components[index] = component // Update the store component
          }
          console.log(`Component ${component.componentName} updated successfully`)
        }
      }, ErrorType.GENERAL_ERROR, `Error ${action === 'create' ? 'creating' : 'updating'} component`)
    },
    clearSelectedComponent() {
      this.selectedComponent = null
    },
    // Delete a specific component by ID with error handling
    async deleteComponent(id: number) {
      const errorStore = useErrorStore()
      return errorStore.handleError(async () => {
        console.log(`Deleting component with ID: ${id}`)
        const response = await fetch(`/api/components/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete component with id: ${id}`)
        }
        this.components = this.components.filter(c => c.id !== id) // Remove from the store
        console.log(`Component with ID ${id} deleted successfully`)
      }, ErrorType.GENERAL_ERROR, `Error deleting component with ID ${id}`)
    },
  },
})
