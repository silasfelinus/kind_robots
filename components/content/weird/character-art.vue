<template>
  <div class="w-full flex flex-col space-y-4 p-4">
    <!-- Display Art Image -->
    <img
      v-if="resolvedArtImage"
      :src="resolvedArtImage"
      alt="Character Portrait"
      class="object-cover w-full max-h-60 rounded-lg shadow"
    />

    <!-- Art Prompt Textarea -->
    <textarea
      v-model="artPrompt"
      placeholder="Describe your character's appearance..."
      class="bg-base-200 p-4 rounded-lg shadow-md w-full min-h-32 text-sm resize-none"
    ></textarea>

    <!-- Actions -->
    <div class="flex flex-wrap space-x-2 mt-4">
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
import { computed, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'

// Access stores
const characterStore = useCharacterStore()
const artStore = useArtStore()

// Computed property for selected character
const character = computed(() => characterStore.selectedCharacter)

// Ref to store the resolved art image
const resolvedArtImage = ref<string | null>(null)

// Watch for changes in `artImageId` and fetch the image
watch(
  () => character.value?.artImageId,
  async (newArtImageId) => {
    if (!newArtImageId) {
      resolvedArtImage.value = null
      return
    }

    const image = await artStore.getArtImageById(newArtImageId)
    if (image) {
      resolvedArtImage.value = `data:image/${image.fileType};base64,${image.imageData}`
    } else {
      resolvedArtImage.value = '/images/bot.webp'
    }
  },
  { immediate: true },
)

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
