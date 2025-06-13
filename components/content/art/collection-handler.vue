<!-- /components/content/art/collection-handler.vue -->
<template>
  <div class="space-y-2">
    <label class="label-text font-semibold">🗂️ Collection</label>
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
      <!-- Collection Selector -->
      <select
        class="select select-bordered w-full sm:w-64"
        v-model="selectedId"
      >
        <option disabled value="">— Select a collection —</option>
        <option v-for="c in userCollections" :key="c.id" :value="String(c.id)">
          {{ c.label }}
        </option>
      </select>

      <!-- Create Collection Input -->
      <input
        v-model="newLabel"
        type="text"
        class="input input-bordered flex-grow"
        placeholder="New collection name"
      />
      <button class="btn btn-primary whitespace-nowrap" @click="createNew">
        ➕ Create
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const selectedId = ref<string>('')

const newLabel = ref('')
const userCollections = computed(() =>
  collectionStore.getUserCollections(userStore.userId),
)

watch(
  () => collectionStore.currentCollection?.id,
  (id) => {
    if (id) selectedId.value = id.toString()
  },
  { immediate: true },
)

watch(selectedId, (val) => {
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
    selectedId.value = created.id.toString()
    newLabel.value = ''
  }
}
</script>
