<template>
  <div
    class="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center space-y-4"
  >
    <!-- Avatar Image URL Input -->
    <label for="avatarImageInput" class="block text-sm font-medium">
      Avatar Image (URL):
    </label>
    <input
      id="avatarImageInput"
      v-model="avatarImage"
      type="text"
      class="w-full p-2 rounded-lg border mb-2"
      placeholder="Enter a custom avatar image URL"
    />

    <!-- Image Upload -->
    <image-upload @uploaded="setArtImageId" />

    <!-- Avatar Preview -->
    <div class="mt-4 flex flex-col items-center space-y-2">
      <img
        :src="avatarImage"
        alt="Character Avatar Preview"
        class="w-40 h-40 object-cover rounded-full shadow-lg border-2 border-gray-300"
      />
      <p class="text-sm text-gray-500">Preview your avatar</p>
    </div>

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

// Bind avatarImage to character's imagePath
const avatarImage = computed({
  get() {
    return characterStore.selectedCharacter?.imagePath || defaultAvatar
  },
  set(value) {
    if (characterStore.selectedCharacter) {
      characterStore.selectedCharacter = {
        ...characterStore.selectedCharacter,
        imagePath: value,
      }
    }
  },
})

// Art prompt
const artPrompt = computed({
  get: () => characterStore.selectedCharacter?.artPrompt || '',
  set: (value) => {
    if (characterStore.selectedCharacter) {
      characterStore.selectedCharacter = {
        ...characterStore.selectedCharacter,
        artPrompt: value,
      }
    }
  },
})

async function generateArt() {
  if (!artPrompt.value) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: artPrompt.value,
      title: characterStore.selectedCharacter?.name || 'Unnamed Character',
      collection: 'characters',
      userId: characterStore.selectedCharacter?.userId || 1,
    })

    if (response.success && response.data) {
      if (characterStore.selectedCharacter) {
        characterStore.selectedCharacter = {
          ...characterStore.selectedCharacter,
          artImageId: response.data.artImageId,
          id: characterStore.selectedCharacter.id || 0,
          name: characterStore.selectedCharacter.name || 'Unnamed',
          createdAt: characterStore.selectedCharacter.createdAt || new Date(),
          updatedAt: new Date(),
          honorific: characterStore.selectedCharacter.honorific || null,
          achievements: characterStore.selectedCharacter.achievements || null,
          alignment: characterStore.selectedCharacter.alignment || null,
          experience: characterStore.selectedCharacter.experience || 0,
          userId: characterStore.selectedCharacter.userId || 1,
        }
      } else {
        console.error('Selected character is null or undefined.')
      }
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

async function pickRandomImageFromGallery() {
  if (!galleryStore.currentGallery) {
    alert('Please select a gallery first.')
    return
  }

  isLoading.value = true
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      avatarImage.value = randomImage
    } else {
      throw new Error('Failed to pick a random image from the gallery.')
    }
  } catch (error) {
    if (error instanceof Error) {
      errorStore.setError(ErrorType.GENERAL_ERROR, error.message)
      console.error('Error picking random image:', error.message)
    } else {
      errorStore.setError(ErrorType.GENERAL_ERROR, 'An unknown error occurred.')
      console.error('Unexpected error:', error)
    }
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
  if (characterStore.selectedCharacter) {
    characterStore.selectedCharacter = {
      ...characterStore.selectedCharacter,
      artImageId,
    }
  }
}
</script>
