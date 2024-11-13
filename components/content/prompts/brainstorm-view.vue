<template>
  <div>
    <brainstorm-image />
<brainstorm-selector />
    <TitleMenu />
    <TitleMaker />
    <PitchDisplay />

    <!-- Section for Newest Pitches using PitchCard components -->
    <section v-if="pitchStore.newestPitches.length" class="mt-6">
      <h3 class="text-xl font-bold mb-4">New Pitches</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <PitchCard
          v-for="pitch in pitchStore.newestPitches"
          :key="pitch.id"
          :pitch="pitch"
          class="border border-orange-500 rounded-lg shadow-md"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const pitchStore = usePitchStore()
</script>
