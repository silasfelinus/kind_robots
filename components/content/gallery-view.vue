<template>
  <div class="container mx-auto p-4">
    <!-- Galleries Display -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="galleryImage in galleryImages"
        :key="galleryImage.galleryName"
        class="gallery-display border rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        :class="{ 'selected-gallery': selectedGallery === galleryImage.galleryName }"
        @click="toggleGallery(galleryImage.galleryName)"
      >
        <img
          :src="galleryImage.imagePath"
          :alt="galleryImage.galleryName"
          class="w-full h-64 object-cover rounded-t-lg"
        />
        <div class="p-5">
          <h2 class="text-2xl font-bold">{{ galleryImage.galleryName }}</h2>
          <button
            class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300"
            @click="loadMore(galleryImage.galleryName)"
          >
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Gallery } from '../../stores/galleryStore'

interface GalleryImage {
  galleryName: string
  imagePath: string
}

const galleryImages = ref<GalleryImage[]>([])
const selectedGallery = ref<string | null>(null)
const initialGalleryImages = ref<GalleryImage[]>([])

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`)
  }
  return await response.json()
}

async function getAllGalleryNames(): Promise<string[]> {
  const { Galleries } = await fetchFromAPI('/api/gallery')
  return Galleries.map((gallery: Gallery) => gallery.name)
}

async function getRandomImageByGalleryName(name: string): Promise<string> {
  const { image } = await fetchFromAPI(`/api/gallery/random/name/${name}`)
  return image
}

onMounted(async () => {
  try {
    const fetchedGalleryNames = await getAllGalleryNames()

    for (const name of fetchedGalleryNames) {
      const imagePath = await getRandomImageByGalleryName(name)
      galleryImages.value.push({
        galleryName: name,
        imagePath
      })
    }
    initialGalleryImages.value = [...galleryImages.value]
  } catch (error) {
    console.error('Error fetching galleries:', error)
  }
})

function toggleGallery(galleryName: string) {
  if (selectedGallery.value === galleryName) {
    galleryImages.value = [...initialGalleryImages.value]
    selectedGallery.value = null
  } else {
    selectedGallery.value = galleryName
    displayMultipleImagesFromGallery(galleryName)
  }
}

async function displayMultipleImagesFromGallery(galleryName: string) {
  try {
    const images: GalleryImage[] = []
    for (let i = 0; i < 3; i++) {
      const imagePath = await getRandomImageByGalleryName(galleryName)
      images.push({ galleryName, imagePath })
    }
    galleryImages.value = images
  } catch (error) {
    console.error('Error fetching multiple images for', galleryName, ':', error)
  }
}

function loadMore(galleryName: string) {
  // Logic to load more images for the given gallery name
  // This can be further refined based on the specific application requirements
}
</script>

<style scoped>
.gallery-display {
  cursor: pointer;
  transition: transform 0.3s;
}
.gallery-display:hover {
  transform: scale(1.03);
}
.selected-gallery {
  border: 4px solid #ffd700; /* Gold border for highlighting */
}
</style>
