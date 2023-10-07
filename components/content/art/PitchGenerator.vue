<template>
  <div>
    <h1>Pitch Generator</h1>

    <!-- Dropdown for selecting a pitch -->
    <select v-model="selectedPitchId" @change="onPitchChange">
      <option v-for="pitch in publicPitches" :key="pitch.id" :value="pitch.id">
        {{ pitch.title }}
      </option>
    </select>

    <!-- Button to generate art -->
    <button @click="generateArtBasedOnPitch">Generate Art</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useDreamStore } from '@/stores/dreamStore'
import { errorHandler } from '@/server/api/utils/error'
import { useUserStore } from '@/stores/userStore'
import { useChannelStore } from '@/stores/channelStore'
import { usePromptStore } from '@/stores/promptStore'

const artStore = useArtStore()
const pitchStore = usePitchStore()
const selectedPitch = computed(() => pitchStore.selectedPitch)
const selectedPitchId = ref<number | null>(null)
const publicPitches = computed(() => pitchStore.publicPitches)

const onPitchChange = () => {
  pitchStore.selectPitch(selectedPitchId.value || 1)
}

const generateArtBasedOnPitch = async () => {
  if (pitchStore.selectedPitch) {
    const pitch = pitchStore.selectedPitch
    const data = {
      prompt: pitch.title,
      galleryName: 'cafefred',
      pitchName: pitch.title
      // Add other fields as needed
    }
    await artStore.generateArt(data)
  } else {
    console.warn('No pitch selected.')
  }
}
</script>
