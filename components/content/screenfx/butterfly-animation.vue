<template>
  <div class="loading-overlay" :class="{ 'fade-out': fadeOut }">
    <!-- Multiple Butterflies with Animation Delay -->
    <ami-butterfly
      v-for="i in butterflyCount"
      :key="i"
      :class="{ 'butterfly-fade-out': butterflyFadeOut }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const butterflyCount = ref(20)
const fadeOut = ref(false) // Overlay fade-out state
const butterflyFadeOut = ref(false) // New state for butterflies' fade-out

// Watch the display store's isAnimating state
watch(
  () => displayStore.isAnimating,
  (newValue) => {
    if (!newValue) {
      // When the animation ends, trigger the butterfly fade-out
      butterflyFadeOut.value = true

      // Delay the overlay fade-out to allow butterflies to finish fading out
      setTimeout(() => {
        fadeOut.value = true
      }, 1000) // Delay to match the butterfly fade-out transition
    } else {
      // Reset fade states if starting animation again
      butterflyFadeOut.value = false
      fadeOut.value = false
    }
  },
)
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #111;
  z-index: 9999;
  transition: opacity 1s;
  pointer-events: auto;
}
.loading-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

/* Fade-out animation for butterflies */
.butterfly-fade-out {
  opacity: 0;
  transition: opacity 1s;
}

.nuxt-wrapper {
  opacity: 0;
  transition: opacity 1s;
}

.nuxt-wrapper.fade-in {
  opacity: 1;
}
</style>
