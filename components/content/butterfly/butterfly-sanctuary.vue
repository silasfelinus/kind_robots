<template>
  <div
    class="relative grid grid-cols-2 gap-1 md:gap-4 bg-info bg-opacity-90 border-white box-border"
    :style="{ width: centerWidth, height: centerHeight }"
  >
    <!-- Left Column: Image Area (70%) and Buttons (30%) -->
    <div class="flex flex-col h-full p-1 md:p-4 bg-black bg-opacity-50">
      <!-- Image Area (70% of parent height) -->
      <div class="w-full h-[70%] relative overflow-hidden">
        <butterfly-canvas :fallback-image="'/images/art1.webp'" />
      </div>

      <!-- Control Panel (30% of parent height) -->
      <div class="w-full h-[30%] flex justify-center space-x-4 items-center">
        <button class="control-btn" @click="toggleAmiSwarm">
          {{ showSwarm ? 'Stop' : 'Start' }} Animation
        </button>
        <button class="control-btn" @click="addButterfly">Add Butterfly</button>
        <button class="control-btn" @click="removeButterfly">
          Remove Butterfly
        </button>
      </div>
    </div>

    <!-- Right Column: Butterfly Count (10%), Flip-Card (65%), and Demo (25%) -->
    <div class="flex flex-col items-center h-full p-4 bg-gray-200">
      <!-- Butterfly Count Section (10% of parent height) -->
      <div
        class="w-full h-[10%] text-center bg-black text-white p-2 rounded-lg"
      >
        Butterflies: {{ butterflyCount }}
      </div>

      <!-- Flip-Card Section (65% of parent height) -->
      <div class="w-full h-[65%] bg-info bg-opacity-70 p-4 rounded-md">
        <butterfly-flip class="w-full h-full" :use-flip-effect="false">
          <template #front>
            <butterfly-front />
          </template>
          <template #back>
            <butterfly-back />
          </template>
        </butterfly-flip>
      </div>

      <!-- Butterfly Demo Section (25% of parent height) -->
      <div class="w-full h-[25%] bg-info bg-opacity-80 p-4 mt-4 rounded-md">
        <butterfly-demo />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Access the display store for centerHeight and centerWidth
const displayStore = useDisplayStore()
const centerHeight = computed(() => displayStore.centerHeight)
const centerWidth = computed(() => displayStore.centerWidth)

// Get butterflies count from the store
const butterflyCount = computed(() => butterflyStore.butterflies.length)

// Watch for the swarm toggle
const showSwarm = ref(false)
const swarmSize = ref(15) // Keeping track of the initial swarm size

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  showSwarm.value = !showSwarm.value

  if (showSwarm.value) {
    butterflyStore.generateInitialButterflies(swarmSize.value)
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
</script>

<style scoped>
/* Control button styles */
.control-btn {
  background-color: #1d4ed8;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.05);
}
</style>
