<template>
  <div class="relative bg-base-300 rounded-2xl m-4 p-0 shadow-md">
    <!-- View mode switcher -->
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg z-10"
    >
      <div class="flex space-x-3">
        <Icon
          name="kind-icon:grid"
          class="text-2xl cursor-pointer hover:text-primary"
          @click="setView('fourRow')"
        />
        <Icon
          name="kind-icon:dashboard"
          class="text-2xl cursor-pointer hover:text-primary"
          @click="setView('threeRow')"
        />
        <Icon
          name="kind-icon:gridsquare"
          class="text-2xl cursor-pointer hover:text-primary"
          @click="setView('twoRow')"
        />
        <Icon
          name="kind-icon:fullscreen"
          class="text-2xl cursor-pointer hover:text-primary"
          @click="setView('single')"
        />
      </div>
    </div>

    <!-- Filter and Sort Options -->
    <div
      class="flex justify-between items-center px-6 py-4 border-b border-base-200"
    >
      <label class="flex items-center space-x-2 cursor-pointer">
        <input v-model="showOnlyUserArt" type="checkbox" class="checkbox" />
        <span>Show My Art Only</span>
      </label>
      <button class="btn btn-primary btn-sm" @click="toggleSortOrder">
        Sort: {{ sortOrder }}
      </button>
    </div>

    <!-- Gallery Selector -->
    <div class="flex justify-center my-4 px-6">
      <gallery-selector v-model="selectedGalleryId" :galleries="galleries" />
    </div>

    <!-- ArtCards Grid with Scrollbar -->
    <div class="scroll-container overflow-auto max-h-[75vh] p-4">
      <div :class="gridClass">
        <ArtCard
          v-for="art in sortedAndFilteredArt"
          :key="art.id"
          :art="art"
          :art-image="getArtImage(art.artImageId)"
          class="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// State for filtering and sorting
const showOnlyUserArt = ref(false)
const sortOrder = ref('Ascending')

// Computed property for sorting and filtering art
const sortedAndFilteredArt = computed(() => {
  let filteredArt = filteredArtAssets.value

  // Filter by user ID if toggle is on
  if (showOnlyUserArt.value) {
    filteredArt = filteredArt.filter((art) => art.userId === userStore.userId)
  }

  // Sort by ascending or descending order
  return filteredArt.sort((a, b) => {
    if (sortOrder.value === 'Ascending') {
      return a.id - b.id
    }
    return b.id - a.id
  })
})

// Toggle sorting order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'Ascending' ? 'Descending' : 'Ascending'
}

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

const gridClass = computed(() => {
  switch (view.value) {
    case 'twoRow':
      return 'grid grid-cols-2 gap-4'
    case 'threeRow':
      return 'grid grid-cols-3 gap-4'
    case 'fourRow':
      return 'grid grid-cols-4 gap-4'
    case 'single':
      return 'grid grid-cols-1 gap-4'
    default:
      return 'grid grid-cols-3 gap-4' // Default to three-column layout
  }
})
</script>
<style scoped>
.scroll-container {
  /* Force scrollbar, override parent styles */
  overflow-y: auto !important;
}

.scroll-container::-webkit-scrollbar {
  width: 8px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
