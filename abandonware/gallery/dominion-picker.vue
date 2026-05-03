<!-- /components/dominions/dominion-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search dominions…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="store.loading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>♟️</span> No dominions found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="card in filtered"
        :key="card.id"
        class="picker-row"
      >
        <span class="picker-icon">♟️</span>
        <span class="picker-label">
          <span class="picker-name">{{ card.title }}</span>
          <span class="picker-sub">
            {{ card.setId || 'No set' }}
            · Cost {{ card.priceCoins ?? 0 }}💰
            <span v-if="card.isPublic" class="text-primary">· Public</span>
          </span>
        </span>
        <NuxtLink
          :to="`/add-dominion?id=${card.id}`"
          class="picker-action btn-ghost"
        >
          Edit
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDominionStore } from '~/stores/dominionStore'

const store = useDominionStore()
const query = ref('')

onMounted(async () => {
  await store.initialize?.()
  const res = await fetch('/api/dominions?publicOnly=true')
  const data = await res.json()
  if (data?.success) store.items = data.data
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q
    ? store.items.filter((c) => c.title?.toLowerCase().includes(q))
    : store.items
})
</script>
