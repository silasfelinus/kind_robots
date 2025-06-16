<template>
  <div class="relative bg-base-300 rounded-2xl shadow-md">
    <!-- View Toggle Buttons -->
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

    <!-- Top Bar Filters -->
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

    <!-- Filter Controls -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-base-200 border-b border-base-300"
    >
      <input
        v-model="designerFilter"
        type="text"
        placeholder="Filter by designer"
        class="input input-sm input-bordered w-full"
      />
      <input
        v-model="keywordFilter"
        type="text"
        placeholder="Search keywords..."
        class="input input-sm input-bordered w-full"
      />
      <label class="flex items-center space-x-2">
        <input
          v-model="showPublicOnly"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        <span>Public Only</span>
      </label>
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

    <!-- Display Range Control -->
    <div class="px-6 pb-2">
      <label class="label-text font-semibold">🖼️ Display Range</label>
      <input
        type="range"
        min="1"
        :max="filteredArtAssets.length"
        step="1"
        v-model="visibleCount"
        class="range range-primary"
      />
      <div class="text-sm mt-1">
        Showing {{ visibleCount }} / {{ filteredArtAssets.length }} images
      </div>
    </div>

    <!-- Gallery Display Grid -->
    <div class="scroll-container overflow-auto max-h-[75vh] p-4">
      <div :class="gridClass">
        <ArtCard
          v-for="art in limitedArt"
          :key="art.id"
          :art="art"
          class="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useArtStore, type Art } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useUserStore } from '@/stores/userStore'
import ArtCard from './art-card.vue'
import GallerySelector from './gallery-selector.vue'

const artStore = useArtStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()

const designerFilter = ref('')
const keywordFilter = ref('')
const showPublicOnly = ref(false)
const showMatureOnly = ref(false)
const showOnlyUserArt = ref(false)
const view = ref<'twoRow' | 'threeRow' | 'fourRow' | 'single'>('twoRow')
const selectedGalleryId = ref<number | null>(null)
const sortOrder = ref<'Ascending' | 'Descending'>('Ascending')
const visibleCount = ref(50)

const galleries = computed(() => galleryStore.galleries)

const filteredArtAssets = computed(() => {
  let arts = artStore.art
  if (selectedGalleryId.value) {
    arts = arts.filter((art) => art.galleryId === selectedGalleryId.value)
  }

  arts = arts.filter((art) => {
    const accessible = art.isPublic || art.userId === userStore.userId
    const viewable = userStore.showMature || (!art.isMature && art.userId === userStore.userId)
    return accessible && viewable
  })

  if (designerFilter.value.trim()) {
    const q = designerFilter.value.toLowerCase()
    arts = arts.filter((art) => art.designer?.toLowerCase().includes(q))
  }

  if (keywordFilter.value.trim()) {
    const q = keywordFilter.value.toLowerCase()
    arts = arts.filter(
      (art) =>
        art.promptString?.toLowerCase().includes(q) ||
        art.designer?.toLowerCase().includes(q),
    )
  }

  if (showPublicOnly.value) {
    arts = arts.filter((art) => art.isPublic)
  }

  if (showMatureOnly.value) {
    arts = arts.filter((art) => art.isMature)
  }

  return arts
})

const sortedAndFilteredArt = computed(() => {
  let arts = filteredArtAssets.value
  if (showOnlyUserArt.value) {
    arts = arts.filter((art) => art.userId === userStore.userId)
  }

  return arts.sort((a, b) =>
    sortOrder.value === 'Ascending' ? a.id - b.id : b.id - a.id,
  )
})

const limitedArt = computed(() =>
  sortedAndFilteredArt.value.slice(0, visibleCount.value),
)

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'Ascending' ? 'Descending' : 'Ascending'
}

const setView = (newView: typeof view.value) => {
  view.value = newView
  localStorage.setItem('view', newView)
}

const gridClass = computed(() => {
  return {
    'grid grid-cols-1': view.value === 'single',
    'grid grid-cols-1 sm:grid-cols-2': view.value === 'twoRow',
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3': view.value === 'threeRow',
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4': view.value === 'fourRow',
    'gap-4': true,
  }
})

onMounted(async () => {
  await artStore.initialize()
  const savedView = localStorage.getItem('view')
  if (['twoRow', 'threeRow', 'fourRow', 'single'].includes(savedView || '')) {
    view.value = savedView as typeof view.value
  }
})
</script>

<style scoped>
.scroll-container {
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
