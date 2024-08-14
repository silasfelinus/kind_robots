<template>
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Pitch Selector -->
      <div class="col-span-1">
        <pitch-selector />
      </div>
      <!-- Add Pitch -->
      <div class="col-span-1">
        <add-pitch />
      </div>
      <!-- Pitch Card -->
      <div class="col-span-1">
        <pitch-card />
      </div>

      <!-- Pitch Gallery -->
      <div class="col-span-1 md:col-span-2 lg:col-span-2">
        <pitch-gallery />
      </div>

      <!-- Dream Generator or Art Generator -->
      <div class="col-span-1">
        <template v-if="selectedPitch && selectedPitch.id === 6">
          <dream-generator />
        </template>
        <template v-else>
          <art-generator />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'

const pitchStore = usePitchStore()
const selectedPitch = computed(() => pitchStore.selectedPitch)
</script>
