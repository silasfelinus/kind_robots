import { defineStore } from 'pinia'

// Updated Folder interface to use Component[]
interface Folder {
  folderName: string
  components: Component[] // Array of Component objects instead of strings
}

interface Component {
  id: number
  componentName: string
  folderName: string
  channelId: number | null
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
    folders: [] as Folder[], // Folder structure from JSON with components as objects
    folderNames: [] as string[], // Dynamic list of folder names
    lastFetched: null as string | null, // ISO format date of last fetch
    selectedComponent: null as Component | null, // Full Component object for the selected component
    components: [] as Component[], // Flat list of all Component objects for ease of lookup
  }),

  getters: {
    // Get the current selected component
    getSelectedComponent: (state) => state.selectedComponent,

    // Dynamically calculate folder names from the folders array
    folderNames(state) {
      return state.folders.map((folder) => folder.folderName)
    },

    // Get folders as an array of objects with folderName and Component objects
    groupedFolders(state) {
      return state.folders
    },

    // Get all components in a flat array
    allComponents(state) {
      return state.folders.flatMap((folder) => folder.components)
    },
  },

  actions: {
    // Initialization function that syncs with the database and components.json
    async initializeComponentStore() {
      try {
        // Fetch existing components from the database
        const dbResponse = await fetch('/api/components')
        if (!dbResponse.ok)
          throw new Error('Failed to fetch components from the database')
        const dbComponents: Component[] = await dbResponse.json()

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

    // Select a component
    setSelectedComponent(component: Component) {
      this.selectedComponent = component
      localStorage.setItem('selectedComponent', JSON.stringify(component)) // Persist to localStorage
    },

    // Function to retrieve the default component from localStorage
    loadDefaultComponent() {
      const storedComponent = localStorage.getItem('selectedComponent')
      if (storedComponent) {
        try {
          this.selectedComponent = JSON.parse(storedComponent) as Component
        } catch (error) {
          console.error(
            'Failed to load selected component from localStorage:',
            error,
          )
        }
      }
    },

    // Fetch components for a specific folder
    async fetchComponentList(folderName: string) {
      try {
        const response = await fetch(`/api/folders/${folderName}/components`)
        const data = await response.json()

        if (data.success) {
          // Push folder data with full Component objects
          const folderData = {
            folderName,
            components: data.components as Component[],
          }
          this.folders.push(folderData)
        } else {
          throw new Error('Failed to fetch components')
        }
      } catch (error) {
        console.error('Error fetching components:', error)
      }
    },

    // Sync the database with components.json
    async syncDatabaseWithJSON(
      dbComponents: Component[],
      jsonFolders: Folder[],
    ) {
      try {
        const jsonComponents = jsonFolders.flatMap(
          (folder) => folder.components,
        )

        // Add missing components
        for (const jsonComponent of jsonComponents) {
          if (
            !dbComponents.some(
              (dbComp) => dbComp.componentName === jsonComponent.componentName,
            )
          ) {
            await this.createOrUpdateComponent(jsonComponent)
          }
        }

        // Remove components no longer in JSON
        for (const dbComponent of dbComponents) {
          if (
            !jsonComponents.some(
              (jsonComp) =>
                jsonComp.componentName === dbComponent.componentName,
            )
          ) {
            await this.deleteComponent(dbComponent.componentName)
          }
        }
      } catch (error) {
        console.error('Error syncing database with components.json:', error)
      }
    },

    // Create or update a component in the database
    async createOrUpdateComponent(component: Component) {
      try {
        const response = await fetch('/api/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })

        if (response.status === 409) {
          // Conflict, update existing component
          await this.updateComponent(component)
        } else if (!response.ok) {
          throw new Error(`Failed to create component: ${response.statusText}`)
        }

        console.log(
          `Component ${component.componentName} processed successfully`,
        )
      } catch (error) {
        console.error('Error creating or updating component:', error)
      }
    },

    // API call to update a component in the database
    async updateComponent(component: Component) {
      try {
        const response = await fetch(
          `/api/components/${component.componentName}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(component),
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to update component: ${response.statusText}`)
        }

        console.log(`Component ${component.componentName} updated successfully`)
      } catch (error) {
        console.error('Error updating component in the database:', error)
      }
    },

    // API call to delete a component from the database
    async deleteComponent(componentName: string) {
      try {
        const response = await fetch(`/api/components/${componentName}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete component: ${response.statusText}`)
        }

        // Remove the component from the store
        this.components = this.components.filter(
          (c) => c.componentName !== componentName,
        )
        this.folders = this.folders.map((folder) => ({
          ...folder,
          components: folder.components.filter(
            (c) => c.componentName !== componentName,
          ),
        }))

        console.log(`Component ${componentName} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
