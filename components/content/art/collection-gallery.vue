<!-- /components/content/art/collection-gallery.vue -->
<template>
  <div class="relative bg-base-300 rounded-2xl shadow-md overflow-hidden">
    <!-- Collection Selector -->
    <div class="px-6 py-4 space-y-3">
      <label class="label-text font-semibold">📦 Select Collections</label>
      <select
        multiple
        v-model="collectionStore.selectedCollectionIds"
        class="select select-bordered w-full h-32"
      >
        <optgroup label="All Collections">
          <option
            v-for="c in collectionStore.collections"
            :key="c.id"
            :value="c.id"
          >
            📁 {{ c.label }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- View Mode Toggle -->
    <div class="px-6 pb-2 space-y-2">
      <label class="label-text font-semibold">🔍 View Mode</label>
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center space-x-2">
          <input
            type="radio"
            name="viewMode"
            value="all"
            v-model="viewMode"
            class="radio radio-sm"
          />
          <span>Show All</span>
        </label>
        <label class="flex items-center space-x-2">
          <input
            type="radio"
            name="viewMode"
            value="selected"
            v-model="viewMode"
            class="radio radio-sm"
          />
          <span>Only Selected</span>
        </label>
        <label class="flex items-center space-x-2">
          <input
            type="radio"
            name="viewMode"
            value="custom"
            v-model="viewMode"
            class="radio radio-sm"
          />
          <span>Match Text</span>
        </label>
      </div>
      <input
        v-if="viewMode === 'custom'"
        v-model="customTextFilter"
        type="text"
        class="input input-sm input-bordered mt-1 w-full"
        placeholder="Enter text to filter collections"
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
      <div v-else class="text-center text-base-content/60 italic py-12">
        💤 No matching art found.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()

const selectedOption = ref('__all__')
const autoSaveEnabled = computed({
  get: () => collectionStore.autoSave,
  set: (val: boolean) => (collectionStore.autoSave = val),
})

const newLabel = ref('')
const visibleCount = ref(50)

const designerFilter = ref('')
const keywordFilter = ref('')
const showPublicOnly = ref(false)
const showMatureOnly = ref(false)
const showOnlyUserArt = ref(false)
const sortOrder = ref<'Ascending' | 'Descending'>('Descending')
const view = ref<'twoRow' | 'threeRow' | 'fourRow' | 'single'>('twoRow')

const allCollections = computed(() => collectionStore.collections)

// Art filter logic
const selectedArt = computed(() => {
  if (selectedOption.value === '__all__') return artStore.art

  if (selectedOption.value.startsWith('collection-')) {
    const id = Number(selectedOption.value.split('-')[1])
    return collectionStore.findCollectionById(id)?.art || []
  }
  if (viewMode.value === 'custom') {
    const query = customTextFilter.value.toLowerCase()
    return collectionStore.collections
      .filter((c) => c.label?.toLowerCase().includes(query))
      .flatMap((c) => c.art)
  }
  return []
})

const filteredArt = computed(() => {
  return selectedArt.value.slice(0, visibleCount.value)
})

const visibleArt = filteredArt

const gridClass = computed(() => ({
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': true,
}))
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
