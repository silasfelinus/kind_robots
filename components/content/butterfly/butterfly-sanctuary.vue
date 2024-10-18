<template>
  <div
    class="relative bg-cover bg-center box-border border-8 border-white overflow-hidden"
    :style="{ height: mainHeight, width: mainWidth }"
  >
    <!-- Background Image with Nuxt Image -->
    <nuxt-img
      src="/images/backtree.webp"
      alt="Background Tree"
      class="absolute inset-0 h-full w-full object-cover z-0"
    />

    <!-- Butterfly Counter in the top right corner -->
    <div
      class="absolute top-2 right-2 text-white text-xl bg-black bg-opacity-50 p-2 rounded-lg z-10"
    >
      Butterflies: {{ butterflyCount }}
    </div>

    <!-- Image Area with Fallback -->
    <div class="absolute top-0 left-0 h-[70%] w-[70%] overflow-hidden z-10">
      <butterfly-canvas :fallback-image="'/images/fallback-image.png'" />
    </div>

    <!-- Control Panel -->
    <div
      class="absolute bottom-0 w-full flex justify-center bg-black bg-opacity-50 p-4 z-20"
    >
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
      <div
        class="bg-black text-white w-16 h-16 mb-4 text-center p-2 rounded-md"
      >
        Count: {{ butterflyCount }}
      </div>

      <butterfly-flip
        front-tab-name="Global Presets"
        back-tab-name="Butterfly Manager"
      >
        <template #front>
          <butterfly-front />
        </template>
        <template #back>
          <butterfly-back />
        </template>
      </butterfly-flip>
    </div>

    <!-- Butterfly Demo (Fixed to Top Right Corner) -->
    <div class="absolute top-2 right-2 z-30">
      <butterfly-demo />
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

// Get butterflies count from the store
const butterflyCount = computed(() => butterflyStore.butterflies.length)

// Watch for the swarm toggle
const showSwarm = ref(false)

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value

  if (showSwarm.value) {
    butterflyStore.generateInitialButterflies(15)
    butterflyStore.animateButterflies()
  } else {
    butterflyStore.clearButterflies()
    butterflyStore.pauseAnimation()
  }
}

// Add a new butterfly
const addButterfly = () => {
  butterflyStore.generateInitialButterflies(1)
}

// Remove the last butterfly
const removeButterfly = () => {
  if (butterflyCount.value > 0) {
    butterflyStore.removeLastButterfly()
  }
}

// Get main height and width from displayStore
const mainHeight = computed(() => displayStore.centerHeight || '100vh')
const mainWidth = computed(() => displayStore.centerWidth || '100vw')
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
  border: 8px solid #fff; /* Increased border thickness */
}

/* Fixed demo element to the top right */
.demo-fixed {
  position: fixed;
  top: 10px;
  right: 10px;
}
</style>