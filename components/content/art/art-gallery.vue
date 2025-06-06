<!-- /components/content/art/art-gallery.vue -->
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

    <!-- Advanced Filters -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-base-200 border-b border-base-300"
    >
      <!-- Designer filter -->
      <input
        v-model="designerFilter"
        type="text"
        placeholder="Filter by designer"
        class="input input-sm input-bordered w-full"
      />

      <!-- Keyword search -->
      <input
        v-model="keywordFilter"
        type="text"
        placeholder="Search keywords..."
        class="input input-sm input-bordered w-full"
      />

      <!-- isPublic toggle -->
      <label class="flex items-center space-x-2">
        <input
          v-model="showPublicOnly"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        <span>Public Only</span>
      </label>

      <!-- isMature toggle -->
      <label class="flex items-center space-x-2">
        <input
          v-model="showMatureOnly"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        <span>Mature Only</span>
      </label>
    </div>

    <!-- Gallery Selector -->
    <div class="flex justify-center my-4 px-6">
      <gallery-selector v-model="selectedGalleryId" :galleries="galleries" />
    </div>

    <!-- ArtCards Grid with Scrollbar -->
    <div class="scroll-container overflow-auto max-h-[75vh] p-4">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
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
import { useArtStore, type Art, type ArtImage } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useUserStore } from '@/stores/userStore'

// State and Stores
const userStore = useUserStore()
const artStore = useArtStore()
const galleryStore = useGalleryStore()

const designerFilter = ref('')
const keywordFilter = ref('')
const showPublicOnly = ref(false)
const showMatureOnly = ref(false)

// View settings
const view = ref<'twoRow' | 'threeRow' | 'fourRow' | 'single'>('twoRow')
const selectedGalleryId = ref<number | null>(null)

// Sort and filter settings
const showOnlyUserArt = ref(false)
const sortOrder = ref<'Ascending' | 'Descending'>('Ascending')

// Galleries
const galleries = computed(() => galleryStore.galleries)

const sortedAndFilteredArt = computed(() => {
  let arts = filteredArtAssets.value

  if (showOnlyUserArt.value) {
    arts = arts.filter((art: Art) => art.userId === userStore.userId)
  }

  return arts.sort((a: Art, b: Art) =>
    sortOrder.value === 'Ascending' ? a.id - b.id : b.id - a.id,
  )
})

const filteredArtAssets = computed(() => {
  let arts = artStore.art

  // Gallery
  if (selectedGalleryId.value) {
    arts = arts.filter((art) => art.galleryId === selectedGalleryId.value)
  }

  // Access check
  arts = arts.filter((art) => {
    const isAccessible = art.isPublic || art.userId === userStore.userId
    const isViewable =
      userStore.showMature || (!art.isMature && art.userId === userStore.userId)
    return isAccessible && isViewable
  })

  // Designer filter
  if (designerFilter.value.trim()) {
    arts = arts.filter((art) =>
      art.designer
        ?.toLowerCase()
        .includes(designerFilter.value.trim().toLowerCase()),
    )
  }

  // Keyword search (promptString or designer)
  if (keywordFilter.value.trim()) {
    const query = keywordFilter.value.toLowerCase()
    arts = arts.filter(
      (art) =>
        art.promptString?.toLowerCase().includes(query) ||
        art.designer?.toLowerCase().includes(query),
    )
  }

  // Public only
  if (showPublicOnly.value) {
    arts = arts.filter((art) => art.isPublic)
  }

  // Mature only
  if (showMatureOnly.value) {
    arts = arts.filter((art) => art.isMature)
  }

  return arts
})

// Function to update view mode
const setView = (newView: 'twoRow' | 'threeRow' | 'fourRow' | 'single') => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

const artImageMap = computed(() => {
  const map = new Map<number, ArtImage>()
  for (const img of artStore.artImages) {
    map.set(img.id, img)
  }
  return map
})

const getArtImage = (artImageId: number | null): ArtImage | undefined => {
  return artImageId ? artImageMap.value.get(artImageId) : undefined
}

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'Ascending' ? 'Descending' : 'Ascending'
}

onMounted(async () => {
  await artStore.initialize()

  const savedView = window.localStorage.getItem('view')
  if (
    savedView &&
    ['twoRow', 'threeRow', 'fourRow', 'single'].includes(savedView)
  ) {
    view.value = savedView as typeof view.value
  }

  // Batch fetch all missing images
  const missingIds = filteredArtAssets.value
    .map((art) => art.artImageId)
    .filter(
      (id): id is number =>
        !!id && !artStore.artImages.some((img) => img.id === id),
    )

  if (missingIds.length) {
    await artStore.getArtImagesByIds([...new Set(missingIds)])
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
