<template>
  <div class="art-creator">
    <div>Pitch:</div>
    <div v-if="activePitch">
      <h3>{{ activePitch.title }}</h3>
      <p>{{ activePitch.description }}</p>
    </div>
    <textarea
      v-model="prompt"
      placeholder="Enter your art prompt here..."
      class="w-full p-2 border rounded mt-2"
    ></textarea>
    <button
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      @click="createArt"
    >
      Create Art
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useArtStore } from './../../../stores/artStore'

const pitchStore = usePitchStore()
const artStore = useArtStore()

const activePitch = computed(() => pitchStore.selectedPitch)
const prompt = ref('')

const createArt = async () => {
  if (activePitch.value) {
    const artData = {
      prompt: prompt.value,
      pitchId: activePitch.value.id,
      title: `Art for ${activePitch.value.title}`,
    }

    const { success, newArt, message } = await artStore.generateArt(artData)

    if (success && newArt) {
      console.log('Art created successfully:', newArt)
      // Additional logic after successful creation (e.g., routing to a new page or clearing form)
    } else {
      console.error('Failed to create art:', message)
    }
  } else {
    console.error('No active pitch selected.')
  }
}
</script>

<style scoped>
.art-creator {
  padding: 1rem;
}
</style>
