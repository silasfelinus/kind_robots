import { defineStore } from 'pinia'

interface Folder {
  folderName: string
  components: string[] // Array of component names
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    folders: [] as Folder[], // Folder structure from JSON
    folderNames: [] as string[], // Dynamic list of folder names
    lastFetched: null as string | null, // ISO format date of last fetch
    currentComponent: null as string | null, // Default current component (name)
    components: [] as string[] // Flat list of component names for ease of lookup
  }),

  getters: {
    // Get the current component (by name)
    getCurrentComponent: (state) => state.currentComponent,

    // Dynamically calculate folder names from the folders array
    folderNames(state) {
      return state.folders.map(folder => folder.folderName)
    },

    // Get folders as an array of objects with folderName and component names
    groupedFolders(state) {
      return state.folders
    },

    // Get all components in a flat array
    allComponents(state) {
      return state.folders.reduce((acc, folder) => {
        return acc.concat(folder.components)
      }, [] as string[])
    }
  },

  actions: {
    // Initialization function that syncs with the database and components.json
    async initializeComponentStore() {
      try {
        // Fetch existing components from the database (as strings)
        const dbResponse = await fetch('/api/components')
        if (!dbResponse.ok) throw new Error('Failed to fetch components from the database')
        const dbComponents: string[] = await dbResponse.json()

        // Fetch components.json
        let jsonFolders: Folder[] = []
        try {
          const jsonResponse = await fetch('/components.json')
          if (!jsonResponse.ok) throw new Error('components.json not found')
          jsonFolders = await jsonResponse.json()
        } catch {
          console.warn('components.json not found')
        }

        // Sync the database with components.json
        await this.syncDatabaseWithJSON(dbComponents, jsonFolders)

        // Update store with folders and components
        this.folders = jsonFolders
        this.components = this.allComponents // Flat list of all components for easier lookup

        console.log('ComponentStore initialized successfully')
      } catch (error) {
        console.error('Error initializing componentStore:', error)
      }
    },

    // Select a default component for syntactic sugar
    setCurrentComponent(componentName: string) {
      this.currentComponent = componentName
      localStorage.setItem('currentComponent', componentName) // Persist to localStorage
    },

    // Function to retrieve the default component from localStorage
    loadDefaultComponent() {
      const storedComponent = localStorage.getItem('currentComponent')
      if (storedComponent) {
        this.currentComponent = storedComponent
      }
    },

    // Sync the database with components.json
    async syncDatabaseWithJSON(dbComponents: string[], jsonFolders: Folder[]) {
      try {
        // Flatten the JSON components into a single array
        const jsonComponents = jsonFolders.flatMap(folder => folder.components)

        // Compare and update the database based on the components.json
        for (const jsonComponent of jsonComponents) {
          if (!dbComponents.includes(jsonComponent)) {
            // Create component in the database if it doesn't exist
            await this.createOrUpdateComponent(jsonComponent)
          }
        }

        // Remove components in the database that are no longer in components.json
        for (const dbComponent of dbComponents) {
          if (!jsonComponents.includes(dbComponent)) {
            await this.deleteComponent(dbComponent) // Delete by component name
          }
        }
      } catch (error) {
        console.error('Error syncing database with components.json:', error)
      }
    },

    // Create or update a component in the database (by name)
    async createOrUpdateComponent(componentName: string) {
      try {
        const response = await fetch('/api/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentName }),
        })

        if (response.status === 409) { // Conflict, update existing component
          await this.updateComponent(componentName)
        } else if (!response.ok) {
          throw new Error(`Failed to create component: ${response.statusText}`)
        }

        console.log(`Component ${componentName} processed successfully`)
      } catch (error) {
        console.error('Error creating or updating component:', error)
      }
    },

    // API call to update a component in the database (by name)
    async updateComponent(componentName: string) {
      try {
        const response = await fetch(`/api/components/${componentName}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentName }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update component: ${response.statusText}`)
        }

        console.log(`Component ${componentName} updated successfully`)
      } catch (error) {
        console.error('Error updating component in the database:', error)
      }
    },

    // API call to delete a component from the database (by name)
    async deleteComponent(componentName: string) {
      try {
        const response = await fetch(`/api/components/${componentName}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete component: ${response.statusText}`)
        }

        // Remove the component from the store
        this.components = this.components.filter(c => c !== componentName)
        this.folders = this.groupedFolders // Recalculate folders

        console.log(`Component ${componentName} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
