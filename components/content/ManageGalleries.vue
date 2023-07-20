<template>
  <div class="flex flex-col p-8">
    <div class="mb-4">
      <label for="gallerySelect" class="block text-sm font-medium text-gray-700"
        >Select a gallery:</label
      >
      <select
        id="gallerySelect"
        v-model="activeGalleryId"
        class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option v-for="gallery in galleries" :key="gallery.id" :value="gallery.id">
          {{ gallery.name }}
        </option>
      </select>

      <div
        v-if="activeGallery"
        class="flex flex-col items-center justify-between w-full p-2 mb-4 cursor-pointer"
      >
        <img :src="displayImage" class="w-full h-96 object-cover rounded-lg" />
        <h2 class="mt-4 text-2xl font-semibold text-center">{{ activeGallery.name }}</h2>
        <p class="mt-2 text-center">{{ activeGallery.description }}</p>
        <div class="mt-4 space-x-4">
          <button
            class="py-2 px-4 rounded bg-red-500 text-white"
            @click="rateImage('Delete Not Art')"
          >
            Delete Not Art
          </button>
          <button class="py-2 px-4 rounded bg-green-500 text-white" @click="getRandomImage()">
            Refresh
          </button>
          <button class="py-2 px-4 rounded bg-blue-500 text-white" @click="rateImage('Art')">
            Art
          </button>
          <button
            class="py-2 px-4 rounded bg-yellow-500 text-white"
            @click="rateImage('Gold Star')"
          >
            Gold Star
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Gallery } from '../../types/gallery'

const galleries = ref<Gallery[]>([])
const activeGalleryId = ref<number | null>(null)
const randomImage = ref<string | null>(null)
let activeGallery: Gallery | null = null

onMounted(async () => {
  await fetchGalleries()
  if (galleries.value.length > 0) {
    activeGalleryId.value = galleries.value[0].id
    await getRandomImage()
  }
})

watch(activeGalleryId, async (newVal) => {
  if (newVal) {
    activeGallery = galleries.value.find((gallery) => gallery.id === newVal) || null
    await getRandomImage()
  }
})

const fetchGalleries = async () => {
  const response = await fetch('/api/galleries')
  galleries.value = await response.json()
}

const getRandomImage = async () => {
  if (activeGalleryId.value !== null) {
    const response = await fetch(`/api/galleries/${activeGalleryId.value}/random`)
    const data = await response.json()
    randomImage.value = data.imagePath
  }
}

const rateImage = async (rating: string) => {
  console.log(`Image Rated: ${rating}`)
}

const displayImage = computed(() => {
  return randomImage.value || '/images/avatars/avatar1.jpg' // set the path of your placeholder image
})
</script>
