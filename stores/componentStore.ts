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
  }),

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
        } catch {
          console.warn('components.json not found, generating it now...')
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

    // Function to sync the database with components.json
    async syncDatabaseWithJSON(dbComponents: Component[], jsonComponents: Folder[]) {
      try {
        // Compare and update the database based on the components.json (bible)
        for (const jsonFolder of jsonComponents) {
          for (const jsonComponent of jsonFolder.components) {
            const dbComponent = dbComponents.find(
              component => component.componentName === jsonComponent.componentName && 
                           jsonFolder.folderName === component.folderName
            )

            // If component doesn't exist in the database, create it
            if (!dbComponent) {
              await this.createComponentInDatabase(jsonFolder.folderName, jsonComponent)
            } else {
              // Update component if it exists but is different
              await this.updateComponentInDatabase(dbComponent, jsonComponent)
            }
          }
        }

        // Remove components in the database that are no longer in components.json
        for (const dbComponent of dbComponents) {
          const jsonFolder = jsonComponents.find(folder => 
            folder.components.some(component => component.componentName === dbComponent.componentName))

          if (!jsonFolder) {
            await this.deleteComponentFromDatabase(dbComponent.id) // Delete by id
          }
        }
      } catch (error) {
        console.error('Error syncing database with JSON:', error)
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

    // API call to create a component in the database
    async createComponentInDatabase(folderName: string, component: Component) {
      try {
        await fetch(`/api/components/${folderName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(component),
        })
      } catch (error) {
        console.error('Error creating component in database:', error)
      }
    },

    // API call to update a component in the database (by ID)
    async updateComponentInDatabase(dbComponent: Component, jsonComponent: Component) {
      try {
        if (JSON.stringify(dbComponent) !== JSON.stringify(jsonComponent)) {
          await fetch(`/api/components/${dbComponent.id}`, { // Patch by id
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonComponent),
          })
        }
      } catch (error) {
        console.error('Error updating component in database:', error)
      }
    },

    // API call to delete a component from the database (by ID)
    async deleteComponentFromDatabase(componentId: number) {
      try {
        await fetch(`/api/components/${componentId}`, { // Delete by id
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error deleting component from database:', error)
      }
    },
  },
})
