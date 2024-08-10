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
          throw new Error('Failed to fetch component list')
        }
        const { response: componentList } = await response.json()
        this.folders.push({ folderName, components: componentList })
      }
      catch (error) {
        console.error('Failed to fetch component list:', error)
      }
    },
    async fetchFolderNames() {
      try {
        const response = await fetch('/api/utils/folderNames')
        if (!response.ok) {
          throw new Error('Failed to fetch folder names')
        }
        const { response: folderNames } = await response.json()
        this.folderNames = folderNames
      }
      catch (error) {
        console.error('Failed to fetch folder names:', error)
      }
    },
  },
})
