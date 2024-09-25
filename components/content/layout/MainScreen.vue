<template>
  <div
    class="interstitial flex flex-col justify-center items-center h-full w-full bg-primary rounded-2xl border-lg bordr-accent p-1"
    :style="interstitialStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the main content boundaries based on available space
const interstitialStyle = computed(() => ({
  height: `${displayStore.mainVh || 100}vh`, // Respect the main content height minus header/footer
  width: `${displayStore.mainVw || 100}vw`, // Respect the width within available viewport space
  overflow: 'hidden', // Prevent overflowing content
  padding: '1rem', // Optional: Adjust padding for spacing inside the component
}))

onMounted(() => {
  displayStore.initializeViewportWatcher()
})
</script>

<style scoped>
.interstitial {
  display: flex;
  box-sizing: border-box; /* Ensures padding and borders are included in the width/height */
  max-width: 100%; /* Ensure it doesn’t grow beyond its parent */
  max-height: 100%; /* Ensure it stays within the height boundary */
  background-color: rgba(
    255,
    255,
    255,
    0.9
  ); /* Optional background to differentiate */
  border-radius: 0.5rem; /* Optional styling for visual appeal */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Optional shadow for floating effect */
}
</style>
