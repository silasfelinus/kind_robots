<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <div class="flex h-full w-full min-w-0 items-center gap-2 overflow-x-auto">
      <span class="badge badge-secondary shrink-0">Gallery</span>
      <button class="btn btn-sm shrink-0">Collections</button>
      <button class="btn btn-sm shrink-0">All Art</button>
      <button v-if="!isCompact" class="btn btn-sm shrink-0">Checkpoints</button>
      <button v-if="isPriority" class="btn btn-sm btn-secondary shrink-0">
        Filters
      </button>
      <span v-if="!isCompact" class="truncate text-sm text-base-content/60">
        Browse, filter, and jump between visual libraries.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/gallery-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')
</script>
