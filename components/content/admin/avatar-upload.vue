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
      <art-card :art="newArt" :art-image="userAvatarImage || undefined" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Stores
const artStore = useArtStore()
const userStore = useUserStore()

// User data
const userId = computed(() => userStore.userId)
const username = computed(() => userStore.username)

// State
const newArt = ref<Art | null | undefined>(undefined)
const userAvatarImage = ref<ArtImage | null | undefined>(undefined)

const isUploading = ref(false)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

// Upload avatar handler
async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    // Check file type
    if (!allowedFileTypes.includes(uploadedFile.type)) {
      console.error(
        'Unsupported file type. Please upload a PNG, JPEG, or WebP image.',
      )
      return
    }

    const formData = new FormData()
    formData.append('image', uploadedFile)

    isUploading.value = true

    try {
      // Upload image
      await artStore.uploadImage(formData)
      userAvatarImage.value = artStore.artImages.at(-1) || undefined

      // Create art
      if (userAvatarImage.value?.id) {
        const newArtData = {
          promptString: '[AvatarImage]',
          path: '[AvatarImage]',
          userId: userId.value,
          designer: username.value || 'Kind Guest',
          artImageId: userAvatarImage.value.id,
          seed: null,
          steps: null,
          galleryId: null,
          promptId: null,
          pitchId: null,
        }
        newArt.value = await artStore.createArt(newArtData)

        if (newArt.value?.id) {
          await artStore.addArtToCollection({
            userId: userId.value,
            artId: newArt.value.id,
            label: 'avatars',
          })
        }

        // Update user profile
        await userStore.updateUserInfo({
          id: userId.value,
          artImageId: userAvatarImage.value.id,
        })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      isUploading.value = false
    }
  }
}
</script>
