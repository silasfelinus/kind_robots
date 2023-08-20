<template>
  <div class="container mx-auto p-4">
    <!-- Highlighted Galleries -->
    <div v-if="highlightedGalleries.length" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="gallery in highlightedGalleries"
        :key="'highlighted-' + gallery.id"
        class="gallery-card border p-5"
      >
        <img
          :src="gallery.highlightImage"
          alt="Highlight Image"
          class="w-full h-48 object-cover mb-4"
        />
        <h2 class="text-xl font-bold mb-2">{{ gallery.name }}</h2>
        <p>{{ gallery.description }}</p>
      </div>
    </div>

    <!-- All Galleries -->
    <h2 class="text-2xl font-semibold mb-4">All Galleries</h2>
    <div v-if="allGalleries.length" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        v-for="gallery in allGalleries"
        :key="'all-' + gallery.id"
        class="gallery-card border p-5"
      >
        <img
          :src="gallery.highlightImage"
          alt="Highlight Image"
          class="w-full h-48 object-cover mb-4"
        />
        <h2 class="text-xl font-bold mb-2">{{ gallery.name }}</h2>
        <p>{{ gallery.description }}</p>
      </div>
    </div>

    <div v-else>
      <p>Loading all galleries...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchGalleries, randomGallery } from '../../server/api/gallery'

const highlightedGalleries = ref([])
const allGalleries = ref([])

onMounted(async () => {
  try {
    // Fetching three unique highlighted galleries
    const fetchedGalleries = []
    for (let i = 0; i < 3; i++) {
      fetchedGalleries.push(await randomGallery())
    }
    highlightedGalleries.value = fetchedGalleries

    // Fetching all galleries
    const fetchedAllGalleries = await fetchGalleries()
    allGalleries.value = fetchedAllGalleries
  } catch (error) {
    console.error('Error fetching galleries:', error)
  }
})
</script>
