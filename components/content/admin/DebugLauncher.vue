<template>
  <div
    class="fixed bottom-10 right-10 z-50 p-4 bg-gray-800 rounded-lg shadow-lg"
  >
    <h2 class="text-lg text-white font-bold mb-2">Debug Launcher</h2>
    <div class="flex flex-col space-y-2">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        @click="showStoreDebug = !showStoreDebug"
      >
        Toggle Store Debug
      </button>
      <button
        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        @click="showScreenDebug = !showScreenDebug"
      >
        Toggle Screen Debug
      </button>
    </div>

    <!-- Conditionally show store-debug or screen-debug -->
    <store-debug v-if="showStoreDebug" />
    <screen-debug v-if="showScreenDebug" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Use refs to control visibility of the debug components
const showStoreDebug = ref(false)
const showScreenDebug = ref(false)
</script>

<style scoped>
/* Minimal styling to make the debug launcher float at the bottom right */
</style>
