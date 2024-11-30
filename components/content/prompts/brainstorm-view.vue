<template>
  <div class="container mx-auto overflow-y-auto">
    <!-- Responsive layout for Brainstorm Image and Temperature Slider -->
    <div class="flex flex-col md:flex-row md:space-x-4">
      <!-- Image occupies half width on medium and larger screens -->
      <div class="w-full md:w-1/2 mb-4 md:mb-0">
        <brainstorm-image />
      </div>

      <!-- Temperature slider occupies the other half width on medium and larger screens -->
      <div class="w-full md:w-1/2">
        <temperature-slider />
      </div>
    </div>

    <!-- Other Components Below the Main Row -->
    <brainstorm-selector />
    <add-pitch />

    <!-- Section for Newest Pitches using PitchCard components -->
    <section v-if="pitches.length" class="mt-6">
      <h3 class="text-xl font-bold mb-4">Pitches</h3>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <PitchCard
          v-for="pitch in pitches"
          :key="pitch.id"
          :pitch="pitch"
          class="border border-orange-500 rounded-lg shadow-md"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

const pitches = computed (()=> pitchStore.pitches)
</script>
