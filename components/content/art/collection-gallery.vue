<!-- /components/content/art/collection-handler.vue -->
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

      <div class="flex flex-wrap gap-4 items-center">
        <button class="btn btn-sm" @click="collectionStore.selectedCollectionIds = []">❌ Clear All</button>
        <span class="text-sm text-base-content">
          Selected: {{ collectionStore.selectedCollectionIds.length }}
        </span>
      </div>
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
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'

const artStore = useArtStore()
const collectionStore = useCollectionStore()

const viewMode = ref<'all' | 'selected' | 'custom'>('all')
const customTextFilter = ref('')
const visibleCount = ref(50)

const selectedArt = computed(() => {
  if (viewMode.value === 'all') return artStore.art

  if (viewMode.value === 'selected') {
    return collectionStore.selectedCollections.flatMap(c => c.art)
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
