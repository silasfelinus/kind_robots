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

      <div class="scroll-container overflow-auto max-h-[75vh] p-6">
        <div v-if="visibleArt.length > 0" :class="gridClass">
          <ArtCard
            v-for="art in visibleArt"
            :key="art.id"
            :art="art"
            class="rounded-2xl shadow-md bg-white hover:shadow-lg transition-shadow"
          />
        </div>
        <div v-else class="text-center italic text-base-content/60 py-12">
          💤 No matching art found.
        </div>
      </div>
    </div>

    <!-- Collection Preview Grid -->
    <div v-else class="p-6">
      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="collection in collectionStore.collections"
          :key="collection.id"
          class="cursor-pointer rounded-2xl bg-base-100 shadow hover:shadow-xl overflow-hidden transition-all w-full min-w-[14rem] sm:min-w-[16rem]"
          @click="selectCollection(collection.id)"
        >
          <img
            :src="getPreviewImage(collection).src"
            class="w-full h-48 object-cover"
            :alt="collection.label || 'Unnamed Collection'"
          />
          <div class="p-4 font-semibold text-center text-base-content text-lg">
            📁 {{ collection.label || 'Untitled Collection' }}
          </div>
          <div
            v-if="debug"
            class="px-4 pb-4 text-xs text-center text-warning-content font-mono break-words"
          >
            <p>🖼️ <span class="font-bold">Art ID:</span> {{ getPreviewImage(collection).artId }}</p>
            <p><span class="font-bold">Path:</span> {{ getPreviewImage(collection).src }}</p>
            <p><span class="font-bold">Note:</span> {{ getPreviewImage(collection).note }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { getArtImageByArtId } from '@/stores/helpers/collectionHelper'
import type { Art, ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/collectionStore'

const collectionStore = useCollectionStore()
const visibleCount = ref(50)
const debug = true

const selectedCollections = computed(() => collectionStore.selectedCollections)

const selectedArt = computed(() =>
  selectedCollections.value.flatMap((c) => c.art || []),
)

const filteredArt = computed(() =>
  selectedArt.value.slice(0, visibleCount.value),
)

const visibleArt = filteredArt

const gridClass = computed(() => ({
  'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4': true,
}))

function getPreviewImage(collection: ArtCollection): {
  src: string
  note: string
  artId: number | null
} {
  const fallback = '/images/backtree.webp'
  const artImages = (collection as any).artImages as ArtImage[] || []
  const images = collection.art || []

  const valid = images.filter((img) => img?.id)

  if (valid.length > 0) {
    const art = valid[Math.floor(Math.random() * valid.length)]

    if (art.path) {
      return {
        src: art.path,
        note: 'from art.path',
        artId: art.id,
      }
    }

    const found = getArtImageByArtId(artImages, art.id)
    if (found?.path) {
      return {
        src: found.path,
        note: 'from artImage.path',
        artId: art.id,
      }
    }

    if ((collection as any).highlightImage) {
      return {
        src: (collection as any).highlightImage,
        note: 'from collection.highlightImage',
        artId: art.id,
      }
    }

    return {
      src: fallback,
      note: 'fallback used (no path, no artImage)',
      artId: art.id,
    }
  }

  return {
    src: fallback,
    note: 'no art in collection',
    artId: null,
  }
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
