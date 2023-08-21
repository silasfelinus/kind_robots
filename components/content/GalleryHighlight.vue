<template>
  <div class="container mx-auto p-4">
    <!-- Galleries Display -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="galleryImage in galleryImages"
        :key="galleryImage.galleryName"
        class="gallery-display border rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
        :class="{ 'scale-125 transform': galleryImage.selected }"
        @click="handleGalleryClick(galleryImage)"
      >
        <img
          v-if="!galleryImage.flipped"
          :src="galleryImage.imagePath"
          :alt="galleryImage.galleryName"
          class="w-full h-64 object-cover rounded-t-lg"
        />
        <img
          v-if="galleryImage.flipped"
          :src="galleryImage.alternateImagePath"
          :alt="galleryImage.galleryName"
          class="w-full h-64 object-cover rounded-t-lg"
        />
        <div class="p-5">
          <h2 class="text-2xl font-bold">{{ galleryImage.galleryName }}</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Gallery } from '../../stores/galleryStore'

interface GalleryImage {
  galleryName: string
  imagePath: string
  alternateImagePath: string
  flipped: boolean
  selected: boolean
}
const galleryImages = ref<GalleryImage[]>([])
let flipInterval: any

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`)
  }
  return await response.json()
}
async function handleGalleryClick(selectedGallery: GalleryImage) {
  for (const gallery of galleryImages.value) {
    gallery.selected = false // Deselect all other galleries
    if (gallery !== selectedGallery) {
      gallery.flipped = true
      gallery.alternateImagePath = await getRandomImageByGalleryName(selectedGallery.galleryName)
    } else {
      gallery.selected = true
    }
  }
}

async function getAllGalleryNames(): Promise<string[]> {
  const data = await fetchFromAPI('/api/gallery')
  if (!data.Galleries || !Array.isArray(data.Galleries)) {
    throw new Error("Invalid or missing 'Galleries' data from API response.")
  }
  return data.Galleries.map((gallery: Gallery) => gallery.name)
}

async function getRandomImageByGalleryName(name: string): Promise<string> {
  const { image } = await fetchFromAPI(`/api/gallery/random/name/${name}`)
  return image
}

async function updateRandomGalleryImage() {
  if (galleryImages.value.length === 0) return

  const randomGallery = galleryImages.value[Math.floor(Math.random() * galleryImages.value.length)]
  const newImagePath = await getRandomImageByGalleryName(randomGallery.galleryName)
  randomGallery.alternateImagePath = newImagePath
  randomGallery.flipped = !randomGallery.flipped
}

onMounted(async () => {
  try {
    const fetchedGalleryNames = await getAllGalleryNames()

    // Fetch both primary and alternate images in parallel for each gallery
    const galleryImagePromises = fetchedGalleryNames.map(async (name) => {
      const [imagePath, alternateImagePath] = await Promise.all([
        getRandomImageByGalleryName(name),
        getRandomImageByGalleryName(name)
      ])

      return {
        galleryName: name,
        alternateGalleryName: name + ' (Selected)', // or fetch another name if applicable
        imagePath,
        alternateImagePath,
        flipped: false,
        selected: false
      }
    })

    // Wait for all image fetch promises to resolve
    galleryImages.value = await Promise.all(galleryImagePromises)

    // Start the flip animation every x seconds
    flipInterval = setInterval(updateRandomGalleryImage, 5000) // 5000ms = 5 seconds
  } catch (error) {
    console.error('Error fetching galleries:', error)
  }
})

onUnmounted(() => {
  clearInterval(flipInterval)
})
</script>

<style scoped>
.gallery-display {
  cursor: pointer;
  transition: transform 0.3s;
  perspective: 1000px;
}

.flip-container {
  position: relative;
  height: 100%;
}

.flip-front,
.flip-back {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  z-index: 1;
}

.flip-front {
  transform: rotateY(0deg);
  z-index: 2;
}

.flip-back {
  transform: rotateY(180deg);
}

.flipped .flip-front {
  transform: rotateY(-180deg);
  z-index: 1;
}

.flipped .flip-back {
  transform: rotateY(0deg);
  z-index: 2;
}
</style>
