import { defineStore } from 'pinia'

interface Folder {
  folderName: string
  components: string[]
}

export const useComponentStore = defineStore('componentStore', {
  state: () => ({
    folders: [] as Folder[],
    folderNames: [] as string[],
  }),
  actions: {
    async fetchComponentList(folderName: string) {
      try {
        const response = await fetch(`/api/components/${folderName}`)
        if (!response.ok) {
          throw new Error('API request failed')
        }
        const { response: componentList } = await response.json()
        this.folders.push({ folderName, components: componentList })
      } catch (error) {
        console.error('Failed to fetch component list from API:', error)
        // Fallback to local JSON file if API fails
        await this.loadFallbackData()
        const folder = this.folders.find(
          (folder) => folder.folderName === folderName,
        )
        if (folder) {
          console.log('Loaded component list from fallback')
        } else {
          console.warn(
            'No component list found in fallback data for folder:',
            folderName,
          )
        }
      }
    },
    async fetchFolderNames() {
      try {
        const response = await fetch('/api/utils/folderNames')
        if (!response.ok) {
          throw new Error('API request failed')
        }
        const { response: folderNames } = await response.json()
        this.folderNames = folderNames
      } catch (error) {
        console.error('Failed to fetch folder names from API:', error)
        // Fallback to local JSON file if API fails
        await this.loadFallbackData()
        this.folderNames = this.folders.map((folder) => folder.folderName)
        if (this.folderNames.length > 0) {
          console.log('Loaded folder names from fallback')
        } else {
          console.warn('No folder names found in fallback data')
        }
      }
    },
    async loadFallbackData() {
      try {
        const fallbackResponse = await fetch('/components.json')
        if (!fallbackResponse.ok) {
          throw new Error('Failed to load fallback data')
        }
        const fallbackData: Folder[] = await fallbackResponse.json()
        this.folders = fallbackData
      } catch (fallbackError) {
        console.error('Error loading fallback data:', fallbackError)
      }
    },
  },
})
