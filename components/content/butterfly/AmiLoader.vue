<template>
  <div
    v-if="!pageReady"
    class="loading-overlay"
    :class="{ 'fade-out': fadeOut }"
    @transitionend="handleTransitionEnd"
    @click="startFadeOut"
  >
    <!-- Dynamic Loading Message -->
    <div class="loading-message">
      {{ currentMessage }}
    </div>

    <!-- Multiple Butterflies with Animation Delay -->
    <ami-butterfly v-for="i in butterflyCount" :key="i" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLoadStore } from '../../../stores/loadStore' // Adjust path if needed

const { randomLoadMessage } = useLoadStore()
const currentMessage = ref('Building Kind Robots...')

const butterflyCount = ref(20)
const fadeOut = ref(false)
const pageReady = ref(false)

const startFadeOut = () => {
  fadeOut.value = true
}

const updateMessage = () => {
  currentMessage.value = randomLoadMessage()
}

let intervalId: NodeJS.Timeout | undefined
onMounted(() => {
  setTimeout(() => {
    currentMessage.value = randomLoadMessage()
    intervalId = setInterval(updateMessage, 20 * 50) as NodeJS.Timeout
  }, 700) // Update the message after a .7 second delay

  setTimeout(startFadeOut, 1000) // Fade out after 1 second
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

const handleTransitionEnd = () => {
  if (fadeOut.value) {
    butterflyCount.value = 0
    pageReady.value = true // Page is now ready, overlay is removed
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
  background: rgba(0, 0, 0, 0.8); /* Slight transparency for a more polished look */
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 1s;
  opacity: 1;
  pointer-events: all; /* Capture clicks while loading */
}

.loading-overlay.fade-out {
  opacity: 0;
  pointer-events: none; /* Disable interactions when faded out */
}

.loading-message {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}

/* Ensure butterflies are visible and not hidden */
ami-butterfly {
  position: absolute;
  animation: fly 5s infinite;
}

@keyframes fly {
  0% { transform: translate(0, 0); }
  50% { transform: translate(50px, -50px); }
  100% { transform: translate(0, 0); }
}
</style>
