<template>
  <div class="p-4 border rounded-lg cursor-pointer hover:bg-accent" @click="selectPitch">
    <h3>{{ pitch.title }}</h3>
    <p>{{ pitch.pitch }}</p>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore, Pitch } from '@/stores/pitchStore'

const props = defineProps<{
  pitch: Pitch
}>()

const pitchStore = usePitchStore()

const selectPitch = () => {
  pitchStore.selectPitch(props.pitch.id)
}
</script>
