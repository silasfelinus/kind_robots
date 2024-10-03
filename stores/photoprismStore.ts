import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Define Folder interface for type safety
interface Folder {
  filename: string
  basename: string
}

// Create the PhotoPrism store
export const usePhotoprismStore = defineStore('photoprism', () => {
  // State variables
  const folders = ref<Folder[]>([])
  const errorMessage = ref('')
  const loading = ref(false)

  // LocalStorage key
  const localStorageKey = 'photoprismFolders'

  // Save folders to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(folders.value))
  }

  // Load folders from localStorage
  const loadFromLocalStorage = () => {
    const storedFolders = localStorage.getItem(localStorageKey)
    if (storedFolders) {
      folders.value = JSON.parse(storedFolders) as Folder[]
    }
  }

  // Fetch folders from the PhotoPrism WebDAV API
  const fetchFolders = async () => {
    loading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${import.meta.env.PHOTOPRISM_WEBDAV_URL}/remote.php/webdav/`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${btoa(import.meta.env.PHOTOPRISM_USER + ':' + import.meta.env.PHOTOPRISM_PASSWORD)}`,
          'Depth': '1', // Fetch folders at depth 1
        },
      })

      if (response.ok) {
        const textData = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(textData, 'application/xml')
        const folderElements = Array.from(xmlDoc.getElementsByTagName('d:response'))

        // Extract and store folder data
        folders.value = folderElements.map((folder) => ({
          filename: folder.getElementsByTagName('d:href')[0].textContent || '',
          basename: folder.getElementsByTagName('d:displayname')[0]?.textContent || 'Unnamed Folder',
        }))
        saveToLocalStorage() // Save to localStorage after fetching
      } else {
        errorMessage.value = 'Failed to retrieve folders.'
      }
    } catch (error) {
      errorMessage.value = `An error occurred while fetching folders: ${error}`
    } finally {
      loading.value = false
    }
  }

  // Load folders from localStorage on store initialization
  loadFromLocalStorage()

  // Watch for changes to folders and automatically save to localStorage
  watch(folders, saveToLocalStorage)

  return {
    folders,
    errorMessage,
    loading,
    fetchFolders,
    loadFromLocalStorage,
    saveToLocalStorage,
  }
})
