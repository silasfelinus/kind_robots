<!-- /components/content/story/right-toggle.vue -->
<template>
  <button
    type="button"
    @click="toggleRightSidebar"
    class="btn btn-square btn-sm flex items-center justify-center transition-transform hover:scale-110"
    :aria-pressed="sidebarRightOpen"
    :title="sidebarRightOpen ? 'Hide Tutorial' : 'Show Tutorial'"
  >
    <Icon
      :name="
        sidebarRightOpen
          ? 'kind-icon:panel-right-close'
          : 'kind-icon:panel-right'
      "
      class="w-5 h-5"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

function toggleRightSidebar() {
  const current = displayStore.sidebarRightState
  displayStore.sidebarRightState = current === 'open' ? 'hidden' : 'open'
}
</script>
