<template>
  <div>
    <input
      type="file"
      accept="image/png, image/jpeg, image/webp"
      @change="uploadImage"
    />
  </div>
</template>

<script setup>
import { useArtStore } from './../../../stores/artStore'

const artStore = useArtStore()

const uploadImage = async (event) => {
  const uploadedFile = event.target.files[0]
  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      await artStore.uploadImage(formData)
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}
</script>
