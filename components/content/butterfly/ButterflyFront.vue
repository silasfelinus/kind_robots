<template>
  <div class="bg-gray-200 p-4 rounded-lg">
    <h3 class="text-center mb-4">Existing Butterfly Settings</h3>
    <!-- Display settings for butterflies currently on the screen -->
    <!-- Could add buttons to modify or remove butterflies -->
    <div v-for="butterfly in butterflies" :key="butterfly.id" class="mb-2">
      <p>{{ butterfly.id }} - {{ butterfly.wingTopColor }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
const butterflyStore = useButterflyStore()
const butterflies = computed(() => butterflyStore.butterflies)
</script>
