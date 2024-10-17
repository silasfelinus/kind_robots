<template>
  <!-- Main container that fits to the screen -->
  <div
    class="relative h-screen w-screen border-4 border-white bg-gray-800"
  >
    <!-- Background Image with Nuxt Image -->
    <nuxt-img
      src="/images/backtree.webp"
      alt="Background Tree"
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- Error message in case something goes wrong -->
    <div v-if="errorMessage" class="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-lg z-50">
      {{ errorMessage }}
    </div>

    <!-- Butterfly Counter in the top right corner -->
    <div
      class="absolute top-2 right-4 text-white text-xl bg-black bg-opacity-50 p-2 rounded-lg z-50"
    >
      Butterflies: {{ butterflyCount }}
    </div>

    <!-- Butterfly Display Area -->
    <div
      v-if="showSwarm"
      class="relative overflow-hidden z-40 pointer-events-none"
      :style="butterflyContainerStyle"
    >
      <butterfly-component
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        :butterfly="butterfly"
      />
    </div>

    <!-- Control Panel -->
    <div class="absolute bottom-0 left-0 w-full flex justify-center bg-black bg-opacity-50 p-4 z-50">
      <!-- Start/Stop Animation Button -->
      <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-transform transform hover:scale-105" @click="toggleAmiSwarm">
        {{ showSwarm ? 'Stop' : 'Start' }} Animation
      </button>

      <!-- Add Butterfly Button -->
      <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm mx-2 transition-transform transform hover:scale-105" @click="addButterfly">
        Add Butterfly
      </button>

      <!-- Remove Butterfly Button -->
      <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-transform transform hover:scale-105" @click="removeButterfly">
        Remove Butterfly
      </button>

      <!-- Display Mode Selector -->
      <div class="flex mx-2">
        <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm mx-1 transition-transform transform hover:scale-105" @click="setDisplayMode('viewport')">
          Viewport
        </button>
        <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm mx-1 transition-transform transform hover:scale-105" @click="setDisplayMode('main-container')">
          Main Container
        </button>
        <button class="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm mx-1 transition-transform transform hover:scale-105" @click="setDisplayMode('full-screen')">
          Full Screen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

// Error message state
const errorMessage = ref('')

// Access the butterfly store (with error handling)
let butterflyStore
let displayStore
try {
  butterflyStore = useButterflyStore()
  displayStore = useDisplayStore()
} catch (error) {
  errorMessage.value = 'Failed to load required stores or components.'
}

// Get butterflies from the store
const butterflies = computed(() => (butterflyStore ? butterflyStore.butterflies : []))

// Watch for the swarm toggle
const showSwarm = ref(false)

// Get the number of butterflies
const butterflyCount = computed(() => (butterflyStore ? butterflyStore.butterflies.length : 0))

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  if (!butterflyStore) return
  showSwarm.value = !showSwarm.value

  if (showSwarm.value) {
    butterflyStore.generateInitialButterflies(15) // Start with 15 butterflies
    butterflyStore.animateButterflies()
  } else {
    butterflyStore.clearButterflies()
    butterflyStore.stopAnimation()
  }
}

// Add a new butterfly
const addButterfly = () => {
  if (!butterflyStore) return
  butterflyStore.addButterfly({
    id: Date.now(),
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 0.5 + 0.75,
    zIndex: butterflyCount.value + 1,
    rotation: Math.random() * 360,
    wingTopColor: butterflyStore.randomColor(),
    wingBottomColor: butterflyStore.randomColor(),
    speed: Math.random() * 2 + 1,
    status: 'random',
  })
}

// Remove the last butterfly
const removeButterfly = () => {
  if (!butterflyStore || butterflyCount.value === 0) return
  butterflyStore.removeButterfly(butterflyStore.butterflies[butterflyCount.value - 1].id)
}

// Display mode state (viewport, main-container, full-screen)
const displayMode = ref('viewport')

// Get dimensions from DisplayStore
const mainHeight = computed(() => (displayStore ? displayStore.centerHeight : '100vh'))
const mainWidth = computed(() => (displayStore ? displayStore.centerWidth : '100vw'))

// Update the display mode and set the container style accordingly
const butterflyContainerStyle = computed(() => {
  if (!displayStore) return { height: '100vh', width: '100vw' }

  if (displayMode.value === 'viewport') {
    return { height: '100%', width: '100%' }
  } else if (displayMode.value === 'main-container') {
    return { height: mainHeight.value, width: mainWidth.value }
  }
  return { height: '100vh', width: '100vw' } // Full screen as default
})

const setDisplayMode = (mode: string) => {
  displayMode.value = mode
}
</script>

<style scoped>
/* No custom CSS required, using Tailwind for styling */
</style>
