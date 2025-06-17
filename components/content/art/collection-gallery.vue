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

    <!-- Art Grid -->
    <div v-if="selectedCollections.length" class="px-6 pb-2">
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

    <!-- Collection Preview Grid -->
    <div v-else class="p-4 space-y-4">
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="collection in collectionStore.collections"
          :key="collection.id"
          class="cursor-pointer rounded-2xl bg-base-100 shadow hover:shadow-xl overflow-hidden transition-all min-w-[12rem]"
          @click="selectCollection(collection.id)"
        >
          <img
            :src="getPreviewImage(collection)"
            class="w-full h-48 object-cover"
            :alt="collection.label || 'Unnamed Collection'"
          />
          <div class="p-3 font-semibold text-center text-base-content">
            📁 {{ collection.label || 'Untitled Collection' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import type { ArtCollection } from '@/stores/collectionStore'

const collectionStore = useCollectionStore()
const visibleCount = ref(50)

const selectedCollections = computed(() => collectionStore.selectedCollections)

const selectedArt = computed(() =>
  selectedCollections.value.flatMap((c) => c.art || []),
)

const filteredArt = computed(() =>
  selectedArt.value.slice(0, visibleCount.value),
)

const visibleArt = filteredArt

const gridClass = computed(() => ({
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': true,
}))

function getPreviewImage(collection: ArtCollection) {
  const fallback = '/images/backtree.webp'
  const images = collection.art || []
  if (images.length > 0) {
    const valid = images.filter((img) => img.imageUrl)
    const index = Math.floor(Math.random() * valid.length)
    return valid[index]?.imageUrl || fallback
  }
  if ((collection as any).highlightImage) {
    return (collection as any).highlightImage
  }
  return fallback
}

function selectCollection(id: number) {
  collectionStore.selectedCollectionIds = [id]
}
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
