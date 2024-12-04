<template>
  <div class="h-screen w-full bg-base-200 p-6 flex flex-col space-y-6">
    <!-- Error Display -->
    <div v-if="error" class="bg-red-500 text-white p-4 rounded-lg">
      <p>{{ error }}</p>
      <button
        class="mt-2 bg-white text-red-500 px-4 py-2 rounded"
        @click="clearError"
      >
        Dismiss
      </button>
    </div>

    <!-- Character Options -->
    <character-options />

    <!-- Layout for Character Content -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <p class="text-lg text-gray-700">Loading character...</p>
    </div>
    <div v-else class="space-y-6">
      <character-title />
      <character-goals />
      <character-stats />
      <character-art />
      <character-bottom />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()
const error = ref<string | null>(null)
const isLoading = ref(false)

// Clear error
function clearError() {
  error.value = null
}

onMounted(() => {
  if (characterStore.selectedCharacter) {
    // Initialize with the currently selected character
  }
})
</script>
