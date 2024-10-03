<template>
  <div>
    <button
      class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4"
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
    <ul v-if="folders.length > 0" class="mt-4">
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
import { usePhotoprismStore } from '@/stores/photoprismStore'
import { onMounted } from 'vue'

const photoPrismStore = usePhotoprismStore()

// Destructure the values from the store
const { folders, loading, errorMessage, fetchFolders } = photoPrismStore

// Fetch folders when component is mounted
onMounted(async () => {
  await fetchFolders()
})
</script>

<style scoped>
/* Basic styling handled by Tailwind */
</style>
