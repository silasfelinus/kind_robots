<template>
  <div class="flex flex-col items-center p-8 bg-base-300 rounded-lg shadow-lg">
    <!-- Minimized Avatar -->
    <div
      v-if="minimized"
      class="rounded-full w-16 h-16 bg-accent flex items-center justify-center cursor-pointer relative"
      @click="toggleMinimize"
    >
      <img
        :src="page?.image ? `/images/${page.image}` : '/images/backtree.webp'"
        alt="Chat Avatar"
        class="rounded-full w-14 h-14"
      />
      <!-- Ripple Effect -->
      <div class="ripple bg-primary opacity-50" />
    </div>

    <!-- Chat Window -->
    <div
      v-else
      class="w-full mt-4 p-4 bg-secondary rounded-lg border-4 border-accent"
    >
      <h3 class="text-lg font-semibold text-primary mb-2">Silas Says...</h3>

      <!-- Text Container -->
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
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = route.params.name as string

// Define expected content structure
interface PageData {
  title?: string
  description?: string
  subtitle?: string
  image?: string
  icon?: string
  underConstruction?: boolean
  dottitip?: string
  amitip?: string
  tooltip?: string
  message?: string
}

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {}
})

// Initialize reactive variables
const streamingText = ref('')
const minimized = ref(false)

// Function to toggle minimize state
const toggleMinimize = () => {
  minimized.value = !minimized.value
  localStorage.setItem('tooltipMinimized', minimized.value.toString())
}

let interval: NodeJS.Timeout | null = null

// Function to stream text
const streamText = (text: string) => {
  if (interval) {
    clearTimeout(interval)
  }

  streamingText.value = '' // Reset the streaming text
  let index = 0
  let speed = 50 // Default speed

  const appendChar = () => {
    if (index < text.length) {
      streamingText.value += text.charAt(index)
      if (text.charAt(index) === '.' || text.charAt(index) === ',') {
        speed = 500
      } else {
        speed = 50
      }
      index++
      interval = setTimeout(appendChar, speed)
    } else {
      clearTimeout(interval as NodeJS.Timeout)
    }
  }

  appendChar()
}

// Lifecycle hooks and watchers
onMounted(() => {
  minimized.value = localStorage.getItem('tooltipMinimized') === 'true'
  streamText(page.value?.tooltip || 'Hey there, welcome to KindRobots!')
})

watch(
  () => page.value?.tooltip,
  (newTooltip) => {
    streamText(newTooltip || 'Hey there, welcome to KindRobots!')
  },
)
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
