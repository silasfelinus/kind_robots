<template>
  <div>
    <!-- Image Upload -->
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      @change="uploadImage"
      class="mb-4"
    />

    <!-- Display the uploaded image as an ArtCard for confirmation -->
    <div v-if="newArtImage" class="mt-6">
      <art-card :art="newArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from './../../../stores/artStore'

const artStore = useArtStore()
const newArtImage = ref(null) // Store the most recently uploaded ArtImage

// Handle the uploaded image and create an ArtImage object
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      await artStore.uploadImage(formData)

      // After uploading, assign the last item in artStore.artImages as the newArtImage
      newArtImage.value = artStore.artImages[artStore.artImages.length - 1]
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}
</script>
