<template>
  <div
    :class="expanded ? 'fixed inset-0 z-50' : 'relative'"
    class="transition-all duration-500 ease-in-out bg-secondary rounded-2xl p-4"
  >
    <!-- Slot for content (memory game in this case) -->
    <slot></slot>

    <!-- Slot for the toggle icon (placed in the corner) -->
    <slot name="icon"></slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const expanded = ref(false)

// Function to toggle the expansion of the parent container
const toggleExpand = () => {
  expanded.value = !expanded.value
}

defineExpose({ toggleExpand }) // Expose toggle function to child
</script>

<style scoped>
/* Optional parent styling */
.relative {
  max-width: 1200px; /* Adjust as needed */
  max-height: 800px;
  overflow: hidden;
}
.fixed {
  height: 100vh;
  width: 100vw;
}
</style>
