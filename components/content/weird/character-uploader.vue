<template>
  <div class="art-uploader">
    <!-- File Input -->
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="handleImageUpload"
    />

    <!-- Uploading State -->
    <div v-if="isUploading" class="text-gray-500">Uploading image...</div>

    <!-- Uploaded Art Card -->
    <div v-if="uploadedArtImage" class="mt-6">
      <art-card :art-image="uploadedArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from '@/stores/artStore'

// Store Initialization
const artStore = useArtStore()

// Component State
const isUploading = ref(false)
const uploadedArtImage = ref(null)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

/**
 * Handle image upload event.
 */
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]

  if (!file) return

  // Validate file type
  if (!allowedFileTypes.includes(file.type)) {
    console.error('Unsupported file type. Please upload a PNG, JPEG, or WebP image.')
    return
  }

  // Prepare form data
  const formData = new FormData()
  formData.append('image', file)

  isUploading.value = true

  try {
    // Upload image to artStore
    await artStore.uploadImage(formData)

    // Get the uploaded art image
    const uploadedImage = artStore.artImages[artStore.artImages.length - 1]
    uploadedArtImage.value = uploadedImage

    // Emit the artImageId
    if (uploadedImage && uploadedImage.id) {
      emit('uploaded', uploadedImage.id)
    }
  } catch (error) {
    console.error('Error uploading image:', error)
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.art-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
