<!-- /components/content/gallery/gallery-selector.vue -->
<template>
  <div>
    <label for="gallery-select">Select Gallery:</label>
    <select
      id="gallery-select"
      v-model="selectedGallery"
      @change="updateGallery"
    >
      <option v-for="gallery in galleryNames" :key="gallery" :value="gallery">
        {{ gallery }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

const galleryStore = useGalleryStore()

// Local state for selected gallery
const selectedGallery = ref<string>('')

// Filter out the gallery with ID 21 and get the names of all remaining galleries
const galleryNames = computed(() =>
  galleryStore.allGalleryNames.filter((gallery) => gallery !== 'cafefred'),
)

// When component is mounted, set the selectedGallery to the current one or default
onMounted(() => {
  selectedGallery.value = galleryStore.currentGallery?.name || ''
})

// Update the selected gallery in the store
const updateGallery = () => {
  galleryStore.setGalleryByName(selectedGallery.value)
}
</script>
