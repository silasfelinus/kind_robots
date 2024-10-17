<template>
  <div
    class="relative bg-cover bg-center border-4 border-white"
    :style="{ height: mainHeight, width: mainWidth }"
  >
    <!-- Background Image with Nuxt Image -->
    <nuxt-img
      src="/images/backtree.webp"
      alt="Background Tree"
      class="absolute inset-0 h-full w-full object-cover z-0"
    />

    <!-- Butterfly Counter in the top right corner -->
    <div class="absolute top-2 right-2 text-white text-xl bg-black bg-opacity-50 p-2 rounded-lg z-10">
      Butterflies: {{ butterflyCount }}
    </div>

    <!-- Image Area (Left side, 70% of available height/width) -->
    <div class="absolute top-0 left-0 h-[70%] w-[70%] overflow-hidden z-10">
      <div class="relative h-full w-full">
        <butterfly-component
          v-for="butterfly in butterflies"
          :key="butterfly.id"
          :butterfly="butterfly"
          class="absolute"
        />
      </div>
    </div>

    <!-- Control Panel (Bottom side with button controls) -->
    <div class="absolute bottom-0 w-full flex justify-center bg-black bg-opacity-50 p-4 z-20">
      <button
        class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 mx-2"
        @click="toggleAmiSwarm"
      >
        {{ showSwarm ? 'Stop' : 'Start' }} Animation
      </button>
      <button
        class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 mx-2"
        @click="addButterfly"
      >
        Add Butterfly
      </button>
      <button
        class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 mx-2"
        @click="removeButterfly"
      >
        Remove Butterfly
      </button>
    </div>

    <!-- Right side control section (Flip-Card) -->
    <div class="absolute top-16 right-2 flex flex-col items-center z-20">
      <div class="bg-black text-white w-16 h-16 mb-4 text-center p-2 rounded-md">Count: {{ butterflyCount }}</div>

      <!-- Flip-Card Section -->
      <butterfly-flip>
        <!-- Component front for new butterfly settings -->
        <template #front>
          <butterfly-front />
        </template>

        <!-- Component back for existing butterfly settings -->
        <template #back>
          <butterfly-back />
        </template>
      </butterfly-flip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

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
    butterflyStore.generateInitialButterflies(15)
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

// Get main height and width from displayStore
const mainHeight = computed(() => displayStore.centerHeight)
const mainWidth = computed(() => displayStore.centerWidth)
</script>

<style scoped>
/* Removed the button styling from here */
</style>
