<!-- /components/content/weird/generation-toggle.vue -->
<template>
  <button
    class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2 transition-all duration-300"
    @click="toggleGenerationMode"
  >
    <span>{{ buttonText }}</span>
    <svg
      v-if="!characterStore.generationMode"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      class="w-5 h-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13 16h-1v-4H9m4-4h1v4h2m-4 0h1v4h-2m5 4H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z"
      />
    </svg>
    <svg
      v-if="characterStore.generationMode"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      class="w-5 h-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13.828 11H20a1 1 0 010 2h-6.172l3.536 3.536a1 1 0 11-1.414 1.414L11 12l4.95-4.95a1 1 0 011.414 1.414L13.828 11z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';

const characterStore = useCharacterStore();

function toggleGenerationMode() {
  characterStore.generationMode = !characterStore.generationMode;
}

const buttonText = computed(() =>
  characterStore.generationMode ? 'Disable Generation' : 'Enable Generation'
);
</script>

<style scoped>
/* Optionally add hover effects or transitions */
</style>
