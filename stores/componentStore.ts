import { defineStore } from 'pinia'
import type { Component } from '@prisma/client'

interface Folder {
  folderName: string
  components: Component[]
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    folders: [] as Folder[],
    folderNames: [] as string[],
    lastFetched: null as string | null, // ISO format date of the last fetch
    currentComponent: null as Component | null, // Default current component
    components: [] as Component[] // Flat list of components
  }),

  getters: {
    // Getter to return the current component (if selected)
    getCurrentComponent: (state) => state.currentComponent,

    // Dynamically calculate folder names from the components array
    folderNames(state) {
      return [...new Set(state.components.map(component => component.folderName))]
    },

    // Get folders by grouping components by folderName
    groupedFolders(state) {
      return state.components.reduce((folders: Folder[], component) => {
        let folder = folders.find(f => f.folderName === component.folderName)
        if (!folder) {
          folder = { folderName: component.folderName, components: [] }
          folders.push(folder)
        }
        folder.components.push(component)
        return folders
      }, [])
    }
  },

  actions: {
    // Initialization function that syncs with the database and components.json
    async initializeComponentStore() {
      try {
        // 1. Fetch existing components from the database
        const dbResponse = await fetch('/api/components')
        if (!dbResponse.ok) throw new Error('Failed to fetch components from the database')
        const dbComponents: Component[] = await dbResponse.json()

        // 2. Try to fetch components.json (bible)
        let jsonComponents: Component[] = []
        try {
          const jsonResponse = await fetch('/components.json')
          if (!jsonResponse.ok) throw new Error('components.json not found')
          jsonComponents = await jsonResponse.json()
        } catch {
          console.warn('components.json not found')
        }

        // 3. Sync database with components.json
        await this.syncDatabaseWithJSON(dbComponents, jsonComponents)

        // 4. Update store with components and folders
        this.components = dbComponents
        this.folders = this.groupedFolders // Derived from components

        console.log('ComponentStore initialized successfully')
      } catch (error) {
        console.error('Error initializing componentStore:', error)
      }
    },

    // Select a default component for syntactic sugar
    setCurrentComponent(component: Component) {
      this.currentComponent = component
      localStorage.setItem('currentComponent', JSON.stringify(component)) // Persist to localStorage
    },

    // Function to retrieve the default component from localStorage
    loadDefaultComponent() {
      const storedComponent = localStorage.getItem('currentComponent')
      if (storedComponent) {
        this.currentComponent = JSON.parse(storedComponent)
      }
    },

    // Function to sync the database with components.json
    async syncDatabaseWithJSON(dbComponents: Component[], jsonComponents: Component[]) {
      try {
        // Compare and update the database based on the components.json (bible)
        for (const jsonComponent of jsonComponents) {
          const dbComponent = dbComponents.find(
            component =>
              component.componentName === jsonComponent.componentName &&
              jsonComponent.folderName === component.folderName
          )

          // If component doesn't exist in the database, create it
          if (!dbComponent) {
            await this.createOrUpdateComponent(jsonComponent)
          } else {
            // Update component if it exists but is different
            await this.updateComponent(jsonComponent)
          }
        }

        // Remove components in the database that are no longer in components.json
        for (const dbComponent of dbComponents) {
          const jsonComponentExists = jsonComponents.some(
            jsonComponent => jsonComponent.componentName === dbComponent.componentName
          )
          if (!jsonComponentExists) {
            await this.deleteComponent(dbComponent.id) // Delete by id
          }
        }
      } catch (error) {
        console.error('Error syncing database with components.json:', error)
      }
    },

    // Fetch components for a specific folder
    async fetchComponentList(folderName: string) {
      try {
        const response = await fetch(`/api/components/folder/${folderName}`)
        if (!response.ok) throw new Error('Failed to fetch components for the folder')
        const folderComponents: Component[] = await response.json()

        // Filter the existing components to remove any from this folder
        this.components = this.components.filter(
          (component) => component.folderName !== folderName
        )

        // Add new components from the fetched folder
        this.components = [...this.components, ...folderComponents]

        // Update folders dynamically
        this.folders = this.groupedFolders
      } catch (error) {
        console.error('Error fetching component list:', error)
      }
    },

    // Create or update component if it already exists by folder and name
    async createOrUpdateComponent(component: Component) {
      try {
        const response = await fetch('/api/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })

        if (response.status === 409) { // Conflict, update the existing component
          await this.updateComponent(component)
        } else if (!response.ok) {
          throw new Error(`Failed to create component: ${response.statusText}`)
        }

        console.log(`Component ${component.componentName} processed successfully`)
      } catch (error) {
        console.error('Error creating or updating component:', error)
      }
    },

    // API call to update a component in the database (by ID)
    async updateComponent(updatedComponent: Component) {
      try {
        const response = await fetch(`/api/components/${updatedComponent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedComponent),
        })

        if (!response.ok) {
          throw new Error(`Failed to update component: ${response.statusText}`)
        }

        // Update the component in the store
        const componentIndex = this.components.findIndex(c => c.id === updatedComponent.id)
        if (componentIndex > -1) {
          this.components[componentIndex] = updatedComponent
        }

        this.folders = this.groupedFolders // Recalculate folders
        console.log(`Component ${updatedComponent.componentName} updated successfully`)
      } catch (error) {
        console.error('Error updating component in the database:', error)
      }
    },

    // API call to delete a component from the database (by ID)
    async deleteComponent(componentId: number) {
      try {
        const response = await fetch(`/api/components/${componentId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete component: ${response.statusText}`)
        }

        // Remove the component from store
        this.components = this.components.filter(c => c.id !== componentId)
        this.folders = this.groupedFolders // Recalculate folders

        console.log(`Component with ID ${componentId} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
