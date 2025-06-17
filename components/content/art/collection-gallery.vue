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
    <div v-else class="p-6 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="collection in collectionStore.collections"
          :key="collection.id"
          class="flex flex-col items-center bg-base-100 rounded-2xl shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer w-full"
          @click="selectCollection(collection.id)"
        >
          <div class="w-full h-48 overflow-hidden">
            <img
              :src="getPreviewImage(collection).src"
              class="w-full h-full object-cover"
              :alt="collection.label || 'Unnamed Collection'"
            />
          </div>
          <div class="w-full text-center p-4 space-y-1">
            <div class="text-lg font-bold truncate">
              📁 {{ collection.label || 'Untitled Collection' }}
            </div>
            <div class="text-sm text-base-content/80">
              🧑 {{ collection.username || 'Unknown user' }}
            </div>
            <div class="flex justify-center gap-3 text-xs font-semibold">
              <span v-if="collection.isPublic" class="text-success"
                >🌍 Public</span
              >
              <span v-if="collection.isMature" class="text-warning"
                >🔞 Mature</span
              >
            </div>
            <div
              v-if="debug"
              class="text-xs text-warning-content font-mono break-words space-y-1 pt-2"
            >
              <p>
                🖼️ <span class="font-bold">Art ID:</span>
                {{ getPreviewImage(collection).artId }}
              </p>
              <p>
                <span class="font-bold">Path:</span>
                {{ getPreviewImage(collection).src }}
              </p>
              <p>
                <span class="font-bold">Note:</span>
                {{ getPreviewImage(collection).note }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { useArtStore } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/artStore'

const collectionStore = useCollectionStore()
const artStore = useArtStore()
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
  const images = collection.art || []
  const valid = images.filter((img) => img?.id)

  if (!valid.length) {
    return {
      src: fallback,
      note: 'no art in collection',
      artId: null,
    }
  }

  const art = valid[Math.floor(Math.random() * valid.length)]
  const path = (art as any).path

  if (typeof path === 'string') {
    if (path.includes('ArtImageUpload')) {
      const fallbackImage = artStore.getArtImageByArtId(art.id)
      return {
        src: fallbackImage?.imageData || fallback,
        note: 'replaced ArtImageUpload with ArtImage.imageData',
        artId: art.id,
      }
    } else {
      return {
        src: path,
        note: 'from Art.path',
        artId: art.id,
      }
    }
  }

  const foundImage = artStore.getArtImageByArtId(art.id)
  if (foundImage?.imageData) {
    return {
      src: foundImage.imageData,
      note: 'from ArtImage.imageData',
      artId: art.id,
    }
  }

  const highlight = (collection as any).highlightImage
  if (highlight) {
    return {
      src: highlight,
      note: 'from collection.highlightImage',
      artId: art.id,
    }
  }

  return {
    src: fallback,
    note: 'fallback used (no path or imageData)',
    artId: art.id,
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
