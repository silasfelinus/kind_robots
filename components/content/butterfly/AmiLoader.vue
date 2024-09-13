<template>
  <div
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
  <div class="nuxt-wrapper" :class="{ 'fade-in': pageReady }">
    <nuxt-page />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLoadStore } from '../../../stores/loadStore' // Assuming the path to your loadStore

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
  }, 700) // Update the message after a .5 second delay
  setTimeout(startFadeOut, 1000) // Fade out after 2 seconds
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

const handleTransitionEnd = () => {
  if (fadeOut.value) {
    butterflyCount.value = 0
    pageReady.value = true
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
  z-index: 9999;
  transition: opacity 1s;
  pointer-events: none;
}
.loading-overlay.fade-out {
  opacity: 0;
  pointer-events: none;
}
.loading-message {
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
  opacity: 0;
  transition: opacity 1s;
}

.nuxt-wrapper.fade-in {
  opacity: 1;
}
</style>
