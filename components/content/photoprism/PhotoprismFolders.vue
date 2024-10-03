<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">PhotoPrism Folders</h1>

    <button
      class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      :disabled="loading"
      @click="fetchFolders"
    >
      Fetch Folders
    </button>

    <!-- Loading Message -->
    <div v-if="loading" class="mt-4 text-gray-500">Loading...</div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-4 text-red-500">{{ errorMessage }}</div>

    <!-- Folders List -->
    <ul v-if="folders.length > 0" class="mt-6">
      <li
        v-for="folder in folders"
        :key="folder.filename"
        class="py-2 border-b border-gray-200"
      >
        {{ folder.basename }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Define Folder type for better type safety
interface Folder {
  filename: string
  basename: string
}

// Reactive state
const folders = ref<Folder[]>([])
const errorMessage = ref('')
const loading = ref(false)

// Fetch folders from the PhotoPrism WebDAV API
const fetchFolders = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${import.meta.env.PHOTOPRISM_WEBDAV_URL}/remote.php/webdav/`,
      {
        method: 'PROPFIND', // WebDAV uses PROPFIND to list directories
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.PHOTOPRISM_USER + ':' + import.meta.env.PHOTOPRISM_PASSWORD)}`,
          Depth: '1', // Adjust depth depending on how deep you want to fetch folders
        },
      },
    )

    if (response.ok) {
      const textData = await response.text() // WebDAV returns XML, parse it manually or use an XML parser
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(textData, 'application/xml')
      const folderElements = Array.from(
        xmlDoc.getElementsByTagName('d:response'),
      )

      // Extract folder details from XML
      folders.value = folderElements.map((folder) => ({
        filename: folder.getElementsByTagName('d:href')[0].textContent || '',
        basename:
          folder.getElementsByTagName('d:displayname')[0]?.textContent ||
          'Unnamed Folder',
      }))
    } else {
      errorMessage.value = 'Failed to retrieve folders.'
    }
  } catch (error) {
    errorMessage.value = `An error occurred while fetching the folders: ${error}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Tailwind handles styling */
</style>
