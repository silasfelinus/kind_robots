<!-- /components/content/icons/icon-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="filterType"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option value="">All types</option>
        <option value="nav">Nav</option>
        <option value="utility">Utility</option>
      </select>
      <input
        v-model="query"
        type="search"
        placeholder="Search icons…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="filtered.length === 0" class="picker-empty">
      <span>🔷</span> No icons found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="icon in filtered"
        :key="icon.id"
        class="picker-row"
        :class="{ 'picker-row--active': isInSmartBar(icon.id) }"
      >
        <!-- Live icon render -->
        <span class="picker-icon shrink-0">
          <Icon :name="icon.icon || 'kind-icon:help'" class="w-5 h-5" />
        </span>
        <span class="picker-label">
          <span class="picker-name">{{ icon.label || icon.title }}</span>
          <span class="picker-sub capitalize">{{ icon.type || '—' }}</span>
        </span>
        <button
          class="picker-action"
          :class="isInSmartBar(icon.id) ? 'btn-secondary' : 'btn-ghost'"
          @click.stop="toggleIcon(icon.id)"
        >
          {{ isInSmartBar(icon.id) ? 'Remove' : 'Add' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const { icons, smartBarIds } = storeToRefs(smartbarStore)

const query = ref('')
const filterType = ref('')

const filtered = computed(() => {
  return icons.value.filter((i) => {
    if (filterType.value && i.type !== filterType.value) return false
    const q = query.value.trim().toLowerCase()
    if (q && !(i.label || i.title || '').toLowerCase().includes(q)) return false
    return true
  })
})

function isInSmartBar(id: number) {
  return smartBarIds.value.includes(id)
}

async function toggleIcon(id: number) {
  if (isInSmartBar(id)) await smartbarStore.removeIconFromSmartBar(id)
  else await smartbarStore.addIconToSmartBar(id)
}
</script>
