<template>
  <div class="w-full max-w-full space-y-6 overflow-x-hidden">
    <!-- Collection Select -->
    <div class="space-y-2">
      <label class="label-text font-semibold">🗂️ Collection</label>
      <select v-model="selectedId" class="select select-bordered w-full">
        <option disabled value="">— Select a collection —</option>
        <option v-for="c in userCollections" :key="c.id" :value="String(c.id)">
          {{ c.label }}
        </option>
        <option value="__new__">➕ Create new collection...</option>
      </select>
    </div>

    <!-- Auto-save Toggle -->
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        v-model="autoSaveEnabled"
        class="checkbox checkbox-sm"
      />
      <span class="label-text">💾 Auto-save to this collection</span>
    </label>

    <!-- New Collection Fields -->
    <div v-if="selectedId === '__new__'" class="flex flex-col gap-2">
      <input
        v-model="newLabel"
        type="text"
        class="input input-bordered w-full"
        placeholder="Enter new collection name"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="!newLabel.trim()"
        @click="createNew"
      >
        ➕ Create Collection
      </button>
    </div>

    <!-- Art Cards -->
    <div
      v-if="selectedCollection?.art?.length"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <ArtCard v-for="art in selectedCollection.art" :key="art.id" :art="art" />
    </div>
    <div
      v-else-if="selectedCollection"
      class="text-sm italic text-base-content opacity-60"
    >
      No art in this collection yet.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const selectedId = ref<string>('')
const newLabel = ref('')
const autoSaveEnabled = ref(true)

const userCollections = computed(() =>
  collectionStore.getUserCollections(userStore.userId),
)

const selectedCollection = computed(() =>
  collectionStore.findCollectionById(Number(selectedId.value)),
)

watch(
  () => collectionStore.currentCollection?.id,
  (id) => {
    if (id) selectedId.value = id.toString()
  },
  { immediate: true },
)

watch(selectedId, (val) => {
  if (val === '__new__') return
  const found = collectionStore.findCollectionById(Number(val))
  if (found) {
    collectionStore.currentCollection = found
  }
})

async function createNew() {
  const label = newLabel.value.trim()
  if (!label) return

  const created = await collectionStore.createCollection(
    label,
    userStore.userId,
  )
  if (created) {
    selectedId.value = String(created.id)
    collectionStore.currentCollection = created
    newLabel.value = ''
  }
}
</script>
