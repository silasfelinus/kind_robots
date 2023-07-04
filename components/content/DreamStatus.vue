<template>
  <transition name="fade" mode="out-in">
    <div
      :key="dream"
      class="dream-status text-white text-lg font-semibold text-center bg-primary p-4 border-accent shadow-lg transition-all duration-500 hover:scale-105"
      @click="updateDream"
    >
      {{ statusMessage }}
    </div>
  </transition>
</template>

<script setup>
import { useDreamStore } from '../../stores/dreams'

const dreamStore = useDreamStore()
const dream = ref(dreamStore.randomDream())
let statusMessage = ref(`Status: ${dream.value}`)

const updateDream = () => {
  dream.value = dreamStore.randomDream()
  statusMessage.value = `Status: ${dream.value}`
}

let intervalId = null
onMounted(() => {
  intervalId = setInterval(updateDream, 20 * 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watchEffect(() => {
  statusMessage.value = `Status: ${dream.value}`
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.dream-status {
  position: relative;
  overflow: hidden;
}

.dream-status:after {
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
</style>
