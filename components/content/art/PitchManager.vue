<template>
  <div>
    <toggle-filter />
    <div v-for="pitch in filteredPitches" :key="pitch.id">
      <!-- Display pitch details here -->
      <h3>{{ pitch.title }}</h3>
      <p>{{ pitch.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useFilterStore } from '@/stores/filterStore'

const pitchStore = usePitchStore()
const filterStore = useFilterStore()

const filteredPitches = computed(() => {
  const { showMature, showPublic } = filterStore
  return pitchStore.pitches.filter((pitch) => {
    return (showMature ? true : !pitch.isMature) && (showPublic ? pitch.isPublic : true)
  })
})
</script>
