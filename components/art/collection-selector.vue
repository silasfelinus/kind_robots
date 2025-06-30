<!-- /components/content/art/collection-selector.vue -->
<template>
  <div class="space-y-4 p-4 rounded-2xl bg-base-300 shadow-inner">
    <div
      v-if="selectedCollection"
      class="flex items-center justify-between gap-4 bg-base-100 p-4 rounded-xl shadow"
    >
      <div class="flex flex-col">
        <div class="text-sm opacity-60">Selected Collection</div>
        <div class="font-bold text-lg truncate">
          {{ selectedCollection.label || 'Untitled Collection' }}
        </div>
      </div>
      <button
        class="btn btn-sm btn-square"
        @click="clearSelection"
        title="Clear Selection"
      >
        <Icon name="kind-icon:arrow-left" />
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div
        v-for="collection in allCollections"
        :key="collection.id"
        @click="selectCollection(collection.id)"
        class="cursor-pointer bg-base-100 hover:bg-base-200 p-4 rounded-xl shadow transition-all flex items-center justify-between"
      >
        <span class="truncate font-semibold">{{
          collection.label || 'Untitled'
        }}</span>
        <Icon
          name="kind-icon:check"
          v-if="collection.id === selectedCollection?.id"
          class="text-success"
        />
      </div>

      <button
        class="btn btn-sm btn-primary col-span-2 md:col-span-1"
        @click="createCollection"
      >
        <Icon name="kind-icon:plus" class="mr-2" /> New Collection
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

const collectionStore = useCollectionStore()
const userStore = useUserStore()

const selectedCollection = computed(() => {
  return (
    collectionStore.collections.find(
      (c) => c.id === collectionStore.selectedCollectionIds[0],
    ) || null
  )
})

const allCollections = computed(() =>
  collectionStore.collections.filter(
    (c) => c.userId === userStore.userId || userStore.isAdmin,
  ),
)

function selectCollection(id: number) {
  collectionStore.selectedCollectionIds = [id]
}

function clearSelection() {
  collectionStore.selectedCollectionIds = []
}

function createCollection() {
  const label = prompt('Name your new collection:')
  if (label?.trim()) {
    collectionStore.createCollection(
      label.trim(),
      userStore.userId,
      false,
      false,
    )
  }
}
</script>
