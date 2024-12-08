<template>
  <div
    class="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center space-y-6"
  >
    <!-- Avatar Preview -->
    <div class="flex flex-col items-center space-y-2">
      <img
        :src="resolvedActiveImage"
        alt="Character Avatar Preview"
        class="w-40 h-40 object-cover rounded-full shadow-lg border-2 border-gray-300"
      />
      <p class="text-sm text-gray-500">Preview your avatar</p>
    </div>

    <!-- Image Upload -->
    <image-upload @uploaded="setArtImageId" />

    <!-- Art Prompt Section -->
    <div class="w-full">
      <label class="block text-gray-700 font-bold mb-2">Art Prompt</label>
      <textarea
        v-model="artPrompt"
        placeholder="Describe your character's appearance..."
        class="bg-base-200 p-4 rounded-lg shadow-md w-full min-h-32 text-sm resize-none"
        :disabled="isGeneratingArt || isLoading"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap justify-center space-x-4 mt-4">
      <!-- Generate Art -->
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white w-1/3 px-3 py-1 rounded-lg"
        :disabled="isGeneratingArt"
        @click="generateArt"
      >
        {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
      </button>

      <!-- Pick Random Image -->
      <button
        class="bg-green-500 hover:bg-green-600 text-white w-1/3 px-3 py-1 rounded-lg"
        :disabled="isLoading"
        @click="pickRandomImageFromGallery"
      >
        {{ isLoading ? 'Picking...' : 'Pick Random from Gallery' }}
      </button>

      <!-- Gallery Selector -->
      <gallery-selector />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const characterStore = useCharacterStore()
const artStore = useArtStore()
const galleryStore = useGalleryStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const isGeneratingArt = ref(false)
const defaultAvatar = '/images/bot.webp'

// Computed: Selected character
const character = computed(() => characterStore.selectedCharacter)

// Computed: Resolved avatar image
const resolvedActiveImage = computed(() => {
  if (!character.value) return defaultAvatar
  if (character.value.artImageId) {
    const artImage = artStore.artImages.find(
      (image) => image.id === character.value!.artImageId,
    )
    return artImage?.imageData || defaultAvatar
  }
  return character.value.imagePath || defaultAvatar
})

// Art Prompt (editable or generatable field)
const artPrompt = computed({
  get: () => character.value?.artPrompt || '',
  set: (value) => {
    if (character.value) {
      characterStore.selectedCharacter = {
        ...character.value,
        artPrompt: value,
      }
    } else {
      console.warn('No character selected.')
    }
  },
})

// Generate Art
async function generateArt() {
  if (!artPrompt.value) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: artPrompt.value,
      title: character.value?.name || 'Unnamed Character',
      collection: 'characters',
      userId: character.value?.userId || 1,
    })

    if (response.success && response.data) {
      updateSelectedCharacter({ artImageId: response.data.artImageId, imagePath: null })
    } else {
      throw new Error('Art generation failed.')
    }
  } catch (error) {
    handleError(error, 'Error generating art')
  } finally {
    isGeneratingArt.value = false
  }
}

// Pick Random Image from Gallery
async function pickRandomImageFromGallery() {
  if (!galleryStore.currentGallery) {
    alert('Please select a gallery first.')
    return
  }

  isLoading.value = true
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      updateSelectedCharacter({ artImageId: null, imagePath: randomImage })
    } else {
      throw new Error('Failed to pick a random image from the gallery.')
    }
  } catch (error) {
    handleError(error, 'Error picking random image from gallery')
  } finally {
    isLoading.value = false
  }
}

// Update Character's Art Fields
function updateSelectedCharacter(updates: Partial<Character>) {
  if (character.value) {
    characterStore.selectedCharacter = {
      ...character.value,
      ...updates,
    }
  } else {
    console.warn('No character selected.')
  }
}

// Set Art Image ID
function setArtImageId(artImageId: number) {
  updateSelectedCharacter({ artImageId, imagePath: null })
}

// Handle Errors
function handleError(error: unknown, message: string) {
  if (error instanceof Error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, `${message}: ${error.message}`)
  } else {
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
}
</script>
