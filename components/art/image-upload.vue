<!-- /components/content/art/image-upload.vue -->
<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="mb-4"
      @change="uploadImage"
    />

    <div v-if="isUploading">Uploading image...</div>

    <div v-if="newArt && newArtImage" class="mt-6">
      <art-card :art="newArt" :art-image="newArtImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const userStore = useUserStore()

const userId = computed(() => userStore.user?.id)
const username = computed(() => userStore.user?.username)

const newArt = ref<(typeof artStore.art)[0] | undefined>(undefined)
const newArtImage = ref<(typeof artStore.artImages)[0] | undefined>(undefined)
const isUploading = ref(false)

const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (!uploadedFile) return

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
    await artStore.uploadImage(formData)

    const lastImage = artStore.artImages[artStore.artImages.length - 1] ?? null

    if (!lastImage) {
      console.error('No image returned from upload')
      return
    }

    newArtImage.value = lastImage

    const newArtData = {
      promptString: '[ArtImage]',
      path: '[ArtImage]',
      seed: null,
      steps: null,
      galleryId: 21,
      promptId: null,
      pitchId: null,
      userId: userId.value ?? 10,
      designer: username.value ?? 'Kind Guest',
      artImageId: lastImage.id,
    }

    const createdArt = await artStore.createArt(newArtData)

    if (!createdArt) {
      console.error('Failed to create art')
      return
    }

    newArt.value = createdArt

    await artStore.updateArtImageWithArtId(lastImage.id, createdArt.id)
  } catch (error) {
    console.error('Error uploading image or creating art:', error)
  } finally {
    isUploading.value = false
  }
}
</script>
