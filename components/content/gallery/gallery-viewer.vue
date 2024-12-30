<template>
  <div>
    <!-- Display gallery cards -->
    <div
      v-for="gallery in galleries"
      :key="gallery.id"
      @click="showGallery(gallery)"
    >
      <div class="gallery-card">
        <img
          :src="gallery.highlightImage || '/images/backtree.webp'"
          alt="Highlight Image"
        />
        <h3>{{ gallery.name }}</h3>
        <p v-if="gallery.description">{{ gallery.description }}</p>
        <p v-else>No description available.</p>
      </div>
    </div>

    <!-- Gallery modal -->
    <transition name="modal">
      <div v-if="selectedGallery !== null" class="gallery-modal">
        <h2>{{ selectedGallery.name }}</h2>
        <img
          :src="selectedGallery.highlightImage || '/images/backtree.webp'"
          alt="Highlight Image"
        />
        <p>{{ selectedGallery.description }}</p>
        <ul>
          <li v-for="image in galleryImages" :key="image">
            <img :src="image" alt="Image" />
          </li>
        </ul>
        <button @click="closeGallery">Close</button>
      </div>
    </transition>

    <!-- Loading and Error States -->
    <div v-if="isLoading">Loading...</div>
    <div v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGalleryStore } from '../../../stores/galleryStore'
import type { Gallery } from '../../../stores/galleryStore'

const galleryStore = useGalleryStore()
// Assuming galleryStore.galleries is typed properly as Gallery[]
const galleries = computed<Gallery[]>(() => galleryStore.galleries)
const selectedGallery = ref<Gallery | null>(null)
galleryStore.initializeStore()

const galleryImages = ref<string[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

async function showGallery(gallery: Gallery) {
  selectedGallery.value = gallery
  isLoading.value = true
  errorMessage.value = ''

  if (gallery.content) {
    try {
      const response = await fetch(gallery.content)
      if (!response.ok) throw new Error('Failed to fetch gallery content')
      const data = await response.json()
      galleryImages.value = data.map(
        (imageName: string) => `/images/${gallery.name}/${imageName}`,
      )
    } catch (error) {
      errorMessage.value = 'Error loading gallery images.' + error
      galleryImages.value = [] // Reset in case of error
    } finally {
      isLoading.value = false
    }
  }
}

function closeGallery() {
  selectedGallery.value = null
  galleryImages.value = []
}
</script>

<style>
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}
.modal-enter,
.modal-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
