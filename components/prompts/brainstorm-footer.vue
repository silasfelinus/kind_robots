<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <div class="flex h-full w-full min-w-0 items-center gap-2 overflow-x-auto">
      <span class="badge badge-info shrink-0">Brainstorm</span>
      <input
        class="input input-sm input-bordered min-w-52 flex-1"
        placeholder="Capture a pitch..."
      />
      <button class="btn btn-sm btn-info shrink-0">Save</button>
      <button v-if="!isCompact" class="btn btn-sm shrink-0">Prompts</button>
      <button v-if="isPriority" class="btn btn-sm shrink-0">Randomize</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/brainstorm-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')
</script>
