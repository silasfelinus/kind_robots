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
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Initialize the stores
const artStore = useArtStore()
const userStore = useUserStore()

const userId = computed(() => userStore.user?.id)
const username = computed(() => userStore.user?.username)

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
      // Step 1: Upload the image
      await artStore.uploadImage(formData)

      // After uploading, assign the last items from the store as the new art image
      newArtImage.value = artStore.artImages[artStore.artImages.length - 1]

      // Create a simple art object
      const newArtData = {
        promptString: '[ArtImage]',
        path: '[ArtImage]',
        seed: null,
        steps: null,
        channelId: null,
        galleryId: 23,
        promptId: null,
        pitchId: null,
        userId: userId.value ?? 10, // Ensure userId is never undefined, default to null
        designer: username.value ?? 'Kind Guest', // Ensure designer is never undefined, default to null
      }

      // Step 3: Call createArt in the store to save the art object and assign the result
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
    }
  }
}
</script>
