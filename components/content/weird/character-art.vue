<template>
  <div
    class="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center space-y-4"
  >
    <!-- Avatar Preview -->
    <div class="mt-4 flex flex-col items-center space-y-2">
      <img
        :src="resolvedActiveImage"
        alt="Character Avatar Preview"
        class="w-40 h-40 object-cover rounded-full shadow-lg border-2 border-gray-300"
      />
      <p class="text-sm text-gray-500">Preview your avatar</p>
    </div>

    <!-- Image Upload -->
    <image-upload @uploaded="setArtImageId" />

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
      <gallery-selector @gallery-selected="setCurrentGallery" />
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

// Selected character as a computed property
const character = computed(() => characterStore.selectedCharacter)

const resolvedActiveImage = computed(() => {
  if (!character.value) {
    return defaultAvatar // If character is null, use the default avatar
  }

  if (character.value.artImageId) {
    const artImage = artStore.artImages.find(
      (image) => image.id === character.value!.artImageId, // Non-null assertion since we've checked
    )
    return artImage?.imageData || defaultAvatar // Use artImage if available
  }

  return character.value.imagePath || defaultAvatar // Fallback to imagePath or default
})

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

// Generate art and update `artImageId`
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
      updateSelectedCharacter({
        artImageId: response.data.artImageId,
        imagePath: null, // Clear `imagePath` when setting `artImageId`
      })
    } else {
      alert('Art generation failed.')
    }
  } catch (error) {
    if (error instanceof Error) {
      errorStore.setError(
        ErrorType.GENERAL_ERROR,
        `Error generating art: ${error.message}`,
      )
    } else {
      console.error('Unexpected error:', error)
    }
  } finally {
    isGeneratingArt.value = false
  }
}
function updateSelectedCharacter(updates: Partial<Character>) {
  if (character.value) {
    characterStore.selectedCharacter = {
      ...character.value,
      ...updates,
      id: character.value.id || 0,
      name: character.value.name || 'Unnamed Character',
      createdAt: character.value.createdAt || new Date(),
      updatedAt: new Date(),
      honorific: character.value.honorific || null,
      achievements: character.value.achievements || null,
      alignment: character.value.alignment || null,
      experience: character.value.experience || 0,
      userId: character.value.userId || 1,
    }
  } else {
    console.warn('No character selected.')
  }
}

// Example: Pick a random gallery image
async function pickRandomImageFromGallery() {
  if (!galleryStore.currentGallery) {
    alert('Please select a gallery first.')
    return
  }

  isLoading.value = true
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      updateSelectedCharacter({
        artImageId: null, // Clear artImageId
        imagePath: randomImage,
      })
    } else {
      throw new Error('Failed to pick a random image from the gallery.')
    }
  } catch (error) {
    if (error instanceof Error) {
      errorStore.setError(ErrorType.GENERAL_ERROR, error.message)
    } else {
      errorStore.setError(ErrorType.GENERAL_ERROR, 'An unknown error occurred.')
    }
  } finally {
    isLoading.value = false
  }
}

function setCurrentGallery(galleryId: number) {
  galleryStore.setCurrentGallery(galleryId) // Assuming this is a valid method in galleryStore
}

function setArtImageId(artImageId: number) {
  updateSelectedCharacter({
    artImageId,
    imagePath: null, // Clear `imagePath` when setting `artImageId`
  })
}
</script>
