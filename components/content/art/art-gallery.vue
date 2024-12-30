<template>
  <div class="relative bg-base-300 rounded-2xl shadow-md">
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

// State and Stores
const userStore = useUserStore()
const artStore = useArtStore()
const galleryStore = useGalleryStore()

// View settings
const view = ref<'twoRow' | 'threeRow' | 'fourRow' | 'single'>('twoRow')
const selectedGalleryId = ref<number | null>(null)

// Sort and filter settings
const showOnlyUserArt = ref(false)
const sortOrder = ref<'Ascending' | 'Descending'>('Ascending')

// Galleries
const galleries = computed(() => galleryStore.galleries)

// Filter and sort art assets
const sortedAndFilteredArt = computed(() => {
  let arts = filteredArtAssets.value

  // Filter by user toggle
  if (showOnlyUserArt.value) {
    arts = arts.filter((art) => art.userId === userStore.userId)
  }

  // Sort by ID
  return arts.sort((a, b) =>
    sortOrder.value === 'Ascending' ? a.id - b.id : b.id - a.id,
  )
})

// Filter art based on gallery and user preferences
const filteredArtAssets = computed(() => {
  let arts = artStore.art

  // Filter by selected gallery
  if (selectedGalleryId.value) {
    arts = arts.filter((art) => art.galleryId === selectedGalleryId.value)
  }

  // Filter by user access settings
  arts = arts.filter((art) => {
    const isAccessible = art.isPublic || art.userId === userStore.userId
    const isViewable =
      userStore.showMature || (!art.isMature && art.userId === userStore.userId)
    return isAccessible && isViewable
  })

  return arts
})

// Function to update view mode
const setView = (newView: 'twoRow' | 'threeRow' | 'fourRow' | 'single') => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

// Fetch the artImage from the preloaded artImages array
const getArtImage = (artImageId: number | null) => {
  return artImageId
    ? artStore.artImages.find((image) => image.id === artImageId)
    : undefined
}

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'Ascending' ? 'Descending' : 'Ascending'
}

// Initialize the art store and preload art images
onMounted(async () => {
  await artStore.initialize()

  const savedView = window.localStorage.getItem('view')
  if (
    savedView &&
    ['twoRow', 'threeRow', 'fourRow', 'single'].includes(savedView)
  ) {
    view.value = savedView as 'twoRow' | 'threeRow' | 'fourRow' | 'single'
  }
})

// Grid class computation
const gridColumns: Record<
  'twoRow' | 'threeRow' | 'fourRow' | 'single',
  string
> = {
  twoRow: 'grid-cols-2',
  threeRow: 'grid-cols-3',
  fourRow: 'grid-cols-4',
  single: 'grid-cols-1',
}

const gridClass = computed(() => {
  return `grid ${gridColumns[view.value]} gap-4`
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
