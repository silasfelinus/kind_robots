<template>
  <div>
    <pitch-selector />
    <pitch-card />
    <pitch-chat />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useFilterStore } from '@/stores/filterStore'

const pitchStore = usePitchStore()
const filterStore = useFilterStore()
</script>
