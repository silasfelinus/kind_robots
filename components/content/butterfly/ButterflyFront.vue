<template>
  <div class="bg-gray-200 p-4 rounded-lg">
    <h3 class="text-center mb-4">New Butterfly Settings</h3>
    <!-- Form for settings related to creating new butterflies -->
    <!-- Add more inputs if necessary -->
    <button class="control-btn" @click="createButterfly">Create New Butterfly</button>
  </div>
</template>

<script setup>
import { useButterflyStore } from '@/stores/butterflyStore'
const butterflyStore = useButterflyStore()

const createButterfly = () => {
  butterflyStore.addButterfly({
    id: Date.now(),
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 0.5 + 0.75,
    zIndex: butterflyStore.butterflies.length + 1,
    rotation: Math.random() * 360,
    wingTopColor: butterflyStore.randomColor(),
    wingBottomColor: butterflyStore.randomColor(),
    speed: Math.random() * 2 + 1,
    status: 'random',
  })
}
</script>
