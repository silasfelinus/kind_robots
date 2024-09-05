<template>
  <div>
    <label for="gallery-select">Select Gallery:</label>
    <select id="gallery-select" v-model="selectedGallery" @change="updateGallery">
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

// Get all gallery names from the store
const galleryNames = computed(() => galleryStore.allGalleryNames)

// When component is mounted, set the selectedGallery to the current one or default
onMounted(() => {
  selectedGallery.value = galleryStore.currentGallery?.name || ''
})

// Update the selected gallery in the store
const updateGallery = () => {
  galleryStore.setGalleryByName(selectedGallery.value)
}
</script>