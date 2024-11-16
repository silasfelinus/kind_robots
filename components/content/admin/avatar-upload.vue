<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="uploadAvatar"
    />

    <div v-if="isUploading">Uploading image...</div>

    <div v-if="newArt" class="mt-6">
      <art-card :art="newArt" :art-image="userAvatarImage" />
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
const userId = computed(() => userStore.userId)
const username = computed(() => userStore.username)

// Refs to store new art and image data
const newArt = ref<(typeof artStore.art)[0] | undefined>(undefined)
const userAvatarImage = ref<(typeof artStore.artImages)[0] | undefined>(
  undefined,
)
const isUploading = ref(false)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

// Handle the avatar image upload
async function uploadAvatar(event: Event) {
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

      // After uploading, assign the last item from the store as the user's avatar image
      userAvatarImage.value = artStore.artImages[artStore.artImages.length - 1]

      // Step 2: Create the Art object
      if (userAvatarImage.value?.id) {
        const newArtData = {
          promptString: '[AvatarImage]',
          path: '[AvatarImage]',
          seed: null,
          steps: null,
          galleryId: null,
          promptId: null,
          pitchId: null,
          userId: userId.value ?? 10, // Default userId if undefined
          designer: username.value ?? 'Kind Guest', // Default designer if undefined
          artImageId: userAvatarImage.value.id,
        }

        newArt.value = await artStore.createArt(newArtData)

        // Step 3: Update the user's profile with the new artImageId
        await userStore.updateUserInfo({
          id: userId.value,
          artImageId: userAvatarImage.value.id,
        })
      }
    } catch (error) {
      console.error('Error uploading avatar image or creating art:', error)
    } finally {
      isUploading.value = false // Set uploading state back to false
    }
  }
}
</script>
