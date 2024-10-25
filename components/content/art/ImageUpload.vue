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
    <div v-if="newArt" class="mt-6">
      <art-card :art="newArt" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from './../../../stores/artStore'

const artStore = useArtStore()
const newArt = ref(null)

// Handle the uploaded image and create an Art object
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      const art = await artStore.uploadImage(formData)
      newArt.value = art
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}
</script>