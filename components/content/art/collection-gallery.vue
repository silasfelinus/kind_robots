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

const artStore = useArtStore()
const collectionStore = useCollectionStore()

const visibleCount = ref(50)

const selectedArt = computed(() => {
  const selected = collectionStore.selectedCollections
  if (selected.length > 0) {
    return selected.flatMap((c) => c.art || [])
  } else {
    return collectionStore.collections.flatMap((c) => c.art || [])
  }
})

const filteredArt = computed(() =>
  selectedArt.value.slice(0, visibleCount.value),
)
const visibleArt = filteredArt

const gridClass = computed(() => ({
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': true,
}))
</script>
