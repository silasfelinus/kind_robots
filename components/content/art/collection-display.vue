<!-- /components/content/art/collection-display.vue -->
<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-4 items-center">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="showPersonal"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">👤 My Collections</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="showPublic"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">🌍 Public</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="showMature"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">🔞 Mature</span>
        </label>
      </div>

      <select v-model="selectedId" class="select select-bordered max-w-xs">
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

    <!-- Horizontal Scroll Gallery -->
    <div class="overflow-x-auto flex gap-4 py-2 px-1">
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        @click="selectCollection(collection)"
        :class="[
          'cursor-pointer border rounded-xl p-4 min-w-[200px] max-w-xs transition-all',
          selectedId === String(collection.id)
            ? 'bg-primary text-white border-primary'
            : 'bg-base-200 hover:bg-base-300 border-base-300',
        ]"
      >
        <div class="font-semibold truncate">
          {{ collection.label || `Untitled #${collection.id}` }}
        </div>
        <div class="text-sm opacity-60">{{ collection.art.length }} items</div>
      </div>
    </div>

    <!-- Art Gallery -->
    <div
      class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    >
      <ArtCard
        v-for="art in selectedCollection?.art || []"
        :key="art.id"
        :art="art"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/collection-display.vue
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

const filteredCollections = computed(() => {
  return collectionStore.collections.filter((c) => {
    const isUser = c.userId === userStore.userId
    const matchesUser = showPersonal.value ? isUser : false
    const matchesPublic = showPublic.value ? !isUser : false
    const hasMature = showMature.value || !c.art.some((a) => a.isMature)

    return (matchesUser || matchesPublic) && hasMature
  })
})

const selectedCollection = computed(() => {
  return collectionStore.findCollectionById(Number(selectedId.value))
})

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
