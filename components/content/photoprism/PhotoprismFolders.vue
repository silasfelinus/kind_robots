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

    <div v-if="loading" class="mt-4 text-gray-500">Loading...</div>
    <div v-if="errorMessage" class="mt-4 text-red-500">{{ errorMessage }}</div>

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

// Reactive state
const folders = ref([])
const errorMessage = ref('')
const loading = ref(false)

// Fetch folders from the API
const fetchFolders = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/photoprism')
    const data = await response.json()

    if (data.success) {
      folders.value = data.data
    } else {
      errorMessage.value = data.message || 'Failed to retrieve folders.'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while fetching the folders.' + error
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* No custom styles needed, Tailwind handles everything */
</style>
