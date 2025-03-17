<template>
  <div
    class="interstitial flex justify-center items-center h-full w-full bg-primary rounded-2xl border-2 border-accent p-4 overflow-hidden shadow-md"
    :style="interstitialStyle"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the main content boundaries based on available space
const interstitialStyle = computed(() => ({
  height: displayStore.mainContentHeight, // Corrected height reference
  width: displayStore.mainContentWidth, // Corrected height reference
}))
</script>

<style scoped>
/* No additional styles needed here because everything is handled by Tailwind */
</style>
