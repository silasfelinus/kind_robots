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
    <transition name="modal">
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
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGalleryStore } from '../../../stores/galleryStore'

const galleryStore = useGalleryStore()
galleryStore.initializeStore()

const galleries = computed(() => galleryStore.galleries)
const selectedGallery = ref(null)
const galleryImages = ref<string[]>([])

function showGallery(gallery: any) {
  selectedGallery.value = gallery

  if (gallery.content) {
    // Fetching gallery images from JSON content
    fetch(gallery.content)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch gallery content')
        return response.json()
      })
      .then((data) => {
        galleryImages.value = data.map(
          (imageName: string) => `/images/${gallery.name}/${imageName}`,
        )
      })
      .catch((error) => {
        console.error('Error loading gallery images:', error)
        galleryImages.value = [] // Reset in case of error
      })
  }
}

function closeGallery() {
  selectedGallery.value = null
  galleryImages.value = []
}
</script>

<style>
/* Add transition for modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s;
}
.modal-enter, .modal-leave-to /* .modal-leave-active in <2.1.8 */ {
  opacity: 0;
}

.gallery-modal {
  /* Your existing modal styling */
}
</style>
