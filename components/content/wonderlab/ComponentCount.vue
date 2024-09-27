<template>
  <div class="component-count">
    <h1 class="count-title">🗃️ Total Components in Database:</h1>
    <h2 class="count-number">{{ componentCount }}</h2>
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

<style scoped>
.component-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0; /* Light background for contrast */
  padding: 50px;
  border: 2px solid #333; /* Brutalist border */
  border-radius: 8px; /* Optional: Rounded corners */
}

.count-title {
  font-size: 48px; /* Big friendly letters */
  font-family: 'Courier New', Courier, monospace; /* Monospace for a brutalist look */
  color: #333; /* Dark color for contrast */
  margin-bottom: 20px;
}

.count-number {
  font-size: 72px; /* Even bigger for emphasis */
  font-weight: bold;
  color: #e63946; /* Bright color for visibility */
  font-family: 'Courier New', Courier, monospace; /* Monospace for consistency */
}
</style>
