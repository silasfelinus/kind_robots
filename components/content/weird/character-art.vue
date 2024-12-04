<template>
  <div class="w-full flex flex-col space-y-4">
    <!-- Display Art Image -->
    <img
      v-if="artImage"
      :src="artImage"
      alt="Character Portrait"
      class="object-cover w-full h-60 rounded-lg"
    />
    <!-- Art Prompt Textarea -->
    <textarea
      v-model="artPrompt"
      placeholder="Describe your character's appearance..."
      class="bg-base-200 mt-4 p-4 rounded-lg shadow-md w-full h-32 text-sm resize-none"
    ></textarea>
    <!-- Actions -->
    <div class="flex space-x-2 mt-4">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white w-1/2 px-3 py-1 rounded-lg"
        :disabled="isGeneratingArt"
        @click="generateArt"
      >
        {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
      </button>
      <character-uploader class="w-1/2" @uploaded="setArtImageId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'

// Access stores
const characterStore = useCharacterStore()
const artStore = useArtStore()

// Computed property for selected character
const character = computed(() => characterStore.selectedCharacter)

// Computed property for the art image
const artImage = computed(() => {
  if (!character.value?.artImageId) return null
  const image = artStore.getCachedArtImageById(character.value.artImageId)
  if (!image) return null
  return `data:image/${image.fileType};base64,${image.imageData}`
})

// State for art prompt
const artPrompt = computed({
  get: () => character.value?.artPrompt || '',
  set: (value) => {
    if (character.value) {
      characterStore.selectedCharacter = {
        ...character.value,
        artPrompt: value,
      }
    }
  },
})

// State for generating art
const isGeneratingArt = ref(false)

// Generate art function
async function generateArt() {
  if (!character.value?.artPrompt) {
    alert('Please provide an art prompt to generate art.')
    return
  }
  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: character.value.artPrompt,
      title: character.value.name || 'Unnamed Character',
      collection: 'characters',
      userId: characterStore.selectedCharacter?.userId || 1,
    })
    if (response.success && response.data) {
      characterStore.selectedCharacter = {
        ...character.value,
        artImageId: response.data.artImageId,
      }
    } else {
      alert('Art generation failed.')
    }
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}

// Set art image ID after upload
function setArtImageId(artImageId: number) {
  if (character.value) {
    characterStore.selectedCharacter = {
      ...character.value,
      artImageId,
    }
  }
}
</script>
