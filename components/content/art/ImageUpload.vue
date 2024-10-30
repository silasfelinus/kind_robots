<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="uploadImage"
    />

    <div v-if="isUploading">Uploading image...</div>

    <div v-if="newArt" class="mt-6">
      <art-card :art="newArt" :art-image="newArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Initialize the stores
const artStore = useArtStore()
const userStore = useUserStore()

// Computed values for user data
const userId = computed(() => userStore.user?.id)
const username = computed(() => userStore.user?.username)

// Refs to store new art and image data
const newArt = ref<(typeof artStore.art)[0] | undefined>(undefined)
const newArtImage = ref<(typeof artStore.artImages)[0] | undefined>(undefined)
const isUploading = ref(false)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

// Handle the image upload
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    // Check if the file type is valid
    if (!allowedFileTypes.includes(uploadedFile.type)) {
      console.error(
        'Unsupported file type. Please upload a PNG, JPEG, or WebP image.',
      )
      return
    }

    // Create a new FormData object
    const formData = new FormData()
    formData.append('image', uploadedFile)

    isUploading.value = true // Set uploading state to true

    try {
      // Step 1: Upload the image
      await artStore.uploadImage(formData)

      // After uploading, assign the last item from the store as the new art image
      newArtImage.value = artStore.artImages[artStore.artImages.length - 1]

      // Create a simple art object
      const newArtData = {
        promptString: '[ArtImage]',
        path: '[ArtImage]',
        seed: null,
        steps: null,
        channelId: null,
        galleryId: 21,
        promptId: null,
        pitchId: null,
        userId: userId.value ?? 10, // Default userId if undefined
        designer: username.value ?? 'Kind Guest', // Default designer if undefined
        artImageId: newArtImage.value.id,
      }

      // Step 3: Create the art entry
      newArt.value = await artStore.createArt(newArtData)

      // Step 4: Link the created artId to the ArtImage
      if (newArt.value && newArtImage.value) {
        await artStore.updateArtImageWithArtId(
          newArtImage.value.id,
          newArt.value.id,
        )
      }
    } catch (error) {
      console.error('Error uploading image or creating art:', error)
    } finally {
      isUploading.value = false // Set uploading state back to false
    }
  }
}
</script>
