<!-- /components/content/layout/collection-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search collections…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="filtered.length === 0" class="picker-empty">
      <span>📁</span> No collections found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="col in filtered"
        :key="col.id"
        class="picker-row"
        :class="{ 'picker-row--active': collectionStore.selectedCollectionIds.includes(col.id) }"
        @click="selectCollection(col.id)"
      >
        <span class="picker-icon">📁</span>
        <span class="picker-label">
          <span class="picker-name">{{ col.label || 'Untitled Collection' }}</span>
          <span class="picker-sub">{{ col.username || 'Unknown' }} · {{ col.art?.length ?? 0 }} items</span>
        </span>
        <button
          class="picker-action"
          :class="collectionStore.selectedCollectionIds.includes(col.id) ? 'btn-primary' : 'btn-ghost'"
          @click.stop="selectCollection(col.id)"
        >
          {{ collectionStore.selectedCollectionIds.includes(col.id) ? 'Open' : 'Open' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'

const collectionStore = useCollectionStore()
const query = ref('')

const allCollections = computed(() => collectionStore.collections ?? [])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q
    ? allCollections.value.filter((c) =>
        (c.label || '').toLowerCase().includes(q),
      )
    : allCollections.value
})

function selectCollection(id: number) {
  collectionStore.selectedCollectionIds = [id]
}
</script>
