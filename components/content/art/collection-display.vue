<!-- /components/content/art/collection-display.vue -->
<template>
  <div class="w-full max-w-full space-y-6 overflow-x-hidden">
    <!-- Collection Selector -->
    <div class="w-full">
      <label class="label-text font-semibold block mb-1">📁 Select Collection</label>
      <select v-model="selectedId" class="select select-bordered w-full max-w-full">
        <option disabled value="">— Select a Collection —</option>
        <option
          v-for="c in filteredCollections"
          :key="c.id"
          :value="String(c.id)"
        >
          {{ c.label || `Untitled #${c.id}` }}
        </option>
      </select>
    </div>

    <!-- Filter Toggles -->
    <div class="flex flex-wrap gap-4 items-center">
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showPersonal" class="checkbox checkbox-sm" />
        <span class="label-text">👤 My Collections</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showPublic" class="checkbox checkbox-sm" />
        <span class="label-text">🌍 Public</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showMature" class="checkbox checkbox-sm" />
        <span class="label-text">🔞 Mature</span>
      </label>
    </div>

    <!-- Collection Overview Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        @click="selectCollection(collection)"
        :class="[
          'cursor-pointer border rounded-xl p-4 w-full transition-all',
          selectedId === String(collection.id)
            ? 'bg-primary text-white border-primary'
            : 'bg-base-200 hover:bg-base-300 border-base-300',
        ]"
      >
        <div class="font-semibold break-words">
          {{ collection.label || `Untitled #${collection.id}` }}
        </div>
        <div class="text-sm opacity-70">{{ collection.art.length }} item{{ collection.art.length === 1 ? '' : 's' }}</div>
      </div>
    </div>

    <!-- Art Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <ArtCard
        v-for="art in selectedCollection?.art || []"
        :key="art.id"
        :art="art"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'
import ArtCard from './art-card.vue'

const collectionStore = useCollectionStore()
const userStore = useUserStore()

const showPublic = ref(true)
const showMature = ref(false)
const showPersonal = ref(true)
const selectedId = ref<string>('')

const filteredCollections = computed(() =>
  collectionStore.collections.filter((c) => {
    const isUser = c.userId === userStore.userId
    const matchesUser = showPersonal.value ? isUser : false
    const matchesPublic = showPublic.value ? !isUser : false
    const hasMature = showMature.value || !c.art.some((a) => a.isMature)

    return (matchesUser || matchesPublic) && hasMature
  }),
)

const selectedCollection = computed(() =>
  collectionStore.findCollectionById(Number(selectedId.value)),
)

function selectCollection(c: ArtCollection) {
  selectedId.value = String(c.id)
  collectionStore.currentCollection = c
}

onMounted(() => {
  if (!collectionStore.collections.length) {
    collectionStore.fetchCollections()
  }
})
</script>
