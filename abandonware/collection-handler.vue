<!-- /components/content/art/collection-handler.vue -->
<template>
  <div class="w-full max-w-full space-y-4 overflow-x-hidden">
    <label class="label-text font-semibold">🗂️ Collection</label>

    <div class="flex flex-col gap-3 w-full max-w-full">
      <!-- Collection Selector -->
      <select
        v-model="selectedId"
        class="select select-bordered w-full"
      >
        <option disabled value="">— Select a collection —</option>
        <option
          v-for="c in userCollections"
          :key="c.id"
          :value="String(c.id)"
        >
          {{ c.label }}
        </option>
        <option value="__new__">➕ Create new collection...</option>
      </select>

      <!-- New Collection Fields -->
      <div
        v-if="selectedId === '__new__'"
        class="flex flex-col gap-2 w-full"
      >
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
  if (val === '__new__') return
  const found = collectionStore.findCollectionById(Number(val))
  if (found) {
    collectionStore.currentCollection = found
  }
})

async function createNew() {
  const label = newLabel.value.trim()
  if (!label) return

  const created = await collectionStore.createCollection(label, userStore.userId)
  if (created) {
    selectedId.value = String(created.id)
    collectionStore.currentCollection = created
    newLabel.value = ''
  }
}
</script>
