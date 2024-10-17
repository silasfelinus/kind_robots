<template>
  <!-- Main container that fits to the screen -->
  <div
    class="relative h-screen w-screen bg-cover bg-center border-4 border-white"
    :style="{ backgroundImage: 'url(/images/backtree.webp)' }"
  >
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
    <div
      class="absolute bottom-0 left-0 w-full flex justify-center bg-black bg-opacity-50 p-4 z-50"
    >
      <!-- Start/Stop Animation Button -->
      <button class="control-btn" @click="toggleAmiSwarm">
        {{ showSwarm ? 'Stop' : 'Start' }} Animation
      </button>

      <!-- Add Butterfly Button -->
      <button class="control-btn mx-2" @click="addButterfly">
        Add Butterfly
      </button>

      <!-- Remove Butterfly Button -->
      <button class="control-btn" @click="removeButterfly">
        Remove Butterfly
      </button>

      <!-- Display Mode Selector -->
      <div class="flex mx-2">
        <button class="control-btn mx-1" @click="setDisplayMode('viewport')">
          Viewport
        </button>
        <button
          class="control-btn mx-1"
          @click="setDisplayMode('main-container')"
        >
          Main Container
        </button>
        <button class="control-btn mx-1" @click="setDisplayMode('full-screen')">
          Full Screen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { computed, ref } from 'vue'

// Access the butterfly store
const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

// Get butterflies from the store
const butterflies = computed(() => butterflyStore.butterflies)

// Watch for the swarm toggle
const showSwarm = ref(false)

// Get the number of butterflies
const butterflyCount = computed(() => butterflyStore.butterflies.length)

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
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
  if (butterflyCount.value > 0) {
    butterflyStore.removeButterfly(butterflyStore.butterflies[butterflyCount.value - 1].id)
  }
}

// Display mode state (viewport, main-container, full-screen)
const displayMode = ref('viewport')

// Access the main container dimensions from DisplayStore
const mainHeight = computed(() => displayStore.centerHeight)
const mainWidth = computed(() => displayStore.centerWidth)

// Update the display mode and set the container style accordingly
const butterflyContainerStyle = computed(() => {
  if (displayMode.value === 'viewport') {
    return { height: '100%', width: '100%' } // Matches the background image area
  } else if (displayMode.value === 'main-container') {
    // Uses the exact height and width from DisplayStore
    return { height: mainHeight.value, width: mainWidth.value }
  } 
  // Default to full-screen if no display mode is selected or for 'full-screen'
  return { height: '100vh', width: '100vw' } // Full screen as default
})


const setDisplayMode = (mode: string) => {
  displayMode.value = mode
}
</script>

<style scoped>
/* Control button styles */
.control-btn {
  background-color: #ff9800;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
}

/* Background image with a stylish border */
.bg-cover {
  background-size: cover;
  background-position: center;
  border: 5px solid #fff; /* Adds the stylish white border */
}
</style>
