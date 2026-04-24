<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <div class="flex h-full w-full min-w-0 items-center gap-2 overflow-x-auto">
      <span class="badge badge-warning shrink-0">Games</span>
      <button class="btn btn-sm shrink-0">Memory</button>
      <button class="btn btn-sm shrink-0">Button</button>
      <button v-if="!isCompact" class="btn btn-sm shrink-0">Milestones</button>
      <button v-if="isPriority" class="btn btn-sm btn-warning shrink-0">
        Leaderboard
      </button>
      <span v-if="!isCompact" class="truncate text-sm text-base-content/60">
        Play, unlock, and chase suspiciously shiny rewards.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/game-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')
</script>
