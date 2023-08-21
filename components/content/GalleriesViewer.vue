<template>
  <div class="min-h-screen bg-gray-100">
    <div v-if="error" class="text-red-500 text-center my-10">An error occurred: {{ error }}</div>

    <div
      v-if="galleries"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-10"
    >
      <div v-for="gallery in galleries" :key="gallery.id" class="bg-white p-5 rounded shadow">
        <img :src="gallery.highlightImage" alt="" class="w-full rounded mb-3" />
        <h2 class="text-lg font-bold mb-2">{{ gallery.name }}</h2>
        <p class="text-sm">{{ gallery.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const galleries = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await axios.get('/api/gallery')
    if (response.data.success) {
      galleries.value = response.data.Galleries
    } else {
      error.value = 'Failed to fetch data.'
    }
  } catch (err) {
    error.value = err.message
  }
})
</script>

<style scoped>
/* Additional styling if necessary */
</style>
