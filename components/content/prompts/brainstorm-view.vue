<template>
  <div>
    <TitleMenu />
    <TitleMaker />
    <PitchDisplay />
    <section v-if="pitchStore.newestPitches">
      <h3>New Pitches</h3>
      <ul>
        <li
          v-for="pitch in pitchStore.newestPitches"
          :key="pitch.id"
          class="highlighted-pitch"
        >
          {{ pitch.pitch }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()
</script>

<style scoped>
.highlighted-pitch {
  color: #ff9800; /* Example color for highlighted pitches */
  font-weight: bold;
}
</style>
