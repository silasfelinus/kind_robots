<template>
  <div class="relative">
    <!-- Butterfly Icon Box with toggle -->
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="emojione:butterfly"
        title="Kind Butterflies"
        :class="{ glow: showSwarm }"
        class="w-8 h-8 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>

    <!-- Debug Info (Number of Butterflies and Animation Status) -->
    <div
      v-if="showSwarm"
      class="debug-info absolute top-12 text-xs bg-white p-2 rounded-lg shadow-md"
    >
      <p>Butterflies: {{ butterflyCount }}</p>
      <p>Animation: {{ animationStatus }}</p>
    </div>

    <!-- +/- Controls for Butterfly Count -->
    <div v-show="showSwarm" class="controls mt-2 space-x-2">
      <button
        class="text-sm bg-accent-200 hover:bg-accent-300 text-white p-1 rounded"
        @click="addButterfly"
      >
        +
      </button>
      <button
        class="text-sm bg-accent-200 hover:bg-accent-300 text-white p-1 rounded"
        @click="removeButterfly"
      >
        -
      </button>
    </div>

    <!-- Full-screen Butterfly Swarm Animation -->
    <div
      v-if="showSwarm"
      class="fixed inset-0 overflow-hidden z-50 pointer-events-none"
    >
      <butterfly-component
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        :butterfly="butterfly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useButterflyStore } from '@/stores/butterflyStore'
import { computed } from 'vue'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Get butterflies from the store
const butterflies = computed(() => butterflyStore.butterflies)

// Watch for the swarm toggle
const showSwarm = computed(() => butterflyStore.butterflies.length > 0)

// Get the number of butterflies and animation status
const butterflyCount = computed(() => butterflyStore.butterflies.length)
const animationStatus = computed(() =>
  butterflyStore.animationFrameId !== null ? 'Running' : 'Stopped',
)

// Toggle the butterfly swarm on and off
const toggleAmiSwarm = () => {
  if (showSwarm.value) {
    butterflyStore.clearButterflies()
    butterflyStore.stopAnimation()
  } else {
    butterflyStore.generateInitialButterflies(15) // Start with 15 butterflies
    butterflyStore.animateButterflies()
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
    butterflyStore.removeButterfly(
      butterflyStore.butterflies[butterflyCount.value - 1].id,
    )
  }
}
</script>

<style scoped>
/* Add aura glow effect */
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
}

/* Full-screen style for butterfly swarm */
.full-page {
  position: fixed;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

.debug-info {
  text-align: center;
}

/* Style for +/- controls */
.controls {
  display: flex;
  justify-content: center;
}
</style>
