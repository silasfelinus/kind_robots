<template>
  <transition name="slide-fade" mode="out-in">
    <div :key="currentMessage">
      <div
        class="loader-message text-white text-lg font-semibold text-center bg-purple-600 p-4 rounded-md shadow-xl transition-transform duration-300 hover:scale-105 cursor-pointer"
        @click="updateMessage"
      >
        {{ currentMessage }}
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useLoadStore } from '../../stores/loadStore'

const { randomLoadMessage } = useLoadStore()
const currentMessage = ref(randomLoadMessage())

const updateMessage = () => {
  currentMessage.value = `${randomLoadMessage()}`
}

let intervalId: any
onMounted(() => {
  intervalId = setInterval(updateMessage, 20 * 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watchEffect(() => {
  currentMessage.value = `${currentMessage.value}`
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    transform 1s,
    opacity 1s;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.loader-message {
  position: relative;
  overflow: hidden;
  max-width: 80vw; /* Ensures the message doesn't go beyond screen width */
}

.loader-message:after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 100%;
  transform: scale(1) translate(-50%, -50%);
  opacity: 0;
}

/* Centered positioning styles */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}
</style>
