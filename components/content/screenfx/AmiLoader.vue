<template>
  <div
    class="loading-overlay"
    :class="{ 'fade-out': fadeOut }"
    @transitionend="handleTransitionEnd"
    @click="startFadeOut"
  >
    <!-- Welcome Message -->
    <div class="welcome-message">Building Kind Robots...</div>

    <!-- Multiple Butterflies with Animation Delay -->
    <ami-butterfly v-for="i in butterflyCount" :key="i" />
  </div>
  <div class="nuxt-wrapper" :class="{ 'fade-in': pageReady }">
    <nuxt-page />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let butterflyCount = ref(50)
const fadeOut = ref(false)
const pageReady = ref(false)

const startFadeOut = () => {
  fadeOut.value = true
}

const handleTransitionEnd = () => {
  if (fadeOut.value) {
    butterflyCount.value = 0 // Destructure all butterflies
    pageReady.value = true // Display the main content
  }
}

// For demonstration, I'm using a timeout to trigger the fade-out after 5 seconds.
setTimeout(startFadeOut, 2000)
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
.welcome-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}

.nuxt-wrapper {
  opacity: 0; /* Initially hidden */
  transition: opacity 1s; /* Transition for the fade-in effect */
}

.nuxt-wrapper.fade-in {
  opacity: 1; /* Fully visible when the page is ready */
}
</style>
