<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <div v-for="pitch in enrichedPitches" :key="pitch.id" class="relative">
        <button
          :class="[
            selectedPitch?.id === pitch.id
              ? 'bg-primary text-white'
              : 'bg-base-300',
            'rounded-2xl border p-2 m-2',
          ]"
          @click="updateSelectedPitch(pitch.id)"
          @mouseover="showTooltip(pitch.id)"
          @mouseleave="hideTooltip(pitch.id)"
        >
          {{ pitch.title }}
          {{ pitch.pitch }}
        </button>
        <!-- Tooltip -->
        <div
          v-if="tooltipVisible[pitch.id]"
          class="absolute left-0 bottom-full mb-2 text-xs bg-base-300 p-1 rounded"
        >
          <span class="font-bold"> created by: {{ pitch.userId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Pitch } from '@prisma/client'
import { usePitchStore } from './../../../stores/pitchStore'

const pitchStore = usePitchStore()

const selectedPitch = computed(() => pitchStore.selectedPitch)
const pitches = computed(() => pitchStore.pitches)
const tooltipVisible = ref<Record<number, boolean>>({}) // Specify type here

// Function to show tooltip
const showTooltip = (pitchId: number) => {
  tooltipVisible.value[pitchId] = true
}

// Function to hide tooltip
const hideTooltip = (pitchId: number) => {
  tooltipVisible.value[pitchId] = false
}

const updateSelectedPitch = (pitchId: number) => {
  pitchStore.selectedPitchId = pitchId
}

const enrichedPitches = computed<Pitch[]>(() => {
  return pitches.value.map((pitch) => {
    return { ...pitch }
  })
})
</script>
