<!-- /components/content/prompts/pitch-viewer.vue -->
<template>
  <div
    class="p-4 border rounded-lg cursor-pointer hover:bg-accent"
    @click="selectPitch"
  >
    <h3>{{ pitch.title }}</h3>
    <p>{{ pitch.pitch }}</p>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore, type Pitch } from '../../stores/pitchStore'

const props = defineProps<{
  pitch: Pitch // Ensure the Pitch type matches your schema
}>()

const pitchStore = usePitchStore()

// Use the store's action to set the selected pitch
const selectPitch = () => {
  pitchStore.setSelectedPitch(props.pitch.id) // Call the store's action
}
</script>
