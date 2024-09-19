import { defineStore } from 'pinia'

// Define the Component interface
interface Component {
  id: number
  componentName: string
  folderName: string
  channelId?: number | null
  createdAt: Date
  updatedAt: Date | null
  isWorking: boolean
  underConstruction: boolean
  isBroken: boolean
  title: string | null
  notes: string | null
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    components: [] as Component[], // Flat list of all Component objects for ease of lookup
    selectedComponent: null as Component | null, // Full Component object for the selected component
  }),

  getters: {
    // Get the current selected component
    getSelectedComponent: (state) => state.selectedComponent,

    // Get all components in a flat array
    allComponents(state) {
      return state.components
    },
  },

  actions: {
    // Fetch all components from the API
    async fetchAllComponents() {
      try {
        const response = await fetch('/api/components')
        if (!response.ok) {
          throw new Error('Failed to fetch components.')
        }
        const data: Component[] = await response.json()
        this.components = data
        console.log('Components fetched successfully:', this.components)
      } catch (error) {
        console.error('Error fetching components:', error)
      }
    },

    // Fetch a specific component by ID
    async fetchComponentById(id: number) {
      try {
        const response = await fetch(`/api/components/${id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch component with id: ${id}`)
        }
        const component = await response.json()
        this.selectedComponent = component
        return component
      } catch (error) {
        console.error('Error fetching component by ID:', error)
        throw error
      }
    },

    // Find a component by name
    async findComponentByName(folderName: string, componentName: string) {
      try {
        // Fetch the component from the API based on folder name
        const response = await fetch(`/api/components/${folderName}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch components from folder "${folderName}".`)
        }

        const { components } = await response.json()

        // Find the specific component by name
        const foundComponent = components.find(
          (comp: Component) => comp.componentName === componentName
        )

        if (foundComponent) {
          // If found, set it as the selected component
          this.setSelectedComponent(foundComponent)
          return foundComponent
        } else {
          throw new Error(`Component "${componentName}" not found in folder "${folderName}".`)
        }
      } catch (error) {
        console.error(`Error finding component by name:`, error)
        throw error
      }
    },

    // Set the selected component
    setSelectedComponent(component: Component) {
      this.selectedComponent = component
    },

    // Create or update a component in the database
    async createOrUpdateComponent(component: Component, action: 'create' | 'update') {
      try {
        const response = await fetch('/api/components', {
          method: action === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })

        if (!response.ok) {
          throw new Error(`${action === 'create' ? 'Create' : 'Update'} component failed: ${response.statusText}`)
        }

        if (action === 'create') {
          const newComponent = await response.json()
          this.components.push(newComponent) // Add the new component to the store
          console.log(`Component ${newComponent.componentName} created successfully with ID: ${newComponent.id}`)
          return newComponent
        } else {
          console.log(`Component ${component.componentName} updated successfully`)
        }
      } catch (error) {
        console.error(`Error ${action === 'create' ? 'creating' : 'updating'} component:`, error)
        throw error
      }
    },

    // Delete a specific component by ID
    async deleteComponent(id: number) {
      try {
        const response = await fetch(`/api/components/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete component with id: ${id}`)
        }
        this.components = this.components.filter(c => c.id !== id) // Remove from the store
        console.log(`Component with ID ${id} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
