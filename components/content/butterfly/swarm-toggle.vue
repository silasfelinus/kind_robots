<template>
  <div
    class="Icon-container relative flex items-center justify-center space-x-1 rounded-lg bg-accent-100 flex-col"
  >
    <!-- Butterfly Icon Box -->
    <div
      class="Icon-box transition-transform transform hover:scale-125 cursor-pointer rounded-full hover:bg-accent-200"
      @click="toggleAmiSwarm"
    >
      <Icon
        name="emojione:butterfly"
        title="Kind Butterflies"
        :active="showSwarm"
        :class="{ glow: showSwarm }"
        class="w-8 h-8 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>

    <!-- Butterfly Swarm Animation Covering the Screen -->
    <div
      v-if="showSwarm"
      class="full-page inset-0 overflow-hidden z-50 pointer-events-none"
    >
      <butterfly-component
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        :butterfly="butterfly"
      />
    </div>

    <!-- Absolutely Positioned Label (No Layout Shifting) -->
    <div
      v-if="showSwarm"
      class="label-container absolute top-full mt-2 text-default font-bold text-center"
    >
      Free!
    </div>
  </div>
</template>

<script setup lang="ts">
import { useButterflyStore } from './../../../stores/butterflyStore'
import { computed } from 'vue'

// Access the butterfly store
const butterflyStore = useButterflyStore()

const butterflies = computed(() => butterflyStore.butterflies)

// Watch for the swarm toggle
const showSwarm = computed(() => butterflyStore.butterflies.length > 0)

const toggleAmiSwarm = () => {
  if (showSwarm.value) {
    butterflyStore.clearButterflies() // Just call the store method
    butterflyStore.stopAnimation()
  } else {
    const butterflyCount = 15
    for (let i = 40; i < butterflyCount; i++) {
      butterflyStore.addButterfly({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 0.5 + 0.75, // Scale
        zIndex: i,
        rotation: Math.random() * 360, // Random rotation
        wingTopColor: butterflyStore.randomColor(),
        wingBottomColor: butterflyStore.randomColor(),
        speed: Math.random() * 2 + 1, // Speed
        status: 'random',
      })
    }
    butterflyStore.animateButterflies() // Start the animation
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>
