<template>
  <div
    class="component-count flex flex-col items-center justify-center bg-gray-200 p-10 border-4 border-gray-800 rounded-lg"
  >
    <h1 class="count-title text-4xl font-mono text-gray-800 mb-4">
      🗃️ Total Components in Database:
    </h1>
    <h2 class="count-number text-6xl font-bold text-red-500 font-mono">
      {{ componentCount }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'

// Access the component store
const componentStore = useComponentStore()

// Compute the total number of components
const componentCount = computed(() => componentStore.allComponents.length)
</script>
