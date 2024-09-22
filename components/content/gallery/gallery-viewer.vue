<template>
  <div>
    <!-- Display gallery cards -->
    <div
      v-for="gallery in galleries"
      :key="gallery.id"
      @click="showGallery(gallery)"
    >
      <div class="gallery-card">
        <img :src="gallery.highlightImage" alt="Highlight Image" />
        <h3>{{ gallery.name }}</h3>
        <p>{{ gallery.description }}</p>
      </div>
    </div>
    <!-- Gallery modal -->
    <div v-if="selectedGallery !== null" class="gallery-modal">
      <h2>{{ selectedGallery.name }}</h2>
      <img :src="selectedGallery.highlightImage" alt="Highlight Image" />
      <p>{{ selectedGallery.description }}</p>
      <ul>
        <li v-for="image in galleryImages" :key="image">
          <img :src="image" alt="Image" />
        </li>
      </ul>
      <button @click="closeGallery">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGalleryStore } from '../../../stores/galleryStore'

const galleryStore = useGalleryStore()
galleryStore.loadStore()

const galleries = computed(galleryStore.galleries)

const selectedGallery = ref(null)
const galleryImages = ref([])

function showGallery(gallery) {
  selectedGallery.value = gallery
  // Fetching gallery images from JSON content
  fetch(gallery.content)
    .then((response) => response.json())
    .then((data) => {
      galleryImages.value = data.map(
        (imageName) => `/images/${gallery.name}/${imageName}`,
      )
    })
}

function closeGallery() {
  selectedGallery.value = null
  galleryImages.value = []
}
</script>
