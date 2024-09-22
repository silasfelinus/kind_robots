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

const folders = ref([])
const selectedFolder = ref('')
const images = ref([])

onMounted(async () => {
  // Fetch the folders from PhotoPrism API using fetch
  const response = await fetch('https://photos.acrocatranch.com/api/v1/albums')
  if (response.ok) {
    const data = await response.json()
    folders.value = data
  } else {
    console.error('Failed to fetch folders')
  }
})

const fetchImages = async () => {
  if (!selectedFolder.value) return
  const response = await fetch(
    `https://photos.acrocatranch.com/api/v1/photos?album=${selectedFolder.value}`,
  )
  if (response.ok) {
    const data = await response.json()
    images.value = data
  } else {
    console.error('Failed to fetch images')
  }
}

const imageUrl = (image) => {
  return `https://photos.acrocatranch.com/photoprism/originals/${image.Path}`
}
</script>

<style>
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
