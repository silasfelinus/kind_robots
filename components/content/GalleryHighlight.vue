<template>
  <!-- Loading state -->
  <div v-if="loading" class="text-center py-5 text-gray-500">Loading galleries...</div>

  <!-- Error state -->
  <div v-else-if="error" class="text-center py-5 text-red-500">
    Error loading galleries: {{ error.message }}
  </div>

  <!-- Empty state -->
  <div v-else-if="!galleries.length" class="text-center py-5 text-gray-400">
    No galleries available.
  </div>

  <!-- Galleries -->
  <div
    v-for="gallery in galleries"
    v-else
    :key="gallery.id"
    class="flip-container rounded-lg overflow-hidden shadow-lg my-4"
    :class="{ flipped: gallery.flip }"
  >
    <div class="flipper">
      <div class="front">
        <img
          :src="gallery.currentImage"
          alt="Current Gallery Image"
          class="w-full h-64 object-cover"
        />
      </div>
      <div class="back">
        <img :src="gallery.nextImage" alt="Next Gallery Image" class="w-full h-64 object-cover" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGalleryStore } from '~/stores/galleryStore'

const galleryStore = useGalleryStore()
const galleries = ref([])
const currentGallery = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    await galleryStore.loadStore()
    console.log('Loading store')

    galleries.value = galleryStore.galleries.map((g) => {
      // Convert the imagePaths string into an array only if it's defined
      const imageArray = g.imagePaths
        ? g.imagePaths.split(',').map((imgPath) => imgPath.trim())
        : []

      // Return the gallery object with currentImage and nextImage properties
      return {
        ...g,
        imageArray,
        currentImage: getImageFullPath(g.name, getRandomImagePath(imageArray)),
        nextImage: getImageFullPath(g.name, getRandomImagePath(imageArray))
      }
    })

    console.log('galleries loaded')
    currentGallery.value = galleryStore.currentGallery
    console.log({ currentGallery } + 'currentGallery loaded')

    // Inside onMounted
    setInterval(() => {
      for (let gallery of galleries.value) {
        // Backup current image
        const currentImage = gallery.currentImage

        // Set current to next
        gallery.currentImage = gallery.nextImage

        // Choose a new random next image (ensure it's not the same as the current)
        do {
          gallery.nextImage = getRandomImageFromGallery(gallery)
        } while (gallery.nextImage === currentImage)

        // Trigger flip
        gallery.flip = !gallery.flip
      }
    }, 2000)
  } catch (err) {
    error.value = err
    console.error('Error loading galleries:', err)
  } finally {
    loading.value = false
  }
})

const getRandomImagePath = (imageArray) => {
  return imageArray[Math.floor(Math.random() * imageArray.length)]
}

const getImageFullPath = (galleryName, imagePath) => {
  return `/images/${galleryName}/${imagePath}`
}

const getRandomImageFromGallery = (gallery) => {
  const randomImagePath = getRandomImagePath(gallery.imageArray)
  return getImageFullPath(gallery.name, randomImagePath)
}
</script>

<style scoped>
.flip-container {
  perspective: 1000px;
}

.flip-container.flipped .flipper {
  transform: rotateX(180deg);
}

.flipper {
  transition: transform 2s;
  transform-style: preserve-3d;
  position: relative;
}

.front,
.back {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.front {
  z-index: 2;
  transform: rotateX(0deg);
}

.back {
  transform: rotateX(180deg);
}
.loading-indicator,
.error,
.empty {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: red;
}

.empty {
  color: #aaa;
}
</style>
