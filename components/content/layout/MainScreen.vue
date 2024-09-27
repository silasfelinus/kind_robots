<template>
  <div
    class="interstitial flex justify-center items-center h-full w-full bg-primary rounded-2xl border-2 border-accent p-4 overflow-hidden shadow-md"
    :style="interstitialStyle"
  >
    <slot></slot>
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
}))

onMounted(() => {
  displayStore.initialize()
})
</script>

<style scoped>
/* No additional styles needed here because everything is handled by Tailwind */
</style>
