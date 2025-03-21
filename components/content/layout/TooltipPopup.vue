<template>
  <div class="flex flex-col items-center p-8 bg-base-300 rounded-lg shadow-lg">
    <!-- Minimized Avatar -->
    <div
      v-if="minimized"
      class="rounded-full w-16 h-16 bg-accent flex items-center justify-center cursor-pointer relative"
      @click="toggleMinimize"
    >
      <img
        :src="image ? `/images/${image}` : '/images/backtree.webp'"
        alt="Chat Avatar"
        class="rounded-full w-14 h-14"
      />
      <div class="ripple bg-primary opacity-50" />
    </div>

    <!-- Chat Window -->
    <div
      v-else
      class="w-full mt-4 p-4 bg-secondary rounded-lg border-4 border-accent"
    >
      <h3 class="text-lg font-semibold text-primary mb-2">Silas Says...</h3>

      <div class="streaming-container bg-base rounded-lg p-4">
        <div class="streaming-text text-base text-info">
          {{ streamingText || 'Hey there, welcome to KindRobots!' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const { image, tooltip } = storeToRefs(pageStore)

const streamingText = ref('')
const minimized = ref(false)
let interval: NodeJS.Timeout | null = null

const toggleMinimize = () => {
  minimized.value = !minimized.value
  localStorage.setItem('tooltipMinimized', minimized.value.toString())
}

const streamText = (text: string) => {
  if (interval) clearTimeout(interval)
  streamingText.value = ''
  let index = 0

  const appendChar = () => {
    if (index < text.length) {
      streamingText.value += text.charAt(index)
      const delay = ['.', ','].includes(text.charAt(index)) ? 500 : 50
      index++
      interval = setTimeout(appendChar, delay)
    } else {
      clearTimeout(interval!)
    }
  }

  appendChar()
}

onMounted(() => {
  minimized.value = localStorage.getItem('tooltipMinimized') === 'true'
  streamText(tooltip.value || 'Hey there, welcome to KindRobots!')
})

watch(tooltip, (newVal) => {
  streamText(newVal || 'Hey there, welcome to KindRobots!')
})
</script>

<style scoped>
.ripple {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: ripple-animation 1.5s infinite;
  width: 100%;
  height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes ripple-animation {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 200%;
    height: 200%;
    opacity: 0;
  }
}
</style>
