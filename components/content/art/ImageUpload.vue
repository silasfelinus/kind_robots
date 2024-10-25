<template>
  <div>
    <!-- Image Upload -->
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="uploadImage"
    />

    <!-- Display the uploaded image as an ArtCard for confirmation -->
    <div v-if="newArt" class="mt-6">
      <art-card :art="newArt" :art-image="newArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from '@/stores/artStore'

// Initialize the store
const artStore = useArtStore()

// Use undefined instead of null to match optional type expectations
const newArt = ref<(typeof artStore.art)[0] | undefined>(undefined)
const newArtImage = ref<(typeof artStore.artImages)[0] | undefined>(undefined)

// Handle the uploaded image and process through the store
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      // Call the store's uploadImage action
      await artStore.uploadImage(formData)

      // After uploading, assign the last items from the store as the new art and new art image
      newArt.value = artStore.art[artStore.art.length - 1]
      newArtImage.value = artStore.artImages[artStore.artImages.length - 1]
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}
</script>
