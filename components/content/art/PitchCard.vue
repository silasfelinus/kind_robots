<template>
  <div
    v-if="selectedPitch"
    class="pitch-card bg-base-200 rounded-2xl p-4 shadow-lg"
  >
    <!-- Header: Title and Designer -->
    <div class="header flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">
        {{ selectedPitch.title }}
      </h2>
      <p class="text-sm text-gray-500">
        {{ selectedPitch.designer }}
      </p>
    </div>

    <!-- Pitch and Flavor Text -->
    <div class="mb-4">
      <p>{{ selectedPitch.pitch }}</p>
      <p>{{ selectedPitch.flavorText }}</p>
    </div>

    <pitch-card-actions :pitch="selectedPitch" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'

const pitchStore = usePitchStore()
const selectedPitch = computed(() => pitchStore.selectedPitch)
</script>

<style scoped>
.pitch-card {
  max-width: 400px;
  margin: auto;
}
.header,
.stats {
  display: flex;
  justify-content: space-between;
}
</style>
