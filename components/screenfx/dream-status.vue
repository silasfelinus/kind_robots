<!-- /components/content/screenfx/dream-status.vue -->
<template>
  <transition name="fade" mode="out-in">
    <div
      :key="dream"
      class="dream-status text-default text-lg font-semibold text-center bg-primary p-4 border-accent shadow-lg transition-all duration-500 hover:scale-105"
      @click="updateDream"
    >
      {{ statusMessage }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useDreamStore } from '../../stores/dreamStore'

const dreamStore = useDreamStore()
const dream = ref(dreamStore.randomDream())
const statusMessage = ref(`One Moment...${dream.value}`)

const updateDream = () => {
  dream.value = dreamStore.randomDream()
  statusMessage.value = `Hold On...${dream.value}`
}

// Explicitly typing intervalId as number
let intervalId: number | null = null

onMounted(() => {
  intervalId = setInterval(updateDream, 20 * 1000) as unknown as number // Ensures it's typed as number
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

watchEffect(() => {
  statusMessage.value = `${dream.value}`
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
