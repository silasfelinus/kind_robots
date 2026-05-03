<!-- /components/content/weird/character-art.vue -->
<template>
  <div class="w-full p-4 md:w-1/2">
    <h2 class="flex items-center justify-between text-lg font-medium">
      Character Art
      <gallery-selector class="w-auto" />
    </h2>

    <div class="grid gap-4">
      <CheckboxToggle v-model="freezeArtPrompt" label="Freeze Art Prompt" />

      <div class="flex justify-center">
        <img
          v-if="resolvedActiveImage"
          :src="resolvedActiveImage"
          alt="Character Portrait"
          class="h-64 w-48 rounded-lg object-cover"
        />
        <img
          v-else
          src="/images/bot.webp"
          alt="Default Portrait"
          class="h-64 w-48 rounded-lg object-cover"
        />
      </div>

      <button class="btn btn-accent w-full" @click="changeToRandomImage">
        Get Random Image
      </button>

      <character-uploader class="mt-2 w-full" @uploaded="setArtImageId" />

      <textarea
        v-model="artPrompt"
        placeholder="Describe your character's appearance..."
        class="w-full rounded-lg border p-3"
        :disabled="freezeArtPrompt || isGeneratingArt"
      />

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
import { useArtStore } from '@/stores/artStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useGalleryStore } from '@/stores/galleryStore'

const characterStore = useCharacterStore()
const galleryStore = useGalleryStore()
const artStore = useArtStore()

const isGeneratingArt = ref(false)
const defaultAvatar = '/images/bot.webp'

const resolvedActiveImage = computed(() => {
  return characterStore.characterForm.imagePath || defaultAvatar
})

const artPrompt = computed({
  get: () => characterStore.characterForm.artPrompt || '',
  set: (value: string) => {
    characterStore.characterForm.artPrompt = value
  },
})

const freezeArtPrompt = computed({
  get: (): boolean => Boolean(characterStore.keepField.artPrompt),
  set: (value: boolean) => {
    characterStore.keepField.artPrompt = value
  },
})

function setArtImageId(id: number) {
  characterStore.setArtImageId(id)
}

async function changeToRandomImage() {
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      characterStore.characterForm.imagePath = randomImage
      return
    }

    console.error('Failed to pick a random image.')
  } catch (error) {
    console.error('Error picking random image:', error)
  }
}

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

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Art generation failed.')
    }

    characterStore.characterForm.imagePath = null
    characterStore.characterForm.artImageId = response.data.artImageId
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}
</script>
