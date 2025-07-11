<!-- /components/content/butterfly/ami-loader.vue -->
<template>
  <div
    class="loading-overlay"
    :class="{ 'fade-out': fadeOut }"
    @transitionend="handleTransitionEnd"
    @click="startFadeOut"
  >
    <!-- Bubble Loader - Enlarged and Centered -->
    <Icon name="kind-icon:bubble-loading" class="bubble-loader" />
    <!-- Dynamic Loading Message -->
    <div class="loading-message">{{ currentMessage }}</div>

    <!-- Multiple Butterflies with Animation Delay -->
    <ami-butterfly
      v-for="i in butterflyCount"
      :key="i"
      :class="{ 'butterfly-fade-out': butterflyFadeOut }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLoadStore } from './../../stores/loadStore' // Assuming the path to your loadStore

const { randomLoadMessage } = useLoadStore()
const currentMessage = ref('Building Kind Robots...')

const butterflyCount = ref(20)
const fadeOut = ref(false)
const butterflyFadeOut = ref(false) // New state for butterflies' fade-out
const pageReady = ref(false)

const startFadeOut = () => {
  fadeOut.value = true // Fades out the message and overlay
}

const startButterflyFadeOut = () => {
  butterflyFadeOut.value = true // Fades out butterflies after additional delay
}

const updateMessage = () => {
  currentMessage.value = randomLoadMessage()
}

let intervalId: NodeJS.Timeout
onMounted(() => {
  setTimeout(() => {
    currentMessage.value = randomLoadMessage()
    intervalId = setInterval(updateMessage, 2500)
  }, 100)

  setTimeout(startFadeOut, 1300) // Fade out the message after 2 seconds

  setTimeout(startButterflyFadeOut, 10000) // Butterflies fade out after 5 seconds
})

onUnmounted(() => {
  clearInterval(intervalId)
})

const handleTransitionEnd = () => {
  if (fadeOut.value) {
    pageReady.value = true // Marks the page as ready when message fades out
    // Butterflies will continue to fly until the butterflyFadeOut kicks in.
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #111;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: opacity 1s;
  pointer-events: auto;
}
.loading-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-message {
  color: white;
  font-size: 32px; /* Increased font size */
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px; /* Space between message and loader */
}

/* Bubble Loader Styling */
.bubble-loader {
  font-size: 80px; /* Large size for the loader icon */
  color: #fff; /* Ensure it's visible against the background */
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
