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
        class="bg-blue-500 hover:bg-blue-600 text-white w-1/3 px-3 py-1 rounded-lg"
        :disabled="isGeneratingArt"
        @click="generateArt"
      >
        {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
      </button>
      <button
        class="bg-green-500 hover:bg-green-600 text-white w-1/3 px-3 py-1 rounded-lg"
        :disabled="isLoading"
        @click="pickRandomImageFromGallery"
      >
        {{ isLoading ? 'Picking...' : 'Pick Random from Gallery' }}
      </button>
      <character-uploader class="w-1/3" @uploaded="setArtImageId" />
    </div>

    <!-- Gallery Selector -->
    <div class="mt-4">
      <gallery-selector @gallery-selected="setCurrentGallery" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'

// Access stores
const characterStore = useCharacterStore()
const artStore = useArtStore()
const galleryStore = useGalleryStore()

// Computed property for selected character
const character = computed(() => characterStore.selectedCharacter)

// Computed property for resolving the art image
const resolvedArtImage = computed(() => {
  if (!character.value?.imagePath) {
    return null // No image path, return null
  }

  return character.value.imagePath
    ? character.value.imagePath
    : '/images/bot.webp' // Fallback to default image
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

// State for generating art and loading images
const isGeneratingArt = ref(false)
const isLoading = ref(false)

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
      userId: character.value?.userId || 1,
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

// Select a random image from the gallery
async function pickRandomImageFromGallery() {
  if (!galleryStore.currentGallery) {
    alert('Please select a gallery first.')
    return
  }

  isLoading.value = true
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      characterStore.selectedCharacter = {
        ...character.value,
        imagePath: randomImage, // Update character's image path
      }
    } else {
      alert('Failed to pick a random image from the gallery.')
    }
  } catch (error) {
    console.error('Error picking random image:', error)
  } finally {
    isLoading.value = false
  }
}

// Set the current gallery
function setCurrentGallery(galleryId: number) {
  galleryStore.setCurrentGallery(galleryId)
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
