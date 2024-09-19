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
    lastFetched: null as string | null, // ISO format date of last fetch
    selectedComponent: null as Component | null, // Full Component object for the selected component
    components: [] as Component[], // Flat list of all Component objects for ease of lookup
    selectedComponents: [] as Component[], // Manage selected components in the store
  }),

  getters: {
    // Get the current selected component
    getSelectedComponent: (state) => state.selectedComponent,

    // Dynamically calculate folder names from the folders array
    folderNames(state) {
      return state.folders.map((folder) => folder.folderName)
    },

    // Get all components in a flat array
    allComponents(state) {
      return state.folders.flatMap((folder) => folder.components)
    },
  },

  actions: {
    async fetchComponentList(folderName: string) {
      const folder = this.folders.find((f) => f.folderName === folderName)
      if (folder) {
        this.$patch({
          selectedComponents: folder.components, // Update state using $patch for better reactivity tracking
        })
      } else {
        console.error(`Folder ${folderName} not found`)
        this.$patch({
          selectedComponents: [] // Clear if not found
        })
      }
    },

    clearSelectedComponents() {
      this.$patch({
        selectedComponents: []
      })
    },

    // Initialization function that syncs with the database and components.json
    async initializeComponentStore() {
      try {
        // Fetch components.json
        const jsonResponse = await fetch('/components.json')
        if (!jsonResponse.ok) throw new Error('components.json not found')
        const jsonFolders: Folder[] = await jsonResponse.json()

        // Update store with folders and components
        this.$patch({
          folders: jsonFolders,
          components: this.allComponents // Flat list of all components for easier lookup
        })

        console.log('ComponentStore initialized successfully')
      } catch (error) {
        console.error('Error initializing componentStore:', error)
      }
    },

    // Select a component
    setSelectedComponent(component: Component) {
      this.$patch({
        selectedComponent: component
      })
    },

    // Deselect the component
    clearSelectedComponent() {
      this.$patch({
        selectedComponent: null
      })
    },

    // Function to retrieve the default component from localStorage
    loadDefaultComponent() {
      const storedComponent = localStorage.getItem('selectedComponent')
      if (storedComponent) {
        try {
          this.$patch({
            selectedComponent: JSON.parse(storedComponent) as Component
          })
        } catch (error) {
          console.error(
            'Failed to load selected component from localStorage:',
            error,
          )
        }
      }
    },

    // Sync the database with components.json
    async syncDatabaseWithJSON(
      dbComponents: Component[],
      jsonFolders: Folder[],
    ) {
      try {
        // Flatten the components from JSON folders
        const jsonComponents = jsonFolders.flatMap((folder) => folder.components)

        // Add or update missing components
        for (const jsonComponent of jsonComponents) {
          const existingComponent = dbComponents.find(
            (dbComp) =>
              dbComp.componentName === jsonComponent.componentName &&
              dbComp.folderName === jsonComponent.folderName
          )

          if (!existingComponent) {
            await this.createOrUpdateComponent(jsonComponent, 'create')
          } else {
            // Update existing components if they differ in any significant property
            if (
              existingComponent.isWorking !== jsonComponent.isWorking ||
              existingComponent.underConstruction !== jsonComponent.underConstruction ||
              existingComponent.isBroken !== jsonComponent.isBroken ||
              existingComponent.notes !== jsonComponent.notes
            ) {
              await this.createOrUpdateComponent(jsonComponent, 'update')
            }
          }
        }

        // Remove components no longer in JSON
        for (const dbComponent of dbComponents) {
          const stillInJson = jsonComponents.some(
            (jsonComp) =>
              jsonComp.componentName === dbComponent.componentName &&
              jsonComp.folderName === dbComponent.folderName
          )

          if (!stillInJson) {
            await this.deleteComponent(dbComponent.componentName)
          }
        }
      } catch (error) {
        console.error('Error syncing database with components.json:', error)
      }
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
          throw new Error(
            `${action === 'create' ? 'Create' : 'Update'} component failed: ${response.statusText}`
          )
        }

        console.log(
          `Component ${component.componentName} ${action}d successfully`
        )
      } catch (error) {
        console.error(`Error ${action === 'create' ? 'creating' : 'updating'} component:`, error)
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
        this.$patch({
          components: this.components.filter(
            (c) => c.componentName !== componentName
          ),
          folders: this.folders.map((folder) => ({
            ...folder,
            components: folder.components.filter(
              (c) => c.componentName !== componentName
            ),
          }))
        })

        console.log(`Component ${componentName} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
