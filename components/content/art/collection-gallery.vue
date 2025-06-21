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

        <div class="scroll-container overflow-auto max-h-[60vh] pt-4">
          <div
            v-if="getArtFromCollection(c).length >= 0"
            class="grid gap-4 auto-rows-fr grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))]"
          >
            <div
              v-if="canEdit(c) || c.id === -1"
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

            <div
              class="relative group"
              v-for="art in getArtFromCollection(c).slice(0, visibleCount)"
              :key="art.id"
            >
              <div class="relative w-full h-full">
                <ArtCard
                  :art="art"
                  class="w-full h-full"
                  @click="artStore.selectArt(art.id)"
                />
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
      <div class="grid gap-6 auto-rows-fr grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))]">
        <div
          v-for="collection in sortedUnselectedCollections"
          :key="collection.id"
          class="relative group flex flex-col bg-base-100 rounded-2xl shadow hover:shadow-xl transition-all overflow-hidden cursor-pointer w-full h-full"
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
              v-if="canEdit(collection) && collection.id !== -1"
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

const selectedCollections = computed(() => {
  const selected = collectionStore.selectedCollectionIds.map((id) => {
    if (id === -1) return unassignedCollection.value
    return collectionStore.collections.find((c) => c.id === id)
  })
  return selected.filter(Boolean) as ArtCollection[]
})

function selectCollection(id: number) {
  if (id === -1) {
    collectionStore.selectedCollectionIds = [-1]
    // Directly inject the unassigned collection
    if (!collectionStore.selectedCollections.find((c) => c.id === -1)) {
      collectionStore.selectedCollections.push(unassignedCollection.value)
    }
  } else {
    collectionStore.selectedCollectionIds = [id]
  }
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
  return c.id !== -1 && (c.userId === userStore.userId || userStore.isAdmin)
}

function getArtFromCollection(c: ArtCollection) {
  return (c.art || []).filter((a) => a.id)
}

function confirmRemoveAllArt(collection: ArtCollection) {
  if (
    !confirm(
      `Remove all art from "${collection.label}"? This only affects this collection.`,
    )
  )
    return
  const ids = (collection.art || []).map((a) => a.id)
  for (const id of ids) {
    collectionStore.removeArtFromLocalCollection(collection, id)
  }
}

const allUnassignedArt = computed(() => {
  const assignedIds = new Set(
    collectionStore.collections.flatMap((c) => c.art?.map((a) => a.id) || []),
  )
  return artStore.art.filter((a) => a.id && !assignedIds.has(a.id))
})

const unassignedCollection = computed<ArtCollection>(() => ({
  id: -1,
  label: '🗃️ All Images (No Collection)',
  description: '',
  userId: userStore.userId,
  username: userStore.username,
  isPublic: false,
  isMature: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  art: allUnassignedArt.value,
}))

const sortedUnselectedCollections = computed(() => {
  return [unassignedCollection.value, ...collectionStore.collections]
})

const gridClass = computed(() => ({
  'grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr': true,
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
