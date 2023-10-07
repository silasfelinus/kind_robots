<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <div v-for="pitch in enrichedPitches" :key="pitch.id" class="relative">
        <button
          :class="[
            selectedPitch?.id === pitch.id ? 'bg-primary text-white' : 'bg-base-200',
            'rounded-2xl border p-2 m-2'
          ]"
          @click="updateSelectedPitch(pitch.id)"
          @mouseover="showTooltip(pitch.id)"
          @mouseleave="hideTooltip(pitch.id)"
        >
          {{ pitch.title }}
          <!-- Icons -->
          <icon v-if="pitch.isMature" name="mdi:alert" class="w-4 h-4" />
          <icon v-if="pitch.isPublic" name="mdi:earth" class="w-4 h-4" />
          <icon v-if="pitch.isOrphan" name="mdi:heart-off" class="w-4 h-4" />
          <icon v-else name="mdi:heart" class="w-4 h-4" />
        </button>
        <!-- Tooltip -->
        <div
          v-if="tooltipVisible[pitch.id]"
          class="absolute left-0 bottom-full mb-2 text-xs bg-base-100 p-1 rounded"
        >
          <span class="font-bold">Designer: {{ pitch.designer }}</span>
          <div v-if="pitch.isMature">
            <icon name="mdi:alert" class="w-4 h-4 inline" /> Mature Content
          </div>
          <div v-if="pitch.isPublic"><icon name="mdi:earth" class="w-4 h-4 inline" /> Public</div>
          <div v-if="pitch.isOrphan">
            <icon name="mdi:heart-off" class="w-4 h-4 inline" /> Orphan
          </div>
          <div v-else><icon name="mdi:heart" class="w-4 h-4 inline" /> Adopted</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, Pitch } from '@/stores/pitchStore'

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
  pitchStore.selectPitch(pitchId)
}

const enrichedPitches = computed<Pitch[]>(() => {
  return pitches.value.map((pitch) => {
    return { ...pitch }
  })
})
</script>
