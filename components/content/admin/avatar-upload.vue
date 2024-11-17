<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="uploadAvatar"
    />

    <div v-if="isUploading" class="text-info">Uploading image...</div>
    <div v-else-if="uploadError" class="text-error">{{ uploadError }}</div>
    <div v-else-if="uploadSuccess" class="text-success">{{ uploadSuccess }}</div>

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
const uploadError = ref<string | null>(null)
const uploadSuccess = ref<string | null>(null)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

// Upload avatar handler
async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    console.log('File selected:', uploadedFile.name, uploadedFile.type)

    // Check file type
    if (!allowedFileTypes.includes(uploadedFile.type)) {
      console.error(
        'Unsupported file type. Please upload a PNG, JPEG, or WebP image.'
      )
      uploadError.value = 'Unsupported file type. Only PNG, JPEG, or WebP allowed.'
      return
    }

    const formData = new FormData()
    formData.append('image', uploadedFile)

    isUploading.value = true
    uploadError.value = null
    uploadSuccess.value = null

    try {
      console.log('Starting image upload...')
      await artStore.uploadImage(formData)
      console.log('Image uploaded successfully. Updating art store...')

      userAvatarImage.value = artStore.artImages.at(-1) || undefined
      console.log('Latest uploaded image:', userAvatarImage.value)

      if (userAvatarImage.value?.id) {
        console.log('Creating new art entry with uploaded image...')
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

        console.log('New art created:', newArt.value)

        if (newArt.value?.id) {
          console.log('Adding new art to collection...')
          await artStore.addArtToCollection({
            userId: userId.value,
            artId: newArt.value.id,
            label: 'avatars',
          })
          console.log('Art added to collection successfully.')
        }

        console.log('Updating user profile with new avatar image...')
        await userStore.updateUserInfo({
          id: userId.value,
          artImageId: userAvatarImage.value.id,
        })
        console.log('User profile updated successfully.')
      }

      uploadSuccess.value = 'Avatar uploaded and profile updated successfully!'
    } catch (error) {
      console.error('Error during upload process:', error)
      uploadError.value = 'An error occurred while uploading your avatar. Please try again.'
    } finally {
      isUploading.value = false
    }
  } else {
    console.error('No file selected.')
    uploadError.value = 'No file selected. Please choose an image file to upload.'
  }
}
</script>
