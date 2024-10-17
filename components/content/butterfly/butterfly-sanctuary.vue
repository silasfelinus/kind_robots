<template>
  <div
    class="relative bg-cover bg-center border-4 border-white"
    :style="{ height: mainHeight, width: mainWidth, backgroundImage: 'url(/images/backtree.webp)' }"
  >
    <!-- Butterfly Counter in the top right corner -->
    <div class="absolute top-2 right-2 text-white text-xl bg-black bg-opacity-50 p-2 rounded-lg">
      Butterflies: {{ butterflyCount }}
    </div>

    <!-- Image Area (Left side, 70% of available height/width) -->
    <div class="absolute top-0 left-0 h-[70%] w-[70%] overflow-hidden">
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
    <div class="absolute bottom-0 w-full flex justify-center bg-black bg-opacity-50 p-4">
      <button class="control-btn" @click="toggleAmiSwarm">
        {{ showSwarm ? 'Stop' : 'Start' }} Animation
      </button>
      <button class="control-btn mx-2" @click="addButterfly">Add Butterfly</button>
      <button class="control-btn" @click="removeButterfly">Remove Butterfly</button>
    </div>

    <!-- Right side control section (for the flip-card UI) -->
    <div class="absolute top-2 right-2 flex flex-col items-center">
      <div class="bg-black text-white w-10 h-10 mb-4 text-center">Butterfly Counter: {{ butterflyCount }}</div>

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
</style>
