<template>
  <div class="w-full md:w-1/2 p-4">
    <h2 class="text-lg font-medium flex justify-between items-center">
      Character Art
      <gallery-selector class="w-auto" />
    </h2>
    <div class="grid gap-4">
      <!-- Freeze Art Prompt Toggle -->
      <CheckboxToggle
        v-model="characterStore.keepField.artPrompt"
        label="Freeze Art Prompt"
      />

      <!-- Character Image Preview -->
      <div class="flex justify-center">
        <img
          v-if="resolvedActiveImage"
          :src="resolvedActiveImage"
          alt="Character Portrait"
          class="object-cover w-48 h-64 rounded-lg"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="object-cover w-48 h-64 rounded-lg"
        />
      </div>

      <!-- Random Image Button -->
      <button class="btn btn-accent w-full" @click="changeToRandomImage">
        Get Random Image
      </button>

      <!-- Character Image Uploader -->
      <character-uploader class="w-full mt-2" @uploaded="setArtImageId" />

      <!-- Art Prompt Textarea -->
      <textarea
        v-model="artPrompt"
        placeholder="Describe your character's appearance..."
        class="w-full p-3 rounded-lg border"
        :disabled="characterStore.keepField.artPrompt || isGeneratingArt"
      ></textarea>

      <!-- Generate Art Button -->
      <button
        class="btn btn-primary w-full"
        :disabled="isGeneratingArt"
        @click="generateArtImage"
      >
        {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useArtStore } from '@/stores/artStore'

const characterStore = useCharacterStore()
const galleryStore = useGalleryStore()
const artStore = useArtStore()

const isGeneratingArt = ref(false)
const defaultAvatar = '/images/bot.webp'

// Computed property for resolving the character's active image
const resolvedActiveImage = computed(() => {
  const character = characterStore.characterForm
  return character.imagePath || defaultAvatar
})

// Computed property for the art prompt
const artPrompt = computed({
  get: () => characterStore.characterForm.artPrompt || '',
  set: (value) => {
    characterStore.characterForm.artPrompt = value
  },
})

// Function to set the uploaded image ID
function setArtImageId(id: number) {
  characterStore.setArtImageId(id)
}

// Function to pick a random image from the gallery
async function changeToRandomImage() {
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      characterStore.characterForm.imagePath = randomImage
    } else {
      console.error('Failed to pick a random image.')
    }
  } catch (error) {
    console.error('Error picking random image:', error)
  }
}

// Function to generate art based on the current art prompt
async function generateArtImage() {
  if (!artPrompt.value) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: artPrompt.value,
      title: characterStore.characterForm.name || 'Unnamed Character',
      collection: 'characters',
      userId: characterStore.characterForm.userId || 1,
    })

    if (response.success && response.data) {
      characterStore.characterForm.imagePath = null
      characterStore.characterForm.artImageId = response.data.artImageId
    } else {
      throw new Error('Art generation failed.')
    }
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}
</script>
