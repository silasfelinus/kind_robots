<!-- /components/content/art/collection-handler.vue -->
<template>
  <div class="relative bg-base-300 rounded-2xl shadow-md overflow-hidden">
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

    <!-- Top Bar -->
    <div
      class="flex justify-between items-center px-6 py-4 border-b border-base-200"
    >
      <label class="flex items-center space-x-2">
        <input v-model="showOnlyUserArt" type="checkbox" class="checkbox" />
        <span>Show My Art Only</span>
      </label>
      <button class="btn btn-primary btn-sm" @click="toggleSortOrder">
        Sort: {{ sortOrder }}
      </button>
    </div>

    <!-- Filters -->
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

    <!-- Collection Selector -->
    <div class="px-6 py-4">
      <label class="label-text font-semibold">📦 Choose View</label>
      <select
        v-model="selectedOption"
        class="select select-bordered w-full mt-1"
      >
        <option value="__all__">🖼️ All Generated Art</option>
        <optgroup label="All Collections">
          <option
            v-for="c in allCollections"
            :key="'col-' + c.id"
            :value="'collection-' + c.id"
          >
            📁 {{ c.label }}
          </option>
          <option value="__new__">➕ Create New Collection</option>
        </optgroup>
        <optgroup label="Legacy Galleries">
          <option
            v-for="g in galleries"
            :key="'gal-' + g.id"
            :value="'gallery-' + g.id"
          >
            🗃️ {{ g.name }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Auto-save toggle -->
    <div v-if="isCollectionSelected" class="px-6 flex items-center gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        v-model="autoSaveEnabled"
      />
      <span class="label-text">💾 Auto-save to this collection</span>
    </div>

    <!-- Create New Collection -->
    <div v-if="selectedOption === '__new__'" class="px-6 py-2 space-y-2">
      <input
        v-model="newLabel"
        type="text"
        class="input input-bordered w-full"
        placeholder="New collection name"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="!newLabel.trim()"
        @click="createNewCollection"
      >
        ➕ Create
      </button>
    </div>

    <!-- Range Slider -->
    <div class="px-6 pb-2">
      <label class="label-text font-semibold">🖼️ Display Range</label>
      <input
        type="range"
        min="1"
        :max="filteredArt.length"
        step="1"
        v-model="visibleCount"
        class="range range-primary"
      />
      <div class="text-sm mt-1">
        Showing {{ visibleCount }} / {{ filteredArt.length }} images
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="scroll-container overflow-auto max-h-[75vh] p-4">
      <div :class="gridClass">
        <ArtCard
          v-for="art in visibleArt"
          :key="art.id"
          :art="art"
          class="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useGalleryStore } from '@/stores/galleryStore'
import ArtCard from './art-card.vue'

const userStore = useUserStore()
const artStore = useArtStore()
const collectionStore = useCollectionStore()
const galleryStore = useGalleryStore()

const selectedOption = ref('__all__')
const autoSaveEnabled = ref(true)
const newLabel = ref('')
const visibleCount = ref(50)

const designerFilter = ref('')
const keywordFilter = ref('')
const showPublicOnly = ref(false)
const showMatureOnly = ref(false)
const showOnlyUserArt = ref(false)
const sortOrder = ref<'Ascending' | 'Descending'>('Descending')
const view = ref<'twoRow' | 'threeRow' | 'fourRow' | 'single'>('twoRow')

// All data sources
const galleries = computed(() => galleryStore.galleries)
const allCollections = computed(() => collectionStore.collections)

// Art filter logic
const selectedArt = computed(() => {
  if (selectedOption.value === '__all__') return artStore.art

  if (selectedOption.value.startsWith('collection-')) {
    const id = Number(selectedOption.value.split('-')[1])
    return collectionStore.findCollectionById(id)?.art || []
  }

  if (selectedOption.value.startsWith('gallery-')) {
    const id = Number(selectedOption.value.split('-')[1])
    return artStore.art.filter((a) => a.galleryId === id)
  }

  return []
})

const isCollectionSelected = computed(() =>
  selectedOption.value.startsWith('collection-'),
)

const filteredArt = computed(() => {
  let result = [...selectedArt.value]

  if (showOnlyUserArt.value) {
    result = result.filter((a) => a.userId === userStore.userId)
  }

  if (designerFilter.value.trim()) {
    const q = designerFilter.value.toLowerCase()
    result = result.filter((a) => a.designer?.toLowerCase().includes(q))
  }

  if (keywordFilter.value.trim()) {
    const q = keywordFilter.value.toLowerCase()
    result = result.filter(
      (a) =>
        a.promptString?.toLowerCase().includes(q) ||
        a.designer?.toLowerCase().includes(q),
    )
  }

  if (showPublicOnly.value) {
    result = result.filter((a) => a.isPublic)
  }

  if (showMatureOnly.value) {
    result = result.filter((a) => a.isMature)
  }

  return result.sort((a, b) =>
    sortOrder.value === 'Ascending' ? a.id - b.id : b.id - a.id,
  )
})

const visibleArt = computed(() =>
  filteredArt.value.slice(0, visibleCount.value),
)

const gridClass = computed(() => {
  return {
    'grid grid-cols-1': view.value === 'single',
    'grid grid-cols-1 sm:grid-cols-2': view.value === 'twoRow',
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3': view.value === 'threeRow',
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4':
      view.value === 'fourRow',
    'gap-4': true,
  }
})

const setView = (v: 'single' | 'twoRow' | 'threeRow' | 'fourRow') => {
  view.value = v
  localStorage.setItem('view', v)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'Ascending' ? 'Descending' : 'Ascending'
}

const createNewCollection = async () => {
  const label = newLabel.value.trim()
  if (!label) return
  const created = await collectionStore.createCollection(
    label,
    userStore.userId,
  )
  if (created) {
    selectedOption.value = `collection-${created.id}`
    collectionStore.currentCollection = created
    newLabel.value = ''
  }
}

onMounted(async () => {
  await Promise.all([
    artStore.initialize(),
    collectionStore.fetchCollections(),
    galleryStore.fetchGalleries?.(),
  ])

  const saved = localStorage.getItem('view')
  if (
    saved === 'single' ||
    saved === 'twoRow' ||
    saved === 'threeRow' ||
    saved === 'fourRow'
  ) {
    view.value = saved
  }
})
</script>

<style scoped>
.scroll-container::-webkit-scrollbar {
  width: 8px;
}
.scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.6);
}
</style>
