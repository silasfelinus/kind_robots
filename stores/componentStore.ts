import { defineStore } from 'pinia'
import type { Component } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

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
  }),

  getters: {
    // Getter to return the current component (if selected)
    getCurrentComponent: (state) => state.currentComponent,
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
        let jsonComponents: Folder[]
        try {
          const jsonResponse = await fetch('/components.json')
          if (!jsonResponse.ok) throw new Error('components.json not found')
          jsonComponents = await jsonResponse.json()
        } catch (error) {
          console.warn('components.json not found, generating it now...', error)
          await this.generateComponentJSON()
          const jsonResponse = await fetch('/components.json')
          if (!jsonResponse.ok) throw new Error('Failed to fetch newly generated components.json')
          jsonComponents = await jsonResponse.json()
        }

        // 3. Sync database with components.json
        await this.syncDatabaseWithJSON(dbComponents, jsonComponents)

        // 4. Update localStorage
        localStorage.setItem('components', JSON.stringify(jsonComponents))
        this.folders = jsonComponents // Update store state

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
    async syncDatabaseWithJSON(dbComponents: Component[], jsonComponents: Folder[]) {
      try {
        // Compare and update the database based on the components.json (bible)
        for (const jsonFolder of jsonComponents) {
          for (const jsonComponent of jsonFolder.components) {
            const dbComponent = dbComponents.find(
              component =>
                component.componentName === jsonComponent.componentName &&
                jsonFolder.folderName === component.folderName
            )

            // If component doesn't exist in the database, create it
            if (!dbComponent) {
              await this.createOrUpdateComponent(jsonComponent)
            } else {
              // Update component if it exists but is different
              await this.updateComponent(dbComponent, jsonComponent)
            }
          }
        }

        // Remove components in the database that are no longer in components.json
        for (const dbComponent of dbComponents) {
          const jsonFolder = jsonComponents.find(folder =>
            folder.components.some(component => component.componentName === dbComponent.componentName)
          )

          if (!jsonFolder) {
            await this.deleteComponent(dbComponent.id) // Delete by id
          }
        }
      } catch (error) {
        console.error('Error syncing database with components.json:', error)
      }
    },

    // Function to generate the components.json file if it doesn't exist
    async generateComponentJSON() {
      try {
        const componentPath = path.resolve(process.cwd(), 'components/content')
        const folderNames = await fs.readdir(componentPath)
        const folders = []

        for (const folderName of folderNames) {
          const folderPath = path.join(componentPath, folderName)
          const stat = await fs.stat(folderPath)

          if (stat.isDirectory()) {
            const componentFiles = await fs.readdir(folderPath)
            const components = componentFiles
              .filter((file) => file.endsWith('.vue'))
              .map((file) => file.replace('.vue', ''))
            folders.push({ folderName, components })
          }
        }

        const outputPath = path.resolve(process.cwd(), 'public/components.json')
        await fs.writeFile(outputPath, JSON.stringify(folders, null, 2))
        console.log('Component JSON generated successfully:', outputPath)
      } catch (error) {
        console.error('Failed to generate component JSON:', error)
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
          const existingComponent = await response.json()
          await this.updateComponent(existingComponent, component)
        } else if (!response.ok) {
          throw new Error(`Failed to create component: ${response.statusText}`)
        }

        console.log(`Component ${component.componentName} processed successfully`)
      } catch (error) {
        console.error('Error creating or updating component:', error)
      }
    },

    // API call to update a component in the database (by ID)
    async updateComponent(dbComponent: Component, jsonComponent: Component) {
      try {
        if (JSON.stringify(dbComponent) !== JSON.stringify(jsonComponent)) {
          const response = await fetch(`/api/components/${dbComponent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonComponent),
          })
          if (!response.ok) {
            throw new Error(`Failed to update component: ${response.statusText}`)
          }
          console.log(`Component ${dbComponent.componentName} updated successfully`)
        }
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
        console.log(`Component with ID ${componentId} deleted successfully`)
      } catch (error) {
        console.error('Error deleting component from the database:', error)
      }
    },
  },
})
