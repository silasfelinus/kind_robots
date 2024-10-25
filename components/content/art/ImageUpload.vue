<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      @change="uploadImage"
    />
  </div>
</template>

<script setup lang="ts">
import { useArtStore } from '../../../stores/artStore'

const artStore = useArtStore()

const uploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      // Call the store's upload method, which should handle storing the image and creating an Art object
      const newArt = await artStore.uploadImage(formData)

      // Optionally, confirm that the Art object has been created successfully
      console.log('Uploaded image and created Art object:', newArt)
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}
</script>
