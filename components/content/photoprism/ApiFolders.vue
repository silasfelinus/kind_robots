<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">PhotoPrism Folders via API</h2>

    <!-- Fetch Folders Button -->
    <button
      class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4"
      :disabled="loading"
      @click="fetchFolders"
    >
      Fetch Folders
    </button>

    <!-- Loading Message -->
    <div v-if="loading" class="text-gray-500">Loading...</div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

    <!-- Folder List -->
    <ul v-if="folders.length > 0" class="mt-6">
      <li
        v-for="folder in folders"
        :key="folder.filename"
        class="py-2 border-b border-gray-200"
      >
        {{ folder.basename || folder.filename }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Folder {
  filename: string
  basename: string
}

// Reactive state
const folders = ref<Folder[]>([])
const loading = ref(false)
const errorMessage = ref('')

// Fetch folders from the backend API
const fetchFolders = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/photoprism') // Adjust the API route as necessary

    if (!response.ok) {
      throw new Error('Failed to retrieve folders from the API.')
    }

    const data = await response.json()

    if (data.success) {
      folders.value = data.data // Populate folders array from the API response
    } else {
      errorMessage.value = data.message || 'Failed to retrieve folders.'
    }
  } catch (error) {
    errorMessage.value = `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Basic styling handled by Tailwind */
</style>
