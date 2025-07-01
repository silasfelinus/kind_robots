<!-- /components/content/hybrids/hybrid-gallery.vue -->
<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-2">
      <input
        v-model="search"
        type="text"
        class="input input-bordered w-full"
        placeholder="🔍 Search hybrid names or animals..."
      />
      <button class="btn btn-sm" @click="clearFilters" v-if="search">
        ❌ Clear
      </button>
    </div>

    <!-- Hybrid Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="entry in filteredHybrids"
        :key="entry.id"
        class="bg-base-100 rounded-xl shadow hover:shadow-lg transition overflow-hidden"
      >
        <div class="relative">
          <img
            v-if="entry.artImage?.url"
            :src="entry.artImage.url"
            :alt="entry.name"
            class="w-full h-32 object-cover"
          />
          <div
            v-else
            class="w-full h-32 bg-base-200 flex items-center justify-center text-sm text-base-content/60"
          >
            No image
          </div>
        </div>
        <div class="p-3 space-y-1">
          <div class="text-base font-bold text-primary line-clamp-1">
            {{ entry.name }}
          </div>
          <div class="text-xs text-base-content/60">
            {{ entry.animalOne }} + {{ entry.animalTwo }}
          </div>
          <div class="text-[10px] text-base-content/40 italic">
            {{ entry.prompt.slice(0, 60) }}...
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredHybrids.length === 0"
      class="text-center text-sm text-base-content/60"
    >
      No matching hybrids found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHybridStore } from '@/stores/hybridStore'

const store = useHybridStore()
const search = ref('')

const filteredHybrids = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return store.allHybrids
  return store.allHybrids.filter((entry) => {
    return (
      entry.name?.toLowerCase().includes(term) ||
      entry.animalOne?.toLowerCase().includes(term) ||
      entry.animalTwo?.toLowerCase().includes(term)
    )
  })
})

function clearFilters() {
  search.value = ''
}

watch(
  () => store.allHybrids,
  () => {
    // could refetch or re-sync if needed
  },
)
</script>
