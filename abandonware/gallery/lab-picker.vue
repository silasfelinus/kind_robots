<!-- /components/content/wonderlab/lab-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <!-- Folder filter -->
      <select
        v-model="selectedFolder"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option value="">All folders</option>
        <option v-for="f in folderNames" :key="f" :value="f">{{ f }}</option>
      </select>
      <input
        v-model="query"
        type="search"
        placeholder="Search components…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="filtered.length === 0" class="picker-empty">
      <span>🧪</span> No components found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="c in filtered"
        :key="c.id"
        class="picker-row"
        :class="{ 'picker-row--active': componentStore.selectedComponent?.id === c.id }"
        @click="componentStore.selectedComponent = c"
      >
        <span class="picker-icon">🧪</span>
        <span class="picker-label">
          <span class="picker-name">{{ c.componentName }}</span>
          <span class="picker-sub">{{ c.folderName }}</span>
        </span>
        <button
          class="picker-action"
          :class="componentStore.selectedComponent?.id === c.id ? 'btn-primary' : 'btn-ghost'"
          @click.stop="componentStore.selectedComponent = c"
        >
          {{ componentStore.selectedComponent?.id === c.id ? 'Active' : 'Load' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponentStore, type KindComponent } from '@/stores/componentStore'

const componentStore = useComponentStore()
const query = ref('')
const selectedFolder = ref('')

const folderNames = computed<string[]>(() => {
  const set = new Set<string>()
  componentStore.components.forEach((c: KindComponent) => {
    if (c.folderName?.trim()) set.add(c.folderName.trim())
  })
  return Array.from(set)
})

const filtered = computed<KindComponent[]>(() => {
  let list = componentStore.components
  if (selectedFolder.value)
    list = list.filter(
      (c: KindComponent) =>
        c.folderName?.trim().toLowerCase() === selectedFolder.value.toLowerCase(),
    )
  const q = query.value.trim().toLowerCase()
  if (q)
    list = list.filter((c: KindComponent) =>
      c.componentName?.toLowerCase().includes(q),
    )
  return list
})
</script>
