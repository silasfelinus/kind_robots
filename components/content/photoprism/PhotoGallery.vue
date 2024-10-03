<template>
  <div>
    <select v-model="selectedFolder" @change="fetchImages">
      <option v-for="folder in folders" :key="folder.id" :value="folder.name">
        {{ folder.name }}
      </option>
    </select>

    <div v-if="images.length">
      <div v-for="image in images" :key="image.id" class="gallery-item">
        <img :src="imageUrl(image)" alt="Image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define Folder and Image interfaces for better type safety
interface Folder {
  id: string
  name: string
}

interface Image {
  id: string
  Path: string
}

// State variables
const folders = ref<Folder[]>([])
const selectedFolder = ref<string>('')
const images = ref<Image[]>([])

onMounted(async () => {
  try {
    const response = await fetch(
      'https://photos.acrocatranch.com/api/v1/albums',
      {
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.PHOTOPRISM_USER + ':' + import.meta.env.PHOTOPRISM_PASSWORD)}`,
        },
      },
    )
    if (response.ok) {
      const data = await response.json()
      folders.value = data as Folder[] // Ensure the response data is cast to Folder[]
    } else {
      console.error('Failed to fetch folders')
    }
  } catch (error) {
    console.error('An error occurred while fetching folders:', error)
  }
})

const fetchImages = async () => {
  if (!selectedFolder.value) return
  try {
    const response = await fetch(
      `https://photos.acrocatranch.com/api/v1/photos?album=${selectedFolder.value}`,
      {
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.PHOTOPRISM_USER + ':' + import.meta.env.PHOTOPRISM_PASSWORD)}`,
        },
      },
    )
    if (response.ok) {
      const data = await response.json()
      images.value = data as Image[] // Ensure the response data is cast to Image[]
    } else {
      console.error('Failed to fetch images')
    }
  } catch (error) {
    console.error('An error occurred while fetching images:', error)
  }
}

const imageUrl = (image: Image) => {
  return `${import.meta.env.PHOTOPRISM_WEBDAV_URL}/originals/${image.Path}`
}
</script>

<style scoped>
/* Basic gallery styling */
.gallery-item {
  display: inline-block;
  margin: 10px;
}
.gallery-item img {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}
</style>
