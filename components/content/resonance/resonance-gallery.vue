<!-- /components/content/resonance/resonance-gallery.vue -->
<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold text-primary mb-4">Resonance Gallery</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
      <!-- Sort Dropdown -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-bold text-base-content">Sort:</label>
        <select v-model="sortMode" class="select select-bordered rounded-xl">
          <option value="newest">Newest</option>
          <option value="az">A-Z Title</option>
          <option value="random">Random</option>
        </select>
      </div>

      <!-- Search -->
      <div class="flex items-center w-full md:w-1/2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search Resonances..."
          class="input input-bordered rounded-xl w-full"
        />
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="resonanceStore.loading"
      class="flex justify-center items-center h-96"
    >
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- No Results -->
    <div
      v-else-if="filteredResonances.length === 0"
      class="flex justify-center items-center h-96"
    >
      <p class="text-lg font-bold text-base-content/70">No resonances found.</p>
    </div>

    <!-- Resonance Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="resonance in filteredResonances"
        :key="resonance.id"
        class="bg-base-200 border border-base-300 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col overflow-hidden"
      >
        <img
          v-if="getFirstArtImage(resonance)"
          :src="getFirstArtImage(resonance)"
          alt="Resonance Preview"
          class="w-full h-48 object-cover"
        />
        <div class="p-4 space-y-2">
          <h2 class="text-xl font-bold truncate">{{ resonance.title }}</h2>
          <p class="text-sm text-base-content/70 truncate">
            {{ resonance.description || 'No description provided.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useResonanceStore } from '@/stores/resonanceStore'
import type { Art, Resonance as PrismaResonance } from '@prisma/client'

interface Resonance extends PrismaResonance {
  Art?: Art[]
}

// Stores
const resonanceStore = useResonanceStore()

// State
const searchQuery = ref('')
const sortMode = ref<'newest' | 'az' | 'random'>('newest')

// Fetch on mount
onMounted(async () => {
  resonanceStore.loading = true
  try {
    await resonanceStore.fetchResonances?.()
  } finally {
    resonanceStore.loading = false
  }
})

// Filtered and Sorted Resonances
const filteredResonances = computed(() => {
  let resonances = resonanceStore.resonances || []

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    resonances = resonances.filter((r: Resonance) =>
      r.title.toLowerCase().includes(query),
    )
  }

  switch (sortMode.value) {
    case 'az':
      resonances.sort((a: Resonance, b: Resonance) =>
        a.title.localeCompare(b.title),
      )
      break
    case 'random':
      resonances = resonances.sort(() => Math.random() - 0.5)
      break
    case 'newest':
    default:
      resonances.sort(
        (a: Resonance, b: Resonance) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }

  return resonances
})

// Helpers
function getFirstArtImage(resonance: Resonance): string | undefined {
  const art = resonance.Art?.[0]
  return art?.path ? `/images/${art.path}` : undefined
}
</script>
