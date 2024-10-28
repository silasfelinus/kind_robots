<template>
  <div class="relative bg-base-300 rounded-2xl m-1 p-0">
    <!-- View mode switcher -->
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
    >
      <div class="flex space-x-2">
        <Icon
          name="kind-icon:grid"
          class="text-2xl cursor-pointer"
          @click="setView('fourRow')"
        />
        <Icon
          name="kind-icon:dashboard"
          class="text-2xl cursor-pointer"
          @click="setView('threeRow')"
        />
        <Icon
          name="kind-icon:gridsquare"
          class="text-2xl cursor-pointer"
          @click="setView('twoRow')"
        />
        <Icon
          name="kind-icon:fullscreen"
          class="text-2xl cursor-pointer"
          @click="setView('single')"
        />
      </div>
    </div>

    <!-- Gallery Selector -->
    <div class="flex justify-center my-4">
      <gallery-selector v-model="selectedGalleryId" :galleries="galleries" />
    </div>

    <!-- ArtCards for the selected gallery -->
    <div class="flex flex-wrap">
      <ArtCard
        v-for="art in filteredArtAssets"
        :key="art.id"
        :art="art"
        :art-image="getArtImage(art.artImageId)"
        :class="itemClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'

const artStore = useArtStore()
const galleryStore = useGalleryStore()

// State for view mode and selected gallery
const view = ref('twoRow')
const selectedGalleryId = ref<number | null>(null)

// Fetch galleries from galleryStore
const galleries = computed(() => galleryStore.galleries)

// Fetch and filter art based on the selected gallery
const filteredArtAssets = computed(() => {
  if (selectedGalleryId.value) {
    return artStore.art.filter(
      (art) => art.galleryId === selectedGalleryId.value,
    )
  }
  return artStore.art // If no gallery is selected, return all art
})

// Fetch the corresponding art image based on artImageId
const getArtImage = (artImageId: number | null) => {
  return artImageId ? artStore.getArtImageById(artImageId) : undefined
}


// Initialize the art store and check for saved view mode
onMounted(() => {
  artStore.initialize()
  const savedView = window.localStorage.getItem('view')
  if (savedView) {
    view.value = savedView
  }
})

// Function to update view mode
const setView = (newView: string) => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

// Adjust item class based on the current view
const itemClass = ref('w-1/2 p-4')
watch(view, (newView) => {
  if (newView === 'twoRow') {
    itemClass.value = 'w-1/2 p-4'
  } else if (newView === 'fourRow') {
    itemClass.value = 'w-1/4 p-4'
  } else if (newView === 'single') {
    itemClass.value = 'w-full p-4'
  } else {
    itemClass.value = 'w-1/3 p-4'
  }
})
</script>
