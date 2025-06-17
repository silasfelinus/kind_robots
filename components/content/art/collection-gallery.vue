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

    <div class="scroll-container overflow-auto max-h-[75vh] p-4">
      <div v-if="visibleArt.length > 0" :class="gridClass">
        <ArtCard
          v-for="art in visibleArt"
          :key="art.id"
          :art="art"
          class="rounded-lg shadow-md bg-white hover:shadow-lg transition-shadow"
        />
      </div>
      <div v-else class="text-center italic text-base-content/60 py-12">
        💤 No matching art found.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()

const viewMode = ref<'all' | 'selected' | 'custom'>('all')
const customTextFilter = ref('')
const newLabel = ref('')
const visibleCount = ref(50)

const createNewCollection = async () => {
  if (!newLabel.value.trim()) return
  await collectionStore.createCollection(
    newLabel.value.trim(),
    userStore.userId,
  )
  newLabel.value = ''
}

// 🔍 Cleaned up view logic
const selectedArt = computed(() => {
  if (viewMode.value === 'all') {
    return collectionStore.collections.flatMap((c) => c.art || [])
  }
  if (viewMode.value === 'selected') {
    return collectionStore.selectedCollections.flatMap((c) => c.art || [])
  }
  if (viewMode.value === 'custom') {
    const query = customTextFilter.value.toLowerCase()
    return collectionStore.collections
      .filter((c) => c.label?.toLowerCase().includes(query))
      .flatMap((c) => c.art || [])
  }
  return []
})

const filteredArt = computed(() =>
  selectedArt.value.slice(0, visibleCount.value),
)
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
