<!-- /components/content/weird/scenario-uploader.vue -->
<template>
  <div class="scenario-uploader">
    <!-- File Input -->
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4 w-full border rounded-lg p-2"
      @change="handleImageUpload"
    />

    <!-- Uploading State -->
    <div v-if="isUploading" class="text-gray-500">Uploading image...</div>

    <!-- Uploaded Art Card -->
    <div v-if="uploadedArt && uploadedArtImage" class="mt-6">
      <art-card :art="uploadedArt" :art-image="uploadedArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Store Initialization
const artStore = useArtStore()
const userStore = useUserStore()

// Emit Declaration
const emit = defineEmits<{ (event: 'uploaded', id: number): void }>()

// Component State
const isUploading = ref(false)
const uploadedArt = ref<(typeof artStore.art)[0] | undefined>(undefined)
const uploadedArtImage = ref<(typeof artStore.artImages)[0] | undefined>(
  undefined,
)

// Allowed file types
const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

// User Info
const userId = computed(() => userStore.user?.id || 10) // Fallback to default userId
const username = computed(() => userStore.user?.username || 'Kind Guest') // Fallback to default designer

/**
 * Handle image upload event.
 */
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]

  if (!file) return

  // Validate file type
  if (!allowedFileTypes.includes(file.type)) {
    alert('Unsupported file type. Please upload a PNG, JPEG, or WebP image.')
    return
  }

  // Prepare form data
  const formData = new FormData()
  formData.append('image', file)

  isUploading.value = true

  try {
    // Upload image to artStore
    await artStore.uploadImage(formData)

    // Retrieve the uploaded art image
    uploadedArtImage.value = artStore.artImages.at(-1)

    if (!uploadedArtImage.value) {
      throw new Error('Failed to retrieve uploaded art image.')
    }

    // Create a simple art object
    const newArtData = {
      promptString: '[ArtImage]',
      path: '[ArtImage]',
      seed: null,
      steps: null,
      galleryId: 21,
      promptId: null,
      pitchId: null,
      userId: userId.value,
      designer: username.value,
      artImageId: uploadedArtImage.value.id,
    }

    // Create art entry
    uploadedArt.value = await artStore.createArt(newArtData)

    if (!uploadedArt.value) {
      throw new Error('Failed to create art object.')
    }

    // Link the created artId to the ArtImage
    await artStore.updateArtImageWithArtId(
      uploadedArtImage.value.id,
      uploadedArt.value.id,
    )

    // Emit the artImageId
    emit('uploaded', uploadedArtImage.value.id)
  } catch (error) {
    console.error('Error uploading image or creating art:', error)
    alert('Failed to upload image or create art. Please try again.')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.scenario-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
