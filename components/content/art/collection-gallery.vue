<template>
  <div class="relative bg-base-300 rounded-2xl shadow-md overflow-hidden">
    <!-- Selected Collection View -->
    <div v-if="selectedCollections.length" class="space-y-6 p-6">
      <div
        v-for="c in selectedCollections"
        :key="c.id"
        class="bg-base-100 p-6 rounded-2xl shadow space-y-4 group"
      >
        <!-- Header -->
        <div
          class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
        >
          <div class="flex-1 space-y-1">
            <!-- Editable Label -->
            <div
              v-if="canEdit(c) && editingTitle === c.id"
              class="flex items-center gap-2"
            >
              <input
                v-model="c.label"
                class="input input-sm input-bordered text-xl font-bold w-full max-w-xs"
                :placeholder="c.label || 'Untitled Collection'"
              />
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                @change="
                  c.label &&
                  collectionStore.updateCollectionLabel(c.id, c.label)
                "
              />
              <span class="badge badge-primary">You</span>
            </div>
            <!-- Static Label -->
            <h2
              v-else
              class="text-2xl font-bold text-primary truncate cursor-pointer"
              @click="canEdit(c) && (editingTitle = c.id)"
            >
              📁 {{ c.label || 'Untitled Collection' }}
            </h2>
            <div class="text-sm text-base-content/80">
              🧑 {{ c.username || 'Unknown user' }}
              <span v-if="canEdit(c)" class="ml-1 text-success">(you)</span>
            </div>
          </div>

          <!-- Action Icons -->
          <div class="flex flex-wrap gap-2 mt-2 md:mt-0">
            <button
              v-if="canEdit(c)"
              class="btn btn-xs btn-square"
              @click="removeCollection(c.id)"
              title="Back"
            >
              <Icon name="kind-icon:arrow-left" />
            </button>
          </div>
        </div>

        <!-- Editable Toggles -->
        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              v-model="c.isPublic"
              :disabled="!canEdit(c)"
            />
            🌍 Public
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              v-model="c.isMature"
              :disabled="!canEdit(c)"
            />
            🔞 Mature
          </label>
        </div>

        <!-- Art Cards Grid -->
        <div class="scroll-container overflow-auto max-h-[60vh] pt-4">
          <div v-if="getArtFromCollection(c).length >= 0" :class="gridClass">
            <!-- Inline Back Card -->
            <div
              v-if="canEdit(c)"
              class="aspect-square bg-base-200 rounded-xl overflow-hidden cursor-pointer relative group"
              @click="removeCollection(c.id)"
              title="Back to Gallery"
            >
              <img
                src="/images/backtree.webp"
                class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                alt="Back"
              />
              <div
                class="absolute inset-0 flex flex-col items-center justify-center text-center px-2"
              >
                <Icon
                  name="kind-icon:arrow-left"
                  class="w-8 h-8 text-base-content"
                />
                <div class="mt-1 text-xs font-semibold text-base-content">
                  Back
                </div>
              </div>
            </div>

            <!-- Art Cards -->
            <div
              class="relative group"
              v-for="art in getArtFromCollection(c).slice(0, visibleCount)"
              :key="art.id"
            >
              <div class="relative">
                <ArtCard :art="art" @click="artStore.selectArt(art.id)" />
             
              </div>
            </div>
          </div>
          <div v-else class="text-center italic text-base-content/60 py-12">
            🛌 No matching art found.
          </div>
        </div>
      </div>
    </div>

    <!-- Gallery View (Unselected) -->
    <div v-else class="p-6 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="collection in collectionStore.collections"
          :key="collection.id"
          class="relative group col-span-2 flex flex-col bg-base-100 rounded-2xl shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer w-full"
          @click="selectCollection(collection.id)"
          @mouseenter="handleHover(collection)"
          @mouseleave="artStore.setHoverArt(null)"
        >
          <div class="w-full h-48 overflow-hidden">
            <img
              :src="getPreviewImage(collection).src"
              class="w-full h-full object-cover"
              :alt="collection.label || 'Unnamed Collection'"
            />
          </div>
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between px-4 py-3 pointer-events-none"
          >
            <div
              class="text-white text-sm font-bold truncate pointer-events-none"
            >
              {{ collection.label || 'Untitled Collection' }}
            </div>
            <button
              v-if="canEdit(collection)"
              class="text-white hover:text-error pointer-events-auto"
              @click.stop="confirmRemoveAllArt(collection)"
            >
              <Icon name="kind-icon:trash" class="w-5 h-5" />
            </button>
          </div>
          <div
            class="w-full text-center p-4 text-lg font-bold text-primary truncate pointer-events-none"
          >
            📁 {{ collection.label || 'Untitled Collection' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ArtCard from '@/components/content/art/art-card.vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import type { ArtCollection, Art } from '@/stores/artStore'

const userStore = useUserStore()
const collectionStore = useCollectionStore()
const artStore = useArtStore()

const visibleCount = ref(50)
const editingTitle = ref<number | null>(null)
const selectedCollections = computed(() => collectionStore.selectedCollections)

function selectCollection(id: number) {
  collectionStore.selectedCollectionIds = [id]
}

function removeCollection(id: number) {
  collectionStore.selectedCollectionIds =
    collectionStore.selectedCollectionIds.filter((i) => i !== id)
}

function handleHover(collection: ArtCollection) {
  const preview = getPreviewImage(collection)
  if (preview.artId) {
    const art = artStore.art.find((a) => a.id === preview.artId) || null
    artStore.setHoverArt(art)
  } else {
    artStore.setHoverArt(null)
  }
}

function canEdit(c: ArtCollection) {
  return c.userId === userStore.userId || userStore.isAdmin
}

function deleteCollection(id: number) {
  collectionStore.deleteCollectionById(id)
}

function getArtFromCollection(c: ArtCollection) {
  return (c.art || []).filter((a) => a.id)
}

function confirmRemoveAllArt(collection: ArtCollection) {
  if (
    !confirm(
      Remove all art from "${collection.label}"? This only affects this collection.,
    )
  )
    return
  const ids = (collection.art || []).map((a) => a.id)
  for (const id of ids) {
    collectionStore.removeArtFromLocalCollection(collection, id)
  }
}

const gridClass = computed(() => ({
  'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5':
    true,
}))

function getPreviewImage(collection: ArtCollection): {
  src: string
  note: string
  artId: number | null
} {
  const fallback = '/images/backtree.webp'
  const images = collection.art || []
  const valid = images.filter((img) => img?.id)
  if (!valid.length)
    return { src: fallback, note: 'no art in collection', artId: null }
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
      return { src: path, note: 'from Art.path', artId: art.id }
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
  return { src: fallback, note: 'fallback used', artId: art.id }
}

onMounted(() => {
  selectedCollections.value.forEach((collection) => {
    ;(collection.art || []).forEach((a) => artStore.getArtImageByArtId(a.id))
  })
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