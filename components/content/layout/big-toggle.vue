<template>
  <div class="relative z-50 p-1">
    <button
      class="w-8 h-8 rounded-2xl font-semibold bg-primary text-secondary flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleBigMode"
    >
      <span
        class="toggle-icon text-secondary"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        "
      >
        {{ iconText }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore
const displayStore = useDisplayStore()

// Dynamic icon text for the button
const iconText = computed(() => (displayStore.bigMode ? '-' : '+'))

// Toggle BigMode in the displayStore
const toggleBigMode = () => {
  displayStore.toggleBigMode()
}
</script>
