<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <div class="flex h-full w-full min-w-0 items-center gap-2 overflow-x-auto">
      <span class="badge badge-primary shrink-0">User</span>
      <button class="btn btn-sm shrink-0">Dashboard</button>
      <button class="btn btn-sm shrink-0">Subscription</button>
      <button v-if="!isCompact" class="btn btn-sm shrink-0">Servers</button>
      <button v-if="isPriority" class="btn btn-sm btn-primary shrink-0">
        Account Settings
      </button>
      <span v-if="!isCompact" class="truncate text-sm text-base-content/60">
        Quick access to profile, plan, credits, and server tools.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/user-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')
</script>
